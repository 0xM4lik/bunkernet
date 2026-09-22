/**
 * Procedural Web Audio Synthesizer (Ear Candy Edition)
 * Zero external audio assets: all sound effects are synthesized in real time
 * with warm analog envelopes, smooth low-pass filtering, and creamy mechanical switch acoustics.
 */

let audioCtx = null;
let audioUnlocked = false;
let audioMuted = false;
let lastStreamTickTime = 0;
let lastKeyTickTime = 0;

export function isAudioMuted() {
  return audioMuted;
}

export function isAudioUnlocked() {
  return audioUnlocked;
}

export function setAudioMuted(muted) {
  audioMuted = Boolean(muted);
  updateAudioUI();
}

export function toggleAudio() {
  if (audioMuted || !audioUnlocked) {
    return enableAudioFromUserGesture().then(() => {
      setAudioMuted(false);
      sound.ready();
      return true;
    });
  } else {
    setAudioMuted(true);
    return Promise.resolve(false);
  }
}

function updateAudioUI() {
  const pill = document.getElementById('audioStatusPill');
  const icon = document.getElementById('audioIcon');
  const text = document.getElementById('audioText');
  if (!pill || !icon || !text) return;

  if (audioUnlocked && !audioMuted && audioCtx && audioCtx.state === 'running') {
    pill.classList.remove('muted');
    pill.classList.add('active');
    icon.textContent = '🔊';
    text.textContent = 'Sound: ON';
  } else {
    pill.classList.add('muted');
    pill.classList.remove('active');
    icon.textContent = '🔇';
    text.textContent = 'Sound: OFF';
  }
}

/**
 * Initializes or retrieves the singleton AudioContext instance.
 * @returns {AudioContext|null} The active Web Audio context.
 */
export function initAudio() {
  if (!audioUnlocked) return null;

  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }

  if (audioCtx.state === 'suspended' && !audioMuted) {
    audioCtx.resume().then(() => {
      updateAudioUI();
    }).catch(() => {});
  } else if (audioCtx.state === 'running') {
    updateAudioUI();
  }

  return audioCtx;
}

export function enableAudioFromUserGesture() {
  audioMuted = false;
  audioUnlocked = true;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    const resumePromise = audioCtx.resume().catch(() => {});
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 250));
    return Promise.race([resumePromise, timeoutPromise]).then(() => {
      audioUnlocked = audioCtx.state === 'running';
      updateAudioUI();
    });
  }
  updateAudioUI();
  return Promise.resolve();
}

export function setupAudioUI() {
  updateAudioUI();
  const pill = document.getElementById('audioStatusPill');
  if (pill) {
    pill.addEventListener('click', () => {
      toggleAudio();
    });
  }
}

/**
 * Synthesizes a warm, creamy sine tone with smooth exponential decay.
 * @param {number} freqStart - Initial frequency in Hz.
 * @param {number} freqEnd - Ending frequency in Hz.
 * @param {number} duration - Duration in seconds.
 * @param {OscillatorType} [type='sine'] - Waveform.
 * @param {number} [gainPeak=0.025] - Peak gain level.
 */
export function tone(freqStart, freqEnd, duration, type = 'sine', gainPeak = 0.025) {
  if (!audioUnlocked || audioMuted) return;
  const ctx = initAudio();
  if (!ctx || ctx.state !== 'running') return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(freqStart, 1), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + Math.min(0.015, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch (e) {}
}

/**
 * Audiophile Ear-Candy Sound FX Library
 */
export const sound = {
  /** Creamy lubed linear mechanical switch click for manual typing */
  keyTick: () => {
    if (!audioUnlocked || audioMuted) return;
    const nowMs = performance.now();
    if (nowMs - lastKeyTickTime < 35) return;
    lastKeyTickTime = nowMs;

    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    try {
      const now = ctx.currentTime;
      // 1. Soft warm bottom-out thock (sine)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(210 + Math.random() * 25, now);
      osc1.frequency.exponentialRampToValueAtTime(75, now + 0.022);
      gain1.gain.setValueAtTime(0.016, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.025);

      // 2. Filtered tactile switch pop
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(750 + Math.random() * 120, now);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.016);
      gain2.gain.setValueAtTime(0.012, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);
      osc2.connect(filter).connect(gain2).connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.018);
    } catch (e) {}
  },

  /** Soft ASMR mechanical tick for typewriter stream (throttled, velvety, no spam) */
  streamTick: () => {
    if (!audioUnlocked || audioMuted) return;
    const nowMs = performance.now();
    if (nowMs - lastStreamTickTime < 48) return; // Strict throttle ensures no buzzing or spam
    lastStreamTickTime = nowMs;

    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.016);

      gain.gain.setValueAtTime(0.009, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.018);
    } catch (e) {}
  },

  /** Ultra-subtle tactile hover tap */
  hoverBlip: () => tone(820, 940, 0.024, 'sine', 0.008),

  /** Lush harmonic glassy chime on window open (D5 -> A5 fifth interval) */
  windowOpen: () => {
    tone(587.33, 587.33, 0.12, 'sine', 0.02);
    setTimeout(() => tone(880.00, 880.00, 0.14, 'sine', 0.018), 35);
  },

  /** Gentle warm descent on window close (A4 -> D4) */
  windowClose: () => tone(440, 293.66, 0.11, 'sine', 0.018),

  /** Warm analog CRT ignition sweep + gentle relay tap */
  terminalOpen: () => {
    if (!audioUnlocked || audioMuted) return;
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.28);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.03, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      setTimeout(() => tone(720, 180, 0.018, 'sine', 0.018), 110);
    } catch (e) {}
  },

  /** Warm phosphor logo ping */
  logoPop: () => {
    tone(523.25, 783.99, 0.16, 'sine', 0.026);
    setTimeout(() => tone(1046.50, 1046.50, 0.18, 'sine', 0.016), 50);
  },

  /** Terminal shutdown tone */
  terminalClose: () => tone(440, 110, 0.22, 'sine', 0.024),

  /** Window minimize cue */
  minimize: () => tone(480, 240, 0.11, 'sine', 0.018),

  /** Window maximize cue */
  maximize: () => tone(240, 480, 0.11, 'sine', 0.018),

  /** Window titlebar drag pickup */
  pickup: () => tone(420, 480, 0.025, 'sine', 0.01),

  /** System ready harmonic major chime (C5 + G5) */
  ready: () => {
    tone(523.25, 523.25, 0.09, 'sine', 0.022);
    setTimeout(() => tone(783.99, 783.99, 0.12, 'sine', 0.02), 50);
  },

  /** Satisfying crystalline confirmation chime for clipboard copy (F#5 -> B5) */
  copySuccess: () => {
    tone(739.99, 739.99, 0.06, 'sine', 0.024);
    setTimeout(() => tone(987.77, 987.77, 0.11, 'sine', 0.022), 40);
  },

  /** Soft low error blip */
  error: () => tone(180, 120, 0.14, 'sine', 0.02),

  /** Micro CRT static discharge */
  glitchStatic: () => {
    tone(140 + Math.random() * 40, 60, 0.03, 'sine', 0.012);
  }
};
