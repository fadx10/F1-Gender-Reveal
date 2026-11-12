import React from 'react';
import { GenderRevealConfig } from '../types';
import { Play, Trophy, Volume2, VolumeX, Settings, Heart, Zap, Flag } from 'lucide-react';

interface IntroScreenProps {
  config: GenderRevealConfig;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartPlay: () => void;
  onOpenOrganizer: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  config,
  isMuted,
  onToggleMute,
  onStartPlay,
  onOpenOrganizer,
}) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-slate-950 via-[#070b14] to-slate-950 text-slate-100 overflow-x-hidden p-4 sm:p-8">
      {/* Background Track Ambience & Floodlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-lg">
            F1
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase">
              GRAND PRIX OF A LIFETIME
            </div>
            <div className="text-sm font-bold text-white tracking-tight">
              Formula 1 Gender Reveal GP
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? "Unmute" : "Sound On"}</span>
          </button>

          <button
            onClick={onOpenOrganizer}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Organizer Settings & Link Generator"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Organizer Setup</span>
          </button>
        </div>
      </header>

      {/* Main Hero Showcase */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto py-8 flex flex-col items-center text-center">
        {/* Recipient Dedication Tag */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 mb-6 shadow-md">
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span className="text-xs sm:text-sm font-semibold text-slate-200">
            Dedicated with love to <strong className="text-white font-bold">{config.parentsNames || "Mom & Dad"}</strong>
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-3xl leading-[1.08] text-balance mb-4">
          Lights Out Showdown: <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-pink-400 drop-shadow-[0_4px_25px_rgba(255,255,255,0.2)]">
            Team Boy vs Team Girl
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-xl text-balance mb-8">
          The 5 red lights are ready to go out! Watch the 30-second Formula 1 Grand Prix to discover who takes the checkered flag and joins our family!
        </p>

        {/* F1 Teams Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-xl mb-10">
          {/* Team Boy Racing Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-blue-950/70 via-slate-900/90 to-blue-950/40 border border-blue-500/40 shadow-xl flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/20 border-2 border-blue-400/60 flex items-center justify-center text-2xl sm:text-3xl shadow-inner mb-3">
              🏎️💙
            </div>
            <div className="text-sm sm:text-base font-extrabold text-blue-300 tracking-tight">
              TEAM BOY RACING
            </div>
            <div className="text-[11px] sm:text-xs text-blue-200/70 mt-0.5">
              Blue Thunderbolt GP · No. 1
            </div>
            <div className="mt-2 text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>1050 HP Turbo-Hybrid</span>
            </div>
          </div>

          {/* Team Girl Racing Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-pink-950/70 via-slate-900/90 to-pink-950/40 border border-pink-500/40 shadow-xl flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-pink-500/20 border-2 border-pink-400/60 flex items-center justify-center text-2xl sm:text-3xl shadow-inner mb-3">
              🏎️💖
            </div>
            <div className="text-sm sm:text-base font-extrabold text-pink-300 tracking-tight">
              TEAM GIRL RACING
            </div>
            <div className="text-[11px] sm:text-xs text-pink-200/70 mt-0.5">
              Pink Velocity GP · No. 1
            </div>
            <div className="mt-2 text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>1050 HP Turbo-Hybrid</span>
            </div>
          </div>
        </div>

        {/* Big Play / Start Race Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onStartPlay}
            className="group relative px-8 sm:px-12 py-5 sm:py-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-lg sm:text-2xl shadow-[0_0_50px_rgba(225,29,72,0.5)] hover:shadow-[0_0_80px_rgba(225,29,72,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-900 ml-1 text-slate-900" />
            </div>
            <div className="text-left">
              <div className="leading-tight">START THE RACE</div>
              <div className="text-[11px] sm:text-xs font-semibold text-white/90 uppercase tracking-wider">
                5 Red Lights &amp; 30-Second GP
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <Flag className="w-3.5 h-3.5 text-amber-400" />
            <span>Turn volume up for F1 engine revs, tire squeals, and team radio</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full pb-2 text-center text-xs text-slate-500">
        <span>The Reveal Grand Prix · Special 30-Second Simulated Formula 1 Broadcast</span>
      </footer>
    </div>
  );
};
