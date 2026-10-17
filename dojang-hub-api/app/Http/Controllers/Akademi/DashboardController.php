<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\EvaluationPeriod;
use App\Models\RankPromotionEvent;
use App\Models\SppBill;
use App\Models\Student;
use App\Models\TrainingAttendance;
use App\Models\TrainingClass;
use App\Models\TrainingPlace;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use App\Services\SubscriptionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user()->load('akademi');
        $akademi = $user->akademi;
        $now = CarbonImmutable::now();
        $monthStart = $now->startOfMonth()->toDateString();
        $monthEnd = $now->endOfMonth()->toDateString();
        $isAdminRole = in_array($user->role, ['ketua_akademi', 'admin_akademi'], true);

        $sessionQuery = TrainingSession::query()
            ->where('akademi_id', $akademi->id)
            ->whereBetween('session_date', [$monthStart, $monthEnd]);

        if ($user->role === 'pelatih') {
            $sessionQuery->where(fn ($query) => $query
                ->where('coach_id', $user->id)
                ->orWhereHas('coaches', fn ($coaches) => $coaches->where('users.id', $user->id)));
        }

        $countedSessionQuery = (clone $sessionQuery)->whereNotIn('status', TrainingSession::UNCOUNTED_STATUSES);
        $sessionIds = (clone $countedSessionQuery)->pluck('id');
        $attendanceTotal = $sessionIds->isEmpty()
            ? 0
            : (int) TrainingAttendance::query()
                ->whereIn('training_session_id', $sessionIds)
                ->where('is_extra_participant', false)
                ->count();
        $attendancePresent = $sessionIds->isEmpty()
            ? 0
            : (int) TrainingAttendance::query()
                ->whereIn('training_session_id', $sessionIds)
                ->where('is_extra_participant', false)
                ->where('status', 'present')
                ->count();

        $subscription = $this->subscriptions->entitledSubscription($akademi);
        $activePeriod = EvaluationPeriod::query()
            ->withCount('scores')
            ->where('akademi_id', $akademi->id)
            ->where('status', 'active')
            ->orderByDesc('starts_at')
            ->first();

        $latestRankPromotion = RankPromotionEvent::query()
            ->withCount([
                'participants',
                'participants as passed_count' => fn ($query) => $query->where('result', 'passed'),
            ])
            ->where('akademi_id', $akademi->id)
            ->orderByDesc('event_date')
            ->first();

        $sppSummary = null;
        $studentSummary = null;
        $setupSummary = null;

        if ($isAdminRole) {
            $sppQuery = SppBill::query()
                ->where('akademi_id', $akademi->id)
                ->where('billing_year', $now->year)
                ->where('billing_month', $now->month);

            $sppSummary = [
                'bill_count' => (clone $sppQuery)->count(),
                'total_amount' => (float) (clone $sppQuery)->sum('amount'),
                'paid_amount' => (float) (clone $sppQuery)->sum('paid_amount'),
                'unpaid_count' => (clone $sppQuery)->whereIn('status', ['unpaid', 'partial'])->count(),
            ];

            $studentSummary = [
                'active_count' => Student::where('akademi_id', $akademi->id)->where('status', 'active')->count(),
                'inactive_count' => Student::where('akademi_id', $akademi->id)->where('status', 'inactive')->count(),
                'alumni_count' => Student::where('akademi_id', $akademi->id)->where('status', 'alumni')->count(),
                'latest' => Student::query()
                    ->with(['primaryClass', 'currentRank'])
                    ->where('akademi_id', $akademi->id)
                    ->latest('id')
                    ->limit(6)
                    ->get(),
            ];

            $setupSummary = [
                'places_count' => TrainingPlace::where('akademi_id', $akademi->id)->count(),
                'classes_count' => TrainingClass::where('akademi_id', $akademi->id)->count(),
                'active_schedules_count' => TrainingSchedule::where('akademi_id', $akademi->id)->where('is_active', true)->count(),
            ];
        }

        return response()->json([
            'profile' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar_url' => $user->avatar_url,
                    'is_active' => $user->is_active,
                    'akademi_id' => $user->akademi_id,
                ],
                'akademi' => [
                    'id' => $akademi->id,
                    'name' => $akademi->name,
                    'slug' => $akademi->slug,
                    'sport_type' => $akademi->sport_type,
                    'logo_url' => $akademi->logo_url,
                    'status' => $akademi->status,
                    'plan' => $akademi->plan,
                    'plan_expires_at' => $akademi->plan_expires_at,
                ],
                'subscription' => $subscription,
                'entitlements' => $this->subscriptions->entitlements($subscription),
            ],
            'period' => [
                'year' => $now->year,
                'month' => $now->month,
                'month_label' => $now->isoFormat('MMMM YYYY'),
            ],
            'students' => $studentSummary,
            'setup' => $setupSummary,
            'spp' => $sppSummary,
            'sessions' => [
                'month_count' => (clone $countedSessionQuery)->count(),
                'completed_count' => (clone $countedSessionQuery)->where('status', 'completed')->count(),
                'attendance_total' => $attendanceTotal,
                'attendance_present' => $attendancePresent,
                'attendance_rate' => $attendanceTotal > 0 ? round(($attendancePresent / $attendanceTotal) * 100) : 0,
                'latest' => (clone $sessionQuery)
                    ->with(['class', 'trainingPlace', 'coach'])
                    ->orderByDesc('session_date')
                    ->orderByDesc('starts_at')
                    ->limit(6)
                    ->get(),
            ],
            'evaluation' => [
                'active_period' => $activePeriod,
                'active_scores_count' => $activePeriod?->scores_count ?? 0,
            ],
            'rank_promotion' => [
                'latest_event' => $latestRankPromotion,
            ],
        ]);
    }
}
