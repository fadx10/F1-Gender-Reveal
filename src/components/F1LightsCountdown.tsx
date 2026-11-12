import React, { useEffect, useState } from 'react';
import { f1Sound } from '../utils/audio';

interface F1LightsCountdownProps {
  onLightsOut: () => void;
}

export const F1LightsCountdown: React.FC<F1LightsCountdownProps> = ({ onLightsOut }) => {
  const [lightsActive, setLightsActive] = useState<number>(0); // 0 to 5
  const [lightsOut, setLightsOut] = useState<boolean>(false);

  useEffect(() => {
    // Sequentially turn on 5 lights
    const timers: NodeJS.Timeout[] = [];

    // Light 1
    timers.push(
      setTimeout(() => {
        setLightsActive(1);
        f1Sound.playGantryLightBeep();
      }, 700)
    );

    // Light 2
    timers.push(
      setTimeout(() => {
        setLightsActive(2);
        f1Sound.playGantryLightBeep();
      }, 1400)
    );

    // Light 3
    timers.push(
      setTimeout(() => {
        setLightsActive(3);
        f1Sound.playGantryLightBeep();
      }, 2100)
    );

    // Light 4
    timers.push(
      setTimeout(() => {
        setLightsActive(4);
        f1Sound.playGantryLightBeep();
      }, 2800)
    );

    // Light 5
    timers.push(
      setTimeout(() => {
        setLightsActive(5);
        f1Sound.playGantryLightBeep();
      }, 3500)
    );

    // LIGHTS OUT (random realistic suspense between 1.0s and 1.4s after 5th light)
    timers.push(
      setTimeout(() => {
        setLightsActive(0);
        setLightsOut(true);
        f1Sound.startEngine();
        f1Sound.playTireScreech();
      }, 4800)
    );

    // Transition to live race
    timers.push(
      setTimeout(() => {
        onLightsOut();
      }, 5700)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onLightsOut]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md select-none overflow-hidden p-6">
      {/* Background Circuit Floodlights */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-32 left-1/3 w-[600px] h-[400px] bg-red-600/20 blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* F1 Gantry Housing */}
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 sm:p-8 rounded-3xl border-2 border-neutral-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col items-center">
          <div className="text-[11px] sm:text-xs font-black tracking-widest text-neutral-400 uppercase mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            FIA STARTING GANTRY · FORMULA 1 GENDER REVEAL GP
          </div>

          {/* 5 Gantry Columns */}
          <div className="grid grid-cols-5 gap-3 sm:gap-6 bg-black/90 p-4 sm:p-6 rounded-2xl border border-neutral-800">
            {[1, 2, 3, 4, 5].map((col) => {
              const isOn = lightsActive >= col && !lightsOut;
              return (
                <div key={col} className="flex flex-col items-center gap-2">
                  {/* Top Red Light (The active F1 start light) */}
                  <div
                    className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full transition-all duration-100 flex items-center justify-center ${
                      isOn
                        ? 'bg-red-600 shadow-[0_0_35px_#dc2626] border-2 border-red-300'
                        : 'bg-neutral-900 border-2 border-neutral-800 opacity-40'
                    }`}
                  >
                    {isOn && <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-red-400/80 blur-xs" />}
                  </div>

                  {/* Secondary unlit lights */}
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-neutral-950 border border-neutral-800 opacity-30" />
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-neutral-950 border border-neutral-800 opacity-30" />
                </div>
              );
            })}
          </div>

          {/* Status Text Underneath */}
          <div className="mt-6 text-center">
            {lightsOut ? (
              <div className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-amber-400 animate-bounce drop-shadow-[0_0_35px_rgba(52,211,153,0.8)]">
                LIGHTS OUT AND AWAY WE GO! 🏎️💨
              </div>
            ) : (
              <div className="font-display text-base sm:text-xl font-bold tracking-widest text-slate-300 uppercase">
                {lightsActive === 0 ? "Drivers on the Starting Grid..." : "Get Ready For The Start..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
