<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Leaderboard;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    /**
     * Get top scores grouped/filtered by mode.
     */
    public function index(Request $request)
    {
        $mode   = $request->query('mode', 'time-30');
        $limit  = $request->query('limit', 10);
        $period = $request->query('period', 'all'); // all | daily | weekly

        $query = Leaderboard::where('mode', $mode);

        if ($period === 'daily') {
            $query->whereDate('created_at', today());
        } elseif ($period === 'weekly') {
            $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
        }

        $scores = $query
            ->orderByDesc('wpm')
            ->orderByDesc('accuracy')
            ->orderBy('created_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $scores
        ]);
    }

    /**
     * Save a new score.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nickname' => 'required|string|max:15|regex:/^[a-zA-Z0-9_]+$/',
            'wpm' => 'required|integer|min:0|max:350',
            'accuracy' => 'required|numeric|min:0|max:100',
            'mode' => 'required|string|max:50',
        ], [
            'nickname.regex' => 'Nickname only allows letters, numbers, and underscores.'
        ]);

        $score = Leaderboard::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Score submitted successfully!',
            'data' => $score
        ], 201);
    }
}
