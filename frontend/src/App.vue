<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useTypingGame } from './composables/useTypingGame.js'
import ModeSelector from './components/ModeSelector.vue'
import TypingArea from './components/TypingArea.vue'
import ResultScreen from './components/ResultScreen.vue'

const {
  mode,
  timeOption,
  wordOption,
  language,
  theme,
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
} = useTypingGame()

const gameContainer = ref(null)

const customTimeInput = ref('15')
const isCustomPromptOpen = ref(false)

const showCustomTimePrompt = () => {
  customTimeInput.value = timeOption.value.toString()
  isCustomPromptOpen.value = true
}

const submitCustomTime = () => {
  const val = parseInt(customTimeInput.value, 10)
  if (!isNaN(val) && val > 0) {
    timeOption.value = val
    isCustomPromptOpen.value = false
    initGame()
  } else {
    alert('Invalid time entered. Must be a number greater than 0.')
  }
}

const closeCustomTimePrompt = () => {
  isCustomPromptOpen.value = false
}

function onKeyDown(e) {
  // If game is finished, Tab should NOT restart the game automatically (especially since user might type in inputs)
  if (isFinished.value && e.key === 'Tab') {
    return
  }
  handleKeyDown(e)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div
    ref="gameContainer"
    class="min-h-screen flex flex-col items-center justify-center px-8"
  >
    <!-- Header / Logo -->
    <div
      class="absolute top-8 left-10"
    >
      <h1 class="text-2xl text-editor-accent font-bold tracking-tight">
        kee<span class="text-editor-text">type</span>
      </h1>
    </div>

    <!-- Main Content -->
    <div class="w-full max-w-4xl">
      <Transition name="fade" mode="out-in">
        <!-- Game View -->
        <div v-if="!isFinished" key="game">
          <!-- Mode Selector -->
          <ModeSelector
            :mode="mode"
            :timeOption="timeOption"
            :wordOption="wordOption"
            :language="language"
            :isActive="isActive"
            @update:mode="mode = $event"
            @update:timeOption="timeOption = $event"
            @update:wordOption="wordOption = $event"
            @update:language="language = $event"
            @customTimeClick="showCustomTimePrompt"
          />

          <!-- Timer Display -->
          <div class="text-3xl text-editor-accent mt-6 mb-4 transition-opacity duration-300">
            {{ displayTime }}
          </div>

          <!-- Typing Area -->
          <TypingArea
            :words="words"
            :currentWordIndex="currentWordIndex"
            :currentCharIndex="currentCharIndex"
            :typedChars="typedChars"
            :isActive="isActive"
            :isFinished="isFinished"
          />

          <!-- Restart hint -->
          <div
            class="mt-8 text-sm text-editor-sub text-center transition-opacity duration-300"
            :class="isActive ? 'opacity-0' : 'opacity-100'"
          >
            press <span class="text-editor-text">tab</span> to restart
          </div>
        </div>

        <!-- Result View -->
        <div v-else key="result">
          <ResultScreen
            :stats="stats"
            :wpmHistory="wpmHistory"
            :mode="mode"
            :timeOption="timeOption"
            :wordOption="wordOption"
            @restart="initGame"
          />
        </div>
      </Transition>
    </div>

    <!-- Footer & Theme Switcher -->
    <div
      class="absolute bottom-6 w-full flex flex-col items-center justify-center gap-3 text-xs text-editor-sub transition-opacity duration-300"
      :class="isActive ? 'opacity-0' : 'opacity-100'"
    >
      <div class="flex items-center gap-4">
        <!-- Theme Default -->
        <button 
          @click="theme = 'theme-default'"
          class="flex items-center gap-1.5 cursor-pointer transition-colors duration-200"
          :class="theme === 'theme-default' ? 'text-editor-accent' : 'hover:text-editor-text'"
        >
          <div class="w-3 h-3 rounded-full border border-editor-sub/30" style="background-color: #1e1e1e; border-color: #d7ba7d;"></div>
          charcoal
        </button>

        <!-- Theme Retro CRT -->
        <button 
          @click="theme = 'theme-retro-crt'"
          class="flex items-center gap-1.5 cursor-pointer transition-colors duration-200"
          :class="theme === 'theme-retro-crt' ? 'text-editor-accent' : 'hover:text-editor-text'"
        >
          <div class="w-3 h-3 rounded-none border border-editor-sub/30" style="background-color: #000000; border-color: #00ff00;"></div>
          crt
        </button>

        <!-- Theme Paper -->
        <button 
          @click="theme = 'theme-paper'"
          class="flex items-center gap-1.5 cursor-pointer transition-colors duration-200"
          :class="theme === 'theme-paper' ? 'text-editor-accent' : 'hover:text-editor-text'"
        >
          <div class="w-3 h-3 rounded-sm shadow-sm border border-editor-sub/30" style="background-color: #f4f4f0; border-color: #225ccb;"></div>
          paper
        </button>
      </div>
      <div class="font-light opacity-50">open source · built for speed</div>
    </div>

    <!-- Custom Time Modal Overlay -->
    <Transition name="fade">
      <div
        v-if="isCustomPromptOpen"
        class="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
        @click.self="closeCustomTimePrompt"
      >
        <div class="modal-content rounded-xl p-8 w-80 max-w-[90vw] shadow-2xl flex flex-col items-center gap-6 text-center transform transition-all scale-100 opacity-100">
          <!-- Title -->
          <div class="flex flex-col gap-1 w-full">
            <h2 class="text-xl font-bold tracking-tight text-editor-text">
              custom time
            </h2>
            <p class="text-sm text-editor-sub font-light">
              enter seconds to test
            </p>
          </div>

          <!-- Input -->
          <div class="w-full relative">
            <input
              v-model="customTimeInput"
              type="number"
              min="1"
              max="3600"
              placeholder="15"
              @keyup.enter="submitCustomTime"
              @keyup.esc="closeCustomTimePrompt"
              class="w-full text-center py-4 bg-editor-bg/50 border-2 border-editor-sub/20 rounded-lg text-editor-text focus:outline-none focus:border-editor-accent font-mono text-3xl font-bold transition-colors shadow-inner"
              autofocus
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-center gap-3 w-full mt-2">
            <button
              @click="closeCustomTimePrompt"
              class="flex-1 py-2.5 rounded-lg border border-transparent text-editor-sub hover:text-editor-text hover:bg-editor-sub/10 transition-colors cursor-pointer font-medium"
            >
              cancel
            </button>
            <button
              @click="submitCustomTime"
              class="flex-1 py-2.5 rounded-lg bg-editor-accent text-editor-bg font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              start
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
