<script setup>
defineProps({
  mode: String,
  timeOption: Number,
  wordOption: Number,
  language: String,
  isActive: Boolean,
})

const emit = defineEmits([
  'update:mode', 
  'update:timeOption', 
  'update:wordOption',
  'update:language',
  'customTimeClick',
  'customWordClick'
])

const timeOptions = [15, 30, 60, 120]
const wordOptions = [10, 25, 50, 100]
</script>

<template>
  <div class="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-sm select-none transition-opacity duration-300"
       :class="isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'">

    <!-- Language Selector -->
    <div class="flex items-center gap-2">
      <button
        @click="emit('update:language', 'english')"
        class="px-2 py-0.5 transition-colors duration-200 cursor-pointer text-xs"
        :class="language === 'english' ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
      >
        english
      </button>
      <span class="text-editor-sub/30 text-xs">|</span>
      <button
        @click="emit('update:language', 'indonesian')"
        class="px-2 py-0.5 transition-colors duration-200 cursor-pointer text-xs"
        :class="language === 'indonesian' ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
      >
        indonesian
      </button>
    </div>

    <span class="hidden md:inline text-editor-sub/30">|</span>

    <div class="flex items-center gap-6">
      <!-- Mode Toggle -->
      <div class="flex items-center gap-2">
        <button
          @click="emit('update:mode', 'time')"
          class="px-2 py-0.5 transition-colors duration-200 cursor-pointer"
          :class="mode === 'time' ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
        >
          time
        </button>
        <span class="text-editor-sub/30">|</span>
        <button
          @click="emit('update:mode', 'words')"
          class="px-2 py-0.5 transition-colors duration-200 cursor-pointer"
          :class="mode === 'words' ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
        >
          words
        </button>
      </div>

      <span class="text-editor-sub/30">|</span>

      <!-- Time Options -->
      <div v-if="mode === 'time'" class="flex items-center gap-2">
        <button
          v-for="t in timeOptions"
          :key="t"
          @click="emit('update:timeOption', t)"
          class="px-2 py-0.5 transition-colors duration-200 cursor-pointer"
          :class="timeOption === t ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
        >
          {{ t }}
        </button>
        <button
          @click="emit('customTimeClick')"
          class="px-2 py-0.5 transition-colors duration-200 cursor-pointer flex items-center gap-1"
          :class="!timeOptions.includes(timeOption) ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>

      <!-- Word Options -->
      <div v-else class="flex items-center gap-2">
        <button
          v-for="w in wordOptions"
          :key="w"
          @click="emit('update:wordOption', w)"
          class="px-2 py-0.5 transition-colors duration-200 cursor-pointer"
          :class="wordOption === w ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
        >
          {{ w }}
        </button>
        <button
          @click="emit('customWordClick')"
          class="px-2 py-0.5 transition-colors duration-200 cursor-pointer flex items-center gap-1"
          :class="!wordOptions.includes(wordOption) ? 'text-editor-accent' : 'text-editor-sub hover:text-editor-text'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
