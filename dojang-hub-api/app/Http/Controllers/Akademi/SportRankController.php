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
        $akademiId = $request->user()->akademi_id;

        $ranks = SportRank::query()
            ->where('sport_type', $request->user()->akademi->sport_type)
            ->where(function ($query) use ($akademiId) {
                $query->whereNull('akademi_id')
                    ->orWhere('akademi_id', $akademiId);
            })
            ->orderBy('sequence')
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $ranks]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageRanks($request);

        $akademiId = $request->user()->akademi_id;
        $sportType = $request->user()->akademi->sport_type;
        $data = $request->validate($this->rules($sportType, $akademiId));

        $rank = SportRank::create([
            'akademi_id' => $akademiId,
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
            $sportRank->sport_type === $request->user()->akademi->sport_type,
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
