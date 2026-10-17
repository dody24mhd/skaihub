<?php

use App\Http\Middleware\EnsureActiveUser;
use App\Http\Middleware\EnsureAdminApiToken;
use App\Http\Middleware\EnsureAkademiAccess;
use App\Http\Middleware\EnsureAkademiUser;
use App\Http\Middleware\EnsureFeature;
use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\EnsureSubscriptionWritable;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Allow CORS for API routes (Next.js frontend on localhost:3000)
        $middleware->api(prepend: [
            HandleCors::class,
        ]);
        $middleware->alias([
            'admin.api' => EnsureAdminApiToken::class,
            'akademi.access' => EnsureAkademiAccess::class,
            'akademi.user' => EnsureAkademiUser::class,
            'super.admin' => EnsureSuperAdmin::class,
            'platform.admin' => EnsurePlatformAdmin::class,
            'feature' => EnsureFeature::class,
            'active' => EnsureActiveUser::class,
            'subscription.writable' => EnsureSubscriptionWritable::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
