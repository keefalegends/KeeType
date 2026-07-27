<script setup>
defineProps({
  mode: String,
  timeOption: Number,
  wordOption: Number,
  isActive: Boolean,
})

const emit = defineEmits(['update:mode', 'update:timeOption', 'update:wordOption'])

const timeOptions = [15, 30, 60, 120]
const wordOptions = [10, 25, 50, 100]
</script>

<template>
  <div class="flex items-center justify-center gap-6 text-sm select-none transition-opacity duration-300"
       :class="isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'">

    <!-- Mode Toggle -->
    <div class="flex items-center gap-3">
      <button
        @click="emit('update:mode', 'time')"
        class="px-2 py-1 transition-colors duration-200 cursor-pointer"
        :class="mode === 'time' ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
      >
        time
      </button>
      <span class="text-editor-sub">|</span>
      <button
        @click="emit('update:mode', 'words')"
        class="px-2 py-1 transition-colors duration-200 cursor-pointer"
        :class="mode === 'words' ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
      >
        words
      </button>
    </div>

    <span class="text-editor-sub">|</span>

    <!-- Time Options -->
    <div v-if="mode === 'time'" class="flex items-center gap-3">
      <button
        v-for="t in timeOptions"
        :key="t"
        @click="emit('update:timeOption', t)"
        class="px-2 py-1 transition-colors duration-200 cursor-pointer"
        :class="timeOption === t ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
      >
        {{ t }}
      </button>
    </div>

    <!-- Word Options -->
    <div v-else class="flex items-center gap-3">
      <button
        v-for="w in wordOptions"
        :key="w"
        @click="emit('update:wordOption', w)"
        class="px-2 py-1 transition-colors duration-200 cursor-pointer"
        :class="wordOption === w ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
      >
        {{ w }}
      </button>
    </div>
  </div>
</template>
