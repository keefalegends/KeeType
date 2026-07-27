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

function onKeyDown(e) {
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
  </div>
</template>
