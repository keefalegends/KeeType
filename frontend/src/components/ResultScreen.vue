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

// ============ COUNT-UP ANIMATION ============
const displayWpm = ref(0)
const displayAcc = ref(0)

function animateCount(target, refVal, duration = 900) {
  const start = Date.now()
  const from = 0
  const step = () => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    // ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3)
    refVal.value = Math.round(from + (target - from) * ease)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ============ SVG LINE CHART ============
const chartWidth = 600
const chartHeight = 80
const hoveredPoint = ref(null)

const chartPoints = computed(() => {
  if (!props.wpmHistory || props.wpmHistory.length < 2) return []
  const maxWpm = Math.max(...props.wpmHistory.map(p => p.wpm || 1), 1)
  const len = props.wpmHistory.length
  return props.wpmHistory.map((p, i) => ({
    x: (i / (len - 1)) * chartWidth,
    y: chartHeight - Math.max(4, (p.wpm / maxWpm) * chartHeight),
    wpm: p.wpm,
    second: p.second,
  }))
})

const svgLinePath = computed(() => {
  if (chartPoints.value.length < 2) return ''
  return chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
})

const svgAreaPath = computed(() => {
  if (chartPoints.value.length < 2) return ''
  const line = chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const last = chartPoints.value[chartPoints.value.length - 1]
  const first = chartPoints.value[0]
  return `${line} L${last.x},${chartHeight} L${first.x},${chartHeight} Z`
})

// ============ RANK BADGE ============
function rankBadge(i) {
  if (i === 0) return { label: '1', cls: 'rank-gold' }
  if (i === 1) return { label: '2', cls: 'rank-silver' }
  if (i === 2) return { label: '3', cls: 'rank-bronze' }
  return { label: String(i + 1), cls: 'rank-plain' }
}

// ============ SUBMITTED NICKNAME HIGHLIGHT ============
const submittedNickname = ref('')

onMounted(() => {
  const saved = localStorage.getItem('keetype_nickname')
  if (saved) nickname.value = saved

  if (isCustom.value) {
    loadAndSavePB()
  } else {
    fetchLeaderboard()
  }

  // Trigger count-up
  animateCount(props.stats.wpm, displayWpm, 900)
  animateCount(props.stats.accuracy, displayAcc, 700)
})
</script>

<template>
  <div class="result-root">

    <!-- ====== HERO STATS ====== -->
    <div class="hero-section">

      <!-- WPM Card -->
      <div class="stat-card" :class="{ 'pb-glow': isNewPB }">
        <div class="stat-header">
          <div class="stat-label">wpm</div>
          <!-- New PB badge -->
          <div v-if="isNewPB" class="pb-badge">
            <span class="pb-star">★</span> new best
          </div>
        </div>
        <div class="stat-value">{{ displayWpm }}</div>
      </div>

      <!-- Accuracy Card -->
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-label">accuracy</div>
        </div>
        <div class="stat-value">
          {{ displayAcc }}<span class="stat-unit">%</span>
        </div>
      </div>

      <!-- Mode tag -->
      <div class="mode-tag-wrap">
        <div class="mode-tag">
          <span class="mode-icon">⌛</span>
          {{ mode }} · {{ modeLabel }}
        </div>
        <div v-if="isCustom" class="custom-badge">custom</div>
      </div>

    </div>

    <!-- ====== DETAIL PILLS ====== -->
    <div class="pills-row">
      <div class="pill">
        <span class="pill-icon">⚡</span>
        <span class="pill-label">raw</span>
        <span class="pill-val">{{ stats.raw }}</span>
      </div>
      <div class="pill-divider"></div>
      <div class="pill">
        <span class="pill-icon">🔤</span>
        <span class="pill-label">chars</span>
        <span class="pill-val correct-text">{{ stats.chars?.correct || 0 }}</span>
        <span class="pill-sep">/</span>
        <span class="pill-val error-text">{{ stats.chars?.incorrect || 0 }}</span>
        <span class="pill-sep">/</span>
        <span class="pill-val error-extra-text">{{ stats.chars?.extra || 0 }}</span>
        <span class="pill-sep">/</span>
        <span class="pill-val sub-text">{{ stats.chars?.missed || 0 }}</span>
      </div>
      <div class="pill-divider"></div>
      <div class="pill">
        <span class="pill-icon">⏱</span>
        <span class="pill-label">time</span>
        <span class="pill-val">{{ stats.totalTime }}s</span>
      </div>
    </div>

    <!-- ====== SVG LINE CHART ====== -->
    <div v-if="chartPoints.length >= 2" class="chart-wrap">
      <div class="chart-header">
        <span class="chart-title">wpm over time</span>
        <span v-if="hoveredPoint" class="chart-tooltip-badge">
          {{ hoveredPoint.second }}s — {{ hoveredPoint.wpm }} wpm
        </span>
      </div>

      <div class="chart-body">
        <svg
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          preserveAspectRatio="none"
          class="chart-svg"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--color-editor-accent)" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="var(--color-editor-accent)" stop-opacity="0.02"/>
            </linearGradient>
          </defs>

          <!-- Area fill -->
          <path :d="svgAreaPath" fill="url(#areaGrad)" class="chart-area"/>

          <!-- Line -->
          <path :d="svgLinePath" fill="none" stroke="var(--color-editor-accent)"
            stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="chart-line"/>

          <!-- Hover dots -->
          <circle
            v-for="(pt, i) in chartPoints" :key="i"
            :cx="pt.x" :cy="pt.y" r="4"
            class="chart-dot"
            @mouseenter="hoveredPoint = pt"
            @mouseleave="hoveredPoint = null"
          />
        </svg>

        <!-- X axis labels -->
        <div class="chart-xaxis">
          <span>{{ wpmHistory[0]?.second }}s</span>
          <span>{{ wpmHistory[wpmHistory.length - 1]?.second }}s</span>
        </div>
      </div>
    </div>

    <!-- ====== BOTTOM ROW ====== -->
    <div class="bottom-row">

      <!-- LEFT: Submit / PB Card -->
      <div class="bottom-left">

        <!-- PRESET: Submit form -->
        <template v-if="!isCustom">
          <div v-if="!isSubmitted">
            <div class="section-label">submit to leaderboard</div>
            <form @submit.prevent="submitScore" class="submit-form">
              <input
                v-model="nickname"
                type="text"
                placeholder="your nickname"
                maxlength="15"
                class="nick-input"
              />
              <button type="submit" class="submit-btn">submit</button>
            </form>
            <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>
          </div>
          <div v-else class="submitted-ok">
            <span class="submitted-icon">✓</span>
            <span>score submitted!</span>
          </div>
        </template>

        <!-- CUSTOM: Personal Best Card -->
        <template v-else>
          <div class="section-label">personal best</div>
          <div v-if="personalBest" class="pb-card">
            <div v-if="isNewPB" class="pb-new-label">🎉 new personal best!</div>
            <div class="pb-main">
              <span class="pb-wpm">{{ personalBest.wpm }}</span>
              <span class="pb-wpm-label">wpm</span>
            </div>
            <div class="pb-meta">
              <span><span class="sub-text">acc </span><span class="accent-text">{{ personalBest.accuracy }}%</span></span>
              <span><span class="sub-text">raw </span><span class="accent-text">{{ personalBest.raw }}</span></span>
              <span class="sub-text date-text">{{ personalBest.date }}</span>
            </div>
          </div>
          <div class="pb-note">custom modes save bests locally.<br>use presets to compete globally.</div>
        </template>

      </div>

      <!-- RIGHT: Leaderboard -->
      <div v-if="!isCustom" class="bottom-right">
        <div class="leaderboard-header">
          <span class="leaderboard-title">leaderboard</span>
          <span class="leaderboard-mode">({{ testModeString }})</span>
        </div>

        <div v-if="isLoadingLeaderboard" class="lb-loading">
          <span class="lb-spinner"></span> loading...
        </div>

        <div v-else-if="leaderboards.length === 0" class="lb-empty">
          no scores yet — be the first.
        </div>

        <div v-else class="lb-list">
          <div
            v-for="(score, i) in leaderboards"
            :key="score.id"
            class="lb-row"
            :class="{ 'lb-row--highlight': score.nickname === submittedNickname && isSubmitted }"
          >
            <div class="lb-left">
              <span :class="['rank-badge', rankBadge(i).cls]">{{ rankBadge(i).label }}</span>
              <span class="lb-nick">{{ score.nickname }}</span>
            </div>
            <div class="lb-right">
              <span class="lb-wpm">{{ score.wpm }}</span>
              <span class="lb-acc">{{ Math.round(score.accuracy) }}%</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ====== RESTART ====== -->
    <div class="restart-row">
      <button class="restart-btn" @click="emit('restart')">
        <span class="restart-icon">↩</span> restart
      </button>
      <span class="restart-hint">or press <kbd>enter</kbd></span>
    </div>

  </div>
