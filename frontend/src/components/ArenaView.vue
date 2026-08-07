<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useArenaGame } from '../composables/useArenaGame.js'

import TypingArea from './TypingArea.vue'
import { preloadMp3Sounds } from '../utils/sound.js'

const {
  nickname, roomCode, playerId, isHost, screen,
  room, racers, sortedRacers, myRacer,
  publicRooms, error, loading,
  countdownSeconds,
  raceMode, timeLimit,
  words, currentWordIndex, currentCharIndex, typedChars,
  isTypingActive, localFinished,
  fetchPublicRooms, createRoom, joinRoom, startRace, leaveRoom,
  handleRaceKeyDown,
  getLocalStats,
} = useArenaGame()

// ── Lobby settings ──
const lobbyLanguage      = ref('english')
const lobbyRaceMode      = ref('timer')   // 'words' | 'timer'
const lobbyWordCount     = ref(25)
const lobbyTimeLimit     = ref(60)        // seconds for timer mode
const lobbyBotDifficulty = ref('medium')
const wordCountOptions   = [25, 50, 75, 100]
const timeLimitOptions   = [15, 30, 60, 90]

// ── Nickname warning popup ──
const nicknameWarning = ref(false)
let warningTimer = null
function checkNickname() {
  if (!nickname.value.trim()) {
    nicknameWarning.value = true
    clearTimeout(warningTimer)
    warningTimer = setTimeout(() => { nicknameWarning.value = false }, 3000)
    return false
  }
  return true
}

function tryJoinRoom(roomCode) {
  if (!checkNickname()) return
  joinRoom(roomCode)
}

function tryCreateRoom(lang, wc, diff, mode, time) {
  if (!checkNickname()) return
  createRoom(lang, wc, diff, mode, time)
}

const difficultyOptions = [
  { key: 'easy',        label: 'Easy',        sub: '30–50 wpm' },
  { key: 'medium',      label: 'Medium',      sub: '55–85 wpm' },
  { key: 'hard',        label: 'Hard',        sub: '90–120 wpm' },
  { key: 'player_only', label: 'Players',     sub: 'No Bots' },
]

function getDifficultyBadge(diff) {
  if (diff === 'easy')        return { label: 'Easy' }
  if (diff === 'hard')        return { label: 'Hard' }
  if (diff === 'player_only') return { label: 'Players Only' }
  return { label: 'Medium' }
}


// ── Public room auto-refresh ──
let publicRoomRefresh = null

// Live timer countdown display (reactive via a tick ref)
const _tick = ref(0)
let _tickInterval = null

onMounted(() => {
  preloadMp3Sounds()
  fetchPublicRooms()
  publicRoomRefresh = setInterval(fetchPublicRooms, 4000)
  _tickInterval = setInterval(() => _tick.value++, 200)
  window.addEventListener('keydown', handleRaceKeyDown)
})

onUnmounted(() => {
  clearInterval(publicRoomRefresh)
  clearInterval(_tickInterval)
  window.removeEventListener('keydown', handleRaceKeyDown)
  // Auto-leave room when user navigates away (e.g. switches to Settings, About, etc.)
  // This triggers server cleanup: host leave = delete room, player leave = replace with bot
  if (screen.value !== 'home') {
    leaveRoom()
  }
})

// Stop public room refresh once inside a room
watch(screen, (s) => {
  if (s !== 'home') {
    clearInterval(publicRoomRefresh)
  } else {
    fetchPublicRooms()
    publicRoomRefresh = setInterval(fetchPublicRooms, 4000)
  }
})

// ── Helpers ──
function getRacerColor(racer, index) {
  const colors = ['#dfb15b', '#64b5f6', '#81c784', '#ff8a65']
  return colors[index % colors.length]
}

function getRacerEmoji(racer) {
  if (racer.is_bot) return '🤖'
  if (racer.id === playerId.value) return '⌨️'
  return '👤'
}

function getFinishRank(racer) {
  if (!racer.finished) return null
  const finishedRacers = sortedRacers.value.filter(r => r.finished)
  return finishedRacers.findIndex(r => r.id === racer.id) + 1
}

