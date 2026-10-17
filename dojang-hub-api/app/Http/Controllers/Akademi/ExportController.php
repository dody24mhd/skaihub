<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\EvaluationPeriod;
use App\Models\SppBill;
use App\Models\Student;
use App\Models\StudentEvaluationScore;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function students(Request $request): StreamedResponse
    {
        $this->ensureCanExportAdminData($request);

        $students = Student::query()
            ->with(['currentRank', 'primaryClass'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->when($request->filled('status') && $request->status !== 'all', fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('class_id') && $request->class_id !== 'all', fn ($query) => $query->where('primary_class_id', $request->integer('class_id')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = Str::lower($request->string('search')->toString());
                $like = "%{$search}%";

                $query->where(function ($inner) use ($like) {
                    $inner->whereRaw('LOWER(name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(member_number) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(guardian_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(guardian_phone) LIKE ?', [$like]);
                });
            })
            ->orderBy('name')
            ->get();

        return $this->csv("students-{$request->user()->akademi->slug}.csv", [
            'No Anggota',
            'Nama',
            'Gender',
            'Status',
            'Kelas',
            'Tingkatan',
            'Tanggal Lahir',
            'Tanggal Bergabung',
            'Tinggi',
            'Berat',
            'No Siswa',
            'Nama Wali',
            'No Wali',
            'Sekolah',
            'Kelas Sekolah',
        ], $students->map(fn (Student $student) => [
            $student->member_number,
            $student->name,
            $student->gender,
            $student->status,
            $student->primaryClass?->name,
            $student->currentRank?->label,
            optional($student->birth_date)->toDateString(),
            optional($student->joined_date)->toDateString(),
            $student->height_cm,
            $student->weight_kg,
            $student->student_phone,
            $student->guardian_name,
            $student->guardian_phone,
            $student->school_name,
            $student->school_grade,
        ])->all());
    }

    public function spp(Request $request): StreamedResponse
    {
        $this->ensureCanExportFinanceData($request);

        $bills = SppBill::query()
            ->with(['student.primaryClass', 'class'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->when($request->filled('year'), fn ($query) => $query->where('billing_year', $request->integer('year')))
            ->when($request->filled('month') && $request->month !== 'all', fn ($query) => $query->where('billing_month', $request->integer('month')))
            ->when($request->filled('status') && $request->status !== 'all', fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('class_id') && $request->class_id !== 'all', fn ($query) => $query->where('class_id', $request->integer('class_id')))
            ->orderByDesc('billing_year')
            ->orderByDesc('billing_month')
            ->orderBy('status')
            ->orderBy('id')
            ->get();

        return $this->csv("spp-{$request->user()->akademi->slug}.csv", [
            'Periode',
            'No Anggota',
            'Nama Siswa',
            'Kelas',
            'Tagihan',
            'Terbayar',
            'Sisa',
            'Status',
            'Jatuh Tempo',
            'Catatan',
        ], $bills->map(fn (SppBill $bill) => [
            sprintf('%04d-%02d', $bill->billing_year, $bill->billing_month),
            $bill->student?->member_number,
            $bill->student?->name,
            $bill->class?->name ?? $bill->student?->primaryClass?->name,
            $bill->amount,
            $bill->paid_amount,
            max(((float) $bill->amount) - ((float) $bill->paid_amount), 0),
            $bill->status,
            optional($bill->due_date)->toDateString(),
            $bill->notes,
        ])->all());
    }

    public function evaluation(Request $request, EvaluationPeriod $period): StreamedResponse
    {
        $this->ensurePeriodBelongsToCurrentAkademi($request, $period);

        $scores = StudentEvaluationScore::query()
            ->with(['student.primaryClass', 'aspect', 'assessor'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->where('evaluation_period_id', $period->id)
            ->when($request->filled('class_id') && $request->class_id !== 'all', fn ($query) => $query->where('class_id', $request->integer('class_id')))
            ->orderBy('student_id')
            ->orderBy('evaluation_aspect_id')
            ->get();

        return $this->csv("evaluasi-{$period->id}-{$request->user()->akademi->slug}.csv", [
            'Periode',
            'No Anggota',
            'Nama Siswa',
            'Kelas',
            'Aspek',
            'Kategori',
            'Nilai',
            'Indikator',
            'Penilai',
            'Catatan',
        ], $scores->map(fn (StudentEvaluationScore $score) => [
            $period->name,
            $score->student?->member_number,
            $score->student?->name,
            $score->student?->primaryClass?->name,
            $score->aspect?->name,
            $score->aspect?->category,
            $score->score,
            $score->indicator,
            $score->assessor?->name,
            $score->notes,
        ])->all());
    }

    private function csv(string $filename, array $headers, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $this->sanitizeRow($headers));

            foreach ($rows as $row) {
                fputcsv($handle, $this->sanitizeRow($row));
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function sanitizeCell(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }

    private function sanitizeRow(array $row): array
    {
        return array_map(fn ($cell) => $this->sanitizeCell($cell), $row);
    }

    private function ensureCanExportAdminData(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa export laporan.'
        );
    }

    private function ensureCanExportFinanceData(Request $request): void
    {
        abort_unless(
            $request->user()->role === 'ketua_akademi',
            403,
            'Akses ditolak. Hanya ketua akademi yang bisa export laporan keuangan.'
        );
    }

    private function ensurePeriodBelongsToCurrentAkademi(Request $request, EvaluationPeriod $period): void
    {
        abort_unless(
            $period->akademi_id === $request->user()->akademi_id,
            404,
            'Periode evaluasi tidak ditemukan.'
        );
    }
}