</template>

<style scoped>

/* ===== ROOT ===== */
.result-root {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 0 3rem;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===== HERO STATS ===== */
.hero-section {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.stat-card {
  position: relative;
  background: color-mix(in srgb, var(--color-editor-accent) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 18%, transparent);
  border-radius: 14px;
  padding: 1.25rem 1.75rem 1rem;
  transition: border-color 0.3s ease;
  min-width: 170px;
}

.stat-card:hover {
  border-color: color-mix(in srgb, var(--color-editor-accent) 40%, transparent);
}

.stat-card.pb-glow {
  border-color: color-mix(in srgb, var(--color-editor-accent) 50%, transparent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--color-editor-accent) 15%, transparent);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  gap: 1rem;
}

.stat-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-editor-sub);
}

.stat-value {
  font-size: 5rem;
  font-weight: 200;
  line-height: 1;
  color: var(--color-editor-accent);
  font-variant-numeric: tabular-nums;
  letter-spacing: -2px;
}

.stat-unit {
  font-size: 2rem;
  color: var(--color-editor-sub);
  letter-spacing: 0;
}

/* PB badge inside WPM card */
.pb-badge {
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-editor-accent);
  background: color-mix(in srgb, var(--color-editor-accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 30%, transparent);
  border-radius: 99px;
  padding: 2px 8px;
  animation: pbPulse 2s ease infinite;
  white-space: nowrap;
}

