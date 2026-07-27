<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  words: Array,
  currentWordIndex: Number,
  currentCharIndex: Number,
  typedChars: Array,
  isActive: Boolean,
  isFinished: Boolean,
})

const wordsContainer = ref(null)
const caretRef = ref(null)
const caretStyle = ref({ top: '0px', left: '0px' })

function getCharClass(wordIndex, charIndex) {
  const typed = props.typedChars[wordIndex]?.[charIndex]
  if (!typed) {
    // Not yet typed
    return 'text-editor-sub'
  }
  if (typed.status === 'correct') return 'text-editor-correct'
  if (typed.status === 'incorrect') return 'text-editor-error underline decoration-editor-error/50'
  if (typed.status === 'extra') return 'text-editor-error-extra'
  if (typed.status === 'missed') return 'text-editor-error opacity-50'
  return 'text-editor-sub'
}

function isCurrentWord(wordIndex) {
  return wordIndex === props.currentWordIndex
}

function getExtraChars(wordIndex) {
  const word = props.words[wordIndex]
  const typed = props.typedChars[wordIndex] || []
  if (typed.length <= word.length) return []
  return typed.slice(word.length)
}

function getWordClass(wordIndex) {
  // If this word is already completed (before current word)
  if (wordIndex < props.currentWordIndex) {
    const word = props.words[wordIndex]
    const typed = props.typedChars[wordIndex] || []
    // Check if any char was wrong or missed
    const hasError = typed.some(c => c.status !== 'correct') ||
                     typed.length < word.length
    if (hasError) return 'underline decoration-editor-error/30 decoration-2 underline-offset-4'
  }
  return ''
}

// Update caret position
function updateCaret() {
  if (!wordsContainer.value || props.isFinished) return

  nextTick(() => {
    const wordEl = wordsContainer.value?.querySelector(`[data-word="${props.currentWordIndex}"]`)
    if (!wordEl) return

    const charEl = wordEl.querySelector(`[data-char="${props.currentCharIndex}"]`)
    const containerRect = wordsContainer.value.getBoundingClientRect()

    if (charEl) {
      const charRect = charEl.getBoundingClientRect()
      caretStyle.value = {
        top: `${charRect.top - containerRect.top}px`,
        left: `${charRect.left - containerRect.left}px`,
      }
    } else {
      // After last char — position at end of last typed char
      const lastCharIndex = props.currentCharIndex - 1
      const lastEl = wordEl.querySelector(`[data-char="${lastCharIndex}"]`)
      if (lastEl) {
        const lastRect = lastEl.getBoundingClientRect()
        caretStyle.value = {
          top: `${lastRect.top - containerRect.top}px`,
          left: `${lastRect.right - containerRect.left}px`,
        }
      } else {
        // Beginning of word
        const wordRect = wordEl.getBoundingClientRect()
        caretStyle.value = {
          top: `${wordRect.top - containerRect.top}px`,
          left: `${wordRect.left - containerRect.left}px`,
        }
      }
    }
  })
}

watch(() => [props.currentWordIndex, props.currentCharIndex, props.typedChars], updateCaret, { deep: true })
onMounted(updateCaret)
</script>

<template>
  <div class="relative max-w-4xl mx-auto">
    <!-- Words Display -->
    <div
      ref="wordsContainer"
      class="relative text-2xl leading-relaxed overflow-hidden select-none"
      style="max-height: 7.2em;"
    >
      <!-- Caret -->
      <div
        v-if="!isFinished"
        ref="caretRef"
        class="absolute w-0.5 bg-editor-caret rounded-full transition-all duration-75 z-10"
        :class="isActive ? 'caret-no-blink' : 'caret-blink'"
        :style="{
          ...caretStyle,
          height: '1.6em',
        }"
      ></div>

      <!-- Words -->
      <span
        v-for="(word, wi) in words"
        :key="wi"
        :data-word="wi"
        class="inline-block mr-2.5 mb-1"
        :class="getWordClass(wi)"
      >
        <!-- Characters -->
        <span
          v-for="(char, ci) in word.split('')"
          :key="ci"
          :data-char="ci"
          class="inline-block transition-colors duration-75"
          :class="getCharClass(wi, ci)"
        >{{ char }}</span>

        <!-- Extra characters (overtyped) -->
        <span
          v-for="(extra, ei) in getExtraChars(wi)"
          :key="'extra-' + ei"
          :data-char="word.length + ei"
          class="inline-block text-editor-error-extra transition-colors duration-75"
        >{{ extra.char }}</span>
      </span>
    </div>
  </div>
</template>
