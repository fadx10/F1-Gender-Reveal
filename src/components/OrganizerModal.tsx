import React, { useState } from 'react';
import { GenderRevealConfig, GenderWinner } from '../types';
import { X, Check, Copy, Sparkles, Trophy, Flag } from 'lucide-react';

interface OrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GenderRevealConfig;
  onSaveConfig: (newConfig: GenderRevealConfig) => void;
  onTestPlay: () => void;
}

export const OrganizerModal: React.FC<OrganizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestPlay,
}) => {
  const [winner, setWinner] = useState<GenderWinner>(config.winner);
  const [parentsNames, setParentsNames] = useState<string>(config.parentsNames);
  const [babyDueDate, setBabyDueDate] = useState<string>(config.babyDueDate);
  const [customMessage, setCustomMessage] = useState<string>(config.customMessage);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const shareUrl = `${origin}${pathname}?winner=${winner}&parents=${encodeURIComponent(parentsNames || 'Mom & Dad')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    const updated: GenderRevealConfig = {
      ...config,
      winner,
      parentsNames,
      babyDueDate,
      customMessage,
    };
    onSaveConfig(updated);
    onClose();
  };

  const handleSaveAndTest = () => {
    const updated: GenderRevealConfig = {
      ...config,
      winner,
      parentsNames,
      babyDueDate,
      customMessage,
    };
    onSaveConfig(updated);
    onClose();
    onTestPlay();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Race Director Setup &amp; Winner Selection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Select which Formula 1 car takes P1 and the checkered flag to reveal the baby&apos;s gender to your parents!
        </p>

        <div className="space-y-5 mt-5">
          {/* WINNER SELECTOR */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select P1 Grand Prix Winner (The Big Reveal)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWinner('boy')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  winner === 'boy'
                    ? 'bg-blue-950/80 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-3xl">🏎️💙</div>
                <div className="text-sm font-extrabold tracking-wide text-blue-300">
                  TEAM BOY WINS
                </div>
                <div className="text-[11px] text-slate-400">Takes P1 at checkered flag</div>
              </button>

              <button
                type="button"
                onClick={() => setWinner('girl')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  winner === 'girl'
                    ? 'bg-pink-950/80 border-pink-400 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-3xl">🏎️💖</div>
                <div className="text-sm font-extrabold tracking-wide text-pink-300">
                  TEAM GIRL WINS
                </div>
                <div className="text-[11px] text-slate-400">Takes P1 at checkered flag</div>
              </button>
            </div>
          </div>

          {/* PARENTS / RECIPIENT NAMES */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Parents / Grandparents Dedication
            </label>
            <input
              type="text"
              value={parentsNames}
              onChange={(e) => setParentsNames(e.target.value)}
              placeholder="e.g. Mom & Dad / Grandma & Grandpa"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          {/* DUE DATE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Expected Arrival (Month / Season)
            </label>
            <input
              type="text"
              value={babyDueDate}
              onChange={(e) => setBabyDueDate(e.target.value)}
              placeholder="e.g. November 2026"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          {/* SHARE LINK BOX */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Direct Link for Parents
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Winner: {winner === 'boy' ? 'Boy 💙' : 'Girl 💖'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={handleSaveAndTest}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:opacity-90 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Test Race Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
