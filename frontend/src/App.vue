<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useTypingGame } from './composables/useTypingGame.js'
import ModeSelector from './components/ModeSelector.vue'
import TypingArea from './components/TypingArea.vue'
import ResultScreen from './components/ResultScreen.vue'

const {
  mode, timeOption, wordOption, language, theme, keyboardSound, keyboardVolume,
  words, currentWordIndex, currentCharIndex, typedChars,
  isActive, isFinished, displayTime, wpmHistory, stats,
  initGame, handleKeyDown,
} = useTypingGame()

const gameContainer = ref(null)

// ============ VIEWS & MODALS ============
const activeView = ref('write') // 'write', 'setting', 'about'
const isSidebarOpen = ref(false) // Sidebar toggle state (Default closed)
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
  if (isFinished.value && e.key === 'Enter') {
    e.preventDefault()
    restartGame()
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
  <div class="flex min-h-screen relative overflow-hidden">
    
    <!-- HOVER TRIGGER AREA (Left edge handle) -->
    <div
      v-if="!isSidebarOpen"
      @mouseenter="isSidebarOpen = true"
      class="sidebar-hover-trigger"
      :class="[
        (isActive || isFinished) ? 'opacity-0 pointer-events-none' : 'opacity-100',
      ]"
    >
      <div class="sidebar-hover-indicator" :class="theme === 'theme-default' ? 'indicator-gold' : 'indicator-accent'">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="indicator-icon">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <!-- LEFT SIDEBAR (Modern floating card, auto-closes on mouseleave) -->
    <aside
      class="sidebar-panel"
      @mouseleave="isSidebarOpen = false"
      :class="[
        (isActive || isFinished) ? 'opacity-0 pointer-events-none' : 'opacity-100',
        isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'
      ]"
    >
      <!-- Logo inside sidebar -->
      <div class="sidebar-logo">
        <span
          :class="{
            'text-editor-gold': theme === 'theme-default',
            'text-editor-accent': theme !== 'theme-default'
          }"
        >kee</span><span class="text-editor-text">type</span>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <!-- Write -->
        <button
          @click="activeView = 'write'"
          class="sidebar-item"
          :class="[
            activeView === 'write' ? 'sidebar-item--active' : ''
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          <span>Write</span>
        </button>

        <!-- Arena -->
        <div class="sidebar-item sidebar-item--disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Arena</span>
          <span class="sidebar-soon">soon</span>
        </div>

        <!-- Spacer -->
        <div class="sidebar-spacer"></div>

        <!-- Setting -->
        <button
          @click="activeView = 'setting'"
          class="sidebar-item"
          :class="[
            activeView === 'setting' ? 'sidebar-item--active' : ''
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>Setting</span>
        </button>

        <!-- About -->
        <button
          @click="activeView = 'about'"
          class="sidebar-item"
          :class="[
            activeView === 'about' ? 'sidebar-item--active' : ''
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <span>About</span>
        </button>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div>v1.0.0</div>
        <div>speed &amp; focus</div>
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
                  press <span class="text-editor-text">enter</span> to restart
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
            <div v-else-if="activeView === 'setting'" key="setting" class="max-w-xl mx-auto py-8">
              <h2 class="text-2xl font-bold text-editor-text mb-6 tracking-tight">Setting</h2>
              
              <!-- Two column settings layout (Theme Selection side-by-side with Mechanical sound) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                <!-- Column 1: Theme list -->
                <div class="flex flex-col">
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

                <!-- Column 2: Keyboard Sound Options -->
                <div class="flex flex-col gap-5">
                  <div>
                    <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-3">Mechanical Sound (ASMR)</div>
                    <div class="flex flex-col gap-2">
                      
                      <!-- Option OFF -->
                      <button 
                        @click="keyboardSound = 'off'"
                        class="flex items-center justify-between px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                        :class="keyboardSound === 'off' ? (theme === 'theme-default' ? 'border-editor-gold/60 bg-editor-accent/5' : 'border-editor-accent/60 bg-editor-accent/5') : ''"
                      >
                        <span class="text-xs font-semibold text-editor-text">OFF</span>
                        <span class="w-3.5 h-3.5 rounded-full border border-editor-sub/30 flex items-center justify-center" :class="keyboardSound === 'off' ? 'bg-red-500/20' : ''">
                          <span class="w-1.5 h-1.5 rounded-full bg-red-500" v-if="keyboardSound === 'off'"></span>
                        </span>
                      </button>

                      <!-- Option CHERRY MX BROWN -->
                      <button 
                        @click="keyboardSound = 'cherry-mx-brown'"
                        class="flex items-center justify-between px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                        :class="keyboardSound === 'cherry-mx-brown' ? (theme === 'theme-default' ? 'border-editor-gold/60 bg-editor-accent/5' : 'border-editor-accent/60 bg-editor-accent/5') : ''"
                      >
                        <div class="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-editor-text">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                          <span class="text-xs font-semibold text-editor-text">Cherry MX Brown</span>
                        </div>
                        <span class="w-3.5 h-3.5 rounded-full border border-editor-sub/30 flex items-center justify-center" :class="keyboardSound === 'cherry-mx-brown' ? 'bg-green-500/20' : ''">
                          <span class="w-1.5 h-1.5 rounded-full bg-green-500" v-if="keyboardSound === 'cherry-mx-brown'"></span>
                        </span>
                      </button>

                      <!-- Option BUBBLE -->
                      <button 
                        @click="keyboardSound = 'bubble'"
                        class="flex items-center justify-between px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                        :class="keyboardSound === 'bubble' ? (theme === 'theme-default' ? 'border-editor-gold/60 bg-editor-accent/5' : 'border-editor-accent/60 bg-editor-accent/5') : ''"
                      >
                        <div class="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-editor-text">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                          </svg>
                          <span class="text-xs font-semibold text-editor-text">Bubble Pop</span>
                        </div>
                        <span class="w-3.5 h-3.5 rounded-full border border-editor-sub/30 flex items-center justify-center" :class="keyboardSound === 'bubble' ? 'bg-green-500/20' : ''">
                          <span class="w-1.5 h-1.5 rounded-full bg-green-500" v-if="keyboardSound === 'bubble'"></span>
                        </span>
                      </button>

                      <!-- Option TACTILE KEYBOARD -->
                      <button 
                        @click="keyboardSound = 'tactile'"
                        class="flex items-center justify-between px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                        :class="keyboardSound === 'tactile' ? (theme === 'theme-default' ? 'border-editor-gold/60 bg-editor-accent/5' : 'border-editor-accent/60 bg-editor-accent/5') : ''"
                      >
                        <div class="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-editor-text">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M6 8h12M6 12h12M6 16h8" />
                          </svg>
                          <span class="text-xs font-semibold text-editor-text">Tactile Keyboard</span>
                        </div>
                        <span class="w-3.5 h-3.5 rounded-full border border-editor-sub/30 flex items-center justify-center" :class="keyboardSound === 'tactile' ? 'bg-green-500/20' : ''">
                          <span class="w-1.5 h-1.5 rounded-full bg-green-500" v-if="keyboardSound === 'tactile'"></span>
                        </span>
                      </button>

                      <!-- Option TYPEWRITER -->
                      <button 
                        @click="keyboardSound = 'typewriter'"
                        class="flex items-center justify-between px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                        :class="keyboardSound === 'typewriter' ? (theme === 'theme-default' ? 'border-editor-gold/60 bg-editor-accent/5' : 'border-editor-accent/60 bg-editor-accent/5') : ''"
                      >
                        <div class="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-editor-text">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M6 8h12M6 12h12M6 16h8" />
                          </svg>
                          <span class="text-xs font-semibold text-editor-text">Typewriter Keyboard</span>
                        </div>
                        <span class="w-3.5 h-3.5 rounded-full border border-editor-sub/30 flex items-center justify-center" :class="keyboardSound === 'typewriter' ? 'bg-green-500/20' : ''">
                          <span class="w-1.5 h-1.5 rounded-full bg-green-500" v-if="keyboardSound === 'typewriter'"></span>
                        </span>
                      </button>

                    </div>
                  </div>

                  <!-- Volume Control Slider (Only visible when sound is not OFF) -->
                  <div v-if="keyboardSound !== 'off'" class="mt-2 flex flex-col gap-2">
                    <div class="flex items-center justify-between text-[10px] uppercase tracking-wider text-editor-sub">
                      <span>Volume</span>
                      <span class="font-bold">{{ Math.round(keyboardVolume * 100) }}%</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-editor-sub">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        v-model.number="keyboardVolume"
                        class="w-full h-1 bg-editor-sub/10 rounded-lg appearance-none cursor-pointer focus:outline-none transition-colors accent-editor-accent"
                        :class="theme === 'theme-default' ? 'accent-editor-gold' : 'accent-editor-accent'"
                        :style="{
                          '--thumb-color': theme === 'theme-default' ? '#dfb15b' : 'var(--color-editor-accent)'
                        }"
                      />
                    </div>
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
