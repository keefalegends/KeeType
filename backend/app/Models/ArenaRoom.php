<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArenaRoom extends Model
{
    protected $fillable = [
        'room_code',
        'host_nickname',
        'status',
        'language',
        'race_mode',
        'word_count',
        'time_limit',
        'bot_difficulty',
        'words_json',
        'players_json',
        'race_started_at',
        'last_activity_at',
    ];

    protected $casts = [
        'words_json'       => 'array',
        'players_json'     => 'array',
        'race_started_at'  => 'datetime',
        'last_activity_at' => 'datetime',
    ];
}
