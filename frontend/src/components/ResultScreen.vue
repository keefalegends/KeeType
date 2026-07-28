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

const PRESET_TIME = [15, 30, 60, 120]
const PRESET_WORDS = [8, 25, 50, 100]

const isCustom = computed(() =>
  props.mode === 'time' ? !PRESET_TIME.includes(props.timeOption) : !PRESET_WORDS.includes(props.wordOption)
)

const testModeString = computed(() =>
  `${props.mode}-${props.mode === 'time' ? props.timeOption : props.wordOption}`
)

const modeLabel = computed(() =>
  props.mode === 'time' ? `${props.timeOption}s` : `${props.wordOption} words`
)

// ============ GLOBAL LEADERBOARD ============
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
    if (res.data.status === 'success') leaderboards.value = res.data.data
  } catch { /* silent */ } finally {
    isLoadingLeaderboard.value = false
  }
}

async function submitScore() {
  if (!nickname.value || isCustom.value) return
  errorMessage.value = ''
  try {
    const res = await axios.post(`${apiBaseUrl}/leaderboard`, {
      nickname: nickname.value, wpm: props.stats.wpm,
      accuracy: props.stats.accuracy, mode: testModeString.value,
    })
    if (res.data.status === 'success') {
      isSubmitted.value = true
      localStorage.setItem('keetype_nickname', nickname.value)
      fetchLeaderboard()
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.errors?.nickname?.[0]
      || 'Failed to submit. Is the backend running?'
  }
}

// ============ PERSONAL BEST ============
const personalBest = ref(null)
const pbKey = computed(() => `keetype_pb_${testModeString.value}`)

function loadAndSavePB() {
  const saved = localStorage.getItem(pbKey.value)
  if (saved) personalBest.value = JSON.parse(saved)

  const current = {
    wpm: props.stats.wpm, accuracy: props.stats.accuracy, raw: props.stats.raw,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  }
  if (!personalBest.value || current.wpm > personalBest.value.wpm) {
    personalBest.value = current
    localStorage.setItem(pbKey.value, JSON.stringify(current))
  }
}

const isNewPB = computed(() => !personalBest.value || props.stats.wpm >= personalBest.value.wpm)

// Chart helpers
const maxWpm = computed(() => Math.max(...props.wpmHistory.map(p => p.wpm || 1), 1))
const barHeight = (wpm) => `${Math.max(6, (wpm / maxWpm.value) * 100)}%`

onMounted(() => {
  const saved = localStorage.getItem('keetype_nickname')
  if (saved) nickname.value = saved
  isCustom.value ? loadAndSavePB() : fetchLeaderboard()
})
</script>

<template>
  <div class="max-w-3xl mx-auto py-8">

    <!-- Hero Stats -->
    <div class="flex items-end gap-12 mb-10">
      <div>
        <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-1">wpm</div>
        <div class="text-8xl font-extralight text-editor-accent leading-none tabular-nums">{{ stats.wpm }}</div>
      </div>
      <div>
        <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-1">accuracy</div>
        <div class="text-8xl font-extralight text-editor-accent leading-none tabular-nums">
          {{ stats.accuracy }}<span class="text-4xl text-editor-sub">%</span>
        </div>
      </div>
      <div class="mb-2">
        <span class="text-xs text-editor-sub">{{ mode }} · {{ modeLabel }}</span>
        <span v-if="isCustom" class="ml-1.5 text-[9px] text-editor-accent border border-editor-accent/30 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">custom</span>
      </div>
    </div>

    <!-- Stat Pills -->
    <div class="flex items-center gap-6 text-xs mb-10 py-4 border-y border-editor-sub/10">
      <div class="flex items-center gap-2">
        <span class="text-editor-sub">raw</span>
        <span class="text-editor-text font-semibold tabular-nums">{{ stats.raw }}</span>
      </div>
      <span class="text-editor-sub/20">·</span>
      <div class="flex items-center gap-1.5">
        <span class="text-editor-sub">chars</span>
        <span class="tabular-nums">
          <span class="text-editor-correct font-semibold">{{ stats.chars?.correct || 0 }}</span><span class="text-editor-sub/40">/</span><span class="text-editor-error font-semibold">{{ stats.chars?.incorrect || 0 }}</span><span class="text-editor-sub/40">/</span><span class="text-editor-error-extra font-semibold">{{ stats.chars?.extra || 0 }}</span><span class="text-editor-sub/40">/</span><span class="text-editor-sub">{{ stats.chars?.missed || 0 }}</span>
        </span>
      </div>
      <span class="text-editor-sub/20">·</span>
      <div class="flex items-center gap-2">
        <span class="text-editor-sub">time</span>
        <span class="text-editor-text font-semibold tabular-nums">{{ stats.totalTime }}s</span>
      </div>
    </div>

    <!-- WPM Chart -->
    <div v-if="wpmHistory.length > 1" class="mb-10">
      <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-3">wpm over time</div>
      <div class="flex items-end gap-px h-20">
        <div
          v-for="(point, i) in wpmHistory"
          :key="i"
          class="bg-editor-accent/15 hover:bg-editor-accent/60 transition-colors duration-100 rounded-t-sm cursor-default"
          :style="{ height: barHeight(point.wpm), flex: '1 1 0%', minWidth: '3px', maxWidth: '16px' }"
          :title="`${point.second}s — ${point.wpm} wpm`"
        ></div>
      </div>
      <div class="flex justify-between text-[9px] text-editor-sub/40 mt-1 tabular-nums">
        <span>{{ wpmHistory[0]?.second }}s</span>
        <span>{{ wpmHistory[wpmHistory.length - 1]?.second }}s</span>
      </div>
    </div>

    <!-- Bottom Row: Submit/PB + Leaderboard/PB Card -->
    <div class="flex flex-col lg:flex-row gap-10">

      <!-- Left: Submit or Personal Best info -->
      <div class="flex-1">
        <!-- PRESET: Submit -->
        <template v-if="!isCustom">
          <div v-if="!isSubmitted" class="max-w-sm">
            <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-3">submit to leaderboard</div>
            <form @submit.prevent="submitScore" class="flex gap-2">
              <input
                v-model="nickname"
                type="text"
                placeholder="nickname"
                maxlength="15"
                class="bg-transparent border border-editor-sub/20 focus:border-editor-accent text-editor-text px-3 py-2 rounded-sm outline-none text-xs font-mono flex-1 transition-colors"
              />
              <button
                type="submit"
                class="px-5 py-2 bg-editor-accent text-editor-bg rounded-sm text-xs font-mono font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >submit</button>
            </form>
            <div v-if="errorMessage" class="text-[10px] text-editor-error mt-2">{{ errorMessage }}</div>
          </div>
          <div v-else class="text-xs text-editor-correct flex items-center gap-2">
            <span>✓</span> <span>score submitted</span>
          </div>
        </template>

        <!-- CUSTOM: Personal Best Card -->
        <template v-else>
          <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-4">personal best</div>
          <div v-if="personalBest" class="border border-editor-sub/10 rounded-md p-5">
            <div v-if="isNewPB" class="text-xs text-editor-accent font-semibold mb-4 flex items-center gap-1.5">
              <span>🎉</span> new personal best!
            </div>
            <div class="flex items-baseline gap-2 mb-4">
              <span class="text-4xl font-extralight text-editor-accent tabular-nums leading-none">{{ personalBest.wpm }}</span>
              <span class="text-xs text-editor-sub">wpm</span>
            </div>
            <div class="flex gap-6 text-[10px]">
              <div><span class="text-editor-sub">acc </span><span class="text-editor-text font-medium">{{ personalBest.accuracy }}%</span></div>
              <div><span class="text-editor-sub">raw </span><span class="text-editor-text font-medium">{{ personalBest.raw }}</span></div>
              <div class="text-editor-sub/50">{{ personalBest.date }}</div>
            </div>
          </div>
          <div class="text-[9px] text-editor-sub/40 mt-3 leading-relaxed">
            custom modes save personal bests locally.<br>use preset durations to compete globally.
          </div>
        </template>
      </div>

      <!-- Right: Leaderboard (preset only) -->
      <div v-if="!isCustom" class="w-full lg:w-72 lg:border-l border-editor-sub/10 lg:pl-10">
        <div class="text-[10px] uppercase tracking-[0.2em] text-editor-accent font-semibold mb-4">
          leaderboard <span class="text-editor-sub font-light">({{ testModeString }})</span>
        </div>

        <div v-if="isLoadingLeaderboard" class="text-[10px] text-editor-sub">loading...</div>

        <div v-else-if="leaderboards.length === 0" class="text-[10px] text-editor-sub">
          no scores yet — be the first.
        </div>

        <div v-else class="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar" style="max-height: 200px;">
          <div
            v-for="(score, i) in leaderboards"
            :key="score.id"
            class="flex items-center justify-between text-[11px] py-1.5 px-2 rounded-sm hover:bg-editor-sub/5 transition-colors"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-editor-sub/50 w-4 text-right tabular-nums text-[9px]">{{ i + 1 }}</span>
              <span class="text-editor-text font-medium">{{ score.nickname }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-editor-accent font-semibold tabular-nums">{{ score.wpm }}</span>
              <span class="text-editor-sub/40 tabular-nums text-[9px]">{{ Math.round(score.accuracy) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Restart -->
    <div class="text-xs text-editor-sub mt-10 pt-6 border-t border-editor-sub/10">
      <span class="text-editor-text hover:text-editor-accent cursor-pointer transition-colors" @click="emit('restart')">> restart</span>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--color-editor-sub); opacity: 0.2; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--color-editor-text); }
</style>