function getRankMedal(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function isMe(racer) {
  return racer.id === playerId.value
}

function realPlayerCount(room) {
  if (!room) return 0
  return (room.players || []).filter(p => !p.is_bot).length
}

// (tick declared above, interval started in onMounted)

const raceTimeLeft = computed(() => {
  void _tick.value // reactivity trigger
  if (!room.value?.race_starts_at || raceMode.value !== 'timer') return timeLimit.value
  const elapsed = (Date.now() - new Date(room.value.race_starts_at).getTime()) / 1000
  return Math.max(0, Math.ceil(timeLimit.value - elapsed))
})
</script>

<template>
  <div class="w-full mx-auto animate-slide-up">

    <!-- ════════════════════════════════════════════ -->
    <!-- SCREEN: HOME (Lobby + public rooms list)    -->
    <!-- ════════════════════════════════════════════ -->
    <div v-if="screen === 'home'" class="flex flex-col gap-6">

      <!-- Hero Header -->
      <div class="arena-hero">
        <div class="arena-hero__eyebrow">
          <span class="arena-hero__dot"></span>
          <span>Arena</span>
        </div>
        <h2 class="arena-hero__title">Race. Type. Win.</h2>
        <p class="arena-hero__sub">Compete against real players & bots in real-time.</p>
      </div>

      <!-- 2-col: Create Room LEFT + Open Rooms RIGHT -->
      <div class="arena-home-grid">

      <!-- Create Room Card -->
      <div class="arena-create-card">
        <div class="arena-create-card__accent"></div>
        <div class="arena-create-card__body">

          <!-- Header -->
          <div class="flex items-center gap-3" style="margin-bottom: 1.5rem;">
            <div class="arena-create-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div class="text-sm font-bold text-editor-text tracking-wide">Create Room</div>
          </div>

          <!-- Top Row: Nickname (Left) + Language (Right) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" style="margin-bottom: 1.25rem;">
            <!-- Your Nickname -->
            <div class="flex flex-col gap-1.5">
              <label class="arena-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="5"/><path d="M3 21a9 9 0 0 1 18 0"/></svg>
                Your Nickname
              </label>
              <input
                v-model="nickname"
                type="text"
                maxlength="20"
                placeholder="enter nickname..."
                class="arena-input"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <!-- Language segmented control -->
            <div class="flex flex-col gap-1.5">
              <label class="arena-label">Language</label>
              <div class="arena-segment">
                <button
                  v-for="lang in ['english', 'indonesian']"
                  :key="lang"
                  @click="lobbyLanguage = lang"
                  class="arena-segment__btn"
                  :class="lobbyLanguage === lang ? 'arena-segment__btn--active' : ''"
                >
                  <span>{{ lang === 'english' ? 'EN' : 'ID' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Race Mode toggle -->
          <div class="flex flex-col gap-1.5" style="margin-bottom: 1.25rem;">
            <label class="arena-label">Race Mode</label>
            <div class="arena-mode-grid">
              <button
                @click="lobbyRaceMode = 'words'"
                class="arena-mode-btn"
                :class="lobbyRaceMode === 'words' ? 'arena-mode-btn--active' : ''"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h7"/></svg>
                <span>Words</span>
              </button>
              <button
                @click="lobbyRaceMode = 'timer'"
                class="arena-mode-btn"
                :class="lobbyRaceMode === 'timer' ? 'arena-mode-btn--active' : ''"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9.5 3h5"/></svg>
                <span>Timer</span>
              </button>
            </div>
          </div>

          <!-- Word count tile grid (only for words mode) -->
          <div v-if="lobbyRaceMode === 'words'" class="flex flex-col gap-1.5" style="margin-bottom: 1.25rem;">
            <label class="arena-label">Word Count</label>
            <div class="arena-wc-grid">
              <button
                v-for="wc in wordCountOptions"
                :key="wc"
                @click="lobbyWordCount = wc"
                class="arena-wc-btn"
                :class="lobbyWordCount === wc ? 'arena-wc-btn--active' : ''"
              >
                <span class="arena-wc-btn__num">{{ wc }}</span>
                <span class="arena-wc-btn__label">words</span>
              </button>
            </div>
          </div>

          <!-- Timer options (only for timer mode) -->
          <div v-if="lobbyRaceMode === 'timer'" class="flex flex-col gap-1.5" style="margin-bottom: 1.25rem;">
            <label class="arena-label">Time Limit</label>
            <div class="arena-wc-grid">
              <button
                v-for="t in timeLimitOptions"
                :key="t"
                @click="lobbyTimeLimit = t"
                class="arena-wc-btn"
                :class="lobbyTimeLimit === t ? 'arena-wc-btn--active' : ''"
              >
                <span class="arena-wc-btn__num">{{ t }}</span>
                <span class="arena-wc-btn__label">sec</span>
              </button>
            </div>
          </div>

          <!-- Bot Difficulty selector -->
          <div class="flex flex-col gap-1.5" style="margin-bottom: 1.75rem;">
            <label class="arena-label">Bot Difficulty</label>
            <div class="arena-diff-grid">
              <button
                v-for="d in difficultyOptions"
                :key="d.key"
                @click="lobbyBotDifficulty = d.key"
                class="arena-diff-btn"
                :class="[lobbyBotDifficulty === d.key ? 'arena-diff-btn--active' : '', 'arena-diff-btn--' + d.key]"
              >
                <span class="arena-diff-btn__dot"></span>
                <span class="arena-diff-btn__label">{{ d.label }}</span>
                <span class="arena-diff-btn__sub">{{ d.sub }}</span>
              </button>
            </div>
          </div>

          <!-- Create button -->
          <button
            @click="tryCreateRoom(lobbyLanguage, lobbyWordCount, lobbyBotDifficulty, lobbyRaceMode, lobbyTimeLimit)"
            :disabled="loading"
            class="arena-create-btn"
          >
            <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span>{{ loading ? 'Creating...' : 'Create Room' }}</span>
          </button>

        </div><!-- end card__body -->
      </div><!-- end arena-create-card -->

      <!-- Open Rooms -->
      <div class="arena-rooms-panel">
        <!-- Header -->
        <div class="arena-rooms-header">
          <div class="flex items-center gap-2">
            <span class="arena-rooms-live-dot"></span>
            <span class="arena-rooms-title">Open Rooms</span>
          </div>
          <span class="arena-rooms-count" v-if="publicRooms.length > 0">{{ publicRooms.length }}</span>
        </div>

        <!-- Empty -->
        <div v-if="publicRooms.length === 0" class="arena-empty-state">
          <div class="text-2xl mb-2">🏁</div>
          <div style="font-size:0.82rem; color:var(--sub); margin-bottom:0.25rem;">No open rooms yet.</div>
          <div style="font-size:0.72rem; color:var(--sub); opacity:0.6;">Create one and start the race!</div>
        </div>

        <!-- Room cards -->
        <div v-for="r in publicRooms" :key="r.room_code" class="arena-room-card">
          <!-- Top: code + difficulty badge -->
          <div class="arena-room-card__top">
            <span class="arena-room-badge">{{ r.room_code }}</span>
            <span class="arena-diff-badge" :class="'arena-diff-badge--' + (r.bot_difficulty || 'medium')">
              {{ getDifficultyBadge(r.bot_difficulty).label }}
            </span>
          </div>
          <!-- Middle: host + mode info -->
          <div class="arena-room-card__host">{{ r.host_nickname }}'s room</div>
          <div class="arena-room-card__meta">
            <span>{{ r.language === 'english' ? 'EN' : 'ID' }}</span>
            <span class="arena-room-card__dot">·</span>
            <span>{{ r.race_mode === 'timer' ? `${r.time_limit}s timer` : `${r.word_count} words` }}</span>
            <span class="arena-room-card__dot">·</span>
            <span><span style="color:var(--accent); font-weight:700;">{{ r.player_count }}</span>/{{ r.total_slots }} players</span>
          </div>
          <!-- Join button -->
          <button
            @click="tryJoinRoom(r.room_code)"
            :disabled="loading"
            class="arena-room-card__join"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Join Race
          </button>
        </div>

      </div><!-- end Open Rooms -->

      </div><!-- end arena-home-grid -->

      <!-- Error -->
      <p v-if="error" class="text-center text-sm font-medium" style="color:var(--error);">⚠ {{ error }}</p>

    </div><!-- end screen home -->

    <!-- ════════════════════════════════════════════ -->
    <!-- SCREEN: LOBBY (waiting room)               -->
    <!-- ════════════════════════════════════════════ -->
    <div v-else-if="screen === 'lobby'" class="flex flex-col gap-6">

      <!-- Room Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="text-[10px] uppercase tracking-[0.25em] text-editor-sub mb-1">Room Code</div>
          <div class="text-3xl font-bold text-editor-accent font-mono tracking-widest">{{ room?.room_code }}</div>
        </div>
        <div class="flex flex-col items-end gap-1 text-xs text-editor-sub">
          <span>{{ room?.language }} · {{ room?.race_mode === 'timer' ? `${room?.time_limit}s timer` : `${room?.word_count} words` }}</span>
          <span class="arena-diff-badge" :class="'arena-diff-badge--' + (room?.bot_difficulty || 'medium')">
            {{ getDifficultyBadge(room?.bot_difficulty).label }}
          </span>
          <span class="text-editor-accent/70">{{ realPlayerCount(room) }}/{{ room?.bot_difficulty === 'player_only' ? '4' : '4' }} players</span>
        </div>
      </div>

      <!-- Player Slots -->
      <div class="flex flex-col gap-3">
        <div class="text-[10px] uppercase tracking-[0.25em] text-editor-sub flex justify-between items-center">
          <span>Players</span>
          <span v-if="room?.bot_difficulty === 'player_only'" class="text-editor-accent/80 font-normal">Real Players Only</span>
        </div>
        
        <!-- Active Players -->
        <div
          v-for="(racer, idx) in racers"
          :key="racer.id"
          class="arena-player-slot"
          :class="isMe(racer) ? 'arena-player-slot--me' : ''"
        >
          <div class="flex items-center gap-3">
            <div class="arena-player-avatar" :class="racer.is_bot ? 'arena-player-avatar--bot' : isMe(racer) ? 'arena-player-avatar--me' : 'arena-player-avatar--other'" :style="{ '--lane-color': getRacerColor(racer, idx) }">
              <span class="text-xs font-bold">{{ racer.nickname.slice(0,2).toUpperCase() }}</span>
            </div>
            <div>
              <div class="font-semibold text-editor-text text-sm flex items-center gap-2">
                {{ racer.nickname }}
                <span v-if="isMe(racer)" class="arena-tag arena-tag--you">you</span>
                <span v-if="racer.nickname === room?.host_nickname" class="arena-tag">host</span>
              </div>
              <div class="text-xs text-editor-sub">{{ racer.is_bot ? `bot · ${racer.bot_wpm} wpm` : 'ready' }}</div>
            </div>
          </div>
          <div class="arena-player-status" :class="racer.is_bot ? 'arena-player-status--bot' : 'arena-player-status--online'"></div>
        </div>

        <!-- Empty Slot Placeholders (Player Only mode) -->
        <template v-if="room?.bot_difficulty === 'player_only' && racers.length < 4">
          <div
            v-for="emptyIdx in (4 - racers.length)"
            :key="'empty-' + emptyIdx"
            class="arena-player-slot opacity-50 border-dashed"
          >
            <div class="flex items-center gap-3">
              <div class="arena-player-avatar arena-player-avatar--empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M3 21a9 9 0 0 1 18 0"/></svg>
              </div>
              <div>
                <div class="font-semibold text-editor-sub text-sm italic">
                  Waiting for player...
                </div>
                <div class="text-xs text-editor-sub/60">Share room code {{ room?.room_code }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Host Controls -->
      <div v-if="isHost" class="flex flex-col gap-3 mt-2">
        <button
          @click="startRace"
          :disabled="loading || (room?.bot_difficulty === 'player_only' && realPlayerCount(room) < 2)"
          class="arena-btn arena-btn--primary w-full text-base py-3"
        >
          <span v-if="loading">Starting...</span>
          <template v-else-if="room?.bot_difficulty === 'player_only' && realPlayerCount(room) < 2">
            <span class="opacity-70">Start Race &nbsp;·&nbsp; Need 2+ players</span>
          </template>
          <span v-else>Start Race</span>
        </button>
        <p v-if="room?.bot_difficulty !== 'player_only'" class="text-xs text-editor-sub text-center">
          Bots fill empty slots and race too
        </p>
      </div>
      <div v-else class="text-center text-sm text-editor-sub py-2">
        Waiting for host to start the race...
      </div>

      <p v-if="error" class="text-center text-editor-error text-sm">⚠ {{ error }}</p>

      <button @click="leaveRoom" class="arena-btn arena-btn--leave w-full">
        Leave Room
      </button>
    </div>

    <!-- ════════════════════════════════════════════ -->
    <!-- SCREEN: COUNTDOWN                          -->
    <!-- ════════════════════════════════════════════ -->
    <div v-else-if="screen === 'countdown'" class="flex flex-col items-center justify-center gap-6 min-h-64">
      <div class="text-[10px] uppercase tracking-[0.3em] text-editor-sub">Race starting in</div>
      <div class="text-8xl font-bold text-editor-accent animate-pulse font-mono">
        {{ countdownSeconds > 0 ? countdownSeconds : 'GO!' }}
      </div>
      <div class="text-sm text-editor-sub">Get your fingers ready...</div>
    </div>

    <!-- ════════════════════════════════════════════ -->
    <!-- SCREEN: RACING                             -->
    <!-- ════════════════════════════════════════════ -->
    <div v-else-if="screen === 'racing'" class="flex flex-col gap-6">

      <!-- Race Track -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between mb-1">
          <div class="text-[10px] uppercase tracking-[0.25em] text-editor-sub">Live Race</div>
          <!-- Timer display for timer mode -->
          <div v-if="raceMode === 'timer'" class="flex items-center gap-1.5">
            <span class="text-sm">⏱</span>
            <span class="text-sm font-bold tabular-nums text-editor-accent">{{ raceTimeLeft }}s</span>
          </div>
          <!-- Word count progress for words mode -->
          <div v-else class="text-[10px] text-editor-sub tabular-nums">
            {{ currentWordIndex }} / {{ words.length }} words
          </div>
        </div>

        <div
          v-for="(racer, idx) in racers"
          :key="racer.id"
          class="arena-track-lane"
        >
          <!-- Racer info left -->
          <div class="flex items-center gap-2 w-28 flex-shrink-0">
            <span class="arena-racer-init" :class="racer.is_bot ? 'arena-racer-init--bot' : isMe(racer) ? 'arena-racer-init--me' : 'arena-racer-init--other'">{{ racer.nickname.slice(0,2).toUpperCase() }}</span>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-editor-text truncate">
                {{ isMe(racer) ? 'You' : racer.nickname }}
              </div>
              <div class="text-[10px] text-editor-sub tabular-nums">{{ racer.is_bot ? racer.bot_wpm : (racer.wpm || 0) }} wpm</div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="flex-1 relative">
            <div class="arena-track-bg"></div>
            <div
              class="arena-track-fill"
              :style="{
                width: `${Math.min(100, racer.progress || 0)}%`,
                background: getRacerColor(racer, idx),
              }"
            ></div>
            <!-- Car icon at position -->
            <div
              class="arena-car"
              :style="{
                left: `calc(${Math.min(100, racer.progress || 0)}% - 14px)`,
                color: getRacerColor(racer, idx),
              }"
            >🏎</div>
          </div>

          <!-- Status / rank right -->
          <div class="w-10 flex-shrink-0 text-right text-xs text-editor-sub tabular-nums">
            <span v-if="racer.finished" class="text-base">{{ getRankMedal(getFinishRank(racer)) }}</span>
            <span v-else>{{ Math.round(racer.progress || 0) }}%</span>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-px bg-editor-sub/15"></div>

      <!-- Typing Area -->
      <div v-if="!localFinished">
        <TypingArea
          :words="words"
          :currentWordIndex="currentWordIndex"
          :currentCharIndex="currentCharIndex"
          :typedChars="typedChars"
          :isActive="isTypingActive"
          :isFinished="localFinished"
        />
        <div class="mt-4 text-xs text-editor-sub text-center">
          <span v-if="!isTypingActive">start typing to race</span>
          <span v-else>keep going!</span>
        </div>
      </div>
      <div v-else class="text-center text-editor-accent font-bold text-xl py-6">
        🏁 You finished! Waiting for others...
      </div>
    </div>

    <!-- ════════════════════════════════════════════ -->
    <!-- SCREEN: FINISHED (Podium)                  -->
    <!-- ════════════════════════════════════════════ -->
    <div v-else-if="screen === 'finished'" class="flex flex-col items-center gap-8">

      <!-- Title -->
      <div class="text-center">
        <div class="text-4xl mb-2">🏁</div>
        <h2 class="text-2xl font-bold text-editor-text">Race Finished!</h2>
        <p class="text-sm text-editor-sub mt-1">Final standings</p>
      </div>

      <!-- Podium -->
      <div class="w-full flex flex-col gap-3">
        <div
          v-for="(racer, idx) in sortedRacers"
          :key="racer.id"
          class="arena-result-row"
          :class="{
            'arena-result-row--winner': idx === 0,
            'arena-result-row--me': isMe(racer)
          }"
        >
          <div class="text-2xl w-10 text-center flex-shrink-0">{{ getRankMedal(idx + 1) }}</div>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="arena-racer-init" :class="racer.is_bot ? 'arena-racer-init--bot' : isMe(racer) ? 'arena-racer-init--me' : 'arena-racer-init--other'">{{ racer.nickname.slice(0,2).toUpperCase() }}</span>
            <div class="min-w-0">
              <div class="font-bold text-editor-text text-sm truncate">
                {{ racer.nickname }}
                <span v-if="isMe(racer)" class="ml-1 text-[10px] text-editor-accent">(you)</span>
              </div>
              <div class="text-xs text-editor-sub">{{ racer.is_bot ? 'Bot' : 'Player' }}</div>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="font-bold text-editor-accent tabular-nums">{{ racer.is_bot ? racer.bot_wpm : (racer.wpm || 0) }} <span class="text-xs text-editor-sub font-normal">wpm</span></div>
            <div class="text-xs text-editor-sub tabular-nums">{{ racer.accuracy || 100 }}% acc</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3 w-full">
        <button
          v-if="isHost"
          @click="startRace"
          :disabled="loading || (room?.bot_difficulty === 'player_only' && realPlayerCount(room) < 2)"
          class="arena-btn arena-btn--primary w-full"
        >
          <span v-if="loading">Starting...</span>
          <template v-else-if="room?.bot_difficulty === 'player_only' && realPlayerCount(room) < 2">
            <span class="opacity-70">Rematch &nbsp;·&nbsp; Need 2+ players</span>
          </template>
          <span v-else>Rematch</span>
        </button>
        <p v-if="!isHost" class="text-xs text-editor-sub text-center">
          Waiting for host to restart the race...
        </p>
        <button @click="leaveRoom" class="arena-btn arena-btn--leave w-full">
          Leave Room
        </button>
      </div>
    </div>

    <!-- ── Nickname warning toast ── -->
    <Transition name="toast">
      <div v-if="nicknameWarning" class="arena-nickname-toast">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Enter your nickname first!</span>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ARENA — Design System (Theme-Adaptive)
   Font: Sora | Colors: CSS custom properties
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* Sora font on all arena elements */
.arena-hero, .arena-home-grid, .arena-create-card,
.arena-rooms-panel, .arena-label, .arena-input,
.arena-segment, .arena-segment__btn, .arena-mode-btn,
.arena-wc-btn, .arena-diff-btn, .arena-create-btn,
.arena-btn, .arena-room-row, .arena-player-slot,
.arena-result-row, .arena-pill, .arena-info-pill,
.arena-tag, .arena-empty-state, .arena-hero-badge,
.arena-room-card, .arena-room-card__join { font-family: 'Sora', sans-serif; }

/* ── Rooms panel header ── */
.arena-rooms-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.75rem;
}
.arena-rooms-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  animation: pulse-dot 2s ease-in-out infinite;
  flex-shrink: 0;
}
.arena-rooms-title {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--sub); font-family: 'Sora', sans-serif;
}
.arena-rooms-count {
  font-size: 0.62rem; font-weight: 800; font-family: 'Sora', sans-serif;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: 999px; padding: 0.05rem 0.45rem; letter-spacing: 0;
}

