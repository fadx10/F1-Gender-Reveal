import React, { useEffect, useRef, useState } from 'react';
import { Flag, Gauge, Radio, Zap } from 'lucide-react';
import { GenderWinner, RaceTelemetry, RaceRadioMessage } from '../types';
import { f1Sound } from '../utils/audio';

interface F1RaceTrackProps {
  winner: GenderWinner;
  onTelemetryUpdate: (telemetry: RaceTelemetry, elapsedSeconds: number) => void;
  onRadioMessage: (msg: RaceRadioMessage) => void;
  onRaceFinish: () => void;
}

const RACE_DURATION = 30_000;

export const F1RaceTrack: React.FC<F1RaceTrackProps> = ({
  winner,
  onTelemetryUpdate,
  onRadioMessage,
  onRaceFinish,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const callbacks = useRef({ onTelemetryUpdate, onRadioMessage, onRaceFinish });

  callbacks.current = { onTelemetryUpdate, onRadioMessage, onRaceFinish };

  useEffect(() => {
    const startedAt = Date.now();
    const challenger: GenderWinner = winner === 'boy' ? 'girl' : 'boy';
    let finished = false;

    const sendRadio = (
      id: string,
      second: number,
      lap: string,
      text: string,
      type: RaceRadioMessage['type'],
      team?: GenderWinner,
    ) => callbacks.current.onRadioMessage({ id, second, lap, text, type, team });

    f1Sound.startEngine();
    sendRadio(
      'lightsout',
      0,
      'LAP 1/3',
      'LIGHTS OUT! Both teams launch from the grid. The Grand Prix is underway!',
      'commentator',
    );

    const milestoneTimers = [
      window.setTimeout(() => {
        f1Sound.playTireScreech();
        sendRadio('turn1', 3, 'LAP 1/3', `Team ${challenger === 'boy' ? 'Boy' : 'Girl'} gets the early jump into Turn 1!`, 'overtake', challenger);
      }, 3_000),
      window.setTimeout(() => {
        f1Sound.playTeamRadio();
        f1Sound.playDrsChime();
        sendRadio('radio_chase', 9, 'LAP 1/3', 'TEAM RADIO: DRS enabled. Deploy the battery and make the move!', 'radio', winner);
      }, 9_000),
      window.setTimeout(() => {
        f1Sound.playTireScreech();
        f1Sound.playKerbBuzz();
        sendRadio('chicane_pass', 15, 'LAP 2/3', `Brilliant move! Team ${winner === 'boy' ? 'Boy' : 'Girl'} takes the lead into the chicane!`, 'overtake', winner);
      }, 15_000),
      window.setTimeout(() => {
        f1Sound.playTeamRadio();
        sendRadio('finallap', 22, 'FINAL LAP', 'FINAL LAP! The two cars are battling wheel-to-wheel!', 'flag');
      }, 22_000),
      window.setTimeout(() => {
        f1Sound.playDrsChime();
        sendRadio('slingshot', 27, 'FINAL LAP', `Final push! Team ${winner === 'boy' ? 'Boy' : 'Girl'} makes the decisive move for the line!`, 'commentator', winner);
      }, 27_000),
    ];

    const ticker = window.setInterval(() => {
      const elapsedMs = Math.min(Date.now() - startedAt, RACE_DURATION);
      const seconds = elapsedMs / 1000;
      setElapsed(seconds);

      const leader: GenderWinner = seconds < 15 ? challenger : winner;
      const speed = Math.round(315 + Math.sin(seconds * 1.7) * 16);
      const chaseSpeed = Math.round(309 + Math.cos(seconds * 1.3) * 13);
      f1Sound.setEngineRpm(0.45 + (speed / 350) * 0.5);

      callbacks.current.onTelemetryUpdate({
        p1: leader,
        p2: leader === 'boy' ? 'girl' : 'boy',
        gapSeconds: seconds < 15 ? 0.32 - seconds * 0.012 : Math.max(0.08, 0.18 - (seconds - 15) * 0.006),
        lap: Math.min(3, Math.floor(seconds / 10) + 1),
        totalLaps: 3,
        boySpeed: leader === 'boy' ? speed : chaseSpeed,
        girlSpeed: leader === 'girl' ? speed : chaseSpeed,
        boyDrs: seconds >= 9 && seconds < 15 && winner === 'boy' || seconds >= 27 && winner === 'boy',
        girlDrs: seconds >= 9 && seconds < 15 && winner === 'girl' || seconds >= 27 && winner === 'girl',
        sector: (Math.floor((seconds % 10) / (10 / 3)) + 1) as 1 | 2 | 3,
      }, seconds);

      if (elapsedMs >= RACE_DURATION && !finished) {
        finished = true;
        window.clearInterval(ticker);
        f1Sound.playCheckeredFlag();
        f1Sound.stopEngine();
        f1Sound.playPodiumFanfare();
        sendRadio(
          'finish',
          30,
          'CHECKERED FLAG',
          `CHECKERED FLAG! TEAM ${winner.toUpperCase()} WINS THE GRAND PRIX!`,
          'finish',
          winner,
        );
        window.setTimeout(() => callbacks.current.onRaceFinish(), 900);
      }
    }, 100);

    return () => {
      window.clearInterval(ticker);
      milestoneTimers.forEach(window.clearTimeout);
      f1Sound.stopEngine();
    };
  }, [winner]);

  const progress = Math.min(100, (elapsed / 30) * 100);
  const leader = elapsed < 15 ? (winner === 'boy' ? 'girl' : 'boy') : winner;
  const boyWins = winner === 'boy';

  return (
    <div className="race-scene absolute inset-0 flex flex-col justify-center overflow-hidden bg-[#07111b] text-white select-none">
      <div className="race-lights pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-24 sm:px-8 sm:pt-28">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/75 px-3 py-2 text-[10px] font-black tracking-[0.2em] text-slate-300 sm:text-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          LIVE GRAND PRIX
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/75 px-4 py-2 text-center">
          <div className="text-[9px] font-bold tracking-[0.2em] text-slate-400">RACE CLOCK</div>
          <div className="font-mono text-lg font-black tabular-nums text-amber-300 sm:text-2xl">
            00:{Math.floor(elapsed).toString().padStart(2, '0')} <span className="text-xs text-slate-500">/ 00:30</span>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-950/75 px-3 py-2 text-xs font-bold text-slate-300 sm:flex">
          <Gauge className="h-4 w-4 text-emerald-400" />
          {Math.round(315 + Math.sin(elapsed * 1.7) * 16)} KM/H
        </div>
      </div>

      <div className="relative z-10 mx-auto my-auto w-full max-w-6xl px-3 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-8">
          <div>
            <div className="text-[10px] font-black tracking-[0.28em] text-amber-300 sm:text-xs">THE REVEAL GRAND PRIX</div>
            <h2 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-4xl md:text-5xl">
              {elapsed < 22 ? 'Wheel to wheel.' : 'Final lap. Full throttle.'}
            </h2>
          </div>
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-right">
            <div className="text-[9px] font-bold tracking-widest text-amber-200/70">LAP</div>
            <div className="font-mono text-xl font-black text-amber-300">{Math.min(3, Math.floor(elapsed / 10) + 1)}<span className="text-sm text-slate-400">/3</span></div>
          </div>
        </div>

        <div className="race-track relative overflow-hidden rounded-[1.75rem] border-y-8 border-red-500/80 bg-[#202a34] shadow-[0_25px_100px_rgba(0,0,0,0.6)]">
          <div className="race-grandstand absolute inset-x-0 top-0 h-[20%]" />
          <div className="race-kerb absolute inset-x-0 top-[19%] h-2" />
          <div className="race-kerb absolute inset-x-0 bottom-[19%] h-2" />
          <div className="race-lane-line absolute inset-x-0 top-1/2" />
          <div className="race-finish absolute inset-y-0 right-[7%] w-3 opacity-0" style={{ opacity: elapsed >= 28 ? 1 : 0 }} />

          <div className={`race-car race-car-boy ${boyWins ? 'race-car-winner' : 'race-car-chaser'}`} aria-label="Team Boy racing car">
            <span className="race-car-label text-sky-200">BOY</span>
            <span className="race-car-emoji">🏎️</span>
            <span className="race-car-glow bg-sky-400" />
          </div>
          <div className={`race-car race-car-girl ${!boyWins ? 'race-car-winner' : 'race-car-chaser'}`} aria-label="Team Girl racing car">
            <span className="race-car-label text-pink-200">GIRL</span>
            <span className="race-car-emoji">🏎️</span>
            <span className="race-car-glow bg-pink-400" />
          </div>

          <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 text-[9px] font-black tracking-widest text-white/50 sm:text-[10px]">
            <Flag className="h-3 w-3" /> CIRCUIT STRAIGHT
          </div>
          <div className="absolute bottom-3 right-4 z-20 font-mono text-[10px] font-bold text-white/50">DRS ZONE</div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 sm:mt-7">
          <div className={`flex items-center gap-2 text-xs font-black tracking-wider ${leader === 'boy' ? 'text-sky-300' : 'text-pink-300'}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
            TEAM {leader.toUpperCase()} CURRENTLY P1
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400">
            <Radio className="h-3.5 w-3.5 text-amber-300" />
            <span className="hidden sm:inline">RACE CONTROL</span>
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>DRS</span>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-white to-pink-400 transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="relative z-10 mx-auto mb-4 flex w-full max-w-6xl items-center justify-between px-4 text-[9px] font-bold tracking-[0.18em] text-slate-500 sm:px-8 sm:text-[10px]">
        <span>TEAM BOY RACING</span>
        <span>MADE FOR THE BIG REVEAL</span>
        <span>TEAM GIRL RACING</span>
      </div>
    </div>
  );
};
