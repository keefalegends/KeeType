<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const modes = [
  { id: 'time-15', label: '15s' },
  { id: 'time-30', label: '30s' },
  { id: 'time-60', label: '60s' },
  { id: 'time-120', label: '120s' },
  { id: 'words-8', label: '8w' },
  { id: 'words-25', label: '25w' },
  { id: 'words-50', label: '50w' },
  { id: 'words-100', label: '100w' },
]

const selectedMode = ref('time-15')
const selectedPeriod = ref('all') // 'daily', 'weekly', 'all'
const leaderboards = ref([])
const isLoading = ref(false)
const apiBaseUrl = 'http://localhost:8000/api'

async function fetchLeaderboard() {
  isLoading.value = true
  leaderboards.value = []
  try {
    const res = await axios.get(`${apiBaseUrl}/leaderboard`, {
      params: { mode: selectedMode.value, period: selectedPeriod.value, limit: 10 }
    })
    if (res.data.status === 'success') {
      leaderboards.value = res.data.data
    }
  } catch (err) {
    console.error('Failed to load leaderboard', err)
  } finally {
    isLoading.value = false
  }
}

watch([selectedMode, selectedPeriod], fetchLeaderboard)

onMounted(() => {
  fetchLeaderboard()
})

function rankBadge(i) {
  if (i === 0) return { label: '1', cls: 'rank-gold' }
  if (i === 1) return { label: '2', cls: 'rank-silver' }
  if (i === 2) return { label: '3', cls: 'rank-bronze' }
  return { label: String(i + 1), cls: 'rank-plain' }
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto py-4 animate-slide-up">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <div class="h-px bg-editor-sub/20 flex-1"></div>
      <h2 class="text-[10px] uppercase tracking-[0.3em] text-editor-sub font-semibold flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
        </svg>
        Global Leaderboard
      </h2>
      <div class="h-px bg-editor-sub/20 flex-1"></div>
    </div>

    <!-- Period Filters -->
    <div class="flex justify-center gap-6 mb-6 text-sm font-bold tracking-widest font-mono">
      <button 
        @click="selectedPeriod = 'daily'"
        class="transition-colors"
        :class="selectedPeriod === 'daily' ? 'text-editor-accent border-b-2 border-editor-accent pb-1' : 'text-editor-sub hover:text-editor-text'"
      >
        daily
      </button>
      <button 
        @click="selectedPeriod = 'weekly'"
        class="transition-colors"
        :class="selectedPeriod === 'weekly' ? 'text-editor-accent border-b-2 border-editor-accent pb-1' : 'text-editor-sub hover:text-editor-text'"
      >
        weekly
      </button>
      <button 
        @click="selectedPeriod = 'all'"
        class="transition-colors"
        :class="selectedPeriod === 'all' ? 'text-editor-accent border-b-2 border-editor-accent pb-1' : 'text-editor-sub hover:text-editor-text'"
      >
        all-time
      </button>
    </div>

    <div class="setting-card flex flex-col gap-6">
      <!-- Mode Selector -->
      <div class="flex flex-wrap gap-2 justify-center pb-6 border-b border-editor-sub/10">
        <button
          v-for="m in modes"
          :key="m.id"
          @click="selectedMode = m.id"
          class="px-4 py-1.5 rounded-full text-[11px] font-mono font-semibold transition-colors border"
          :class="selectedMode === m.id 
            ? 'bg-editor-accent/10 border-editor-accent/30 text-editor-accent shadow-sm' 
            : 'bg-transparent border-transparent text-editor-sub hover:text-editor-text hover:bg-editor-sub/5'"
        >
          {{ m.label }}
        </button>
      </div>

      <!-- Leaderboard List -->
      <div class="min-h-[300px] relative">
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center text-xs text-editor-sub gap-2">
          <span class="lb-spinner"></span> fetching top scores...
        </div>
        
        <div v-else-if="leaderboards.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-xs text-editor-sub/60 gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-40">
            <line x1="22" y1="12" x2="2" y2="12"></line>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            <line x1="6" y1="16" x2="6.01" y2="16"></line>
            <line x1="10" y1="16" x2="10.01" y2="16"></line>
          </svg>
          No scores submitted for this mode yet.
        </div>

        <div v-else class="flex flex-col gap-1.5">
          <!-- Header Row -->
          <div class="flex items-center justify-between text-[10px] uppercase tracking-wider text-editor-sub/50 px-4 py-2 mb-1">
            <div class="w-12 text-center">Rank</div>
            <div class="flex-1 px-2">Typist</div>
            <div class="w-24 text-right">Accuracy</div>
            <div class="w-24 text-right">WPM</div>
          </div>
          
          <!-- Data Rows -->
          <div
            v-for="(score, i) in leaderboards"
            :key="score.id"
            class="flex items-center justify-between text-sm py-3 px-4 rounded-xl bg-editor-sub/5 hover:bg-editor-sub/10 transition-colors border border-editor-sub/5"
          >
            <div class="w-12 flex items-center justify-center">
              <span :class="['rank-badge', rankBadge(i).cls]">{{ rankBadge(i).label }}</span>
            </div>
            <div class="flex-1 font-semibold text-editor-text font-mono truncate px-2">
              {{ score.nickname }}
            </div>
            <div class="w-24 text-right text-editor-sub/80 font-mono text-xs">
              {{ Math.round(score.accuracy) }}%
            </div>
            <div class="w-24 text-right text-editor-accent font-bold font-mono text-xl tabular-nums tracking-tight">
              {{ score.wpm }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lb-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, var(--color-editor-sub) 30%, transparent);
  border-top-color: var(--color-editor-accent);
  border-radius: 50%;
  animation: spin 0.8s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  flex-shrink: 0;
}

.rank-gold   { background: rgba(223,177,91,0.18); color: #dfb15b; box-shadow: 0 0 10px rgba(223,177,91,0.2); }
.rank-silver { background: rgba(180,180,180,0.15); color: #b0b0b0; }
.rank-bronze { background: rgba(176,108,58,0.15); color: #b06c3a; }
.rank-plain  { background: color-mix(in srgb, var(--color-editor-sub) 8%, transparent); color: var(--color-editor-sub); }
</style>