# KeeType

A hyper-minimalist typing speed test — inspired by Monkeytype and 10fastfingers.
No login. No bloat. Just open and type.

Built with **Laravel** (REST API) and **Vue 3 + Vite** (SPA frontend), styled with **Tailwind CSS v4** and **JetBrains Mono**.

---

## Features

- **Time mode** — 15 / 30 / 60 / 120 seconds countdown
- **Words mode** — 10 / 25 / 50 / 100 words
- **Live stats** — WPM, raw WPM, accuracy, character breakdown
- **WPM chart** — per-second speed graph after each test
- **Leaderboard** — submit your score with a nickname (no account needed)
- **Keyboard sound-free** — distraction-free by design
- **Dark theme** — code-editor palette, monospace font, zero visual noise

## Tech Stack

| Layer    | Stack                          |
|----------|--------------------------------|
| Frontend | Vue 3, Vite, Tailwind CSS v4   |
| Backend  | Laravel (SQLite), REST API     |
| Font     | JetBrains Mono (Google Fonts)  |

## Project Structure

```
KeeType/
├── backend/          # Laravel API
│   ├── app/
│   │   ├── Models/Leaderboard.php
│   │   └── Http/Controllers/Api/LeaderboardController.php
│   ├── routes/api.php
│   └── database/migrations/
└── frontend/         # Vue 3 SPA
    ├── src/
    │   ├── components/
    │   │   ├── ModeSelector.vue
    │   │   ├── TypingArea.vue
    │   │   └── ResultScreen.vue
    │   ├── composables/useTypingGame.js
    │   ├── data/words.js
    │   ├── App.vue
    │   └── style.css
    └── index.html
```

## Getting Started

### Prerequisites

- PHP 8.2+ & Composer
- Node.js 18+ & npm

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
# → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Open `http://localhost:5173` in your browser and start typing.

## API Endpoints

| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | /api/leaderboard   | Get top scores by mode   |
| POST   | /api/leaderboard   | Submit a new score       |

**GET** query params: `mode` (e.g. `time-30`), `limit` (default `10`)

**POST** body:
```json
{
  "nickname": "yourname",
  "wpm": 85,
  "accuracy": 97.5,
  "mode": "time-30"
}
```

## License

MIT
