<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\EvaluationAspect;
use App\Models\EvaluationPeriod;
use App\Models\Student;
use App\Models\StudentEvaluationScore;
use App\Models\TrainingAttendance;
use App\Models\TrainingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class StudentReportController extends Controller
{
    private const ATTENDANCE_STATUSES = ['present', 'sick', 'excused', 'absent'];

    public function show(Request $request, Student $student): JsonResponse
    {
        $akademiId = $request->user()->akademi_id;
        abort_unless($student->akademi_id === $akademiId, 404, 'Siswa tidak ditemukan.');

        $data = $request->validate([
            'period_id' => ['required', 'integer', Rule::exists(EvaluationPeriod::class, 'id')->where('akademi_id', $akademiId)],
        ]);

        $period = EvaluationPeriod::query()->where('akademi_id', $akademiId)->findOrFail($data['period_id']);
        $student->load(['akademi:id,name,logo_url,sport_type', 'currentRank', 'primaryClass.trainingPlace']);

        $scores = StudentEvaluationScore::query()
            ->with('assessor:id,name')
            ->where('akademi_id', $akademiId)
            ->where('evaluation_period_id', $period->id)
            ->where('student_id', $student->id)
            ->get();
        $average = $scores->isEmpty() ? null : round((float) $scores->avg('score'), 1);

        return response()->json([
            'report' => [
                'akademi' => $student->akademi->only(['name', 'logo_url', 'sport_type']),
                'student' => [
                    ...$student->only(['id', 'name', 'member_number', 'gender', 'photo_url']),
                    'birth_date' => $student->birth_date?->toDateString(),
                    'joined_date' => $student->joined_date?->toDateString(),
                    'class_name' => $student->primaryClass?->name,
                    'training_place' => $student->primaryClass?->trainingPlace?->name,
                    'rank' => $student->currentRank?->only(['id', 'code', 'label', 'belt_color', 'stripe_color']),
                ],
                'period' => [
                    ...$period->only(['id', 'name', 'status']),
                    'starts_at' => $period->starts_at->toDateString(),
                    'ends_at' => $period->ends_at->toDateString(),
                ],
                'attendance' => $this->attendanceSummary($student, $period),
                'scores' => $this->scoreRows($period, $scores),
                'average' => $average,
                'average_indicator' => $average === null ? null : EvaluationController::indicatorForScore((int) floor($average)),
                'assessors' => $scores->pluck('assessor.name')->filter()->unique()->values(),
                'generated_at' => now()->toDateString(),
            ],
        ]);
    }

    /**
     * @return array<string, int|float>
     */
    private function attendanceSummary(Student $student, EvaluationPeriod $period): array
    {
        $counts = TrainingAttendance::query()
            ->where('student_id', $student->id)
            ->whereHas('session', fn ($query) => $query
                ->where('akademi_id', $student->akademi_id)
                ->whereNotIn('status', TrainingSession::UNCOUNTED_STATUSES)
                ->whereBetween('session_date', [$period->starts_at->toDateString(), $period->ends_at->toDateString()]))
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $summary = collect(self::ATTENDANCE_STATUSES)->mapWithKeys(fn (string $status) => [$status => (int) ($counts[$status] ?? 0)]);
        $total = $summary->sum();

        return [
            'total' => $total,
            ...$summary->all(),
            'rate' => $total === 0 ? 0 : round($summary['present'] / $total * 100, 1),
        ];
    }

    /**
     * @param  Collection<int, StudentEvaluationScore>  $scores
     * @return Collection<int, array<string, mixed>>
     */
    private function scoreRows(EvaluationPeriod $period, Collection $scores): Collection
    {
        $scoresByAspect = $scores->keyBy('evaluation_aspect_id');

        return EvaluationAspect::query()
            ->where('akademi_id', $period->akademi_id)
            ->where('evaluation_period_id', $period->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->filter(fn (EvaluationAspect $aspect) => $aspect->is_active || $scoresByAspect->has($aspect->id))
            ->map(function (EvaluationAspect $aspect) use ($scoresByAspect) {
                $score = $scoresByAspect->get($aspect->id);

                return [
                    'aspect_id' => $aspect->id,
                    'aspect' => $aspect->name,
                    'category' => $aspect->category,
                    'score' => $score?->score,
                    'indicator' => $score ? EvaluationController::indicatorForScore($score->score) : null,
                    'notes' => $score?->notes,
                ];
            })
            ->values();
    }
}
