<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\RankPromotionEvent;
use App\Models\RankPromotionParticipant;
use App\Models\SportRank;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RankPromotionCertificateController extends Controller
{
    private const RANK_FIELDS = ['id', 'code', 'label', 'level_type', 'level_number', 'belt_color', 'stripe_color'];

    public function show(Request $request, RankPromotionEvent $rankPromotionEvent, RankPromotionParticipant $participant): JsonResponse
    {
        $akademiId = $request->user()->akademi_id;
        abort_unless(
            $rankPromotionEvent->akademi_id === $akademiId
                && $participant->akademi_id === $akademiId
                && $participant->rank_promotion_event_id === $rankPromotionEvent->id,
            404,
            'Peserta kenaikan tingkat tidak ditemukan.'
        );
        abort_unless($participant->result === 'passed', 422, 'Sertifikat hanya tersedia untuk peserta yang lulus.');

        $participant->load([
            'akademi:id,name,logo_url,sport_type',
            'student' => fn ($query) => $query->withTrashed(),
            'fromRank',
            'toRank',
            'assessor:id,name',
        ]);

        $chairName = User::query()
            ->where('akademi_id', $akademiId)
            ->where('role', 'ketua_akademi')
            ->orderBy('id')
            ->value('name');

        return response()->json([
            'certificate' => [
                'certificate_number' => sprintf(
                    'UKT/%s/%04d/%04d',
                    $rankPromotionEvent->event_date->format('Y'),
                    $rankPromotionEvent->id,
                    $participant->id
                ),
                'akademi' => $participant->akademi->only(['name', 'logo_url', 'sport_type']),
                'student' => $participant->student->only(['id', 'name', 'member_number']),
                'event' => [
                    'id' => $rankPromotionEvent->id,
                    'name' => $rankPromotionEvent->name,
                    'event_date' => $rankPromotionEvent->event_date->toDateString(),
                ],
                'from_rank' => $this->rank($participant->fromRank),
                'to_rank' => $this->rank($participant->toRank),
                'score' => $participant->score,
                'assessor' => $participant->assessor?->name,
                'chair_name' => $chairName,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function rank(?SportRank $rank): ?array
    {
        return $rank?->only(self::RANK_FIELDS);
    }
}
