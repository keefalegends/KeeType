<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  stats: Object,
  wpmHistory: Array,
  mode: String,
  timeOption: Number,
  wordOption: Number,
})

const emit = defineEmits(['restart'])

// Preset values — anything outside these is "custom"
const PRESET_TIME = [15, 30, 60, 120]
const PRESET_WORDS = [8, 25, 50, 100]

const isCustom = computed(() => {
  if (props.mode === 'time') return !PRESET_TIME.includes(props.timeOption)
  return !PRESET_WORDS.includes(props.wordOption)
})

const testModeString = computed(() =>
  `${props.mode}-${props.mode === 'time' ? props.timeOption : props.wordOption}`
)

// ============ GLOBAL LEADERBOARD (preset only) ============
const nickname = ref('')
const isSubmitted = ref(false)
const errorMessage = ref('')
const leaderboards = ref([])
const isLoadingLeaderboard = ref(false)
const apiBaseUrl = 'http://localhost:8000/api'

async function fetchLeaderboard() {
  if (isCustom.value) return
  isLoadingLeaderboard.value = true
  try {
    const res = await axios.get(`${apiBaseUrl}/leaderboard`, {
      params: { mode: testModeString.value, limit: 10 }
    })
    if (res.data.status === 'success') {
      leaderboards.value = res.data.data
    }
  } catch (err) {
    console.error('Failed to load leaderboard', err)
  } finally {
    isLoadingLeaderboard.value = false
  }
}

async function submitScore() {
  if (!nickname.value || isCustom.value) return
  errorMessage.value = ''
  try {
    const res = await axios.post(`${apiBaseUrl}/leaderboard`, {
      nickname: nickname.value,
      wpm: props.stats.wpm,
      accuracy: props.stats.accuracy,
      mode: testModeString.value
    })
    if (res.data.status === 'success') {
      isSubmitted.value = true
      localStorage.setItem('keetype_nickname', nickname.value)
      fetchLeaderboard()
    }
  } catch (err) {
    if (err.response?.data?.errors?.nickname) {
      errorMessage.value = err.response.data.errors.nickname[0]
    } else {
      errorMessage.value = 'Failed to submit score. Make sure backend is running.'
    }
  }
}

// ============ PERSONAL BEST (custom only, localStorage) ============
const personalBest = ref(null)

function getPersonalBestKey() {
  return `keetype_pb_${testModeString.value}`
}

function loadPersonalBest() {
  const saved = localStorage.getItem(getPersonalBestKey())
  if (saved) {
    personalBest.value = JSON.parse(saved)
  }
}

function savePersonalBest() {
  const current = {
    wpm: props.stats.wpm,
    accuracy: props.stats.accuracy,
    raw: props.stats.raw,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  }
  if (!personalBest.value || current.wpm > personalBest.value.wpm) {
    personalBest.value = current
    localStorage.setItem(getPersonalBestKey(), JSON.stringify(current))
  }
}

const isNewPersonalBest = computed(() => {
  if (!personalBest.value) return true
  return props.stats.wpm >= personalBest.value.wpm
})

