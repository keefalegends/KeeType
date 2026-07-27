<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  stats: Object,
  wpmHistory: Array,
  mode: String,
  timeOption: Number,
  wordOption: Number,
})

const emit = defineEmits(['restart'])

const nickname = ref('')
const isSubmitted = ref(false)
const errorMessage = ref('')
const leaderboards = ref([])
const isLoadingLeaderboard = ref(false)

const apiBaseUrl = 'http://localhost:8000/api'
const testModeString = `${props.mode}-${props.mode === 'time' ? props.timeOption : props.wordOption}`

// Load local nickname if user already set it previously
onMounted(() => {
  const savedNickname = localStorage.getItem('keetype_nickname')
  if (savedNickname) {
    nickname.value = savedNickname
  }
  fetchLeaderboard()
})

async function fetchLeaderboard() {
  isLoadingLeaderboard.value = true
  try {
    const res = await axios.get(`${apiBaseUrl}/leaderboard`, {
      params: { mode: testModeString, limit: 7 }
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
  if (!nickname.value) return
  errorMessage.value = ''
  
  try {
    const res = await axios.post(`${apiBaseUrl}/leaderboard`, {
      nickname: nickname.value,
      wpm: props.stats.wpm,
      accuracy: props.stats.accuracy,
      mode: testModeString
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
</script>

<template>
  <div class="max-w-3xl mx-auto flex flex-col md:flex-row gap-12 py-4">
    <!-- Left: Stats and Score Input -->
    <div class="flex-1">
      <!-- Main Stats Row -->
      <div class="flex items-end gap-12 mb-8">
        <!-- WPM (Big) -->
        <div>
          <div class="text-sm text-editor-sub mb-1">wpm</div>
          <div class="text-6xl text-editor-accent font-light">{{ stats.wpm }}</div>
        </div>

        <!-- Accuracy (Big) -->
        <div>
          <div class="text-sm text-editor-sub mb-1">acc</div>
          <div class="text-6xl text-editor-accent font-light">{{ stats.accuracy }}%</div>
        </div>
      </div>

      <!-- Detail Stats -->
      <div class="grid grid-cols-2 gap-4 text-xs mb-8 border border-editor-sub/10 p-4 rounded-sm">
        <div>
          <span class="text-editor-sub">test type: </span>
          <span class="text-editor-text">
            {{ mode }} {{ mode === 'time' ? timeOption + 's' : wordOption + ' words' }}
          </span>
        </div>
        <div>
          <span class="text-editor-sub">raw speed: </span>
          <span class="text-editor-text">{{ stats.raw }} wpm</span>
        </div>
        <div>
          <span class="text-editor-sub">characters: </span>
          <span class="text-editor-text">
            <span class="text-editor-correct">{{ stats.chars?.correct || 0 }}</span>/<!--
            --><span class="text-editor-error">{{ stats.chars?.incorrect || 0 }}</span>/<!--
            --><span class="text-editor-error-extra">{{ stats.chars?.extra || 0 }}</span>/<!--
            --><span class="text-editor-sub">{{ stats.chars?.missed || 0 }}</span>
          </span>
        </div>
        <div>
          <span class="text-editor-sub">time elapsed: </span>
          <span class="text-editor-text">{{ stats.totalTime }}s</span>
        </div>
      </div>

      <!-- WPM Chart -->
      <div v-if="wpmHistory.length > 1" class="mb-8">
        <div class="text-xs text-editor-sub mb-2">wpm over time</div>
        <div class="flex items-end gap-px h-16 border-b border-editor-sub/15 pb-1">
          <div
            v-for="(point, i) in wpmHistory"
            :key="i"
            class="bg-editor-accent/40 hover:bg-editor-accent transition-colors duration-150 rounded-t-sm"
            :style="{
              height: `${Math.max(4, (point.wpm / Math.max(...wpmHistory.map(p => p.wpm || 1))) * 100)}%`,
              flex: '1 1 0%',
              minWidth: '3px',
              maxWidth: '12px',
            }"
            :title="`${point.second}s: ${point.wpm} wpm`"
          ></div>
        </div>
      </div>

      <!-- Score Submission -->
      <div v-if="!isSubmitted" class="mb-8">
        <div class="text-xs text-editor-sub mb-2">submit to leaderboard</div>
        <form @submit.prevent="submitScore" class="flex gap-2">
          <input
            v-model="nickname"
            type="text"
            placeholder="nickname"
            maxlength="15"
            class="bg-transparent border border-editor-sub/30 focus:border-editor-accent text-editor-text px-3 py-1.5 rounded-sm outline-none text-sm font-mono flex-1"
          />
          <button
            type="submit"
            class="px-4 py-1.5 bg-editor-accent/10 border border-editor-accent/30 text-editor-accent hover:bg-editor-accent/20 hover:border-editor-accent rounded-sm text-sm font-mono cursor-pointer transition-colors duration-150"
          >
            submit
          </button>
        </form>
        <div v-if="errorMessage" class="text-xs text-editor-error mt-2">
          {{ errorMessage }}
        </div>
      </div>
      <div v-else class="mb-8 text-sm text-editor-correct">
        ✓ Score successfully submitted!
      </div>

      <!-- Restart hint -->
      <div class="text-xs text-editor-sub">
        press <span class="text-editor-text underline cursor-pointer" @click="emit('restart')">tab</span> (or click here) to restart
      </div>
    </div>

    <!-- Right: Leaderboard Display -->
    <div class="w-full md:w-72 border-t md:border-t-0 md:border-l border-editor-sub/10 pt-6 md:pt-0 md:pl-8">
      <div class="text-sm text-editor-accent font-semibold mb-4">leaderboard ({{ testModeString }})</div>
      
      <div v-if="isLoadingLeaderboard" class="text-xs text-editor-sub">
        Loading...
      </div>
      
      <div v-else-if="leaderboards.length === 0" class="text-xs text-editor-sub">
        No scores recorded yet. Be the first!
      </div>
      
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="(score, index) in leaderboards"
          :key="score.id"
          class="flex items-center justify-between text-xs py-1 border-b border-editor-sub/5"
        >
          <div class="flex items-center gap-2">
            <span class="text-editor-sub w-4">{{ index + 1 }}.</span>
            <span class="text-editor-text font-bold">{{ score.nickname }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-editor-accent">{{ score.wpm }} wpm</span>
            <span class="text-editor-sub font-light">{{ Math.round(score.accuracy) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
