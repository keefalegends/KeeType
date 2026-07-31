<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useArenaGame } from '../composables/useArenaGame.js'
import TypingArea from './TypingArea.vue'

const {
  nickname, roomCode, playerId, isHost, screen,
  room, racers, sortedRacers, myRacer,
  publicRooms, error, loading,
  countdownSeconds,
  words, currentWordIndex, currentCharIndex, typedChars,
  isTypingActive, localFinished,
  fetchPublicRooms, createRoom, joinRoom, startRace, leaveRoom,
  handleRaceKeyDown,
  getLocalStats,
} = useArenaGame()

// ── Lobby settings ──
const lobbyLanguage  = ref('english')
const lobbyWordCount = ref(25)
const wordCountOptions = [25, 50, 75, 100]

// ── Public room auto-refresh ──
let publicRoomRefresh = null

onMounted(() => {
  fetchPublicRooms()
  publicRoomRefresh = setInterval(fetchPublicRooms, 4000)
  window.addEventListener('keydown', handleRaceKeyDown)
})

onUnmounted(() => {
  clearInterval(publicRoomRefresh)
  window.removeEventListener('keydown', handleRaceKeyDown)
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
</script>

<template>
  <div class="w-full max-w-3xl mx-auto animate-slide-up">

    <!-- ════════════════════════════════════════════ -->
    <!-- SCREEN: HOME (Lobby + public rooms list)    -->
    <!-- ════════════════════════════════════════════ -->
    <div v-if="screen === 'home'" class="flex flex-col gap-8">

      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center gap-3 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-editor-accent">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <h2 class="text-2xl font-bold text-editor-text tracking-tight">Arena</h2>
        </div>
        <p class="text-sm text-editor-sub">Race against real players & bots. No login needed.</p>
      </div>

      <!-- Nickname Input -->
      <div class="flex flex-col gap-2">
        <label class="text-[10px] uppercase tracking-[0.25em] text-editor-sub font-semibold">Your Nickname</label>
        <input
          v-model="nickname"
          type="text"
          maxlength="20"
          placeholder="enter nickname..."
          class="arena-input text-center text-lg font-bold"
          @keyup.enter="nickname = nickname.trim()"
        />
        <p class="text-xs text-editor-sub/60 text-center">letters, numbers, underscores only</p>
      </div>

      <!-- Create Room Card -->
      <div class="arena-card">
        <div class="arena-card-header">
          <span class="text-editor-accent">⚔️</span>
          <span class="font-semibold text-editor-text">Create New Room</span>
        </div>

        <!-- Language -->
        <div class="flex flex-col gap-2 mb-4">
          <label class="text-[10px] uppercase tracking-[0.2em] text-editor-sub">Language</label>
          <div class="flex gap-2">
            <button
              v-for="lang in ['english', 'indonesian']"
              :key="lang"
              @click="lobbyLanguage = lang"
              class="arena-pill"
              :class="lobbyLanguage === lang ? 'arena-pill--active' : ''"
            >{{ lang }}</button>
          </div>
        </div>

        <!-- Word Count -->
        <div class="flex flex-col gap-2 mb-5">
          <label class="text-[10px] uppercase tracking-[0.2em] text-editor-sub">Words</label>
          <div class="flex gap-2">
            <button
              v-for="wc in wordCountOptions"
              :key="wc"
              @click="lobbyWordCount = wc"
              class="arena-pill"
              :class="lobbyWordCount === wc ? 'arena-pill--active' : ''"
            >{{ wc }}</button>
          </div>
        </div>

        <button
          @click="createRoom(lobbyLanguage, lobbyWordCount)"
          :disabled="loading || !nickname.trim()"
          class="arena-btn arena-btn--primary w-full"
        >
          <span v-if="loading">Creating...</span>
          <span v-else>Create Room</span>
        </button>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-center text-editor-error text-sm animate-pulse">⚠ {{ error }}</p>

      <!-- Public Rooms List -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="h-px bg-editor-sub/20 flex-1"></div>
          <span class="text-[10px] uppercase tracking-[0.25em] text-editor-sub">Open Rooms</span>
          <div class="h-px bg-editor-sub/20 flex-1"></div>
        </div>

        <div v-if="publicRooms.length === 0" class="text-center text-editor-sub/60 text-sm py-6">
          No open rooms yet. Create one!
        </div>

        <div v-for="r in publicRooms" :key="r.room_code" class="arena-room-row">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="arena-room-badge">{{ r.room_code }}</div>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-editor-text truncate">{{ r.host_nickname }}'s room</div>
              <div class="text-xs text-editor-sub">{{ r.language }} · {{ r.word_count }} words</div>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="text-xs text-editor-sub">
              <span class="text-editor-accent font-bold">{{ r.player_count }}</span>/{{ r.total_slots }} players
            </div>
            <button
              @click="joinRoom(r.room_code)"
              :disabled="loading || !nickname.trim()"
              class="arena-btn arena-btn--sm"
            >Join</button>
          </div>
        </div>
      </div>
    </div>

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
          <span>{{ room?.language }} · {{ room?.word_count }} words</span>
          <span class="text-editor-accent/70">{{ realPlayerCount(room) }}/4 players</span>
        </div>
      </div>

      <!-- Player Slots -->
      <div class="flex flex-col gap-3">
        <div class="text-[10px] uppercase tracking-[0.25em] text-editor-sub">Players</div>
        <div
          v-for="(racer, idx) in racers"
          :key="racer.id"
          class="arena-player-slot"
          :class="isMe(racer) ? 'arena-player-slot--me' : ''"
        >
          <div class="flex items-center gap-3">
            <div class="arena-player-avatar" :style="{ borderColor: getRacerColor(racer, idx) }">
              {{ getRacerEmoji(racer) }}
            </div>
            <div>
              <div class="font-semibold text-editor-text text-sm">
                {{ racer.nickname }}
                <span v-if="isMe(racer)" class="ml-1 text-[10px] text-editor-accent uppercase tracking-widest">(you)</span>
                <span v-if="racer.nickname === room?.host_nickname" class="ml-1 text-[10px] text-editor-sub uppercase tracking-widest">host</span>
              </div>
              <div class="text-xs text-editor-sub">{{ racer.is_bot ? `Bot · ${racer.bot_wpm} WPM target` : 'ready' }}</div>
            </div>
          </div>
          <div class="w-2 h-2 rounded-full" :style="{ background: racer.is_bot ? 'var(--color-editor-sub)' : 'var(--color-editor-accent)' }"></div>
        </div>
      </div>

      <!-- Host Controls -->
      <div v-if="isHost" class="flex flex-col gap-3 mt-2">
        <button
          @click="startRace"
          :disabled="loading"
          class="arena-btn arena-btn--primary w-full text-base py-3"
        >
          <span v-if="loading">Starting...</span>
          <span v-else>🚀 Start Race!</span>
        </button>
        <p class="text-xs text-editor-sub text-center">Bots fill empty slots and race too</p>
      </div>
      <div v-else class="text-center text-sm text-editor-sub py-2">
        Waiting for host to start the race...
      </div>

      <p v-if="error" class="text-center text-editor-error text-sm">⚠ {{ error }}</p>

      <button @click="leaveRoom" class="text-xs text-editor-sub hover:text-editor-text transition-colors text-center underline underline-offset-2 cursor-pointer">
        Leave room
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
        <div class="text-[10px] uppercase tracking-[0.25em] text-editor-sub mb-1">Live Race</div>

        <div
          v-for="(racer, idx) in racers"
          :key="racer.id"
          class="arena-track-lane"
        >
          <!-- Racer info left -->
          <div class="flex items-center gap-2 w-28 flex-shrink-0">
            <span class="text-base">{{ getRacerEmoji(racer) }}</span>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-editor-text truncate">
                {{ isMe(racer) ? 'You' : racer.nickname }}
              </div>
              <div class="text-[10px] text-editor-sub tabular-nums">{{ racer.wpm || 0 }} wpm</div>
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
            <span class="text-lg">{{ getRacerEmoji(racer) }}</span>
            <div class="min-w-0">
              <div class="font-bold text-editor-text text-sm truncate">
                {{ racer.nickname }}
                <span v-if="isMe(racer)" class="ml-1 text-[10px] text-editor-accent">(you)</span>
              </div>
              <div class="text-xs text-editor-sub">{{ racer.is_bot ? 'Bot' : 'Player' }}</div>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="font-bold text-editor-accent tabular-nums">{{ racer.wpm || 0 }} <span class="text-xs text-editor-sub font-normal">wpm</span></div>
            <div class="text-xs text-editor-sub tabular-nums">{{ racer.accuracy || 100 }}% acc</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 w-full">
        <button @click="leaveRoom" class="arena-btn flex-1">Back to Lobby</button>
        <button @click="createRoom(room?.language || 'english', room?.word_count || 25)" class="arena-btn arena-btn--primary flex-1">
          Play Again
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Inputs ── */
.arena-input {
  width: 100%;
  background: color-mix(in srgb, var(--color-editor-bg) 80%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--color-editor-sub) 25%, transparent);
  border-radius: 10px;
  padding: 0.65rem 1rem;
  color: var(--color-editor-text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.arena-input:focus {
  border-color: var(--color-editor-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-editor-accent) 15%, transparent);
}

/* ── Cards ── */
.arena-card {
  background: color-mix(in srgb, var(--color-editor-bg) 85%, var(--color-editor-sub));
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 20%, transparent);
  border-radius: 14px;
  padding: 1.5rem;
}
.arena-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

/* ── Pills ── */
.arena-pill {
  padding: 0.25rem 0.85rem;
  border-radius: 999px;
  border: 1.5px solid color-mix(in srgb, var(--color-editor-sub) 30%, transparent);
  color: var(--color-editor-sub);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
  background: transparent;
}
.arena-pill:hover {
  color: var(--color-editor-text);
  border-color: color-mix(in srgb, var(--color-editor-sub) 50%, transparent);
}
.arena-pill--active {
  border-color: var(--color-editor-accent);
  color: var(--color-editor-accent);
  background: color-mix(in srgb, var(--color-editor-accent) 10%, transparent);
}

/* ── Buttons ── */
.arena-btn {
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid color-mix(in srgb, var(--color-editor-sub) 30%, transparent);
  color: var(--color-editor-sub);
  background: transparent;
  transition: all 0.15s;
  font-family: inherit;
}
.arena-btn:hover:not(:disabled) {
  color: var(--color-editor-text);
  border-color: color-mix(in srgb, var(--color-editor-sub) 60%, transparent);
}
.arena-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.arena-btn--primary {
  background: var(--color-editor-accent);
  border-color: var(--color-editor-accent);
  color: var(--color-editor-bg);
}
.arena-btn--primary:hover:not(:disabled) {
  opacity: 0.88;
  color: var(--color-editor-bg);
}
.arena-btn--sm {
  padding: 0.3rem 0.85rem;
  font-size: 0.78rem;
}

/* ── Public Rooms ── */
.arena-room-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 18%, transparent);
  background: color-mix(in srgb, var(--color-editor-bg) 70%, transparent);
  transition: border-color 0.15s;
}
.arena-room-row:hover {
  border-color: color-mix(in srgb, var(--color-editor-accent) 40%, transparent);
}
.arena-room-badge {
  background: color-mix(in srgb, var(--color-editor-accent) 12%, transparent);
  color: var(--color-editor-accent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 30%, transparent);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  letter-spacing: 0.15em;
  flex-shrink: 0;
}

