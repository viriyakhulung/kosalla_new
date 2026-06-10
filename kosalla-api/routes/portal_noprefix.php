<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PortalTicketController;

Route::middleware(['auth:sanctum'])
    ->prefix('portal')
    ->group(function () {

        Route::get('/tickets', [PortalTicketController::class, 'index']);
        Route::post('/tickets', [PortalTicketController::class, 'store']);
        Route::get('/tickets/{ticket}', [PortalTicketController::class, 'show']);

    });

