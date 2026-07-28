// Web Audio API Sound Synthesizer for Mech Keyboard Clicks
// Generates synthetic cherry mx-like click sounds dynamically without external dependency files.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate synthesizer-based Bubble Pop Sound
function playBubblePopSound(type, volume, ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  // Bubble sound: fast frequency ramp-up/down, warm round tone
  osc.type = 'sine';
  if (type === 'space') {
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.4 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'backspace') {
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } else {
    // Normal key pop
    osc.frequency.setValueAtTime(350 + Math.random() * 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.25 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }
}

// Generate synthesizer-based Typewriter Sound
function playTypewriterSound(type, volume, ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  // Typewriter sound: High mechanical pitch bandpass + noisy high-pass click
  if (type === 'space') {
    // Typewriter Return Bell: Metallic, pure bell ring sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35); // longer bell decay
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } else if (type === 'backspace') {
    // Heavy paper carriage slide clack (hollow click + low filter)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    gain.gain.setValueAtTime(0.35 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } else {
    // Vintage typewriter key strikes: sharp bandpassed pop
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380 + Math.random() * 100, ctx.currentTime);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, ctx.currentTime);
    filter.Q.value = 6;
    gain.gain.setValueAtTime(0.22 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);

    // High mechanical crunch noise (simulate heavy steel bar hitting paper)
    const bufferSize = ctx.sampleRate * 0.02;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 6000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12 * volume, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseSource.start(ctx.currentTime);
    noiseSource.stop(ctx.currentTime + 0.02);
  }
}

// Generate synthesizer-based Cherry MX Brown Sound (Default)
function playCherryMXBrownSound(type, volume, ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'space') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    gain.gain.setValueAtTime(0.35 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } else if (type === 'backspace') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    gain.gain.setValueAtTime(0.25 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450 + (Math.random() * 40 - 20), ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, ctx.currentTime);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.18 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);

    const bufferSize = ctx.sampleRate * 0.015;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 4000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.015);
  }
}

// Main playback entry point
export function playKeyboardClick(type = 'default', volume = 0.5, soundProfile = 'cherry-mx-brown') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const volMultiplier = Math.max(0, Math.min(1, volume));

  try {
    if (soundProfile === 'bubble') {
      playBubblePopSound(type, volMultiplier, ctx);
    } else if (soundProfile === 'typewriter') {
      playTypewriterSound(type, volMultiplier, ctx);
    } else if (soundProfile === 'cherry-mx-brown') {
      playCherryMXBrownSound(type, volMultiplier, ctx);
    }
  } catch (err) {
    console.warn('Web Audio Playback failed:', err);
  }
}

// Dummy preload function to keep interface compatibility intact
export function preloadMp3Sounds() {
  // Synthesizer doesn't require any preloading!
}
