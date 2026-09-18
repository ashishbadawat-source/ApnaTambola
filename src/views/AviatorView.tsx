import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Zap,
  Volume2,
  VolumeX,
  Wallet,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Trophy,
  History,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { User, AviatorBet, AviatorHistoryItem } from '../types';
import { playWinningFanfare } from '../utils/audio';

interface AviatorViewProps {
  currentUser?: User | null;
  onUpdateUserBalance?: (debitOrCredit: {
    type: 'debit' | 'credit';
    amount: number;
    description: string;
    category?: 'bet' | 'winning';
  }) => Promise<boolean> | boolean;
  onNavigate: (tab: string, param?: string) => void;
  onOpenDeposit: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

// Initial dummy history
const INITIAL_HISTORY: AviatorHistoryItem[] = [
  { id: 'h1', multiplier: 1.42, timestamp: '10:41' },
  { id: 'h2', multiplier: 2.85, timestamp: '10:42' },
  { id: 'h3', multiplier: 1.15, timestamp: '10:43' },
  { id: 'h4', multiplier: 14.20, timestamp: '10:44' },
  { id: 'h5', multiplier: 3.64, timestamp: '10:45' },
  { id: 'h6', multiplier: 1.08, timestamp: '10:46' },
  { id: 'h7', multiplier: 5.12, timestamp: '10:47' },
  { id: 'h8', multiplier: 2.10, timestamp: '10:48' },
  { id: 'h9', multiplier: 28.50, timestamp: '10:49' },
  { id: 'h10', multiplier: 1.95, timestamp: '10:50' },
  { id: 'h11', multiplier: 4.30, timestamp: '10:51' },
  { id: 'h12', multiplier: 1.25, timestamp: '10:52' },
];

// Mock Live Players for social proof
const MOCK_PLAYERS = [
  { name: 'Rahul_77', avatar: '🦁', bet: 200, autoCash: 2.5 },
  { name: 'Vikram_Win', avatar: '👑', bet: 500, autoCash: 1.8 },
  { name: 'Pooja_K', avatar: '🌸', bet: 100, autoCash: 3.0 },
  { name: 'Aman_88', avatar: '🚀', bet: 1000, autoCash: 1.5 },
  { name: 'Sanjay_Boss', avatar: '💎', bet: 300, autoCash: 4.2 },
  { name: 'Deepak_Pro', avatar: '🐯', bet: 50, autoCash: 2.0 },
  { name: 'Rohit_99', avatar: '⚡', bet: 1500, autoCash: 1.4 },
  { name: 'Karan_VIP', avatar: '🎯', bet: 800, autoCash: 5.0 },
  { name: 'Sunil_M', avatar: '🔥', bet: 250, autoCash: 2.2 },
  { name: 'Priya_G', avatar: '🦋', bet: 400, autoCash: 3.5 },
];

export const AviatorView: React.FC<AviatorViewProps> = ({
  currentUser,
  onUpdateUserBalance,
  onNavigate,
  onOpenDeposit,
  onOpenAuth,
}) => {
  // Game States: 'waiting' | 'flying' | 'crashed'
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [countdown, setCountdown] = useState<number>(5.0);
  const [history, setHistory] = useState<AviatorHistoryItem[]>(INITIAL_HISTORY);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'top'>('all');

  // Panel 1 Bet State
  const [betAmount1, setBetAmount1] = useState<number>(50);
  const [isBetPlaced1, setIsBetPlaced1] = useState<boolean>(false);
  const [isBetNextRound1, setIsBetNextRound1] = useState<boolean>(false);
  const [hasCashedOut1, setHasCashedOut1] = useState<boolean>(false);
  const [cashoutMultiplier1, setCashoutMultiplier1] = useState<number>(0);
  const [autoCashoutEnabled1, setAutoCashoutEnabled1] = useState<boolean>(false);
  const [autoCashoutValue1, setAutoCashoutValue1] = useState<number>(2.0);

  // Panel 2 Bet State
  const [betAmount2, setBetAmount2] = useState<number>(100);
  const [isBetPlaced2, setIsBetPlaced2] = useState<boolean>(false);
  const [isBetNextRound2, setIsBetNextRound2] = useState<boolean>(false);
  const [hasCashedOut2, setHasCashedOut2] = useState<boolean>(false);
  const [cashoutMultiplier2, setCashoutMultiplier2] = useState<number>(0);
  const [autoCashoutEnabled2, setAutoCashoutEnabled2] = useState<boolean>(false);
  const [autoCashoutValue2, setAutoCashoutValue2] = useState<number>(3.0);

  // My Personal Bet History
  const [myBetsHistory, setMyBetsHistory] = useState<
    Array<{
      id: string;
      bet: number;
      multiplier: number;
      cashout: number;
      profit: number;
      status: 'win' | 'loss';
      time: string;
    }>
  >([]);

  // Simulation Refs
  const crashPointRef = useRef<number>(2.5);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound Engine
  const playBeep = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Helper: Generate Random Crash Point with realistic curve
  // 10% crash < 1.2x, 50% 1.2x-2.5x, 30% 2.5x-7x, 10% 7x-100x
  const generateCrashPoint = () => {
    const rand = Math.random();
    if (rand < 0.08) {
      return +(1.0 + Math.random() * 0.18).toFixed(2); // instant crash 1.00x - 1.18x
    } else if (rand < 0.35) {
      return +(1.2 + Math.random() * 0.8).toFixed(2); // 1.20x - 2.00x
    } else if (rand < 0.7) {
      return +(2.0 + Math.random() * 2.5).toFixed(2); // 2.00x - 4.50x
    } else if (rand < 0.9) {
      return +(4.5 + Math.random() * 5.5).toFixed(2); // 4.50x - 10.00x
    } else if (rand < 0.98) {
      return +(10.0 + Math.random() * 25.0).toFixed(2); // 10.00x - 35.00x
    } else {
      return +(35.0 + Math.random() * 65.0).toFixed(2); // Mega 35.00x - 100.00x
    }
  };

  // Game Loop: Transitions between waiting, flying, crashed
  useEffect(() => {
    let countdownTimer: any = null;

    if (gameState === 'waiting') {
      let remaining = 5.0;
      setCountdown(5.0);
      setCurrentMultiplier(1.0);

      countdownTimer = setInterval(() => {
        remaining -= 0.1;
        if (remaining <= 0) {
          clearInterval(countdownTimer);
          // Transition to flying
          startFlight();
        } else {
          setCountdown(+remaining.toFixed(1));
        }
      }, 100);
    }

    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [gameState]);

  // Start Flight
  const startFlight = () => {
    const targetCrash = generateCrashPoint();
    crashPointRef.current = targetCrash;
    startTimeRef.current = performance.now();

    // Carry over queue bets
    if (isBetNextRound1) {
      setIsBetPlaced1(true);
      setIsBetNextRound1(false);
    }
    if (isBetNextRound2) {
      setIsBetPlaced2(true);
      setIsBetNextRound2(false);
    }

    setHasCashedOut1(false);
    setHasCashedOut2(false);
    setCashoutMultiplier1(0);
    setCashoutMultiplier2(0);
    setGameState('flying');
    playBeep(440, 'triangle', 0.2);
  };

  // Flying Multiplier Animation Frame
  useEffect(() => {
    if (gameState !== 'flying') return;

    let animId: number;
    const crashPoint = crashPointRef.current;

    const updateFlight = (timestamp: number) => {
      const elapsedSec = (timestamp - startTimeRef.current) / 1000;
      // Exponential curve: multiplier = e^(0.065 * elapsed)
      const currentVal = Math.max(1.0, Math.pow(Math.E, 0.075 * Math.pow(elapsedSec, 1.15)));
      const formattedVal = +currentVal.toFixed(2);

      // Check Auto Cashout Panel 1
      if (
        isBetPlaced1 &&
        !hasCashedOut1 &&
        autoCashoutEnabled1 &&
        formattedVal >= autoCashoutValue1 &&
        autoCashoutValue1 <= crashPoint
      ) {
        handleCashOut(1, autoCashoutValue1);
      }

      // Check Auto Cashout Panel 2
      if (
        isBetPlaced2 &&
        !hasCashedOut2 &&
        autoCashoutEnabled2 &&
        formattedVal >= autoCashoutValue2 &&
        autoCashoutValue2 <= crashPoint
      ) {
        handleCashOut(2, autoCashoutValue2);
      }

      // Crash Check
      if (formattedVal >= crashPoint) {
        // Plane Flew Away!
        setCurrentMultiplier(crashPoint);
        setGameState('crashed');
        playBeep(180, 'sawtooth', 0.4);

        // Record to History
        const newHistItem: AviatorHistoryItem = {
          id: `h_${Date.now()}`,
          multiplier: crashPoint,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setHistory((prev) => [newHistItem, ...prev.slice(0, 19)]);

        // Check if bets lost
        if (isBetPlaced1 && !hasCashedOut1) {
          setIsBetPlaced1(false);
          setMyBetsHistory((prev) => [
            {
              id: `bet_${Date.now()}_1`,
              bet: betAmount1,
              multiplier: crashPoint,
              cashout: 0,
              profit: -betAmount1,
              status: 'loss',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev,
          ]);
        }

        if (isBetPlaced2 && !hasCashedOut2) {
          setIsBetPlaced2(false);
          setMyBetsHistory((prev) => [
            {
              id: `bet_${Date.now()}_2`,
              bet: betAmount2,
              multiplier: crashPoint,
              cashout: 0,
              profit: -betAmount2,
              status: 'loss',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev,
          ]);
        }

        // Wait 3 seconds before next round countdown
        setTimeout(() => {
          setGameState('waiting');
        }, 3000);

        return;
      }

      setCurrentMultiplier(formattedVal);
      animId = requestAnimationFrame(updateFlight);
    };

    animId = requestAnimationFrame(updateFlight);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [gameState, isBetPlaced1, hasCashedOut1, isBetPlaced2, hasCashedOut2, autoCashoutEnabled1, autoCashoutEnabled2]);

  // Place Bet
  const handlePlaceBet = async (panel: 1 | 2) => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }

    const amount = panel === 1 ? betAmount1 : betAmount2;
    const userBalance = Number(currentUser.walletBalance ?? 0);

    if (userBalance < amount) {
      alert(`पर्याप्त बैलेंस नहीं है! आपके पास ₹${userBalance.toFixed(2)} है, जबकि बेट राशि ₹${amount} है। कृपया वॉलेट में डिपॉजिट करें।`);
      onOpenDeposit();
      return;
    }

    // Debit Balance
    if (onUpdateUserBalance) {
      const ok = await onUpdateUserBalance({
        type: 'debit',
        amount,
        description: `🚀 Aviator Round Bet (Panel ${panel})`,
        category: 'bet',
      });
      if (!ok) return;
    }

    playBeep(600, 'sine', 0.15);

    if (gameState === 'waiting') {
      if (panel === 1) setIsBetPlaced1(true);
      else setIsBetPlaced2(true);
    } else {
      // Queue for next round
      if (panel === 1) setIsBetNextRound1(true);
      else setIsBetNextRound2(true);
    }
  };

  // Cancel Queued Bet
  const handleCancelBet = async (panel: 1 | 2) => {
    const amount = panel === 1 ? betAmount1 : betAmount2;
    if (onUpdateUserBalance) {
      await onUpdateUserBalance({
        type: 'credit',
        amount,
        description: `🚀 Aviator Cancelled Bet Refund (Panel ${panel})`,
        category: 'winning',
      });
    }

    if (panel === 1) {
      setIsBetPlaced1(false);
      setIsBetNextRound1(false);
    } else {
      setIsBetPlaced2(false);
      setIsBetNextRound2(false);
    }
  };

  // Cash Out
  const handleCashOut = async (panel: 1 | 2, forcedMult?: number) => {
    const mult = forcedMult || currentMultiplier;
    const amount = panel === 1 ? betAmount1 : betAmount2;
    const winAmount = +(amount * mult).toFixed(2);

    if (panel === 1) {
      setHasCashedOut1(true);
      setCashoutMultiplier1(mult);
      setIsBetPlaced1(false);
    } else {
      setHasCashedOut2(true);
      setCashoutMultiplier2(mult);
      setIsBetPlaced2(false);
    }

    // Credit Winnings
    if (onUpdateUserBalance) {
      await onUpdateUserBalance({
        type: 'credit',
        amount: winAmount,
        description: `🚀 Aviator Win @ ${mult}x (Panel ${panel})`,
        category: 'winning',
      });
    }

    playWinningFanfare();

    setMyBetsHistory((prev) => [
      {
        id: `bet_${Date.now()}_${panel}`,
        bet: amount,
        multiplier: mult,
        cashout: winAmount,
        profit: +(winAmount - amount).toFixed(2),
        status: 'win',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
  };

  // Helper color for multiplier badge
  const getMultiplierColor = (mult: number) => {
    if (mult < 2.0) return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    if (mult < 10.0) return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    return 'bg-amber-400/25 text-amber-300 border-amber-400/50 shadow-md shadow-amber-500/30';
  };

  // Calculate plane coordinates along curve
  const planeProgress = Math.min(1.0, (currentMultiplier - 1.0) / 4.0);
  const planeX = 15 + planeProgress * 65; // %
  const planeY = 75 - Math.pow(planeProgress, 0.75) * 55; // %

  return (
    <div className="min-h-screen bg-[#070a12] text-white pb-24 select-none">
      {/* 🚀 Top Bar: Apna Aviator Header */}
      <div className="sticky top-0 z-30 bg-[#090e1a]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Provably Fair */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>← होम</span>
            </button>

            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <span className="text-base">🚀</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg tracking-wider bg-gradient-to-r from-red-400 via-amber-300 to-red-500 bg-clip-text text-transparent">
                    APNA AVIATOR
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[9px] uppercase">
                    APNA WIN
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-0.5 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> Provably Fair
                  </span>
                  <span>•</span>
                  <span>RTP 97.0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sound, Wallet, How to play */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all"
              title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {currentUser ? (
              <div
                onClick={onOpenDeposit}
                className="flex items-center gap-1.5 bg-gradient-to-r from-slate-900 to-slate-800 border border-amber-500/40 px-3 py-1.5 rounded-xl cursor-pointer hover:border-amber-400 shadow-md transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-black text-amber-300">
                  ₹{Number(currentUser.walletBalance ?? 0).toFixed(2)}
                </span>
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  +
                </span>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 📜 Top Multiplier History Bar */}
      <div className="bg-[#090d16] border-b border-slate-800/60 px-3 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <History className="w-3 h-3 text-amber-400" /> राउंड हिस्ट्री:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {history.map((item, idx) => (
              <span
                key={item.id || idx}
                className={`px-2.5 py-0.5 rounded-full border text-xs font-black shrink-0 transition-all ${getMultiplierColor(
                  item.multiplier
                )}`}
              >
                {item.multiplier.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side (Desktop 8 Cols): Flight Arena & Dual Bet Controls */}
        <div className="lg:col-span-8 space-y-4">
          {/* ✈️ THE FLIGHT STAGE (Canvas / SVG Arena) */}
          <div className="relative w-full h-[280px] sm:h-[380px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#0e1424] via-[#090e1c] to-[#060912] border-2 border-slate-800/80 shadow-2xl flex flex-col justify-between p-4">
            {/* Background Stars / Grid */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />

            {/* Stage Header Info */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-bold">
              <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SERVER #DW8-{history[0]?.id?.slice(-4) || '9912'}</span>
              </span>

              {gameState === 'flying' && (
                <span className="px-2 py-0.5 rounded bg-red-600/30 border border-red-500/50 text-red-300 font-black text-[11px] animate-pulse">
                  🔴 FLIGHT IN PROGRESS
                </span>
              )}
            </div>

            {/* 🛫 CENTER MULTIPLIER / STATUS DISPLAY */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto">
              {gameState === 'waiting' && (
                <div className="flex flex-col items-center gap-3 text-center animate-fadeIn">
                  <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                    अगला राउंड शुरू होने में
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-amber-400 tracking-wider">
                    {countdown.toFixed(1)}s
                  </div>
                  {/* Progress bar */}
                  <div className="w-48 sm:w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-100"
                      style={{ width: `${((5.0 - countdown) / 5.0) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">अपनी बेट लगाएं या ऑटो कैशआउट सेट करें!</p>
                </div>
              )}

              {gameState === 'flying' && (
                <div className="flex flex-col items-center gap-1 select-none">
                  <div className="text-5xl sm:text-7xl font-black tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(255,255,255,0.25)]">
                    {currentMultiplier.toFixed(2)}x
                  </div>
                </div>
              )}

              {gameState === 'crashed' && (
                <div className="flex flex-col items-center gap-2 animate-bounce">
                  <div className="text-xs font-black tracking-widest text-rose-400 uppercase">
                    FLEW AWAY!
                  </div>
                  <div className="text-4xl sm:text-6xl font-black text-rose-500 drop-shadow-[0_0_24px_rgba(244,63,94,0.6)]">
                    @{currentMultiplier.toFixed(2)}x
                  </div>
                </div>
              )}
            </div>

            {/* ✈️ Animated SVG Flight Curve & Plane */}
            {gameState === 'flying' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* SVG Curve Line */}
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="flightGrad" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.35" />
                    </linearGradient>
                  </defs>
                  {/* Fill under curve */}
                  <path
                    d={`M 10 90 Q ${planeX * 0.5} 88, ${planeX} ${planeY} L ${planeX} 90 Z`}
                    fill="url(#flightGrad)"
                  />
                  {/* Stroke curve */}
                  <path
                    d={`M 10 90 Q ${planeX * 0.5} 88, ${planeX} ${planeY}`}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>

                {/* 🚀 Red Rocket / Plane Element */}
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
                  style={{ left: `${planeX}%`, top: `${planeY}%` }}
                >
                  <div className="relative">
                    {/* Jet fire trail */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-2 bg-gradient-to-l from-amber-400 to-transparent blur-sm rounded-full animate-pulse" />
                    <span className="text-3xl sm:text-4xl block transform -rotate-12 filter drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                      ✈️
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage Bottom Graph Axis */}
            <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-800/80 pt-1">
              <span>0s</span>
              <span>2s</span>
              <span>5s</span>
              <span>10s</span>
              <span>15s</span>
              <span>20s</span>
            </div>
          </div>

          {/* 🎮 DUAL BETTING CONTROL PANELS (Bet 1 & Bet 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* PANEL 1 */}
            <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 shadow-xl space-y-3">
              {/* Panel Top Mode */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  BET PANEL 1
                </span>
                {/* Auto Cashout toggle */}
                <div className="flex items-center gap-1.5 text-xs">
                  <label className="text-[11px] font-bold text-slate-400 cursor-pointer">Auto Cashout</label>
                  <input
                    type="checkbox"
                    checked={autoCashoutEnabled1}
                    onChange={(e) => setAutoCashoutEnabled1(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  {autoCashoutEnabled1 && (
                    <input
                      type="number"
                      step="0.1"
                      min="1.1"
                      value={autoCashoutValue1}
                      onChange={(e) => setAutoCashoutValue1(Math.max(1.1, parseFloat(e.target.value) || 1.1))}
                      className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-center font-bold text-emerald-300"
                    />
                  )}
                </div>
              </div>

              {/* Amount Input & Adjusters */}
              <div className="flex items-center gap-2">
                <button
                  disabled={isBetPlaced1 || isBetNextRound1}
                  onClick={() => setBetAmount1(Math.max(10, betAmount1 - 10))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    disabled={isBetPlaced1 || isBetNextRound1}
                    value={betAmount1}
                    onChange={(e) => setBetAmount1(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center font-black text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>
                <button
                  disabled={isBetPlaced1 || isBetNextRound1}
                  onClick={() => setBetAmount1(betAmount1 + 10)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Chip Presets */}
              <div className="grid grid-cols-5 gap-1 text-[11px] font-bold">
                {[10, 50, 100, 500, 1000].map((chip) => (
                  <button
                    key={chip}
                    disabled={isBetPlaced1 || isBetNextRound1}
                    onClick={() => setBetAmount1(chip)}
                    className={`py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-40 transition-all ${
                      betAmount1 === chip ? 'bg-amber-400/20 border border-amber-400 text-amber-300 font-black' : ''
                    }`}
                  >
                    ₹{chip}
                  </button>
                ))}
              </div>

              {/* Dynamic Action Button */}
              {isBetPlaced1 && gameState === 'flying' && !hasCashedOut1 ? (
                <button
                  onClick={() => handleCashOut(1)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-base shadow-lg shadow-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center animate-pulse"
                >
                  <span className="text-xs uppercase tracking-wider">CASH OUT</span>
                  <span className="text-lg">₹{(betAmount1 * currentMultiplier).toFixed(2)}</span>
                </button>
              ) : hasCashedOut1 ? (
                <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-center font-black text-sm">
                  CASHED OUT ₹{(betAmount1 * cashoutMultiplier1).toFixed(2)} ({cashoutMultiplier1.toFixed(2)}x) 🎉
                </div>
              ) : isBetPlaced1 && gameState === 'waiting' ? (
                <button
                  onClick={() => handleCancelBet(1)}
                  className="w-full py-3 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>CANCEL BET (₹{betAmount1})</span>
                </button>
              ) : isBetNextRound1 ? (
                <button
                  onClick={() => handleCancelBet(1)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-rose-900/60 border border-amber-500/50 text-amber-300 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>WAITING FOR NEXT ROUND (CANCEL ₹{betAmount1})</span>
                </button>
              ) : (
                <button
                  onClick={() => handlePlaceBet(1)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  {gameState === 'flying' ? `BET FOR NEXT ROUND (₹${betAmount1})` : `BET ₹${betAmount1}`}
                </button>
              )}
            </div>

            {/* PANEL 2 */}
            <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 shadow-xl space-y-3">
              {/* Panel Top Mode */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  BET PANEL 2
                </span>
                {/* Auto Cashout toggle */}
                <div className="flex items-center gap-1.5 text-xs">
                  <label className="text-[11px] font-bold text-slate-400 cursor-pointer">Auto Cashout</label>
                  <input
                    type="checkbox"
                    checked={autoCashoutEnabled2}
                    onChange={(e) => setAutoCashoutEnabled2(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  {autoCashoutEnabled2 && (
                    <input
                      type="number"
                      step="0.1"
                      min="1.1"
                      value={autoCashoutValue2}
                      onChange={(e) => setAutoCashoutValue2(Math.max(1.1, parseFloat(e.target.value) || 1.1))}
                      className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-center font-bold text-emerald-300"
                    />
                  )}
                </div>
              </div>

              {/* Amount Input & Adjusters */}
              <div className="flex items-center gap-2">
                <button
                  disabled={isBetPlaced2 || isBetNextRound2}
                  onClick={() => setBetAmount2(Math.max(10, betAmount2 - 10))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    disabled={isBetPlaced2 || isBetNextRound2}
                    value={betAmount2}
                    onChange={(e) => setBetAmount2(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center font-black text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>
                <button
                  disabled={isBetPlaced2 || isBetNextRound2}
                  onClick={() => setBetAmount2(betAmount2 + 10)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Chip Presets */}
              <div className="grid grid-cols-5 gap-1 text-[11px] font-bold">
                {[50, 100, 200, 500, 2000].map((chip) => (
                  <button
                    key={chip}
                    disabled={isBetPlaced2 || isBetNextRound2}
                    onClick={() => setBetAmount2(chip)}
                    className={`py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-40 transition-all ${
                      betAmount2 === chip ? 'bg-amber-400/20 border border-amber-400 text-amber-300 font-black' : ''
                    }`}
                  >
                    ₹{chip}
                  </button>
                ))}
              </div>

              {/* Dynamic Action Button */}
              {isBetPlaced2 && gameState === 'flying' && !hasCashedOut2 ? (
                <button
                  onClick={() => handleCashOut(2)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-base shadow-lg shadow-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center animate-pulse"
                >
                  <span className="text-xs uppercase tracking-wider">CASH OUT</span>
                  <span className="text-lg">₹{(betAmount2 * currentMultiplier).toFixed(2)}</span>
                </button>
              ) : hasCashedOut2 ? (
                <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-center font-black text-sm">
                  CASHED OUT ₹{(betAmount2 * cashoutMultiplier2).toFixed(2)} ({cashoutMultiplier2.toFixed(2)}x) 🎉
                </div>
              ) : isBetPlaced2 && gameState === 'waiting' ? (
                <button
                  onClick={() => handleCancelBet(2)}
                  className="w-full py-3 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>CANCEL BET (₹{betAmount2})</span>
                </button>
              ) : isBetNextRound2 ? (
                <button
                  onClick={() => handleCancelBet(2)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-rose-900/60 border border-amber-500/50 text-amber-300 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>WAITING FOR NEXT ROUND (CANCEL ₹{betAmount2})</span>
                </button>
              ) : (
                <button
                  onClick={() => handlePlaceBet(2)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-base shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  {gameState === 'flying' ? `BET FOR NEXT ROUND (₹${betAmount2})` : `BET ₹${betAmount2}`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side (Desktop 4 Cols): Live Player Bets, My Bets, Top Wins */}
        <div className="lg:col-span-4 rounded-3xl bg-[#0c1220] border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-[#080d17] p-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 text-xs font-black rounded-xl cursor-pointer transition-all ${
                activeTab === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Bets ({MOCK_PLAYERS.length})
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-2 text-xs font-black rounded-xl cursor-pointer transition-all ${
                activeTab === 'my' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Bets ({myBetsHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`flex-1 py-2 text-xs font-black rounded-xl cursor-pointer transition-all ${
                activeTab === 'top' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Wins 🏆
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeTab === 'all' && (
              <>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-2 pb-1 border-b border-slate-800">
                  <span>User</span>
                  <span>Bet</span>
                  <span>Mult</span>
                  <span>Win</span>
                </div>
                {MOCK_PLAYERS.map((p, i) => {
                  const hasCashed = gameState === 'flying' && currentMultiplier >= p.autoCash;
                  const winAmt = hasCashed ? (p.bet * p.autoCash).toFixed(0) : '-';

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between text-xs px-2.5 py-2 rounded-xl transition-all ${
                        hasCashed
                          ? 'bg-emerald-950/30 border border-emerald-500/30'
                          : 'bg-slate-900/60 border border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{p.avatar}</span>
                        <span className="font-bold text-slate-300">{p.name}</span>
                      </div>
                      <span className="font-bold text-slate-400">₹{p.bet}</span>
                      <span
                        className={`font-black ${
                          hasCashed ? 'text-amber-300' : 'text-slate-500'
                        }`}
                      >
                        {hasCashed ? `${p.autoCash}x` : '-'}
                      </span>
                      <span
                        className={`font-black ${
                          hasCashed ? 'text-emerald-400 font-extrabold' : 'text-slate-500'
                        }`}
                      >
                        {hasCashed ? `₹${winAmt}` : '-'}
                      </span>
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'my' && (
              <>
                {myBetsHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <History className="w-8 h-8 text-slate-600" />
                    <p className="text-xs font-bold">आपने अभी तक कोई बेट नहीं लगाई है</p>
                    <p className="text-[11px] text-slate-500">
                      नीचे दिए गए पैनल से बेट लगाएं और विमान के क्रैश होने से पहले कैशआउट करें!
                    </p>
                  </div>
                ) : (
                  myBetsHistory.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border ${
                        b.status === 'win'
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-800/40 text-rose-400'
                      }`}
                    >
                      <div>
                        <div className="font-black">
                          {b.status === 'win' ? `+₹${b.cashout}` : `-₹${b.bet}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Bet: ₹{b.bet} • {b.time}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black ${
                            b.status === 'win' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {b.multiplier.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'top' && (
              <div className="space-y-2">
                {[
                  { user: 'Karan_VIP', win: '₹1,45,000', mult: '72.50x', avatar: '👑' },
                  { user: 'Sanjay_Boss', win: '₹98,400', mult: '49.20x', avatar: '💎' },
                  { user: 'Rohit_99', win: '₹62,000', mult: '31.00x', avatar: '⚡' },
                  { user: 'Aman_88', win: '₹45,500', mult: '22.75x', avatar: '🚀' },
                  { user: 'Vikram_Win', win: '₹34,000', mult: '17.00x', avatar: '🦁' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-950/20 to-slate-900 border border-amber-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.avatar}</span>
                      <div>
                        <span className="font-black text-slate-200">{item.user}</span>
                        <span className="text-[10px] block text-amber-400 font-bold">{item.mult}</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-400">{item.win}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AviatorView;
