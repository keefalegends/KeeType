<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useArenaGame } from '../composables/useArenaGame.js'

import TypingArea from './TypingArea.vue'
import { preloadMp3Sounds } from '../utils/sound.js'

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
const lobbyLanguage      = ref('english')
const lobbyWordCount     = ref(25)
const lobbyBotDifficulty = ref('medium')
const wordCountOptions   = [25, 50, 75, 100]

const difficultyOptions = [
  { key: 'easy',   label: 'Easy',   icon: '🟢', wpm: '30-50' },
  { key: 'medium', label: 'Medium', icon: '🟡', wpm: '55-85' },
  { key: 'hard',   label: 'Hard',   icon: '🔴', wpm: '90-120' },
  { key: 'insane', label: 'Insane', icon: '⚡', wpm: '125-160' },
]

function getDifficultyBadge(diff) {
  if (diff === 'easy')   return { label: 'Easy',   icon: '🟢' }
  if (diff === 'hard')   return { label: 'Hard',   icon: '🔴' }
  if (diff === 'insane') return { label: 'Insane', icon: '⚡' }
  return { label: 'Medium', icon: '🟡' }
}


// ── Public room auto-refresh ──
let publicRoomRefresh = null

onMounted(() => {
  preloadMp3Sounds()
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
    <div v-if="screen === 'home'" class="flex flex-col gap-7">

      <!-- Hero Header -->
      <div class="text-center pt-1">
        <div class="arena-hero-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Arena Mode</span>
        </div>
        <h2 class="text-3xl font-bold text-editor-text tracking-tight mt-3 mb-1">Race. Type. Win.</h2>
        <p class="text-sm text-editor-sub">Compete against real players &amp; bots in real-time.</p>
      </div>

      <!-- Single Unified Create Room Card -->
      <div class="arena-create-card w-full max-w-xl mx-auto">
        <div class="arena-create-card__accent"></div>
        <div class="arena-create-card__body">

          <div class="flex items-center gap-2.5" style="margin-bottom: 1.5rem;">
            <div class="arena-create-icon">⚔️</div>
            <div>
              <div class="text-base font-bold text-editor-text leading-tight">Create New Room</div>
              <div class="text-[10px] text-editor-sub mt-0.5">Set up your match &amp; race!</div>
            </div>
          </div>

          <!-- Your Nickname -->
          <div class="flex flex-col gap-1.5" style="margin-bottom: 1.5rem;">
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
          <div class="flex flex-col gap-2" style="margin-bottom: 1.25rem;">
            <label class="arena-label">Language</label>
            <div class="arena-segment">
              <button
                v-for="lang in ['english', 'indonesian']"
                :key="lang"
                @click="lobbyLanguage = lang"
                class="arena-segment__btn"
                :class="lobbyLanguage === lang ? 'arena-segment__btn--active' : ''"
              >
                <span>{{ lang === 'english' ? '🇬🇧' : '🇮🇩' }}</span>
                <span>{{ lang }}</span>
              </button>
            </div>
          </div>

          <!-- Word count tile grid -->
          <div class="flex flex-col gap-2" style="margin-bottom: 1.5rem;">
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

          <!-- Bot Difficulty selector -->
          <div class="flex flex-col gap-2" style="margin-bottom: 1.75rem;">
            <label class="arena-label">Bot Difficulty</label>
            <div class="arena-diff-grid">
              <button
                v-for="d in difficultyOptions"
                :key="d.key"
                @click="lobbyBotDifficulty = d.key"
                class="arena-diff-btn"
                :class="lobbyBotDifficulty === d.key ? 'arena-diff-btn--active' : ''"
              >
                <span class="arena-diff-btn__icon">{{ d.icon }}</span>
                <span class="arena-diff-btn__label">{{ d.label }}</span>
                <span class="arena-diff-btn__sub">{{ d.wpm }}</span>
              </button>
            </div>
          </div>

          <!-- Create button -->
          <button
            @click="createRoom(lobbyLanguage, lobbyWordCount, lobbyBotDifficulty)"
            :disabled="loading || !nickname.trim()"
            class="arena-create-btn"
          >
            <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span>{{ loading ? 'Creating...' : 'Create Room' }}</span>
          </button>

        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-center text-sm font-medium text-editor-error">⚠ {{ error }}</p>

      <!-- Public Rooms List -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="h-px bg-editor-sub/20 flex-1"></div>
          <span class="text-[10px] uppercase tracking-[0.25em] text-editor-sub flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-editor-accent inline-block animate-pulse"></span>
            Open Rooms
          </span>
          <div class="h-px bg-editor-sub/20 flex-1"></div>
        </div>

        <div v-if="publicRooms.length === 0" class="arena-empty-state">
          <div class="text-2xl mb-2">🏁</div>
          <div class="text-sm text-editor-sub">No open rooms yet.</div>
          <div class="text-xs text-editor-sub/50 mt-0.5">Create one and start the race!</div>
        </div>

        <div v-for="r in publicRooms" :key="r.room_code" class="arena-room-row">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="arena-room-badge">{{ r.room_code }}</div>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-editor-text truncate flex items-center gap-2">
                <span>{{ r.host_nickname }}'s room</span>
                <span class="arena-diff-badge" :class="'arena-diff-badge--' + (r.bot_difficulty || 'medium')">
                  {{ getDifficultyBadge(r.bot_difficulty).icon }} {{ getDifficultyBadge(r.bot_difficulty).label }}
                </span>
              </div>
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
          <span class="arena-diff-badge" :class="'arena-diff-badge--' + (room?.bot_difficulty || 'medium')">
            {{ getDifficultyBadge(room?.bot_difficulty).icon }} {{ getDifficultyBadge(room?.bot_difficulty).label }} Bots
          </span>
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
            <div class="font-bold text-editor-accent tabular-nums">{{ racer.is_bot ? racer.bot_wpm : (racer.wpm || 0) }} <span class="text-xs text-editor-sub font-normal">wpm</span></div>
            <div class="text-xs text-editor-sub tabular-nums">{{ racer.accuracy || 100 }}% acc</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 w-full">
        <button @click="leaveRoom" class="arena-btn flex-1">Back to Lobby</button>
        <button @click="createRoom(room?.language || 'english', room?.word_count || 25, room?.bot_difficulty || 'medium')" class="arena-btn arena-btn--primary flex-1">
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
  background: color-mix(in srgb, var(--color-editor-bg) 60%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--color-editor-sub) 25%, transparent);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  color: var(--color-editor-text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.arena-input:focus {
  border-color: var(--color-editor-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-editor-accent) 15%, transparent);
}
.arena-input::placeholder {
  color: color-mix(in srgb, var(--color-editor-sub) 60%, transparent);
  font-weight: 400;
}

/* ── Labels ── */
.arena-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-editor-sub);
  font-weight: 600;
}

