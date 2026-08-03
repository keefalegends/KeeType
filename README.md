# KeeType

A clean, minimalist typing speed test application inspired by Monkeytype. 
No login needed—just open and start typing.

![KeeType Preview](https://github.com/user-attachments/assets/7771c233-7cd6-4823-987d-192cf4835651)

## Features

- **Typing Modes**: Time (15s, 30s, 60s, 120s) and Words (10, 25, 50, 100).
- **Arena Mode**: Real-time multiplayer race against friends or bots (Easy, Medium, Hard, or Player Only).
- **Languages**: English and Indonesian word banks.
- **Themes**: Navy, Retro CRT, Paper, Serika Dark, and Darling.
- **Keyboard Sound FX**: Simulated mechanical click sounds built with Web Audio API.
- **Leaderboard**: Scoreboard with daily, weekly, and all-time filters.
- **Analytics**: Real-time WPM, raw WPM, accuracy, character breakdown, and consistency chart.

## Tech Stack

- **Frontend**: Vue 3, Vite, Tailwind CSS v4, JetBrains Mono
- **Backend**: Laravel 13 (REST API), SQLite

## Quick Start

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App will run at `http://localhost:5173` (Backend at `http://localhost:8000`).

## API Endpoints

### Leaderboard
- `GET /api/leaderboard` - Fetch leaderboard entries (`mode`, `period`, `limit`)
- `POST /api/leaderboard` - Submit score (`nickname`, `wpm`, `accuracy`, `mode`)

### Arena
- `GET /api/arena/public` - List active public rooms
- `POST /api/arena/create` - Create room (`nickname`, `language`, `word_count`, `bot_difficulty`)
- `POST /api/arena/join` - Join room by code or lobby list
- `GET /api/arena/{code}` - Poll room state and players
- `POST /api/arena/{code}/start` - Start race (host only)
- `POST /api/arena/{code}/progress` - Sync typing progress
- `POST /api/arena/{code}/leave` - Leave room

## License

[MIT](LICENSE)
