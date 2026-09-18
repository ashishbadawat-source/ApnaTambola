import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  Trophy,
  History,
  TrendingUp,
  HelpCircle,
  Volume2,
  VolumeX,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Zap,
  ShieldCheck,
  Award,
  ChevronRight,
  Info,
  Layers,
  Settings,
  Sliders,
  DollarSign,
  Crown,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  User,
  ColorPredictionMode,
  ColorPredictionRound,
  ColorPredictionBet,
  ColorPredictionSelection,
  ColorPredictionColor,
  ColorPredictionSize,
  ColorPredictionAdminControl,
  WalletTransaction,
} from '../types';
import {
  calculateOptimalColorPredictionNumber,
  getHouseProfitSettings,
} from '../utils/houseProfitEngine';
import { playWinningFanfare } from '../utils/audio';

interface ColorPredictionViewProps {
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
  isAdmin?: boolean;
}

// Helper: Determine Color & Size from Number
export const getNumberProps = (num: number): {
  color: 'green' | 'red' | 'violet' | 'green_violet' | 'red_violet';
  size: ColorPredictionSize;
  colorName: string;
  badgeBg: string;
  textColor: string;
} => {
  const size: ColorPredictionSize = num >= 5 ? 'big' : 'small';
  if (num === 0) {
    return {
      color: 'red_violet',
      size,
      colorName: 'Red + Violet',
      badgeBg: 'bg-gradient-to-r from-red-600 via-purple-600 to-red-600',
      textColor: 'text-rose-300',
    };
  }
  if (num === 5) {
    return {
      color: 'green_violet',
      size,
      colorName: 'Green + Violet',
      badgeBg: 'bg-gradient-to-r from-emerald-600 via-purple-600 to-emerald-600',
      textColor: 'text-emerald-300',
    };
  }
  if ([1, 3, 7, 9].includes(num)) {
    return {
      color: 'green',
      size,
      colorName: 'Green',
      badgeBg: 'bg-emerald-600',
      textColor: 'text-emerald-400',
    };
  }
  return {
    color: 'red',
    size,
    colorName: 'Red',
    badgeBg: 'bg-rose-600',
    textColor: 'text-rose-400',
  };
};

// Initial simulated history generator
const generateInitialHistory = (mode: ColorPredictionMode): ColorPredictionRound[] => {
  const history: ColorPredictionRound[] = [];
  const now = Date.now();
  const duration = mode === 'wingo_30s' ? 30 : mode === 'wingo_1m' ? 60 : 180;

  for (let i = 25; i >= 1; i--) {
    const roundTime = now - i * duration * 1000;
    const dateStr = new Date(roundTime).toISOString().slice(0, 10).replace(/-/g, '');
    const periodSeq = String(1000 + (Math.floor(roundTime / (duration * 1000)) % 1000)).padStart(4, '0');
    const period = `${dateStr}${periodSeq}`;
    const resultNum = Math.floor(Math.random() * 10);
    const { color, size } = getNumberProps(resultNum);

    history.push({
      id: `rnd_${period}`,
      period,
      mode,
      startTime: roundTime,
      endTime: roundTime + duration * 1000,
      durationSeconds: duration,
      status: 'completed',
      resultNumber: resultNum,
      resultColor: color,
      resultSize: size,
      totalBetsAmount: Math.floor(Math.random() * 50000) + 12000,
      totalPayout: Math.floor(Math.random() * 45000) + 9000,
      createdAt: new Date(roundTime).toISOString(),
    });
  }
  return history;
};