// ============ LIFECYCLE ============
onMounted(() => {
  const savedNickname = localStorage.getItem('keetype_nickname')
  if (savedNickname) nickname.value = savedNickname

  if (isCustom.value) {
    loadPersonalBest()
    savePersonalBest()
  } else {
    fetchLeaderboard()
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col lg:flex-row gap-16 py-8">
    <!-- Left: Stats and Score Input -->
    <div class="flex-1 flex flex-col justify-between">
      <div>
        <!-- Main Stats Row -->
        <div class="flex items-baseline gap-16 mb-12">
          <div>
            <div class="text-xs tracking-wider uppercase text-editor-sub mb-2">wpm</div>
            <div class="text-7xl font-extralight text-editor-accent leading-none">{{ stats.wpm }}</div>
          </div>
          <div>
            <div class="text-xs tracking-wider uppercase text-editor-sub mb-2">accuracy</div>
            <div class="text-7xl font-extralight text-editor-accent leading-none">{{ stats.accuracy }}<span class="text-3xl text-editor-sub">%</span></div>
          </div>
        </div>

        <!-- Detail Stats Grid -->
        <div class="grid grid-cols-2 gap-y-4 gap-x-8 text-xs mb-10 py-6 border-y border-editor-sub/10">
          <div class="flex justify-between items-center pb-2 border-b border-editor-sub/5">
            <span class="text-editor-sub">test type</span>
            <span class="text-editor-text font-semibold">
              {{ mode }} ({{ mode === 'time' ? timeOption + 's' : wordOption + ' words' }})
              <span v-if="isCustom" class="text-editor-accent text-[10px] ml-1">custom</span>
            </span>
          </div>
          <div class="flex justify-between items-center pb-2 border-b border-editor-sub/5">
            <span class="text-editor-sub">raw speed</span>
            <span class="text-editor-text font-semibold">{{ stats.raw }} <span class="text-editor-sub">wpm</span></span>
          </div>
          <div class="flex justify-between items-center pb-2 border-b border-editor-sub/5">
            <span class="text-editor-sub">characters</span>
            <span class="text-editor-text font-semibold">
              <span class="text-editor-correct">{{ stats.chars?.correct || 0 }}</span>/<span class="text-editor-error">{{ stats.chars?.incorrect || 0 }}</span>/<span class="text-editor-error-extra">{{ stats.chars?.extra || 0 }}</span>/<span class="text-editor-sub">{{ stats.chars?.missed || 0 }}</span>
            </span>
          </div>
          <div class="flex justify-between items-center pb-2 border-b border-editor-sub/5">
            <span class="text-editor-sub">time elapsed</span>
            <span class="text-editor-text font-semibold">{{ stats.totalTime }}<span class="text-editor-sub">s</span></span>
          </div>
        </div>

        <!-- WPM Chart -->
        <div v-if="wpmHistory.length > 1" class="mb-10">
          <div class="text-xs text-editor-sub mb-3 uppercase tracking-wider">wpm over time</div>
          <div class="flex items-end gap-1 h-24 border-b border-editor-sub/10 pb-1">
            <div
              v-for="(point, i) in wpmHistory"
              :key="i"
              class="bg-editor-accent/20 hover:bg-editor-accent transition-all duration-150 rounded-t-sm"
              :style="{
                height: `${Math.max(4, (point.wpm / Math.max(...wpmHistory.map(p => p.wpm || 1))) * 100)}%`,
                flex: '1 1 0%',
                minWidth: '4px',
                maxWidth: '12px',
              }"
              :title="`${point.second}s: ${point.wpm} wpm`"
            ></div>
          </div>
        </div>

        <!-- Score Submission (PRESET ONLY) -->
        <div v-if="!isCustom && !isSubmitted" class="mb-10 max-w-sm">
          <div class="text-xs text-editor-sub mb-3 uppercase tracking-wider">submit to leaderboard</div>
          <form @submit.prevent="submitScore" class="flex gap-2">
            <input
              v-model="nickname"
              type="text"
              placeholder="nickname"
              maxlength="15"
              class="bg-editor-sub/5 border border-editor-sub/20 focus:border-editor-accent/50 text-editor-text px-4 py-2 rounded-sm outline-none text-xs font-mono flex-1 transition-colors duration-200"
            />
            <button
              type="submit"
              class="px-6 py-2 bg-editor-accent/10 hover:bg-editor-accent/20 text-editor-accent border border-editor-accent/30 hover:border-editor-accent rounded-sm text-xs font-mono cursor-pointer transition-colors duration-150"
            >
              submit
            </button>
          </form>
          <div v-if="errorMessage" class="text-xs text-editor-error mt-2">
            {{ errorMessage }}
          </div>
        </div>
        <div v-else-if="!isCustom && isSubmitted" class="mb-10 text-xs text-editor-correct flex items-center gap-2">
          <span>✓</span> <span>Score successfully submitted!</span>
        </div>
      </div>
    </div>

    <!-- Right Column -->
    <div class="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-editor-sub/10 pt-10 lg:pt-0 lg:pl-12 flex flex-col">

      <!-- PRESET: Global Leaderboard -->
      <template v-if="!isCustom">
        <div class="text-xs uppercase tracking-widest text-editor-accent font-semibold mb-6 flex-shrink-0">
          leaderboard <span class="text-editor-sub font-light">({{ testModeString }})</span>
        </div>
        
        <div v-if="isLoadingLeaderboard" class="text-xs text-editor-sub flex-shrink-0">
          Loading scores...
        </div>
        
        <div v-else-if="leaderboards.length === 0" class="text-xs text-editor-sub flex-shrink-0">
          No scores recorded yet. Be the first!
        </div>
        
        <div v-else class="flex flex-col gap-2 overflow-y-auto flex-1 custom-scrollbar pr-2" style="max-height: 250px;">
          <div
            v-for="(score, index) in leaderboards"
            :key="score.id"
            class="flex items-center justify-between text-xs py-2 border-b border-editor-sub/5 hover:bg-editor-sub/5 px-2 rounded-sm transition-colors duration-150"
          >
            <div class="flex items-center gap-3">
              <span class="text-editor-sub w-6 text-right font-light">{{ index + 1 }}.</span>
              <span class="text-editor-text font-medium">{{ score.nickname }}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-editor-accent font-semibold">{{ score.wpm }} <span class="text-[10px] text-editor-sub font-light">WPM</span></span>
              <span class="text-editor-sub text-[10px]">{{ Math.round(score.accuracy) }}%</span>
            </div>
          </div>
        </div>
      </template>

      <!-- CUSTOM: Personal Best -->
      <template v-else>
        <div class="text-xs uppercase tracking-widest text-editor-accent font-semibold mb-6 flex-shrink-0">
          personal best <span class="text-editor-sub font-light">({{ testModeString }})</span>
        </div>

        <div v-if="personalBest" class="flex flex-col gap-6">
          <!-- New PB indicator -->
          <div v-if="isNewPersonalBest" class="flex items-center gap-2 text-xs text-editor-accent">
            <span class="text-base">🎉</span>
            <span class="font-semibold">new personal best!</span>
          </div>

          <!-- PB Stats -->
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-baseline text-xs">
              <span class="text-editor-sub">best wpm</span>
              <span class="text-2xl font-bold text-editor-accent leading-none">{{ personalBest.wpm }}</span>
            </div>
            <div class="flex justify-between items-center text-xs border-t border-editor-sub/10 pt-3">
              <span class="text-editor-sub">accuracy</span>
              <span class="text-editor-text font-semibold">{{ personalBest.accuracy }}%</span>
            </div>
            <div class="flex justify-between items-center text-xs border-t border-editor-sub/10 pt-3">
              <span class="text-editor-sub">raw speed</span>
              <span class="text-editor-text font-semibold">{{ personalBest.raw }} wpm</span>
            </div>
            <div class="flex justify-between items-center text-xs border-t border-editor-sub/10 pt-3">
              <span class="text-editor-sub">achieved</span>
              <span class="text-editor-sub font-light">{{ personalBest.date }}</span>
            </div>
          </div>

          <!-- Info note -->
          <div class="text-[10px] text-editor-sub/60 leading-relaxed mt-2">
            custom modes track personal bests locally. use preset durations to compete on the global leaderboard.
          </div>
        </div>
      </template>

      <!-- Restart Hint -->
      <div class="text-xs text-editor-sub mt-8 pt-6 border-t border-editor-sub/10 flex-shrink-0">
        <span class="text-editor-text hover:text-editor-accent cursor-pointer transition-colors duration-200" @click="emit('restart')">> click here to restart</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for Leaderboard */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-editor-sub);
  opacity: 0.3;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-editor-text);
}
</style>
