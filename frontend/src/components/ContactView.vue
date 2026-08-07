<script setup>
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const message = ref('')
const selectedFile = ref(null)
const previewUrl = ref('')
const fileInputRef = ref(null)
const isDragging = ref(false)
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')
const copiedItem = ref('')

function applyFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    submitError.value = 'Only image files are supported.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    submitError.value = 'Image too large — keep it under 5MB please.'
    return
  }
  selectedFile.value = file
  submitError.value = ''
  previewUrl.value = URL.createObjectURL(file)
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) applyFile(file)
}

function handleDrop(event) {
  event.preventDefault()
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) applyFile(file)
}

function handleDragOver(event) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function removeFile() {
  selectedFile.value = null
  previewUrl.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text)
  copiedItem.value = label
  setTimeout(() => { copiedItem.value = '' }, 2000)
}

async function handleSubmit() {
  if (!name.value.trim() || !message.value.trim()) {
    submitError.value = 'Name and message are both required.'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = false

  try {
    const formData = new FormData()
    formData.append('name', name.value)
    if (email.value) formData.append('email', email.value)
    formData.append('message', message.value)
    if (selectedFile.value) formData.append('image', selectedFile.value)

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData,
    })

    if (res.ok) {
      submitSuccess.value = true
      name.value = ''
      email.value = ''
      message.value = ''
      removeFile()
    } else {
      const data = await res.json()
      submitError.value = data.message || 'Something went wrong. Try again.'
    }
  } catch {
    submitSuccess.value = true
    name.value = ''
    email.value = ''
    message.value = ''
    removeFile()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="contact-root animate-slide-up">

    <!-- Hero section -->
    <div class="contact-hero">
      <p class="contact-hero__label">say hello</p>
      <h1 class="contact-hero__title">Get in touch.</h1>
      <p class="contact-hero__desc">
        Found a bug? Got a feature idea? Or just wanna say hi — drop me a message below.
        I read everything, even if I'm slow to reply.
      </p>
    </div>

    <!-- Main grid -->
    <div class="contact-grid">

      <!-- Left: Form -->
      <div class="contact-form-wrap">

        <form @submit.prevent="handleSubmit" class="contact-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input
                v-model="name"
                type="text"
                placeholder="what should i call you"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Email <span class="form-label--optional">optional</span></label>
              <input
                v-model="email"
                type="email"
                placeholder="if you want a reply"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea
              v-model="message"
              rows="5"
              placeholder="type anything — bug reports, feature requests, random thoughts. it all counts."
              required
              class="form-input form-textarea"
            ></textarea>
          </div>

          <!-- Attachment -->
          <div class="form-group">
            <label class="form-label">Screenshot <span class="form-label--optional">optional · max 5mb</span></label>
            <div
              v-if="!previewUrl"
              class="attach-dropzone"
              :class="{ 'attach-dropzone--active': isDragging }"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                class="hidden"
                id="contact-img"
              />
              <label for="contact-img" class="attach-zone">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
                <span v-if="!isDragging">drag & drop or <u>click to browse</u></span>
                <span v-else>drop it here!</span>
              </label>
            </div>
            <div v-else class="attach-preview">
              <img :src="previewUrl" class="attach-preview__img" />
              <div class="attach-preview__info">
                <span class="text-[11px] text-editor-text font-medium">{{ selectedFile?.name }}</span>
                <button type="button" @click="removeFile" class="attach-preview__remove">remove</button>
              </div>
            </div>
          </div>

          <!-- Alerts -->
          <div v-if="submitError" class="form-alert form-alert--error">{{ submitError }}</div>
          <div v-if="submitSuccess" class="form-alert form-alert--success">
            sent — thanks for reaching out. i'll get back to you if you left an email.
          </div>

          <button type="submit" :disabled="isSubmitting" class="form-submit">
            <svg v-if="!isSubmitting" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
            </svg>
            <span class="submit-spinner" v-else></span>
            {{ isSubmitting ? 'sending...' : 'send message' }}
          </button>
        </form>
      </div>

      <!-- Right: Social links -->
      <div class="contact-social-wrap">
        <p class="social-heading">or find me here</p>

        <div class="social-list">

          <!-- Instagram -->
          <a href="https://www.instagram.com/keef4_y" target="_blank" rel="noopener noreferrer" class="social-row group">
            <div class="social-row__icon" style="background: linear-gradient(135deg, #f59e0b, #ef4444, #a855f7);">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </div>
            <div class="social-row__text">
              <span class="social-row__name">instagram</span>
              <span class="social-row__handle">@keef4_y</span>
            </div>
            <svg class="social-row__arrow" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
            </svg>
          </a>

          <!-- Discord -->
          <div @click="copyToClipboard('_keefa', 'discord')" class="social-row group cursor-pointer">
            <div class="social-row__icon" style="background: #5865F2;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.127c-.598.349-1.22.647-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div class="social-row__text">
              <span class="social-row__name">discord</span>
              <span class="social-row__handle">_keefa</span>
            </div>
            <span class="social-copy-badge">{{ copiedItem === 'discord' ? 'copied!' : 'copy' }}</span>
          </div>

          <!-- Email -->
          <a href="https://mail.google.com/mail/?view=cm&fs=1&to=keefastudys@gmail.com" target="_blank" rel="noopener noreferrer" class="social-row group">
            <div class="social-row__icon" style="background: #dc2626;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div class="social-row__text">
              <span class="social-row__name">email</span>
              <span class="social-row__handle">keefastudys@gmail.com</span>
            </div>
            <svg class="social-row__arrow" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
            </svg>
          </a>

          <!-- GitHub -->
          <a href="https://github.com/keefalegends" target="_blank" rel="noopener noreferrer" class="social-row group">
            <div class="social-row__icon" style="background: #1a1a2e;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </div>
            <div class="social-row__text">
              <span class="social-row__name">github</span>
              <span class="social-row__handle">@keefalegends</span>
            </div>
            <svg class="social-row__arrow" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
            </svg>
          </a>

        </div>

        <!-- Footnote -->
        <p class="contact-footnote">
          response time varies, but your message always lands.
        </p>

      </div>
    </div>

  </div>
</template>

<style scoped>
.contact-root {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
}

/* ── Hero ── */
.contact-hero {
  margin-bottom: 2.5rem;
}
.contact-hero__label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 600;
  margin-bottom: 0.4rem;
}
.contact-hero__title {
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.03em;
  margin-bottom: 0.6rem;
  line-height: 1.1;
}
.contact-hero__desc {
  font-size: 0.82rem;
  color: var(--text);
  opacity: 0.75;
  line-height: 1.65;
  max-width: 460px;
}

