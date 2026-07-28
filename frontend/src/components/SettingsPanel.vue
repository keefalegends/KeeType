<script setup>
defineProps({
  isOpen: Boolean,
  theme: String,
  language: String,
})

const emit = defineEmits(['close', 'update:theme', 'update:language'])

const themes = [
  { id: 'theme-default', label: 'charcoal', color: '#1e1e1e', accent: '#d7ba7d', shape: 'rounded-full' },
  { id: 'theme-retro-crt', label: 'crt', color: '#000000', accent: '#00ff00', shape: 'rounded-none' },
  { id: 'theme-paper', label: 'paper', color: '#f4f4f0', accent: '#225ccb', shape: 'rounded-sm' },
]

const languages = [
  { id: 'english', label: 'English' },
  { id: 'indonesian', label: 'Indonesian' },
]
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex justify-start"
      @click.self="emit('close')"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 modal-overlay" @click="emit('close')"></div>

      <!-- Panel -->
      <Transition name="slide">
        <div
          v-if="isOpen"
          class="relative ml-16 w-72 h-full sidebar-bg border-r border-editor-sub/10 shadow-2xl overflow-y-auto flex flex-col py-8 px-6"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-sm font-semibold text-editor-text tracking-wide">Settings</h2>
            <button
              @click="emit('close')"
              class="w-7 h-7 rounded-md flex items-center justify-center text-editor-sub hover:text-editor-text hover:bg-editor-sub/10 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Theme Section -->
          <div class="mb-8">
            <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-4">Theme</div>
            <div class="flex flex-col gap-2">
              <button
                v-for="t in themes"
                :key="t.id"
                @click="emit('update:theme', t.id)"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer"
                :class="theme === t.id
                  ? 'bg-editor-accent/10 text-editor-accent'
                  : 'text-editor-sub hover:text-editor-text hover:bg-editor-sub/5'"
              >
                <div
                  class="w-4 h-4 border"
                  :class="t.shape"
                  :style="{ backgroundColor: t.color, borderColor: t.accent }"
                ></div>
                <span class="text-xs font-medium">{{ t.label }}</span>
                <svg
                  v-if="theme === t.id"
                  xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                  class="ml-auto text-editor-accent"
                >
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Language Section -->
          <div class="mb-8">
            <div class="text-[10px] uppercase tracking-[0.2em] text-editor-sub mb-4">Language</div>
            <div class="flex flex-col gap-2">
              <button
                v-for="lang in languages"
                :key="lang.id"
                @click="emit('update:language', lang.id)"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer"
                :class="language === lang.id
                  ? 'bg-editor-accent/10 text-editor-accent'
                  : 'text-editor-sub hover:text-editor-text hover:bg-editor-sub/5'"
              >
                <span class="text-xs font-medium">{{ lang.label }}</span>
                <svg
                  v-if="language === lang.id"
                  xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                  class="ml-auto text-editor-accent"
                >
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-auto pt-6 border-t border-editor-sub/10">
            <div class="text-[10px] text-editor-sub/40 leading-relaxed">
              open source · built for speed
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}
</style>
