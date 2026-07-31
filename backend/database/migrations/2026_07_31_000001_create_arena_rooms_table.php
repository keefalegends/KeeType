<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('arena_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('room_code', 6)->unique();
            $table->string('host_nickname', 30);
            $table->enum('status', ['waiting', 'countdown', 'racing', 'finished'])->default('waiting');
            $table->string('language', 20)->default('english');
            $table->integer('word_count')->default(25);
            // JSON array of word strings shared for all players
            $table->text('words_json');
            // JSON array of player objects:
            // [{ id, nickname, is_bot, bot_wpm, progress, wpm, accuracy, finished, finish_time, joined_at }]
            $table->text('players_json');
            $table->timestamp('race_started_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arena_rooms');
    }
};
