<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\RankPromotionParticipant;
use App\Models\SportRank;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SportRankController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ranks = SportRank::query()
            ->where('sport_type', $request->user()->akademi->sport_type)
            ->orderBy('sequence')
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $ranks]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageRanks($request);

        $sportType = $request->user()->akademi->sport_type;
        $data = $request->validate($this->rules($sportType));

        $rank = SportRank::create([
            'sport_type' => $sportType,
            'code' => $data['code'],
            'label' => $data['label'],
            'sequence' => $data['sequence'],
        ]);

        return response()->json(['sport_rank' => $rank], 201);
    }

    public function update(Request $request, SportRank $sportRank): JsonResponse
    {
        $this->ensureCanManageRanks($request);
        $this->ensureRankBelongsToCurrentSport($request, $sportRank);

        $sportType = $request->user()->akademi->sport_type;
        $data = $request->validate($this->rules($sportType, $sportRank->id, true));

        $sportRank->fill($data)->save();

        return response()->json(['sport_rank' => $sportRank->fresh()]);
    }

    public function destroy(Request $request, SportRank $sportRank): JsonResponse
    {
        $this->ensureCanManageRanks($request);
        $this->ensureRankBelongsToCurrentSport($request, $sportRank);

        $isUsed = Student::query()->where('current_rank_id', $sportRank->id)->exists()
            || RankPromotionParticipant::query()
                ->where('from_rank_id', $sportRank->id)
                ->orWhere('to_rank_id', $sportRank->id)
                ->exists();

        abort_if($isUsed, 422, 'Tingkatan sudah dipakai dan tidak bisa dihapus.');

        $sportRank->delete();

        return response()->json(['message' => 'Tingkatan berhasil dihapus.']);
    }

    private function rules(string $sportType, ?int $rankId = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'code' => [
                $required,
                'string',
                'max:50',
                Rule::unique('sport_ranks', 'code')
                    ->where('sport_type', $sportType)
                    ->ignore($rankId),
            ],
            'label' => [$required, 'string', 'max:100'],
            'sequence' => [$required, 'integer', 'min:1', 'max:999'],
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

    private function ensureRankBelongsToCurrentSport(Request $request, SportRank $sportRank): void
    {
        abort_unless(
            $sportRank->sport_type === $request->user()->akademi->sport_type,
            404,
            'Tingkatan tidak ditemukan.'
        );
    }
}