/* ── Room card (vertical layout) ── */
.arena-room-card {
  background: color-mix(in srgb, var(--bg) 80%, var(--sub));
  border: 1px solid color-mix(in srgb, var(--sub) 16%, transparent);
  border-radius: 10px; padding: 0.85rem 0.9rem;
  display: flex; flex-direction: column; gap: 0.35rem;
  transition: border-color 0.14s, background 0.14s;
  cursor: default;
}
.arena-room-card:hover {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: color-mix(in srgb, var(--accent) 4%, transparent);
}
.arena-room-card__top {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}
.arena-room-card__host {
  font-size: 0.8rem; font-weight: 700; color: var(--text);
  font-family: 'Sora', sans-serif; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.arena-room-card__meta {
  display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;
  font-size: 0.68rem; color: var(--sub); font-family: 'Sora', sans-serif;
}
.arena-room-card__dot { opacity: 0.4; }
.arena-room-card__join {
  margin-top: 0.35rem; width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.48rem 0.75rem; border-radius: 7px; border: none;
  background: var(--accent); color: var(--bg);
  font-size: 0.72rem; font-weight: 700; cursor: pointer;
  transition: all 0.14s; letter-spacing: 0.04em;
  box-shadow: 0 1px 6px color-mix(in srgb, var(--accent) 22%, transparent);
}
.arena-room-card__join:hover:not(:disabled) {
  opacity: 0.88; transform: translateY(-1px);
  box-shadow: 0 3px 10px color-mix(in srgb, var(--accent) 32%, transparent);
}
.arena-room-card__join:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

/* ── Nickname warning toast ── */
.arena-nickname-toast {
  position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 0.6rem;
  background: #1c1c1e; color: #fff;
  padding: 0.7rem 1.2rem; border-radius: 12px;
  font-size: 0.82rem; font-weight: 600; font-family: 'Sora', sans-serif;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  z-index: 999; white-space: nowrap;
  border: 1px solid rgba(255,255,255,0.08);
}
.toast-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from  { opacity: 0; transform: translateX(-50%) translateY(12px); }
.toast-leave-to    { opacity: 0; transform: translateX(-50%) translateY(6px); }

/* ── Hero ── */
.arena-hero { text-align: center; padding: 0.25rem 0 1rem; }
.arena-hero__eyebrow {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-size: 0.65rem; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--accent);
  margin-bottom: 0.6rem; font-family: 'Sora', sans-serif;
}
.arena-hero__dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.75); }
}
.arena-hero__title {
  font-size: 2.6rem; font-weight: 800; letter-spacing: -0.04em;
  color: var(--text); line-height: 1.05;
  margin-bottom: 0.45rem; font-family: 'Sora', sans-serif;
}
.arena-hero__sub {
  font-size: 0.85rem; color: var(--sub);
  font-weight: 400; font-family: 'Sora', sans-serif;
}

