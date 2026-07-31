# KeeType 

A hyper-minimalist, distraction-free typing speed test application. 
No login required. Zero bloat. Pure typing focus, Inspired by **monkeytype.com**.

Built with **Laravel 13** (REST API) and **Vue 3 + Vite** (SPA Frontend), styled with **Tailwind CSS v4** and **JetBrains Mono**.

<img width="1914" height="877" alt="image" src="https://github.com/user-attachments/assets/7771c233-7cd6-4823-987d-192cf4835651" />

---

## ✨ Features

- 🎯 **Multiple Modes** — Choose between **Time mode** (`15s`, `30s`, `60s`, `120s`) or **Words mode** (`10`, `25`, `50`, `100` words).
- 🌍 **Multi-Language Support** — Practice in **English** (Top 200 common words) or **Indonesian** (Top 300 daily common words).
- 🎨 **Dynamic Themes** — Switch instantly between 5 carefully crafted color palettes:
  - `navy` — Deep navy blue with golden highlights (Default).
  - `terminal` — Retro hacker CRT terminal with pure black background, phosphor green text, and a solid block caret.
  - `paper` — Editorial off-white light mode with ink text and cobalt blue accents.
  - `serika-dark` — Charcoal dark theme with yellow accents.
  - `darling` — Kawaii pastel pink theme with white/navy blue highlights.
- 🔊 **ASMR Mechanical Keyboard Sounds** — Experience simulated mechanical keyboard sound profiles (Cherry MX Brown, Bubble Pop, Tactile Switch, Vintage Typewriter) with volume adjuster, synthesized natively using the Web Audio API.
- 🚪 **Hover Sidebar Navigation** — Futuristic floating navigation panel that slides in/out automatically via hover indicator areas, complete with smooth animations and layout anti-flicker protection.
- 🏆 **Frictionless Leaderboard** — Filter scoreboards dynamically by **Time Frame** (`daily`, `weekly`, `all-time`) and typing modes. The API automatically deduplicates scores, maintaining only the personal best entry per nickname.
- 📊 **Detailed Post-Game Analytics** — Track your WPM, raw WPM, accuracy %, character breakdown (`correct` / `incorrect` / `extra` / `missed`), and visualize your per-second typing consistency with an aesthetic bar chart.
- ⚡ **Smart Keydown Handling** — Press `Enter` anywhere during gameplay to instantly restart. Disabled automatically on the results screen so you can navigate the score submission form safely.

---

## 🛠️ Tech Stack

| Layer    | Stack                          |
|----------|--------------------------------|
| Frontend | Vue 3, Vite, Tailwind CSS v4   |
| Backend  | Laravel 13 (SQLite), REST API  |
| Font     | JetBrains Mono (Google Fonts)  |

---

## 📁 Project Structure

```
KeeType/
├── backend/          # Laravel API Backend
│   ├── app/
│   │   ├── Models/Leaderboard.php
│   │   └── Http/Controllers/Api/LeaderboardController.php
│   ├── routes/api.php
│   └── database/migrations/
└── frontend/         # Vue 3 SPA Frontend
    ├── src/
    │   ├── components/
    │   │   ├── ModeSelector.vue      # Language, Mode, and Option selector
    │   │   ├── TypingArea.vue        # Active typing test, caret, and animations
    │   │   ├── LeaderboardView.vue   # Global ranking viewer and period filters
    │   │   └── ResultScreen.vue      # Analytics, WPM chart, and Leaderboard
    │   ├── composables/useTypingGame.js # Core game loop, state, and localStorage manager
    │   ├── data/words.js             # English and Indonesian word banks
    │   ├── App.vue                   # Root component & theme switcher
    │   └── style.css                 # Theme CSS variables and keyframe animations
    └── index.html
```

---

## 🚀 Getting Started

### Prerequisites

- PHP 8.2+ & Composer
- Node.js 18+ & npm

### 1. Setup Backend (Laravel API)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
# → Backend runs at http://localhost:8000
```

### 2. Setup Frontend (Vue 3 SPA)

Open a second terminal window:

```bash
cd frontend
npm install
npm run dev
# → Frontend runs at http://localhost:5173
```

Open `http://localhost:5173` in your browser and start typing!

---

## 📡 API Endpoints

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| GET    | `/api/leaderboard` | Fetch top scores grouped by mode   |
| POST   | `/api/leaderboard` | Submit a new score to leaderboard  |

### **GET** `/api/leaderboard`
- **Query Params:** 
  - `mode` (e.g. `time-30`, `words-25`)
  - `period` (e.g. `daily`, `weekly`, `all` — default: `all`)
  - `limit` (default: `10`)

### **POST** `/api/leaderboard`
- **Request Body:**
```json
{
  "nickname": "keefalegends",
  "wpm": 85,
  "accuracy": 97.5,
  "mode": "time-30"
}
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE). Built for speed. ⚡
