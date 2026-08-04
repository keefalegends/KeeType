# KeeType

A hyper-minimalist, distraction-free typing speed test built for focus. No login walls. No bloat. Just open and type.

Inspired by [Monkeytype](https://monkeytype.com) · Crafted by [keefalegends](https://github.com/keefalegends)

![KeeType Preview](https://github.com/user-attachments/assets/7771c233-7cd6-4823-987d-192cf4835651)

---

## Features

### ⌨️ Typing Test
- **Modes**: Time (15s, 30s, 60s, 120s) and Words (10, 25, 50, 100)
- **Languages**: English and Indonesian word banks
- **Live stats**: WPM, raw WPM, accuracy, character breakdown, consistency chart
- **Smooth caret** with optional block cursor for CRT theme

### 🏟️ Arena Mode (Multiplayer)
- Real-time race against friends or bots via polling
- **Race modes**: Words (finish first) or Timer (most words typed)
- **Bot difficulties**: Easy (30–50 wpm), Medium (55–85 wpm), Hard (90–120 wpm), Player Only
- Room creation with custom word count (25/50/75/100) or time limit (15/30/60/90s)
- Live race track with per-player progress bars
- Podium with WPM & accuracy for all racers
- Auto room cleanup when host navigates away
- Stale room garbage collection (5 min idle)

### 🎨 Themes
| Theme | Style |
|---|---|
| **Navy Gold** | Default dark — navy bg, gold accent |
| **Terminal CRT** | Phosphor amber-green, scanlines overlay |
| **Paper Ink** | Clean editorial light mode |
| **Serika Dark** | Charcoal & yellow (Monkeytype-inspired) |
| **Darling** | Bubbly pastel pink |
| **Lavender Haze** | Deep purple, soft lilac, fuchsia accent |

### 🔊 Typing Sound
- Simulated mechanical keyboard sounds built with Web Audio API
- Options: Muted, Cherry MX Brown, Bubble Pop, Tactile Switch, Vintage Typewriter
- Adjustable volume

### 🏆 Leaderboard
- Submit scores after every test
- Filter by period: Daily, Weekly, All-time
- Filter by mode: Time / Words

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vue 3, Vite, Tailwind CSS v4, JetBrains Mono |
| Backend | Laravel 13 (REST API) |
| Database | SQLite |
| Deployment | Docker Compose, Nginx |

---

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

App runs at `http://localhost:5173` · Backend at `http://localhost:8000`

---

## API Reference

### Leaderboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leaderboard` | Fetch entries (`mode`, `period`, `limit`) |
| `POST` | `/api/leaderboard` | Submit score (`nickname`, `wpm`, `accuracy`, `mode`) |

### Arena
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/arena/public` | List open rooms |
| `POST` | `/api/arena/create` | Create room (`nickname`, `language`, `race_mode`, `word_count`, `time_limit`, `bot_difficulty`) |
| `POST` | `/api/arena/join` | Join room by code |
| `GET` | `/api/arena/{code}` | Poll room state |
| `POST` | `/api/arena/{code}/start` | Start race (host only) |
| `POST` | `/api/arena/{code}/progress` | Sync typing progress |
| `POST` | `/api/arena/{code}/leave` | Leave room |

---

## License

[MIT](LICENSE)
