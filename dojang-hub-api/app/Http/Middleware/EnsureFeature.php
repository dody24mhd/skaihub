<?php

namespace App\Http\Middleware;

use App\Services\SubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeature
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();

        if (! $user || ! $user->akademi) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $subscription = $this->subscriptions->activeForAkademi($user->akademi);
        $entitlements = $this->subscriptions->entitlements($subscription);

        $featureKey = match ($feature) {
            'public_website' => 'has_public_website',
            'subdomain' => 'has_subdomain',
            'exam_events' => 'has_exam_events',
            'parent_portal' => 'has_parent_portal',
            default => $feature,
        };

        if (empty($entitlements[$featureKey])) {
            return response()->json([
                'message' => 'Paket langganan Anda tidak mencakup fitur website publik.',
            ], 403);
        }

        return $next($request);
    }
}