@keyframes pbPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Mode tag */
.mode-tag-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.mode-tag {
  font-size: 11px;
  color: var(--color-editor-sub);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.mode-icon { opacity: 0.5; }

.custom-badge {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-editor-accent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 30%, transparent);
  border-radius: 99px;
  padding: 1px 8px;
  width: fit-content;
}

/* ===== PILLS ROW ===== */
.pills-row {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-editor-sub) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 10%, transparent);
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.pill-icon {
  font-size: 11px;
  opacity: 0.5;
}

.pill-label {
  color: var(--color-editor-sub);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.pill-val {
  color: var(--color-editor-text);
  font-weight: 600;
}

.pill-sep {
  color: color-mix(in srgb, var(--color-editor-sub) 30%, transparent);
  font-size: 10px;
}

.pill-divider {
  width: 1px;
  height: 16px;
  background: color-mix(in srgb, var(--color-editor-sub) 15%, transparent);
  margin: 0 0.75rem;
}

.correct-text { color: var(--color-editor-correct); }
.error-text   { color: var(--color-editor-error); }
.error-extra-text { color: var(--color-editor-error-extra); }
.sub-text     { color: var(--color-editor-sub); }
.accent-text  { color: var(--color-editor-accent); }

/* ===== SVG CHART ===== */
.chart-wrap {
  margin-bottom: 2.25rem;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.chart-title {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-editor-sub);
}

.chart-tooltip-badge {
  font-size: 10px;
  color: var(--color-editor-accent);
  background: color-mix(in srgb, var(--color-editor-accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 25%, transparent);
  border-radius: 99px;
  padding: 1px 10px;
  font-variant-numeric: tabular-nums;
  transition: opacity 0.15s;
}

.chart-body {
  background: color-mix(in srgb, var(--color-editor-sub) 3%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 10%, transparent);
  border-radius: 10px;
  padding: 1rem 1rem 0.5rem;
}

.chart-svg {
  width: 100%;
  height: 80px;
  display: block;
  overflow: visible;
}

.chart-line {
  animation: drawLine 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
}

@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}

.chart-area {
  animation: fadeIn 1s ease both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.chart-dot {
  fill: var(--color-editor-bg);
  stroke: var(--color-editor-accent);
  stroke-width: 1.5;
  opacity: 0;
  transition: opacity 0.15s, r 0.15s;
  cursor: crosshair;
}

.chart-dot:hover {
  opacity: 1;
  r: 5;
}

.chart-xaxis {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: color-mix(in srgb, var(--color-editor-sub) 40%, transparent);
  margin-top: 0.35rem;
  font-variant-numeric: tabular-nums;
}

/* ===== BOTTOM ROW ===== */
.bottom-row {
  display: flex;
  gap: 2.5rem;
  flex-wrap: wrap;
}

.bottom-left {
  flex: 1;
  min-width: 200px;
}

.section-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-editor-sub);
  margin-bottom: 0.85rem;
}

/* Submit form */
.submit-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.nick-input {
  flex: 1;
  background: color-mix(in srgb, var(--color-editor-sub) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 20%, transparent);
  color: var(--color-editor-text);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--font-mono);
  outline: none;
  transition: border-color 0.2s;
}

.nick-input::placeholder { color: var(--color-editor-sub); opacity: 0.5; }

.nick-input:focus {
  border-color: color-mix(in srgb, var(--color-editor-accent) 50%, transparent);
}

