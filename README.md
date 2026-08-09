# KeeType

A hyper-minimalist, distraction-free typing speed test built for focus. No login walls. No bloat. Just open and type.

Inspired by [Monkeytype](https://monkeytype.com) · Crafted by [keefalegends](https://github.com/keefalegends)

<img width="1920" height="961" alt="KeeType Main Interface" src="https://github.com/user-attachments/assets/171f1823-85b3-4e7b-9ccd-57e0d123dce5" />

<img width="1920" height="956" alt="KeeType Arena Mode" src="https://github.com/user-attachments/assets/d7e6c5cf-0c8a-4190-b137-791748d9f4b7" />


---

## Features

### ⌨️ Typing Test
- **Modes**: Time (15s, 30s, 60s, 120s) and Words (10, 25, 50, 100)
- **Languages**: English (`EN`) and Indonesian (`ID`) word banks
- **Live stats**: WPM, raw WPM, accuracy, character breakdown, consistency chart
- **Smooth caret** with optional block cursor for CRT theme

### 🏟️ Velocity Arena (Multiplayer)
- **Redesigned 2-Column Lobby**: 65% configuration area + 35% live open rooms sidebar powered by modern **Sora** typography.
- **Real-Time Racing**: Race against friends or AI bots in real time.
- **Race Modes**: Words (finish word count first) or Timer (most words typed in time limit).
- **Bot Difficulties**: Easy (30–50 WPM), Medium (55–85 WPM), Hard (90–120 WPM), Player Only (Real Players).
- **Interactive Rematch Voting (`Rematch X/Y`)**: All players in a room vote for a rematch. When 100% of human players vote, the game automatically resets and triggers a 5-second countdown.
- **Vibrant Player Slots**: Distinct color accents and background tints for each player (`Gold`, `Blue`, `Emerald`, `Coral`).
- **Open Rooms Panel**: Clean vertical cards showing room code, host, language, race mode, and active slot count with quick `Join Race`.
- **Nickname Warning Pop-out**: Toast alert notification when creating or joining without a nickname.
- **Theme-Adaptive UI**: Fully dynamic theme color mixing (`color-mix`) that seamlessly adapts across all light & dark themes.
- **Auto Room Cleanup**: Stale room garbage collection and host leave detection.

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

### 💬 Contact & Feedback
- Built-in contact form for bug reports and feature requests
- Supports drag-and-drop screenshot attachments

### 🏆 Leaderboard
- Submit scores after every test
- Filter by period: Daily, Weekly, All-time
- Filter by mode: Time / Words

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vue 3, Vite, Tailwind CSS v4, Sora & JetBrains Mono fonts |
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
| `POST` | `/api/arena/{code}/rematch` | Vote for rematch (starts countdown when 100% agreed) |
| `POST` | `/api/arena/{code}/leave` | Leave room |

### Contact
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/contact` | Submit bug report / feature request (`name`, `email`, `message`, `screenshot`) |

---

## License

[MIT](LICENSE)
