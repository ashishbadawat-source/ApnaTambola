import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Play,
  Flame,
  Star,
  Zap,
  CircleDot,
  Layers,
  Award,
} from 'lucide-react';
import { User } from '../types';
import { playWinningFanfare } from '../utils/audio';

interface ApnaCasinoViewProps {
  currentUser: User | null;
  onUpdateUserBalance: (delta: number, description: string) => Promise<boolean>;
  onNavigate: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  initialGame?: 'slots' | 'dragontiger' | 'fortunegems' | 'roulette';
}

const SLOT_SYMBOLS = [
  { icon: '7️⃣', name: 'Lucky 7', mult: 50, color: 'text-red-500' },
  { icon: '👑', name: 'Crown', mult: 25, color: 'text-amber-400' },
  { icon: '💎', name: 'Diamond', mult: 15, color: 'text-cyan-400' },
  { icon: '🔔', name: 'Bell', mult: 10, color: 'text-yellow-400' },
  { icon: '🍒', name: 'Cherry', mult: 5, color: 'text-rose-500' },
  { icon: '🍀', name: 'Clover', mult: 4, color: 'text-emerald-400' },
  { icon: '⭐', name: 'Star', mult: 3, color: 'text-amber-300' },
];

const GEMS_SYMBOLS = [
  { icon: '💎', name: 'Blue Diamond', mult: 20 },
  { icon: '🟢', name: 'Emerald Gem', mult: 15 },
  { icon: '🔮', name: 'Purple Orb', mult: 10 },
  { icon: '🔴', name: 'Ruby Stone', mult: 8 },
  { icon: '🟡', name: 'Topaz Crystal', mult: 5 },
];

const GEMS_MULTIPLIERS = [1, 2, 3, 5, 10, 15];

