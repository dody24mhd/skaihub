<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $databaseUp = $this->databaseIsReachable();

        return response()->json([
            'status' => $databaseUp ? 'ok' : 'error',
            'db' => $databaseUp,
            'time' => now()->toIso8601String(),
        ], $databaseUp ? 200 : 503)->header('Cache-Control', 'no-store');
    }

    private function databaseIsReachable(): bool
    {
        try {
            DB::select('select 1');

            return true;
        } catch (Throwable $e) {
            Log::error('Health check: database tidak dapat dijangkau.', ['exception' => $e::class, 'message' => $e->getMessage()]);

            return false;
        }
    }
}
