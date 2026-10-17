<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdminApiToken
{
    public function handle(Request $request, Closure $next)
    {
        $adminToken = config('services.admin.token');

        if (!$adminToken || !hash_equals($adminToken, (string) $request->header('X-Admin-Token'))) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
