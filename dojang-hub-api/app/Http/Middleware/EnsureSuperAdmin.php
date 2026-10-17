<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
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

        if (! $user->isSuperAdmin()) {
            return response()->json(['message' => 'Akses ditolak. Hanya super admin.'], 403);
        }

        return $next($request);
    }
}
