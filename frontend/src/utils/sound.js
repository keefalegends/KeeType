// Web Audio API Sound Synthesizer for Mech Keyboard Clicks
// Generates synthetic cherry mx-like click sounds dynamically without external dependency files.
// Also supports loading custom MP3 sound profiles from the local public folder.

let audioCtx = null;
const audioBuffers = {
  typewriter: {
    click: null,
    space: null,
    backspace: null
  }
};

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

// Preload tactile-keyboard sounds from local public folder
export async function preloadMp3Sounds() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const files = {
    click: '/Tactile-Keyboard/click.mp3',
    space: '/Tactile-Keyboard/space.mp3',
    backspace: '/Tactile-Keyboard/backspace.mp3'
  };

  for (const [key, url] of Object.entries(files)) {
    if (audioBuffers.typewriter[key]) continue; // already loaded
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      // Decode audio data safely
      ctx.decodeAudioData(arrayBuffer, (buffer) => {
        audioBuffers.typewriter[key] = buffer;
      }, (err) => {
        console.warn(`Failed to decode tactile ${key} sound:`, err);
      });
    } catch (err) {
      console.warn(`Failed to fetch tactile ${key} sound:`, err);
    }
  }
}

// Generate synthesizer-based Bubble Pop Sound
function playBubblePopSound(type, volume, ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

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
    osc.frequency.setValueAtTime(350 + Math.random() * 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.25 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
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

// Play preloaded local MP3 files
function playLocalTypewriterSound(type, volume, ctx) {
  const keyMap = {
    space: 'space',
    backspace: 'backspace',
    default: 'click'
  };

  const fileKey = keyMap[type] || 'click';
  const buffer = audioBuffers.typewriter[fileKey];

  if (!buffer) {
    // Fallback dynamically to synthetic Cherry MX Brown if audio files are not preloaded yet
    playCherryMXBrownSound(type, volume, ctx);
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.7 * volume, ctx.currentTime);

  source.connect(gain);
  gain.connect(ctx.destination);

  // Pitch variation (+/- 5%) for natural realism
  const randomPlaybackRate = 0.95 + Math.random() * 0.1;
  source.playbackRate.value = randomPlaybackRate;

  source.start(ctx.currentTime);
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
      playLocalTypewriterSound(type, volMultiplier, ctx);
    } else if (soundProfile === 'cherry-mx-brown') {
      playCherryMXBrownSound(type, volMultiplier, ctx);
    }
  } catch (err) {
    console.warn('Web Audio Playback failed:', err);
  }
}
