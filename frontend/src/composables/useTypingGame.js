import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { generateWords } from '../data/words.js'
import { playKeyboardClick, preloadMp3Sounds } from '../utils/sound.js'

export function useTypingGame() {
  // ============ STATE ============
  const mode = ref('time')           // 'time' or 'words'
  const timeOption = ref(30)         // seconds: 15, 30, 60, 120
  const wordOption = ref(25)         // word count: 10, 25, 50, 100
  const language = ref('english')    // 'english' or 'indonesian'
  const theme = ref('theme-default') // Current theme
  const keyboardSound = ref('cherry-mx-brown') // 'off', 'cherry-mx-brown', 'bubble', 'tactile', 'typewriter'
  const keyboardVolume = ref(0.5)    // Volume slider: 0.0 to 1.0
  const isMuted = computed(() => keyboardSound.value === 'off')

  const words = ref([])              // array of word strings
  const currentWordIndex = ref(0)
  const currentCharIndex = ref(0)
  const typedChars = ref([])         // 2D array: typedChars[wordIndex][charIndex] = { char, status }

  const isActive = ref(false)        // has the user started typing?
  const isFinished = ref(false)

  const timeLeft = ref(0)
  const startTime = ref(null)
  const endTime = ref(null)

  let timerInterval = null

  // Per-second WPM tracking for live chart
  const wpmHistory = ref([])         // [{ second, wpm, raw }, ...]

  // For words mode display
  const displayTime = computed(() => {
    if (mode.value === 'time') {
      return timeLeft.value
    } else {
      // In words mode, show words completed / total words (e.g. 0/25)
      return `${currentWordIndex.value}/${wordOption.value}`
    }
  })

  // ============ INIT ============
  function initGame() {
    clearInterval(timerInterval)
    timerInterval = null

    const wordCount = mode.value === 'time' ? 200 : wordOption.value
    words.value = generateWords(wordCount, language.value)
    currentWordIndex.value = 0
    currentCharIndex.value = 0
    typedChars.value = words.value.map(() => [])

    isActive.value = false
    isFinished.value = false

    timeLeft.value = mode.value === 'time' ? timeOption.value : 0
    startTime.value = null
    endTime.value = null
    wpmHistory.value = []
  }

  // ============ TIMER ============
  function startTimer() {
    startTime.value = Date.now()

    if (mode.value === 'time') {
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.value) / 1000)
        timeLeft.value = Math.max(0, timeOption.value - elapsed)

        // Record WPM per second
        recordWpmSnapshot(elapsed)

        if (timeLeft.value <= 0) {
          finishGame()
        }
      }, 1000)
    } else {
      // Word mode: count up
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.value) / 1000)
        timeLeft.value = elapsed
        recordWpmSnapshot(elapsed)
      }, 1000)
    }
  }

  function recordWpmSnapshot(elapsedSeconds) {
    if (elapsedSeconds <= 0) return
    const { correctChars, totalTypedChars } = getCharCounts()
    const minutes = elapsedSeconds / 60
    const wpm = Math.round((correctChars / 5) / minutes)
    const raw = Math.round((totalTypedChars / 5) / minutes)
    wpmHistory.value.push({ second: elapsedSeconds, wpm, raw })
  }

  // ============ INPUT HANDLER ============
  function handleKeyDown(e) {
    if (isFinished.value) return

    // Ignore modifier keys, function keys, etc.
    if (e.ctrlKey || e.altKey || e.metaKey) return
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault()
      if (e.key === 'Enter') initGame()
      return
    }

    // Start on first real keypress
    if (!isActive.value && e.key.length === 1) {
      isActive.value = true
      startTimer()
    }

    const wi = currentWordIndex.value
    const ci = currentCharIndex.value
    // Safe guard: check if words.value[wi] is undefined
    const currentWord = words.value[wi] || ''

    // Play click sound even if game hasn't started yet (or during game)
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (!isMuted.value) playKeyboardClick('backspace', keyboardVolume.value, keyboardSound.value)
      if (isActive.value) handleBackspace(wi, ci)
      return
    }

    if (e.key === ' ') {
      e.preventDefault()
      if (!isMuted.value) playKeyboardClick('space', keyboardVolume.value, keyboardSound.value)
      if (isActive.value && ci > 0) {
        // Move to next word
        // Mark remaining chars as missed
        for (let i = ci; i < currentWord.length; i++) {
          if (!typedChars.value[wi][i]) {
            typedChars.value[wi][i] = { char: '', status: 'missed' }
          }
        }
        currentWordIndex.value++
        currentCharIndex.value = 0

        // Check if all words typed in word mode
        if (mode.value === 'words' && currentWordIndex.value >= words.value.length) {
          finishGame()
        }
      }
      return
    }

    // Regular character input
    if (e.key.length === 1) {
      e.preventDefault()
      if (!isMuted.value) playKeyboardClick('default', keyboardVolume.value, keyboardSound.value)
      
      if (!isActive.value) return // If game is not active yet (e.g. initial start blocked)

      const expected = currentWord[ci]

      if (ci < currentWord.length) {
        // Within word bounds
        typedChars.value[wi][ci] = {
          char: e.key,
          status: e.key === expected ? 'correct' : 'incorrect'
        }
      } else {
        // Extra characters beyond word length
        typedChars.value[wi][ci] = {
          char: e.key,
          status: 'extra'
        }
      }

      currentCharIndex.value++
    }
  }

  function handleBackspace(wi, ci) {
    if (ci > 0) {
      currentCharIndex.value--
      const word = words.value[wi]
      const newCi = currentCharIndex.value

      if (newCi >= word.length) {
        // Was an extra char — remove it from array
        typedChars.value[wi].splice(newCi, 1)
      } else {
        // Within word bounds — just clear status so char goes back to "untyped"
        typedChars.value[wi][newCi] = undefined
      }
    } else if (ci === 0 && currentWordIndex.value > 0) {
      // Go back to previous word
      currentWordIndex.value--
      const prevWordIndex = currentWordIndex.value
      const prevWordTyped = typedChars.value[prevWordIndex] || []
      
      // Set char index to the end of the previous word's typed characters
      currentCharIndex.value = prevWordTyped.length
    }
  }

  // ============ FINISH ============
  function finishGame() {
    clearInterval(timerInterval)
    timerInterval = null
    isFinished.value = true
    isActive.value = false
    endTime.value = Date.now()

    // Final WPM snapshot
    const totalSeconds = (endTime.value - startTime.value) / 1000
    recordWpmSnapshot(Math.floor(totalSeconds))
  }

  // ============ STATS ============
  function getCharCounts() {
    let correctChars = 0
    let incorrectChars = 0
    let extraChars = 0
    let missedChars = 0
    let totalTypedChars = 0

    for (let wi = 0; wi <= Math.min(currentWordIndex.value, words.value.length - 1); wi++) {
      const chars = typedChars.value[wi] || []
      for (const c of chars) {
        if (c.status === 'correct') { correctChars++; totalTypedChars++ }
        else if (c.status === 'incorrect') { incorrectChars++; totalTypedChars++ }
        else if (c.status === 'extra') { extraChars++; totalTypedChars++ }
        else if (c.status === 'missed') { missedChars++ }
      }
      // Count spaces between completed words as correct chars
      if (wi < currentWordIndex.value) {
        correctChars++
        totalTypedChars++
      }
    }

    return { correctChars, incorrectChars, extraChars, missedChars, totalTypedChars }
  }

  const stats = computed(() => {
    if (!startTime.value) return { wpm: 0, raw: 0, accuracy: 100, chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 } }

    const end = endTime.value || Date.now()
    const totalSeconds = (end - startTime.value) / 1000
    const minutes = totalSeconds / 60

    const { correctChars, incorrectChars, extraChars, missedChars, totalTypedChars } = getCharCounts()

    const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0
    const raw = minutes > 0 ? Math.round((totalTypedChars / 5) / minutes) : 0
    const accuracy = totalTypedChars > 0
      ? Math.round((correctChars / totalTypedChars) * 100)
      : 100

    return {
      wpm,
      raw,
      accuracy,
      chars: { correct: correctChars, incorrect: incorrectChars, extra: extraChars, missed: missedChars },
      totalTime: Math.round(totalSeconds)
    }
  })

  // ============ STATS DISPLAY ============
  // The first duplicate displayTime block was added above. Removing this duplicate lower one.

  // ============ THEME HANDLING ============
  function applyTheme(newTheme) {
    document.documentElement.className = newTheme
    localStorage.setItem('keetype_theme', newTheme)
  }

  // ============ AUDIO PREFERENCE HANDLING ============
  function applyKeyboardSound(newSound) {
    localStorage.setItem('keetype_sound', newSound)
  }

  function applyKeyboardVolume(newVolume) {
    localStorage.setItem('keetype_volume', newVolume)
  }

  // ============ LIFECYCLE ============
  onMounted(() => {
    initGame()
    // Restore theme from storage
    const savedTheme = localStorage.getItem('keetype_theme')
    if (savedTheme) {
      theme.value = savedTheme
    }
    applyTheme(theme.value)

    // Restore sound preference from storage
    const savedSound = localStorage.getItem('keetype_sound')
    if (savedSound) {
      keyboardSound.value = savedSound
    }

    // Restore volume preference from storage
    const savedVolume = localStorage.getItem('keetype_volume')
    if (savedVolume !== null) {
      keyboardVolume.value = parseFloat(savedVolume)
    }

    // Preload MP3 files on mount to prevent lag on first click
    preloadMp3Sounds()
  })

  onUnmounted(() => {
    clearInterval(timerInterval)
  })

  // Watch mode changes
  watch([mode, timeOption, wordOption, language], () => {
    initGame()
  })

  // Watch theme changes
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  // Watch sound changes
  watch(keyboardSound, (newSound) => {
    applyKeyboardSound(newSound)
  })

  // Watch volume changes
  watch(keyboardVolume, (newVolume) => {
    applyKeyboardVolume(newVolume)
  })

  return {
    mode,
    timeOption,
    wordOption,
    language,
    theme,
    keyboardSound,
    keyboardVolume,
    isMuted,
    words,
    currentWordIndex,
    currentCharIndex,
    typedChars,
    isActive,
    isFinished,
    displayTime,
    wpmHistory,
    stats,
    initGame,
    handleKeyDown,
    preloadMp3Sounds
  }
}
