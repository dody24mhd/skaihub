<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\TrainingSessionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class TodaySessionController extends Controller
{
    public function __construct(private readonly TrainingSessionService $sessions) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);
        $user = $request->user();
        $date = isset($data['date'])
            ? CarbonImmutable::createFromFormat('Y-m-d', $data['date'])->startOfDay()
            : CarbonImmutable::today();

        $sessions = $this->sessionsOn($user->akademi_id, $date);
        $schedules = TrainingSchedule::query()
            ->with(['class', 'trainingPlace', 'coaches'])
            ->where('akademi_id', $user->akademi_id)
            ->where('is_active', true)
            ->where('day_of_week', $date->dayOfWeekIso)
            ->get();

        $slots = collect();
        foreach ($schedules as $schedule) {
            $session = $sessions->first(fn (TrainingSession $item) => $item->training_schedule_id === $schedule->id
                && $item->source_schedule_date?->toDateString() === $date->toDateString());
            if ($session) {
                $sessions = $sessions->reject(fn (TrainingSession $item) => $item->id === $session->id);
            }
            $slots->push($this->slot($date, $schedule, $session));
        }
        foreach ($sessions as $session) {
            $slots->push($this->slot($date, null, $session));
        }

        $visible = $this->sessions->isAdminRole($user)
            ? $slots
            : $slots->filter(fn (array $slot) => in_array($user->id, $slot['visible_to'], true));

        return response()->json([
            'date' => $date->toDateString(),
            'coach_backfill_days' => $this->sessions->coachBackfillDays(),
            'data' => $visible
                ->sortBy(fn (array $slot) => $slot['starts_at'].'-'.($slot['session_id'] ?? 0))
                ->map(fn (array $slot) => collect($slot)->except('visible_to')->all())
                ->values(),
        ]);
    }

    /**
     * @return Collection<int, TrainingSession>
     */
    private function sessionsOn(int $akademiId, CarbonImmutable $date): Collection
    {
        return TrainingSession::query()
            ->with(['class', 'trainingPlace', 'coaches', 'rescheduledTo', 'rescheduledFrom'])
            ->withCount([
                'attendances',
                'attendances as present_count' => fn ($query) => $query->where('status', 'present'),
            ])
            ->where('akademi_id', $akademiId)
            ->whereDate('session_date', $date->toDateString())
            ->get();
    }

    /**
     * @return array<string, mixed>
     */
    private function slot(CarbonImmutable $date, ?TrainingSchedule $schedule, ?TrainingSession $session): array
    {
        $source = $session ?? $schedule;
        $coaches = $session ? $session->coaches : $schedule->coaches;
        $coachIds = $this->coachIds($coaches, $session?->coach_id ?? $schedule?->coach_id);
        $scheduleCoachIds = $schedule ? $this->coachIds($schedule->coaches, $schedule->coach_id) : [];

        return [
            'key' => $session ? "session-{$session->id}" : "schedule-{$schedule->id}-{$date->toDateString()}",
            'date' => $date->toDateString(),
            'training_schedule_id' => $schedule?->id,
            'session_id' => $session?->id,
            'class_id' => $source->class_id,
            'class_name' => $source->class?->name,
            'place_name' => $source->trainingPlace?->name ?? $schedule?->trainingPlace?->name,
            'starts_at' => substr((string) $source->starts_at, 0, 5),
            'ends_at' => substr((string) $source->ends_at, 0, 5),
            'coach_ids' => $coachIds,
            'coach_names' => $coaches->pluck('name')->values()->all(),
            'status' => $session?->status ?? 'not_opened',
            'session_type' => $session?->session_type ?? 'regular',
            'attendances_count' => $session?->attendances_count ?? 0,
            'present_count' => $session?->present_count ?? 0,
            'reschedule_reason' => $session?->reschedule_reason,
            'cancel_reason' => $session?->cancel_reason,
            'rescheduled_to' => $this->linkedSession($session?->rescheduledTo),
            'rescheduled_from' => $this->linkedSession($session?->rescheduledFrom),
            'visible_to' => array_values(array_unique([...$coachIds, ...$scheduleCoachIds])),
        ];
    }

    /**
     * @param  Collection<int, User>  $coaches
     * @return array<int, int>
     */
    private function coachIds(Collection $coaches, ?int $primaryCoachId): array
    {
        return $coaches->pluck('id')
            ->push($primaryCoachId)
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function linkedSession(?TrainingSession $session): ?array
    {
        if (! $session) {
            return null;
        }

        return [
            'id' => $session->id,
            'session_date' => $session->session_date->toDateString(),
            'starts_at' => substr((string) $session->starts_at, 0, 5),
        ];
    }
}
