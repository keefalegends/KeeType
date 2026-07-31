<?php

use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\ArenaController;
use Illuminate\Support\Facades\Route;

Route::get('/leaderboard', [LeaderboardController::class, 'index']);
Route::post('/leaderboard', [LeaderboardController::class, 'store']);

// Arena Mode routes
Route::prefix('arena')->group(function () {
    Route::get('/public',           [ArenaController::class, 'publicRooms']);
    Route::post('/create',          [ArenaController::class, 'create']);
    Route::post('/join',            [ArenaController::class, 'join']);
    Route::get('/{code}',           [ArenaController::class, 'show']);
    Route::post('/{code}/start',    [ArenaController::class, 'start']);
    Route::post('/{code}/progress', [ArenaController::class, 'progress']);
    Route::post('/{code}/leave',    [ArenaController::class, 'leave']);
});

