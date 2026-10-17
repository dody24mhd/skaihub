<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('akademi');
        $akademi = $user->akademi;
        $lifecycle = $this->subscriptions->lifecycle($akademi);
        $subscription = $lifecycle['entitled'];
        $entitlements = $this->subscriptions->entitlements($subscription);

        return response()->json([
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
            'entitlements' => $entitlements,
            'subscription_state' => $lifecycle['state'],
            'days_left' => $lifecycle['days_left'],
            'subscription_ends_at' => $lifecycle['ends_at'],
            'effective_student_limit' => $entitlements['student_limit'],
            'active_students' => $this->subscriptions->activeStudentCount($akademi),
        ]);
    }
}