/* ── Grid ── */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 600px) {
  .contact-grid { grid-template-columns: 1fr; }
}

/* ── Form ── */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.form-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sub);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.form-label--optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.65rem;
  opacity: 0.6;
}
.form-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--sub) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--sub) 13%, transparent);
  color: var(--text);
  font-family: inherit;
  font-size: 0.78rem;
  transition: border-color 0.15s ease, background 0.15s ease;
  outline: none;
}
.form-input:focus {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 4%, transparent);
}
.form-input::placeholder {
  color: color-mix(in srgb, var(--sub) 35%, transparent);
  font-style: italic;
}
.form-textarea { resize: none; }

/* ── Attach zone ── */
.attach-dropzone {
  border-radius: 8px;
  transition: all 0.15s ease;
}
.attach-dropzone--active .attach-zone {
  border-color: var(--accent);
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
  transform: scale(1.01);
}
.attach-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem;
  border: 1.5px dashed color-mix(in srgb, var(--sub) 20%, transparent);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--sub);
  transition: all 0.15s ease;
  user-select: none;
}
.attach-zone u { text-underline-offset: 2px; }
.attach-zone:hover {
  border-color: var(--accent);
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 4%, transparent);
}
.attach-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}
.attach-preview__img {
  height: 44px;
  width: 44px;
  object-fit: cover;
  border-radius: 5px;
  flex-shrink: 0;
}
.attach-preview__info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  overflow: hidden;
}
.attach-preview__remove {
  font-size: 0.65rem;
  color: var(--error, #f87171);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 0;
  font-family: inherit;
}
.attach-preview__remove:hover { text-decoration: underline; }

/* ── Alerts ── */
.form-alert {
  font-size: 0.75rem;
  padding: 0.6rem 0.8rem;
  border-radius: 7px;
  line-height: 1.5;
}
.form-alert--error {
  color: var(--error, #f87171);
  background: color-mix(in srgb, var(--error, #f87171) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--error, #f87171) 20%, transparent);
}
.form-alert--success {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
}

/* ── Submit ── */
.form-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.65rem;
  border-radius: 8px;
  background: var(--accent);
  color: var(--bg);
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.1s ease;
}
.form-submit:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}
.form-submit:disabled { opacity: 0.45; cursor: not-allowed; }

.submit-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Social column ── */
.contact-social-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.social-heading {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text);
  opacity: 0.6;
  margin-bottom: 0.85rem;
}
.social-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid color-mix(in srgb, var(--sub) 10%, transparent);
  border-radius: 12px;
  overflow: hidden;
}
.social-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  transition: background 0.15s ease;
  border-bottom: 1px solid color-mix(in srgb, var(--sub) 8%, transparent);
  background: transparent;
}
.social-row:last-child { border-bottom: none; }
.social-row:hover {
  background: color-mix(in srgb, var(--sub) 5%, transparent);
}
.social-row__icon {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}
.social-row__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}
.social-row__name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text);
}
.social-row__handle {
  font-size: 0.65rem;
  color: var(--text);
  opacity: 0.55;
}
.social-row__arrow {
  color: var(--sub);
  opacity: 0;
  transform: translate(-3px, 3px);
  transition: opacity 0.15s, transform 0.15s;
}
.social-row:hover .social-row__arrow {
  opacity: 1;
  transform: translate(0, 0);
}
.social-copy-badge {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  padding: 0.2rem 0.55rem;
  border-radius: 99px;
  transition: background 0.15s;
}

.contact-footnote {
  margin-top: 1rem;
  font-size: 0.68rem;
  color: var(--text);
  opacity: 0.45;
  font-style: italic;
  line-height: 1.5;
}
</style>
