<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\RankPromotionParticipant;
use App\Models\SportRank;
use App\Models\Student;
use App\Models\StudentRankHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SportRankController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ranks = SportRank::query()
            ->visibleTo($request->user()->akademi)
            ->orderBy('sequence')
            ->orderByRaw("CASE WHEN level_type = 'poom' THEN 0 ELSE 1 END")
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $ranks]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageRanks($request);

        $akademi = $request->user()->akademi;
        $data = $request->validate($this->rules($akademi->sport_type, $akademi->id));

        $rank = SportRank::create([
            ...$data,
            'akademi_id' => $akademi->id,
            'sport_type' => $akademi->sport_type,
            'rank_system' => $akademi->rank_system,
        ]);

        return response()->json(['sport_rank' => $rank], 201);
    }

    public function update(Request $request, SportRank $sportRank): JsonResponse
    {
        $this->ensureCanManageRanks($request);
        $this->ensureCanModifyRank($request, $sportRank);

        $akademiId = $request->user()->akademi_id;
        $sportType = $request->user()->akademi->sport_type;
        $data = $request->validate($this->rules($sportType, $akademiId, $sportRank->id, true));

        $sportRank->fill($data)->save();

        return response()->json(['sport_rank' => $sportRank->fresh()]);
    }

    public function destroy(Request $request, SportRank $sportRank): JsonResponse
    {
        $this->ensureCanManageRanks($request);
        $this->ensureCanModifyRank($request, $sportRank);

        $isUsed = Student::query()->where('current_rank_id', $sportRank->id)->exists()
            || RankPromotionParticipant::query()
                ->where('from_rank_id', $sportRank->id)
                ->orWhere('to_rank_id', $sportRank->id)
                ->exists()
            || StudentRankHistory::query()->where('sport_rank_id', $sportRank->id)->exists();

        abort_if($isUsed, 422, 'Tingkatan sudah dipakai dan tidak bisa dihapus.');

        $sportRank->delete();

        return response()->json(['message' => 'Tingkatan berhasil dihapus.']);
    }

    private function rules(string $sportType, int $akademiId, ?int $rankId = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'code' => [
                $required,
                'string',
                'max:50',
                Rule::unique('sport_ranks', 'code')
                    ->where('sport_type', $sportType)
                    ->where('akademi_id', $akademiId)
                    ->ignore($rankId),
            ],
            'label' => [$required, 'string', 'max:100'],
            'sequence' => [$required, 'integer', 'min:1', 'max:999'],
            'level_type' => ['sometimes', 'nullable', Rule::in(SportRank::LEVEL_TYPES)],
            'level_number' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:10'],
            'belt_color' => ['sometimes', 'nullable', Rule::in(SportRank::BELT_COLORS)],
            'stripe_color' => ['sometimes', 'nullable', Rule::in(SportRank::BELT_COLORS)],
        ];
    }

    private function ensureCanManageRanks(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau pengurus akademi yang bisa mengatur tingkatan.'
        );
    }

    private function ensureCanModifyRank(Request $request, SportRank $sportRank): void
    {
        abort_unless(
            $sportRank->rank_system === $request->user()->akademi->rank_system,
            404,
            'Tingkatan tidak ditemukan.'
        );

        if ($sportRank->akademi_id === null) {
            abort(403, 'Tingkatan bawaan tidak bisa diubah.');
        }

        abort_unless(
            $sportRank->akademi_id === $request->user()->akademi_id,
            404,
            'Tingkatan tidak ditemukan.'
        );
    }
}
