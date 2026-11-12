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
  vx: number;
  vy: number;
  size: number;
  alpha: number;
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

    // Track scroll offset for illusion of infinite 330 km/h speed
    let trackScroll = 0;
    let trackCurvature = 0;

    // Cars dynamic positions on screen
    // screen logical coordinates: 1200 x 700
    // X axis: horizontal track position (0: back of screen, 1200: front)
    // Y axis: lateral lane position (track lanes between 240 and 460)
    const firstLeader = winner === 'boy' ? 'girl' : 'boy';
    const finalWinner = winner;

    const carBoy = {
      x: 350,
      y: 280,
      targetX: 350,
      targetY: 280,
      speed: 310,
      drs: false,
      braking: false,
      steerAngle: 0,
    };

    const carGirl = {
      x: 320,
      y: 400,
      targetX: 320,
      targetY: 400,
      speed: 308,
      drs: false,
      braking: false,
      steerAngle: 0,
    };

    const sparks: SparkParticle[] = [];
    const smoke: SmokeParticle[] = [];

    // Milestone audio / commentary flags
    let turn1OvertakeFired = false;
    let radio1Fired = false;
    let chicaneOvertakeFired = false;
    let finalLapFired = false;
    let finalSlingshotFired = false;
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

    // Initial launch audio
    f1Sound.startEngine();
    f1Sound.playTireScreech();

    onRadioMessage({
      id: 'lightsout',
      second: 0,
      lap: 'LAP 1/3',
      text: 'LIGHTS OUT! Wheel-to-wheel launch off the grid! Engine screams at 12,000 RPM!',
      type: 'commentator',
    });

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      // High-speed asphalt scroll rate (330 km/h)
      trackScroll += 48;
      trackCurvature = Math.sin(elapsed * 0.7) * 45;

      let p1Team: 'boy' | 'girl' = firstLeader;
      let gap = 0.35;
      let currentLap = elapsed < 11 ? 1 : elapsed < 22 ? 2 : 3;

      // ==========================================
      // BACK-AND-FORTH WHEEL-TO-WHEEL SCRIPT
      // ==========================================

      // PHASE 1: 0s - 7s (The Grid Launch & Turn 1 Dive)
      if (elapsed < 7.0) {
        if (firstLeader === 'boy') {
          carBoy.targetX = 640;
          carBoy.targetY = 320;
          carGirl.targetX = 460;
          carGirl.targetY = 410;
        } else {
          carGirl.targetX = 640;
          carGirl.targetY = 390;
          carBoy.targetX = 460;
          carBoy.targetY = 300;
        }

        if (!turn1OvertakeFired && elapsed > 2.8) {
          turn1OvertakeFired = true;
          f1Sound.playTireScreech();
          f1Sound.playKerbBuzz();
          onRadioMessage({
            id: 'turn1',
            second: 3,
            lap: 'LAP 1/3',
            text: `Team ${firstLeader === 'boy' ? 'Boy' : 'Girl'} takes the lead! Lunges down the inside at Turn 1!`,
            type: 'overtake',
            team: firstLeader,
          });
        }
        gap = 0.28 + Math.sin(elapsed * 2) * 0.08;
      }

      // PHASE 2: 7s - 14s (Slipstream & DRS Attack on Straight)
      else if (elapsed >= 7.0 && elapsed < 15.0) {
        // Trailing car tucks right behind into slipstream, then pulls out!
        if (finalWinner === 'boy') {
          // Boy tucks directly behind girl
          if (elapsed < 10.5) {
            carBoy.targetX = carGirl.x - 110;
            carBoy.targetY = carGirl.y; // slipstream draft
            carBoy.drs = false;
          } else {
            // Boy pulls out to overtake!
            carBoy.targetX = carGirl.x + 80;
            carBoy.targetY = 280;
            carBoy.drs = true; // DRS opens!
          }
        } else {
          // Girl tucks directly behind boy
          if (elapsed < 10.5) {
            carGirl.targetX = carBoy.x - 110;
            carGirl.targetY = carBoy.y;
            carGirl.drs = false;
          } else {
            // Girl pulls out to overtake!
            carGirl.targetX = carBoy.x + 80;
            carGirl.targetY = 410;
            carGirl.drs = true;
          }
        }

        if (!radio1Fired && elapsed > 8.8) {
          radio1Fired = true;
          f1Sound.playTeamRadio();
          f1Sound.playDrsChime();
          onRadioMessage({
            id: 'radio_chase',
            second: 9,
            lap: 'LAP 1/3',
            text: `📻 Team Radio: "DRS enabled. Maximum battery deploy! Go get them!"`,
            type: 'radio',
            team: finalWinner,
          });
        }
        gap = Math.max(0.08, 0.32 - (elapsed - 7.0) * 0.035);
      }

      // PHASE 3: 15s - 22s (Heavy Braking & Position Swap into the Chicane!)
      else if (elapsed >= 15.0 && elapsed < 22.0) {
        p1Team = finalWinner; // Lead changes!

        if (finalWinner === 'boy') {
          carBoy.targetX = 680;
          carBoy.targetY = 320;
          carGirl.targetX = 520;
          carGirl.targetY = 420;
          carBoy.drs = false;
        } else {
          carGirl.targetX = 680;
          carGirl.targetY = 380;
          carBoy.targetX = 520;
          carBoy.targetY = 290;
          carGirl.drs = false;
        }

        if (!chicaneOvertakeFired) {
          chicaneOvertakeFired = true;
          f1Sound.playTireScreech();
          f1Sound.playKerbBuzz();
          onRadioMessage({
            id: 'chicane_pass',
            second: 15,
            lap: 'LAP 2/3',
            text: `SENSATIONAL OVERTAKE! Late on the brakes into the chicane! Team ${finalWinner === 'boy' ? 'Boy' : 'Girl'} takes P1!`,
            type: 'overtake',
            team: finalWinner,
          });
        }
        gap = 0.16 + Math.sin(elapsed * 3) * 0.05;
      }

      // PHASE 4: 22s - 26.5s (Final Lap Wheel-to-Wheel Jostle)
      else if (elapsed >= 22.0 && elapsed < 26.5) {
        // Cars side-by-side, oscillating back and forth by inches!
        const sway = Math.sin(elapsed * 5) * 40;
        if (finalWinner === 'boy') {
          carBoy.targetX = 620 + sway;
          carBoy.targetY = 310;
          carGirl.targetX = 600 - sway;
          carGirl.targetY = 410;
        } else {
          carGirl.targetX = 620 + sway;
          carGirl.targetY = 390;
          carBoy.targetX = 600 - sway;
          carBoy.targetY = 290;
        }

        if (!finalLapFired) {
          finalLapFired = true;
          f1Sound.playTeamRadio();
          f1Sound.playKerbBuzz();
          onRadioMessage({
            id: 'finallap',
            second: 22,
            lap: 'FINAL LAP',
            text: '🏁 WHITE FLAG! Final lap! Side-by-side rubbing tires at 320 km/h!',
            type: 'flag',
          });
        }
        gap = 0.06 + Math.abs(Math.sin(elapsed * 4)) * 0.04;
      }

      // PHASE 5: 26.5s - 30.0s (The Final Slingshot & Checkered Flag!)
      else if (elapsed >= 26.5) {
        p1Team = finalWinner;

        // Winning car launches forward to seal the championship!
        if (finalWinner === 'boy') {
          carBoy.targetX = 780;
          carBoy.targetY = 340;
          carGirl.targetX = 540;
          carGirl.targetY = 410;
          carBoy.drs = true;
        } else {
          carGirl.targetX = 780;
          carGirl.targetY = 370;
          carBoy.targetX = 540;
          carBoy.targetY = 280;
          carGirl.drs = true;
        }

        if (!finalSlingshotFired) {
          finalSlingshotFired = true;
          f1Sound.playTireScreech();
          f1Sound.playDrsChime();
          onRadioMessage({
            id: 'slingshot',
            second: 27,
            lap: 'FINAL LAP',
            text: `FINAL CORNER! Team ${finalWinner === 'boy' ? 'Boy' : 'Girl'} pulls out from the tow and surges ahead! Full throttle to the line!`,
            type: 'commentator',
          });
        }

        gap = 0.24;

        if (elapsed >= 29.6 && !raceFinished) {
          raceFinished = true;
          f1Sound.playCheckeredFlag();
          f1Sound.stopEngine();
          f1Sound.playPodiumFanfare();
          onRadioMessage({
            id: 'finish',
            second: 30,
            lap: 'CHECKERED FLAG',
            text: `CHECKERED FLAG! TEAM ${finalWinner.toUpperCase()} CROSSES THE LINE TO WIN THE GRAND PRIX!`,
            type: 'finish',
            team: finalWinner,
          });
          setTimeout(() => {
            onRaceFinish();
          }, 700);
        }
      }

      // Smooth lerp car positions
      carBoy.x += (carBoy.targetX - carBoy.x) * 0.08;
      carBoy.y += (carBoy.targetY - carBoy.y) * 0.08;
      carBoy.steerAngle = (carBoy.targetY - carBoy.y) * 0.04;

      carGirl.x += (carGirl.targetX - carGirl.x) * 0.08;
      carGirl.y += (carGirl.targetY - carGirl.y) * 0.08;
      carGirl.steerAngle = (carGirl.targetY - carGirl.y) * 0.04;

      // Telemetry update
      const speed1 = Math.floor(328 + Math.sin(elapsed * 3) * 12);
      const speed2 = Math.floor(320 + Math.cos(elapsed * 3) * 10);
      f1Sound.setEngineRpm(0.4 + (speed1 / 340) * 0.6);

      onTelemetryUpdate({
        p1: p1Team,
        p2: p1Team === 'boy' ? 'girl' : 'boy',
        gapSeconds: Number(gap.toFixed(3)),
        lap: currentLap,
        totalLaps: 3,
        boySpeed: p1Team === 'boy' ? speed1 : speed2,
        girlSpeed: p1Team === 'girl' ? speed1 : speed2,
        boyDrs: carBoy.drs,
        girlDrs: carGirl.drs,
        sector: elapsed % 10 < 3.3 ? 1 : elapsed % 10 < 6.6 ? 2 : 3,
      });

      // Emit titanium sparks from cars during high speeds
      [carBoy, carGirl].forEach((car) => {
        if (Math.random() < 0.5) {
          sparks.push({
            x: car.x - 70,
            y: car.y + (Math.random() - 0.5) * 16,
            vx: -(Math.random() * 8 + 6),
            vy: (Math.random() - 0.5) * 3,
            life: 1.0,
            color: Math.random() > 0.3 ? '#fbbf24' : '#ffffff',
          });
        }
      });

      // Update sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.05;
        if (s.life <= 0) sparks.splice(i, 1);
      }

      // DRAW CANVAS
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Fit logical 1200x700 into canvas with letterboxing/scaling
      const scale = Math.min(w / 1200, h / 700);
      const offsetX = (w - 1200 * scale) / 2;
      const offsetY = (h - 700 * scale) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // 1. Draw High-Speed Asphalt Track & Rumble Kerbs (Scrolling in real-time)
      drawHighSpeedTrack(ctx, trackScroll, trackCurvature, elapsed);

      // 2. Draw Checkered Finish Line if at final second
      if (elapsed >= 28.5) {
        const lineX = 1200 - ((elapsed - 28.5) / 1.5) * 650;
        drawFinishLineAcrossTrack(ctx, lineX);
      }

      // 3. Draw Titanium Sparks
      sparks.forEach((s) => {
        ctx.save();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3 * s.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Draw 3D Detailed Formula 1 Cars (Sorted by Y for correct visual layering)
      const cars = [
        { car: carBoy, team: 'boy' as const },
        { car: carGirl, team: 'girl' as const },
      ].sort((a, b) => a.car.y - b.car.y);

      cars.forEach(({ car, team }) => {
        draw3DFormula1Car(ctx, car.x, car.y, car.steerAngle, car.drs, team, elapsed);
      });

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

  // Draw high-speed infinite scrolling track with kerbs, barriers, and grass
  const drawHighSpeedTrack = (
    ctx: CanvasRenderingContext2D,
    scroll: number,
    curve: number,
    elapsed: number
  ) => {
    // 1. Infield green grass
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1200, 700);

    // 2. Red & White Kerbs (Top Kerb: Y=180, Bottom Kerb: Y=510)
    const kerbSize = 40;
    const kerbOffset = scroll % (kerbSize * 2);

    // Top Kerb
    for (let x = -kerbSize * 2; x < 1200 + kerbSize * 2; x += kerbSize) {
      const isRed = Math.floor((x - kerbOffset) / kerbSize) % 2 === 0;
      ctx.fillStyle = isRed ? '#dc2626' : '#ffffff';
      ctx.fillRect(x - kerbOffset, 175, kerbSize, 25);
      // Bottom Kerb
      ctx.fillRect(x - kerbOffset, 500, kerbSize, 25);
    }

    // 3. Main Asphalt Racing Ribbon (Height 300px between Y=200 and Y=500)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 200, 1200, 300);

    // Dark rubberized racing groove
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 240, 1200, 80);
    ctx.fillRect(0, 380, 1200, 80);

    // 4. White Dash Lanes (Center Track Markings)
    const dashLen = 60;
    const dashGap = 40;
    const totalDash = dashLen + dashGap;
    const dashOffset = scroll % totalDash;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let x = -totalDash; x < 1200 + totalDash; x += totalDash) {
      ctx.fillRect(x - dashOffset, 347, dashLen, 6);
    }
    ctx.restore();

    // 5. Overhead Speed Lines & Motion Blur streaks
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const lineY = 210 + i * 36;
      const lx = ((scroll * 1.8 + i * 190) % 1300) - 100;
      ctx.beginPath();
      ctx.moveTo(1200 - lx, lineY);
      ctx.lineTo(1200 - lx + 120, lineY);
      ctx.stroke();
    }
    ctx.restore();

    // 6. Trackside Grandstands & Cheering Fans (Top border Y=0 to 175)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1200, 170);

    // Grandstand crowd dots waving
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 48; c++) {
        const fx = c * 25 + (r % 2) * 12;
        const fy = 35 + r * 30;
        const wave = Math.sin(elapsed * 5 + c * 0.3) * 3;
        ctx.fillStyle = (c + r) % 2 === 0 ? '#38bdf8' : '#f472b6';
        ctx.beginPath();
        ctx.arc(fx, fy + wave, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Top Crash Barrier Fence
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 172);
    ctx.lineTo(1200, 172);
    ctx.stroke();

    // Bottom Crash Barrier Fence
    ctx.beginPath();
    ctx.moveTo(0, 528);
    ctx.lineTo(1200, 528);
    ctx.stroke();
  };

  // Draw Finish Line across track on the final lap
  const drawFinishLineAcrossTrack = (ctx: CanvasRenderingContext2D, x: number) => {
    ctx.save();
    const squareSize = 15;
    const rows = 20; // 300px track / 15
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        const isWhite = (r + c) % 2 === 0;
        ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
        ctx.fillRect(x + c * squareSize, 200 + r * squareSize, squareSize, squareSize);
      }
    }

    // Overhead Checkered Flag Banner
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - 5, 170, 40, 8);
    ctx.fillRect(x - 5, 522, 40, 8);
    ctx.restore();
  };

  // Draw true 3D detailed Formula 1 car with layered depth, halo, openable DRS, carbon-fiber wings, and glowing exhaust
  const draw3DFormula1Car = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    steerAngle: number,
    drsActive: boolean,
    team: 'boy' | 'girl',
    elapsed: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(steerAngle * 0.5); // subtle chassis heading

    const isBoy = team === 'boy';

    // 3D Color Palette
    const liveryPrimary = isBoy ? '#0284c7' : '#ec4899';
    const liveryHighlight = isBoy ? '#38bdf8' : '#f472b6';
    const liveryShadow = isBoy ? '#0369a1' : '#be185d';
    const liveryDark = isBoy ? '#0c4a6e' : '#831843';

    // 1. 3D Underfloor Ground Shadow (ambient occlusion on asphalt)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(-85, -34, 170, 68, 12);
    ctx.fill();
    ctx.restore();

    // 2. 4 Large 3D Pirelli Tires with Rim Reflections
    const tireWidth = 26;
    const tireHeight = 15;

    const drawTire = (tx: number, ty: number, isFront: boolean) => {
      ctx.save();
      ctx.translate(tx, ty);
      if (isFront) {
        ctx.rotate(steerAngle * 1.5); // front wheels steer
      }

      // Tire rubber (dark matte charcoal)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-tireWidth / 2, -tireHeight / 2, tireWidth, tireHeight, 4);
      ctx.fill();

      // Yellow Soft Compound Sidewall stripe
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-tireWidth / 2 + 1, -tireHeight / 2 + 1, tireWidth - 2, tireHeight - 2);

      // Rotating rim spokes blur
      ctx.fillStyle = '#64748b';
      const spokeOffset = Math.sin(elapsed * 25) * 4;
      ctx.fillRect(-tireWidth / 4 + spokeOffset, -2, 6, 4);

      ctx.restore();
    };

    // Front Left & Right Tires
    drawTire(45, -35, true);
    drawTire(45, 35, true);

    // Rear Left & Right Tires (wider tread footprint)
    drawTire(-55, -38, false);
    drawTire(-55, 38, false);

    // 3. Carbon Fiber Aerodynamic Front Wing (Multi-Element with 3D Endplates)
    ctx.save();
    // Wing Main Plane (front at X = +75)
    ctx.fillStyle = '#1e293b'; // carbon base
    ctx.beginPath();
    ctx.roundRect(62, -34, 18, 68, 3);
    ctx.fill();

    // Wing Flaps (team colors with aerodynamic curvature)
    ctx.fillStyle = liveryHighlight;
    ctx.fillRect(65, -30, 4, 60);
    ctx.fillStyle = liveryPrimary;
    ctx.fillRect(70, -32, 5, 64);

    // Left and Right Endplates with 3D bevels
    ctx.fillStyle = liveryDark;
    ctx.fillRect(62, -36, 18, 3.5);
    ctx.fillRect(62, 32.5, 18, 3.5);
    ctx.restore();

    // 4. Main 3D Tapered Monocoque Chassis Body
    ctx.save();
    // Lower chassis base shadow
    ctx.fillStyle = liveryShadow;
    ctx.beginPath();
    ctx.moveTo(70, -6);
    ctx.lineTo(25, -24);
    ctx.lineTo(-45, -26);
    ctx.lineTo(-65, -12);
    ctx.lineTo(-65, 12);
    ctx.lineTo(-45, 26);
    ctx.lineTo(25, 24);
    ctx.lineTo(70, 6);
    ctx.closePath();
    ctx.fill();

    // Upper chassis body with specular gradient
    const bodyGrad = ctx.createLinearGradient(0, -25, 0, 25);
    bodyGrad.addColorStop(0, liveryHighlight);
    bodyGrad.addColorStop(0.3, liveryPrimary);
    bodyGrad.addColorStop(0.7, liveryPrimary);
    bodyGrad.addColorStop(1, liveryShadow);

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(68, -4);
    ctx.lineTo(24, -20);
    ctx.lineTo(-42, -22);
    ctx.lineTo(-62, -10);
    ctx.lineTo(-62, 10);
    ctx.lineTo(-42, 22);
    ctx.lineTo(24, 20);
    ctx.lineTo(68, 4);
    ctx.closePath();
    ctx.fill();

    // Sidepod Air Intakes with 3D black radiator mouths
    ctx.fillStyle = '#020617';
    ctx.fillRect(10, -22, 14, 5);
    ctx.fillRect(10, 17, 14, 5);

    // Cockpit & Halo Protection Hoop
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.ellipse(-5, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Driver Helmet (3D Visor with iridescent shine)
    ctx.fillStyle = isBoy ? '#60a5fa' : '#f472b6';
    ctx.beginPath();
    ctx.arc(-4, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    // Helmet visor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -3.5, 5, 7);

    // Halo 3D Curved Titanium Structure
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-3, 0, 9, -Math.PI / 2, Math.PI / 2, false);
    ctx.stroke();

    // Car Number 1 on Nose Cone
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 38, 0);

    // 5. 3D Rear Wing with Real-Time DRS Actuator Flap
    ctx.save();
    // Rear Wing Pylons
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-68, -4, 8, 8);

    // Main Rear Wing Plane
    ctx.fillStyle = liveryDark;
    ctx.fillRect(-76, -32, 10, 64);

    // DRS Upper Flap (physically flips UP when DRS is open!)
    if (drsActive) {
      // DRS OPEN: Flap flips flat creating aerodynamic slot gap
      ctx.fillStyle = '#22c55e'; // Green DRS highlight
      ctx.fillRect(-78, -26, 4, 52);
    } else {
      // DRS CLOSED: High downforce wing element
      ctx.fillStyle = liveryHighlight;
      ctx.fillRect(-74, -28, 6, 56);
    }

    // Wing Endplates
    ctx.fillStyle = liveryPrimary;
    ctx.fillRect(-78, -34, 14, 4);
    ctx.fillRect(-78, 30, 14, 4);
    ctx.restore();

    // 6. Flashing Red FIA Rain Safety Light
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(-72, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Dynamic Exhaust Flame / ERS Battery Boost Glow
    if (drsActive || Math.random() < 0.6) {
      ctx.save();
      const flameLen = Math.random() * 25 + 18;
      const flameGrad = ctx.createLinearGradient(-75, 0, -75 - flameLen, 0);
      flameGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)'); // blue core
      flameGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.8)'); // orange
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-74, -4);
      ctx.lineTo(-74 - flameLen, 0);
      ctx.lineTo(-74, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

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
