import React, { useEffect, useRef } from 'react';
import { GenderWinner, RaceTelemetry, RaceRadioMessage } from '../types';
import { f1Sound } from '../utils/audio';

interface F1RaceTrackProps {
  winner: GenderWinner;
  onTelemetryUpdate: (telemetry: RaceTelemetry) => void;
  onRadioMessage: (msg: RaceRadioMessage) => void;
  onRaceFinish: () => void;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface SmokeParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export const F1RaceTrack: React.FC<F1RaceTrackProps> = ({
  winner,
  onTelemetryUpdate,
  onRadioMessage,
  onRaceFinish,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime: number | null = null;
    const RACE_DURATION = 30.0;

    // Track Waypoints (smooth closed Grand Prix loop)
    // Circuit size: 1000 x 600
    const circuitPoints = [
      { x: 180, y: 490 }, // Start/finish straight
      { x: 420, y: 490 },
      { x: 720, y: 490 }, // End of pit straight
      { x: 860, y: 430 }, // Turn 1 (Right sweeping curve)
      { x: 910, y: 310 }, // Turn 2
      { x: 840, y: 190 }, // Turn 3 chicane
      { x: 740, y: 140 },
      { x: 560, y: 150 }, // Back straight
      { x: 440, y: 110 }, // Turn 5 hairpin entry
      { x: 310, y: 120 },
      { x: 170, y: 180 }, // Complex turns
      { x: 110, y: 280 }, // Esses
      { x: 130, y: 390 },
      { x: 160, y: 460 }, // Final corner onto main straight
    ];

    // Compute track distances
    const totalWaypoints = circuitPoints.length;

    // Cars State
    // progress: 0.0 to N laps
    const firstLeader = winner === 'boy' ? 'girl' : 'boy';
    const finalWinner = winner;

    const carBoy = {
      progress: 0.04,
      lateralOffset: -12, // track width lane
      speed: 280,
      drs: false,
      flame: false,
    };

    const carGirl = {
      progress: 0.02,
      lateralOffset: 12,
      speed: 280,
      drs: false,
      flame: false,
    };

    const sparks: SparkParticle[] = [];
    const smoke: SmokeParticle[] = [];

    // Milestone audio / commentary flags
    let launchAudioFired = false;
    let turn1OvertakeFired = false;
    let radio1Fired = false;
    let drsOvertakeFired = false;
    let finalLapFired = false;
    let finalOvertakeFired = false;
    let raceFinished = false;

    // Canvas scaling
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial launch sound
    f1Sound.startEngine();
    f1Sound.playTireScreech();

    onRadioMessage({
      id: 'lightsout',
      second: 0,
      lap: 'LAP 1/3',
      text: 'LIGHTS OUT AND AWAY WE GO! Wheelspin off the line for both machines!',
      type: 'commentator',
    });

    // Helper: calculate spline position on track
    const getTrackPoint = (progress: number, offset: number = 0) => {
      const p = (progress % 1 + 1) % 1;
      const index = p * totalWaypoints;
      const i0 = Math.floor(index) % totalWaypoints;
      const i1 = (i0 + 1) % totalWaypoints;
      const t = index - Math.floor(index);

      const p0 = circuitPoints[i0];
      const p1 = circuitPoints[i1];

      // Linear segment interpolation
      const x = p0.x + (p1.x - p0.x) * t;
      const y = p0.y + (p1.y - p0.y) * t;

      // Track angle
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);

      // Normal vector for lane offset
      const nx = -Math.sin(angle) * offset;
      const ny = Math.cos(angle) * offset;

      return { x: x + nx, y: y + ny, angle };
    };

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progressNorm = Math.min(1.0, elapsed / RACE_DURATION);

      // Determine race choreography based on elapsed 30s
      let p1Team: 'boy' | 'girl' = firstLeader;
      let gap = 0.42;
      let currentLap = elapsed < 11 ? 1 : elapsed < 22 ? 2 : 3;

      // SCRIPTED RACE DRAMA:
      // 0s - 7s: Turn 1 battle (First leader takes P1)
      if (elapsed < 7.0) {
        if (!turn1OvertakeFired && elapsed > 2.8) {
          turn1OvertakeFired = true;
          f1Sound.playTireScreech();
          f1Sound.playKerbBuzz();
          onRadioMessage({
            id: 'turn1',
            second: 3,
            lap: 'LAP 1/3',
            text: `Team ${firstLeader === 'boy' ? 'Boy' : 'Girl'} dives late on the brakes and steals P1 into Turn 1!`,
            type: 'overtake',
            team: firstLeader,
          });
        }
        gap = 0.35 + Math.sin(elapsed * 2) * 0.1;
      }

      // 7s - 14s: High-speed slipstream & DRS activation
      else if (elapsed >= 7.0 && elapsed < 15.0) {
        if (!radio1Fired && elapsed > 9.0) {
          radio1Fired = true;
          f1Sound.playTeamRadio();
          f1Sound.playDrsChime();
          onRadioMessage({
            id: 'radio_chase',
            second: 9,
            lap: 'LAP 1/3',
            text: `📻 Team Radio: "DRS available. Push now, maximum battery deploy!"`,
            type: 'radio',
            team: finalWinner,
          });
        }
        gap = Math.max(0.12, 0.4 - (elapsed - 7.0) * 0.04);
      }

      // 15s - 21s: Turn 4 Overtake! (Positions Swap!)
      else if (elapsed >= 15.0 && elapsed < 22.0) {
        p1Team = finalWinner; // Winner makes the pass!
        if (!drsOvertakeFired) {
          drsOvertakeFired = true;
          f1Sound.playTireScreech();
          f1Sound.playKerbBuzz();
          onRadioMessage({
            id: 'drs_pass',
            second: 15,
            lap: 'LAP 2/3',
            text: `UNBELIEVABLE MOVE! Team ${finalWinner === 'boy' ? 'Boy' : 'Girl'} sweeps around the outside! They lead the Grand Prix!`,
            type: 'overtake',
            team: finalWinner,
          });
        }
        gap = 0.18 + Math.sin(elapsed * 3) * 0.08;
      }

      // 22s - 26s: Final Lap Tension!
      else if (elapsed >= 22.0 && elapsed < 26.5) {
        p1Team = finalWinner;
        if (!finalLapFired) {
          finalLapFired = true;
          f1Sound.playTeamRadio();
          onRadioMessage({
            id: 'finallap',
            second: 22,
            lap: 'FINAL LAP',
            text: '🏁 WHITE FLAG! Final lap of the Grand Prix! Nose to tail into the final sector!',
            type: 'flag',
          });
        }
        gap = 0.09 + Math.sin(elapsed * 4) * 0.04;
      }

      // 26.5s - 30.0s: Final Corner Slingshot & Checkered Flag!
      else if (elapsed >= 26.5) {
        p1Team = finalWinner;
        if (!finalOvertakeFired) {
          finalOvertakeFired = true;
          f1Sound.playTireScreech();
          f1Sound.playDrsChime();
          onRadioMessage({
            id: 'last_corner',
            second: 27,
            lap: 'FINAL LAP',
            text: `Side-by-side out of the final chicane! Full throttle to the checkered flag!`,
            type: 'commentator',
          });
        }

        gap = 0.22;

        if (elapsed >= 29.6 && !raceFinished) {
          raceFinished = true;
          f1Sound.playCheckeredFlag();
          f1Sound.stopEngine();
          f1Sound.playPodiumFanfare();
          onRadioMessage({
            id: 'finish',
            second: 30,
            lap: 'CHECKERED FLAG',
            text: `CHECKERED FLAG! TEAM ${finalWinner.toUpperCase()} WINS THE GENDER REVEAL GRAND PRIX!`,
            type: 'finish',
            team: finalWinner,
          });
          setTimeout(() => {
            onRaceFinish();
          }, 700);
        }
      }

      // Advance car track progress
      // Complete ~3.2 laps in 30 seconds (speed ~0.106 laps/sec)
      const baseSpeed = 0.105;
      if (p1Team === 'boy') {
        carBoy.progress += baseSpeed * 0.018;
        carGirl.progress = carBoy.progress - gap * 0.04;
      } else {
        carGirl.progress += baseSpeed * 0.018;
        carBoy.progress = carGirl.progress - gap * 0.04;
      }

      // Telemetry telemetry updates
      const speed1 = Math.floor(305 + Math.sin(elapsed * 4) * 25);
      const speed2 = Math.floor(300 + Math.cos(elapsed * 4) * 24);

      f1Sound.setEngineRpm(carBoy.progress);

      onTelemetryUpdate({
        p1: p1Team,
        p2: p1Team === 'boy' ? 'girl' : 'boy',
        gapSeconds: Number(gap.toFixed(3)),
        lap: currentLap,
        totalLaps: 3,
        boySpeed: p1Team === 'boy' ? speed1 : speed2,
        girlSpeed: p1Team === 'girl' ? speed1 : speed2,
        boyDrs: elapsed > 8 && elapsed < 16,
        girlDrs: elapsed > 16 && elapsed < 24,
        sector: elapsed % 10 < 3.3 ? 1 : elapsed % 10 < 6.6 ? 2 : 3,
      });

      // Get Coordinates of both cars
      const boyPos = getTrackPoint(carBoy.progress, carBoy.lateralOffset);
      const girlPos = getTrackPoint(carGirl.progress, carGirl.lateralOffset);

      // Emit sparks from titanium skid plates during high speeds
      if (Math.random() < 0.45) {
        const leadPos = p1Team === 'boy' ? boyPos : girlPos;
        sparks.push({
          x: leadPos.x - Math.cos(leadPos.angle) * 16,
          y: leadPos.y - Math.sin(leadPos.angle) * 16,
          vx: -Math.cos(leadPos.angle) * (Math.random() * 4 + 2) + (Math.random() - 0.5) * 2,
          vy: -Math.sin(leadPos.angle) * (Math.random() * 4 + 2) + (Math.random() - 0.5) * 2,
          life: 1.0,
          color: Math.random() > 0.3 ? '#f59e0b' : '#ffffff',
        });
      }

      // Update sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.06;
        if (s.life <= 0) sparks.splice(i, 1);
      }

