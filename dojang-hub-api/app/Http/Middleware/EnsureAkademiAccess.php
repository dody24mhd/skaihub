<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAkademiAccess
{
    /**
     * Ensures the authenticated user belongs to the akademi_id in the route.
     * Super admins bypass this check and can access any akademi.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $routeAkademiId = (int) $request->route('akademi_id');

        if ($routeAkademiId && ! $user->belongsToAkademi($routeAkademiId)) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        return $next($request);
    }
}
