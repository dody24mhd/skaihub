<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\TrainingClass;
use App\Models\TrainingPlace;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TrainingSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TrainingSession::query()
            ->with(['schedule.coaches', 'class.trainingPlace', 'trainingPlace', 'coach.coachProfile', 'coaches'])
            ->withCount([
                'attendances',
                'attendances as present_count' => fn ($query) => $query->where('status', 'present'),
            ])
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderByDesc('session_date')
            ->orderByDesc('starts_at');

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('class_id', $request->integer('class_id'));
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('year')) {
            $query->whereYear('session_date', $request->integer('year'));
        }

        if ($request->filled('month') && $request->month !== 'all') {
            $query->whereMonth('session_date', $request->integer('month'));
        }

        $perPage = min(max($request->integer('per_page', 25), 1), 100);

        return response()->json(['data' => $query->paginate($perPage)]);
    }

    public function store(Request $request): JsonResponse
    {
        $akademiId = $request->user()->akademi_id;
        $data = $request->validate($this->rules($akademiId));
        $this->ensureCanCreateSession($request, $data);
        $schedule = null;

        if (! empty($data['training_schedule_id'])) {
            $schedule = TrainingSchedule::with('coaches')->where('akademi_id', $akademiId)->findOrFail($data['training_schedule_id']);
            $scheduleCoachIds = $schedule->coaches->pluck('id')->all();
            $data = [
                ...$data,
                'class_id' => $data['class_id'] ?? $schedule->class_id,
                'training_place_id' => $data['training_place_id'] ?? $schedule->training_place_id,
                'coach_id' => $data['coach_id'] ?? ($scheduleCoachIds[0] ?? $schedule->coach_id),
                'coach_ids' => $data['coach_ids'] ?? ($scheduleCoachIds ?: ($schedule->coach_id ? [$schedule->coach_id] : [])),
                'starts_at' => $data['starts_at'] ?? $schedule->starts_at,
                'ends_at' => $data['ends_at'] ?? $schedule->ends_at,
                'session_type' => $data['session_type'] ?? 'regular',
                'source_schedule_date' => $data['source_schedule_date'] ?? $data['session_date'],
            ];
        }

        if ($request->user()->role === 'pelatih' && empty($data['coach_ids']) && empty($data['coach_id'])) {
            $data['coach_ids'] = [$request->user()->id];
        }

        $session = DB::transaction(function () use ($akademiId, $data) {
            $coachIds = $this->normalizedCoachIds($data);
            $session = TrainingSession::create([
                ...collect($data)->except('coach_ids')->all(),
                'akademi_id' => $akademiId,
                'coach_id' => $coachIds[0] ?? ($data['coach_id'] ?? null),
                'session_type' => $data['session_type'] ?? (! empty($data['training_schedule_id']) ? 'regular' : 'extra'),
                'status' => $data['status'] ?? 'draft',
                'photo_urls' => $data['photo_urls'] ?? [],
            ]);

            $session->coaches()->sync($coachIds);

            Student::query()
                ->where('akademi_id', $akademiId)
                ->where('primary_class_id', $session->class_id)
                ->where('status', 'active')
                ->orderBy('name')
                ->get()
                ->each(fn (Student $student) => $session->attendances()->create([
                    'student_id' => $student->id,
                    'status' => 'present',
                ]));

            return $session->load($this->relations());
        });

        return response()->json(['training_session' => $session], 201);
    }

    public function show(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $trainingSession);

        return response()->json([
            'training_session' => $trainingSession->load($this->relations()),
        ]);
    }

    public function update(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        $this->ensureCanManageSessions($request, $trainingSession);
        $this->ensureBelongsToCurrentAkademi($request, $trainingSession);

        if ($request->user()->role === 'pelatih') {
            abort_if($request->has('class_id') && (int) $request->class_id !== (int) $trainingSession->class_id, 403, 'Akses ditolak. Pelatih tidak bisa mengubah kelas sesi latihan.');
            abort_if($request->has('training_schedule_id') && (int) $request->training_schedule_id !== (int) $trainingSession->training_schedule_id, 403, 'Akses ditolak. Pelatih tidak bisa mengubah jadwal sesi latihan.');
        }

        $data = $request->validate($this->rules($request->user()->akademi_id, true));
        $coachIds = array_key_exists('coach_ids', $data) ? $this->normalizedCoachIds($data) : null;
        $trainingSession->update([
            ...collect($data)->except('coach_ids')->all(),
            ...($coachIds !== null ? ['coach_id' => $coachIds[0] ?? null] : []),
        ]);

        if ($coachIds !== null) {
            $trainingSession->coaches()->sync($coachIds);
        }

        return response()->json([
            'training_session' => $trainingSession->fresh()->load($this->relations()),
        ]);
    }

    public function updateAttendance(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        $this->ensureCanManageSessions($request, $trainingSession);
        $this->ensureBelongsToCurrentAkademi($request, $trainingSession);

        $data = $request->validate([
            'material' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'photo_urls' => ['sometimes', 'array'],
            'photo_urls.*' => ['url', 'max:500'],
            'coach_ids' => ['sometimes', 'array'],
            'coach_ids.*' => ['integer', Rule::exists(User::class, 'id')->where('akademi_id', $request->user()->akademi_id)->where('role', 'pelatih')],
            'status' => ['sometimes', Rule::in(['draft', 'completed', 'cancelled'])],
            'attendances' => ['sometimes', 'array'],
            'attendances.*.id' => ['required_with:attendances', 'integer', Rule::exists('training_attendances', 'id')],
            'attendances.*.status' => ['required_with:attendances', Rule::in(['present', 'absent', 'excused', 'sick'])],
            'attendances.*.notes' => ['nullable', 'string'],
            'extra_participants' => ['sometimes', 'array'],
            'extra_participants.*.participant_name' => ['required_with:extra_participants', 'string', 'max:150'],
            'extra_participants.*.status' => ['required_with:extra_participants', Rule::in(['present', 'absent', 'excused', 'sick'])],
            'extra_participants.*.notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data, $trainingSession) {
            if (request()->user()->role === 'pelatih') {
                $trainingSession->coaches()->syncWithoutDetaching([request()->user()->id]);
                if (! $trainingSession->coach_id) {
                    $trainingSession->update(['coach_id' => request()->user()->id]);
                }
            } elseif (array_key_exists('coach_ids', $data)) {
                $coachIds = $this->normalizedCoachIds($data);
                $trainingSession->coaches()->sync($coachIds);
                $trainingSession->update(['coach_id' => $coachIds[0] ?? null]);
            }

            $trainingSession->update([
                'material' => $data['material'] ?? $trainingSession->material,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $trainingSession->notes,
                'photo_urls' => $data['photo_urls'] ?? $trainingSession->photo_urls,
                'status' => $data['status'] ?? $trainingSession->status,
            ]);

            foreach ($data['attendances'] ?? [] as $attendanceData) {
                $attendance = $trainingSession->attendances()->findOrFail($attendanceData['id']);
                $attendance->update([
                    'status' => $attendanceData['status'],
                    'notes' => $attendanceData['notes'] ?? null,
                ]);
            }

            foreach ($data['extra_participants'] ?? [] as $participant) {
                $trainingSession->attendances()->create([
                    'participant_name' => $participant['participant_name'],
                    'is_extra_participant' => true,
                    'status' => $participant['status'],
                    'notes' => $participant['notes'] ?? null,
                ]);
            }
        });

        return response()->json([
            'training_session' => $trainingSession->fresh()->load($this->relations()),
        ]);
    }

    public function destroy(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $trainingSession);

        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Pelatih tidak bisa menghapus sesi latihan.'
        );

        $trainingSession->delete();

        return response()->json(['message' => 'Sesi latihan berhasil dihapus.']);
    }

    private function rules(int $akademiId, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';
        $requiredWithoutSchedule = $partial ? 'sometimes' : 'required_without:training_schedule_id';

        return [
            'training_schedule_id' => ['nullable', Rule::exists(TrainingSchedule::class, 'id')->where('akademi_id', $akademiId)],
            'class_id' => [$requiredWithoutSchedule, Rule::exists(TrainingClass::class, 'id')->where('akademi_id', $akademiId)],
            'training_place_id' => ['nullable', Rule::exists(TrainingPlace::class, 'id')->where('akademi_id', $akademiId)],
            'coach_id' => ['nullable', Rule::exists(User::class, 'id')->where('akademi_id', $akademiId)->where('role', 'pelatih')],
            'coach_ids' => ['sometimes', 'array'],
            'coach_ids.*' => ['integer', Rule::exists(User::class, 'id')->where('akademi_id', $akademiId)->where('role', 'pelatih')],
            'session_date' => [$required, 'date'],
            'source_schedule_date' => ['nullable', 'date'],
            'starts_at' => [$requiredWithoutSchedule, 'date_format:H:i'],
            'ends_at' => [$requiredWithoutSchedule, 'date_format:H:i', 'after:starts_at'],
            'material' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'photo_urls' => ['sometimes', 'array'],
            'photo_urls.*' => ['url', 'max:500'],
            'session_type' => ['sometimes', Rule::in(['regular', 'replacement', 'extra'])],
            'status' => ['sometimes', Rule::in(['draft', 'completed', 'cancelled'])],
        ];
    }

    private function ensureCanManageSessions(Request $request, ?TrainingSession $session = null): void
    {
        $role = $request->user()->role;
        $isAssignedCoach = $session
            && $role === 'pelatih'
            && (
                (int) $session->coach_id === (int) $request->user()->id
                || $session->coaches()->where('users.id', $request->user()->id)->exists()
            );

        abort_unless(
            in_array($role, ['ketua_akademi', 'admin_akademi'], true) || $isAssignedCoach,
            403,
            'Akses ditolak. Hanya admin akademi atau pelatih sesi yang bisa mengubah sesi latihan.'
        );
    }

    private function ensureCanCreateSession(Request $request, array $data): void
    {
        $role = $request->user()->role;
        $isAdminRole = in_array($role, ['ketua_akademi', 'admin_akademi'], true);
        $isTodayCoach = $role === 'pelatih'
            && isset($data['session_date'])
            && now()->toDateString() === $data['session_date'];

        abort_unless(
            $isAdminRole || $isTodayCoach,
            403,
            'Akses ditolak. Hanya admin akademi atau pelatih hari ini yang bisa membuat sesi latihan.'
        );
    }

    private function ensureBelongsToCurrentAkademi(Request $request, TrainingSession $trainingSession): void
    {
        abort_unless(
            $trainingSession->akademi_id === $request->user()->akademi_id,
            404,
            'Sesi latihan tidak ditemukan.'
        );
    }

    private function relations(): array
    {
        return [
            'schedule',
            'schedule.coaches',
            'class.trainingPlace',
            'trainingPlace',
            'coach.coachProfile',
            'coaches',
            'attendances.student.currentRank',
        ];
    }

    private function normalizedCoachIds(array $data): array
    {
        return collect($data['coach_ids'] ?? (($data['coach_id'] ?? null) ? [$data['coach_id']] : []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }
}
