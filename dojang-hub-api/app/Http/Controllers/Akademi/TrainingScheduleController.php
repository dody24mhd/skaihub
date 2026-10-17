<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\TrainingClass;
use App\Models\TrainingPlace;
use App\Models\TrainingSchedule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TrainingScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $schedules = TrainingSchedule::query()
            ->with(['class', 'trainingPlace', 'coach.coachProfile', 'coaches'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderBy('day_of_week')
            ->orderBy('starts_at')
            ->get();

        return response()->json(['data' => $schedules]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageSchedules($request);

        $akademiId = $request->user()->akademi_id;
        $data = $request->validate($this->rules($akademiId));
        $coachIds = $this->normalizedCoachIds($data);

        $schedule = TrainingSchedule::create([
            ...collect($data)->except('coach_ids')->all(),
            'akademi_id' => $akademiId,
            'coach_id' => $coachIds[0] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $schedule->coaches()->sync($coachIds);

        return response()->json(['training_schedule' => $schedule->load(['class', 'trainingPlace', 'coach.coachProfile', 'coaches'])], 201);
    }

    public function show(Request $request, TrainingSchedule $trainingSchedule): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $trainingSchedule);

        return response()->json([
            'training_schedule' => $trainingSchedule->load(['class', 'trainingPlace', 'coach.coachProfile', 'coaches']),
        ]);
    }

    public function update(Request $request, TrainingSchedule $trainingSchedule): JsonResponse
    {
        $this->ensureCanManageSchedules($request);
        $this->ensureBelongsToCurrentAkademi($request, $trainingSchedule);

        $data = $request->validate($this->rules($request->user()->akademi_id, true));
        $coachIds = array_key_exists('coach_ids', $data) ? $this->normalizedCoachIds($data) : null;
        $trainingSchedule->update([
            ...collect($data)->except('coach_ids')->all(),
            ...($coachIds !== null ? ['coach_id' => $coachIds[0] ?? null] : []),
        ]);

        if ($coachIds !== null) {
            $trainingSchedule->coaches()->sync($coachIds);
        }

        return response()->json([
            'training_schedule' => $trainingSchedule->fresh()->load(['class', 'trainingPlace', 'coach.coachProfile', 'coaches']),
        ]);
    }

    public function destroy(Request $request, TrainingSchedule $trainingSchedule): JsonResponse
    {
        $this->ensureCanManageSchedules($request);
        $this->ensureBelongsToCurrentAkademi($request, $trainingSchedule);

        $trainingSchedule->delete();

        return response()->json(['message' => 'Jadwal latihan berhasil dihapus.']);
    }

    private function rules(int $akademiId, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'class_id' => [
                $required,
                Rule::exists(TrainingClass::class, 'id')->where('akademi_id', $akademiId),
            ],
            'training_place_id' => [
                'nullable',
                Rule::exists(TrainingPlace::class, 'id')->where('akademi_id', $akademiId),
            ],
            'coach_id' => [
                'nullable',
                Rule::exists(User::class, 'id')
                    ->where('akademi_id', $akademiId)
                    ->where('role', 'pelatih'),
            ],
            'coach_ids' => ['sometimes', 'array'],
            'coach_ids.*' => [
                'integer',
                Rule::exists(User::class, 'id')
                    ->where('akademi_id', $akademiId)
                    ->where('role', 'pelatih'),
            ],
            'day_of_week' => [$required, 'integer', 'between:1,7'],
            'starts_at' => [$required, 'date_format:H:i'],
            'ends_at' => [$required, 'date_format:H:i', 'after:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
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

    private function ensureCanManageSchedules(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah jadwal.'
        );
    }

    private function ensureBelongsToCurrentAkademi(Request $request, TrainingSchedule $trainingSchedule): void
    {
        abort_unless(
            $trainingSchedule->akademi_id === $request->user()->akademi_id,
            404,
            'Jadwal latihan tidak ditemukan.'
        );
    }
}
