<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('arena_rooms', function (Blueprint $table) {
            $table->string('race_mode', 10)->default('words')->after('bot_difficulty'); // 'words' | 'timer'
            $table->integer('time_limit')->nullable()->after('race_mode');              // seconds: 30, 60, 90
        });
    }

    public function down(): void
    {
        Schema::table('arena_rooms', function (Blueprint $table) {
            $table->dropColumn(['race_mode', 'time_limit']);
        });
    }
};
