<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\SportRank;
use App\Models\Student;
use App\Models\TrainingClass;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function index(Request $request): JsonResponse
    {
        $query = Student::query()
            ->with(['currentRank', 'primaryClass.trainingPlace'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderBy('name');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('primary_class_id', $request->integer('class_id'));
        }

        if ($request->filled('search')) {
            $search = Str::lower($request->string('search')->toString());
            $like = "%{$search}%";

            $query->where(function ($inner) use ($like) {
                $inner->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(member_number) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(guardian_name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(guardian_phone) LIKE ?', [$like])
                    ->orWhereHas('primaryClass', fn ($classQuery) => $classQuery->whereRaw('LOWER(name) LIKE ?', [$like]));
            });
        }

        $perPage = min(max($request->integer('per_page', 25), 1), 100);

        return response()->json(['data' => $query->paginate($perPage)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageMasterData($request);

        $akademi = $request->user()->akademi;
        $data = $request->validate($this->rules($akademi->id, $akademi->sport_type, $akademi->rank_system));
        $status = $data['status'] ?? 'active';

        if ($status === 'active') {
            $this->subscriptions->assertCanAddActiveStudent($akademi);
        }

        $data['member_number'] = $data['member_number'] ?? $this->nextMemberNumber($akademi->slug);

        $student = Student::create([
            ...collect($data)->except(['rank_notes'])->all(),
            'akademi_id' => $akademi->id,
            'status' => $status,
        ]);

        if ($student->current_rank_id) {
            $student->rankHistories()->create([
                'akademi_id' => $akademi->id,
                'sport_rank_id' => $student->current_rank_id,
                'achieved_on' => now()->toDateString(),
                'source_type' => 'manual',
                'changed_by' => $request->user()->id,
                'notes' => $data['rank_notes'] ?? 'Pendaftaran siswa',
            ]);
        }

        $student->load(['currentRank', 'primaryClass.trainingPlace']);

        return response()->json(['student' => $student], 201);
    }

    public function show(Request $request, Student $student): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $student);

        $attendances = $student->attendances()
            ->with(['session.class', 'session.trainingPlace', 'session.coach'])
            ->whereHas('session', fn ($query) => $query->where('akademi_id', $request->user()->akademi_id))
            ->latest('id')
            ->limit(12)
            ->get();

        $canViewSpp = in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true);
        $sppBills = $canViewSpp
            ? $student->sppBills()
                ->with(['class', 'payments'])
                ->where('akademi_id', $request->user()->akademi_id)
                ->orderByDesc('billing_year')
                ->orderByDesc('billing_month')
                ->limit(12)
                ->get()
            : collect();

        $evaluationScores = $student->evaluationScores()
            ->with(['period', 'aspect', 'assessor'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->latest('id')
            ->limit(20)
            ->get();

        $rankPromotions = $student->rankPromotionParticipants()
            ->with(['event', 'fromRank', 'toRank', 'assessor'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->latest('id')
            ->limit(12)
            ->get();

        $rankHistories = $student->rankHistories()
            ->with(['sportRank', 'changedBy', 'promotionParticipant.event'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderByDesc('achieved_on')
            ->orderByDesc('id')
            ->limit(12)
            ->get();

        return response()->json([
            'student' => $student->load(['currentRank', 'primaryClass.trainingPlace']),
            'summary' => [
                'attendance_total' => $student->attendances()
                    ->whereHas('session', fn ($query) => $query->where('akademi_id', $request->user()->akademi_id))
                    ->count(),
                'attendance_present' => $student->attendances()
                    ->where('status', 'present')
                    ->whereHas('session', fn ($query) => $query->where('akademi_id', $request->user()->akademi_id))
                    ->count(),
                'spp_unpaid_count' => $canViewSpp
                    ? $student->sppBills()
                        ->where('akademi_id', $request->user()->akademi_id)
                        ->whereIn('status', ['unpaid', 'partial'])
                        ->count()
                    : 0,
                'evaluation_average' => round((float) $student->evaluationScores()
                    ->where('akademi_id', $request->user()->akademi_id)
                    ->avg('score')),
            ],
            'attendances' => $attendances,
            'spp_bills' => $sppBills,
            'evaluation_scores' => $evaluationScores,
            'rank_promotions' => $rankPromotions,
            'rank_histories' => $rankHistories,
        ]);
    }

    public function rankHistories(Request $request, Student $student): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $student);

        $histories = $student->rankHistories()
            ->with(['sportRank', 'changedBy', 'promotionParticipant.event'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderByDesc('achieved_on')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $histories]);
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        $this->ensureCanManageMasterData($request);
        $this->ensureBelongsToCurrentAkademi($request, $student);

        $akademi = $request->user()->akademi;
        $data = $request->validate($this->rules($akademi->id, $akademi->sport_type, $akademi->rank_system, true, $student->id));

        if (($data['status'] ?? null) === 'active' && $student->status !== 'active') {
            $this->subscriptions->assertCanAddActiveStudent($akademi, $student->id);
        }

        $oldRankId = $student->current_rank_id;
        $student->update(collect($data)->except(['rank_notes'])->all());

        if (array_key_exists('current_rank_id', $data) && $data['current_rank_id'] && (int) $data['current_rank_id'] !== (int) $oldRankId) {
            $student->rankHistories()->create([
                'akademi_id' => $akademi->id,
                'sport_rank_id' => $data['current_rank_id'],
                'achieved_on' => now()->toDateString(),
                'source_type' => 'manual',
                'changed_by' => $request->user()->id,
                'notes' => $data['rank_notes'] ?? null,
            ]);
        }

        return response()->json([
            'student' => $student->fresh()->load(['currentRank', 'primaryClass.trainingPlace']),
        ]);
    }

    public function destroy(Request $request, Student $student): JsonResponse
    {
        $this->ensureCanManageMasterData($request);
        $this->ensureBelongsToCurrentAkademi($request, $student);

        $student->delete();

        return response()->json(['message' => 'Siswa berhasil dihapus.']);
    }

    private function rules(int $akademiId, string $sportType, ?string $rankSystem, bool $partial = false, ?int $studentId = null): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'current_rank_id' => [
                'nullable',
                Rule::exists(SportRank::class, 'id')
                    ->where('sport_type', $sportType)
                    ->where('rank_system', $rankSystem)
                    ->where(fn ($q) => $q->whereNull('akademi_id')->orWhere('akademi_id', $akademiId)),
            ],
            'primary_class_id' => [
                'nullable',
                Rule::exists(TrainingClass::class, 'id')->where('akademi_id', $akademiId),
            ],
            'member_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('students', 'member_number')
                    ->where('akademi_id', $akademiId)
                    ->ignore($studentId),
            ],
            'name' => [$required, 'string', 'max:150'],
            'gender' => [$required, Rule::in(['male', 'female'])],
            'birth_date' => [$required, 'date'],
            'joined_date' => [$required, 'date'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'alumni'])],
            'height_cm' => [$required, 'integer', 'min:1', 'max:300'],
            'weight_kg' => [$required, 'numeric', 'min:1', 'max:300'],
            'student_phone' => ['nullable', 'string', 'max:30'],
            'guardian_name' => ['nullable', 'string', 'max:150'],
            'guardian_phone' => ['nullable', 'string', 'max:30'],
            'photo_url' => ['nullable', 'url', 'max:500'],
            'address' => ['nullable', 'string'],
            'shirt_size' => ['nullable', 'string', 'max:50'],
            'school_name' => ['nullable', 'string', 'max:150'],
            'school_grade' => ['nullable', 'string', 'max:50'],
            'health_notes' => ['nullable', 'string'],
            'rank_notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    private function nextMemberNumber(string $slug): string
    {
        $prefix = Str::upper(Str::substr(Str::slug($slug, ''), 0, 6)) ?: 'AKD';
        $next = Student::withTrashed()->where('member_number', 'like', "{$prefix}-%")->count() + 1;

        return sprintf('%s-%04d', $prefix, $next);
    }

    private function ensureCanManageMasterData(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah data.'
        );
    }

    private function ensureBelongsToCurrentAkademi(Request $request, Student $student): void
    {
        abort_unless(
            $student->akademi_id === $request->user()->akademi_id,
            404,
            'Siswa tidak ditemukan.'
        );
    }
}
