<script setup>
defineProps({
  stats: Object,
  wpmHistory: Array,
  mode: String,
  timeOption: Number,
  wordOption: Number,
})

const emit = defineEmits(['restart'])
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Main Stats Row -->
    <div class="flex items-end gap-12 mb-10">
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
    <div class="flex items-center gap-8 text-sm mb-8">
      <div>
        <span class="text-editor-sub">test type </span>
        <span class="text-editor-text">
          {{ mode }} {{ mode === 'time' ? timeOption + 's' : wordOption + ' words' }}
        </span>
      </div>
      <div>
        <span class="text-editor-sub">raw </span>
        <span class="text-editor-text">{{ stats.raw }}</span>
      </div>
      <div>
        <span class="text-editor-sub">characters </span>
        <span class="text-editor-text">
          <span class="text-editor-correct">{{ stats.chars?.correct || 0 }}</span>/<!--
          --><span class="text-editor-error">{{ stats.chars?.incorrect || 0 }}</span>/<!--
          --><span class="text-editor-error-extra">{{ stats.chars?.extra || 0 }}</span>/<!--
          --><span class="text-editor-sub">{{ stats.chars?.missed || 0 }}</span>
        </span>
      </div>
      <div>
        <span class="text-editor-sub">time </span>
        <span class="text-editor-text">{{ stats.totalTime }}s</span>
      </div>
    </div>

    <!-- WPM Chart (Simple ASCII-style bar chart) -->
    <div v-if="wpmHistory.length > 1" class="mb-10">
      <div class="text-sm text-editor-sub mb-3">wpm over time</div>
      <div class="flex items-end gap-px h-20">
        <div
          v-for="(point, i) in wpmHistory"
          :key="i"
          class="bg-editor-accent/60 hover:bg-editor-accent transition-colors duration-150 rounded-t-sm"
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

    <!-- Restart hint -->
    <div class="text-sm text-editor-sub">
      press <span class="text-editor-text">tab</span> to restart
    </div>
  </div>
</template>
