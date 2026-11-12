import React, { useEffect, useRef, useState } from 'react';
import { GenderRevealConfig } from '../types';
import { Trophy, RotateCcw, Share2, Heart, Check, Sparkles, Volume2, VolumeX, Flame } from 'lucide-react';
import { f1Sound } from '../utils/audio';

interface RevealCelebrationProps {
  config: GenderRevealConfig;
  isMuted: boolean;
  onToggleMute: () => void;
  onReplay: () => void;
}

// Firework Rocket Shell (ascending before explosion)
interface FireworkRocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
  exploded: boolean;
}

// Firework Star Particle (exploding and falling)
interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
  twinkle: number;
  trail: { x: number; y: number }[];
}

// Stage Pyro Sparkler Fountain Particle
interface PyroFountainParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export const RevealCelebration: React.FC<RevealCelebrationProps> = ({
  config,
  isMuted,
  onToggleMute,
  onReplay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const isBoy = config.winner === 'boy';

  // Fireworks & Stage Pyro Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const rockets: FireworkRocket[] = [];
    const particles: FireworkParticle[] = [];
    const fountains: PyroFountainParticle[] = [];

    // Curated color palettes
    const boyColors = ['#38bdf8', '#0284c7', '#60a5fa', '#93c5fd', '#fbbf24', '#fef08a', '#ffffff', '#2563eb'];
    const girlColors = ['#f472b6', '#ec4899', '#f43f5e', '#fda4af', '#fbbf24', '#fef08a', '#ffffff', '#e11d48'];
    const palette = isBoy ? boyColors : girlColors;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Launch a new firework rocket from the bottom
    const launchRocket = (startX?: number, targetApexY?: number) => {
      const x = startX !== undefined ? startX : canvas.width * (0.15 + Math.random() * 0.7);
      const y = canvas.height;
      const targetY = targetApexY !== undefined ? targetApexY : canvas.height * (0.12 + Math.random() * 0.35);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.35;
      const speed = Math.sqrt(2 * 0.22 * (canvas.height - targetY)) * (0.95 + Math.random() * 0.1);

      rockets.push({
        x,
        y,
        targetY,
        vx: Math.cos(angle) * speed * 0.25,
        vy: -speed,
        color: palette[Math.floor(Math.random() * palette.length)],
        trail: [],
        exploded: false,
      });
    };

    // Detonate a rocket into an explosive burst
    const explodeRocket = (x: number, y: number, baseColor: string) => {
      const particleCount = 80 + Math.floor(Math.random() * 40);
      const isRingShape = Math.random() > 0.65;

      for (let i = 0; i < particleCount; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 8 + 3;

        // Radial burst pattern
        if (isRingShape) {
          angle = (i / particleCount) * Math.PI * 2;
          speed = 6 + (Math.random() - 0.5) * 1.5;
        }

        const color = Math.random() > 0.3 ? baseColor : palette[Math.floor(Math.random() * palette.length)];

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1.0,
          decay: Math.random() * 0.015 + 0.012,
          color,
          size: Math.random() * 3 + 2,
          twinkle: Math.random() * Math.PI * 2,
          trail: [],
        });
      }
    };

    // Stage pyro sparkler fountains (shooting from podium corners)
    const emitPodiumFountains = () => {
      const leftX = canvas.width * 0.18;
      const rightX = canvas.width * 0.82;
      const podiumY = canvas.height - 20;

      [leftX, rightX].forEach((sourceX) => {
        for (let i = 0; i < 3; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
          const speed = Math.random() * 9 + 8;
          fountains.push({
            x: sourceX + (Math.random() - 0.5) * 30,
            y: podiumY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1.0,
            color: Math.random() > 0.4 ? (isBoy ? '#60a5fa' : '#f472b6') : '#fbbf24',
            size: Math.random() * 2.5 + 1.5,
          });
        }
      });
    };

    // Initial volley of fireworks
    for (let i = 0; i < 4; i++) {
      setTimeout(() => launchRocket(), i * 350);
    }

    // Continuous fireworks scheduler
    const fireworkTimer = setInterval(() => {
      launchRocket();
      if (Math.random() > 0.4) {
        setTimeout(() => launchRocket(), 200);
      }
    }, 1100);

    // Interactive click to launch firework at cursor
    const handleCanvasClick = (e: MouseEvent) => {
      explodeRocket(e.clientX, e.clientY, palette[Math.floor(Math.random() * palette.length)]);
    };
    window.addEventListener('click', handleCanvasClick);

    // Main animation loop
    const render = () => {
      // Clear with themed alpha trail effect for smooth fireworks motion blur
      ctx.fillStyle = isBoy ? 'rgba(10, 25, 47, 0.25)' : 'rgba(34, 9, 28, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      emitPodiumFountains();

      // 1. UPDATE & DRAW ROCKETS
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.18; // gravity

        // Rocket spark trail
        r.trail.push({ x: r.x, y: r.y, alpha: 1.0 });
        if (r.trail.length > 8) r.trail.shift();

        // Draw trail
        r.trail.forEach((t) => {
          t.alpha -= 0.1;
          ctx.save();
          ctx.fillStyle = r.color;
          ctx.globalAlpha = Math.max(0, t.alpha);
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Rocket head
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Detonate condition: reached target apex or upward velocity expired
        if (r.y <= r.targetY || r.vy >= -0.5) {
          explodeRocket(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // 2. UPDATE & DRAW BURST PARTICLES
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity pulling sparks downward
        p.vx *= 0.975; // air drag
        p.alpha -= p.decay;
        p.twinkle += 0.25;

        // Add tail spark point
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 4) p.trail.shift();

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw spark tail
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.7;
        ctx.globalAlpha = p.alpha * 0.6;
        ctx.beginPath();
        p.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Draw shimmering spark head
        const twinkleScale = 0.8 + Math.sin(p.twinkle) * 0.35;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * twinkleScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. UPDATE & DRAW PODIUM PYRO FOUNTAINS
      for (let i = fountains.length - 1; i >= 0; i--) {
        const f = fountains[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.28; // gravity
        f.alpha -= 0.024;

        if (f.alpha <= 0) {
          fountains.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(fireworkTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleCanvasClick);
    };
  }, [isBoy]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const blastChampagneFireworks = () => {
    f1Sound.playCheckeredFlag();
    // Spawns burst
    const canvas = canvasRef.current;
    if (!canvas) return;
    const evt = new MouseEvent('click', {
      clientX: canvas.width / 2 + (Math.random() - 0.5) * 200,
      clientY: canvas.height * 0.35,
    });
    window.dispatchEvent(evt);
  };

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col items-center justify-between text-white overflow-x-hidden p-4 sm:p-8 select-none transition-colors duration-700 ${
        isBoy
          ? 'bg-gradient-to-b from-blue-950 via-[#061838] to-slate-950'
          : 'bg-gradient-to-b from-pink-950 via-[#2e0824] to-slate-950'
      }`}
    >
      {/* Background Fireworks & Stage Pyro Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* Atmospheric Theme Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[160px] opacity-60 ${
            isBoy ? 'bg-blue-600' : 'bg-pink-600'
          }`}
        />
      </div>

      {/* Top Header Controls */}
      <div className="relative z-20 w-full max-w-4xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-widest text-amber-300">
            P1 PODIUM VICTORY · GRAND PRIX CHAMPION
          </span>
        </div>

        <button
          onClick={onToggleMute}
          className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span className="hidden sm:inline">{isMuted ? "Unmute" : "Sound"}</span>
        </button>
      </div>

      {/* Main Big Announcement Card */}
      <main className="relative z-20 max-w-3xl w-full my-auto py-6 flex flex-col items-center text-center">
        {/* Golden Trophy Icon */}
        <div className="relative mb-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.6)] animate-float">
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-amber-400/80 text-[10px] font-black tracking-wider text-amber-300 uppercase">
            P1 WINNER
          </div>
        </div>

        {/* PROMINENT GENDER REVEAL BANNER (Vibrant Blue for Boy / Vibrant Pink for Girl) */}
        <div
          className={`w-full rounded-3xl p-6 sm:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.7)] border-4 mb-6 transition-all duration-500 relative overflow-hidden animate-pulse-glow ${
            isBoy
              ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 border-blue-300/90 text-white shadow-blue-500/60'
              : 'bg-gradient-to-br from-pink-600 via-rose-600 to-fuchsia-900 border-pink-300/90 text-white shadow-pink-500/60'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/30 text-xs sm:text-sm font-black tracking-widest text-white uppercase mb-3">
            <span>🏁</span>
            <span>{isBoy ? "P1 CHAMPION: TEAM BOY RACING" : "P1 CHAMPION: TEAM GIRL RACING"}</span>
            <span>🏁</span>
          </div>

          <h1 className="font-display text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] leading-none my-3">
            {isBoy ? "IT'S A BOY!" : "IT'S A GIRL!"}
          </h1>

          <p className="text-xl sm:text-3xl font-extrabold text-white/95 drop-shadow-md tracking-wide mt-3">
            {isBoy ? "💙 A Handsome Baby Boy is Joining the Family! 💙" : "💖 A Precious Baby Girl is Joining the Family! 💖"}
          </p>
        </div>

        {/* Grandparents & Family Heartfelt Letter Card (3D Embossed) */}
        <div className="w-full bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border-2 border-slate-700/90 shadow-[0_25px_60px_rgba(0,0,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.15)] mb-8 text-left transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Heart className={`w-4 h-4 ${isBoy ? 'text-blue-400 fill-blue-400' : 'text-pink-400 fill-pink-400'}`} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              To Our Dearest {config.parentsNames || "Parents"}
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-4">
            {config.customMessage || (
              isBoy
                ? "The checkered flag has dropped and our hearts have crossed the finish line! Get ready for the greatest adventure of our lives — tiny pitstops, endless smiles, and so much love. We can't wait for you to meet your new grandson!"
                : "The checkered flag has dropped and our hearts are overflowing with happiness! Get ready for the greatest race of our lives — sweet laughter, tiny hugs, and unforgettable joy. We can't wait for you to meet your new granddaughter!"
            )}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div>
              <span className="font-semibold text-slate-300">Expected Arrival:</span>{" "}
              <span className="text-amber-300 font-bold">{config.babyDueDate || "Coming Soon"}</span>
            </div>
            <div>
              <span>Grand Prix Result: </span>
              <strong className="text-white font-mono">
                {isBoy ? "1st: Team Boy Racing · 2nd: Team Girl" : "1st: Team Girl Racing · 2nd: Team Boy"}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Buttons: Replay & Share */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={onReplay}
            className="px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay GP Race (30s)</span>
          </button>

          <button
            onClick={handleCopyLink}
            className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white'
                : isBoy
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-500/30'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? "Link Copied!" : "Copy Link for Family"}</span>
          </button>

          <button
            onClick={blastChampagneFireworks}
            className="px-5 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="Launch fireworks burst"
          >
            <Flame className="w-4 h-4" />
            <span>Launch Fireworks! 🎆</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 text-xs text-slate-500 pb-2">
        <span>Formula 1 Gender Reveal Grand Prix · Official Family Broadcast</span>
      </footer>
    </div>
  );
};
