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
const wordsWrapper = ref(null)
const caretRef = ref(null)

const caretStyle = ref({ top: '0px', left: '0px' })
const wrapperTranslateY = ref(0)
const lineHeightPx = ref(0)

// Helper: Calculate standard line height based on first word height
function calculateLineHeight() {
  if (!wordsContainer.value) return
  const firstWord = wordsContainer.value.querySelector('[data-word="0"]')
  if (firstWord) {
    lineHeightPx.value = firstWord.getBoundingClientRect().height
  }
}

function getCharClass(wordIndex, charIndex) {
  const typed = props.typedChars[wordIndex]?.[charIndex]
  if (!typed) {
    return 'text-editor-sub'
  }
  if (typed.status === 'correct') return 'text-editor-correct char-typed'
  if (typed.status === 'incorrect') return 'text-editor-error underline decoration-editor-error/50 char-typed char-error'
  if (typed.status === 'extra') return 'text-editor-error-extra char-typed'
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

// Update caret and scroll position
function updateCaret() {
  if (!wordsWrapper.value || !wordsContainer.value || props.isFinished) return

  nextTick(() => {
    if (!lineHeightPx.value) calculateLineHeight()

    const wordEl = wordsWrapper.value.querySelector(`[data-word="${props.currentWordIndex}"]`)
    if (!wordEl) return

    const charEl = wordEl.querySelector(`[data-char="${props.currentCharIndex}"]`)
    
    // We use wrapper for positioning relative to the moving content
    const wrapperRect = wordsWrapper.value.getBoundingClientRect()
    // We use container for absolute offset tracking
    const containerRect = wordsContainer.value.getBoundingClientRect()

    // 1. Calculate relative positions
    let targetTop = 0
    let targetLeft = 0
    let absWordTop = 0

    if (charEl) {
      const charRect = charEl.getBoundingClientRect()
      targetTop = charRect.top - wrapperRect.top
      targetLeft = charRect.left - wrapperRect.left
      absWordTop = charRect.top - containerRect.top
    } else {
      const lastCharIndex = props.currentCharIndex - 1
      const lastEl = wordEl.querySelector(`[data-char="${lastCharIndex}"]`)
      if (lastEl) {
        const lastRect = lastEl.getBoundingClientRect()
        targetTop = lastRect.top - wrapperRect.top
        targetLeft = lastRect.right - wrapperRect.left
        absWordTop = lastRect.top - containerRect.top
      } else {
        const wordRect = wordEl.getBoundingClientRect()
        targetTop = wordRect.top - wrapperRect.top
        targetLeft = wordRect.left - wrapperRect.left
        absWordTop = wordRect.top - containerRect.top
      }
    }

    caretStyle.value = {
      top: `${targetTop}px`,
      left: `${targetLeft}px`,
    }

    // 2. Handle Scrolling (Keep active line in 2nd row max)
    // If word's top position relative to viewable container is >= line height * 2 
    // (meaning it's on the 3rd line or lower visually)
    if (absWordTop > lineHeightPx.value * 1.5) {
      // Shift wrapper up by one line height
      wrapperTranslateY.value -= lineHeightPx.value
    } else if (absWordTop < -lineHeightPx.value * 0.5) {
      // Shift wrapper down if we backspaced up past the visible area
      wrapperTranslateY.value += lineHeightPx.value
    }
  })
}

// Reset scroll on game restart
watch(() => props.isActive, (active) => {
  if (!active) wrapperTranslateY.value = 0
})

watch(() => [props.currentWordIndex, props.currentCharIndex, props.typedChars], updateCaret, { deep: true })
onMounted(updateCaret)
</script>

<template>
  <div class="relative max-w-4xl mx-auto">
    <!-- Words Display -->
    <div
      ref="wordsContainer"
      class="relative text-3xl leading-loose overflow-hidden select-none pb-2"
      style="max-height: 6.6em;"
    >
      <!-- Moving Wrapper -->
      <div 
        ref="wordsWrapper"
        class="relative transition-transform duration-200 ease-out"
        :style="{ transform: `translateY(${wrapperTranslateY}px)` }"
      >
        <!-- Caret -->
        <div
          v-if="!isFinished"
          ref="caretRef"
          class="absolute w-0.5 bg-editor-caret rounded-full z-10"
          :class="isActive ? 'caret-no-blink' : 'caret-blink'"
          :style="{
            ...caretStyle,
            height: '1.6em',
            transition: 'top 80ms cubic-bezier(0.4,0,0.2,1), left 80ms cubic-bezier(0.4,0,0.2,1)',
          }"
        ></div>

        <!-- Words -->
        <span
          v-for="(word, wi) in words"
          :key="wi"
          :data-word="wi"
          class="word inline-block mb-2"
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
  </div>
</template>

<style scoped>
.word {
  margin-right: 0.65em;
  transition: opacity 0.2s ease, filter 0.2s ease;
}

@keyframes char-pop {
  0% {
    transform: scale(0.85);
  }
  60% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes char-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1.5px); }
  75% { transform: translateX(1.5px); }
}

.char-typed {
  display: inline-block;
  animation: char-pop 0.12s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
}

.char-error {
  animation: char-pop 0.12s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards, char-shake 0.15s ease-in-out;
}
</style>