/* ── Lobby player slots ── */
.arena-player-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 18%, transparent);
  background: color-mix(in srgb, var(--color-editor-bg) 70%, transparent);
  transition: all 0.15s;
}
.arena-player-slot--me {
  border-color: color-mix(in srgb, var(--color-editor-accent) 50%, transparent);
  background: color-mix(in srgb, var(--color-editor-accent) 6%, transparent);
}
.arena-player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: color-mix(in srgb, var(--color-editor-bg) 60%, transparent);
  flex-shrink: 0;
}

/* ── Race Track ── */
.arena-track-lane {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.arena-track-bg {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-editor-sub) 12%, transparent);
}
.arena-track-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  transition: width 0.12s ease-out;
  opacity: 0.85;
}
.arena-track-lane > .flex-1 {
  position: relative;
  height: 10px;
  border-radius: 999px;
}
.arena-car {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  line-height: 1;
  transition: left 0.12s ease-out;
  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.3));
}

/* ── Result rows ── */
.arena-result-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 18%, transparent);
  background: color-mix(in srgb, var(--color-editor-bg) 70%, transparent);
  transition: all 0.15s;
}
.arena-result-row--winner {
  border-color: color-mix(in srgb, var(--color-editor-gold, var(--color-editor-accent)) 50%, transparent);
  background: color-mix(in srgb, var(--color-editor-gold, var(--color-editor-accent)) 7%, transparent);
}
.arena-result-row--me {
  border-color: color-mix(in srgb, var(--color-editor-accent) 40%, transparent);
}
</style>