/* ── Hero badge ── */
.arena-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 35%, transparent);
  background: color-mix(in srgb, var(--color-editor-accent) 10%, transparent);
  color: var(--color-editor-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ── Two-column home grid ── */
.arena-home-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 640px) {
  .arena-home-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Info pills ── */
.arena-info-pill {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-editor-sub) 7%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 13%, transparent);
  font-size: 0.75rem;
  color: var(--color-editor-sub);
  line-height: 1.3;
}

/* ── Create Room Card ── */
.arena-create-card {
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 20%, transparent);
  position: relative;
}
.arena-create-card__accent {
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--color-editor-accent),
    color-mix(in srgb, var(--color-editor-accent) 40%, transparent)
  );
  border-radius: 14px 14px 0 0;
}
.arena-create-card__body {
  padding: 1.5rem 1.5rem 2rem;
  background: color-mix(in srgb, var(--color-editor-bg) 80%, var(--color-editor-sub));
  border-radius: 0 0 14px 14px;
}
.arena-create-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--color-editor-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 25%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

/* ── Segmented language control ── */
.arena-segment {
  display: flex;
  background: color-mix(in srgb, var(--color-editor-sub) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 18%, transparent);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.arena-segment__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--color-editor-sub);
  transition: all 0.15s;
}
.arena-segment__btn:hover:not(.arena-segment__btn--active) {
  color: var(--color-editor-text);
}
.arena-segment__btn--active {
  background: var(--color-editor-accent);
  color: var(--color-editor-bg);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

/* ── Word count grid ── */
.arena-wc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.arena-wc-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 0.25rem;
  border-radius: 8px;
  border: 1.5px solid color-mix(in srgb, var(--color-editor-sub) 20%, transparent);
  background: color-mix(in srgb, var(--color-editor-bg) 50%, transparent);
  cursor: pointer;
  transition: all 0.15s;
  gap: 0.15rem;
  font-family: inherit;
}
.arena-wc-btn:hover:not(.arena-wc-btn--active) {
  border-color: color-mix(in srgb, var(--color-editor-sub) 45%, transparent);
  background: color-mix(in srgb, var(--color-editor-sub) 8%, transparent);
}
.arena-wc-btn--active {
  border-color: var(--color-editor-accent);
  background: color-mix(in srgb, var(--color-editor-accent) 12%, transparent);
}
.arena-wc-btn__num {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-editor-text);
  line-height: 1;
  font-family: 'JetBrains Mono', monospace;
}
.arena-wc-btn--active .arena-wc-btn__num {
  color: var(--color-editor-accent);
}
.arena-wc-btn__label {
  font-size: 0.6rem;
  color: var(--color-editor-sub);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Bot Difficulty Grid ── */
.arena-diff-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}
.arena-diff-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.2rem;
  border-radius: 8px;
  border: 1.5px solid color-mix(in srgb, var(--color-editor-sub) 20%, transparent);
  background: color-mix(in srgb, var(--color-editor-bg) 50%, transparent);
  cursor: pointer;
  transition: all 0.15s;
  gap: 0.1rem;
  font-family: inherit;
}
.arena-diff-btn:hover:not(.arena-diff-btn--active) {
  border-color: color-mix(in srgb, var(--color-editor-sub) 45%, transparent);
  background: color-mix(in srgb, var(--color-editor-sub) 8%, transparent);
}
.arena-diff-btn--active {
  border-color: var(--color-editor-accent);
  background: color-mix(in srgb, var(--color-editor-accent) 12%, transparent);
}
.arena-diff-btn__icon {
  font-size: 0.85rem;
}
.arena-diff-btn__label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-editor-text);
  line-height: 1;
}
.arena-diff-btn--active .arena-diff-btn__label {
  color: var(--color-editor-accent);
}
.arena-diff-btn__sub {
  font-size: 0.58rem;
  color: var(--color-editor-sub);
  font-family: 'JetBrains Mono', monospace;
}

/* ── Difficulty Badges ── */
.arena-diff-badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 30%, transparent);
  color: var(--color-editor-sub);
  background: color-mix(in srgb, var(--color-editor-sub) 8%, transparent);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}


/* ── Create CTA button ── */
.arena-create-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: var(--color-editor-accent);
  color: var(--color-editor-bg);
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.03em;
}
.arena-create-btn:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}
.arena-create-btn:active:not(:disabled) {
  transform: translateY(0);
}
.arena-create-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Empty state ── */
.arena-empty-state {
  text-align: center;
  padding: 2rem 1rem;
  border: 1px dashed color-mix(in srgb, var(--color-editor-sub) 20%, transparent);
  border-radius: 12px;
}

/* ── Old cards (kept for lobby/result screens) ── */
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
