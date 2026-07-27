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
            :isActive="isActive"
            @update:mode="mode = $event"
            @update:timeOption="timeOption = $event"
            @update:wordOption="wordOption = $event"
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

    <!-- Footer -->
    <div
      class="absolute bottom-6 text-xs text-editor-sub transition-opacity duration-300"
      :class="isActive ? 'opacity-0' : 'opacity-100'"
    >
      open source · built for speed
    </div>
  </div>
</template>
