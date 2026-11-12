import React, {useEffect,useState} from 'react';
import {f1Sound} from '../utils/audio';
interface F1LightsCountdownProps {onLightsOut:()=>void;}
export const F1LightsCountdown:React.FC<F1LightsCountdownProps>=({onLightsOut})=>{
 const [lightsActive,setLightsActive]=useState(0); const [lightsOut,setLightsOut]=useState(false);
 useEffect(()=>{const timers:number[]=[];for(let n=1;n<=5;n++){timers.push(window.setTimeout(()=>{setLightsActive(n);f1Sound.playGantryLightBeep();},450+n*650));}
 timers.push(window.setTimeout(()=>{setLightsActive(0);setLightsOut(true);f1Sound.startEngine();f1Sound.playTireScreech();},4750));
 timers.push(window.setTimeout(onLightsOut,5550));return()=>timers.forEach(window.clearTimeout);},[onLightsOut]);
 return <main className="start-screen fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 text-white"><div className="start-screen__glow"/><div className="relative z-10 w-full max-w-3xl text-center">
 <div className="mb-5 text-[10px] font-black uppercase tracking-[.35em] text-red-300 sm:text-xs">FIA START PROCEDURE</div><h1 className="font-display text-3xl font-black uppercase tracking-tight sm:text-5xl">Drivers, start your engines</h1><p className="mt-3 text-xs text-slate-400 sm:text-sm">The Reveal Grand Prix · Starting grid</p>
 <div className="gantry-shell mx-auto mt-10 max-w-2xl"><div className="gantry-heading"><span>START</span><span>LIGHTS</span><span>FIA · GP</span></div><div className="gantry-lights">{[1,2,3,4,5].map(n=><div className="gantry-column" key={n}><span className={'gantry-lamp '+(lightsActive>=n&&!lightsOut?'is-lit':'')}/><span className="gantry-lamp gantry-lamp--dim"/></div>)}</div><div className="gantry-base"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span></div></div>
 <div className={'start-status '+(lightsOut?'start-status--go':'')}>{lightsOut?<><strong>LIGHTS OUT!</strong><span>AND AWAY WE GO</span></>:<><strong>{lightsActive===0?'HOLD POSITION':'WAIT FOR IT'}</strong><span>{lightsActive} OF 5 LIGHTS</span></>}</div><div className="mt-7 flex justify-center gap-2">{[1,2,3,4,5].map(n=><span key={n} className={'start-progress-dot '+(lightsActive>=n&&!lightsOut?'active':'')+(lightsOut?' go':'')}/>)}</div>
 </div></main>;
};