/* ── Home 2-col grid (65/35) ── */
.arena-home-grid {
  display: grid; grid-template-columns: 1fr 260px;
  gap: 1.25rem; align-items: start;
}
@media (max-width: 640px) { .arena-home-grid { grid-template-columns: 1fr; } }

/* ── Create Room Card ── */
.arena-create-card {
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--sub) 18%, transparent);
  overflow: hidden; position: relative;
  box-shadow: 0 2px 16px color-mix(in srgb, var(--sub) 10%, transparent);
}
.arena-create-card__accent {
  height: 3px;
  background: linear-gradient(90deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 55%, transparent) 70%, transparent 100%);
}
.arena-create-card__body {
  padding: 1.75rem 1.75rem 2rem;
  background: color-mix(in srgb, var(--bg) 97%, var(--sub));
}
.arena-create-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent); flex-shrink: 0;
}

/* ── Labels ── */
.arena-label {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.16em;
  color: var(--sub); font-weight: 600; font-family: 'Sora', sans-serif;
}

/* ── Inputs ── */
.arena-input {
  width: 100%;
  background: color-mix(in srgb, var(--bg) 85%, var(--sub));
  border: 1.5px solid color-mix(in srgb, var(--sub) 22%, transparent);
  border-radius: 10px; padding: 0.7rem 1rem;
  color: var(--text); font-family: 'Sora', sans-serif;
  font-size: 0.9rem; font-weight: 600;
  transition: border-color 0.15s, box-shadow 0.15s; outline: none;
}
.arena-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
  background: color-mix(in srgb, var(--bg) 98%, var(--sub));
}
.arena-input::placeholder { color: color-mix(in srgb, var(--sub) 50%, transparent); font-weight: 400; }

