<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\RankPromotionEvent;
use App\Models\RankPromotionParticipant;
use App\Models\SportRank;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RankPromotionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $events = RankPromotionEvent::query()
            ->withCount('participants')
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderByDesc('event_date')
            ->get();

        return response()->json(['data' => $events]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'event_date' => ['required', 'date'],
            'status' => ['sometimes', Rule::in(['draft', 'completed', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ]);

        $event = RankPromotionEvent::create([
            ...$data,
            'akademi_id' => $request->user()->akademi_id,
            'status' => $data['status'] ?? 'draft',
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['rank_promotion_event' => $event->loadCount('participants')], 201);
    }

    public function show(Request $request, RankPromotionEvent $rankPromotionEvent): JsonResponse
    {
        $this->ensureEventBelongsToCurrentAkademi($request, $rankPromotionEvent);

        return response()->json([
            'rank_promotion_event' => $rankPromotionEvent->load([
                'participants.student.primaryClass',
                'participants.fromRank',
                'participants.toRank',
                'participants.assessor',
            ])->loadCount('participants'),
        ]);
    }

    public function update(Request $request, RankPromotionEvent $rankPromotionEvent): JsonResponse
    {
        $this->ensureCanManage($request);
        $this->ensureEventBelongsToCurrentAkademi($request, $rankPromotionEvent);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'event_date' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', Rule::in(['draft', 'completed', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ]);

        $rankPromotionEvent->update($data);

        return response()->json([
            'rank_promotion_event' => $rankPromotionEvent->fresh()->loadCount('participants'),
        ]);
    }

    public function storeParticipant(Request $request, RankPromotionEvent $rankPromotionEvent): JsonResponse
    {
        $this->ensureCanManage($request);
        $this->ensureEventBelongsToCurrentAkademi($request, $rankPromotionEvent);

        abort_if($rankPromotionEvent->status === 'cancelled', 422, 'Event kenaikan tingkat sudah dibatalkan.');

        $akademiId = $request->user()->akademi_id;
        $sportType = $request->user()->akademi->sport_type;
        $data = $request->validate([
            'student_id' => ['required', Rule::exists(Student::class, 'id')->where('akademi_id', $akademiId)],
            'to_rank_id' => [
                'required',
                Rule::exists(SportRank::class, 'id')
                    ->where('sport_type', $sportType)
                    ->where(fn ($q) => $q->whereNull('akademi_id')->orWhere('akademi_id', $akademiId)),
            ],
            'result' => ['sometimes', Rule::in(['registered', 'passed', 'failed', 'absent'])],
            'score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $student = Student::where('akademi_id', $akademiId)->findOrFail($data['student_id']);
        $participant = null;

        DB::transaction(function () use (&$participant, $akademiId, $data, $rankPromotionEvent, $request, $student) {
            $participant = RankPromotionParticipant::updateOrCreate(
                [
                    'rank_promotion_event_id' => $rankPromotionEvent->id,
                    'student_id' => $student->id,
                ],
                [
                    'akademi_id' => $akademiId,
                    'from_rank_id' => $student->current_rank_id,
                    'to_rank_id' => $data['to_rank_id'],
                    'result' => $data['result'] ?? 'registered',
                    'score' => $data['score'] ?? null,
                    'notes' => $data['notes'] ?? null,
                    'assessed_by' => $request->user()->id,
                ]
            );

            $this->syncStudentRank($student, $participant);
        });

        return response()->json([
            'rank_promotion_participant' => $participant->load(['student.primaryClass', 'fromRank', 'toRank', 'assessor']),
        ], 201);
    }

    public function updateParticipant(
        Request $request,
        RankPromotionEvent $rankPromotionEvent,
        RankPromotionParticipant $participant
    ): JsonResponse {
        $this->ensureCanManage($request);
        $this->ensureEventBelongsToCurrentAkademi($request, $rankPromotionEvent);
        $this->ensureParticipantBelongsToEvent($request, $rankPromotionEvent, $participant);

        $akademiId = $request->user()->akademi_id;
        $sportType = $request->user()->akademi->sport_type;
        $data = $request->validate([
            'to_rank_id' => [
                'sometimes',
                'required',
                Rule::exists(SportRank::class, 'id')
                    ->where('sport_type', $sportType)
                    ->where(fn ($q) => $q->whereNull('akademi_id')->orWhere('akademi_id', $akademiId)),
            ],
            'result' => ['sometimes', Rule::in(['registered', 'passed', 'failed', 'absent'])],
            'score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data, $participant, $request) {
            $participant->update([
                ...$data,
                'assessed_by' => $request->user()->id,
            ]);

            $this->syncStudentRank($participant->student, $participant->fresh());
        });

        return response()->json([
            'rank_promotion_participant' => $participant->fresh()->load(['student.primaryClass', 'fromRank', 'toRank', 'assessor']),
        ]);
    }

    private function syncStudentRank(Student $student, RankPromotionParticipant $participant): void
    {
        if ($participant->result === 'passed') {
            $student->update(['current_rank_id' => $participant->to_rank_id]);

            $participant->loadMissing('event');
            $student->rankHistories()->updateOrCreate(
                ['rank_promotion_participant_id' => $participant->id],
                [
                    'akademi_id' => $student->akademi_id,
                    'sport_rank_id' => $participant->to_rank_id,
                    'achieved_on' => optional($participant->event?->event_date)->toDateString() ?? now()->toDateString(),
                    'source_type' => 'promotion_event',
                    'notes' => $participant->notes ?? 'Lulus ujian kenaikan tingkat',
                    'changed_by' => $participant->assessed_by,
                ]
            );

            return;
        }

        $student->rankHistories()
            ->where('rank_promotion_participant_id', $participant->id)
            ->delete();

        if ($student->current_rank_id === $participant->to_rank_id) {
            $student->update(['current_rank_id' => $participant->from_rank_id]);
        }
    }

    private function ensureCanManage(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengatur kenaikan tingkat.'
        );
    }

    private function ensureEventBelongsToCurrentAkademi(Request $request, RankPromotionEvent $event): void
    {
        abort_unless(
            $event->akademi_id === $request->user()->akademi_id,
            404,
            'Event kenaikan tingkat tidak ditemukan.'
        );
    }

    private function ensureParticipantBelongsToEvent(
        Request $request,
        RankPromotionEvent $event,
        RankPromotionParticipant $participant
    ): void {
        abort_unless(
            $participant->akademi_id === $request->user()->akademi_id
                && $participant->rank_promotion_event_id === $event->id,
            404,
            'Peserta kenaikan tingkat tidak ditemukan.'
        );
    }
}
