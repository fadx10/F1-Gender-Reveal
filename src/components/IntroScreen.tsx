import React from 'react';
import { GenderRevealConfig } from '../types';
import { ArrowUpRight, Volume2, VolumeX, Settings, Flag, Heart, Play, Trophy } from 'lucide-react';
interface IntroScreenProps { config: GenderRevealConfig; isMuted: boolean; onToggleMute: () => void; onStartPlay: () => void; onOpenOrganizer: () => void; }
export const IntroScreen: React.FC<IntroScreenProps> = ({config,isMuted,onToggleMute,onStartPlay,onOpenOrganizer}) => (
<div className="intro-v2 relative min-h-[100dvh] w-full overflow-hidden text-white">
  <div className="intro-v2__grid"/><div className="intro-v2__glow intro-v2__glow--blue"/><div className="intro-v2__glow intro-v2__glow--pink"/>
  <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8 lg:px-12">
    <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-sm font-black">GP</div><div><div className="text-[10px] font-black uppercase tracking-[.28em] text-slate-400">The family grand prix</div><div className="text-sm font-extrabold">THE REVEAL RACE</div></div></div>
    <div className="flex items-center gap-2"><button onClick={onToggleMute} aria-label="Toggle sound" className="intro-icon-button">{isMuted?<VolumeX size={17}/>:<Volume2 size={17}/>}</button><button onClick={onOpenOrganizer} className="intro-settings-button"><Settings size={16}/><span>Race setup</span></button></div>
  </header>
  <main className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-10 pt-6 sm:px-8 lg:min-h-[calc(100dvh-90px)] lg:grid-cols-2 lg:gap-14 lg:px-12">
    <section className="max-w-2xl">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-3 py-2 text-[10px] font-bold uppercase tracking-[.22em] text-slate-300"><i className="h-2 w-2 rounded-full bg-red-500"/> A once-in-a-lifetime finish line</div>
      <h1 className="font-display text-[clamp(3rem,8vw,6.8rem)] font-black leading-[.91] tracking-[-.065em]">TWO TEAMS.<br/><span className="intro-title-gradient">ONE BIG</span><br/>REVEAL.</h1>
      <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">The engines are warming up. Team Boy and Team Girl are heading to the grid. Watch the lights, feel the race, and find out who takes P1.</p>
      <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-slate-400"><span className="inline-flex items-center gap-2"><Flag size={14} className="text-red-400"/> 5-light start</span><i className="h-1 w-1 rounded-full bg-slate-600"/><span>30-second showdown</span><i className="h-1 w-1 rounded-full bg-slate-600"/><span>Grand reveal finale</span></div>
      <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><button onClick={onStartPlay} className="intro-start-button group"><span className="intro-start-button__icon"><Play size={19} fill="currentColor"/></span><span className="text-left"><strong>START THE RACE</strong><small>Lights out in 5 seconds</small></span><ArrowUpRight className="ml-4" size={19}/></button><div className="flex items-center gap-2 text-xs text-slate-400"><Heart size={14} className="fill-rose-400 text-rose-400"/> Dedicated to <strong className="text-white">{config.parentsNames || 'Mom & Dad'}</strong></div></div>
    </section>
    <section className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="intro-race-card"><div className="intro-race-card__top"><div><span className="eyebrow">THE STARTING GRID</span><h2>Choose your side.</h2></div><span className="intro-live"><i/> READY</span></div>
        <div className="team-panel team-panel--boy"><div className="team-panel__meta"><span>01 / BLUE GARAGE</span><span>TEAM BOY</span></div><svg viewBox="0 0 220 88" role="img" aria-label="Blue Formula racing car" className="team-car team-car--blue"><path d="M8 42h25l18-13 42-5 24 7 30-1 20 8h42v12h-42l-20 8-31-1-25 8-40-4-18-12H8z" fill="currentColor"/><path d="M91 29l16-13h26l12 15-25 2z" fill="#dbeafe"/><path d="M5 35h38v7H5zm172-5h36v7h-36zM5 52h38v7H5zm172 4h36v7h-36z" fill="#0b1220"/><path d="M42 43h136" stroke="#e0f2fe" strokeWidth="3"/><circle cx="54" cy="64" r="12" fill="#070b13"/><circle cx="174" cy="64" r="12" fill="#070b13"/></svg><div className="team-panel__bottom"><strong>TEAM BOY RACING</strong><span>CAR 01 <b>●</b></span></div></div>
        <div className="team-panel team-panel--girl"><div className="team-panel__meta"><span>02 / PINK GARAGE</span><span>TEAM GIRL</span></div><svg viewBox="0 0 220 88" role="img" aria-label="Pink Formula racing car" className="team-car team-car--pink"><path d="M8 42h25l18-13 42-5 24 7 30-1 20 8h42v12h-42l-20 8-31-1-25 8-40-4-18-12H8z" fill="currentColor"/><path d="M91 29l16-13h26l12 15-25 2z" fill="#fce7f3"/><path d="M5 35h38v7H5zm172-5h36v7h-36zM5 52h38v7H5zm172 4h36v7h-36z" fill="#0b1220"/><path d="M42 43h136" stroke="#fce7f3" strokeWidth="3"/><circle cx="54" cy="64" r="12" fill="#070b13"/><circle cx="174" cy="64" r="12" fill="#070b13"/></svg><div className="team-panel__bottom"><strong>TEAM GIRL RACING</strong><span>CAR 02 <b>●</b></span></div></div>
        <div className="intro-race-card__footer"><Trophy size={15}/><span>Only one team will cross the line first.</span><span className="intro-race-card__lights"><i/><i/><i/><i/><i/></span></div>
      </div><div className="intro-card-caption">THE REVEAL GRAND PRIX <span>·</span> SEASON 01</div>
    </section>
  </main>
  <footer className="relative z-10 mx-auto flex max-w-7xl justify-between px-4 pb-5 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-600 sm:px-8 lg:px-12"><span>Built for the moment that matters</span><span>Lights · Speed · Surprise</span></footer>
</div>);
