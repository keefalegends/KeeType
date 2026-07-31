<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useTypingGame } from './composables/useTypingGame.js'
import ModeSelector from './components/ModeSelector.vue'
import TypingArea from './components/TypingArea.vue'
import ResultScreen from './components/ResultScreen.vue'
import LeaderboardView from './components/LeaderboardView.vue'

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
    
    <!-- SIDEBAR WRAPPER: Single hover zone covering trigger + panel to prevent flicker -->
    <div
      class="sidebar-wrapper"
      :class="(isActive || isFinished) ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      @mouseenter="isSidebarOpen = true"
      @mouseleave="isSidebarOpen = false"
    >
      <!-- HOVER TRIGGER AREA (Left edge handle, only visible when sidebar closed) -->
      <div
        v-if="!isSidebarOpen"
        class="sidebar-hover-trigger"
      >
        <div class="sidebar-hover-indicator" :class="theme === 'theme-default' ? 'indicator-gold' : 'indicator-accent'">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="indicator-icon">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- LEFT SIDEBAR (Modern floating card) -->
      <aside
        class="sidebar-panel"
        :class="[
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

        <!-- Leaderboard -->
        <button
          @click="activeView = 'leaderboard'"
          class="sidebar-item"
          :class="[
            activeView === 'leaderboard' ? 'sidebar-item--active' : ''
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
          </svg>
          <span>Leaderboard</span>
        </button>

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
        <div class="sidebar-footer-github cursor-pointer" onclick="window.open('https://github.com/keefalegends/KeeType', '_blank')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path>
          </svg>
          github
        </div>
      </div>
    </aside>
    </div> <!-- END sidebar-wrapper -->

    <!-- RIGHT MAIN CONTENT AREA -->
    <div 
      class="flex-1 flex flex-col min-h-screen relative transition-all duration-300 ease-in-out"
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
        class="flex-1 flex flex-col items-center justify-center px-6 md:px-12 pb-16 pt-20"
      >
        <div class="w-full max-w-4xl flex flex-col items-center justify-center">
          <Transition name="fade" mode="out-in">
            
            <!-- View: Write (Game View) -->
            <div v-if="activeView === 'write'" key="write" class="w-full max-w-3xl">
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
            <!-- View: Leaderboard -->
            <div v-else-if="activeView === 'leaderboard'" key="leaderboard" class="w-full max-w-3xl">
              <LeaderboardView />
            </div>

            <!-- View: Setting (Modern Glassmorphism) -->
            <div v-else-if="activeView === 'setting'" key="setting" class="w-full max-w-2xl py-4 animate-slide-up">
              
              <div class="flex items-center gap-4 mb-8">
                <div class="h-px bg-editor-sub/20 flex-1"></div>
                <h2 class="text-[10px] uppercase tracking-[0.3em] text-editor-sub font-semibold">Settings & Preferences</h2>
                <div class="h-px bg-editor-sub/20 flex-1"></div>
              </div>
              
              <!-- Two column settings layout -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                <!-- Column 1: Theme list -->
                <div class="setting-card">
                  <div class="setting-header">
                    <span class="setting-icon">✨</span>
                    <span>Theme Selection</span>
                  </div>
                  <div class="flex flex-col gap-2.5">
                    
                    <button 
                      @click="theme = 'theme-default'"
                      class="theme-btn"
                      :class="theme === 'theme-default' ? 'theme-btn--active' : ''"
                    >
                      <div class="theme-preview" style="background: #202940; border-color: #dfb15b;"></div>
                      <span class="theme-name">Navy Gold</span>
                      <span v-if="theme === 'theme-default'" class="theme-check">✓</span>
                    </button>
                    
                    <button 
                      @click="theme = 'theme-retro-crt'"
                      class="theme-btn"
                      :class="theme === 'theme-retro-crt' ? 'theme-btn--active' : ''"
                    >
                      <div class="theme-preview" style="background: #000000; border-color: #00ff00; border-radius: 0;"></div>
                      <span class="theme-name">Terminal CRT</span>
                      <span v-if="theme === 'theme-retro-crt'" class="theme-check">✓</span>
                    </button>

                    <button 
                      @click="theme = 'theme-paper'"
                      class="theme-btn"
                      :class="theme === 'theme-paper' ? 'theme-btn--active' : ''"
                    >
                      <div class="theme-preview" style="background: #f4f4f0; border-color: #225ccb; border-radius: 2px;"></div>
                      <span class="theme-name">Paper Ink</span>
                      <span v-if="theme === 'theme-paper'" class="theme-check">✓</span>
                    </button>

                    <button 
                      @click="theme = 'theme-serika-dark'"
                      class="theme-btn"
                      :class="theme === 'theme-serika-dark' ? 'theme-btn--active' : ''"
                    >
                      <div class="theme-preview" style="background: #323437; border-color: #e2b714;"></div>
                      <span class="theme-name">Serika Dark</span>
                      <span v-if="theme === 'theme-serika-dark'" class="theme-check">✓</span>
                    </button>

                    <button 
                      @click="theme = 'theme-darling'"
                      class="theme-btn"
                      :class="theme === 'theme-darling' ? 'theme-btn--active' : ''"
                    >
                      <div class="theme-preview" style="background: #fec8cd; border-color: #a30000; border-radius: 2px;"></div>
                      <span class="theme-name">Darling</span>
                      <span v-if="theme === 'theme-darling'" class="theme-check">✓</span>
                    </button>

                  </div>
                </div>

                <!-- Column 2: Keyboard Sound Options -->
                <div class="flex flex-col gap-6">
                  
                  <div class="setting-card">
                    <div class="setting-header">
                      <span class="setting-icon">⌨️</span>
                      <span>Mechanical Sound (ASMR)</span>
                    </div>
                    
                    <div class="flex flex-col gap-2.5">
                      <!-- Option OFF -->
                      <button 
                        @click="keyboardSound = 'off'"
                        class="sound-btn"
                        :class="keyboardSound === 'off' ? 'sound-btn--active' : ''"
                      >
                        <span class="sound-name">Muted</span>
                        <div class="sound-radio" :class="keyboardSound === 'off' ? 'radio-on radio-red' : ''"></div>
                      </button>

                      <!-- Option CHERRY MX BROWN -->
                      <button 
                        @click="keyboardSound = 'cherry-mx-brown'"
                        class="sound-btn"
                        :class="keyboardSound === 'cherry-mx-brown' ? 'sound-btn--active' : ''"
                      >
                        <span class="sound-name">Cherry MX Brown</span>
                        <div class="sound-radio" :class="keyboardSound === 'cherry-mx-brown' ? 'radio-on' : ''"></div>
                      </button>

                      <!-- Option BUBBLE -->
                      <button 
                        @click="keyboardSound = 'bubble'"
                        class="sound-btn"
                        :class="keyboardSound === 'bubble' ? 'sound-btn--active' : ''"
                      >
                        <span class="sound-name">Bubble Pop</span>
                        <div class="sound-radio" :class="keyboardSound === 'bubble' ? 'radio-on' : ''"></div>
                      </button>

                      <!-- Option TACTILE KEYBOARD -->
                      <button 
                        @click="keyboardSound = 'tactile'"
                        class="sound-btn"
                        :class="keyboardSound === 'tactile' ? 'sound-btn--active' : ''"
                      >
                        <span class="sound-name">Tactile Switch</span>
                        <div class="sound-radio" :class="keyboardSound === 'tactile' ? 'radio-on' : ''"></div>
                      </button>

                      <!-- Option TYPEWRITER -->
                      <button 
                        @click="keyboardSound = 'typewriter'"
                        class="sound-btn"
                        :class="keyboardSound === 'typewriter' ? 'sound-btn--active' : ''"
                      >
                        <span class="sound-name">Vintage Typewriter</span>
                        <div class="sound-radio" :class="keyboardSound === 'typewriter' ? 'radio-on' : ''"></div>
                      </button>
                    </div>
                  </div>

                  <!-- Volume Control Slider (Only visible when sound is not OFF) -->
                  <div v-if="keyboardSound !== 'off'" class="setting-card">
                    <div class="flex items-center justify-between mb-4">
                      <div class="setting-header" style="margin-bottom: 0;">
                        <span class="setting-icon">🔊</span>
                        <span>Volume</span>
                      </div>
                      <span class="text-xs font-bold text-editor-accent tabular-nums">{{ Math.round(keyboardVolume * 100) }}%</span>
                    </div>
                    
                    <div class="vol-slider-wrap">
                      <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        v-model.number="keyboardVolume"
                        class="vol-slider"
                      />
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

            <!-- View: About (Modern Glassmorphism) -->
            <div v-else-if="activeView === 'about'" key="about" class="w-full max-w-xl py-10 animate-slide-up">
              <div class="flex flex-col items-center text-center">
                
                <!-- Logo Display -->
                <div class="mb-8 scale-150">
                  <h1 class="text-2xl font-bold tracking-tight">
                    <span 
                      :class="{
                        'text-editor-gold': theme === 'theme-default',
                        'text-editor-accent': theme !== 'theme-default'
                      }"
                    >kee</span><span class="text-editor-text">type</span>
                  </h1>
                </div>

                <!-- Glass Card -->
                <div class="about-card">
                  <p class="about-lead">
                    A hyper-minimalist, distraction-free typing speed test built for focus.
                  </p>
                  
                  <div class="about-divider"></div>
                  
                  <p class="about-text">
                    No login walls. No database bloat. Just load the page and start typing to test your words-per-minute (WPM) speed and accuracy. Engineered for pure speed.
                  </p>
                  
                  <!-- Tech Stack Badges -->
                  <div class="about-badges">
                    <span class="tech-badge">Vue 3</span>
                    <span class="tech-badge">Tailwind v4</span>
                    <span class="tech-badge">Laravel 13</span>
                  </div>
                </div>
                
                <!-- Signature -->
                <div class="mt-8 text-[10px] text-editor-sub uppercase tracking-[0.2em]">
                  Crafted by <a href="#" class="text-editor-accent hover:opacity-80 transition-opacity">keefalegends</a>
                </div>
                <div class="mt-8 text-[10px] text-editor-sub uppercase tracking-[0.2em]">
                  Inspired by <a href="#" class="text-editor-accent hover:opacity-80 transition-opacity">MonkeyType</a>
                </div>
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
