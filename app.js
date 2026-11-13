/* ============================================================
   BABY GENDER REVEAL GRAND PRIX
   Two F1 cars. Fifteen seconds. One very big surprise.
   ============================================================ */

(() => {
  'use strict';

  // ------------------------------------------------------------
  // Constants & helpers
  // ------------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const RACE_DURATION = 15;      // seconds
  const VIEW_FRACTION = 0.18;    // how much of the track fits on screen
  const ENV_MULT = 2.35;         // extra parallax speed for the scenery
  const SETTINGS_KEY = 'bgp.settings.v1';
  const MUTE_KEY = 'bgp.muted.v1';

  // Celebration sounds played when the gender is announced.
  // `delay` staggers them so the three samples do not pile up on top of
  // each other; `volume` keeps them balanced against the race effects.
  const REVEAL_AUDIO = [
    { src: 'universfield-birthday-party-horn-250238.mp3', delay: 0, volume: 0.55 },
    { src: 'u_jspnqv1glx-1gift-confetti-447240.mp3', delay: 0.25, volume: 0.75 },
    { src: 'scottishperson-sound-effect-baby-laughing-01-237186.mp3', delay: 0.95, volume: 0.65 },
  ];

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const rand = (a, b) => a + Math.random() * (b - a);

  // Share tokens: an opaque 12-character code with an embedded checksum.
  // The last character encodes boy/girl relative to the rest, so the link
  // looks random but can still reveal the pre-picked winner without a server.
  const SHARE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
  const SHARE_LENGTH = 12;

  function shareHash(text) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function randomShareChar() {
    if (window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      return SHARE_ALPHABET[buf[0] % SHARE_ALPHABET.length];
    }
    return SHARE_ALPHABET[Math.floor(Math.random() * SHARE_ALPHABET.length)];
  }

  function makeShareToken(gender) {
    const n = SHARE_ALPHABET.length;
    let prefix = '';
    for (let i = 0; i < SHARE_LENGTH - 1; i++) prefix += randomShareChar();
    const index = (shareHash(prefix) + (gender === 'girl' ? 13 : 0)) % n;
    return prefix + SHARE_ALPHABET[index];
  }

  function readShareToken(token) {
    if (!token || token.length !== SHARE_LENGTH) return null;
    const clean = token.toLowerCase();
    for (let i = 0; i < clean.length; i++) {
      if (SHARE_ALPHABET.indexOf(clean[i]) === -1) return null;
    }
    const prefix = clean.slice(0, -1);
    const marker = clean.slice(-1);
    const n = SHARE_ALPHABET.length;
    const base = shareHash(prefix) % n;
    if (marker === SHARE_ALPHABET[base]) return 'boy';
    if (marker === SHARE_ALPHABET[(base + 13) % n]) return 'girl';
    return null;
  }

  let sharedGender = null;
  try {
    const match = location.hash.match(/^#r=([a-z0-9]+)$/i)
      || location.search.match(/[?&]r=([a-z0-9]+)/i);
    if (match) sharedGender = readShareToken(match[1]);
  } catch (err) { /* ignore malformed URLs */ }

  const TEAM = {
    blue: { main: '#3fb8ff', light: '#c6efff', dark: '#0b5cb0', rgb: '63,184,255' },
    pink: { main: '#ff5fa8', light: '#ffd3e7', dark: '#b61561', rgb: '255,95,168' },
  };

  // ------------------------------------------------------------
  // Canvases & layout
  // ------------------------------------------------------------
  const scene = $('#scene');
  const ctx = scene.getContext('2d');
  const fxCanvas = $('#fx');
  const fxc = fxCanvas.getContext('2d');

  let W = window.innerWidth;
  let H = window.innerHeight;
  let DPR = 1;
  let roadTop = 0;
  let roadBottom = 0;
  let laneBlueGround = 0;
  let lanePinkGround = 0;
  let carLen = 120;
  let ppp = 8000;
  let asphaltPattern = null;
  let T = 0;

  const els = {
    hud: $('#hud'),
    timer: $('#timer'),
    speedBlue: $('#speedBlue'),
    speedPink: $('#speedPink'),
    raceFill: $('#raceFill'),
    tickBlue: $('#tickBlue'),
    tickPink: $('#tickPink'),
    startScreen: $('#startScreen'),
    startBtn: $('#startBtn'),
    againBtn: $('#againBtn'),
    homeBtn: $('#homeBtn'),
    startHint: $('#settingsHint'),
    countdown: $('#countdown'),
    countdownText: $('#countdownText'),
    lights: $('#lights'),
    reveal: $('#reveal'),
    revealTitle: $('#revealTitle'),
    revealSub: $('#revealSub'),
    revealMeta: $('#revealMeta'),
    revealEmojis: $('#revealEmojis'),
    winnerTag: $('#winnerTag'),
    gearBtn: $('#gearBtn'),
    soundBtn: $('#soundBtn'),
    fullscreenBtn: $('#fullscreenBtn'),
    settingsModal: $('#settingsModal'),
    settingsPanel: $('#genderOptions'),
    saveSettings: $('#saveSettings'),
    closeSettings: $('#closeSettings'),
    shareBoy: $('#shareBoy'),
    shareGirl: $('#shareGirl'),
    shareUrl: $('#shareUrl'),
    copyShare: $('#copyShare'),
    shareStatus: $('#shareStatus'),
    surpriseBanner: $('#surpriseBanner'),
    flash: $('#flash'),
  };

  // ------------------------------------------------------------
  // Settings
  // ------------------------------------------------------------
  let settings = { gender: 'random' };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && ['boy', 'girl', 'random'].includes(parsed.gender)) {
        settings.gender = parsed.gender;
      }
    }
  } catch (err) { /* private mode, ignore */ }

  let tempGender = settings.gender;

  // ------------------------------------------------------------
  // Race state
  // ------------------------------------------------------------
  const S = {
    mode: 'idle',            // idle | countdown | racing | finished | revealed
    countStart: 0,
    lightsLit: 0,
    raceStart: 0,
    finishedAt: 0,
    revealAt: 0,
    cdHideAt: 0,
    elapsed: 0,
    u: 0,
    winner: 'blue',
    revealed: false,
    pB: 0,
    pP: 0,
    prevPB: 0,
    prevPP: 0,
    cam: 0.045,
    shake: 0,
    kphB: 0,
    kphP: 0,
    wheelB: 0,
    wheelP: 0,
    freqB: 2.1,
    freqP: 2.4,
    phaseB: 0,
    phaseP: 0,
    smokeAccB: 0,
    smokeAccP: 0,
    nextFirework: 0,
    fxTime: 0,
    lastLeader: null,
    lastOvertake: 0,
    warnIndex: 0,
  };

  const smoke = [];
  const confetti = [];
  const fireworks = [];

  // ------------------------------------------------------------
  // Sound — tiny WebAudio engine, no external assets
  // ------------------------------------------------------------
  const Sound = {
    ctx: null,
    master: null,
    noiseBuffer: null,
    engines: [],
    muted: false,
    revealPlayers: [],
    revealTimers: [],

    prepareRevealAudio() {
      if (this.revealPlayers.length || typeof Audio === 'undefined') return;
      this.revealPlayers = REVEAL_AUDIO.map((cfg) => {
        const audio = new Audio();
        audio.src = cfg.src;
        audio.preload = 'auto';
        audio.volume = cfg.volume;
        audio.muted = this.muted;
        return audio;
      });
    },

    playReveal() {
      this.prepareRevealAudio();
      this.stopReveal();
      if (!this.revealPlayers.length || this.muted) return;

      REVEAL_AUDIO.forEach((cfg, i) => {
        const timer = setTimeout(() => {
          const audio = this.revealPlayers[i];
          if (!audio || this.muted) return;
          try {
            audio.currentTime = 0;
            const attempt = audio.play();
            if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
          } catch (err) { /* ignore blocked playback */ }
        }, cfg.delay * 1000);
        this.revealTimers.push(timer);
      });
    },

    stopReveal() {
      this.revealTimers.forEach((timer) => clearTimeout(timer));
      this.revealTimers = [];
      this.revealPlayers.forEach((audio) => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (err) { /* ignore */ }
      });
    },

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (err) {
        return;
      }

      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;
      this.master.connect(c.destination);

      const len = Math.floor(c.sampleRate * 2.2);
      this.noiseBuffer = c.createBuffer(1, len, c.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      this.engines = [this.makeEngine(-0.45), this.makeEngine(0.45)];
    },

    makeEngine(pan) {
      const c = this.ctx;
      const out = c.createGain();
      out.gain.value = 0;

      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 480;
      filter.Q.value = 1.4;

      if (c.createStereoPanner) {
        const panner = c.createStereoPanner();
        panner.pan.value = pan;
        out.connect(panner);
        panner.connect(this.master);
      } else {
        out.connect(this.master);
      }

      const o1 = c.createOscillator();
      o1.type = 'sawtooth';
      o1.frequency.value = 70;

      const o2 = c.createOscillator();
      o2.type = 'square';
      o2.frequency.value = 106;

      const g2 = c.createGain();
      g2.gain.value = 0.32;

      o1.connect(filter);
      o2.connect(g2);
      g2.connect(filter);
      filter.connect(out);
      o1.start();
      o2.start();

      return { o1, o2, filter, out };
    },

    updateEngines(fb, fp, rev) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const fracs = [fb, fp];

      for (let i = 0; i < 2; i++) {
        const e = this.engines[i];
        if (!e) continue;
        const frac = clamp(fracs[i], 0, 1);
        const base = 58 + frac * 105 + rev * 58;
        e.o1.frequency.setTargetAtTime(base, now, 0.07);
        e.o2.frequency.setTargetAtTime(base * 1.505, now, 0.07);
        e.filter.frequency.setTargetAtTime(400 + frac * 1050 + rev * 850, now, 0.1);
        const quiet = frac < 0.001 && rev < 0.001;
        const amp = quiet ? 0 : Math.min(0.085, 0.012 + frac * 0.052 + rev * 0.04);
        e.out.gain.setTargetAtTime(amp, now, 0.09);
      }
    },

    tone(freq, when, dur, vol, type) {
      if (!this.ctx) return;
      const c = this.ctx;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, when);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(when);
      o.stop(when + dur + 0.05);
    },

    beep(freq, dur, type, vol) {
      if (!this.ctx) return;
      this.tone(freq, this.ctx.currentTime, dur, vol == null ? 0.06 : vol, type || 'sine');
    },

    // Filtered noise burst — used for skids, whooshes, crowd and fireworks.
    noise(when, dur, vol, type, freq, q, sweepTo) {
      if (!this.ctx || !this.noiseBuffer) return;
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const filt = c.createBiquadFilter();
      filt.type = type || 'bandpass';
      filt.frequency.setValueAtTime(Math.max(20, freq || 1000), when);
      if (sweepTo) {
        filt.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), when + dur);
      }
      filt.Q.value = q == null ? 0.8 : q;

      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

      src.connect(filt);
      filt.connect(g);
      g.connect(this.master);
      src.start(when);
      src.stop(when + dur + 0.03);
    },

    // Simple pitch sweep for starter motors, impacts and doppler effects.
    sweep(f1, f2, when, dur, vol, type) {
      if (!this.ctx) return;
      const c = this.ctx;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(Math.max(20, f1), when);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), when + dur);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(when);
      o.stop(when + dur + 0.03);
    },

    // Starter motor, a few thumps, then the engines catch.
    ignition() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.sweep(420, 620, now, 0.5, 0.035, 'sawtooth');
      this.sweep(620, 130, now + 0.35, 0.32, 0.04, 'sawtooth');
      this.tone(58, now + 0.48, 0.28, 0.09, 'sine');
      this.tone(82, now + 0.56, 0.22, 0.06, 'sine');
      this.noise(now + 0.42, 0.5, 0.045, 'lowpass', 900, 0.6, 320);
    },

    // Lights out: chirp and launch noise.
    go() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.tone(520, now, 0.1, 0.07, 'square');
      this.tone(780, now + 0.08, 0.2, 0.07, 'square');
      this.tone(1040, now + 0.18, 0.4, 0.06, 'square');
      this.launch();
    },

    // Launch: skid, crowd swell and a low hit as the lights go out.
    launch() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.noise(now, 0.42, 0.09, 'bandpass', 2400, 0.7, 900);
      this.noise(now + 0.05, 0.9, 0.055, 'bandpass', 700, 0.5, 1500);
      this.sweep(120, 46, now, 0.5, 0.13, 'sine');
      this.tone(96, now + 0.05, 0.22, 0.07, 'square');
    },

    // Short doppler whoosh whenever the lead changes.
    overtake() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.noise(now, 0.3, 0.05, 'bandpass', 620, 1.1, 2600);
      this.sweep(340, 720, now, 0.16, 0.035, 'sine');
      this.sweep(720, 300, now + 0.16, 0.16, 0.028, 'sine');
    },

    // Beeps for the last five seconds, getting more urgent.
    warning(secondsLeft) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const urgent = secondsLeft <= 1;
      const freq = 620 + (5 - secondsLeft) * 80;
      this.tone(freq, now, urgent ? 0.18 : 0.1, 0.055, 'square');
      if (urgent) {
        this.tone(freq * 1.25, now + 0.2, 0.2, 0.05, 'square');
      }
    },

    // Finish-line thump, skid and a short crowd roar.
    finish() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.tone(880, now, 0.16, 0.07, 'square');
      this.tone(1320, now + 0.1, 0.28, 0.05, 'square');
      this.tone(1760, now + 0.22, 0.4, 0.04, 'triangle');
      this.sweep(120, 40, now, 0.55, 0.16, 'sine');
      this.noise(now, 0.45, 0.08, 'bandpass', 2200, 0.7, 700);
      this.noise(now + 0.15, 1.1, 0.06, 'bandpass', 850, 0.5, 1700);
    },

    firework() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.noise(now, 0.22, 0.05, 'highpass', 1800, 0.6);
      this.sweep(rand(150, 220), rand(48, 70), now, 0.3, 0.07, 'sine');
    },

    click() {
      this.beep(520, 0.05, 'sine', 0.035);
    },

    confirm() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.tone(660, now, 0.1, 0.05, 'sine');
      this.tone(990, now + 0.09, 0.16, 0.045, 'sine');
    },

    cheer(isBoy) {
      if (!this.ctx) return;
      const c = this.ctx;
      const now = c.currentTime;

      if (this.noiseBuffer) {
        const src = c.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;
        const filt = c.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 980;
        filt.Q.value = 0.55;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.15, now + 0.35);
        g.gain.setValueAtTime(0.15, now + 1.25);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        src.connect(filt);
        filt.connect(g);
        g.connect(this.master);
        src.start(now);
        src.stop(now + 3.1);
      }

      const notes = isBoy
        ? [523.25, 659.25, 783.99, 1046.5]
        : [587.33, 739.99, 880.0, 1174.66];

      notes.forEach((freq, i) => {
        this.tone(freq, now + 0.12 + i * 0.15, 0.7, 0.065, 'triangle');
        this.tone(freq * 0.5, now + 0.12 + i * 0.15, 0.55, 0.04, 'sine');
      });

      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(120, now);
      o.frequency.exponentialRampToValueAtTime(38, now + 0.65);
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      o.connect(g);
      g.connect(this.master);
      o.start(now);
      o.stop(now + 0.9);
    },

    setMuted(muted) {
      this.muted = muted;
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.04);
      }
      this.revealPlayers.forEach((audio) => {
        audio.muted = muted;
      });
      if (muted) this.stopReveal();
    },
  };

  try {
    Sound.muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (err) { /* ignore */ }

  // ------------------------------------------------------------
  // Scenery
  // ------------------------------------------------------------
  let stars = [];
  let buildings = [];
  let speedLines = [];

  function layout() {
    roadTop = H * 0.50;
    roadBottom = H * 0.88;
    const rh = roadBottom - roadTop;
    laneBlueGround = roadTop + rh * 0.36;
    lanePinkGround = roadBottom - Math.max(16, H * 0.022);
    carLen = clamp(Math.min(W * 0.17, H * 0.25), 92, 250);
    ppp = W / VIEW_FRACTION;
  }

  function makeAsphaltPattern() {
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 200;
    const g = c.getContext('2d');
    g.fillStyle = '#0a0f1a';
    g.fillRect(0, 0, 200, 200);
    for (let i = 0; i < 1500; i++) {
      const bright = Math.random() > 0.72;
      g.fillStyle = bright
        ? `rgba(190,220,255,${0.012 + Math.random() * 0.045})`
        : `rgba(255,255,255,${0.008 + Math.random() * 0.025})`;
      g.fillRect(Math.random() * 200, Math.random() * 200, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }
    asphaltPattern = ctx.createPattern(c, 'repeat');
  }

  function buildScenery() {
    stars = [];
    const starCount = Math.floor((W * H) / 13000);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * roadTop * 0.93,
        r: rand(0.3, 1.7),
        a: rand(0.12, 0.65),
        sp: rand(0.4, 1.8),
        ph: Math.random() * Math.PI * 2,
      });
    }

    buildings = [];
    let x = -90;
    while (x < W + 120) {
      const bw = rand(42, 120);
      const bh = rand(42, Math.min(250, H * 0.27));
      const wins = [];
      const cols = Math.max(1, Math.floor(bw / 20));
      const rows = Math.max(2, Math.floor(bh / 24));
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          if (Math.random() < 0.34) {
            wins.push({
              x: col * (bw / cols) + 6,
              y: r * (bh / rows) + 7,
              w: Math.max(3, bw / cols - 11),
              h: Math.max(2, bh / rows - 11),
              tint: Math.random() < 0.5 ? 0 : 1,
            });
          }
        }
      }
      buildings.push({ x, w: bw, h: bh, wins });
      x += bw + rand(6, 26);
    }

    speedLines = [];
    for (let i = 0; i < 26; i++) {
      speedLines.push({
        x: Math.random() * W,
        y: roadTop + 24 + Math.random() * (roadBottom - roadTop - 48),
        len: rand(24, 110),
        w: Math.random() < 0.35 ? 2 : 1,
        a: rand(0.05, 0.2),
        sp: rand(320, 920),
      });
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;

    scene.width = Math.floor(W * DPR);
    scene.height = Math.floor(H * DPR);
    scene.style.width = `${W}px`;
    scene.style.height = `${H}px`;
    fxCanvas.width = Math.floor(W * DPR);
    fxCanvas.height = Math.floor(H * DPR);
    fxCanvas.style.width = `${W}px`;
    fxCanvas.style.height = `${H}px`;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    fxc.setTransform(DPR, 0, 0, DPR, 0, 0);

    layout();
    buildScenery();
    if (!asphaltPattern) makeAsphaltPattern();
  }

  // ------------------------------------------------------------
  // Race progress (deterministic drama, pre-picked winner)
  // ------------------------------------------------------------
  function progress(carIndex, u) {
    const car = carIndex === 0 ? 'blue' : 'pink';
    const isWinner = car === S.winner;
    const freq = carIndex === 0 ? S.freqB : S.freqP;
    const phase = carIndex === 0 ? S.phaseB : S.phaseP;

    // Constant lead changes keep the cars nose-to-tail the whole race.
    const env = Math.pow(Math.sin(Math.PI * u), 0.8);
    const wobble = 0.011 * Math.sin(2 * Math.PI * freq * u + phase) * env;

    // The eventual loser leads until the final second, then the winner
    // sneaks ahead right at the line for a photo finish.
    const late = 0.015 * smoothstep(0.93, 1, u) - 0.004 * smoothstep(0.8, 0.93, u);
    const gap = wobble + late;

    const winnerPos = u + gap / 2;
    const loserPos = u - gap / 2;
    const scale = 1 + 0.0055; // winner is exactly on the line at u = 1

    return (isWinner ? winnerPos : loserPos) / scale;
  }

  function finishProgress() {
    // Put the line at the winner's nose so the flag falls exactly on time.
    return 1 + (carLen * 0.56) / ppp;
  }

  function screenX(p) {
    return W * 0.5 + (p - S.cam) * ppp;
  }

  // ------------------------------------------------------------
  // Particles
  // ------------------------------------------------------------
  function emitSmoke(team, x, groundY, kph, dt) {
    const frac = clamp((kph - 180) / 180, 0, 1);
    let acc = team === 'blue' ? S.smokeAccB : S.smokeAccP;
    acc += dt * (10 + frac * 58);
    while (acc >= 1) {
      acc -= 1;
      if (smoke.length > 240) break;
      const spark = Math.random() < 0.14;
      const ttl = rand(0.35, 0.9);
      smoke.push({
        x: x - carLen * 0.31 + rand(-6, 6),
        y: groundY - carLen * 0.07 + rand(-4, 5),
        vx: -rand(50, 300) * (0.45 + frac),
        vy: -rand(4, 55),
        r: spark ? rand(1, 2.5) : rand(2, 6),
        life: ttl,
        ttl,
        kind: spark ? 'spark' : 'smoke',
        team,
        grow: spark ? 0 : rand(8, 20),
      });
    }
    if (team === 'blue') S.smokeAccB = acc;
    else S.smokeAccP = acc;
  }

  function updateSmoke(dt) {
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i];
      p.life -= dt;
      if (p.life <= 0) {
        smoke.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.982;
      p.vy *= 0.985;
      p.y -= 14 * dt;
      p.r += p.grow * dt;
    }
  }

  function firework(x, y, isBoy) {
    const palette = isBoy
      ? ['#3fb8ff', '#a9e6ff', '#ffffff', '#ffd166']
      : ['#ff5fa8', '#ffc0dd', '#ffffff', '#ffd166'];
    const n = 46 + Math.floor(Math.random() * 26);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = rand(120, 470);
      const ttl = rand(0.9, 1.8);
      fireworks.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: rand(1.2, 2.8),
        color: palette[(Math.random() * palette.length) | 0],
        life: ttl,
        ttl,
        grav: 260,
      });
    }
  }

  function spawnConfetti(isBoy) {
    const palette = isBoy
      ? ['#2ea8ff', '#8fe0ff', '#ffffff', '#ffd166', '#0a6cff', '#c9f0ff']
      : ['#ff5fa8', '#ffc0dd', '#ffffff', '#ffd166', '#ff2d7a', '#ffe3f0'];

    for (let i = 0; i < 240; i++) {
      confetti.push({
        x: Math.random() * W,
        y: rand(-H * 0.9, -10),
        vx: rand(-40, 40),
        vy: rand(40, 180),
        w: rand(5, 13),
        h: rand(8, 18),
        rot: Math.random() * Math.PI * 2,
        vr: rand(-9, 9),
        color: palette[(Math.random() * palette.length) | 0],
        shape: Math.random() < 0.25 ? 'circle' : 'rect',
        sway: Math.random() * Math.PI * 2,
        swaySpeed: rand(1.6, 4.2),
        grav: rand(330, 520),
        ttl: rand(7, 12),
      });
    }

    // slow second wave so the celebration keeps raining for a while
    for (let i = 0; i < 170; i++) {
      confetti.push({
        x: Math.random() * W,
        y: rand(-H * 2.4, -H * 0.5),
        vx: rand(-30, 30),
        vy: rand(50, 130),
        w: rand(5, 12),
        h: rand(8, 16),
        rot: Math.random() * Math.PI * 2,
        vr: rand(-8, 8),
        color: palette[(Math.random() * palette.length) | 0],
        shape: Math.random() < 0.25 ? 'circle' : 'rect',
        sway: Math.random() * Math.PI * 2,
        swaySpeed: rand(1.6, 4.2),
        grav: rand(300, 460),
        ttl: rand(9, 14),
      });
    }

    for (let i = 0; i < 120; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = rand(120, 620);
      confetti.push({
        x: W * 0.5 + rand(-160, 160),
        y: H * 0.48 + rand(-90, 90),
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 180,
        w: rand(5, 12),
        h: rand(8, 16),
        rot: Math.random() * Math.PI * 2,
        vr: rand(-12, 12),
        color: palette[(Math.random() * palette.length) | 0],
        shape: Math.random() < 0.2 ? 'circle' : 'rect',
        sway: Math.random() * Math.PI * 2,
        swaySpeed: rand(1.6, 4.2),
        grav: rand(330, 520),
        ttl: rand(6, 10),
      });
    }

    firework(W * 0.3, H * 0.26, isBoy);
    firework(W * 0.7, H * 0.2, isBoy);
    firework(W * 0.5, H * 0.34, isBoy);
  }

  function updateFx(dt) {
    if (!S.revealed) {
      if (confetti.length || fireworks.length) {
        confetti.length = 0;
        fireworks.length = 0;
      }
    } else {
      S.fxTime += dt;
      if (S.fxTime < 5.5 && S.fxTime >= S.nextFirework) {
        firework(rand(W * 0.12, W * 0.88), rand(H * 0.12, H * 0.42), S.winner === 'blue');
        Sound.firework();
        S.nextFirework = S.fxTime + rand(0.5, 0.85);
      }
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.ttl -= dt;
      if (p.ttl <= 0 || p.y > H + 80) {
        confetti.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      p.vx *= 0.996;
      p.sway += p.swaySpeed * dt;
      p.x += (p.vx + Math.sin(p.sway) * 34) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
      const p = fireworks[i];
      p.life -= dt;
      if (p.life <= 0) {
        fireworks.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      p.vx *= 0.988;
      p.vy *= 0.988;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function drawFx() {
    fxc.clearRect(0, 0, W, H);
    if (!confetti.length && !fireworks.length) return;

    for (const p of confetti) {
      const fl = 0.35 + 0.65 * Math.abs(Math.cos(p.sway * 0.9));
      fxc.save();
      fxc.translate(p.x, p.y);
      fxc.rotate(p.rot);
      fxc.globalAlpha = clamp(p.ttl / 1.2, 0, 1);
      fxc.fillStyle = p.color;
      if (p.shape === 'circle') {
        fxc.beginPath();
        fxc.ellipse(0, 0, (p.w * 0.5) * fl, p.h * 0.32, 0, 0, Math.PI * 2);
        fxc.fill();
      } else {
        fxc.fillRect((-p.w * 0.5) * fl, -p.h * 0.5, p.w * fl, p.h);
      }
      fxc.restore();
    }

    fxc.save();
    fxc.globalCompositeOperation = 'lighter';
    for (const p of fireworks) {
      fxc.globalAlpha = clamp(p.life / p.ttl, 0, 1);
      fxc.fillStyle = p.color;
      fxc.beginPath();
      fxc.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      fxc.fill();
    }
    fxc.restore();
  }
/* ------------------------------------------------------------
   Scenery rendering
   ------------------------------------------------------------ */
function rr(c, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, roadTop + 80);
  g.addColorStop(0, '#03050b');
  g.addColorStop(0.55, '#071021');
  g.addColorStop(1, '#0e1c36');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, roadTop + 90);

  const rg = ctx.createRadialGradient(W * 0.58, roadTop + 10, 0, W * 0.58, roadTop + 10, W * 0.6);
  rg.addColorStop(0, 'rgba(60,130,220,0.24)');
  rg.addColorStop(0.45, 'rgba(255,90,170,0.07)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, roadTop + 90);

  for (const s of stars) {
    const tw = 0.55 + 0.45 * Math.sin(T * s.sp + s.ph);
    ctx.globalAlpha = s.a * tw;
    ctx.fillStyle = '#dcecff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSkyline() {
  const off = (S.cam * ppp * 0.1) % W;
  const baseY = roadTop + 5;

  for (let k = -1; k <= 1; k++) {
    for (const b of buildings) {
      const bx = b.x - off + k * W;
      if (bx > W + 30 || bx + b.w < -30) continue;

      ctx.fillStyle = '#060b15';
      ctx.fillRect(bx, baseY - b.h, b.w, b.h);

      for (const win of b.wins) {
        ctx.fillStyle = win.tint
          ? 'rgba(90,175,255,0.25)'
          : 'rgba(255,125,190,0.17)';
        ctx.fillRect(bx + win.x, baseY - b.h + win.y, win.w, win.h);
      }

      ctx.fillStyle = 'rgba(110,180,255,0.22)';
      ctx.fillRect(bx, baseY - b.h, b.w, 1.5);

      if (b.w > 75 && Math.random() < 0.001) {
        ctx.fillStyle = 'rgba(255,70,100,0.5)';
        ctx.fillRect(bx + b.w * 0.5, baseY - b.h - 3, 2, 2);
      }
    }
  }

  const hg = ctx.createLinearGradient(0, roadTop - 40, 0, roadTop + 12);
  hg.addColorStop(0, 'rgba(60,140,255,0)');
  hg.addColorStop(1, 'rgba(90,175,255,0.16)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, roadTop - 40, W, 52);
}

function drawRoad() {
  const rh = roadBottom - roadTop;

  const g = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
  g.addColorStop(0, '#0f1728');
  g.addColorStop(0.28, '#0a101d');
  g.addColorStop(1, '#070a12');
  ctx.fillStyle = g;
  ctx.fillRect(0, roadTop, W, rh);

  if (asphaltPattern) {
    const scroll = (S.cam * ppp * ENV_MULT * 0.35) % 200;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, roadTop, W, rh);
    ctx.clip();
    ctx.translate(-scroll, 0);
    ctx.fillStyle = asphaltPattern;
    ctx.fillRect(-240, roadTop, W + 480, rh);
    ctx.restore();
  }

  // glowing edge lines
  ctx.fillStyle = 'rgba(120,185,255,0.16)';
  ctx.fillRect(0, roadTop, W, 2);
  ctx.fillStyle = 'rgba(255,95,168,0.14)';
  ctx.fillRect(0, roadBottom - 2, W, 2);

  // lane divider
  const period = 170;
  const dash = 100;
  const off = (S.cam * ppp * ENV_MULT) % period;
  const divY = laneBlueGround + (lanePinkGround - laneBlueGround) * 0.55;
  ctx.save();
  ctx.strokeStyle = 'rgba(185,214,255,0.26)';
  ctx.lineWidth = 2;
  ctx.setLineDash([dash, period - dash]);
  ctx.lineDashOffset = -off;
  ctx.beginPath();
  ctx.moveTo(-period, divY);
  ctx.lineTo(W + period, divY);
  ctx.stroke();
  ctx.restore();

  // thin lane glows
  for (const [y, rgb] of [
    [laneBlueGround - carLen * 0.02, '63,184,255'],
    [lanePinkGround - carLen * 0.02, '255,95,168'],
  ]) {
    const lg = ctx.createLinearGradient(0, y - 16, 0, y + 10);
    lg.addColorStop(0, `rgba(${rgb},0)`);
    lg.addColorStop(0.75, `rgba(${rgb},0.05)`);
    lg.addColorStop(1, `rgba(${rgb},0.16)`);
    ctx.fillStyle = lg;
    ctx.fillRect(0, y - 16, W, 26);
  }

  // curbs on the bottom edge
  const cw = 32;
  const coff = (S.cam * ppp * ENV_MULT * 1.15) % (cw * 2);
  for (let x = -cw * 2; x < W + cw * 2; x += cw * 2) {
    ctx.fillStyle = '#dfe8f8';
    ctx.fillRect(x - coff, roadBottom - 7, cw, 7);
    ctx.fillStyle = '#e23b4e';
    ctx.fillRect(x + cw - coff, roadBottom - 7, cw, 7);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(0, roadBottom - 8, W, 1);
}

function drawCheckerStrip(x, width, isFinish) {
  const cell = 10;
  const top = roadTop;
  const height = roadBottom - roadTop;

  ctx.save();
  ctx.shadowColor = isFinish ? 'rgba(220,240,255,0.85)' : 'rgba(120,190,255,0.5)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(x - width / 2 - 2, top, width + 4, height);
  ctx.restore();

  const cols = Math.ceil(width / cell);
  for (let r = 0; r * cell < height; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#f4f8ff' : '#0b0f18';
      ctx.fillRect(x - width / 2 + c * cell, top + r * cell, cell, cell);
    }
  }

  const label = isFinish ? 'FINISH' : 'START';
  ctx.save();
  ctx.font = `900 ${clamp(W * 0.014, 13, 24)}px Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(245,250,255,0.92)';
  ctx.shadowColor = isFinish ? 'rgba(160,220,255,0.95)' : 'rgba(120,190,255,0.7)';
  ctx.shadowBlur = 20;
  ctx.fillText(label, x, roadTop - 14);
  ctx.restore();
}

function drawStartFinish() {
  ctx.save();
  if (S.mode === 'idle') ctx.globalAlpha = 0.32;

  const startX = screenX(0);
  if (startX > -80 && startX < W + 80) drawCheckerStrip(startX, 12, false);

  const finishX = screenX(finishProgress());
  if (finishX > -80 && finishX < W + 80) drawCheckerStrip(finishX, 18, true);

  ctx.restore();
}

function drawDistanceMarkers() {
  for (let i = 1; i < 20; i++) {
    const x = screenX(i * 0.05);
    if (x < -20 || x > W + 20) continue;
    ctx.fillStyle = 'rgba(150,200,255,0.22)';
    ctx.fillRect(x - 1, roadTop, 2, 15);
    ctx.fillStyle = 'rgba(150,200,255,0.10)';
    ctx.fillRect(x - 1, roadTop + 15, 2, 6);
  }
}

function drawSpeedLines() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of speedLines) {
    if (l.x > W + 20 || l.x + l.len < -20) continue;
    const grad = ctx.createLinearGradient(l.x, 0, l.x + l.len, 0);
    grad.addColorStop(0, 'rgba(160,210,255,0)');
    grad.addColorStop(1, `rgba(190,225,255,${l.a})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = l.w;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.lineTo(l.x + l.len, l.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSmoke() {
  if (!smoke.length) return;

  ctx.save();
  for (const p of smoke) {
    if (p.kind !== 'smoke') continue;
    const a = clamp(p.life / p.ttl, 0, 1);
    ctx.fillStyle = `rgba(190,205,230,${a * 0.16})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'lighter';
  for (const p of smoke) {
    if (p.kind !== 'spark') continue;
    const a = clamp(p.life / p.ttl, 0, 1);
    const c = TEAM[p.team];
    ctx.fillStyle = `rgba(${c.rgb},${a * 0.8})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------
   The car
   ------------------------------------------------------------ */
function drawWheel(cx, cy, r, angle, c) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#07080d';
  ctx.fill();
  ctx.lineWidth = 0.012;
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.88, -0.35, Math.PI * 1.15);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 0.032;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
  ctx.fillStyle = '#121927';
  ctx.fill();
  ctx.strokeStyle = c.main;
  ctx.lineWidth = 0.015;
  ctx.stroke();

  ctx.save();
  ctx.rotate(angle);
  ctx.strokeStyle = 'rgba(220,235,255,0.5)';
  ctx.lineWidth = 0.011;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.49, Math.sin(a) * r * 0.49);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = c.light;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawTrail(x, groundY, c, speedFrac) {
  if (speedFrac <= 0.06) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const y = groundY - carLen * (0.12 + i * 0.085);
    const len = carLen * (0.16 + speedFrac * 0.55) * (1 - i * 0.14);
    const alpha = (0.05 + speedFrac * 0.11) * (1 - i * 0.2);
    const grad = ctx.createLinearGradient(x - carLen * 0.4, y, x - carLen * 0.4 - len, y);
    grad.addColorStop(0, `rgba(${c.rgb},${alpha})`);
    grad.addColorStop(1, `rgba(${c.rgb},0)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = i === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - carLen * 0.4, y);
    ctx.lineTo(x - carLen * 0.4 - len, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCarScreen(team, x, groundY, angle) {
  const c = TEAM[team];
  const L = carLen;
  const kph = team === 'blue' ? S.kphB : S.kphP;
  const speedFrac = clamp((kph - 180) / 180, 0, 1);
  const bob = Math.sin(T * 16 + (team === 'blue' ? 0 : 2.4)) * (0.8 + speedFrac * 1.6);
  const tilt = Math.sin(T * 11 + (team === 'blue' ? 0.7 : 2)) * 0.0035 * (1 + speedFrac);
  const sy = groundY + bob;

  // shadow
  ctx.save();
  ctx.translate(x, groundY + 3);
  const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, L * 0.55);
  sg.addColorStop(0, 'rgba(0,0,0,0.5)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(0, 0, L * 0.55, L * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawTrail(x, sy, c, speedFrac);

  ctx.save();
  ctx.translate(x, sy);
  ctx.rotate(tilt);
  ctx.scale(L, L);

  // ---- rear wing ----
  ctx.fillStyle = '#131a28';
  ctx.fillRect(-0.418, -0.425, 0.026, 0.21);
  ctx.fillStyle = `rgba(${c.rgb},0.55)`;
  ctx.fillRect(-0.418, -0.425, 0.006, 0.21);

  ctx.beginPath();
  ctx.moveTo(-0.56, -0.455);
  ctx.lineTo(-0.32, -0.425);
  ctx.lineTo(-0.32, -0.388);
  ctx.lineTo(-0.55, -0.415);
  ctx.closePath();
  ctx.fillStyle = c.dark;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 0.008;
  ctx.stroke();

  ctx.fillStyle = c.main;
  ctx.fillRect(-0.565, -0.475, 0.038, 0.095);

  // ---- main body ----
  const bg = ctx.createLinearGradient(0, -0.4, 0, -0.12);
  bg.addColorStop(0, c.light);
  bg.addColorStop(0.32, c.main);
  bg.addColorStop(1, c.dark);
  ctx.beginPath();
  ctx.moveTo(-0.46, -0.2);
  ctx.bezierCurveTo(-0.48, -0.29, -0.4, -0.345, -0.3, -0.355);
  ctx.lineTo(-0.2, -0.365);
  ctx.bezierCurveTo(-0.13, -0.398, -0.02, -0.398, 0.04, -0.355);
  ctx.bezierCurveTo(0.13, -0.325, 0.25, -0.3, 0.38, -0.255);
  ctx.lineTo(0.52, -0.215);
  ctx.lineTo(0.578, -0.2);
  ctx.lineTo(0.578, -0.165);
  ctx.lineTo(0.42, -0.148);
  ctx.lineTo(0.18, -0.132);
  ctx.lineTo(-0.16, -0.132);
  ctx.lineTo(-0.34, -0.148);
  ctx.lineTo(-0.46, -0.175);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.012;
  ctx.stroke();

  // nose stripe
  ctx.beginPath();
  ctx.moveTo(0.578, -0.198);
  ctx.lineTo(0.31, -0.245);
  ctx.lineTo(0.3, -0.222);
  ctx.lineTo(0.576, -0.172);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.fill();

  // sidepod
  ctx.beginPath();
  ctx.moveTo(-0.35, -0.255);
  ctx.bezierCurveTo(-0.24, -0.22, -0.05, -0.2, 0.1, -0.185);
  ctx.lineTo(0.135, -0.132);
  ctx.lineTo(-0.3, -0.132);
  ctx.lineTo(-0.39, -0.19);
  ctx.closePath();
  ctx.fillStyle = 'rgba(4,8,16,0.32)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-0.3, -0.245);
  ctx.bezierCurveTo(-0.16, -0.215, 0.0, -0.198, 0.1, -0.183);
  ctx.strokeStyle = `rgba(${c.rgb},0.75)`;
  ctx.lineWidth = 0.014;
  ctx.stroke();

  // cockpit + helmet + halo
  ctx.beginPath();
  ctx.ellipse(-0.045, -0.352, 0.1, 0.032, -0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#05070c';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-0.055, -0.372, 0.052, 0, Math.PI * 2);
  ctx.fillStyle = '#f2f6ff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.008;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(-0.043, -0.384, 0.041, 0.016, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#101623';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0.105, -0.335);
  ctx.bezierCurveTo(0.085, -0.442, -0.1, -0.455, -0.2, -0.368);
  ctx.lineWidth = 0.033;
  ctx.strokeStyle = '#0a0d15';
  ctx.stroke();
  ctx.lineWidth = 0.011;
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  ctx.stroke();

  // engine intake
  ctx.beginPath();
  ctx.moveTo(-0.26, -0.36);
  ctx.lineTo(-0.19, -0.362);
  ctx.lineTo(-0.235, -0.312);
  ctx.closePath();
  ctx.fillStyle = '#0a0e17';
  ctx.fill();

  // ---- wheels ----
  drawWheel(-0.295, -0.165, 0.165, angle, c);
  drawWheel(0.298, -0.157, 0.157, angle * 1.07, c);

  // ---- front wing ----
  ctx.beginPath();
  ctx.moveTo(0.33, -0.15);
  ctx.lineTo(0.655, -0.108);
  ctx.lineTo(0.655, -0.062);
  ctx.lineTo(0.33, -0.102);
  ctx.closePath();
  ctx.fillStyle = '#0a0e17';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 0.008;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0.4, -0.132);
  ctx.lineTo(0.655, -0.1);
  ctx.lineTo(0.655, -0.08);
  ctx.lineTo(0.4, -0.112);
  ctx.closePath();
  ctx.fillStyle = c.main;
  ctx.fill();

  ctx.fillStyle = c.light;
  ctx.fillRect(0.638, -0.152, 0.024, 0.1);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0.638, -0.113, 0.024, 0.012);

  // ---- rain light ----
  ctx.save();
  ctx.shadowColor = '#ff2d55';
  ctx.shadowBlur = 0.16;
  ctx.fillStyle = '#ff3355';
  ctx.fillRect(-0.472, -0.285, 0.024, 0.038);
  ctx.restore();

  ctx.restore();
}

function drawCarLabel(x, y, text, team) {
  const c = TEAM[team];
  ctx.save();
  ctx.font = '700 11px Rajdhani, sans-serif';
  const tw = ctx.measureText(text).width;
  const w = tw + 30;
  const h = 23;

  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(6,10,20,0.72)';
  ctx.strokeStyle = `rgba(${c.rgb},0.5)`;
  ctx.lineWidth = 1;
  rr(ctx, -w / 2, -h / 2, w, h, 11);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = c.main;
  ctx.beginPath();
  ctx.arc(-w / 2 + 13, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d9e8ff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, -w / 2 + 21, 0.5);
  ctx.restore();
}

function drawVignette() {
  const vg = ctx.createRadialGradient(
    W / 2, H * 0.52, Math.min(W, H) * 0.32,
    W / 2, H * 0.52, Math.max(W, H) * 0.8
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (S.shake > 0.15) {
    ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
  }

  drawSky();
  drawSkyline();
  drawRoad();
  drawStartFinish();
  drawDistanceMarkers();
  drawSpeedLines();
  drawSmoke();

  const xB = screenX(S.pB);
  const xP = screenX(S.pP);

  drawCarScreen('pink', xP, lanePinkGround, S.wheelP);
  drawCarScreen('blue', xB, laneBlueGround, S.wheelB);

  if (S.mode !== 'idle' && S.mode !== 'revealed' && W >= 640) {
    drawCarLabel(xB, laneBlueGround - carLen * 0.64, 'BABY BOY', 'blue');
    drawCarLabel(xP, lanePinkGround - carLen * 0.64, 'BABY GIRL', 'pink');
  }

  drawVignette();
  ctx.restore();
  drawFx();
}
/* ------------------------------------------------------------
   UI state
   ------------------------------------------------------------ */
function updateHUD() {
  const remaining = S.mode === 'racing'
    ? Math.max(0, RACE_DURATION - S.elapsed)
    : (S.mode === 'finished' || S.mode === 'revealed') ? 0 : RACE_DURATION;

  els.timer.textContent = remaining.toFixed(1);
  els.timer.classList.toggle('is-urgent', S.mode === 'racing' && remaining <= 5.05);

  const pb = clamp(S.pB * 100, 0, 100);
  const pp = clamp(S.pP * 100, 0, 100);
  els.tickBlue.style.left = `${pb}%`;
  els.tickPink.style.left = `${pp}%`;
  els.raceFill.style.width = `${Math.max(pb, pp).toFixed(2)}%`;
  els.speedBlue.textContent = Math.round(S.kphB);
  els.speedPink.textContent = Math.round(S.kphP);
}

function updateControls() {
  const locked = S.mode === 'countdown' || S.mode === 'racing' || S.mode === 'finished' || S.mode === 'revealed';
  els.gearBtn.disabled = locked;
}

function refreshSoundIcon() {
  els.soundBtn.textContent = Sound.muted ? '🔇' : '🔊';
  els.soundBtn.setAttribute('aria-label', Sound.muted ? 'Unmute sound' : 'Mute sound');
  els.soundBtn.title = Sound.muted ? 'Unmute sound' : 'Mute sound';
}

function fullscreenElement() {
  return document.fullscreenElement
    || document.webkitFullscreenElement
    || document.msFullscreenElement
    || null;
}

function fullscreenSupported() {
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
}

function updateFullscreenButton() {
  const active = !!fullscreenElement();
  els.fullscreenBtn.classList.toggle('is-fullscreen', active);
  els.fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  els.fullscreenBtn.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
}

async function toggleFullscreen() {
  if (!fullscreenSupported()) return;

  try {
    if (!fullscreenElement()) {
      const el = document.documentElement;
      const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      const result = request.call(el);
      if (result && typeof result.then === 'function') await result;
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      const result = exit.call(document);
      if (result && typeof result.then === 'function') await result;
    }
  } catch (err) {
    // Some browsers block fullscreen or do not support it for this element.
  }

  updateFullscreenButton();
  Sound.click();
}

function toggleSound() {
  Sound.setMuted(!Sound.muted);
  try {
    localStorage.setItem(MUTE_KEY, Sound.muted ? '1' : '0');
  } catch (err) { /* ignore */ }
  refreshSoundIcon();
  if (!Sound.muted) Sound.beep(760, 0.1, 'sine', 0.05);
}

function syncOptions() {
  $$('#genderOptions .option').forEach((b) => {
    b.classList.toggle('selected', b.dataset.gender === tempGender);
  });
}

function openSettings() {
  if (S.mode !== 'idle') return;
  if (!els.settingsModal.classList.contains('hidden')) return;
  Sound.init();
  Sound.click();
  tempGender = settings.gender;
  syncOptions();
  els.shareStatus.textContent = '';
  els.settingsModal.classList.remove('hidden');
}

function closeSettings(silent) {
  if (!silent) Sound.click();
  els.settingsModal.classList.add('hidden');
}

function saveSettings() {
  settings.gender = tempGender;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) { /* ignore */ }
  Sound.confirm();
  closeSettings(true);
}

/* ------------------------------------------------------------
   Shareable surprise links
   ------------------------------------------------------------ */
function shareBaseUrl() {
  return location.href.split('#')[0];
}

async function copyShareLink() {
  const value = els.shareUrl.value.trim();
  if (!value) return;

  let copied = false;
  try {
    await navigator.clipboard.writeText(value);
    copied = true;
  } catch (err) {
    try {
      els.shareUrl.focus();
      els.shareUrl.select();
      copied = document.execCommand('copy');
    } catch (e) {
      copied = false;
    }
  }

  els.shareStatus.textContent = copied
    ? 'Copied! Send it to your guest — the link is the surprise.'
    : 'Link ready. Select it above and copy manually.';
  if (copied) Sound.confirm(); else Sound.click();
}

function buildShareLink(gender) {
  els.shareUrl.value = `${shareBaseUrl()}#r=${makeShareToken(gender)}`;
  els.copyShare.disabled = false;
  els.shareStatus.textContent = '';
  copyShareLink();
}

function flashScreen() {
  els.flash.classList.remove('fire');
  void els.flash.offsetWidth;
  els.flash.classList.add('fire');
}

/* ------------------------------------------------------------
   Race flow
   ------------------------------------------------------------ */
function pickWinner() {
  if (sharedGender === 'boy') return 'blue';
  if (sharedGender === 'girl') return 'pink';
  if (settings.gender === 'boy') return 'blue';
  if (settings.gender === 'girl') return 'pink';
  return Math.random() < 0.5 ? 'blue' : 'pink';
}

function startCountdown() {
  if (S.mode === 'countdown' || S.mode === 'racing') return;

  Sound.init();
  Sound.stopReveal();

  S.mode = 'countdown';
  S.countStart = performance.now();
  S.lightsLit = 0;
  S.raceStart = 0;
  S.finishedAt = 0;
  S.revealAt = 0;
  S.revealed = false;
  S.elapsed = 0;
  S.cdHideAt = 0;
  S.shake = 0;
  S.kphB = 0;
  S.kphP = 0;
  S.prevPB = 0;
  S.prevPP = 0;
  S.pB = 0;
  S.pP = 0;
  S.cam = 0.045;
  S.fxTime = 0;
  S.nextFirework = 0;
  S.lastLeader = null;
  S.lastOvertake = 0;
  S.warnIndex = 0;
  S.freqB = rand(2.4, 3.4);
  S.freqP = rand(2.4, 3.4);
  S.phaseB = Math.random() * Math.PI * 2;
  S.phaseP = Math.random() * Math.PI * 2;
  S.winner = pickWinner();

  Sound.ignition();

  smoke.length = 0;
  confetti.length = 0;
  fireworks.length = 0;

  $$('#lights i').forEach((el) => el.classList.remove('on'));
  els.lights.classList.remove('go');
  els.countdown.classList.remove('go', 'hidden');
  els.countdownText.textContent = 'GET READY';
  els.startScreen.classList.add('hidden');
  els.reveal.classList.add('hidden');
  els.hud.classList.remove('hidden');
  els.timer.textContent = '15.0';
  els.timer.classList.remove('is-urgent');
  els.reveal.classList.remove('boy', 'girl');
  updateControls();
  updateHUD();
}

function startRace(now) {
  if (S.mode !== 'countdown') return;
  S.mode = 'racing';
  S.raceStart = now;
  S.cdHideAt = now + 950;
  els.lights.classList.add('go');
  els.countdown.classList.add('go');
  els.countdownText.textContent = 'GO!';
  S.shake = 4;
  Sound.go();
  updateControls();
}

function finishRace(now) {
  if (S.mode !== 'racing') return;
  S.mode = 'finished';
  S.finishedAt = now;
  S.revealAt = now + 1100;
  S.elapsed = RACE_DURATION;
  S.u = 1;
  S.pB = progress(0, 1);
  S.pP = progress(1, 1);
  S.prevPB = S.pB;
  S.prevPP = S.pP;
  S.shake = 10;
  els.countdown.classList.add('hidden');
  els.timer.textContent = '0.0';
  flashScreen();
  Sound.finish();
  updateControls();
  updateHUD();
}

function showReveal() {
  if (S.revealed) return;
  S.revealed = true;
  S.mode = 'revealed';

  const isBoy = S.winner === 'blue';
  const c = isBoy ? TEAM.blue : TEAM.pink;

  els.reveal.style.setProperty('--reveal', c.main);
  els.revealTitle.textContent = isBoy ? "IT'S A BOY!" : "IT'S A GIRL!";
  els.winnerTag.textContent = isBoy ? 'BABY BOY TAKES THE WIN' : 'BABY GIRL TAKES THE WIN';
  els.revealSub.textContent = isBoy
    ? 'A little racer in blue is on the way.'
    : 'A little racer in pink is on the way.';
  if (els.revealEmojis) {
    const emojis = isBoy
      ? ['👶', '💙', '🍼', '🎈', '🎉']
      : ['👶', '💖', '🎀', '🎈', '🎉'];
    els.revealEmojis.innerHTML = emojis.map((e) => `<span>${e}</span>`).join('');
  }
  if (els.revealMeta) {
    els.revealMeta.textContent = `FINISHED IN ${RACE_DURATION.toFixed(1)} SECONDS · PHOTO FINISH`;
  }
  els.reveal.classList.remove('boy', 'girl');

  // restart the entrance animations
  const inner = els.reveal.querySelector('.reveal-inner');
  if (inner) {
    inner.style.animation = 'none';
    els.revealTitle.style.animation = 'none';
    void inner.offsetWidth;
    inner.style.animation = '';
    els.revealTitle.style.animation = '';
  }

  els.reveal.classList.remove('hidden');
  els.hud.classList.add('hidden');
  Sound.cheer(isBoy);
  Sound.playReveal();
  spawnConfetti(isBoy);
  S.fxTime = 0;
  S.nextFirework = 0;
  updateControls();
}

function goHome() {
  S.mode = 'idle';
  S.revealed = false;
  S.finished = false;
  S.elapsed = 0;
  S.u = 0;
  S.pB = 0;
  S.pP = 0;
  S.prevPB = 0;
  S.prevPP = 0;
  S.cam = 0.045;
  S.kphB = 0;
  S.kphP = 0;
  S.shake = 0;
  S.cdHideAt = 0;
  S.revealAt = 0;

  smoke.length = 0;
  confetti.length = 0;
  fireworks.length = 0;

  els.reveal.classList.add('hidden');
  els.hud.classList.add('hidden');
  els.countdown.classList.add('hidden');
  els.startScreen.classList.remove('hidden');
  els.reveal.classList.remove('boy', 'girl');
  els.timer.textContent = '15.0';
  els.timer.classList.remove('is-urgent');
  els.startBtn.blur();
  Sound.stopReveal();
  Sound.updateEngines(0, 0, 0);
  updateControls();
  updateHUD();
}

/* ------------------------------------------------------------
   Update loop
   ------------------------------------------------------------ */
function update(dt, now) {
  // start-light sequence
  if (S.mode === 'countdown') {
    const ct = (now - S.countStart) / 1000;
    const lit = clamp(Math.floor((ct - 0.35) / 0.52) + 1, 0, 5);
    if (lit > S.lightsLit) {
      S.lightsLit = lit;
      const el = els.lights.children[lit - 1];
      if (el) el.classList.add('on');
      Sound.beep(485 + lit * 45, 0.08, 'square', 0.055);
    }
    if (ct >= 3.05) startRace(now);
  }

  if (S.mode === 'racing' && S.cdHideAt && now >= S.cdHideAt) {
    els.countdown.classList.add('hidden');
    S.cdHideAt = 0;
  }

  // race clock
  let u = 0;
  if (S.mode === 'racing') {
    S.elapsed = (now - S.raceStart) / 1000;
    u = clamp(S.elapsed / RACE_DURATION, 0, 1);
    if (u >= 1) finishRace(now);
  } else if (S.mode === 'finished' || S.mode === 'revealed') {
    S.elapsed = RACE_DURATION;
    u = 1;
  }

  S.u = u;
  if (S.mode === 'idle' || S.mode === 'countdown') {
    S.pB = 0;
    S.pP = 0;
  } else {
    S.pB = progress(0, u);
    S.pP = progress(1, u);
  }

  // Live commentary: whoosh on every lead change, beeps for the final seconds.
  if (S.mode === 'racing') {
    const leader = S.pB >= S.pP ? 'blue' : 'pink';
    if (S.lastLeader && leader !== S.lastLeader && S.elapsed > 0.35 && S.elapsed - S.lastOvertake > 0.45) {
      Sound.overtake();
      S.lastOvertake = S.elapsed;
    }
    S.lastLeader = leader;

    const warnAt = [5, 3, 2, 1];
    const remaining = RACE_DURATION - S.elapsed;
    while (S.warnIndex < warnAt.length && remaining <= warnAt[S.warnIndex]) {
      Sound.warning(warnAt[S.warnIndex]);
      S.warnIndex++;
    }
  }

  // camera
  let target = 0.045;
  if (S.mode === 'racing' || S.mode === 'finished' || S.mode === 'revealed') {
    target = (S.pB + S.pP) / 2 - 0.022;
  }
  const cameraSpeed = S.mode === 'racing' ? 4.5 : 2.4;
  S.cam += (target - S.cam) * (1 - Math.exp(-cameraSpeed * dt));

  // speed readouts
  const safeDt = Math.max(dt, 0.0001);
  const rawB = (S.pB - S.prevPB) / safeDt;
  const rawP = (S.pP - S.prevPP) / safeDt;
  S.prevPB = S.pB;
  S.prevPP = S.pP;

  if (S.mode === 'racing') {
    // Normalise by race duration so the KPH readout stays realistic at any length.
    const kb = clamp(300 + (rawB * RACE_DURATION - 1) * 220, 180, 360);
    const kp = clamp(300 + (rawP * RACE_DURATION - 1) * 220, 180, 360);
    S.kphB += (kb - S.kphB) * Math.min(1, dt * 6);
    S.kphP += (kp - S.kphP) * Math.min(1, dt * 6);
  } else if (S.mode === 'countdown' || S.mode === 'idle') {
    S.kphB += (0 - S.kphB) * Math.min(1, dt * 6);
    S.kphP += (0 - S.kphP) * Math.min(1, dt * 6);
  } else if (S.mode === 'finished' || S.mode === 'revealed') {
    S.kphB *= Math.exp(-dt * 1.4);
    S.kphP *= Math.exp(-dt * 1.4);
  }

  S.wheelB += (S.kphB / 320) * dt * 24 + dt * 0.4;
  S.wheelP += (S.kphP / 320) * dt * 24 + dt * 0.4;

  S.shake *= Math.exp(-dt * 4.2);
  if (S.shake < 0.05) S.shake = 0;

  // scenery scroll
  const sf = S.mode === 'racing' ? 1
    : S.mode === 'countdown' ? 0.18
      : S.mode === 'finished' ? 0.45 : 0.1;
  for (const l of speedLines) {
    l.x -= l.sp * dt * sf;
    if (l.x + l.len < -20) {
      l.x = W + rand(20, 260);
      l.y = roadTop + 24 + Math.random() * (roadBottom - roadTop - 48);
    }
  }

  // smoke & sparks
  if (S.mode === 'racing') {
    emitSmoke('blue', screenX(S.pB), laneBlueGround, S.kphB, dt);
    emitSmoke('pink', screenX(S.pP), lanePinkGround, S.kphP, dt);
  }
  updateSmoke(dt);

  updateHUD();

  // engine audio
  if (S.mode === 'countdown') {
    const ct = (now - S.countStart) / 1000;
    const rev = clamp(ct / 3, 0, 1) * (0.55 + 0.45 * Math.abs(Math.sin(ct * 15)));
    Sound.updateEngines(0, 0, rev);
  } else if (S.mode === 'racing') {
    Sound.updateEngines(
      clamp((S.kphB - 180) / 180, 0, 1),
      clamp((S.kphP - 180) / 180, 0, 1),
      0
    );
  } else {
    Sound.updateEngines(0, 0, 0);
  }

  // reveal
  if (S.mode === 'finished' && !S.revealed && now >= S.revealAt) showReveal();
}

let lastTime = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (!lastTime) lastTime = now;
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  T += dt;

  update(dt, now);
  updateFx(dt);
  render();
}

/* ------------------------------------------------------------
   Events
   ------------------------------------------------------------ */
els.startBtn.addEventListener('click', () => {
  els.startBtn.blur();
  startCountdown();
});

els.againBtn.addEventListener('click', () => {
  els.againBtn.blur();
  startCountdown();
});

els.homeBtn.addEventListener('click', () => {
  els.homeBtn.blur();
  Sound.click();
  goHome();
});

els.gearBtn.addEventListener('click', openSettings);
els.startHint.addEventListener('click', openSettings);
els.closeSettings.addEventListener('click', () => closeSettings());
els.saveSettings.addEventListener('click', saveSettings);

els.settingsPanel.addEventListener('click', (e) => {
  const btn = e.target.closest('.option');
  if (!btn) return;
  tempGender = btn.dataset.gender;
  syncOptions();
  Sound.click();
});

els.settingsModal.addEventListener('click', (e) => {
  if (e.target === els.settingsModal) closeSettings();
});

els.soundBtn.addEventListener('click', toggleSound);
els.fullscreenBtn.addEventListener('click', toggleFullscreen);

document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

els.shareBoy.addEventListener('click', () => buildShareLink('boy'));
els.shareGirl.addEventListener('click', () => buildShareLink('girl'));
els.copyShare.addEventListener('click', copyShareLink);
els.shareUrl.addEventListener('focus', () => els.shareUrl.select());

// Unlock audio on the first interaction so UI sounds work before the race.
window.addEventListener('pointerdown', () => Sound.init(), { once: true });

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;

  const settingsOpen = !els.settingsModal.classList.contains('hidden');

  if (e.key === 'Escape') {
    if (settingsOpen) closeSettings();
    return;
  }
  if (settingsOpen) return;

  if (e.code === 'Space' || e.key === 'Enter') {
    if (S.mode === 'idle' || S.mode === 'revealed') {
      e.preventDefault();
      startCountdown();
    }
  } else if (e.key === 'r' || e.key === 'R') {
    if (S.mode === 'revealed' || S.mode === 'finished') startCountdown();
  } else if (e.key === 'm' || e.key === 'M') {
    toggleSound();
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  }
});

let resizeRaf = 0;
window.addEventListener('resize', () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    resize();
  });
});

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */
resize();
refreshSoundIcon();
syncOptions();
updateControls();
updateHUD();
Sound.prepareRevealAudio();

if (!fullscreenSupported()) els.fullscreenBtn.style.display = 'none';
updateFullscreenButton();

// A shared link carries the pre-picked result and hides the parent controls.
if (sharedGender) {
  els.surpriseBanner.classList.remove('hidden');
  els.gearBtn.style.display = 'none';
  const hint = els.startHint && els.startHint.closest('.hint');
  if (hint) hint.style.display = 'none';
  document.title = 'A Surprise Awaits — Baby Gender Reveal Grand Prix';
}

requestAnimationFrame(loop);

})();
