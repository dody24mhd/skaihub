<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\TrainingSession;
use App\Services\TrainingSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TrainingSessionActionController extends Controller
{
    public function __construct(private readonly TrainingSessionService $sessions) {}

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
