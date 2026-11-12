/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GameStage, GenderRevealConfig, GenderWinner, RaceTelemetry, RaceRadioMessage } from './types';
import { F1RaceTrack } from './components/F1RaceTrack';
import { F1BroadcastHUD } from './components/F1BroadcastHUD';
import { F1LightsCountdown } from './components/F1LightsCountdown';
import { IntroScreen } from './components/IntroScreen';
import { RevealCelebration } from './components/RevealCelebration';
import { OrganizerModal } from './components/OrganizerModal';
import { f1Sound } from './utils/audio';

const STORAGE_KEY = 'gender_reveal_f1_config_v1';

export default function App() {
  const [stage, setStage] = useState<GameStage>('INTRO');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState<boolean>(false);

  // Live race state
  const [telemetry, setTelemetry] = useState<RaceTelemetry | null>(null);
  const [radioMessage, setRadioMessage] = useState<RaceRadioMessage | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Config setup
  const [config, setConfig] = useState<GenderRevealConfig>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let hashParams = new URLSearchParams();
    if (window.location.hash.includes('?')) {
      hashParams = new URLSearchParams(window.location.hash.slice(window.location.hash.indexOf('?') + 1));
    }
    const getParam = (key: string) => searchParams.get(key) || hashParams.get(key);

    const urlWinnerParam = getParam('winner') || getParam('gender') || getParam('reveal') || getParam('team');
    const urlParentsParam = getParam('parents') || getParam('to') || getParam('name');
    const urlDueParam = getParam('due') || getParam('date');
    const urlMessageParam = getParam('message');

    let savedConfig: Partial<GenderRevealConfig> = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedConfig = JSON.parse(saved) as Partial<GenderRevealConfig>;
    } catch {
      // Use defaults if saved settings are unavailable or invalid.
    }

    const initialWinner: GenderWinner = urlWinnerParam
      ? (urlWinnerParam.toLowerCase().startsWith('g') ? 'girl' : 'boy')
      : savedConfig.winner === 'girl' ? 'girl' : 'boy';

    return {
      winner: initialWinner,
      parentsNames: urlParentsParam || savedConfig.parentsNames || 'Mom & Dad',
      babyDueDate: urlDueParam || savedConfig.babyDueDate || 'Coming Soon',
      customMessage: urlMessageParam || savedConfig.customMessage || '',
      circuitName: savedConfig.circuitName || 'The Reveal Grand Prix Circuit',
    };
  });

  const handleSaveConfig = (newConfig: GenderRevealConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // Ignore
    }
  };

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    f1Sound.setMuted(nextMuted);
  }, [isMuted]);

  const handleStartPlay = () => {
    f1Sound.setMuted(isMuted);
    setTelemetry(null);
    setRadioMessage(null);
    setElapsedSeconds(0);
    setStage('LIGHTS_OUT');
  };

  const handleLightsOut = () => {
    setStage('RACE');
  };

  const handleRaceFinish = () => {
    setStage('REVEAL');
  };

  const handleReplay = () => {
    setTelemetry(null);
    setRadioMessage(null);
    setElapsedSeconds(0);
    setStage('LIGHTS_OUT');
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center overflow-x-hidden">
      {/* 1. INTRO SCREEN */}
      {stage === 'INTRO' && (
        <IntroScreen
          config={config}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartPlay={handleStartPlay}
          onOpenOrganizer={() => setIsOrganizerOpen(true)}
        />
      )}

      {/* 2. 5 RED LIGHTS STARTING GANTRY */}
      {stage === 'LIGHTS_OUT' && (
        <F1LightsCountdown onLightsOut={handleLightsOut} />
      )}

      {/* 3. 30-SECOND SIMULATED F1 GRAND PRIX */}
      {stage === 'RACE' && (
        <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex flex-col justify-center items-center">
          <F1BroadcastHUD
            telemetry={telemetry}
            radioMessage={radioMessage}
            elapsedSeconds={elapsedSeconds}
            circuitName={config.circuitName}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />

          <F1RaceTrack
            winner={config.winner}
            onTelemetryUpdate={(t, elapsed) => {
              setTelemetry(t);
              setElapsedSeconds(Math.min(30, elapsed));
            }}
            onRadioMessage={(m) => setRadioMessage(m)}
            onRaceFinish={handleRaceFinish}
          />
        </div>
      )}

      {/* 4. THE GRAND REVEAL PODIUM CELEBRATION */}
      {stage === 'REVEAL' && (
        <RevealCelebration
          config={config}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onReplay={handleReplay}
        />
      )}

      {/* ORGANIZER / SETUP MODAL */}
      <OrganizerModal
        isOpen={isOrganizerOpen}
        onClose={() => setIsOrganizerOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onTestPlay={handleStartPlay}
      />
    </div>
  );
}
