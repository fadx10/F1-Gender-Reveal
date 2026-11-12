import React from 'react';
import { GenderRevealConfig } from '../types';
import { Play, Trophy, Volume2, VolumeX, Settings, Heart } from 'lucide-react';

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
    <div className="intro-screen relative h-[100dvh] min-h-0 w-full flex flex-col justify-between bg-gradient-to-b from-slate-950 via-[#070b14] to-slate-950 text-slate-100 overflow-hidden p-3 sm:p-5 lg:p-8">
      {/* Background Track Ambience & Floodlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-2 max-w-5xl mx-auto w-full pt-1">
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
      <main className="relative z-10 max-w-4xl mx-auto w-full flex-1 min-h-0 flex flex-col items-center justify-center text-center py-2 sm:py-3">
        {/* Recipient Dedication Tag */}
        <div className="flex items-center gap-2 max-w-full px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 mb-3 sm:mb-4 shadow-md">
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span className="text-[11px] sm:text-sm font-semibold text-slate-200">
            Dedicated with love to <strong className="text-white font-bold">{config.parentsNames || "Mom & Dad"}</strong>
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="font-display text-3xl min-[390px]:text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white max-w-3xl leading-[1.02] sm:leading-[1.08] text-balance mb-2 sm:mb-3">
          Gender Reveal <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-pink-400 drop-shadow-[0_4px_25px_rgba(255,255,255,0.2)]">
            Team Boy vs Team Girl
          </span>
        </h1>

        <p className="text-xs sm:text-sm md:text-lg text-slate-300 max-w-xl text-balance mb-3 sm:mb-5">
          The 5 red lights are ready to go out! Watch the 30-second Formula 1 Grand Prix to discover who takes the checkered flag and joins our family!
        </p>

        {/* 3D Formula 1 Teams Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-xl mb-4 sm:mb-6 perspective-1000">
          {/* Team Boy Racing 3D Card */}
          <div className="group relative p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-blue-950/90 border-2 border-blue-400/80 shadow-[0_20px_45px_rgba(2,132,199,0.35),_inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-2.5 hover:shadow-[0_30px_65px_rgba(2,132,199,0.55)] transition-all duration-300 flex flex-col items-center overflow-hidden">
            {/* 3D Glass Light Glare */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />

            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-b from-blue-500/40 to-blue-600/10 border-2 border-blue-300/80 flex items-center justify-center text-2xl sm:text-3xl shadow-[0_10px_25px_rgba(59,130,246,0.4)] mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              🏎️
              <span className="absolute -bottom-1 -right-1 text-xs">💙</span>
            </div>

            <div className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-md">
              TEAM BOY RACING
            </div>

          </div>

          {/* Team Girl Racing 3D Card */}
          <div className="group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-pink-900/90 via-slate-900/95 to-pink-950/90 border-2 border-pink-400/80 shadow-[0_20px_45px_rgba(236,72,153,0.35),_inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-2.5 hover:shadow-[0_30px_65px_rgba(236,72,153,0.55)] transition-all duration-300 flex flex-col items-center overflow-hidden">
            {/* 3D Glass Light Glare */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-pink-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />

            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-pink-500/40 to-pink-600/10 border-2 border-pink-300/80 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_10px_25px_rgba(236,72,153,0.4)] mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              🏎️
              <span className="absolute -bottom-1 -right-1 text-xs">💖</span>
            </div>

            <div className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-md">
              TEAM GIRL RACING
            </div>

          </div>
        </div>

        {/* Big Play / Start Race Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onStartPlay}
            className="group relative px-5 sm:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-base sm:text-xl shadow-[0_0_50px_rgba(225,29,72,0.5)] hover:shadow-[0_0_80px_rgba(225,29,72,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-900 ml-1 text-slate-900" />
            </div>
            <div className="text-left">
              <div className="leading-tight">START THE RACE</div>
              <div className="text-[9px] sm:text-[11px] font-semibold text-white/90 uppercase tracking-wider">
                5 Red Lights &amp; 30-Second GP
              </div>
            </div>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 max-w-5xl mx-auto w-full pt-1 pb-0 text-center text-[10px] sm:text-xs text-slate-500">
        <span>Made with love by Fahad</span>
      </footer>
    </div>
  );
};
