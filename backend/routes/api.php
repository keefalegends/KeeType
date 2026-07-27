<?php

use App\Http\Controllers\Api\LeaderboardController;
use Illuminate\Support\Facades\Route;

Route::get('/leaderboard', [LeaderboardController::class, 'index']);
Route::post('/leaderboard', [LeaderboardController::class, 'store']);
