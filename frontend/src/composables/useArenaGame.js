import { ref, computed, onUnmounted } from 'vue'
import { playKeyboardClick, preloadMp3Sounds } from '../utils/sound.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// ──────────────────────────────────────────────
// Bot simulation: compute progress given elapsed seconds and bot WPM
// Includes sinusoidal speed waves & natural human-like variation
// ──────────────────────────────────────────────
function computeBotProgress(botWpm, wordCount, elapsedMs, botId = '') {
  if (elapsedMs <= 0) return 0
  const elapsedMinutes = elapsedMs / 60000

  // Hash botId to generate a unique phase shift for speed fluctuation curve
  let hash = 0
  for (let i = 0; i < botId.length; i++) {
    hash = (hash << 5) - hash + botId.charCodeAt(i)
  }
  const phase = (Math.abs(hash) % 100) / 10

  // Sinusoidal speed wave: fluctuates ±8% over time + micro jitter
  const wave = Math.sin((elapsedMs / 700) + phase) * 0.08
  const jitter = 0.98 + Math.random() * 0.04
  const effectiveWpm = botWpm * (1 + wave) * jitter
  const wordsTyped = effectiveWpm * elapsedMinutes

  return Math.min(100, (wordsTyped / wordCount) * 100)
}

export function useArenaGame() {
  // ── State ──
  const nickname = ref(localStorage.getItem('keetype_arena_nickname') || '')
  const roomCode = ref('')
  const playerId = ref('')
  const isHost   = ref(false)

  // 'home' | 'lobby' | 'racing' | 'finished'
  const screen = ref('home')

  const room     = ref(null)     // full room object from API
  const error    = ref('')
  const loading  = ref(false)

  // Countdown
  const countdownSeconds = ref(0)

  // Typing state (for the local player during race)
  const words            = ref([])
  const currentWordIndex = ref(0)
  const currentCharIndex = ref(0)
  const typedChars       = ref([])
  const raceStartedAt    = ref(null)   // JS Date when actual race begins
  const isTypingActive   = ref(false)
  const localFinished    = ref(false)
  const raceMode         = ref('words')  // 'words' | 'timer'
  const timeLimit        = ref(60)       // seconds for timer mode
  let   raceTimer        = null          // countdown timer for timer mode

  // For synced racers display (real + bots)
  const racers = computed(() => {
    if (!room.value) return []
    return room.value.players || []
  })

  // Sorted for podium
  const sortedRacers = computed(() => {
    const mode = raceMode.value || (room.value?.race_mode ?? 'words')
    return [...racers.value].sort((a, b) => {
      if (mode === 'timer') {
        // Timer mode: rank by WPM descending (most words typed wins)
        const wpmA = a.is_bot ? (a.bot_wpm || 0) : (a.wpm || 0)
        const wpmB = b.is_bot ? (b.bot_wpm || 0) : (b.wpm || 0)
        return wpmB - wpmA
      }
      // Words mode: rank by who finished first, then by progress
      if (a.finished && !b.finished) return -1
      if (!a.finished && b.finished) return 1
      if (a.finished && b.finished) {
        return new Date(a.finish_time) - new Date(b.finish_time)
      }
      return b.progress - a.progress
    })
  })

  const myRacer = computed(() =>
    racers.value.find(p => p.id === playerId.value) || null
  )

  // ── Polling & Bot simulation ──
  let pollInterval    = null
  let botInterval     = null
  let countdownTimer  = null
  let progressSyncTimer = null

  function stopAll() {
    clearInterval(pollInterval)
    clearInterval(botInterval)
    clearInterval(countdownTimer)
    clearInterval(progressSyncTimer)
    clearInterval(raceTimer)
    pollInterval = botInterval = countdownTimer = progressSyncTimer = raceTimer = null
  }

  // ── API helpers ──
  async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      ...options,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Request failed')
    return json
  }

  // ── Start polling the room state ──
  function startPolling(code) {
    stopAll()
    pollInterval = setInterval(async () => {
      try {
        const data = await apiFetch(`/arena/${code}`)
        applyRoomState(data.room)
      } catch (e) {
        console.error('Poll error', e)
      }
    }, 800)
  }

  // ── Apply polled room state ──
  function applyRoomState(newRoom) {
    room.value = newRoom

    // Start countdown if server status is countdown (works from lobby or finished/rematch screen)
    if (newRoom.status === 'countdown' && (screen.value === 'lobby' || screen.value === 'finished')) {
      startCountdown(newRoom.race_starts_at, newRoom)
    }

    // If server already says racing (e.g. joined late), enter racing directly
    if (newRoom.status === 'racing' && screen.value !== 'racing') {
      enterRacing(newRoom)
    }

    // If server says countdown but time has already passed client-side → enter racing
    if (newRoom.status === 'countdown' && screen.value === 'countdown' && newRoom.race_starts_at) {
      const timeLeft = new Date(newRoom.race_starts_at) - Date.now()
      if (timeLeft <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
        enterRacing(newRoom)
      }
    }

    // If server says finished → move to podium (stop all intervals)
    if (newRoom.status === 'finished' && screen.value !== 'finished') {
      screen.value = 'finished'
      stopAll()
    }
  }

  // ── Countdown ──
  function startCountdown(raceStartsAtISO, roomData) {
    screen.value = 'countdown'
    raceStartedAt.value = new Date(raceStartsAtISO)

    clearInterval(countdownTimer) // Ensure no duplicate timers
    countdownTimer = setInterval(() => {
      const diff = Math.ceil((raceStartedAt.value - Date.now()) / 1000)
      countdownSeconds.value = Math.max(0, diff)
      if (diff <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
        // Directly enter racing — don't wait for server poll
        if (screen.value !== 'racing') {
          enterRacing(room.value)
        }
      }
    }, 200)
  }

  // ── Enter racing screen ──
  function enterRacing(roomData) {
    screen.value       = 'racing'
    words.value        = roomData.words || []
    typedChars.value   = words.value.map(() => [])
    currentWordIndex.value = 0
    currentCharIndex.value = 0
    isTypingActive.value   = false
    localFinished.value    = false
    raceStartedAt.value    = new Date(roomData.race_starts_at)
    raceMode.value         = roomData.race_mode || 'words'
    timeLimit.value        = roomData.time_limit || 60

    // Simulate bots locally (smooth animation)
    startBotSimulation(roomData)

    // Sync my progress to server every 600ms (keep syncing even after local finish so others see final stats)
    progressSyncTimer = setInterval(() => {
      syncProgress()
    }, 600)

    // Timer mode: auto-finish when time runs out
    if (raceMode.value === 'timer') {
      const endTime = raceStartedAt.value.getTime() + (timeLimit.value * 1000)
      raceTimer = setInterval(() => {
        const remaining = endTime - Date.now()
        if (remaining <= 0) {
          clearInterval(raceTimer)
          raceTimer = null
          if (!localFinished.value) finishRace()
        }
      }, 200)
    }
  }

  // ── Bot simulation (client-side smooth movement) ──
  function startBotSimulation(roomData) {
    // For timer mode bots, use time-based progress (words typed / total words in time)
    const totalWords = raceMode.value === 'timer'
      ? Math.ceil(((roomData.time_limit || 60) / 60) * 150) // estimate max words at top speed
      : (roomData.word_count || 25)

    botInterval = setInterval(() => {
      if (!room.value) return
      const elapsed = Date.now() - raceStartedAt.value.getTime()

      // Timer mode: check if time is up
      if (raceMode.value === 'timer') {
        const timeLimitMs = (roomData.time_limit || 60) * 1000
        if (elapsed >= timeLimitMs) {
          const updatedPlayers = room.value.players.map(p => {
            if (!p.is_bot || p.finished) return p
            return { ...p, progress: 100, finished: true, finish_time: new Date().toISOString() }
          })
          room.value = { ...room.value, players: updatedPlayers }
          return
        }
      }

      const updatedPlayers = room.value.players.map(p => {
        if (!p.is_bot || p.finished) return p
        const newProgress = raceMode.value === 'timer'
          ? Math.min(100, (elapsed / ((roomData.time_limit || 60) * 1000)) * 100)
          : computeBotProgress(p.bot_wpm, totalWords, elapsed, p.id)
        const updatedP = { ...p, progress: newProgress, wpm: p.bot_wpm }
        if (newProgress >= 100 && !updatedP.finished) {
          updatedP.finished    = true
          updatedP.finish_time = new Date().toISOString()
        }
        return updatedP
      })
      room.value = { ...room.value, players: updatedPlayers }
    }, 100)
  }

  // ── Audio preference helper ──
  function playRaceSound(type = 'default') {
    const sound = localStorage.getItem('keetype_sound') || 'tactile'
    if (sound === 'off') return
    const volStr = localStorage.getItem('keetype_volume')
    const vol = volStr !== null ? parseFloat(volStr) : 0.5
    playKeyboardClick(type, vol, sound)
  }

  // ── Typing logic ──
  function handleRaceKeyDown(e) {
    if (screen.value !== 'racing' || localFinished.value) return
    if (e.ctrlKey || e.altKey || e.metaKey) return
    if (e.key === 'Escape') return

    const wi = currentWordIndex.value
    const ci = currentCharIndex.value
    const currentWord = words.value[wi] || ''

    if (e.key === 'Backspace') {
      e.preventDefault()
      playRaceSound('backspace')
      if (ci > 0) {
        currentCharIndex.value--
        const newCi = currentCharIndex.value
        if (newCi >= currentWord.length) {
          typedChars.value[wi].splice(newCi, 1)
        } else {
          typedChars.value[wi][newCi] = undefined
        }
      } else if (ci === 0 && wi > 0) {
        currentWordIndex.value--
        const prev = typedChars.value[currentWordIndex.value] || []
        currentCharIndex.value = prev.length
      }
      return
    }

    if (e.key === ' ') {
      e.preventDefault()
      playRaceSound('space')
      if (ci > 0) {
        for (let i = ci; i < currentWord.length; i++) {
          if (!typedChars.value[wi][i]) typedChars.value[wi][i] = { char: '', status: 'missed' }
        }
        currentWordIndex.value++
        currentCharIndex.value = 0

        if (currentWordIndex.value >= words.value.length) {
          finishRace()
        }
      }
      return
    }

    if (e.key.length === 1) {
      e.preventDefault()
      playRaceSound('default')
      if (!isTypingActive.value) isTypingActive.value = true

      const expected = currentWord[ci]
      if (ci < currentWord.length) {
        typedChars.value[wi][ci] = { char: e.key, status: e.key === expected ? 'correct' : 'incorrect' }
      } else {
        typedChars.value[wi][ci] = { char: e.key, status: 'extra' }
      }
      currentCharIndex.value++

      // Auto-finish if the user completes typing the last character of the last word
      if (wi === words.value.length - 1 && currentCharIndex.value >= currentWord.length) {
        finishRace()
      }
    }
  }


  function finishRace() {
    if (localFinished.value) return
    localFinished.value = true
    // Final sync to backend
    syncProgress(true)
    // NOTE: Do NOT stopAll() here — keep polling so we see other players finish live
    // The finished screen transition is handled by applyRoomState when server says 'finished'
    // Fallback: show finished screen after 8s if server never says finished (e.g. others AFK)
    setTimeout(() => {
      if (screen.value !== 'finished') {
        screen.value = 'finished'
        stopAll()
      }
    }, 8000)
  }

  // ── Calculate local stats ──
  function getLocalStats() {
    let correctChars = 0, totalTyped = 0
    const completedWords = currentWordIndex.value

    // Count chars in completed words (not current word)
    for (let wi = 0; wi < Math.min(completedWords, words.value.length); wi++) {
      const word = words.value[wi] || ''
      const chars = typedChars.value[wi] || []
      // Count each char typed in this word
      for (let ci = 0; ci < word.length; ci++) {
        const c = chars[ci]
        totalTyped++
        if (c && c.status === 'correct') correctChars++
      }
      // Add 1 for the space between words (counted as correct if word was completed)
      correctChars++ // space
      totalTyped++
    }

    // Count chars in current (partially typed) word
    const currentWord = words.value[completedWords] || ''
    const currentChars = typedChars.value[completedWords] || []
    for (let ci = 0; ci < currentWord.length && ci < currentChars.length; ci++) {
      const c = currentChars[ci]
      if (!c) continue
      totalTyped++
      if (c.status === 'correct') correctChars++
    }

    const elapsed = Math.max(0.001, (Date.now() - (raceStartedAt.value?.getTime() || Date.now())) / 60000)
    // Standard WPM: every 5 chars = 1 word
    const wpm = Math.round((correctChars / 5) / elapsed)
    const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100
    const progress = words.value.length > 0
      ? Math.min(100, (completedWords / words.value.length) * 100)
      : 0
    return { wpm, accuracy, progress }
  }

  // ── Sync progress to API ──
  async function syncProgress(finished = false) {
    if (!roomCode.value || !playerId.value) return
    const { wpm, accuracy, progress } = getLocalStats()
    try {
      const data = await apiFetch(`/arena/${roomCode.value}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          player_id: playerId.value,
          progress,
          wpm,
          accuracy,
          finished: finished || localFinished.value,
        }),
      })
      if (data.room) {
        // Merge real player data from server but keep bot simulation local
        room.value = mergeRoomData(room.value, data.room)
      }
    } catch (e) {
      console.error('Sync error', e)
    }
  }

  // Merge: keep bot positions from local simulation, update real player data from server
  function mergeRoomData(localRoom, serverRoom) {
    if (!localRoom) return serverRoom
    const merged = { ...serverRoom }
    merged.players = serverRoom.players.map(sp => {
      if (sp.is_bot) {
        // Keep locally simulated bot position
        const local = (localRoom.players || []).find(lp => lp.id === sp.id)
        return local || sp
      }
      return sp
    })
    return merged
  }

  // ── Public lobby ──
  const publicRooms = ref([])
  async function fetchPublicRooms() {
    try {
      const data = await apiFetch('/arena/public')
      publicRooms.value = data.data || []
    } catch (e) {
      console.error('Fetch rooms error', e)
    }
  }

  // ── Create room ──
  async function createRoom(language, wordCount, botDifficulty = 'medium', raceModeParam = 'words', timeLimitParam = 60) {
    if (!nickname.value.trim()) { error.value = 'Please enter a nickname.'; return }
    loading.value = true; error.value = ''
    try {
      localStorage.setItem('keetype_arena_nickname', nickname.value)
      const data = await apiFetch('/arena/create', {
        method: 'POST',
        body: JSON.stringify({
          nickname: nickname.value,
          language,
          race_mode:      raceModeParam,
          word_count:     raceModeParam === 'words' ? wordCount : undefined,
          time_limit:     raceModeParam === 'timer' ? timeLimitParam : undefined,
          bot_difficulty: botDifficulty,
        }),
      })
      roomCode.value = data.room_code
      playerId.value = data.player_id
      isHost.value   = true
      room.value     = data.room
      screen.value   = 'lobby'
      startPolling(data.room_code)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ── Join room ──
  async function joinRoom(code) {
    if (!nickname.value.trim()) { error.value = 'Please enter a nickname.'; return }
    loading.value = true; error.value = ''
    try {
      localStorage.setItem('keetype_arena_nickname', nickname.value)
      const data = await apiFetch('/arena/join', {
        method: 'POST',
        body: JSON.stringify({ nickname: nickname.value, room_code: code }),
      })
      roomCode.value = data.room_code
      playerId.value = data.player_id
      isHost.value   = false
      room.value     = data.room
      screen.value   = 'lobby'
      startPolling(data.room_code)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ── Start race (host only) ──
  async function startRace() {
    if (!isHost.value) return
    loading.value = true; error.value = ''
    try {
      const data = await apiFetch(`/arena/${roomCode.value}/start`, {
        method: 'POST',
        body: JSON.stringify({ nickname: nickname.value }),
      })
      if (data.room) applyRoomState(data.room)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ── Leave / reset ──
  function leaveRoom() {
    // Notify server: host leave → delete room, player leave → replace with bot
    if (roomCode.value && playerId.value) {
      apiFetch(`/arena/${roomCode.value}/leave`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId.value, nickname: nickname.value }),
      }).catch(() => {}) // Fire-and-forget, ignore errors
    }

    stopAll()
    screen.value   = 'home'
    room.value     = null
    roomCode.value = ''
    playerId.value = ''
    isHost.value   = false
    error.value    = ''
    localFinished.value    = false
    isTypingActive.value   = false
    currentWordIndex.value = 0
    currentCharIndex.value = 0
    words.value            = []
    typedChars.value       = []
  }

  onUnmounted(stopAll)

  return {
    // State
    nickname, roomCode, playerId, isHost, screen,
    room, racers, sortedRacers, myRacer,
    publicRooms, error, loading,
    countdownSeconds,
    raceMode, timeLimit,
    // Typing
    words, currentWordIndex, currentCharIndex, typedChars,
    isTypingActive, localFinished,
    // Actions
    fetchPublicRooms, createRoom, joinRoom, startRace, leaveRoom,
    handleRaceKeyDown,
    getLocalStats,
  }
}
