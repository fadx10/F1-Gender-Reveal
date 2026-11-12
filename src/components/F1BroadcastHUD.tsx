import React from 'react';
import { RaceTelemetry, RaceRadioMessage } from '../types';
import { Volume2, VolumeX, Flag, Zap, Radio } from 'lucide-react';

interface F1BroadcastHUDProps {
  telemetry: RaceTelemetry | null;
  radioMessage: RaceRadioMessage | null;
  elapsedSeconds: number;
  circuitName: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const F1BroadcastHUD: React.FC<F1BroadcastHUDProps> = ({
  telemetry,
  radioMessage,
  elapsedSeconds,
  circuitName,
  isMuted,
  onToggleMute,
}) => {
  const p1 = telemetry?.p1 || 'boy';
  const p2 = telemetry?.p2 || 'girl';
  const gap = telemetry?.gapSeconds || 0.35;
  const lapDisplay = telemetry?.lap ? `LAP ${telemetry.lap}/3` : 'LAP 1/3';
  const speed = p1 === 'boy' ? telemetry?.boySpeed || 312 : telemetry?.girlSpeed || 312;

  const formattedSec = Math.min(30, Math.floor(elapsedSeconds));

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-30 p-3 sm:p-5 flex flex-col justify-between">
      {/* Top Bar with F1 Timing Tower and Status */}
      <div className="flex items-start justify-between gap-3 max-w-6xl mx-auto w-full">
        {/* Left: Official F1 Timing Tower */}
        <div className="flex flex-col bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden min-w-[220px] sm:min-w-[270px]">
          {/* Header */}
          <div className="bg-red-600 px-3 py-1 flex items-center justify-between text-white font-black tracking-wider text-[11px] uppercase">
            <div className="flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              <span>F1 REVEAL GP</span>
            </div>
            <span className="font-mono text-[10px] tracking-normal">{lapDisplay}</span>
          </div>

          {/* P1 Leader Row */}
          <div
            className={`flex items-center justify-between px-3 py-2 border-b border-slate-800 ${
              p1 === 'boy'
                ? 'bg-blue-950/60 text-blue-200'
                : 'bg-pink-950/60 text-pink-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
                1
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-current" />
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase">
                {p1 === 'boy' ? 'TEAM BOY RACING' : 'TEAM GIRL RACING'}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              INTERVAL
            </span>
          </div>

          {/* P2 Chaser Row */}
          <div
            className={`flex items-center justify-between px-3 py-2 ${
              p2 === 'boy'
                ? 'bg-blue-950/40 text-blue-200'
                : 'bg-pink-950/40 text-pink-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-slate-400 text-xs sm:text-sm">
                2
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-current" />
              <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-200 uppercase">
                {p2 === 'boy' ? 'TEAM BOY RACING' : 'TEAM GIRL RACING'}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-amber-400">
              +{gap.toFixed(3)}s
            </span>
          </div>
        </div>

        {/* Center: Live Speed & DRS Telemetry Bug */}
        <div className="hidden md:flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/80 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              SPEED TRAP
            </span>
            <span className="font-mono text-xl font-black text-white tabular-nums">
              {speed} <span className="text-xs text-slate-400">KM/H</span>
            </span>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* DRS Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-xs">
            <Zap className="w-3.5 h-3.5 fill-emerald-300" />
            <span>DRS ACTIVE</span>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* 30s Race Clock */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              RACE CLOCK
            </span>
            <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
              00:{formattedSec.toString().padStart(2, '0')} / 00:30
            </span>
          </div>
        </div>

        {/* Right: Sound & Track Details */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleMute}
            className="p-2 sm:px-3 sm:py-2 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Engine Sound</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lower Third: Team Radio / Commentator Banner */}
      {radioMessage && (
        <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto pointer-events-auto animate-slide-up">
          <div className="bg-slate-950/95 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-700/90 shadow-2xl flex items-center gap-3">
            <div
              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                radioMessage.type === 'radio'
                  ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300'
                  : radioMessage.type === 'overtake'
                  ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300'
                  : 'bg-red-500/20 border border-red-400/60 text-red-300'
              }`}
            >
              {radioMessage.type === 'radio' ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : (
                <Flag className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                <span className="text-amber-400">
                  {radioMessage.type === 'radio' ? 'TEAM RADIO TRANSMISSION' : 'RACE CONTROL'}
                </span>
                <span>·</span>
                <span>{radioMessage.lap}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 font-semibold truncate">
                {radioMessage.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
