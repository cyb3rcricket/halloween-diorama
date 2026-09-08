/**
 * Audio System using Web Audio API (No external sound files required)
 * Synthesizes cute sound effects for kitten, ghost, lanterns, and ambient atmosphere.
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.isMuted = true; // Starts muted until user enables or interacts
    this.isInitialized = false;
    this.ambientNodes = [];
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resumeContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.resumeContext();
    this.isMuted = !this.isMuted;

    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.8, t + 0.05);

      if (!this.isMuted && this.ambientNodes.length === 0) {
        this.startAmbience();
      }
    }

    return !this.isMuted;
  }

  // Cute Kitten Meow!
  playMeow() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Cute high kitten pitch curve: starts medium, rises slightly, slides down tenderly
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(760, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.35);

    // Subtle sweet vibrato
    vibrato.frequency.setValueAtTime(6.5, t);
    vibratoGain.gain.setValueAtTime(8, t);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    // Formant filter for vocal "meow" vowel transition
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.5, t);
    filter.frequency.setValueAtTime(850, t);
    filter.frequency.linearRampToValueAtTime(1400, t + 0.12);
    filter.frequency.linearRampToValueAtTime(950, t + 0.38);

    // Amplitude envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    vibrato.start(t);
    osc.stop(t + 0.43);
    vibrato.stop(t + 0.43);
  }

  // Friendly Ethereal Ghost Chime / Giggle!
  playGhostChime() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const pitches = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6 major arpeggio

    pitches.forEach((freq, idx) => {
      const startTime = t + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.04, startTime + 0.45);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

      if (pan) {
        pan.pan.value = 0.25 * (idx % 2 === 0 ? 1 : -1);
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(startTime);
      osc.stop(startTime + 0.62);
    });
  }

  // Warm Tree Lantern Glow Chime
  playLanternGlow() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(329.63, t); // E4
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, t); // E5

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.56);
    osc2.stop(t + 0.56);
  }

  // Little Sparkle / Twinkle Pop
  playSparkle() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 1200 + Math.random() * 400;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.15);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  // Gentle nocturnal ambient breeze & soft crickets
  startAmbience() {
    if (!this.ctx || this.ambientNodes.length > 0) return;

    try {
      // Pink noise generator for gentle breeze
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      whiteNoise.start();

      this.ambientNodes.push(whiteNoise);
    } catch (e) {
      console.warn('Ambience init error:', e);
    }
  }
}

// Global Sound Instance
window.soundManager = new SoundManager();
