<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArenaRoom;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ArenaController extends Controller
{
    // ──────────────────────────────────────────────
    // Word banks (mirror of frontend words.js)
    // ──────────────────────────────────────────────
    private array $englishWords = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
        'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
        'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
        'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
        'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
        'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
        'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
        'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
        'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
        'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'great',
        'between', 'need', 'large', 'under', 'never', 'each', 'right', 'last', 'small', 'world',
        'still', 'found', 'live', 'long', 'through', 'much', 'before', 'move', 'real', 'left',
        'same', 'begin', 'while', 'number', 'part', 'turn', 'where', 'thing', 'point', 'house',
        'hand', 'high', 'keep', 'place', 'around', 'help', 'every', 'name', 'city', 'away',
        'change', 'follow', 'line', 'why', 'ask', 'went', 'light', 'home', 'read', 'own',
        'end', 'near', 'add', 'here', 'play', 'run', 'close', 'open', 'seem', 'next',
        'walk', 'stop', 'grow', 'early', 'food', 'start', 'might', 'story', 'far', 'water',
        'example', 'paper', 'often', 'always', 'music', 'those', 'both', 'mark', 'book', 'letter',
        'car', 'room', 'friend', 'idea', 'fish', 'north', 'once', 'base', 'hear', 'horse',
        'cut', 'sure', 'watch', 'color', 'face', 'wood', 'main', 'enough', 'girl', 'young',
        'ready', 'above', 'ever', 'red', 'list', 'though', 'feel', 'talk', 'bird', 'soon',
        'body', 'dog', 'family', 'leave', 'song', 'door', 'black', 'short', 'stand', 'class',
        'wind', 'question', 'happen', 'ship', 'area', 'half', 'rock', 'order', 'fire', 'problem',
        'piece', 'pass', 'since', 'top', 'whole', 'space', 'heard', 'best', 'hour', 'better',
        'true', 'during', 'remember', 'step', 'hold', 'west', 'ground', 'reach', 'fast', 'sing',
        'listen', 'table', 'travel', 'less', 'morning', 'simple', 'several', 'love', 'person', 'money',
        'serve', 'appear', 'road', 'map', 'pattern', 'slow', 'center', 'toward', 'war', 'lay',
    ];

    private array $indonesianWords = [
        'yang', 'dan', 'di', 'itu', 'dengan', 'untuk', 'tidak', 'ini', 'dari', 'dalam',
        'akan', 'pada', 'juga', 'saya', 'ke', 'karena', 'sudah', 'ada', 'bisa', 'lebih',
        'kami', 'mereka', 'atau', 'dia', 'telah', 'apa', 'kita', 'oleh', 'aku', 'hanya',
        'belum', 'semua', 'lagi', 'harus', 'banyak', 'sangat', 'seperti', 'jadi', 'saat', 'waktu',
        'orang', 'tahu', 'satu', 'punya', 'lalu', 'kalau', 'masih', 'mau', 'bukan', 'sama',
        'hari', 'tahun', 'baru', 'sedang', 'antara', 'setelah', 'menjadi', 'tentang', 'hal', 'perlu',
        'kata', 'lain', 'tanpa', 'sebelum', 'memang', 'paling', 'besar', 'kecil', 'tinggi', 'rendah',
        'rumah', 'kerja', 'hidup', 'dunia', 'nama', 'tempat', 'baik', 'buruk', 'cepat', 'lambat',
        'makan', 'minum', 'tidur', 'jalan', 'datang', 'pergi', 'pulang', 'masuk', 'keluar', 'buka',
        'tutup', 'ambil', 'taruh', 'beri', 'tulis', 'baca', 'lihat', 'dengar', 'bicara', 'pikir',
        'rasa', 'cinta', 'suka', 'benci', 'takut', 'berani', 'senang', 'sedih', 'marah', 'tenang',
        'pagi', 'siang', 'sore', 'malam', 'besok', 'kemarin', 'sekarang', 'nanti', 'dulu', 'selalu',
        'air', 'api', 'tanah', 'angin', 'hujan', 'panas', 'dingin', 'cahaya', 'gelap', 'terang',
        'buku', 'kertas', 'pena', 'meja', 'kursi', 'pintu', 'jendela', 'lantai', 'dinding', 'atap',
        'mobil', 'motor', 'sepeda', 'kota', 'desa', 'negara', 'pulau', 'gunung', 'laut', 'teman',
        'guru', 'murid', 'dokter', 'petani', 'pekerja', 'ibu', 'ayah', 'anak', 'adik', 'kakak',
        'nenek', 'kakek', 'keluarga', 'sekolah', 'kantor', 'pasar', 'toko', 'bank', 'hotel', 'uang',
        'harga', 'murah', 'mahal', 'bayar', 'beli', 'jual', 'untung', 'rugi', 'hutang', 'nasi',
        'ayam', 'ikan', 'sayur', 'buah', 'gula', 'garam', 'pedas', 'manis', 'merah', 'biru',
        'hijau', 'kuning', 'putih', 'hitam', 'coklat', 'ungu', 'pintar', 'rajin', 'malas', 'kuat',
        'lemah', 'sehat', 'sakit', 'muda', 'tua', 'benar', 'salah', 'nyata', 'penuh', 'kosong',
        'mulai', 'selesai', 'berhenti', 'lanjut', 'kembali', 'pindah', 'tinggal', 'duduk', 'berdiri', 'bangun',
    ];

    private array $botDifficultyConfigs = [
        'easy' => [
            'wpm_min'  => 30,
            'wpm_max'  => 50,
            'acc_min'  => 95.0,
            'acc_max'  => 99.0,
            'names'    => ['NoobBot', 'ChillBot', 'Slowpoke', 'SnailRacer', 'BotBreeze', 'EasyDriver'],
        ],
        'medium' => [
            'wpm_min'  => 55,
            'wpm_max'  => 85,
            'acc_min'  => 96.0,
            'acc_max'  => 100.0,
            'names'    => ['BotRacer', 'CruiserBot', 'ByteRacer', 'BotShadow', 'SwiftKeys', 'MiddleDrive'],
        ],
        'hard' => [
            'wpm_min'  => 90,
            'wpm_max'  => 120,
            'acc_min'  => 97.0,
            'acc_max'  => 100.0,
            'names'    => ['BotTurbo', 'CyberRacer', 'SpeedDemon', 'BotViper', 'HyperTypist', 'NitroRacer'],
        ],
        'insane' => [
            'wpm_min'  => 125,
            'wpm_max'  => 160,
            'acc_min'  => 98.0,
            'acc_max'  => 100.0,
            'names'    => ['Overclocked', 'ApexTypist', 'BotOverlord', 'QuantumTyper', 'LightSpeed', 'GodModeBot'],
        ],
    ];

    // ──────────────────────────────────────────────
    // Helper: generate words
    // ──────────────────────────────────────────────
    private function generateWords(int $count, string $language): array
    {
        $bank = $language === 'indonesian' ? $this->indonesianWords : $this->englishWords;
        $words = [];
        for ($i = 0; $i < $count; $i++) {
            $words[] = $bank[array_rand($bank)];
        }
        return $words;
    }

    // ──────────────────────────────────────────────
    // Helper: build a player slot (bot or real)
    // ──────────────────────────────────────────────
    private function makeBotPlayer(int $slotIndex, string $difficulty = 'medium', array $existingBotNames = []): array
    {
        $config = $this->botDifficultyConfigs[$difficulty] ?? $this->botDifficultyConfigs['medium'];
        $availableNames = array_values(array_diff($config['names'], $existingBotNames));
        if (empty($availableNames)) {
            $availableNames = $config['names'];
        }

        $botName = $availableNames[array_rand($availableNames)];
        $botWpm  = rand($config['wpm_min'], $config['wpm_max']);
        $botAcc  = round(rand((int)($config['acc_min'] * 10), (int)($config['acc_max'] * 10)) / 10, 1);

        return [
            'id'          => 'bot-' . $slotIndex . '-' . Str::random(4),
            'nickname'    => $botName,
            'is_bot'      => true,
            'bot_wpm'     => $botWpm,
            'progress'    => 0.0,
            'wpm'         => 0,
            'accuracy'    => $botAcc,
            'finished'    => false,
            'finish_time' => null,
            'joined_at'   => now()->toISOString(),
        ];
    }

    private function makeRealPlayer(string $nickname): array
    {
        return [
            'id'          => 'p-' . Str::uuid(),
            'nickname'    => $nickname,
            'is_bot'      => false,
            'bot_wpm'     => 0,
            'progress'    => 0.0,
            'wpm'         => 0,
            'accuracy'    => 100,
            'finished'    => false,
            'finish_time' => null,
            'joined_at'   => now()->toISOString(),
        ];
    }

    // ──────────────────────────────────────────────
    // GET /api/arena/public
    // List public rooms with status 'waiting'
    // ──────────────────────────────────────────────
    public function publicRooms()
    {
        // Clean up stale rooms older than 30 minutes with no activity
        ArenaRoom::where('last_activity_at', '<', now()->subMinutes(30))
            ->whereIn('status', ['waiting', 'finished'])
            ->delete();

        $rooms = ArenaRoom::where('status', 'waiting')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($room) {
                $players = $room->players_json;
                $realCount = collect($players)->where('is_bot', false)->count();
                $totalSlots = count($players);
                return [
                    'room_code'       => $room->room_code,
                    'host_nickname'   => $room->host_nickname,
                    'language'        => $room->language,
                    'word_count'      => $room->word_count,
                    'bot_difficulty'  => $room->bot_difficulty ?? 'medium',
                    'player_count'    => $realCount,
                    'total_slots'     => $totalSlots,
                    'created_at'      => $room->created_at,
                ];
            });

        return response()->json(['status' => 'success', 'data' => $rooms]);
    }

    // ──────────────────────────────────────────────
    // POST /api/arena/create
    // Body: { nickname, language, word_count, bot_difficulty }
    // ──────────────────────────────────────────────
    public function create(Request $request)
    {
        $validated = $request->validate([
            'nickname'       => 'required|string|max:20|regex:/^[a-zA-Z0-9_]+$/',
            'language'       => 'required|in:english,indonesian',
            'word_count'     => 'required|integer|in:25,50,75,100',
            'bot_difficulty' => 'nullable|in:easy,medium,hard,insane',
        ], [
            'nickname.regex' => 'Nickname only allows letters, numbers, and underscores.',
        ]);

        $difficulty = $validated['bot_difficulty'] ?? 'medium';

        // Generate unique 6-char room code
        do {
            $code = strtoupper(Str::random(6));
        } while (ArenaRoom::where('room_code', $code)->exists());

        // Host player + 3 bots
        $players = [$this->makeRealPlayer($validated['nickname'])];
        $usedNames = [];
        for ($i = 0; $i < 3; $i++) {
            $bot = $this->makeBotPlayer($i, $difficulty, $usedNames);
            $usedNames[] = $bot['nickname'];
            $players[] = $bot;
        }

        $words = $this->generateWords($validated['word_count'], $validated['language']);

        $room = ArenaRoom::create([
            'room_code'        => $code,
            'host_nickname'    => $validated['nickname'],
            'status'           => 'waiting',
            'language'         => $validated['language'],
            'word_count'       => $validated['word_count'],
            'bot_difficulty'   => $difficulty,
            'words_json'       => $words,
            'players_json'     => $players,
            'last_activity_at' => now(),
        ]);

        return response()->json([
            'status'    => 'success',
            'room_code' => $room->room_code,
            'player_id' => $players[0]['id'],
            'room'      => $this->formatRoom($room),
        ], 201);
    }

    // ──────────────────────────────────────────────
    // POST /api/arena/join
    // Body: { room_code, nickname }
    // ──────────────────────────────────────────────
    public function join(Request $request)
    {
        $validated = $request->validate([
            'room_code' => 'required|string|size:6',
            'nickname'  => 'required|string|max:20|regex:/^[a-zA-Z0-9_]+$/',
        ], [
            'nickname.regex' => 'Nickname only allows letters, numbers, and underscores.',
        ]);

        $room = ArenaRoom::where('room_code', strtoupper($validated['room_code']))->first();

        if (!$room) {
            return response()->json(['status' => 'error', 'message' => 'Room not found.'], 404);
        }

        if ($room->status !== 'waiting') {
            return response()->json(['status' => 'error', 'message' => 'Race already started.'], 422);
        }

        $players = $room->players_json;

        // Check if nickname already taken in room
        $exists = collect($players)->where('is_bot', false)->firstWhere('nickname', $validated['nickname']);
        if ($exists) {
            return response()->json(['status' => 'error', 'message' => 'Nickname already taken in this room.'], 422);
        }

        // Find first bot slot to replace
        $botIndex = collect($players)->search(fn($p) => $p['is_bot'] === true);

        if ($botIndex === false) {
            return response()->json(['status' => 'error', 'message' => 'Room is full.'], 422);
        }

        $newPlayer = $this->makeRealPlayer($validated['nickname']);
        $players[$botIndex] = $newPlayer;

        $room->players_json     = $players;
        $room->last_activity_at = now();
        $room->save();

        return response()->json([
            'status'    => 'success',
            'room_code' => $room->room_code,
            'player_id' => $newPlayer['id'],
            'room'      => $this->formatRoom($room),
        ]);
    }

    // ──────────────────────────────────────────────
    // GET /api/arena/{code}
    // Poll room state
    // ──────────────────────────────────────────────
    public function show(string $code)
    {
        $room = ArenaRoom::where('room_code', strtoupper($code))->first();
        if (!$room) {
            return response()->json(['status' => 'error', 'message' => 'Room not found.'], 404);
        }

        return response()->json([
            'status' => 'success',
            'room'   => $this->formatRoom($room),
        ]);
    }

    // ──────────────────────────────────────────────
    // POST /api/arena/{code}/start
    // Body: { nickname } (must be host)
    // ──────────────────────────────────────────────
    public function start(Request $request, string $code)
    {
        $validated = $request->validate([
            'nickname' => 'required|string',
        ]);

        $room = ArenaRoom::where('room_code', strtoupper($code))->first();
        if (!$room) {
            return response()->json(['status' => 'error', 'message' => 'Room not found.'], 404);
        }

        if ($room->host_nickname !== $validated['nickname']) {
            return response()->json(['status' => 'error', 'message' => 'Only the host can start the race.'], 403);
        }

        if ($room->status !== 'waiting') {
            return response()->json(['status' => 'error', 'message' => 'Race already started.'], 422);
        }

        // Set countdown: race_started_at = 5 seconds from now (countdown period)
        $room->status           = 'countdown';
        $room->race_started_at  = now()->addSeconds(5); // actual race start timestamp
        $room->last_activity_at = now();
        $room->save();

        return response()->json(['status' => 'success', 'room' => $this->formatRoom($room)]);
    }

    // ──────────────────────────────────────────────
    // POST /api/arena/{code}/progress
    // Body: { player_id, progress, wpm, accuracy, finished }
    // ──────────────────────────────────────────────
    public function progress(Request $request, string $code)
    {
        $validated = $request->validate([
            'player_id' => 'required|string',
            'progress'  => 'required|numeric|min:0|max:100',
            'wpm'       => 'required|integer|min:0',
            'accuracy'  => 'required|numeric|min:0|max:100',
            'finished'  => 'required|boolean',
        ]);

        $room = ArenaRoom::where('room_code', strtoupper($code))->first();
        if (!$room) {
            return response()->json(['status' => 'error', 'message' => 'Room not found.'], 404);
        }

        $players = $room->players_json;
        $playerIndex = collect($players)->search(fn($p) => $p['id'] === $validated['player_id']);

        if ($playerIndex === false) {
            return response()->json(['status' => 'error', 'message' => 'Player not found in room.'], 404);
        }

        $players[$playerIndex]['progress'] = (float) $validated['progress'];
        $players[$playerIndex]['wpm']      = (int) $validated['wpm'];
        $players[$playerIndex]['accuracy'] = (float) $validated['accuracy'];

        if ($validated['finished'] && !$players[$playerIndex]['finished']) {
            $players[$playerIndex]['finished']    = true;
            $players[$playerIndex]['finish_time'] = now()->toISOString();
        }

        // Auto-transition to 'racing' when countdown ends
        if ($room->status === 'countdown' && $room->race_started_at && now()->gte($room->race_started_at)) {
            $room->status = 'racing';
        }

        $room->players_json     = $players;
        $room->last_activity_at = now();

        // Check if all real players finished
        $realPlayers = collect($players)->where('is_bot', false);
        if ($realPlayers->count() > 0 && $realPlayers->every(fn($p) => $p['finished'])) {
            $room->status = 'finished';
        }

        $room->save();

        return response()->json(['status' => 'success', 'room' => $this->formatRoom($room)]);
    }

    // ──────────────────────────────────────────────
    // Helper: format room for API response
    // ──────────────────────────────────────────────
    private function formatRoom(ArenaRoom $room): array
    {
        return [
            'room_code'      => $room->room_code,
            'host_nickname'  => $room->host_nickname,
            'status'         => $room->status,
            'language'       => $room->language,
            'word_count'     => $room->word_count,
            'bot_difficulty' => $room->bot_difficulty ?? 'medium',
            'words'          => $room->words_json,
            'players'        => $room->players_json,
            'race_starts_at' => $room->race_started_at?->toISOString(),
            'created_at'     => $room->created_at->toISOString(),
        ];
    }

    // ──────────────────────────────────────────────
    // POST /api/arena/{code}/leave
    // Body: { player_id, nickname }
    // If host leaves → delete room entirely
    // If player leaves → replace slot with a bot
    // ──────────────────────────────────────────────
    public function leave(Request $request, string $code)
    {
        $validated = $request->validate([
            'player_id' => 'required|string',
            'nickname'  => 'required|string',
        ]);

        $room = ArenaRoom::where('room_code', strtoupper($code))->first();

        if (!$room) {
            // Room already gone — just return success
            return response()->json(['status' => 'success', 'message' => 'Room already deleted.']);
        }

        // If the leaver is the host → delete the whole room
        if ($room->host_nickname === $validated['nickname']) {
            $room->delete();
            return response()->json(['status' => 'success', 'message' => 'Room deleted (host left).']);
        }

        // Non-host player leaving: replace their slot with a bot
        $players = $room->players_json;
        $playerIndex = collect($players)->search(fn($p) => $p['id'] === $validated['player_id']);

        if ($playerIndex !== false) {
            $existingBotNames = collect($players)->where('is_bot', true)->pluck('nickname')->toArray();
            $players[$playerIndex] = $this->makeBotPlayer($playerIndex, $room->bot_difficulty ?? 'medium', $existingBotNames);
        }

        $room->players_json     = $players;
        $room->last_activity_at = now();
        $room->save();

        return response()->json(['status' => 'success', 'message' => 'Left room.']);
    }
}

