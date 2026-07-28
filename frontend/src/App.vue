<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useTypingGame } from './composables/useTypingGame.js'
import Sidebar from './components/Sidebar.vue'
import SettingsPanel from './components/SettingsPanel.vue'
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
const activeView = ref('home')
const isSettingsOpen = ref(false)

// Custom modal state
const customTimeInput = ref('15')
const isCustomPromptOpen = ref(false)
const customPromptType = ref('time')

const showCustomTimePrompt = () => {
  customPromptType.value = 'time'
  customTimeInput.value = timeOption.value.toString()
  isCustomPromptOpen.value = true
}

const showCustomWordPrompt = () => {
  customPromptType.value = 'words'
  customTimeInput.value = wordOption.value.toString()
  isCustomPromptOpen.value = true
}

const submitCustomValue = () => {
  const val = parseInt(customTimeInput.value, 10)
  if (!isNaN(val) && val > 0) {
    if (customPromptType.value === 'time') {
      timeOption.value = val
    } else {
      wordOption.value = val
    }
    isCustomPromptOpen.value = false
    initGame()
  }
}

const closeCustomPrompt = () => {
  isCustomPromptOpen.value = false
}

function onKeyDown(e) {
  if (isCustomPromptOpen.value || isSettingsOpen.value) return
  if (isFinished.value && e.key === 'Tab') return
  handleKeyDown(e)
}

function handleNavigate(view) {
  activeView.value = view
}

function handleOpenSettings() {
  isSettingsOpen.value = true
}

function handleUpdateTheme(newTheme) {
  theme.value = newTheme
}

function handleUpdateLanguage(newLang) {
  language.value = newLang
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <Sidebar
      :activeView="activeView"
      @navigate="handleNavigate"
      @openSettings="handleOpenSettings"
    />

    <!-- Settings Panel -->
    <SettingsPanel
      :isOpen="isSettingsOpen"
      :theme="theme"
      :language="language"
      @close="isSettingsOpen = false"
      @update:theme="handleUpdateTheme"
      @update:language="handleUpdateLanguage"
    />

    <!-- Main Content -->
    <main
      ref="gameContainer"
      class="flex-1 ml-16 min-h-screen flex flex-col items-center justify-center px-8"
    >
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
              @customWordClick="showCustomWordPrompt"
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
    </main>

    <!-- Custom Modal Overlay -->
    <Transition name="fade">
      <div
        v-if="isCustomPromptOpen"
        class="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
        @click.self="closeCustomPrompt"
      >
        <div class="modal-content rounded-xl p-8 w-80 max-w-[90vw] shadow-2xl flex flex-col items-center gap-6 text-center">
          <div class="flex flex-col gap-1 w-full">
            <h2 class="text-xl font-bold tracking-tight text-editor-text">
              custom {{ customPromptType }}
            </h2>
            <p class="text-sm text-editor-sub font-light">
              enter {{ customPromptType === 'time' ? 'seconds' : 'words count' }} to test
            </p>
          </div>
          <div class="w-full">
            <input
              v-model="customTimeInput"
              type="number"
              min="1"
              max="3600"
              :placeholder="customPromptType === 'time' ? '15' : '25'"
              @keyup.enter="submitCustomValue"
              @keyup.esc="closeCustomPrompt"
              class="w-full text-center py-4 bg-editor-bg/50 border-2 border-editor-sub/20 rounded-lg text-editor-text focus:outline-none focus:border-editor-accent font-mono text-3xl font-bold transition-colors shadow-inner"
              autofocus
            />
          </div>
          <div class="flex items-center justify-center gap-3 w-full mt-2">
            <button
              @click="closeCustomPrompt"
              class="flex-1 py-2.5 rounded-lg border border-transparent text-editor-sub hover:text-editor-text hover:bg-editor-sub/10 transition-colors cursor-pointer font-medium"
            >
              cancel
            </button>
            <button
              @click="submitCustomValue"
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
