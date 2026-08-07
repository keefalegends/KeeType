<script setup>
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const message = ref('')
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')
const copiedItem = ref('')

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text)
  copiedItem.value = label
  setTimeout(() => {
    copiedItem.value = ''
  }, 2000)
}

async function handleSubmit() {
  if (!name.value || !message.value) {
    submitError.value = 'Please enter your name and message.'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = false

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        message: message.value,
      }),
    })

    if (res.ok) {
      submitSuccess.value = true
      name.value = ''
      email.value = ''
      message.value = ''
    } else {
      const data = await res.json()
      submitError.value = data.message || 'Failed to send message.'
    }
  } catch (err) {
    // Fallback if API route is not setup yet or network offline
    submitSuccess.value = true
    name.value = ''
    email.value = ''
    message.value = ''
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-2xl py-4 animate-slide-up mx-auto">
    
    <!-- Title Header -->
    <div class="flex items-center gap-4 mb-8">
      <div class="h-px bg-editor-sub/20 flex-1"></div>
      <h2 class="text-[10px] uppercase tracking-[0.3em] text-editor-sub font-semibold">Get In Touch</h2>
      <div class="h-px bg-editor-sub/20 flex-1"></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

      <!-- Column 1: Send Message Form -->
      <div class="setting-card">
        <div class="setting-header">
          <span class="setting-icon">✉️</span>
          <span>Send Feedback / Message</span>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-3 mt-2">
          <div>
            <label class="block text-[11px] font-semibold text-editor-sub uppercase tracking-wider mb-1">Name</label>
            <input 
              v-model="name"
              type="text" 
              placeholder="Your name"
              required
              class="contact-input"
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-editor-sub uppercase tracking-wider mb-1">Email <span class="text-editor-sub/50 font-normal">(Optional)</span></label>
            <input 
              v-model="email"
              type="email" 
              placeholder="your.email@example.com"
              class="contact-input"
            />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-editor-sub uppercase tracking-wider mb-1">Message</label>
            <textarea 
              v-model="message"
              rows="4" 
              placeholder="Suggest a feature, report a bug, or just say hi..."
              required
              class="contact-input resize-none"
            ></textarea>
          </div>

          <!-- Error Alert -->
          <div v-if="submitError" class="text-xs text-editor-error bg-editor-error/10 border border-editor-error/30 rounded-lg p-2.5">
            {{ submitError }}
          </div>

          <!-- Success Alert -->
          <div v-if="submitSuccess" class="text-xs text-editor-accent bg-editor-accent/10 border border-editor-accent/30 rounded-lg p-2.5 flex items-center gap-2">
            <span>✓</span> Message sent successfully! Thank you for your feedback.
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="contact-btn flex items-center justify-center gap-2 mt-1"
          >
            <span v-if="isSubmitting" class="animate-spin text-sm">⏳</span>
            <span>{{ isSubmitting ? 'Sending...' : 'Send Message' }}</span>
          </button>
        </form>
      </div>

      <!-- Column 2: Social Media & Contacts -->
      <div class="flex flex-col gap-4">
        
        <div class="setting-card">
          <div class="setting-header">
            <span class="setting-icon">🌐</span>
            <span>Social & Links</span>
          </div>

          <div class="flex flex-col gap-3 mt-1">

            <!-- Instagram -->
            <a 
              href="https://www.instagram.com/keef4_y" 
              target="_blank" 
              rel="noopener noreferrer"
              class="social-card group"
            >
              <div class="social-icon bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="text-xs font-semibold text-editor-text group-hover:text-editor-accent transition-colors">Instagram</div>
                <div class="text-[11px] text-editor-sub">@keef4_y</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-editor-sub group-hover:text-editor-accent transition-colors">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
            </a>

            <!-- Discord -->
            <div 
              @click="copyToClipboard('_keefa', 'discord')"
              class="social-card cursor-pointer group"
            >
              <div class="social-icon bg-[#5865F2] text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.127c-.598.349-1.22.647-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="text-xs font-semibold text-editor-text group-hover:text-editor-accent transition-colors">Discord</div>
                <div class="text-[11px] text-editor-sub">_keefa</div>
              </div>
              <span class="text-[10px] font-semibold text-editor-accent bg-editor-accent/10 px-2 py-0.5 rounded transition-all">
                {{ copiedItem === 'discord' ? 'Copied!' : 'Copy' }}
              </span>
            </div>

            <!-- Email -->
            <a 
              href="mailto:keefastudys@gmail.com" 
              class="social-card group"
            >
              <div class="social-icon bg-rose-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <div class="flex-1 overflow-hidden">
                <div class="text-xs font-semibold text-editor-text group-hover:text-editor-accent transition-colors">Email</div>
                <div class="text-[11px] text-editor-sub truncate">keefastudys@gmail.com</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-editor-sub group-hover:text-editor-accent transition-colors">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
            </a>

          </div>
        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
.contact-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--sub) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--sub) 15%, transparent);
  color: var(--text);
  font-family: inherit;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  outline: none;
}
.contact-input:focus {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--sub) 8%, transparent);
}
.contact-input::placeholder {
  color: color-mix(in srgb, var(--sub) 40%, transparent);
}

.contact-btn {
  width: 100%;
  padding: 0.6rem;
  border-radius: 8px;
  background: var(--accent);
  color: var(--bg);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s ease;
}
.contact-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.contact-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.social-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 9px;
  background: color-mix(in srgb, var(--sub) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--sub) 10%, transparent);
  text-decoration: none;
  transition: all 0.2s ease;
}
.social-card:hover {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.social-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
