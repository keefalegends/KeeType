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
    
    <!-- LEFT SIDEBAR (Polished Chocolate Panel from user drawing) -->
    <aside 
      class="fixed left-0 top-16 bottom-16 w-40 z-30 flex flex-col py-8 px-4 text-center select-none shadow-lg transition-opacity duration-300"
      :class="[
        theme === 'theme-retro-crt' ? 'bg-[#001a00] border-r-2 border-y-2 border-editor-accent rounded-r-2xl' : 'bg-[#2E2520] text-white rounded-r-[2.5rem]',
        isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
      ]"
    >
      <!-- Menu Header -->
      <div class="text-xs uppercase tracking-[0.2em] font-semibold mb-8 opacity-60 text-center">
        Menu
      </div>

      <!-- Nav Items -->
      <nav class="flex flex-col gap-6 font-semibold text-sm">
        <!-- Write (Typing Test) -->
        <button 
          @click="activeView = 'write'"
          class="transition-colors cursor-pointer text-center py-1.5 rounded-lg"
          :class="activeView === 'write' ? 'text-editor-accent' : 'hover:text-editor-accent/80 opacity-80 hover:opacity-100'"
        >
          Write
        </button>

        <!-- Arena (Coming Soon) -->
        <div class="flex flex-col items-center opacity-40 cursor-not-allowed">
          <span>Arena</span>
          <span class="text-[9px] uppercase tracking-wider font-light mt-0.5">Coming Soon</span>
        </div>

        <!-- Setting -->
        <button 
          @click="activeView = 'setting'"
          class="transition-colors cursor-pointer text-center py-1.5 rounded-lg"
          :class="activeView === 'setting' ? 'text-editor-accent' : 'hover:text-editor-accent/80 opacity-80 hover:opacity-100'"
        >
          Setting
        </button>

        <!-- About -->
        <button 
          @click="activeView = 'about'"
          class="transition-colors cursor-pointer text-center py-1.5 rounded-lg"
          :class="activeView === 'about' ? 'text-editor-accent' : 'hover:text-editor-accent/80 opacity-80 hover:opacity-100'"
        >
          About
        </button>
      </nav>
    </aside>

    <!-- RIGHT MAIN CONTENT AREA -->
    <div class="flex-1 flex flex-col ml-40 min-h-screen relative">
      
      <!-- Top Header (Logo) -->
      <header 
        class="w-full pt-8 pl-12 transition-opacity duration-300"
        :class="isActive ? 'opacity-0' : 'opacity-100'"
      >
        <h1 class="text-2xl text-editor-accent font-bold tracking-tight">
          kee<span class="text-editor-text">type</span>
        </h1>
      </header>

      <!-- Centered Play / View Area -->
      <main 
        ref="gameContainer"
        class="flex-1 flex flex-col items-center justify-center px-12 pb-16"
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
                  @restart="initGame"
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
                      :class="theme === 'theme-default' ? 'border-editor-accent/60 bg-editor-accent/5' : ''"
                    >
                      <div class="w-4 h-4 rounded-full border border-editor-sub/30 bg-[#1e1e1e]" style="border-color: #d7ba7d;"></div>
                      <span class="text-xs font-semibold text-editor-text">charcoal</span>
                    </button>
                    
                    <button 
                      @click="theme = 'theme-retro-crt'"
                      class="flex items-center gap-3 px-4 py-3 rounded-lg border border-editor-sub/10 hover:border-editor-accent/40 bg-editor-sub/5 transition-all cursor-pointer text-left"
                      :class="theme === 'theme-retro-crt' ? 'border-editor-accent/60 bg-editor-accent/5' : ''"
                    >
                      <div class="w-4 h-4 rounded-none border border-editor-sub/30 bg-[#000000]" style="border-color: #00ff00;"></div>
                      <span class="text-xs font-semibold text-editor-text">crt</span>
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
        class="w-full flex flex-col items-center justify-center gap-3 text-xs text-editor-sub pb-8 transition-opacity duration-300"
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
