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
          Gender Reveal <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-pink-400 drop-shadow-[0_4px_25px_rgba(255,255,255,0.2)]">
            Team Boy vs Team Girl
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-xl text-balance mb-8">
          The 5 red lights are ready to go out! Watch the 30-second Formula 1 Grand Prix to discover who takes the checkered flag and joins our family!
        </p>

        {/* 3D Formula 1 Teams Cards Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-xl mb-10 perspective-1000">
          {/* Team Boy Racing 3D Card */}
          <div className="group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-blue-950/90 border-2 border-blue-400/80 shadow-[0_20px_45px_rgba(2,132,199,0.35),_inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-2.5 hover:shadow-[0_30px_65px_rgba(2,132,199,0.55)] transition-all duration-300 flex flex-col items-center overflow-hidden">
            {/* 3D Glass Light Glare */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />

            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-blue-500/40 to-blue-600/10 border-2 border-blue-300/80 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_10px_25px_rgba(59,130,246,0.4)] mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              🏎️
              <span className="absolute -bottom-1 -right-1 text-xs">💙</span>
            </div>

            <div className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-md">
              TEAM BOY RACING
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-blue-200 mt-1">
              Car #1
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
            <div className="text-[11px] sm:text-xs font-semibold text-pink-200 mt-1">
              Car #1
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
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full pb-2 text-center text-xs text-slate-500">
        <span>Made with love by Fahad</span>
      </footer>
    </div>
  );
};