      // Update smoke
      for (let i = smoke.length - 1; i >= 0; i--) {
        smoke[i].size += 0.8;
        smoke[i].opacity -= 0.03;
        if (smoke[i].opacity <= 0) smoke.splice(i, 1);
      }

      // RENDER CANVAS
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Scale 1000x600 logical circuit into canvas viewport
      const scale = Math.min(w / 1000, h / 600);
      const offsetX = (w - 1000 * scale) / 2;
      const offsetY = (h - 600 * scale) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // 1. Draw Infield Landscape & Grandstands
      drawInfield(ctx, 1000, 600, elapsed);

      // 2. Draw Tarmac Asphalt & Rumble Kerbs
      drawCircuitTrack(ctx, circuitPoints);

      // 3. Draw Sparks
      sparks.forEach((s) => {
        ctx.save();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5 * s.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Draw Formula 1 Race Cars
      drawF1Car(ctx, boyPos.x, boyPos.y, boyPos.angle, 'boy');
      drawF1Car(ctx, girlPos.x, girlPos.y, girlPos.angle, 'girl');

      // 5. Draw Start/Finish Line Gantry
      drawStartFinishGantry(ctx, circuitPoints[0]);

      ctx.restore();

      if (elapsed < RACE_DURATION + 1.2) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      f1Sound.stopEngine();
    };
  }, [winner]);

  // Track Infield, Grandstands, Lake, and Runoffs
  const drawInfield = (ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) => {
    // Rich circuit grass base
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, w, h);

    // Decorative lake/water feature in center of circuit
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(450, 310, 110, 65, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grandstand along main straight
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(200, 535, 460, 45);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(200, 535, 460, 45);

    // Cheering spectators in grandstand
    for (let c = 0; c < 36; c++) {
      const cx = 210 + c * 12;
      const wave = Math.sin(elapsed * 4 + c * 0.4) * 2;
      ctx.fillStyle = c % 2 === 0 ? '#38bdf8' : '#f472b6';
      ctx.beginPath();
      ctx.arc(cx, 550 + wave, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Secondary Grandstand at Turn 1
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(870, 450, 100, 40);
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#38bdf8' : '#f472b6';
      ctx.beginPath();
      ctx.arc(880 + c * 11, 465, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Draw smooth tarmac racing ribbon with kerbs
  const drawCircuitTrack = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[]
  ) => {
    ctx.save();

    // 1. Gravel runoff / asphalt edge
    ctx.lineWidth = 68;
    ctx.strokeStyle = '#334155';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();

    // 2. Red & White Kerbs on corners
    ctx.lineWidth = 60;
    ctx.strokeStyle = '#dc2626';
    ctx.setLineDash([12, 12]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Main Asphalt Ribbon
    ctx.lineWidth = 50;
    ctx.strokeStyle = '#090d16';
    ctx.stroke();

    // 4. Center racing line dotted
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([15, 20]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  };

  // Draw high-detail aerodynamic Formula 1 car
  const drawF1Car = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    team: 'boy' | 'girl'
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Car shadow on tarmac
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-22, -10, 44, 20, 4);
    ctx.fill();

    const isBoy = team === 'boy';
    const primaryColor = isBoy ? '#0284c7' : '#ec4899';
    const secondaryColor = isBoy ? '#38bdf8' : '#fda4af';
    const accentColor = isBoy ? '#1e3a8a' : '#9d174d';

    // 4 F1 Pirelli Tires (Front Left/Right, Rear Left/Right)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#fbbf24'; // Yellow tire rim stripe (Soft compound)
    ctx.lineWidth = 1;

    // Front tires
    ctx.fillRect(8, -13, 10, 5);
    ctx.fillRect(8, 8, 10, 5);

    // Rear tires (wider)
    ctx.fillRect(-18, -14, 12, 6);
    ctx.fillRect(-18, 8, 12, 6);

    // Front Wing (Wide aerodynamic profile)
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(16, -11, 6, 22, 2);
    ctx.fill();
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(17, -8, 2, 16);

    // Main Chassis Body (Tapered Coke-bottle rear)
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(18, -3);
    ctx.lineTo(8, -7);
    ctx.lineTo(-12, -7);
    ctx.lineTo(-18, -4);
    ctx.lineTo(-18, 4);
    ctx.lineTo(-12, 7);
    ctx.lineTo(8, 7);
    ctx.lineTo(18, 3);
    ctx.closePath();
    ctx.fill();

    // Sidepod air intakes
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(-6, -6.5, 10, 2);
    ctx.fillRect(-6, 4.5, 10, 2);

    // Halo Cockpit & Driver Helmet
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Driver helmet color
    ctx.fillStyle = isBoy ? '#60a5fa' : '#f472b6';
    ctx.beginPath();
    ctx.arc(-1, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Rear Wing & DRS Flap
    ctx.fillStyle = accentColor;
    ctx.fillRect(-22, -10, 4, 20);
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(-22, -7, 1.5, 14);

    // Rear Safety Rain Light (Flashing Red LED)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-22, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Car number (#1)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 7, 0);

    ctx.restore();
  };

  // Start/Finish Checkered Line & Gantry
  const drawStartFinishGantry = (
    ctx: CanvasRenderingContext2D,
    pos: { x: number; y: number }
  ) => {
    ctx.save();

    // Checkered line across track
    const checkSize = 5;
    for (let r = -25; r < 25; r += checkSize) {
      for (let c = 0; c < 2; c++) {
        const isWhite = (Math.floor(r / checkSize) + c) % 2 === 0;
        ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
        ctx.fillRect(pos.x + c * checkSize, pos.y + r, checkSize, checkSize);
      }
    }

    // Overhead Gantry structure
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 32);
    ctx.lineTo(pos.x, pos.y + 32);
    ctx.stroke();

    ctx.restore();
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[1440px] max-h-[900px] object-contain block"
      />
    </div>
  );
};
