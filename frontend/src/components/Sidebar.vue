<script setup>
import { ref } from 'vue'

defineProps({
  activeView: { type: String, default: 'home' },
})

const emit = defineEmits(['navigate', 'openSettings'])

const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
]
</script>

<template>
  <aside class="fixed left-0 top-0 h-screen w-16 flex flex-col items-center py-6 z-40 sidebar-bg border-r border-editor-sub/10">
    <!-- Logo -->
    <div class="mb-8 select-none">
      <div class="w-9 h-9 rounded-lg bg-editor-accent/15 flex items-center justify-center text-editor-accent font-bold text-lg tracking-tight cursor-default">
        K
      </div>
    </div>

    <!-- Nav Items -->
    <nav class="flex flex-col items-center gap-1 flex-1">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="emit('navigate', item.id)"
        class="group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
        :class="activeView === item.id
          ? 'bg-editor-accent/15 text-editor-accent'
          : 'text-editor-sub hover:text-editor-text hover:bg-editor-sub/10'"
      >
        <!-- Home icon -->
        <svg v-if="item.icon === 'home'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>

        <!-- Trophy icon -->
        <svg v-if="item.icon === 'trophy'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>

        <!-- Tooltip -->
        <span class="absolute left-full ml-3 px-2 py-1 rounded bg-editor-text text-editor-bg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
          {{ item.label }}
        </span>
      </button>
    </nav>

    <!-- Bottom: Settings -->
    <div class="flex flex-col items-center gap-1">
      <button
        @click="emit('openSettings')"
        class="group relative w-10 h-10 rounded-lg flex items-center justify-center text-editor-sub hover:text-editor-text hover:bg-editor-sub/10 transition-all duration-150 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span class="absolute left-full ml-3 px-2 py-1 rounded bg-editor-text text-editor-bg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
          Settings
        </span>
      </button>
    </div>
  </aside>
</template>