/* ── Language segment ── */
.arena-segment {
  display: flex;
  background: color-mix(in srgb, var(--sub) 10%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--sub) 18%, transparent);
  border-radius: 10px; padding: 3px; gap: 3px;
}
.arena-segment__btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 0.35rem; padding: 0.45rem 0.75rem; border-radius: 7px;
  font-size: 0.8rem; font-weight: 700; font-family: 'Sora', sans-serif;
  cursor: pointer; border: none; background: transparent;
  color: var(--sub); transition: all 0.12s; letter-spacing: 0.05em;
}
.arena-segment__btn:hover:not(.arena-segment__btn--active) {
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
.arena-segment__btn--active {
  background: var(--accent); color: var(--bg);
  box-shadow: 0 1px 6px color-mix(in srgb, var(--accent) 30%, transparent);
  font-weight: 800;
}

/* ── Race Mode ── */
.arena-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.arena-mode-btn {
  display: flex; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 0.7rem 1rem; border-radius: 10px;
  border: 1.5px solid color-mix(in srgb, var(--sub) 18%, transparent);
  background: color-mix(in srgb, var(--bg) 80%, var(--sub));
  color: var(--sub); font-size: 0.78rem; font-weight: 700;
  font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.14s;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.arena-mode-btn:hover:not(.arena-mode-btn--active) {
  border-color: color-mix(in srgb, var(--sub) 35%, transparent);
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 95%, var(--sub));
}
.arena-mode-btn--active {
  border-color: var(--accent); border-width: 2px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

/* ── Word Count ── */
.arena-wc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
.arena-wc-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 0.9rem 0.2rem; border-radius: 10px;
  border: 1.5px solid color-mix(in srgb, var(--sub) 18%, transparent);
  background: color-mix(in srgb, var(--bg) 80%, var(--sub));
  cursor: pointer; transition: all 0.12s; gap: 0.2rem; font-family: 'Sora', sans-serif;
}
.arena-wc-btn:hover:not(.arena-wc-btn--active) {
  border-color: color-mix(in srgb, var(--sub) 35%, transparent);
  background: color-mix(in srgb, var(--bg) 95%, var(--sub));
}
.arena-wc-btn--active {
  border-color: var(--accent); border-width: 2px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.arena-wc-btn__num {
  font-size: 1.25rem; font-weight: 800; color: var(--text);
  line-height: 1; font-family: 'Sora', sans-serif;
}
.arena-wc-btn--active .arena-wc-btn__num { color: var(--accent); }
.arena-wc-btn__label {
  font-size: 0.57rem; color: var(--sub);
  text-transform: uppercase; letter-spacing: 0.07em; font-weight: 500;
}
.arena-wc-btn--active .arena-wc-btn__label { color: color-mix(in srgb, var(--accent) 70%, transparent); }

/* ── Bot Difficulty ── */
.arena-diff-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
.arena-diff-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 0.85rem 0.25rem; border-radius: 10px;
  border: 1.5px solid color-mix(in srgb, var(--sub) 18%, transparent);
  background: color-mix(in srgb, var(--bg) 80%, var(--sub));
  cursor: pointer; transition: all 0.12s; gap: 0.28rem; font-family: 'Sora', sans-serif;
}
.arena-diff-btn:hover:not(.arena-diff-btn--active) {
  border-color: color-mix(in srgb, var(--sub) 35%, transparent);
  background: color-mix(in srgb, var(--bg) 95%, var(--sub));
}
.arena-diff-btn--active {
  border-color: var(--accent); border-width: 2px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.arena-diff-btn__dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: color-mix(in srgb, var(--sub) 30%, transparent);
  transition: background 0.12s;
}
.arena-diff-btn--easy        .arena-diff-btn__dot { background: #4ade80; }
.arena-diff-btn--medium      .arena-diff-btn__dot { background: #facc15; }
.arena-diff-btn--hard        .arena-diff-btn__dot { background: #f87171; }
.arena-diff-btn--player_only .arena-diff-btn__dot { background: var(--accent); }
.arena-diff-btn__label {
  font-size: 0.7rem; font-weight: 700; color: var(--text);
  line-height: 1; font-family: 'Sora', sans-serif;
}
.arena-diff-btn--active .arena-diff-btn__label { color: var(--accent); }
.arena-diff-btn__sub {
  font-size: 0.56rem; color: var(--sub);
  font-family: 'JetBrains Mono', monospace; font-weight: 500;
}

/* ── Create CTA button ── */
.arena-create-btn {
  width: 100%; display: flex; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 0.85rem 1rem; border-radius: 12px;
  font-size: 0.82rem; font-weight: 700; font-family: 'Sora', sans-serif;
  cursor: pointer; border: none;
  background: var(--accent); color: var(--bg);
  transition: all 0.15s; letter-spacing: 0.06em; text-transform: uppercase;
  box-shadow: 0 2px 12px color-mix(in srgb, var(--accent) 28%, transparent);
}
.arena-create-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 4px 18px color-mix(in srgb, var(--accent) 38%, transparent);
  transform: translateY(-1px);
}
.arena-create-btn:active:not(:disabled) { transform: translateY(0); }
.arena-create-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

/* ── Open Rooms panel ── */
.arena-rooms-panel {
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--sub) 16%, transparent);
  padding: 1.4rem 1.2rem;
  background: color-mix(in srgb, var(--bg) 97%, var(--sub));
  display: flex; flex-direction: column; gap: 0.5rem;
  min-height: 220px; max-height: 520px; overflow-y: auto;
  box-shadow: 0 2px 12px color-mix(in srgb, var(--sub) 8%, transparent);
}

/* ── Difficulty Badges ── */
.arena-diff-badge {
  font-size: 0.6rem; padding: 0.1rem 0.4rem; border-radius: 4px;
  font-weight: 700; font-family: 'Sora', sans-serif;
  border: 1px solid color-mix(in srgb, var(--sub) 20%, transparent);
  color: var(--sub);
  background: color-mix(in srgb, var(--sub) 7%, transparent);
  display: inline-flex; align-items: center;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.arena-diff-badge--easy        { color: #4ade80; border-color: color-mix(in srgb, #4ade80 35%, transparent); background: color-mix(in srgb, #4ade80 10%, transparent); }
.arena-diff-badge--medium      { color: #facc15; border-color: color-mix(in srgb, #facc15 35%, transparent); background: color-mix(in srgb, #facc15 10%, transparent); }
.arena-diff-badge--hard        { color: #f87171; border-color: color-mix(in srgb, #f87171 35%, transparent); background: color-mix(in srgb, #f87171 10%, transparent); }
.arena-diff-badge--player_only { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 30%, transparent); background: color-mix(in srgb, var(--accent) 8%, transparent); }

/* ── Tags ── */
.arena-tag {
  font-size: 0.56rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; padding: 0.1rem 0.35rem; border-radius: 4px;
  background: color-mix(in srgb, var(--sub) 10%, transparent);
  color: var(--sub);
  border: 1px solid color-mix(in srgb, var(--sub) 20%, transparent);
  font-family: 'Sora', sans-serif;
}
.arena-tag--you {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 28%, transparent);
}

/* ── Empty state ── */
.arena-empty-state {
  text-align: center; padding: 2.5rem 1rem;
  color: var(--sub); font-size: 0.82rem; font-family: 'Sora', sans-serif;
}

/* ── Buttons ── */
.arena-btn {
  padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.78rem;
  font-weight: 700; font-family: 'Sora', sans-serif; cursor: pointer;
  border: 1.5px solid color-mix(in srgb, var(--sub) 25%, transparent);
  color: var(--sub);
  background: color-mix(in srgb, var(--bg) 80%, var(--sub));
  transition: all 0.14s; letter-spacing: 0.02em;
}
.arena-btn:hover:not(:disabled) {
  color: var(--text);
  border-color: color-mix(in srgb, var(--sub) 45%, transparent);
  background: color-mix(in srgb, var(--bg) 95%, var(--sub));
}
.arena-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.arena-btn--primary {
  background: var(--accent); border-color: var(--accent);
  color: var(--bg); letter-spacing: 0.05em; text-transform: uppercase;
}
.arena-btn--primary:hover:not(:disabled) { opacity: 0.88; color: var(--bg); }
.arena-btn--sm { padding: 0.3rem 0.75rem; font-size: 0.72rem; }
.arena-btn--leave {
  border-color: color-mix(in srgb, #f87171 30%, transparent);
  color: #f87171;
  background: color-mix(in srgb, #f87171 6%, transparent);
}
.arena-btn--leave:hover:not(:disabled) {
  background: color-mix(in srgb, #f87171 14%, transparent);
  border-color: color-mix(in srgb, #f87171 55%, transparent);
}

/* ── Public Rooms ── */
.arena-room-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; padding: 0.75rem 0.85rem; border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--sub) 16%, transparent);
  background: color-mix(in srgb, var(--bg) 80%, var(--sub));
  transition: all 0.14s;
}
.arena-room-row:hover {
  border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}
.arena-room-badge {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
  border-radius: 6px; font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.45rem;
  letter-spacing: 0.14em; flex-shrink: 0;
}

/* ── Hero badge ── */
.arena-hero-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.85rem; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--accent); font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; font-family: 'Sora', sans-serif;
}

/* ── Lobby player slots ── */
.arena-player-slot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.8rem 1rem; border-radius: 10px;
  border: 1.5px solid color-mix(in srgb, var(--sub) 16%, transparent);
  background: color-mix(in srgb, var(--bg) 80%, var(--sub));
  transition: all 0.14s;
}
.arena-player-slot--me {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}
.arena-player-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  border: 2px solid var(--lane-color, color-mix(in srgb, var(--sub) 35%, transparent));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-family: 'Sora', sans-serif; font-size: 0.65rem; font-weight: 700;
}
.arena-player-avatar--me    { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); }
.arena-player-avatar--other { border-color: color-mix(in srgb, var(--sub) 35%, transparent); color: var(--sub); }
.arena-player-avatar--bot   { border-color: color-mix(in srgb, var(--sub) 22%, transparent); color: color-mix(in srgb, var(--sub) 50%, transparent); border-style: dashed; }
.arena-player-avatar--empty { border-color: color-mix(in srgb, var(--sub) 18%, transparent); color: color-mix(in srgb, var(--sub) 35%, transparent); border-style: dashed; }
.arena-player-status { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.arena-player-status--online { background: #4ade80; box-shadow: 0 0 5px #4ade8060; }
.arena-player-status--bot    { background: color-mix(in srgb, var(--sub) 30%, transparent); }

/* ── Racer bubbles ── */
.arena-racer-init {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%; font-size: 0.6rem;
  font-weight: 800; font-family: 'Sora', sans-serif; flex-shrink: 0;
}
.arena-racer-init--me    { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); border: 1.5px solid color-mix(in srgb, var(--accent) 35%, transparent); }
.arena-racer-init--other { background: color-mix(in srgb, var(--sub) 8%, transparent); color: var(--text); border: 1.5px solid color-mix(in srgb, var(--sub) 22%, transparent); }
.arena-racer-init--bot   { background: color-mix(in srgb, var(--sub) 5%, transparent); color: color-mix(in srgb, var(--sub) 50%, transparent); border: 1.5px dashed color-mix(in srgb, var(--sub) 18%, transparent); }

/* ── Race Track ── */
.arena-track-lane { display: flex; align-items: center; gap: 0.75rem; }
.arena-track-bg { position: absolute; inset: 0; border-radius: 999px; background: color-mix(in srgb, var(--sub) 12%, transparent); }
.arena-track-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 999px; transition: width 0.1s ease-out; opacity: 0.9; }
.arena-track-lane > .flex-1 { position: relative; height: 8px; border-radius: 999px; }
.arena-car { position: absolute; top: 50%; transform: translateY(-50%); font-size: 0.95rem; line-height: 1; transition: left 0.1s ease-out; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.2)); }