export const ApnaCasinoView: React.FC<ApnaCasinoViewProps> = ({
  currentUser,
  onUpdateUserBalance,
  onNavigate,
  onOpenDeposit,
  onOpenAuth,
  initialGame = 'slots',
}) => {
  const [activeGame, setActiveGame] = useState<'slots' | 'dragontiger' | 'fortunegems' | 'roulette'>(initialGame);
  const [playMode, setPlayMode] = useState<'real' | 'demo'>('real');
  const [demoBalance, setDemoBalance] = useState<number>(5000);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [winMessage, setWinMessage] = useState<string>('');
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 1. Apna Slots states
  const [reels, setReels] = useState<string[]>(['👑', '7️⃣', '💎']);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const autoSpinRef = useRef<number>(0);

  // 2. Apna Fortune Gems states
  const [gemsReels, setGemsReels] = useState<string[]>(['💎', '🟢', '🔮']);
  const [gemsWheelMult, setGemsWheelMult] = useState<number>(1);
  const [isGemsSpinning, setIsGemsSpinning] = useState<boolean>(false);

  // 3. Apna Dragon Tiger states
  const [dtBetTarget, setDtBetTarget] = useState<'dragon' | 'tiger' | 'tie'>('dragon');
  const [dtCards, setDtCards] = useState<{ dragon: number; tiger: number; winner: string } | null>(null);
  const [dtHistory, setDtHistory] = useState<Array<{ winner: 'dragon' | 'tiger' | 'tie'; dragonVal: number; tigerVal: number }>>([
    { winner: 'dragon', dragonVal: 12, tigerVal: 8 },
    { winner: 'tiger', dragonVal: 4, tigerVal: 10 },
    { winner: 'dragon', dragonVal: 13, tigerVal: 9 },
    { winner: 'tie', dragonVal: 7, tigerVal: 7 },
    { winner: 'tiger', dragonVal: 5, tigerVal: 11 },
  ]);

  // 4. Apna Roulette states
  const [rouletteBet, setRouletteBet] = useState<'red' | 'black' | 'green'>('red');
  const [rouletteNum, setRouletteNum] = useState<number | null>(null);
  const [isWheelSpinning, setIsWheelSpinning] = useState<boolean>(false);

  const realBalance = currentUser ? (currentUser.walletBalance ?? 0) : 0;
  const activeBalance = playMode === 'real' ? realBalance : demoBalance;

  // Deduction helper
  const deductBet = async (amount: number, gameTitle: string): Promise<boolean> => {
    if (playMode === 'demo') {
      if (demoBalance < amount) {
        setWinMessage('डेमो बैलेंस समाप्त हो गया है! +₹2,000 रिफिल कर रहे हैं...');
        setDemoBalance((prev) => prev + 2000);
        return false;
      }
      setDemoBalance((prev) => prev - amount);
      return true;
    }

    if (!currentUser) {
      onOpenAuth('login');
      return false;
    }

    if (realBalance < amount) {
      setWinMessage('अपर्याप्त वॉलेट बैलेंस! कृपया तुरंत रिचार्ज करें।');
      return false;
    }

    const success = await onUpdateUserBalance(-amount, `${gameTitle} बेट (₹${amount})`);
    return success;
  };

  // Credit win helper
  const creditWin = async (amount: number, description: string) => {
    setLastWinAmount(amount);
    if (playMode === 'demo') {
      setDemoBalance((prev) => prev + amount);
    } else if (currentUser) {
      await onUpdateUserBalance(amount, description);
    }
    if (soundEnabled) {
      playWinningFanfare();
    }
  };

  // === 1. APNA SLOTS SPIN LOGIC ===
  const handleSpinSlots = async () => {
    if (isSpinning || isProcessing) return;
    setWinMessage('');
    setLastWinAmount(0);

    const deducted = await deductBet(betAmount, 'अपना सुपर ऐस स्लॉट');
    if (!deducted) return;

    setIsSpinning(true);
    let spins = 0;
    const interval = setInterval(() => {
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon,
      ]);
      spins++;
      if (spins >= 12) {
        clearInterval(interval);
        finalizeSlots();
      }
    }, 70);
  };

  const finalizeSlots = async () => {
    // 35% chance 2 match, 15% chance 3 match
    const rand = Math.random();
    let r1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon;
    let r2 = r1;
    let r3 = r1;

    if (rand < 0.15) {
      // 3 match JACKPOT
      const luckySym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      r1 = luckySym.icon;
      r2 = luckySym.icon;
      r3 = luckySym.icon;
      const payout = betAmount * luckySym.mult;
      setReels([r1, r2, r3]);
      setIsSpinning(false);
      setWinMessage(`🎉 जैकपॉट! 3X ${luckySym.name} मैच हुआ! +₹${payout.toLocaleString('en-IN')}`);
      await creditWin(payout, `अपना सुपर ऐस स्लॉट जैकपॉट जीत (${luckySym.name} 3X)`);
    } else if (rand < 0.50) {
      // 2 match
      const sym1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      let sym2 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      while (sym2.icon === sym1.icon) {
        sym2 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      }
      r1 = sym1.icon;
      r2 = sym1.icon;
      r3 = sym2.icon;
      const payout = Math.floor(betAmount * 2.2);
      setReels([r1, r2, r3]);
      setIsSpinning(false);
      setWinMessage(`✨ बढ़िया! 2X ${sym1.name} मैच! +₹${payout.toLocaleString('en-IN')}`);
      await creditWin(payout, `अपना स्लॉट 2-मैच जीत (+₹${payout})`);
    } else {
      // No match
      const s1 = SLOT_SYMBOLS[0].icon;
      const s2 = SLOT_SYMBOLS[2].icon;
      const s3 = SLOT_SYMBOLS[4].icon;
      setReels([s1, s2, s3]);
      setIsSpinning(false);
      setWinMessage('अरे! इस बार मिस हुआ। अगला स्पिन भाग्यशाली हो सकता है!');
    }

    if (autoSpinRef.current > 1) {
      autoSpinRef.current -= 1;
      setAutoSpinCount(autoSpinRef.current);
      setTimeout(() => {
        handleSpinSlots();
      }, 800);
    } else {
      autoSpinRef.current = 0;
      setAutoSpinCount(0);
    }
  };

  // === 2. APNA FORTUNE GEMS SPIN LOGIC ===
  const handleSpinGems = async () => {
    if (isGemsSpinning || isProcessing) return;
    setWinMessage('');
    setLastWinAmount(0);

    const deducted = await deductBet(betAmount, 'अपना फॉर्च्यून जेम्स');
    if (!deducted) return;

    setIsGemsSpinning(true);
    let spins = 0;
    const interval = setInterval(() => {
      setGemsReels([
        GEMS_SYMBOLS[Math.floor(Math.random() * GEMS_SYMBOLS.length)].icon,
        GEMS_SYMBOLS[Math.floor(Math.random() * GEMS_SYMBOLS.length)].icon,
        GEMS_SYMBOLS[Math.floor(Math.random() * GEMS_SYMBOLS.length)].icon,
      ]);
      setGemsWheelMult(GEMS_MULTIPLIERS[Math.floor(Math.random() * GEMS_MULTIPLIERS.length)]);
      spins++;
      if (spins >= 14) {
        clearInterval(interval);
        finalizeGems();
      }
    }, 70);
  };

  const finalizeGems = async () => {
    const isWin = Math.random() < 0.42;
    const finalMult = GEMS_MULTIPLIERS[Math.floor(Math.random() * GEMS_MULTIPLIERS.length)];
    setGemsWheelMult(finalMult);

    if (isWin) {
      const luckyGem = GEMS_SYMBOLS[Math.floor(Math.random() * GEMS_SYMBOLS.length)];
      setGemsReels([luckyGem.icon, luckyGem.icon, luckyGem.icon]);
      setIsGemsSpinning(false);
      const totalWin = betAmount * (luckyGem.mult / 5) * finalMult;
      setWinMessage(`💎 रत्न कॉम्बो! ${luckyGem.name} X ${finalMult}X व्हील = +₹${Math.floor(totalWin).toLocaleString('en-IN')}!`);
      await creditWin(Math.floor(totalWin), `अपना फॉर्च्यून जेम्स जीत (${finalMult}X)`);
    } else {
      const g1 = GEMS_SYMBOLS[0].icon;
      const g2 = GEMS_SYMBOLS[1].icon;
      const g3 = GEMS_SYMBOLS[3].icon;
      setGemsReels([g1, g2, g3]);
      setIsGemsSpinning(false);
      setWinMessage('कोई मैच नहीं हुआ। अगला स्पिन आज़माएं!');
    }
  };

  // === 3. APNA DRAGON TIGER DEAL LOGIC ===
  const handleDealDragonTiger = async () => {
    if (isProcessing) return;
    setWinMessage('');
    setLastWinAmount(0);

    const deducted = await deductBet(betAmount, 'अपना ड्रैगन टाइगर');
    if (!deducted) return;

    setIsProcessing(true);
    setDtCards(null);

    setTimeout(async () => {
      const dVal = Math.floor(Math.random() * 13) + 1;
      const tVal = Math.floor(Math.random() * 13) + 1;
      let winner: 'dragon' | 'tiger' | 'tie' = 'tie';
      if (dVal > tVal) winner = 'dragon';
      else if (tVal > dVal) winner = 'tiger';

      setDtCards({ dragon: dVal, tiger: tVal, winner });
      setDtHistory((prev) => [{ winner, dragonVal: dVal, tigerVal: tVal }, ...prev.slice(0, 19)]);
      setIsProcessing(false);

      if (winner === dtBetTarget) {
        const mult = winner === 'tie' ? 8 : 2;
        const wonAmt = betAmount * mult;
        setWinMessage(`👑 बधाई हो! ${winner === 'dragon' ? '🐉 ड्रैगन' : winner === 'tiger' ? '🐯 टाइगर' : '🤝 टाई'} जीत गया! +₹${wonAmt.toLocaleString('en-IN')}`);
        await creditWin(wonAmt, `अपना ड्रैगन टाइगर जीत (${winner.toUpperCase()} ${mult}X)`);
      } else {
        setWinMessage(`अफसोस! ${winner === 'dragon' ? '🐉 ड्रैगन' : winner === 'tiger' ? '🐯 टाइगर' : '🤝 टाई'} जीता। अगली डील में जीतें!`);
      }
    }, 850);
  };

  // === 4. APNA ROULETTE SPIN LOGIC ===
  const handleSpinRoulette = async () => {
    if (isWheelSpinning || isProcessing) return;
    setWinMessage('');
    setLastWinAmount(0);

    const deducted = await deductBet(betAmount, 'अपना रूलेट');
    if (!deducted) return;

    setIsWheelSpinning(true);
    setTimeout(async () => {
      const randNum = Math.floor(Math.random() * 37); // 0 to 36
      setRouletteNum(randNum);
      setIsWheelSpinning(false);

      let color = 'black';
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      if (randNum === 0) color = 'green';
      else if (redNumbers.includes(randNum)) color = 'red';

      if (rouletteBet === color) {
        const mult = color === 'green' ? 14 : 2;
        const wonAmt = betAmount * mult;
        setWinMessage(`🎉 रूलेट जीत! नंबर ${randNum} (${color.toUpperCase()}) आया! +₹${wonAmt.toLocaleString('en-IN')}`);
        await creditWin(wonAmt, `अपना रूलेट जीत (${color.toUpperCase()} ${mult}X)`);
      } else {
        setWinMessage(`नंबर ${randNum} (${color.toUpperCase()}) आया। इस बार चूक गए!`);
      }
    }, 1200);
  };

  const getCardLabel = (val: number) => {
    if (val === 1) return 'A';
    if (val === 11) return 'J';
    if (val === 12) return 'Q';
    if (val === 13) return 'K';
    return String(val);
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-white pb-24 select-none">
      {/* 👑 Top Bar Header */}
      <div className="sticky top-0 z-30 bg-[#090f20]/95 backdrop-blur-md border-b border-amber-500/20 px-3 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>← होम</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl">🎰</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-xl tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                    APNA WIN CASINO
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[9px] uppercase">
                    100% REAL PLAY
                  </span>
                </div>
                <p className="text-[10px] text-amber-300/80 font-bold hidden sm:block">
                  अपना स्लॉट्स • अपना ड्रैगन टाइगर • अपना फॉर्च्यून जेम्स • अपना रूलेट
                </p>
              </div>
            </div>
          </div>

          {/* Mode Selector (Real vs Demo) & Wallet */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPlayMode('real')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  playMode === 'real'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💵 रियल मनी
              </button>
              <button
                onClick={() => setPlayMode('demo')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  playMode === 'demo'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🪙 फ्री डेमो
              </button>
            </div>

            {/* Active Balance Badge */}
            {playMode === 'real' ? (
              <div
                onClick={onOpenDeposit}
                className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-xl cursor-pointer hover:border-amber-400"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-black text-amber-300 font-mono">
                  ₹{realBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold">+</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-black text-amber-300 font-mono">
                  🪙 {demoBalance.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🎮 Game Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'slots', label: '🎰 अपना सुपर ऐस 777 स्लॉट', tag: '500X' },
            { id: 'dragontiger', label: '🐉 अपना ड्रैगन टाइगर', tag: '2X–8X' },
            { id: 'fortunegems', label: '💎 अपना फॉर्च्यून जेम्स', tag: 'MULTIPLIER' },
            { id: 'roulette', label: '🎡 अपना लकी रूलेट', tag: '14X' },
          ].map((game) => (
            <button
              key={game.id}
              onClick={() => {
                setActiveGame(game.id as any);
                setWinMessage('');
              }}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap cursor-pointer transition-all border flex items-center gap-2 ${
                activeGame === game.id
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <span>{game.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                  activeGame === game.id ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-amber-400'
                }`}
              >
                {game.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Banner Alert on Win */}
        {winMessage && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400/80 text-center animate-bounce shadow-xl">
            <span className="font-black text-sm text-amber-300">{winMessage}</span>
          </div>
        )}

        {/* 🎰 GAME 1: APNA SUPER ACE 777 SLOTS */}
        {activeGame === 'slots' && (
          <div className="rounded-3xl bg-gradient-to-b from-[#161c32] via-[#0d1222] to-[#080c18] border-2 border-amber-500/50 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>🎰 अपना सुपर ऐस (Apna Super Ace 777)</span>
                </h2>
                <p className="text-xs text-amber-300/90 font-semibold">
                  3 समान सिंबल मिलाएँ और 500X तक का महा जैकपॉट प्राप्त करें!
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider animate-pulse">
                HOT JILI
              </span>
            </div>

            {/* 3 Reels Display */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 py-8 px-4 rounded-3xl bg-gradient-to-b from-[#070a14] to-[#04060d] border-4 border-amber-500/60 shadow-inner">
              {reels.map((sym, idx) => (
                <div
                  key={idx}
                  className={`w-24 sm:w-32 h-32 sm:h-40 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/50 flex flex-col items-center justify-center shadow-2xl transform transition-transform ${
                    isSpinning ? 'scale-105 blur-[1px]' : 'scale-100'
                  }`}
                >
                  <span className="text-5xl sm:text-6xl select-none filter drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                    {sym}
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-bold mt-2">REEL {idx + 1}</span>
                </div>
              ))}
            </div>

            {/* Paytable Bar */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center text-xs bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
              {SLOT_SYMBOLS.map((s) => (
                <div key={s.icon} className="p-1 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-lg">{s.icon}</div>
                  <div className="text-[10px] font-black text-amber-300">{s.mult}X</div>
                </div>
              ))}
            </div>

            {/* Stake Chips & Spin Controls */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">दांव राशि (Bet Amount):</span>
                <span className="font-black text-amber-300 text-sm">₹{betAmount}</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[10, 20, 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className={`flex-1 py-2 rounded-xl font-black text-xs cursor-pointer transition-all border ${
                      betAmount === amt
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleSpinSlots}
                  disabled={isSpinning}
                  className={`py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all ${
                    isSpinning
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/30 active:scale-98'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>{isSpinning ? 'स्पिन हो रहा है...' : `स्पिन करें (SPIN ₹${betAmount})`}</span>
                </button>

                <button
                  onClick={() => {
                    if (autoSpinCount > 0) {
                      autoSpinRef.current = 0;
                      setAutoSpinCount(0);
                    } else {
                      autoSpinRef.current = 10;
                      setAutoSpinCount(10);
                      handleSpinSlots();
                    }
                  }}
                  className={`py-4 rounded-2xl font-black text-xs sm:text-sm border transition-all cursor-pointer ${
                    autoSpinCount > 0
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {autoSpinCount > 0 ? `🛑 ऑटो स्पिन रोकें (${autoSpinCount})` : '⚡ 10X ऑटो स्पिन'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🐉 GAME 2: APNA DRAGON TIGER */}
        {activeGame === 'dragontiger' && (
          <div className="rounded-3xl bg-gradient-to-b from-[#260f16] via-[#160a10] to-[#0d050a] border-2 border-rose-500/50 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>🐉 अपना ड्रैगन टाइगर (Apna Dragon Tiger Live)</span>
                </h2>
                <p className="text-xs text-rose-300/90 font-semibold">
                  ड्रैगन (2X), टाइगर (2X) या टाई (8X) - कौन सा कार्ड बड़ा निकलेगा?
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider animate-pulse">
                LIVE DEAL
              </span>
            </div>

            {/* Duel Mat */}
            <div className="grid grid-cols-2 gap-4 py-8 px-4 rounded-3xl bg-gradient-to-b from-[#14060b] to-[#0b0306] border-4 border-rose-500/40 shadow-inner text-center">
              {/* Dragon Card */}
              <div
                onClick={() => setDtBetTarget('dragon')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                  dtBetTarget === 'dragon'
                    ? 'bg-red-950/80 border-red-500 shadow-xl shadow-red-600/30 scale-102'
                    : 'bg-slate-950/60 border-slate-800 hover:border-red-900'
                }`}
              >
                <span className="text-4xl">🐉</span>
                <span className="text-lg font-black text-red-400">DRAGON (2X)</span>
                <div className="w-20 h-28 rounded-xl bg-white text-slate-950 font-black flex items-center justify-center text-4xl shadow-2xl border-2 border-red-500">
                  {dtCards ? getCardLabel(dtCards.dragon) : '🂠'}
                </div>
                {dtBetTarget === 'dragon' && (
                  <span className="text-[10px] font-black text-amber-300 bg-red-900/60 px-2 py-0.5 rounded-full">
                    ✓ चुना गया (₹{betAmount})
                  </span>
                )}
              </div>

              {/* Tiger Card */}
              <div
                onClick={() => setDtBetTarget('tiger')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                  dtBetTarget === 'tiger'
                    ? 'bg-amber-950/80 border-amber-500 shadow-xl shadow-amber-600/30 scale-102'
                    : 'bg-slate-950/60 border-slate-800 hover:border-amber-900'
                }`}
              >
                <span className="text-4xl">🐯</span>
                <span className="text-lg font-black text-amber-400">TIGER (2X)</span>
                <div className="w-20 h-28 rounded-xl bg-white text-slate-950 font-black flex items-center justify-center text-4xl shadow-2xl border-2 border-amber-500">
                  {dtCards ? getCardLabel(dtCards.tiger) : '🂠'}
                </div>
                {dtBetTarget === 'tiger' && (
                  <span className="text-[10px] font-black text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded-full">
                    ✓ चुना गया (₹{betAmount})
                  </span>
                )}
              </div>
            </div>

            {/* Tie Bet Option */}
            <div
              onClick={() => setDtBetTarget('tie')}
              className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                dtBetTarget === 'tie'
                  ? 'bg-emerald-950/90 border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-emerald-800'
              }`}
            >
              <div className="text-sm font-black text-emerald-400">🤝 TIE / ड्रॉ (8X PAYOUT)</div>
              <div className="text-[10px] text-slate-400">दोनों कार्ड बराबर होने पर 8 गुना रिटर्न</div>
            </div>

            {/* Road Map (History Beads) */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 font-bold">हालिया परिणाम (Roadmap):</span>
              <div className="flex items-center gap-1.5 overflow-x-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                {dtHistory.map((h, i) => (
                  <span
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      h.winner === 'dragon'
                        ? 'bg-red-600 text-white'
                        : h.winner === 'tiger'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {h.winner === 'dragon' ? 'D' : h.winner === 'tiger' ? 'T' : '🤝'}
                  </span>
                ))}
              </div>
            </div>

            {/* Stake Chips & Deal Button */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[20, 50, 100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className={`flex-1 py-2 rounded-xl font-black text-xs cursor-pointer transition-all border ${
                      betAmount === amt
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDealDragonTiger}
                disabled={isProcessing}
                className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all ${
                  isProcessing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-rose-500 text-white shadow-rose-600/30 active:scale-98'
                }`}
              >
                <span>{isProcessing ? 'डील हो रहा है...' : `कार्ड डील करें (DEAL ₹${betAmount})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 💎 GAME 3: APNA FORTUNE GEMS */}
        {activeGame === 'fortunegems' && (
          <div className="rounded-3xl bg-gradient-to-b from-[#0a1e17] via-[#061510] to-[#040e0a] border-2 border-emerald-500/50 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>💎 अपना फॉर्च्यून जेम्स (Apna Fortune Gems)</span>
                </h2>
                <p className="text-xs text-emerald-300/90 font-semibold">
                  रत्न मिलाएँ + 4th रील मल्टीप्लायर व्हील से 15X तक गुणक प्राप्त करें!
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider animate-pulse">
                GEM CASCADE
              </span>
            </div>

            {/* 3 Reels + Multiplier Wheel */}
            <div className="flex items-center justify-center gap-3 py-8 px-4 rounded-3xl bg-gradient-to-b from-[#030906] to-[#010403] border-4 border-emerald-500/60 shadow-inner">
              {gemsReels.map((g, idx) => (
                <div
                  key={idx}
                  className={`w-20 sm:w-28 h-28 sm:h-36 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-400/50 flex flex-col items-center justify-center shadow-xl ${
                    isGemsSpinning ? 'blur-[1px]' : ''
                  }`}
                >
                  <span className="text-4xl sm:text-5xl">{g}</span>
                </div>
              ))}

              {/* 4th Wheel Multiplier */}
              <div className="w-20 sm:w-28 h-28 sm:h-36 rounded-2xl bg-gradient-to-b from-amber-500 to-yellow-600 border-2 border-amber-300 flex flex-col items-center justify-center shadow-2xl text-slate-950">
                <span className="text-[10px] font-black uppercase">WHEEL</span>
                <span className="text-3xl sm:text-4xl font-black font-mono">{gemsWheelMult}X</span>
                <span className="text-[9px] font-bold">MULT</span>
              </div>
            </div>

            {/* Stake & Spin */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[10, 20, 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className={`flex-1 py-2 rounded-xl font-black text-xs cursor-pointer transition-all border ${
                      betAmount === amt
                        ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSpinGems}
                disabled={isGemsSpinning}
                className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all ${
                  isGemsSpinning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30 active:scale-98'
                }`}
              >
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>{isGemsSpinning ? 'रत्न घूम रहे हैं...' : `स्पिन करें (SPIN ₹${betAmount})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* 🎡 GAME 4: APNA ROULETTE */}
        {activeGame === 'roulette' && (
          <div className="rounded-3xl bg-gradient-to-b from-[#18122c] via-[#0f0b1c] to-[#08060f] border-2 border-purple-500/50 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>🎡 अपना लकी रूलेट (Apna Lucky Roulette)</span>
                </h2>
                <p className="text-xs text-purple-300/90 font-semibold">
                  लाल 🔴 (2X), काला ⚫ (2X) या शून्य 🟢 (14X) - पहिया घुमाएं और जीतें!
                </p>
              </div>
            </div>

            {/* Wheel Animation Center */}
            <div className="flex flex-col items-center justify-center py-8 rounded-3xl bg-gradient-to-b from-[#0a0714] to-[#040308] border-4 border-purple-500/40 shadow-inner space-y-3">
              <div
                className={`w-36 h-36 rounded-full border-4 border-amber-400 flex items-center justify-center bg-gradient-to-br from-purple-900 to-slate-950 shadow-2xl ${
                  isWheelSpinning ? 'animate-spin' : ''
                }`}
              >
                <span className="text-4xl font-black text-amber-300 font-mono">
                  {rouletteNum !== null ? rouletteNum : '🎡'}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-bold">
                {isWheelSpinning ? 'गेंद घूम रही है...' : rouletteNum !== null ? `परिणाम: ${rouletteNum}` : 'अपना रंग चुनें'}
              </span>
            </div>

            {/* Color Bets */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setRouletteBet('red')}
                className={`py-3.5 rounded-2xl font-black text-xs border transition-all cursor-pointer ${
                  rouletteBet === 'red'
                    ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30 scale-102'
                    : 'bg-red-950/60 text-red-200 border-red-900'
                }`}
              >
                🔴 RED (2X)
              </button>
              <button
                onClick={() => setRouletteBet('black')}
                className={`py-3.5 rounded-2xl font-black text-xs border transition-all cursor-pointer ${
                  rouletteBet === 'black'
                    ? 'bg-slate-800 text-white border-slate-400 shadow-lg scale-102'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                ⚫ BLACK (2X)
              </button>
              <button
                onClick={() => setRouletteBet('green')}
                className={`py-3.5 rounded-2xl font-black text-xs border transition-all cursor-pointer ${
                  rouletteBet === 'green'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 scale-102'
                    : 'bg-emerald-950/60 text-emerald-200 border-emerald-900'
                }`}
              >
                🟢 GREEN 0 (14X)
              </button>
            </div>

            {/* Stake & Spin */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[10, 20, 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className={`flex-1 py-2 rounded-xl font-black text-xs cursor-pointer transition-all border ${
                      betAmount === amt
                        ? 'bg-purple-500 text-white border-purple-400 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSpinRoulette}
                disabled={isWheelSpinning}
                className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all ${
                  isWheelSpinning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 active:scale-98'
                }`}
              >
                <span>{isWheelSpinning ? 'पहिया घूम रहा है...' : `व्हील घुमाएं (SPIN ₹${betAmount})`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
