<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\EvaluationAspect;
use App\Models\EvaluationPeriod;
use App\Models\Student;
use App\Models\StudentEvaluationScore;
use App\Models\TrainingClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EvaluationController extends Controller
{
    public function periods(Request $request): JsonResponse
    {
        $periods = EvaluationPeriod::query()
            ->withCount(['scores', 'aspects'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderByDesc('starts_at')
            ->get();

        return response()->json(['data' => $periods]);
    }

    public function storePeriod(Request $request): JsonResponse
    {
        $this->ensureCanConfigure($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'closed'])],
            'notes' => ['nullable', 'string'],
        ]);

        $period = DB::transaction(function () use ($data, $request) {
            $akademiId = $request->user()->akademi_id;
            $status = $data['status'] ?? 'draft';

            if ($status === 'active') {
                EvaluationPeriod::query()
                    ->where('akademi_id', $akademiId)
                    ->where('status', 'active')
                    ->update(['status' => 'closed']);
            }

            return EvaluationPeriod::create([
                ...$data,
                'akademi_id' => $akademiId,
                'status' => $status,
            ]);
        });

        return response()->json(['evaluation_period' => $period], 201);
    }

    public function updatePeriod(Request $request, EvaluationPeriod $period): JsonResponse
    {
        $this->ensureCanConfigure($request);
        $this->ensurePeriodBelongsToCurrentAkademi($request, $period);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'starts_at' => ['sometimes', 'required', 'date'],
            'ends_at' => ['sometimes', 'required', 'date', 'after_or_equal:starts_at'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'closed'])],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data, $period, $request) {
            if (($data['status'] ?? null) === 'active') {
                EvaluationPeriod::query()
                    ->where('akademi_id', $request->user()->akademi_id)
                    ->where('id', '!=', $period->id)
                    ->where('status', 'active')
                    ->update(['status' => 'closed']);
            }

            $period->update($data);
        });

        return response()->json(['evaluation_period' => $period->fresh()]);
    }

    public function aspects(Request $request, ?EvaluationPeriod $period = null): JsonResponse
    {
        if ($period) {
            $this->ensurePeriodBelongsToCurrentAkademi($request, $period);
        }

        $aspects = EvaluationAspect::query()
            ->where('akademi_id', $request->user()->akademi_id)
            ->when($period, fn ($query) => $query->where('evaluation_period_id', $period->id))
            ->when(! $period && $request->filled('period_id'), fn ($query) => $query->where('evaluation_period_id', $request->integer('period_id')))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $aspects]);
    }

    public function storeAspect(Request $request, ?EvaluationPeriod $period = null): JsonResponse
    {
        $this->ensureCanConfigure($request);
        if ($period) {
            $this->ensurePeriodBelongsToCurrentAkademi($request, $period);
        }

        $akademiId = $request->user()->akademi_id;

        $data = $request->validate([
            'evaluation_period_id' => [
                $period ? 'nullable' : 'required',
                Rule::exists(EvaluationPeriod::class, 'id')->where('akademi_id', $akademiId),
            ],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $aspect = EvaluationAspect::create([
            ...$data,
            'akademi_id' => $akademiId,
            'evaluation_period_id' => $period?->id ?? $data['evaluation_period_id'],
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['evaluation_aspect' => $aspect], 201);
    }

    public function updateAspect(Request $request, EvaluationAspect $aspect): JsonResponse
    {
        $this->ensureCanConfigure($request);
        $this->ensureAspectBelongsToCurrentAkademi($request, $aspect);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $aspect->update($data);

        return response()->json(['evaluation_aspect' => $aspect->fresh()]);
    }

    public function destroyAspect(Request $request, EvaluationAspect $aspect): JsonResponse
    {
        $this->ensureCanConfigure($request);
        $this->ensureAspectBelongsToCurrentAkademi($request, $aspect);

        $aspect->delete();

        return response()->json(['message' => 'Variabel penilaian berhasil dihapus.']);
    }

    public function copyAspects(Request $request, EvaluationPeriod $period, EvaluationPeriod $source): JsonResponse
    {
        $this->ensureCanConfigure($request);
        $this->ensurePeriodBelongsToCurrentAkademi($request, $period);
        $this->ensurePeriodBelongsToCurrentAkademi($request, $source);

        abort_if($period->is($source), 422, 'Pilih periode sumber yang berbeda.');

        $copiedCount = DB::transaction(function () use ($period, $source) {
            $targetAspects = EvaluationAspect::query()->where('evaluation_period_id', $period->id)->get();
            $existingNames = $targetAspects->map(fn (EvaluationAspect $aspect) => Str::lower(trim($aspect->name)))->all();
            $baseOrder = (int) $targetAspects->max('sort_order');

            $newAspects = EvaluationAspect::query()
                ->where('akademi_id', $period->akademi_id)
                ->where('evaluation_period_id', $source->id)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->reject(fn (EvaluationAspect $aspect) => in_array(Str::lower(trim($aspect->name)), $existingNames, true));

            foreach ($newAspects as $aspect) {
                EvaluationAspect::create([
                    'akademi_id' => $period->akademi_id,
                    'evaluation_period_id' => $period->id,
                    'name' => $aspect->name,
                    'category' => $aspect->category,
                    'sort_order' => $baseOrder + $aspect->sort_order,
                    'is_active' => $aspect->is_active,
                    'description' => $aspect->description,
                ]);
            }

            return $newAspects->count();
        });

        $aspects = EvaluationAspect::query()
            ->where('akademi_id', $period->akademi_id)
            ->where('evaluation_period_id', $period->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $aspects, 'copied_count' => $copiedCount], 201);
    }

    public function scores(Request $request, EvaluationPeriod $period): JsonResponse
    {
        $this->ensurePeriodBelongsToCurrentAkademi($request, $period);

        $query = StudentEvaluationScore::query()
            ->with(['student.primaryClass', 'aspect', 'assessor'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->where('evaluation_period_id', $period->id)
            ->orderBy('student_id')
            ->orderBy('evaluation_aspect_id');

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('class_id', $request->integer('class_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        return response()->json(['data' => $query->get()]);
    }

    public function upsertScores(Request $request, EvaluationPeriod $period): JsonResponse
    {
        $this->ensureCanScore($request);
        $this->ensurePeriodBelongsToCurrentAkademi($request, $period);

        abort_if($period->status === 'closed', 422, 'Periode evaluasi sudah ditutup.');

        $akademiId = $request->user()->akademi_id;
        $data = $request->validate([
            'scores' => ['required', 'array', 'min:1'],
            'scores.*.student_id' => ['required', Rule::exists(Student::class, 'id')->where('akademi_id', $akademiId)],
            'scores.*.evaluation_aspect_id' => [
                'required',
                Rule::exists(EvaluationAspect::class, 'id')
                    ->where('akademi_id', $akademiId)
                    ->where('evaluation_period_id', $period->id),
            ],
            'scores.*.class_id' => ['nullable', Rule::exists(TrainingClass::class, 'id')->where('akademi_id', $akademiId)],
            'scores.*.score' => ['required', 'integer', 'between:1,100'],
            'scores.*.notes' => ['nullable', 'string'],
        ]);

        $saved = collect($data['scores'])->map(function (array $scoreData) use ($akademiId, $period, $request) {
            $student = Student::where('akademi_id', $akademiId)->findOrFail($scoreData['student_id']);

            return StudentEvaluationScore::updateOrCreate(
                [
                    'evaluation_period_id' => $period->id,
                    'evaluation_aspect_id' => $scoreData['evaluation_aspect_id'],
                    'student_id' => $student->id,
                ],
                [
                    'akademi_id' => $akademiId,
                    'class_id' => $scoreData['class_id'] ?? $student->primary_class_id,
                    'assessed_by' => $request->user()->id,
                    'score' => $scoreData['score'],
                    'indicator' => $this->indicatorForScore((int) $scoreData['score']),
                    'notes' => $scoreData['notes'] ?? null,
                ]
            );
        });

        return response()->json([
            'data' => StudentEvaluationScore::query()
                ->with(['student.primaryClass', 'aspect', 'assessor'])
                ->whereIn('id', $saved->pluck('id'))
                ->get()
                ->values(),
        ]);
    }

    private function indicatorForScore(int $score): string
    {
        if ($score < 60) {
            return 'kurang';
        }

        if ($score < 75) {
            return 'cukup';
        }

        if ($score < 90) {
            return 'baik';
        }

        return 'sangat_baik';
    }

    private function ensureCanConfigure(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengatur evaluasi.'
        );
    }

    private function ensureCanScore(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi', 'pelatih'], true),
            403,
            'Akses ditolak. Akun ini tidak bisa mengisi evaluasi.'
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

    private function ensureAspectBelongsToCurrentAkademi(Request $request, EvaluationAspect $aspect): void
    {
        abort_unless(
            $aspect->akademi_id === $request->user()->akademi_id,
            404,
            'Aspek evaluasi tidak ditemukan.'
        );
    }
}
