import React,{useEffect,useRef,useState} from 'react';
import {Flag,Gauge,Radio,Zap} from 'lucide-react';
import {GenderWinner,RaceTelemetry,RaceRadioMessage} from '../types';
import {f1Sound} from '../utils/audio';
interface F1RaceTrackProps {winner:GenderWinner;onTelemetryUpdate:(telemetry:RaceTelemetry,elapsedSeconds:number)=>void;onRadioMessage:(msg:RaceRadioMessage)=>void;onRaceFinish:()=>void;}
const DURATION=30;
const RaceCar=({team,winner}:{team:GenderWinner;winner:GenderWinner})=>{
 const boy=team==='boy';const winning=team===winner;
 return <div className={'race-machine race-machine--'+team+' '+(winning?'race-machine--winner':'race-machine--chaser')} aria-label={'Team '+team+' car'}>
 <div className="race-machine__tag">{boy?'BOY RACING':'GIRL RACING'} <span>{boy?'#01':'#02'}</span></div>
 <svg className="race-machine__svg" viewBox="0 0 210 94" role="img" aria-label={boy?'Blue Formula racing car':'Pink Formula racing car'}>
 <g fill="#05080e"><rect x="29" y="5" width="29" height="23" rx="7"/><rect x="29" y="66" width="29" height="23" rx="7"/><rect x="151" y="5" width="29" height="23" rx="7"/><rect x="151" y="66" width="29" height="23" rx="7"/></g>
 <g fill="#64748b"><rect x="35" y="9" width="16" height="15" rx="4"/><rect x="35" y="70" width="16" height="15" rx="4"/><rect x="157" y="9" width="16" height="15" rx="4"/><rect x="157" y="70" width="16" height="15" rx="4"/></g>
 <path d="M8 37h27l18-9 26-5 15 5h26l22-5 26 5 16 9h18v20h-18l-16 9-26 5-22-5h-26l-15 5-26-5-18-9H8z" fill={boy?'#0284c7':'#db2777'} stroke={boy?'#bae6fd':'#fce7f3'} strokeWidth="1.5"/>
 <path d="M80 29l13-14h29l13 14-15 7H95z" fill="#0b1724" stroke="#cbd5e1" strokeOpacity=".65" strokeWidth="2"/><path d="M93 17h28l7 9H85z" fill={boy?'#38bdf8':'#f472b6'}/><path d="M48 47h118" stroke="#fff" strokeOpacity=".75" strokeWidth="2"/><path d="M171 38l22 4v10l-22 4z" fill="#f8fafc"/><path d="M18 43h13v8H18z" fill="#fbbf24"/></svg>
 <div className={'race-machine__glow race-machine__glow--'+team}/><div className="race-machine__speedline"/>
 </div>;
};
export const F1RaceTrack:React.FC<F1RaceTrackProps>=({winner,onTelemetryUpdate,onRadioMessage,onRaceFinish})=>{
 const [elapsed,setElapsed]=useState(0);const callbacks=useRef({onTelemetryUpdate,onRadioMessage,onRaceFinish});callbacks.current={onTelemetryUpdate,onRadioMessage,onRaceFinish};
 useEffect(()=>{
 const start=performance.now();const challenger:GenderWinner=winner==='boy'?'girl':'boy';let frame=0;let finishTimer=0;let lastUi=-1;let lastTelemetry=-1;let finished=false;
 const milestones:Array<[number,string,string,RaceRadioMessage['type'],GenderWinner?]>=[
 [3,'turn1','Team '+(challenger==='boy'?'Boy':'Girl')+' gets the launch! A bold move into Turn 1.','overtake',challenger],
 [9,'radio_chase','TEAM RADIO: DRS is open. Battery deployed. Make the pass!','radio',winner],
 [15,'chicane_pass','WHAT A MOVE! Team '+(winner==='boy'?'Boy':'Girl')+' takes the lead under braking!','overtake',winner],
 [22,'finallap','FINAL LAP! They are side by side with the finish line in sight.','flag'],
 [27,'slingshot','Final push! Team '+(winner==='boy'?'Boy':'Girl')+' is pulling clear!','commentator',winner]];
 const fired=new Set<string>();
 const send=(id:string,second:number,text:string,type:RaceRadioMessage['type'],team?:GenderWinner)=>callbacks.current.onRadioMessage({id,second,lap:second>=20?'FINAL LAP':second>=10?'LAP 2/3':'LAP 1/3',text,type,team});
 f1Sound.startEngine();send('lightsout',0,'LIGHTS OUT AND AWAY WE GO! Both teams launch from the grid!','commentator');
 const animate=(now:number)=>{
 const seconds=Math.min(DURATION,(now-start)/1000);
 if(seconds-lastUi>=.05||seconds>=DURATION){setElapsed(seconds);lastUi=seconds;}
 if(seconds-lastTelemetry>=.1||seconds>=DURATION){
 const leader:GenderWinner=seconds<15?challenger:winner;const fast=Math.round(322+Math.sin(seconds*1.7)*14);const chase=Math.round(316+Math.cos(seconds*1.3)*11);
 callbacks.current.onTelemetryUpdate({p1:leader,p2:leader==='boy'?'girl':'boy',gapSeconds:Number((seconds<15?.31-seconds*.012:Math.max(.08,.15-(seconds-15)*.004)).toFixed(3)),lap:Math.min(3,Math.floor(seconds/10)+1),totalLaps:3,boySpeed:leader==='boy'?fast:chase,girlSpeed:leader==='girl'?fast:chase,boyDrs:winner==='boy'&&((seconds>=9&&seconds<15)||seconds>=27),girlDrs:winner==='girl'&&((seconds>=9&&seconds<15)||seconds>=27),sector:(Math.floor((seconds%10)/(10/3))+1) as 1|2|3},seconds);
 f1Sound.setEngineRpm(.45+fast/700);lastTelemetry=seconds;}
 milestones.forEach(([at,id,message,type,team])=>{if(seconds>=at&&!fired.has(id)){fired.add(id);if(type==='radio'){f1Sound.playTeamRadio();f1Sound.playDrsChime();}else if(type==='overtake'){f1Sound.playTireScreech();f1Sound.playKerbBuzz();}else if(type==='flag')f1Sound.playTeamRadio();else f1Sound.playDrsChime();send(id,at,message,type,team);}});
 if(seconds>=DURATION&&!finished){finished=true;f1Sound.stopEngine();f1Sound.playCheckeredFlag();f1Sound.playPodiumFanfare();send('finish',30,'CHECKERED FLAG! TEAM '+winner.toUpperCase()+' WINS THE GRAND PRIX!','finish',winner);finishTimer=window.setTimeout(()=>callbacks.current.onRaceFinish(),1200);return;}
 frame=requestAnimationFrame(animate);};
 frame=requestAnimationFrame(animate);return()=>{cancelAnimationFrame(frame);if(finishTimer)window.clearTimeout(finishTimer);f1Sound.stopEngine();};
 },[winner]);
 const progress=Math.min(100,elapsed/30*100);const leader=elapsed<15?(winner==='boy'?'girl':'boy'):winner;
 return <main className="race-v2 absolute inset-0 z-0 flex flex-col justify-center overflow-hidden text-white"><div className="race-v2__ambient"/>
 <div className="relative z-10 mx-auto mb-5 mt-24 flex w-full max-w-6xl items-end justify-between px-4 sm:mb-7 sm:px-8"><div><div className="eyebrow text-red-300">THE REVEAL GRAND PRIX · LIVE</div><h1 className="mt-1 font-display text-2xl font-black sm:text-4xl">Battle for P1</h1></div><div className="race-clock"><span>RACE TIME</span><strong>00:{Math.floor(elapsed).toString().padStart(2,'0')}<small> / 00:30</small></strong></div></div>
 <section className="race-track-v2 relative mx-auto w-full max-w-6xl overflow-hidden" aria-label="Live race track"><div className="race-track-v2__grandstand"><span>THE REVEAL CIRCUIT</span><span>SECTOR {Math.min(3,Math.floor((elapsed%10)/(10/3))+1)}</span></div><div className="race-track-v2__surface"><div className="race-track-v2__kerb race-track-v2__kerb--top"/><div className="race-track-v2__kerb race-track-v2__kerb--bottom"/><div className="race-track-v2__lane race-track-v2__lane--one"/><div className="race-track-v2__lane race-track-v2__lane--two"/><div className="race-track-v2__start-line"/><div className={'race-track-v2__finish-line '+(elapsed>=27?'is-visible':'')}/><RaceCar team="boy" winner={winner}/><RaceCar team="girl" winner={winner}/><div className="race-track-v2__track-label">DRS DETECTION ZONE <Zap size={13}/></div></div><div className="race-track-v2__grandstand race-track-v2__grandstand--bottom"><span>TEAM BOY RACING</span><span>TEAM GIRL RACING</span></div></section>
 <div className="relative z-10 mx-auto mt-5 flex w-full max-w-6xl items-center justify-between px-4 sm:px-8"><div className={'race-leader race-leader--'+leader}><i/> TEAM {leader.toUpperCase()} <b>RUNNING P1</b></div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500"><Gauge size={14}/> {Math.round(322+Math.sin(elapsed*1.7)*14)} KM/H <Radio size={14} className="ml-2 text-red-400"/> LIVE</div></div>
 <div className="race-progress mx-auto mt-5 w-[calc(100%-2rem)] max-w-6xl"><span style={{width:progress+'%'}}/></div><div className="relative z-10 mx-auto mt-3 flex w-full max-w-6xl justify-between px-4 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600 sm:px-8"><span>LIGHTS OUT</span><span>3 LAPS · 30 SECONDS</span><span>CHEQUERED FLAG</span></div></main>;
};
