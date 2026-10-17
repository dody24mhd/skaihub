<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\SppBill;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SppBillController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureCanManageSpp($request);

        $query = SppBill::query()
            ->with(['student.primaryClass', 'class', 'payments.creator'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderByDesc('billing_year')
            ->orderByDesc('billing_month')
            ->orderBy('status')
            ->orderBy('id');

        if ($request->filled('year')) {
            $query->where('billing_year', $request->integer('year'));
        }

        if ($request->filled('month') && $request->month !== 'all') {
            $query->where('billing_month', $request->integer('month'));
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('class_id', $request->integer('class_id'));
        }

        return response()->json(['data' => $query->paginate(50)]);
    }

    public function generate(Request $request): JsonResponse
    {
        $this->ensureCanManageSpp($request);

        $data = $request->validate([
            'billing_year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'billing_month' => ['required', 'integer', 'between:1,12'],
            'default_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'due_date' => ['nullable', 'date'],
            'class_id' => ['nullable', Rule::exists('classes', 'id')->where('akademi_id', $request->user()->akademi_id)],
        ]);

        $akademiId = $request->user()->akademi_id;
        $created = 0;
        $skipped = 0;
        $missingAmount = 0;

        DB::transaction(function () use ($akademiId, $data, &$created, &$skipped, &$missingAmount) {
            Student::query()
                ->with('primaryClass')
                ->where('akademi_id', $akademiId)
                ->where('status', 'active')
                ->when(! empty($data['class_id']), fn ($query) => $query->where('primary_class_id', $data['class_id']))
                ->orderBy('name')
                ->get()
                ->each(function (Student $student) use ($akademiId, $data, &$created, &$skipped, &$missingAmount) {
                    $exists = SppBill::where('akademi_id', $akademiId)
                        ->where('student_id', $student->id)
                        ->where('billing_year', $data['billing_year'])
                        ->where('billing_month', $data['billing_month'])
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        return;
                    }

                    $amount = $student->primaryClass?->spp_amount_override ?? $data['default_amount'] ?? null;

                    if ($amount === null) {
                        $missingAmount++;
                        $skipped++;

                        return;
                    }

                    SppBill::create([
                        'akademi_id' => $akademiId,
                        'student_id' => $student->id,
                        'class_id' => $student->primary_class_id,
                        'billing_year' => $data['billing_year'],
                        'billing_month' => $data['billing_month'],
                        'amount' => $amount,
                        'paid_amount' => 0,
                        'due_date' => $data['due_date'] ?? null,
                        'status' => ((float) $amount) <= 0 ? 'waived' : 'unpaid',
                    ]);

                    $created++;
                });
        });

        return response()->json([
            'message' => 'Tagihan SPP berhasil digenerate.',
            'created' => $created,
            'skipped' => $skipped,
            'missing_amount' => $missingAmount,
        ], 201);
    }

    public function pay(Request $request, SppBill $sppBill): JsonResponse
    {
        $this->ensureCanManageSpp($request);
        $this->ensureBelongsToCurrentAkademi($request, $sppBill);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999.99'],
            'paid_at' => ['required', 'date'],
            'method' => ['nullable', 'string', 'max:50'],
            'proof_url' => ['nullable', 'url', 'max:500'],
            'notes' => ['nullable', 'string'],
        ]);

        if (! empty($data['proof_url'])) {
            $allowedPrefix = Storage::disk('public')->url("akademi/{$request->user()->akademi_id}/");
            $relativePrefix = "/storage/akademi/{$request->user()->akademi_id}/";
            if (! str_starts_with($data['proof_url'], $allowedPrefix) && ! str_starts_with($data['proof_url'], $relativePrefix)) {
                throw ValidationException::withMessages([
                    'proof_url' => ['Bukti pembayaran harus berasal dari berkas unggahan akademi ini.'],
                ]);
            }
        }

        DB::transaction(function () use ($data, $request, $sppBill) {
            $bill = SppBill::where('id', $sppBill->id)->lockForUpdate()->firstOrFail();

            if (in_array($bill->status, ['paid', 'waived'], true)) {
                throw ValidationException::withMessages([
                    'status' => ['Tagihan ini sudah berstatus '.($bill->status === 'paid' ? 'lunas' : 'dikecualikan (waived)').' dan tidak bisa menerima pembayaran.'],
                ]);
            }

            $currentPaid = (float) $bill->paid_amount;
            $remaining = round((float) $bill->amount - $currentPaid, 2);

            if (round((float) $data['amount'], 2) > $remaining) {
                throw ValidationException::withMessages([
                    'amount' => ['Jumlah pembayaran melebihi sisa tagihan (sisa: '.number_format($remaining, 0, ',', '.').').'],
                ]);
            }

            $bill->payments()->create([
                ...$data,
                'akademi_id' => $request->user()->akademi_id,
                'created_by' => $request->user()->id,
            ]);

            $newPaidAmount = round($bill->payments()->sum('amount'), 2);
            $status = 'partial';

            if ($newPaidAmount <= 0) {
                $status = 'unpaid';
            } elseif ($newPaidAmount >= (float) $bill->amount) {
                $status = 'paid';
            }

            $bill->update([
                'paid_amount' => $newPaidAmount,
                'status' => $status,
            ]);
        });

        return response()->json([
            'spp_bill' => $sppBill->fresh()->load(['student.primaryClass', 'class', 'payments.creator']),
        ]);
    }

    public function waive(Request $request, SppBill $sppBill): JsonResponse
    {
        $this->ensureCanManageSpp($request);
        $this->ensureBelongsToCurrentAkademi($request, $sppBill);

        $data = $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $sppBill->update([
            'status' => 'waived',
            'notes' => $data['notes'] ?? $sppBill->notes,
        ]);

        return response()->json([
            'spp_bill' => $sppBill->fresh()->load(['student.primaryClass', 'class', 'payments.creator']),
        ]);
    }

    private function ensureCanManageSpp(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah SPP.'
        );
    }

    private function ensureBelongsToCurrentAkademi(Request $request, SppBill $sppBill): void
    {
        abort_unless(
            $sppBill->akademi_id === $request->user()->akademi_id,
            404,
            'Tagihan SPP tidak ditemukan.'
        );
    }
}
