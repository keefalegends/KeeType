<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useTypingGame } from './composables/useTypingGame.js'
import ModeSelector from './components/ModeSelector.vue'
import TypingArea from './components/TypingArea.vue'
import ResultScreen from './components/ResultScreen.vue'

const {
  mode, timeOption, wordOption, language, theme,
  words, currentWordIndex, currentCharIndex, typedChars,
  isActive, isFinished, displayTime, wpmHistory, stats,
  initGame, handleKeyDown,
} = useTypingGame()

const gameContainer = ref(null)

// ============ VIEWS & MODALS ============
const activeView = ref('write') // 'write', 'setting', 'about'
const isSidebarOpen = ref(true) // Sidebar toggle state
const isCustomPromptOpen = ref(false)
const customPromptType = ref('time')
const customTimeInput = ref('15')

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

// Automatically navigate back to 'write' view when game is restarted/init
const restartGame = () => {
  activeView.value = 'write'
  initGame()
}

function onKeyDown(e) {
  if (isCustomPromptOpen.value) return
  if (isFinished.value && e.key === 'Tab') return
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
  <div class="flex min-h-screen relative overflow-hidden">
    
    <!-- SIDEBAR TOGGLE BUTTON (Collapsible controller) -->
    <!-- (a) When Open: Appears neatly above the sidebar panel at the top-left corner -->
    <button 
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed left-4 top-20 z-40 w-8 h-8 rounded-lg border border-editor-sub/20 flex items-center justify-center text-editor-sub transition-opacity duration-300 cursor-pointer shadow-sm"
      :class="[
        isActive ? 'opacity-0 pointer-events-none' : 'opacity-100',
        theme === 'theme-default' ? 'hover:border-editor-gold/40 hover:text-editor-gold' : 'hover:border-editor-accent/40 hover:text-editor-accent'
      ]"
      :style="{
        backgroundColor: theme === 'theme-paper' ? '#fcfcfc' : (theme === 'theme-retro-crt' ? '#001a00' : '#202940'),
      }"
      title="Close Sidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>

    <!-- (b) When Closed: Appears at the left-center, styled as a vertical handle (high/narrow button) -->
    <button
      v-else
      @click="isSidebarOpen = true"
      class="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-5 h-24 rounded-r-xl border-y border-r border-editor-sub/20 flex flex-col items-center justify-center text-editor-sub transition-opacity duration-300 cursor-pointer shadow-md group"
      :class="[
        isActive ? 'opacity-0 pointer-events-none' : 'opacity-100',
        theme === 'theme-default' ? 'hover:border-editor-gold/40 hover:text-editor-gold' : 'hover:border-editor-accent/40 hover:text-editor-accent'
      ]"
      :style="{
        backgroundColor: theme === 'theme-paper' ? '#fcfcfc' : (theme === 'theme-retro-crt' ? '#001a00' : '#202940'),
      }"
      title="Open Sidebar"
    >
      <!-- Subtle vertical indicator line or arrow -->
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-0.5 transition-transform">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <!-- LEFT SIDEBAR (Polished Panel matching the active theme colors, top-32 bottom-32) -->
    <aside 
      class="fixed left-0 top-32 bottom-32 w-36 z-30 flex flex-col py-6 px-3 text-center select-none shadow-lg transition-all duration-300 ease-in-out border-r border-y"
      :style="{
        backgroundColor: theme === 'theme-paper' ? '#fcfcfc' : (theme === 'theme-retro-crt' ? '#001a00' : '#202940'),
        borderColor: theme === 'theme-paper' ? 'rgba(0,0,0,0.1)' : (theme === 'theme-retro-crt' ? 'var(--color-editor-accent)' : 'var(--color-editor-gold)'),
        borderTopRightRadius: '2rem',
        borderBottomRightRadius: '2rem',
        color: 'var(--color-editor-text)'
      }"
      :class="[
        isActive ? 'opacity-0 pointer-events-none' : 'opacity-100',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Top Header (Pushed down significantly inside the sidebar container) -->
      <div 
        class="pb-3 mb-6 border-b pt-12"
        :style="{
          borderColor: theme === 'theme-paper' ? 'var(--color-editor-accent)' : 'var(--color-editor-gold)'
        }"
      >
        <div 
          class="text-[13px] uppercase tracking-[0.25em] font-extrabold"
          :class="{
            'text-editor-gold': theme === 'theme-default',
            'text-editor-accent': theme !== 'theme-default'
          }"
        >
          Menu
        </div>
      </div>

      <!-- Nav Items (Expanded to fill vertical space down to the bottom) -->
      <nav class="flex-1 flex flex-col justify-between font-bold text-[15px] my-6">
        <!-- Top Menu Items Group (Centered vertically in the upper half) -->
        <div class="flex flex-col gap-6 justify-center flex-1">
          <!-- Write (Typing Test) -->
          <button 
            @click="activeView = 'write'"
            class="transition-all duration-200 cursor-pointer text-center py-3.5 rounded-xl"
            :class="[
              activeView === 'write'
                ? (theme === 'theme-default' ? 'text-editor-gold bg-editor-gold/10 scale-105' : 'text-editor-accent bg-editor-accent/10 scale-105')
                : 'text-editor-sub hover:text-editor-text hover:bg-editor-sub/5'
            ]"
          >
            Write
          </button>

          <!-- Arena (Coming Soon) -->
          <div class="flex flex-col items-center py-3.5 rounded-xl text-editor-sub/30 cursor-not-allowed">
            <span class="line-through">Arena</span>
            <span class="text-[9px] uppercase tracking-wider font-semibold mt-1 bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">Soon</span>
          </div>
        </div>

        <!-- Bottom Menu Items Group (Pushed completely to the bottom of the navigation flow) -->
        <div class="flex flex-col gap-4 mt-auto">
          <!-- Setting -->
          <button 
            @click="activeView = 'setting'"
            class="transition-all duration-200 cursor-pointer text-center py-3.5 rounded-xl"
            :class="[
              activeView === 'setting'
                ? (theme === 'theme-default' ? 'text-editor-gold bg-editor-gold/10 scale-105' : 'text-editor-accent bg-editor-accent/10 scale-105')
                : 'text-editor-sub hover:text-editor-text hover:bg-editor-sub/5'
            ]"
          >
            Setting
          </button>

          <!-- About -->
          <button 
            @click="activeView = 'about'"
            class="transition-all duration-200 cursor-pointer text-center py-3.5 rounded-xl"
            :class="[
              activeView === 'about'
                ? (theme === 'theme-default' ? 'text-editor-gold bg-editor-gold/10 scale-105' : 'text-editor-accent bg-editor-accent/10 scale-105')
                : 'text-editor-sub hover:text-editor-text hover:bg-editor-sub/5'
            ]"
          >
            About
          </button>
        </div>
      </nav>

      <!-- Bottom Group (Clean layout at the very end of the panel) -->
      <div class="flex flex-col gap-1 text-[9px] text-editor-sub/50 leading-relaxed font-light pt-4 border-t border-editor-sub/5">
        <div>v1.0.0</div>
        <div>speed & focus</div>
      </div>
    </aside>

    <!-- RIGHT MAIN CONTENT AREA -->
    <div 
      class="flex-1 flex flex-col min-h-screen relative transition-all duration-300 ease-in-out"
      :class="isSidebarOpen ? 'ml-36' : 'ml-0'"
    >
      
      <!-- Top Header (Logo) - Fixed position in left top corner, does not move with sidebar -->
      <header 
        class="absolute top-8 left-10 transition-opacity duration-300 z-20"
        :class="isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      >
        <h1 class="text-2xl font-bold tracking-tight">
          <span 
            :class="{
              'text-editor-gold': theme === 'theme-default',
              'text-editor-accent': theme !== 'theme-default'
            }"
          >kee</span><span class="text-editor-text">type</span>
        </h1>
      </header>

      <!-- Centered Play / View Area -->
      <main 
        ref="gameContainer"
        class="flex-1 flex flex-col items-center justify-center px-12 pb-16 pt-20"
      >
        <div class="w-full max-w-4xl">
          <Transition name="fade" mode="out-in">
            
            <!-- View: Write (Game View) -->
            <div v-if="activeView === 'write'" key="write">
              <div v-if="!isFinished" key="game">
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
                  @restart="restartGame"
                />
              </div>
            </div>

            <!-- View: Setting (Visual settings panel integrated into main flow) -->
            <div v-else-if="activeView === 'setting'" key="setting" class="max-w-md mx-auto py-8">
              <h2 class="text-2xl font-bold text-editor-text mb-6 tracking-tight">Setting</h2>
              <div class="flex flex-col gap-6">
                <!-- Theme list -->
                <div>
                  <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-3">Theme Selection</div>
                  <div class="flex flex-col gap-2">
                    <button 
                      @click="theme = 'theme-default'"
                      class="flex items-center gap-3 px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                      :class="theme === 'theme-default' ? 'border-editor-gold/60 bg-editor-accent/5' : ''"
                    >
                      <div class="w-4 h-4 rounded-full border border-editor-sub/30 bg-[#202940]" style="border-color: #dfb15b;"></div>
                      <span class="text-xs font-semibold text-editor-text">navy</span>
                    </button>
                    
                    <button 
                      @click="theme = 'theme-retro-crt'"
                      class="flex items-center gap-3 px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                      :class="theme === 'theme-retro-crt' ? 'border-editor-accent/60 bg-editor-accent/5' : ''"
                    >
                      <div class="w-4 h-4 rounded-none border border-editor-sub/30 bg-[#000000]" style="border-color: #00ff00;"></div>
                      <span class="text-xs font-semibold text-editor-text">terminal</span>
                    </button>

                    <button 
                      @click="theme = 'theme-paper'"
                      class="flex items-center gap-3 px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                      :class="theme === 'theme-paper' ? 'border-editor-accent/60 bg-editor-accent/5' : ''"
                    >
                      <div class="w-4 h-4 rounded-sm border border-editor-sub/30 bg-[#f4f4f0]" style="border-color: #225ccb;"></div>
                      <span class="text-xs font-semibold text-editor-text">paper</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- View: About -->
            <div v-else-if="activeView === 'about'" key="about" class="max-w-md mx-auto py-8">
              <h2 class="text-2xl font-bold text-editor-text mb-4 tracking-tight">About KeeType</h2>
              <div class="text-xs text-editor-sub leading-relaxed flex flex-col gap-4">
                <p>
                  KeeType is a hyper-minimalist, distraction-free typing speed test application built with Vue 3, Tailwind CSS v4, and Laravel 13.
                </p>
                <p>
                  No login. No database bloat. Just load the page and type to test your words-per-minute (WPM) speed and accuracy.
                </p>
              </div>
            </div>

          </Transition>
        </div>
      </main>

      <!-- Footer (Centered at Bottom) -->
      <footer 
        class="w-full flex flex-col items-center justify-center gap-3 text-xs pb-8 transition-opacity duration-300 animate-pulse-slow"
        :class="[
          isActive ? 'opacity-0 pointer-events-none' : 'opacity-100',
          theme === 'theme-default' ? 'text-editor-gold' : 'text-editor-sub'
        ]"
      >
        <div class="font-light opacity-80" :class="theme === 'theme-default' ? 'text-editor-gold' : 'text-editor-sub'">
          open source · built for speed
        </div>
      </footer>
    </div>

    <!-- Custom Time/Words Modal Overlay -->
    <Transition name="fade">
      <div
        v-if="isCustomPromptOpen"
        class="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
        @click.self="closeCustomPrompt"
      >
        <div class="modal-content rounded-xl p-8 w-80 max-w-[90vw] shadow-2xl flex flex-col items-center gap-6 text-center">
          <!-- Title -->
          <div class="flex flex-col gap-1 w-full">
            <h2 class="text-xl font-bold tracking-tight text-editor-text">
              custom {{ customPromptType }}
            </h2>
            <p class="text-sm text-editor-sub font-light">
              enter {{ customPromptType === 'time' ? 'seconds' : 'words count' }} to test
            </p>
          </div>

          <!-- Input -->
          <div class="w-full relative">
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

          <!-- Actions -->
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
