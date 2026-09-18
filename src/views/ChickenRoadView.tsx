import React, { useState } from 'react';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { User } from '../types';
import { playWinningFanfare } from '../utils/audio';
import {
  checkChickenRoadCollision,
  getHouseProfitSettings,
} from '../utils/houseProfitEngine';

interface ChickenRoadViewProps {
  currentUser?: User | null;
  onUpdateUserBalance?: (debitOrCredit: {
    type: 'debit' | 'credit';
    amount: number;
    description: string;
    category?: 'bet' | 'winning';
  }) => Promise<boolean> | boolean;
  onNavigate: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

const LANES = [
  { level: 1, multiplier: 1.25, danger: 0.15 },
  { level: 2, multiplier: 1.65, danger: 0.22 },
  { level: 3, multiplier: 2.25, danger: 0.30 },
  { level: 4, multiplier: 3.40, danger: 0.38 },
  { level: 5, multiplier: 5.20, danger: 0.45 },
  { level: 6, multiplier: 8.50, danger: 0.55 },
  { level: 7, multiplier: 15.0, danger: 0.65 },
];

export const ChickenRoadView: React.FC<ChickenRoadViewProps> = ({
  currentUser,
  onUpdateUserBalance,
  onNavigate,
  onOpenDeposit,
  onOpenAuth,
}) => {
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLane, setCurrentLane] = useState<number>(0);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [history, setHistory] = useState<number[]>([3.4, 1.25, 5.2, 0, 2.25, 0, 8.5, 1.65]);

  const handleStartGame = async () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }

    const userBalance = Number(currentUser.walletBalance ?? 0);
    if (userBalance < betAmount) {
      alert(`वॉलेट में कम बैलेंस है! आपके पास ₹${userBalance.toFixed(2)} है।`);
      onOpenDeposit();
      return;
    }

    if (onUpdateUserBalance) {
      const ok = await onUpdateUserBalance({
        type: 'debit',
        amount: betAmount,
        description: '🐔 Chicken Road Bet',
        category: 'bet',
      });
      if (!ok) return;
    }

    setIsPlaying(true);
    setCurrentLane(0);
    setIsCrashed(false);
    setHasWon(false);
  };

  const handleStepForward = () => {
    if (!isPlaying || isCrashed || hasWon) return;

    const nextLane = currentLane + 1;
    const laneConfig = LANES[nextLane - 1];

    // Crash roll with House Edge Engine (गारंटीड एडमिन बचत)
    const houseSettings = getHouseProfitSettings();
    const isCollision = checkChickenRoadCollision(nextLane, laneConfig.danger, betAmount, houseSettings);

    if (isCollision) {
      // Hit by car!
      setIsCrashed(true);
      setIsPlaying(false);
      setHistory((prev) => [0, ...prev.slice(0, 9)]);
      return;
    }

    setCurrentLane(nextLane);

    if (nextLane === LANES.length) {
      // Cleared entire road!
      handleCashOut(LANES[LANES.length - 1].multiplier);
    }
  };

  const handleCashOut = async (forcedMult?: number) => {
    if (!isPlaying || isCrashed) return;

    const mult = forcedMult || (currentLane > 0 ? LANES[currentLane - 1].multiplier : 1.0);
    const winAmount = +(betAmount * mult).toFixed(2);

    setIsPlaying(false);
    setHasWon(true);
    setHistory((prev) => [mult, ...prev.slice(0, 9)]);

    if (onUpdateUserBalance) {
      await onUpdateUserBalance({
        type: 'credit',
        amount: winAmount,
        description: `🐔 Chicken Road Won @ ${mult}x`,
        category: 'winning',
      });
    }

    playWinningFanfare();
  };

  const currentMultiplier = currentLane > 0 ? LANES[currentLane - 1].multiplier : 1.0;
  const currentCashout = +(betAmount * currentMultiplier).toFixed(2);

  return (
    <div className="min-h-screen bg-[#070a12] text-white pb-24 select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090e1a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
            >
              ← होम
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl">🐔</span>
              <div>
                <h1 className="font-black text-lg bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                  APNA CHICKEN ROAD
                </h1>
                <p className="text-[10px] text-amber-300/80 font-bold">APNA WIN MINI GAMES</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <div
                onClick={onOpenDeposit}
                className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/40 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-black text-amber-300">
                  ₹{Number(currentUser.walletBalance ?? 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Board */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Road Track */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#111827] via-[#0b1120] to-[#090e1a] border-2 border-slate-800 shadow-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
            <span>🏁 स्टार्ट (Start)</span>
            <span>🏆 गोल्डन एग (15.00X FINISH) 🥚</span>
          </div>

          {/* Lanes */}
          <div className="space-y-2">
            {LANES.map((lane, idx) => {
              const isChickenHere = currentLane === lane.level && !isCrashed;
              const isPassed = currentLane >= lane.level;
              const isFailedHere = isCrashed && currentLane + 1 === lane.level;

              return (
                <div
                  key={lane.level}
                  className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                    isChickenHere
                      ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.01]'
                      : isFailedHere
                      ? 'bg-rose-950/40 border-rose-600'
                      : isPassed
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-[11px] font-black flex items-center justify-center text-slate-400">
                      {lane.level}
                    </span>
                    <span className="text-xs font-bold text-slate-300">लेन #{lane.level}</span>
                  </div>

                  {/* Visual Lane Center */}
                  <div className="flex items-center gap-2">
                    {isChickenHere ? (
                      <span className="text-2xl animate-bounce">🐔</span>
                    ) : isFailedHere ? (
                      <span className="text-2xl">💥🚗</span>
                    ) : isPassed ? (
                      <span className="text-base text-emerald-400">👣</span>
                    ) : (
                      <span className="text-xs text-slate-600">🚗 ...</span>
                    )}
                  </div>

                  {/* Multiplier */}
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black ${
                        isPassed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {lane.multiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Overlay */}
          {isCrashed && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500 text-center animate-bounce">
              <span className="text-rose-400 font-black text-base">💥 दुर्घटना! मुर्गी गाड़ी से टकरा गई!</span>
              <p className="text-xs text-slate-300 mt-1">अगली बार सुरक्षित कैशआउट करें!</p>
            </div>
          )}

          {hasWon && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-center animate-fadeIn">
              <span className="text-emerald-400 font-black text-base">🎉 शानदार कैशआउट! ₹{currentCashout}</span>
              <p className="text-xs text-slate-300 mt-1">आपकी जीत का बैलेंस वॉलेट में जोड़ दिया गया है।</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 rounded-3xl bg-[#0e1626] border border-slate-800 shadow-xl space-y-4">
          {!isPlaying ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">बेट राशि चुनें:</span>
                <span className="text-xs font-black text-amber-400">₹{betAmount}</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[20, 50, 100, 200, 500].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setBetAmount(chip)}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      betAmount === chip
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    ₹{chip}
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/30 hover:scale-[1.02] cursor-pointer transition-all"
              >
                🎮 गेम शुरू करें (BET ₹{betAmount})
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleStepForward}
                className="py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 hover:scale-[1.02] cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>आगे बढ़ें (STEP FORWARD) 🐔</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleCashOut()}
                disabled={currentLane === 0}
                className="py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/30 hover:scale-[1.02] cursor-pointer transition-all disabled:opacity-40"
              >
                कैश आउट ₹{currentCashout} ({currentMultiplier}x)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChickenRoadView;