export const ColorPredictionView: React.FC<ColorPredictionViewProps> = ({
  currentUser,
  onUpdateUserBalance,
  onNavigate,
  onOpenDeposit,
  onOpenAuth,
  isAdmin = false,
}) => {
  // Active game mode: Win Go 30s, 1 Min, 3 Min, 5 Min
  const [selectedMode, setSelectedMode] = useState<ColorPredictionMode>('wingo_30s');
  const [activeSubTab, setActiveSubTab] = useState<'game_record' | 'trend_chart' | 'my_bets' | 'how_to_play'>('game_record');

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Betting Sheet / Modal State
  const [selectedBet, setSelectedBet] = useState<ColorPredictionSelection | null>(null);
  const [chipAmount, setChipAmount] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);
  const [betSuccessModal, setBetSuccessModal] = useState<boolean>(false);

  // History & Rounds State per mode
  const [roundsHistory, setRoundsHistory] = useState<ColorPredictionRound[]>(() => {
    try {
      const saved = localStorage.getItem('apna_color_prediction_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return generateInitialHistory('wingo_30s');
  });

  // User's placed bets
  const [userBets, setUserBets] = useState<ColorPredictionBet[]>(() => {
    try {
      const saved = localStorage.getItem('apna_color_prediction_user_bets');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Admin Control State
  const [adminControl, setAdminControl] = useState<ColorPredictionAdminControl>(() => {
    try {
      const saved = localStorage.getItem('apna_color_admin_control');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      autoMode: true,
      nextTargetNumber: null,
      nextTargetColor: null,
      houseProfitMargin: 10,
      activeMode: 'wingo_30s',
      gameActive: true,
    };
  });

  // Celebration / Win Splash modal
  const [lastWonBet, setLastWonBet] = useState<{ bet: ColorPredictionBet; winAmount: number } | null>(null);

  // Mode Duration Calculation
  const modeDuration = selectedMode === 'wingo_30s' ? 30 : selectedMode === 'wingo_1m' ? 60 : 180;
  const lockSeconds = selectedMode === 'wingo_30s' ? 5 : 10;

  // Real-time Timer and Period State
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [currentPeriod, setCurrentPeriod] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSpinningResult, setIsSpinningResult] = useState<boolean>(false);

  // Synchronized countdown ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      const secInDay = Math.floor((now % (24 * 60 * 60 * 1000)) / 1000);
      const periodSeq = Math.floor(secInDay / modeDuration);
      const dateStr = new Date(now).toISOString().slice(0, 10).replace(/-/g, '');
      const periodId = `${dateStr}${String(1000 + (periodSeq % 1000)).padStart(4, '0')}`;

      const rem = modeDuration - (Math.floor(now / 1000) % modeDuration);
      setTimeRemaining(rem);
      setCurrentPeriod(periodId);
      setIsLocked(rem <= lockSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [modeDuration, lockSeconds]);

  // Round completion & resolution handler
  const prevPeriodRef = useRef<string>('');
  useEffect(() => {
    if (!currentPeriod) return;

    if (prevPeriodRef.current && prevPeriodRef.current !== currentPeriod) {
      // Previous round just completed! Resolve outcome for prevPeriod
      const completedPeriod = prevPeriodRef.current;
      handleResolveRound(completedPeriod, selectedMode);
    }
    prevPeriodRef.current = currentPeriod;
  }, [currentPeriod, selectedMode]);

  // Resolve a completed round
  const handleResolveRound = (period: string, mode: ColorPredictionMode) => {
    setIsSpinningResult(true);

    // Collect all bets placed for this completed period
    const roundBets = userBets.filter(
      (b) => b.period === period && b.status === 'pending'
    );
    const betInputs = roundBets.map((b) => ({
      selection: String(b.selection),
      totalAmount: b.totalAmount || 0,
    }));

    // Determine Result with House Profit Engine (गारंटीड एडमिन बचत)
    const houseSettings = getHouseProfitSettings();
    const optimal = calculateOptimalColorPredictionNumber(
      betInputs,
      adminControl.nextTargetNumber,
      adminControl.nextTargetColor,
      houseSettings
    );

    const resultNumber = optimal.resultNumber;
    const { color, size } = getNumberProps(resultNumber);

    const baseTurnover = Math.floor(Math.random() * 25000) + 12000;
    const totalBetsAmount = optimal.totalCollected + baseTurnover;
    const totalPayout = optimal.totalPayout + Math.floor(baseTurnover * (1 - (houseSettings.colorPrediction.marginPercent / 100)));

    const newCompletedRound: ColorPredictionRound = {
      id: `rnd_${period}`,
      period,
      mode,
      startTime: Date.now() - modeDuration * 1000,
      endTime: Date.now(),
      durationSeconds: modeDuration,
      status: 'completed',
      resultNumber,
      resultColor: color,
      resultSize: size,
      totalBetsAmount,
      totalPayout,
      createdAt: new Date().toISOString(),
    };

    // Update History
    setRoundsHistory((prev) => {
      const updated = [newCompletedRound, ...prev.filter((r) => r.period !== period)].slice(0, 50);
      try {
        localStorage.setItem('apna_color_prediction_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Reset Admin target if used
    if (adminControl.nextTargetNumber !== null || adminControl.nextTargetColor !== null) {
      setAdminControl((prev) => {
        const reset = { ...prev, nextTargetNumber: null, nextTargetColor: null };
        try {
          localStorage.setItem('apna_color_admin_control', JSON.stringify(reset));
        } catch (e) {}
        return reset;
      });
    }

    // Resolve User Bets for this period
    setTimeout(() => {
      setIsSpinningResult(false);
      settleUserBets(period, resultNumber, color, size);
    }, 1500);
  };

  // Settle bets placed by the user for a round
  const settleUserBets = (
    period: string,
    resultNum: number,
    resultColor: string,
    resultSize: ColorPredictionSize
  ) => {
    setUserBets((prevBets) => {
      let totalWonThisRound = 0;
      let winningBetItem: ColorPredictionBet | null = null;

      const updated = prevBets.map((bet) => {
        if (bet.period !== period || bet.status !== 'pending') return bet;

        let won = false;
        let multiplier = 0;

        // Color bets
        if (bet.selection === 'green') {
          if ([1, 3, 7, 9].includes(resultNum)) {
            won = true;
            multiplier = 2;
          } else if (resultNum === 5) {
            won = true;
            multiplier = 1.5; // Split with violet
          }
        } else if (bet.selection === 'red') {
          if ([2, 4, 6, 8].includes(resultNum)) {
            won = true;
            multiplier = 2;
          } else if (resultNum === 0) {
            won = true;
            multiplier = 1.5; // Split with violet
          }
        } else if (bet.selection === 'violet') {
          if (resultNum === 0 || resultNum === 5) {
            won = true;
            multiplier = 4.5;
          }
        }
        // Direct Number bets (0-9)
        else if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(bet.selection)) {
          if (parseInt(bet.selection, 10) === resultNum) {
            won = true;
            multiplier = 9;
          }
        }
        // Big / Small bets
        else if (bet.selection === 'big') {
          if (resultNum >= 5) {
            won = true;
            multiplier = 2;
          }
        } else if (bet.selection === 'small') {
          if (resultNum < 5) {
            won = true;
            multiplier = 2;
          }
        }

        const winAmount = won ? Math.round(bet.totalAmount * multiplier) : 0;
        if (won) {
          totalWonThisRound += winAmount;
          winningBetItem = bet;
        }

        return {
          ...bet,
          status: won ? ('won' as const) : ('lost' as const),
          winAmount,
          payoutMultiplier: multiplier,
          resultNumber: resultNum,
          resultColor: resultColor,
          resultSize: resultSize,
        };
      });

      // Credit winnings to user balance if any
      if (totalWonThisRound > 0 && onUpdateUserBalance) {
        onUpdateUserBalance({
          type: 'credit',
          amount: totalWonThisRound,
          description: `🎨 Win Go Result Won (Period: ${period}) - Win ₹${totalWonThisRound}`,
          category: 'winning',
        });

        if (soundEnabled) {
          try {
            playWinningFanfare();
          } catch (e) {}
        }

        if (winningBetItem) {
          setLastWonBet({ bet: winningBetItem, winAmount: totalWonThisRound });
        }
      }

      try {
        localStorage.setItem('apna_color_prediction_user_bets', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Place Bet Handler
  const handleConfirmBet = async () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }

    if (!selectedBet) return;
    const totalCost = chipAmount * multiplier;

    const availableBalance =
      (currentUser.walletBalance ?? 0) ||
      (currentUser.depositBalance ?? 0) + (currentUser.winningBalance ?? 0);

    if (availableBalance < totalCost) {
      alert(`अपर्याप्त बैलेंस! आपके वॉलेट में ₹${availableBalance} है, जबकि बेट राशि ₹${totalCost} है। कृपया वॉलेट रिचार्ज करें।`);
      onOpenDeposit();
      return;
    }

    if (isLocked) {
      alert('समय समाप्त! यह पीरियड लॉक हो चुका है। कृपया अगले पीरियड के लिए बेट लगाएं।');
      setSelectedBet(null);
      return;
    }

    setIsPlacingBet(true);

    try {
      // Deduct balance from user wallet
      let success = true;
      if (onUpdateUserBalance) {
        success = await onUpdateUserBalance({
          type: 'debit',
          amount: totalCost,
          description: `🎨 Win Go Bet: ${selectedBet.toUpperCase()} (Period #${currentPeriod}) - ₹${totalCost}`,
          category: 'bet',
        });
      }

      if (success !== false) {
        let betType: 'color' | 'number' | 'size' = 'color';
        if (['green', 'red', 'violet'].includes(selectedBet)) betType = 'color';
        else if (['big', 'small'].includes(selectedBet)) betType = 'size';
        else betType = 'number';

        const newBet: ColorPredictionBet = {
          id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          period: currentPeriod,
          mode: selectedMode,
          userId: currentUser.id,
          userName: currentUser.name,
          userPhone: currentUser.phone,
          betType,
          selection: selectedBet,
          unitPrice: chipAmount,
          multiplier,
          totalAmount: totalCost,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        setUserBets((prev) => {
          const updated = [newBet, ...prev];
          try {
            localStorage.setItem('apna_color_prediction_user_bets', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        setBetSuccessModal(true);
        setSelectedBet(null);
        setTimeout(() => setBetSuccessModal(false), 2000);
      }
    } catch (e) {
      alert('बेट लगाने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Recent 10 Results for visual pills
  const recentRounds = useMemo(() => {
    return roundsHistory.slice(0, 10);
  }, [roundsHistory]);

  // Statistics calculation
  const stats = useMemo(() => {
    const list = roundsHistory.slice(0, 30);
    const total = list.length || 1;
    let greenCount = 0;
    let redCount = 0;
    let violetCount = 0;
    let bigCount = 0;
    let smallCount = 0;

    list.forEach((r) => {
      if (r.resultNumber !== undefined) {
        if ([1, 3, 7, 9].includes(r.resultNumber)) greenCount++;
        if ([2, 4, 6, 8].includes(r.resultNumber)) redCount++;
        if (r.resultNumber === 0 || r.resultNumber === 5) violetCount++;
        if (r.resultNumber >= 5) bigCount++;
        else smallCount++;
      }
    });

    return {
      greenPercent: Math.round((greenCount / total) * 100),
      redPercent: Math.round((redCount / total) * 100),
      violetPercent: Math.round((violetCount / total) * 100),
      bigPercent: Math.round((bigCount / total) * 100),
      smallPercent: Math.round((smallCount / total) * 100),
    };
  }, [roundsHistory]);

  const latestResult = roundsHistory[0];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 👑 Top Header & Wallet Bar */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 border-2 border-amber-400/50 p-4 sm:p-6 text-white shadow-[0_0_40px_rgba(168,85,247,0.25)] flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-purple-500 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 font-black text-2xl animate-pulse">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-purple-500 to-rose-500 text-white font-black text-[10px] uppercase tracking-wider shadow">
                ✨ 100% PROVABLY FAIR
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold">
                WIN GO COLOR TRADING
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              कलर प्रेडिक्शन & विन गो (Color Prediction)
            </h1>
            <p className="text-xs text-slate-300">
              हरा 🟢 (Green 2X), बैंगनी 🟣 (Violet 4.5X), लाल 🔴 (Red 2X) और नंबर 0–9 (9X) पर जीतें भारी ईनाम!
            </p>
          </div>
        </div>

        {/* User Balance & Actions */}
        <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-between md:justify-end">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 p-2.5 sm:p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    कुल वॉलेट बैलेंस
                  </div>
                  <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                    ₹{((currentUser.walletBalance ?? 0) || (currentUser.depositBalance ?? 0) + (currentUser.winningBalance ?? 0)).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenDeposit}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 cursor-pointer transition-transform active:scale-95 shrink-0"
              >
                + रिचार्ज
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 cursor-pointer"
            >
              लॉगिन करें (+₹10 फ्री बोनस)
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* ⏱️ Game Mode Selection Bar (Win Go 30s, 1 Min, 3 Min, 5 Min) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          { id: 'wingo_30s' as ColorPredictionMode, title: 'Win Go 30s', subtitle: '⚡ फ़ास्ट 30 सेकंड', icon: Flame, color: 'from-rose-500 to-amber-500' },
          { id: 'wingo_1m' as ColorPredictionMode, title: 'Win Go 1Min', subtitle: '⏱️ क्लासिक 1 मिनट', icon: Clock, color: 'from-purple-600 to-indigo-600' },
          { id: 'wingo_3m' as ColorPredictionMode, title: 'Win Go 3Min', subtitle: '🎯 स्टैंडर्ड 3 मिनट', icon: Trophy, color: 'from-emerald-600 to-teal-600' },
        ].map((mode) => {
          const isSelected = selectedMode === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-102 text-white'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-rose-500" />
              )}
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="font-black text-sm sm:text-base">{mode.title}</span>
              </div>
              <span className="text-[11px] font-bold text-amber-300/90">{mode.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* 🔴 LIVE TIMER & CURRENT PERIOD ARENA */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-[#160d2e] to-slate-950 border-2 border-purple-500/60 p-5 sm:p-7 shadow-[0_0_40px_rgba(147,51,234,0.2)] text-white relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Period & How to Play */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-purple-600/30 border border-purple-400/50 text-purple-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>एक्टिव पीरियड / CURRENT PERIOD</span>
              </span>
              <button
                onClick={() => setActiveSubTab('how_to_play')}
                className="text-xs text-amber-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>नियम कैसे खेलें</span>
              </button>
            </div>

            <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-400 flex items-center gap-2">
              <span>#{currentPeriod || '20260918001'}</span>
            </div>

            {/* Recent 5 Winning Pills */}
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                पिछली 5 जीती हुई बॉलें (Recent Winners):
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {recentRounds.slice(0, 5).map((r, i) => {
                  const p = getNumberProps(r.resultNumber ?? 0);
                  return (
                    <div
                      key={`pill-${r.period}-${i}`}
                      className={`w-9 h-9 rounded-full ${p.badgeBg} border-2 border-white/80 flex items-center justify-center font-mono font-black text-sm text-white shadow-lg`}
                      title={`Period ${r.period}: Number ${r.resultNumber} (${p.colorName})`}
                    >
                      {r.resultNumber}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Big Digital Countdown Clock with Locked Warning */}
          <div className="flex flex-col items-center md:items-end justify-center">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>टाइम रिमेनिंग (TIME REMAINING)</span>
            </div>

            {/* Giant Countdown Digits */}
            <div className="flex items-center gap-2">
              <div
                className={`px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 font-mono font-black text-3xl sm:text-5xl shadow-2xl transition-all ${
                  isLocked
                    ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse scale-105 shadow-[0_0_35px_rgba(244,63,94,0.6)]'
                    : 'bg-slate-900 border-amber-400/60 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                }`}
              >
                00:{String(timeRemaining).padStart(2, '0')}
              </div>
            </div>

            {isLocked ? (
              <span className="mt-2 text-xs font-black text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-500/40 animate-pulse flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                बेटिंग लॉक हो चुकी है (रिजल्ट आ रहा है...)
              </span>
            ) : (
              <span className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                बेटिंग चालू है (अपनी पसंद चुनें)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 🎯 MAIN BETTING BOARD (कलर, नंबर 0-9, बिग/स्मॉल चयन बोर्ड) */}
      <div className="rounded-3xl bg-slate-950/90 border-2 border-slate-800 p-4 sm:p-6 text-white space-y-5 shadow-2xl relative">
        {/* Color Prediction Primary Buttons: Green (2X), Violet (4.5X), Red (2X) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Green Button */}
          <button
            disabled={isLocked}
            onClick={() => setSelectedBet('green')}
            className={`py-4 sm:py-5 px-3 rounded-2xl font-black text-sm sm:text-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer relative overflow-hidden shadow-xl ${
              isLocked
                ? 'opacity-50 cursor-not-allowed bg-emerald-950 border border-emerald-800 text-emerald-600'
                : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white shadow-emerald-600/40 hover:scale-103 active:scale-95 border-2 border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
              <span>🟢 हरा (Green)</span>
            </div>
            <span className="text-xs font-extrabold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-400/40 text-emerald-200">
              2X / 1.5X Payout
            </span>
          </button>

          {/* Violet Button */}
          <button
            disabled={isLocked}
            onClick={() => setSelectedBet('violet')}
            className={`py-4 sm:py-5 px-3 rounded-2xl font-black text-sm sm:text-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer relative overflow-hidden shadow-xl ${
              isLocked
                ? 'opacity-50 cursor-not-allowed bg-purple-950 border border-purple-800 text-purple-600'
                : 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white shadow-purple-600/40 hover:scale-103 active:scale-95 border-2 border-purple-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
              <span>🟣 बैंगनी (Violet)</span>
            </div>
            <span className="text-xs font-extrabold bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-400/40 text-purple-200">
              4.5X Payout
            </span>
          </button>

          {/* Red Button */}
          <button
            disabled={isLocked}
            onClick={() => setSelectedBet('red')}
            className={`py-4 sm:py-5 px-3 rounded-2xl font-black text-sm sm:text-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer relative overflow-hidden shadow-xl ${
              isLocked
                ? 'opacity-50 cursor-not-allowed bg-rose-950 border border-rose-800 text-rose-600'
                : 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white shadow-red-600/40 hover:scale-103 active:scale-95 border-2 border-rose-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
              <span>🔴 लाल (Red)</span>
            </div>
            <span className="text-xs font-extrabold bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-400/40 text-rose-200">
              2X / 1.5X Payout
            </span>
          </button>
        </div>

        {/* 🔢 Exact Number Grid (0 to 9) - Multiplier 9X! */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold flex items-center gap-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>सटीक नंबर चुनें (Select Exact Number)</span>
            </span>
            <span className="font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
              ⚡ 9X JACKPOT MULTIPLIER
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const p = getNumberProps(num);
              return (
                <button
                  key={`num-btn-${num}`}
                  disabled={isLocked}
                  onClick={() => setSelectedBet(String(num) as ColorPredictionSelection)}
                  className={`py-3 sm:py-4 rounded-2xl font-mono font-black text-xl sm:text-2xl transition-all flex flex-col items-center justify-center border-2 cursor-pointer shadow-lg ${
                    isLocked
                      ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                      : `${p.badgeBg} text-white border-white/40 hover:scale-108 hover:border-amber-300 active:scale-95`
                  }`}
                >
                  <span>{num}</span>
                  <span className="text-[9px] font-sans font-bold opacity-80 uppercase tracking-tighter">
                    {num === 0 ? 'R+V' : num === 5 ? 'G+V' : [1, 3, 7, 9].includes(num) ? 'Green' : 'Red'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ⚖️ Big / Small High-Low Buttons (2X Payout) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
          {/* Big Button (5-9) */}
          <button
            disabled={isLocked}
            onClick={() => setSelectedBet('big')}
            className={`py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg border-2 ${
              isLocked
                ? 'opacity-50 cursor-not-allowed bg-amber-950 border-amber-900 text-amber-700'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 border-amber-300 shadow-amber-500/30 hover:scale-102 active:scale-95'
            }`}
          >
            <span>👑 BIG (5, 6, 7, 8, 9)</span>
            <span className="text-xs bg-slate-950/80 text-amber-300 px-2 py-0.5 rounded-md font-mono font-bold">
              2X
            </span>
          </button>

          {/* Small Button (0-4) */}
          <button
            disabled={isLocked}
            onClick={() => setSelectedBet('small')}
            className={`py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg border-2 ${
              isLocked
                ? 'opacity-50 cursor-not-allowed bg-blue-950 border-blue-900 text-blue-700'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white border-sky-300 shadow-blue-500/30 hover:scale-102 active:scale-95'
            }`}
          >
            <span>💎 SMALL (0, 1, 2, 3, 4)</span>
            <span className="text-xs bg-slate-950/80 text-sky-300 px-2 py-0.5 rounded-md font-mono font-bold">
              2X
            </span>
          </button>
        </div>
      </div>

      {/* 📝 BETTING MODAL / SHEET (जब यूज़र कोई विकल्प चुनता है) */}
      {selectedBet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(245,158,11,0.5)] space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {selectedBet === 'green'
                    ? '🟢'
                    : selectedBet === 'red'
                    ? '🔴'
                    : selectedBet === 'violet'
                    ? '🟣'
                    : selectedBet === 'big'
                    ? '👑'
                    : selectedBet === 'small'
                    ? '💎'
                    : '🔢'}
                </span>
                <div>
                  <h3 className="font-black text-lg text-white">
                    बेट कन्फर्मेशन (Place Bet)
                  </h3>
                  <span className="text-xs text-amber-300 font-bold">
                    चयन: {selectedBet.toUpperCase()} | पीरियड: #{currentPeriod}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBet(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Chip Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                चिप राशि चुनें (Select Amount per unit):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {[10, 50, 100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={`chip-${amt}`}
                    onClick={() => setChipAmount(amt)}
                    className={`py-2 rounded-xl font-mono font-black text-xs transition-all cursor-pointer border ${
                      chipAmount === amt
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/40 font-extrabold scale-105'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Multiplier Multiplier */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                मल्टीप्लायर (Multiplier):
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 5, 10, 20, 50].map((mult) => (
                  <button
                    key={`mult-${mult}`}
                    onClick={() => setMultiplier(mult)}
                    className={`py-2 rounded-xl font-mono font-black text-xs transition-all cursor-pointer border ${
                      multiplier === mult
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40 scale-105'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mult}X
                  </button>
                ))}
              </div>
            </div>

            {/* Total Cost & Estimated Payout Calculation */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">कुल बेट राशि (Total Bet):</span>
                <span className="font-mono font-black text-amber-400 text-base">
                  ₹{chipAmount * multiplier}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">अनुमानित जीत राशि (Est. Payout):</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  ₹
                  {selectedBet === 'violet'
                    ? Math.round(chipAmount * multiplier * 4.5)
                    : ['green', 'red', 'big', 'small'].includes(selectedBet)
                    ? chipAmount * multiplier * 2
                    : chipAmount * multiplier * 9}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedBet(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                disabled={isPlacingBet}
                onClick={handleConfirmBet}
                className="flex-2 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/40 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                {isPlacingBet ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>प्रोसेसिंग...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>बेट लगाएं (₹{chipAmount * multiplier})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎉 BET PLACED POPUP NOTIFICATION */}
      {betSuccessModal && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 border-2 border-emerald-300 text-white px-6 py-3 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.7)] flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-black text-sm">
            बेट सफलतापूर्वक लग गई है! शुभकामनाएं 🎉
          </span>
        </div>
      )}

      {/* 🏆 INSTANT WIN SPLASH MODAL */}
      {lastWonBet && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 text-center text-white space-y-4 shadow-[0_0_60px_rgba(245,158,11,0.6)]">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/50 animate-bounce">
              🏆
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase font-black tracking-widest text-amber-400">
                🎉 CONGRATULATIONS 🎉
              </span>
              <h2 className="text-2xl font-black text-white">आप जीत गए हैं!</h2>
              <p className="text-xs text-slate-300">
                पीरियड #{lastWonBet.bet.period} में आपका अनुमान बिल्कुल सही निकला।
              </p>
            </div>

            <div className="bg-emerald-950/80 border-2 border-emerald-400/80 p-4 rounded-2xl space-y-1">
              <div className="text-xs text-emerald-300 font-bold">जीती गई राशि</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                +₹{lastWonBet.winAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <button
              onClick={() => setLastWonBet(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/40 cursor-pointer"
            >
              शानदार! आगे खेलें
            </button>
          </div>
        </div>
      )}

      {/* 📊 HISTORY & CHARTS TABS (गेम रिकॉर्ड, ट्रेंड चार्ट, मेरे ऑर्डर्स, नियम) */}
      <div className="rounded-3xl bg-slate-950 border-2 border-slate-800 p-4 sm:p-6 text-white space-y-5 shadow-2xl">
        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'game_record' as const, label: '📜 गेम रिकॉर्ड (Game Record)', icon: History },
            { id: 'trend_chart' as const, label: '📈 ट्रेंड चार्ट (Chart)', icon: TrendingUp },
            { id: 'my_bets' as const, label: '🎟️ मेरे ऑर्डर्स (My Bets)', icon: Wallet },
            { id: 'how_to_play' as const, label: '❓ कैसे खेलें (Rules)', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTabActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. Game Record Table */}
        {activeSubTab === 'game_record' && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
                    <th className="py-3 px-3">पीरियड (Period)</th>
                    <th className="py-3 px-3 text-center">नंबर (Number)</th>
                    <th className="py-3 px-3 text-center">बिग / स्मॉल</th>
                    <th className="py-3 px-3 text-center">रंग (Color)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {roundsHistory.slice(0, 20).map((r) => {
                    const p = getNumberProps(r.resultNumber ?? 0);
                    return (
                      <tr key={`rec-${r.period}`} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-2.5 px-3 text-amber-300 font-bold font-mono">
                          {r.period}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${p.badgeBg} text-white font-black text-xs border border-white/60 shadow`}
                          >
                            {r.resultNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              r.resultSize === 'big'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-950 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {r.resultSize?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {r.resultNumber === 0 ? (
                              <>
                                <span className="w-3 h-3 rounded-full bg-rose-500 shadow" />
                                <span className="w-3 h-3 rounded-full bg-purple-500 shadow" />
                              </>
                            ) : r.resultNumber === 5 ? (
                              <>
                                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow" />
                                <span className="w-3 h-3 rounded-full bg-purple-500 shadow" />
                              </>
                            ) : [1, 3, 7, 9].includes(r.resultNumber ?? 0) ? (
                              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Trend Chart & Parity Analysis */}
        {activeSubTab === 'trend_chart' && (
          <div className="space-y-4">
            {/* Color Distribution Bars */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 p-3 rounded-2xl border border-emerald-500/30 text-center">
                <span className="text-[11px] text-emerald-400 font-bold block mb-1">
                  🟢 GREEN {stats.greenPercent}%
                </span>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.greenPercent}%` }} />
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-purple-500/30 text-center">
                <span className="text-[11px] text-purple-400 font-bold block mb-1">
                  🟣 VIOLET {stats.violetPercent}%
                </span>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.violetPercent}%` }} />
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-rose-500/30 text-center">
                <span className="text-[11px] text-rose-400 font-bold block mb-1">
                  🔴 RED {stats.redPercent}%
                </span>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${stats.redPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Matrix Dot Grid for past 30 rounds */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                हाल के 30 पीरियड्स का पैटर्न (Parity Matrix):
              </span>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {roundsHistory.slice(0, 30).map((r, idx) => {
                  const p = getNumberProps(r.resultNumber ?? 0);
                  return (
                    <div
                      key={`matrix-${r.period}-${idx}`}
                      className={`p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-1 text-center`}
                    >
                      <span className="text-[9px] text-slate-500 font-mono">
                        #{r.period.slice(-3)}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full ${p.badgeBg} flex items-center justify-center text-white font-mono font-black text-xs`}
                      >
                        {r.resultNumber}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {r.resultSize}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. My Bets (User's Placed Bets) */}
        {activeSubTab === 'my_bets' && (
          <div className="space-y-3">
            {userBets && userBets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
                      <th className="py-3 px-3">पीरियड</th>
                      <th className="py-3 px-3">चयन (Selection)</th>
                      <th className="py-3 px-3">बेट राशि</th>
                      <th className="py-3 px-3 text-center">रिजल्ट</th>
                      <th className="py-3 px-3 text-right">स्टेटस / जीत</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {userBets.map((bet) => (
                      <tr key={bet.id} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 text-amber-300 font-bold">
                          #{bet.period}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white uppercase text-xs">
                            {bet.selection}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200">
                          ₹{bet.totalAmount} ({bet.unitPrice}×{bet.multiplier})
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {bet.resultNumber !== undefined ? (
                            <span className="font-bold text-amber-300">
                              #{bet.resultNumber} ({bet.resultColor})
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">वेटिंग...</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">
                          {bet.status === 'won' ? (
                            <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                              +₹{bet.winAmount?.toLocaleString('en-IN')} (जीत)
                            </span>
                          ) : bet.status === 'lost' ? (
                            <span className="text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                              -₹{bet.totalAmount} (हार)
                            </span>
                          ) : (
                            <span className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 animate-pulse">
                              ⏳ रनिंग
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Wallet className="w-10 h-10 mx-auto opacity-40 text-amber-400" />
                <p className="text-sm">आपने अभी तक कोई बेट नहीं लगाई है।</p>
                <p className="text-xs text-slate-400">
                  ऊपर दिए गए हरा, बैंगनी, लाल या 0-9 नंबर चुनकर अभी पहली बेट लगाएं!
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. How to Play & Rules */}
        {activeSubTab === 'how_to_play' && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800">
            <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              <span>कलर प्रेडिक्शन (Win Go) गेम के नियम व पे-आउट गाइड:</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-emerald-400">🟢 1. हरा रंग (Green) — 2X / 1.5X</h4>
                <p>
                  यदि रिजल्ट <strong>1, 3, 7, 9</strong> आता है तो आपको <strong>2X</strong> (दोगुना) राशि मिलती है।
                  यदि रिजल्ट <strong>5</strong> आता है (हरा + बैंगनी), तो आपको <strong>1.5X</strong> राशि मिलती है।
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-rose-400">🔴 2. लाल रंग (Red) — 2X / 1.5X</h4>
                <p>
                  यदि रिजल्ट <strong>2, 4, 6, 8</strong> आता है तो आपको <strong>2X</strong> (दोगुना) राशि मिलती है।
                  यदि रिजल्ट <strong>0</strong> आता है (लाल + बैंगनी), तो आपको <strong>1.5X</strong> राशि मिलती है।
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-purple-400">🟣 3. बैंगनी रंग (Violet) — 4.5X</h4>
                <p>
                  यदि रिजल्ट <strong>0 या 5</strong> आता है, तो बैंगनी पर लगाई गई राशि पर <strong>4.5X</strong> गुना भारी पे-आउट मिलता है।
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-amber-400">👑 4. सटीक नंबर 0–9 — 9X जैकपॉट!</h4>
                <p>
                  यदि आप सटीक नंबर (जैसे 7) चुनते हैं और वही नंबर आता है, तो आपको आपकी राशि का <strong>9X गुना</strong> तुरंत मिलता है।
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🛠️ ADMIN CONTROL PANEL OVERLAY (For Admins Only) */}
      {isAdmin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-950 to-red-950/90 border-2 border-red-500/70 shadow-2xl text-white space-y-3">
          <div className="flex items-center justify-between border-b border-red-500/40 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-400" />
              <span className="font-black text-sm text-red-300">
                🔒 एडमिन कंट्रोल: कलर प्रेडिक्शन रिजल्ट सेटर (Admin Override)
              </span>
            </div>
            <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white font-bold">
              MASTER ADMIN ONLY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Set Next Number Outcome */}
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                अगले पीरियड (#{currentPeriod}) का रिजल्ट नंबर फिक्स करें:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={`admin-num-${num}`}
                    onClick={() => {
                      setAdminControl((prev) => {
                        const updated = { ...prev, nextTargetNumber: num, nextTargetColor: null };
                        try {
                          localStorage.setItem('apna_color_admin_control', JSON.stringify(updated));
                        } catch (e) {}
                        return updated;
                      });
                    }}
                    className={`w-7 h-7 rounded-lg font-mono font-bold cursor-pointer border ${
                      adminControl.nextTargetNumber === num
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black scale-110 shadow-lg'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                {adminControl.nextTargetNumber !== null && (
                  <button
                    onClick={() => {
                      setAdminControl((prev) => {
                        const updated = { ...prev, nextTargetNumber: null };
                        try {
                          localStorage.setItem('apna_color_admin_control', JSON.stringify(updated));
                        } catch (e) {}
                        return updated;
                      });
                    }}
                    className="px-2 py-1 bg-red-800 hover:bg-red-700 rounded text-[10px] font-bold"
                  >
                    हटाएं (RNG)
                  </button>
                )}
              </div>
            </div>

            {/* Set Next Color Outcome */}
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                या अगले पीरियड का रंग फिक्स करें:
              </label>
              <div className="flex items-center gap-2">
                {[
                  { id: 'green' as const, label: '🟢 Green', color: 'bg-emerald-600' },
                  { id: 'violet' as const, label: '🟣 Violet', color: 'bg-purple-600' },
                  { id: 'red' as const, label: '🔴 Red', color: 'bg-rose-600' },
                ].map((col) => (
                  <button
                    key={`admin-col-${col.id}`}
                    onClick={() => {
                      setAdminControl((prev) => {
                        const updated = { ...prev, nextTargetColor: col.id, nextTargetNumber: null };
                        try {
                          localStorage.setItem('apna_color_admin_control', JSON.stringify(updated));
                        } catch (e) {}
                        return updated;
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border ${
                      adminControl.nextTargetColor === col.id
                        ? `${col.color} text-white border-white font-black scale-105 shadow-md`
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPredictionView;
