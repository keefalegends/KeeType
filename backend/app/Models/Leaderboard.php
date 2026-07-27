<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Leaderboard extends Model
{
    protected $fillable = [
        'nickname',
        'wpm',
        'accuracy',
        'mode',
    ];
}
