// Web Audio API Synthesizer for high-octane Formula 1 Grand Prix sounds

class F1SoundEngine {
  private ctx: AudioContext | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private crowdGain: GainNode | null = null;
  private crowdSource: AudioBufferSourceNode | null = null;
  private muted: boolean = false;
  private isEngineRunning: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.22, this.ctx.currentTime);
    }
    if (this.crowdGain && this.ctx) {
      this.crowdGain.gain.setValueAtTime(muted ? 0 : 0.12, this.ctx.currentTime);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // 5 Red Lights Start Sequence Beeps (F1 Gantry)
  public playGantryLightBeep() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Start continuous F1 engine rumble / whine
  public startEngine() {
    if (this.muted || this.isEngineRunning) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      this.isEngineRunning = true;

      // Two harmonic oscillators for realistic F1 high-rpm timbre
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      // Base idle/acceleration frequency ~380Hz
      this.engineOsc1.frequency.setValueAtTime(360, t);
      this.engineOsc2.frequency.setValueAtTime(720, t);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(1800, t);
      this.engineFilter.Q.value = 2.5;

      this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.2, t);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start(t);
      this.engineOsc2.start(t);

      this.startGrandstandCrowd();
    } catch {
      // Audio fallback gracefully
    }
  }

  // Update engine pitch according to speed/gear shifts
  public setEngineRpm(speedRatio: number) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2) return;
    const t = this.ctx.currentTime;

    // Simulate gear changes with sawtooth frequency curve
    const cycle = (speedRatio * 5) % 1;
    const baseFreq = 280 + cycle * 420;

    this.engineOsc1.frequency.linearRampToValueAtTime(baseFreq, t + 0.08);
    this.engineOsc2.frequency.linearRampToValueAtTime(baseFreq * 2, t + 0.08);
  }

  public stopEngine() {
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
        this.engineOsc1 = null;
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
        this.engineOsc2 = null;
      }
      this.isEngineRunning = false;
      this.stopGrandstandCrowd();
    } catch {
      // Ignore cleanup error
    }
  }

  // Tire screech around tight chicanes / hairpins
  public playTireScreech() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.45;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.linearRampToValueAtTime(3400, t + 0.2);
    filter.frequency.exponentialRampToValueAtTime(1800, t + dur);
    filter.Q.value = 5.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Kerb vibration buzz
  public playKerbBuzz() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(75, t);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // DRS Activation Beep (Double beep familiar to F1 fans)
  public playDrsChime() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.1].forEach((delay) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t + delay);

      gain.gain.setValueAtTime(0.2, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.08);
    });
  }

  // Team Radio Beep & Squelch
  public playTeamRadio() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Walkie-talkie squelch tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Grandstand crowd background roar
  private startGrandstandCrowd() {
    if (this.muted || !this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555;
        b1 = 0.99332 * b1 + white * 0.0750;
        b2 = 0.96900 * b2 + white * 0.1538;
        data[i] = (b0 + b1 + b2) * 0.08;
      }

      this.crowdSource = this.ctx.createBufferSource();
      this.crowdSource.buffer = buffer;
      this.crowdSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      this.crowdGain = this.ctx.createGain();
      this.crowdGain.gain.setValueAtTime(this.muted ? 0 : 0.12, this.ctx.currentTime);

      this.crowdSource.connect(filter);
      filter.connect(this.crowdGain);
      this.crowdGain.connect(this.ctx.destination);

      this.crowdSource.start();
    } catch {
      // Audio fallback
    }
  }

  private stopGrandstandCrowd() {
    try {
      if (this.crowdSource) {
        this.crowdSource.stop();
        this.crowdSource.disconnect();
        this.crowdSource = null;
      }
    } catch {
      // Ignore
    }
  }

  // Checkered Flag Airhorn & Grandstand Cheering Eruption
  public playCheckeredFlag() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Airhorn burst
    [440, 554.37, 659.25].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.2);
    });
  }

  // Podium Celebration Fanfare (Epic GP Victory Anthem)
  public playPodiumFanfare() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Uplifting brass triumphant melody in D Major / G Major
    const anthemNotes = [
      { freq: 293.66, delay: 0.0, dur: 0.3 },   // D4
      { freq: 369.99, delay: 0.25, dur: 0.3 },  // F#4
      { freq: 440.00, delay: 0.5, dur: 0.5 },   // A4
      { freq: 587.33, delay: 0.9, dur: 0.9 },   // D5
      { freq: 554.37, delay: 1.4, dur: 0.3 },   // C#5
      { freq: 587.33, delay: 1.65, dur: 1.4 },  // D5
      { freq: 739.99, delay: 2.1, dur: 1.6 },   // F#5
      { freq: 880.00, delay: 2.6, dur: 2.2 },   // A5
    ];

    anthemNotes.forEach((note) => {
      if (!this.ctx) return;
      const start = t + note.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.24, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + note.dur);
    });
  }
}

export const f1Sound = new F1SoundEngine();