.submit-btn {
  background: var(--color-editor-accent);
  color: var(--color-editor-bg);
  border: none;
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.submit-btn:hover { opacity: 0.88; }
.submit-btn:active { transform: scale(0.97); }

.error-msg {
  font-size: 10px;
  color: var(--color-editor-error);
  margin-top: 0.4rem;
}

.submitted-ok {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
  color: var(--color-editor-correct);
  background: color-mix(in srgb, var(--color-editor-correct) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-correct) 20%, transparent);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  width: fit-content;
}

.submitted-icon {
  font-size: 14px;
}

/* Personal Best card */
.pb-card {
  background: color-mix(in srgb, var(--color-editor-accent) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 18%, transparent);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 0.5rem;
}

.pb-new-label {
  font-size: 11px;
  color: var(--color-editor-accent);
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.pb-main {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.pb-wpm {
  font-size: 2.75rem;
  font-weight: 200;
  color: var(--color-editor-accent);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.pb-wpm-label {
  font-size: 11px;
  color: var(--color-editor-sub);
}

.pb-meta {
  display: flex;
  gap: 1rem;
  font-size: 10px;
  flex-wrap: wrap;
}

.date-text {
  opacity: 0.5;
}

.pb-note {
  font-size: 9px;
  color: color-mix(in srgb, var(--color-editor-sub) 50%, transparent);
  line-height: 1.6;
  margin-top: 0.5rem;
}

/* ===== LEADERBOARD ===== */
.bottom-right {
  width: 260px;
  border-left: 1px solid color-mix(in srgb, var(--color-editor-sub) 10%, transparent);
  padding-left: 2rem;
}

.leaderboard-header {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}

.leaderboard-title {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-editor-accent);
  font-weight: 600;
}

.leaderboard-mode {
  font-size: 9px;
  color: var(--color-editor-sub);
}

.lb-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 10px;
  color: var(--color-editor-sub);
}

.lb-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 1.5px solid color-mix(in srgb, var(--color-editor-sub) 30%, transparent);
  border-top-color: var(--color-editor-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.lb-empty {
  font-size: 10px;
  color: color-mix(in srgb, var(--color-editor-sub) 50%, transparent);
}

.lb-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
}

.lb-list::-webkit-scrollbar { width: 2px; }
.lb-list::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--color-editor-sub) 25%, transparent); border-radius: 4px; }

.lb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 0.6rem;
  border-radius: 7px;
  transition: background 0.15s;
}

.lb-row:hover {
  background: color-mix(in srgb, var(--color-editor-sub) 6%, transparent);
}

.lb-row--highlight {
  background: color-mix(in srgb, var(--color-editor-accent) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 20%, transparent);
}

.lb-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Rank badges */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-gold   { background: rgba(223,177,91,0.18); color: #dfb15b; }
.rank-silver { background: rgba(180,180,180,0.15); color: #b0b0b0; }
.rank-bronze { background: rgba(176,108,58,0.15); color: #b06c3a; }
.rank-plain  { background: color-mix(in srgb, var(--color-editor-sub) 8%, transparent); color: var(--color-editor-sub); }

.lb-nick {
  font-size: 11px;
  color: var(--color-editor-text);
  font-weight: 500;
}

.lb-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.lb-wpm {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-editor-accent);
  font-variant-numeric: tabular-nums;
}

.lb-acc {
  font-size: 9px;
  color: color-mix(in srgb, var(--color-editor-sub) 50%, transparent);
  font-variant-numeric: tabular-nums;
}

/* ===== RESTART ===== */
.restart-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid color-mix(in srgb, var(--color-editor-sub) 10%, transparent);
}

.restart-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: color-mix(in srgb, var(--color-editor-accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-accent) 25%, transparent);
  color: var(--color-editor-accent);
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.restart-btn:hover {
  background: color-mix(in srgb, var(--color-editor-accent) 18%, transparent);
}

.restart-btn:active { transform: scale(0.97); }

.restart-icon { font-size: 14px; }

.restart-hint {
  font-size: 10px;
  color: color-mix(in srgb, var(--color-editor-sub) 50%, transparent);
}

.restart-hint kbd {
  font-family: var(--font-mono);
  background: color-mix(in srgb, var(--color-editor-sub) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-editor-sub) 20%, transparent);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 9px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 640px) {
  .bottom-right {
    width: 100%;
    border-left: none;
    border-top: 1px solid color-mix(in srgb, var(--color-editor-sub) 10%, transparent);
    padding-left: 0;
    padding-top: 1.5rem;
  }
  .stat-value { font-size: 3.5rem; }
}

</style>
