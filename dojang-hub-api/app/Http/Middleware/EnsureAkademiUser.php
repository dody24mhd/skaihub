<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAkademiUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun tidak aktif. Hubungi administrator.'], 401);
        }

        if ($user->isSuperAdmin() || ! $user->akademi_id) {
            return response()->json(['message' => 'Akses ditolak. Akun ini bukan user akademi.'], 403);
        }

        $akademi = $user->akademi;

        if (! $akademi || $akademi->status !== 'active') {
            return response()->json(['message' => 'Akademi tidak aktif. Hubungi administrator.'], 403);
        }

        app()->instance('currentAkademi', $akademi);

        return $next($request);
    }
}
