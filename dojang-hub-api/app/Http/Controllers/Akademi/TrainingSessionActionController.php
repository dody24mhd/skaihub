<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use App\Services\TrainingSessionService;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TrainingSessionActionController extends Controller
{
    public function __construct(private readonly TrainingSessionService $sessions) {}

    public function fromSchedule(Request $request): JsonResponse
    {
        $akademiId = $request->user()->akademi_id;
        $data = $request->validate([
            'training_schedule_id' => ['required', 'integer', Rule::exists(TrainingSchedule::class, 'id')->where('akademi_id', $akademiId)->whereNull('deleted_at')],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);
        $schedule = TrainingSchedule::with('coaches')->where('akademi_id', $akademiId)->findOrFail($data['training_schedule_id']);
        $date = CarbonImmutable::createFromFormat('Y-m-d', $data['date'])->startOfDay();

        if ($date->dayOfWeekIso !== $schedule->day_of_week) {
            throw ValidationException::withMessages(['date' => 'Tanggal tidak sesuai dengan hari jadwal latihan.']);
        }

        $existing = $this->findScheduledSession($schedule, $date);
        $this->ensureCanOpenSchedule($request, $schedule, $existing);
        $this->sessions->ensureWithinCoachWindow($request->user(), $date);

        if ($existing) {
            $this->sessions->syncDraftRoster($existing);

            return response()->json(['training_session' => $existing->load($this->sessions->relations())]);
        }

        if (! $schedule->is_active) {
            throw ValidationException::withMessages(['training_schedule_id' => 'Jadwal latihan tidak aktif.']);
        }

        try {
            $session = DB::transaction(fn () => $this->createScheduledSession($schedule, $date));
        } catch (UniqueConstraintViolationException) {
            $session = $this->findScheduledSession($schedule, $date);
            abort_unless($session !== null, 409, 'Sesi latihan sedang dibuat. Silakan coba lagi.');

            return response()->json(['training_session' => $session->load($this->sessions->relations())]);
        }

        return response()->json(['training_session' => $session->load($this->sessions->relations())], 201);
    }

    public function reschedule(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $trainingSession);
        $this->ensureAdmin($request, 'memindahkan');

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'reason' => ['required', 'string', 'max:500'],
        ]);
        $this->ensureDraft($trainingSession, 'dipindah');

        $replacement = DB::transaction(function () use ($data, $trainingSession) {
            $replacement = TrainingSession::create([
                'akademi_id' => $trainingSession->akademi_id,
                'class_id' => $trainingSession->class_id,
                'training_place_id' => $trainingSession->training_place_id,
                'coach_id' => $trainingSession->coach_id,
                'session_date' => $data['date'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'session_type' => 'replacement',
                'status' => 'draft',
                'photo_urls' => [],
                'rescheduled_from_id' => $trainingSession->id,
            ]);
            $replacement->coaches()->sync($trainingSession->coaches()->pluck('users.id'));
            $this->sessions->syncRoster($replacement);

            $trainingSession->update([
                'status' => 'rescheduled',
                'reschedule_reason' => $data['reason'],
                'rescheduled_to_id' => $replacement->id,
            ]);

            return $replacement;
        });

        return response()->json([
            'training_session' => $replacement->load($this->sessions->relations()),
        ], 201);
    }

    public function cancel(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $trainingSession);
        $this->ensureAdmin($request, 'membatalkan');

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);
        $this->ensureDraft($trainingSession, 'dibatalkan');

        $trainingSession->update([
            'status' => 'cancelled',
            'cancel_reason' => $data['reason'],
        ]);

        return response()->json([
            'training_session' => $trainingSession->fresh()->load($this->sessions->relations()),
        ]);
    }

    private function findScheduledSession(TrainingSchedule $schedule, CarbonImmutable $date): ?TrainingSession
    {
        return TrainingSession::query()
            ->where('akademi_id', $schedule->akademi_id)
            ->where('training_schedule_id', $schedule->id)
            ->whereDate('source_schedule_date', $date->toDateString())
            ->first();
    }

    private function createScheduledSession(TrainingSchedule $schedule, CarbonImmutable $date): TrainingSession
    {
        $coachIds = $schedule->coaches->pluck('id')->all() ?: array_filter([$schedule->coach_id]);
        $session = TrainingSession::create([
            'akademi_id' => $schedule->akademi_id,
            'training_schedule_id' => $schedule->id,
            'class_id' => $schedule->class_id,
            'training_place_id' => $schedule->training_place_id,
            'coach_id' => $coachIds[0] ?? null,
            'session_date' => $date->toDateString(),
            'source_schedule_date' => $date->toDateString(),
            'starts_at' => substr((string) $schedule->starts_at, 0, 5),
            'ends_at' => substr((string) $schedule->ends_at, 0, 5),
            'session_type' => 'regular',
            'status' => 'draft',
            'photo_urls' => [],
        ]);
        $session->coaches()->sync($coachIds);
        $this->sessions->syncRoster($session);

        return $session;
    }

    private function ensureCanOpenSchedule(Request $request, TrainingSchedule $schedule, ?TrainingSession $existing): void
    {
        $user = $request->user();

        abort_unless(
            $this->sessions->isAdminRole($user)
                || $this->sessions->isScheduleCoach($user, $schedule)
                || ($existing && $this->sessions->isSessionCoach($user, $existing)),
            403,
            'Akses ditolak. Pelatih hanya bisa membuka sesi dari jadwal yang ia ampu.'
        );
    }

    private function ensureAdmin(Request $request, string $action): void
    {
        abort_unless(
            $this->sessions->isAdminRole($request->user()),
            403,
            "Akses ditolak. Hanya ketua atau admin akademi yang bisa {$action} sesi latihan."
        );
    }

    private function ensureDraft(TrainingSession $trainingSession, string $action): void
    {
        if ($trainingSession->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => "Hanya sesi berstatus draft yang bisa {$action}.",
            ]);
        }
    }

    private function ensureBelongsToCurrentAkademi(Request $request, TrainingSession $trainingSession): void
    {
        abort_unless(
            $trainingSession->akademi_id === $request->user()->akademi_id,
            404,
            'Sesi latihan tidak ditemukan.'
        );
    }
}