/* ── Podium / Result rows ── */
.arena-result-row {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1rem;
  border-radius: 10px;
  border: 1.5px solid color-mix(in srgb, var(--sub) 16%, transparent);
  border-left-width: 3px;
  background: color-mix(in srgb, var(--bg) 80%, var(--sub));
  transition: all 0.14s;
}
.arena-result-row--winner { border-color: color-mix(in srgb, #dfb15b 40%, transparent); border-left-color: #dfb15b; background: color-mix(in srgb, #dfb15b 6%, transparent); }
.arena-result-row--me     { border-left-color: var(--accent); }

/* ── Legacy misc ── */
.arena-card {
  background: color-mix(in srgb, var(--bg) 92%, var(--sub));
  border: 1px solid color-mix(in srgb, var(--sub) 16%, transparent);
  border-radius: 14px; padding: 1.4rem;
  box-shadow: 0 1px 6px color-mix(in srgb, var(--sub) 8%, transparent);
}
.arena-card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; font-size: 0.9rem; }
.arena-pill {
  padding: 0.25rem 0.85rem; border-radius: 999px;
  border: 1.5px solid color-mix(in srgb, var(--sub) 25%, transparent);
  color: var(--sub); font-size: 0.76rem; cursor: pointer;
  transition: all 0.14s; background: transparent; font-family: 'Sora', sans-serif;
}
.arena-pill:hover { color: var(--text); border-color: color-mix(in srgb, var(--sub) 45%, transparent); }
.arena-pill--active { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.arena-info-pill {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.85rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--sub) 7%, transparent);
  border: 1px solid color-mix(in srgb, var(--sub) 14%, transparent);
  font-size: 0.74rem; color: var(--sub); line-height: 1.3;
  font-family: 'Sora', sans-serif;
}
</style>
