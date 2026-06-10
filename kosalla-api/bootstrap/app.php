<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

// use Illuminate\Http\Middleware\HandleCors; // (Optional, biasanya sudah auto-load)
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

// Import middleware buatan sendiri
use App\Http\Middleware\MasterRole;
use App\Http\Middleware\EnsureActiveContract;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',

        // ✅ Tambahan: route "tanpa /api" untuk portal (agar FE yang memanggil /portal/* tidak 404)
        then: function () {
            // Route ini tetap memakai middleware 'api' (stateless + auth via sanctum token/cookie sesuai config)
            Route::middleware('api')->group(base_path('routes/portal_noprefix.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Mendaftarkan alias middleware
        $middleware->alias([
            // Spatie Permissions
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,

            // Master role dan kontrak aktif
            'master_role' => MasterRole::class,
            'active_contract' => EnsureActiveContract::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

