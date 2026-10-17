<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class SubscriptionAlertController extends Controller
{
    public function alerts(): JsonResponse
    {
        $now = Carbon::now();
        $in30Days = $now->copy()->addDays(30);

        $expiringSoon = Subscription::with('akademi:id,name,slug,status,plan')
            ->whereIn('status', ['active', 'trialing'])
            ->whereBetween('ends_at', [$now, $in30Days])
            ->orderBy('ends_at')
            ->get()
            ->map(fn ($s) => [
                'subscription_id' => $s->id,
                'akademi_id' => $s->akademi_id,
                'akademi_name' => $s->akademi?->name,
                'akademi_slug' => $s->akademi?->slug,
                'plan' => $s->plan,
                'ends_at' => $s->ends_at,
                'days_left' => (int) $now->diffInDays($s->ends_at, false),
                'status' => $s->status,
            ]);

        $unpaid = Subscription::with('akademi:id,name,slug,status,plan')
            ->whereIn('status', ['active', 'trialing', 'past_due'])
            ->where('payment_status', 'unpaid')
            ->where('ends_at', '>=', $now)
            ->orderBy('ends_at')
            ->get()
            ->map(fn ($s) => [
                'subscription_id' => $s->id,
                'akademi_id' => $s->akademi_id,
                'akademi_name' => $s->akademi?->name,
                'akademi_slug' => $s->akademi?->slug,
                'plan' => $s->plan,
                'amount' => $s->amount,
                'ends_at' => $s->ends_at,
                'payment_method' => $s->payment_method,
                'status' => $s->status,
            ]);

        return response()->json([
            'expiring_soon' => $expiringSoon,
            'unpaid' => $unpaid,
            'summary' => [
                'expiring_soon_count' => $expiringSoon->count(),
                'unpaid_count' => $unpaid->count(),
            ],
        ]);
    }
}
