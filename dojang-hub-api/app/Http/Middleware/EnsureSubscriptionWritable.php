<?php

namespace App\Http\Middleware;

use App\Services\SubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscriptionWritable
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethodSafe()) {
            return $next($request);
        }

        $akademi = $request->user()?->akademi;

        if ($akademi && $this->subscriptions->lifecycleState($akademi) === 'read_only') {
            return response()->json([
                'message' => 'Langganan akademi sudah berakhir. Data tetap bisa dilihat dan diekspor, tetapi tidak bisa diubah sampai pembayaran perpanjangan dicatat.',
                'subscription_state' => 'read_only',
            ], Response::HTTP_PAYMENT_REQUIRED);
        }

        return $next($request);
    }
}
