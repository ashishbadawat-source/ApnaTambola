import React, { useState, useEffect } from 'react';
import {
  Gift,
  Sparkles,
  Trophy,
  Coins,
  Flame,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowRight,
  ShieldCheck,
  Star,
  Play,
  RotateCcw,
  IndianRupee,
  Share2,
  HelpCircle,
  TrendingUp,
  Wallet,
  Lock,
  AlertCircle,
  X,
} from 'lucide-react';
import { User } from '../types';
import { playWinningFanfare, playNumberCallSound } from '../utils/audio';

interface DailyBonusViewProps {
  currentUser: User;
  onClaimDailyReward?: (amount: number, source: string) => Promise<boolean>;
  onDeposit?: (amount: number, method: string) => Promise<boolean>;
  onNavigate: (tab: string) => void;
}

export interface SpinSlice {
  id: number;
  label: string;
  shortLabel: string;
  amount: number;
  color: string;
  textColor: string;
}

// Spin Wheel: 10 paise, 20 paise, 30 paise, 50 paise, up to maximum ₹1.00!
export const SPIN_SLICES: SpinSlice[] = [
  { id: 1, label: '10 पैसे', shortLabel: '₹0.10', amount: 0.10, color: '#f59e0b', textColor: '#000' },
  { id: 2, label: '20 पैसे', shortLabel: '₹0.20', amount: 0.20, color: '#8b5cf6', textColor: '#fff' },
  { id: 3, label: '30 पैसे', shortLabel: '₹0.30', amount: 0.30, color: '#10b981', textColor: '#fff' },
  { id: 4, label: '50 पैसे', shortLabel: '₹0.50', amount: 0.50, color: '#ef4444', textColor: '#fff' },
  { id: 5, label: '10 पैसे', shortLabel: '₹0.10', amount: 0.10, color: '#06b6d4', textColor: '#fff' },
  { id: 6, label: '20 पैसे', shortLabel: '₹0.20', amount: 0.20, color: '#ec4899', textColor: '#fff' },
  { id: 7, label: '₹1.00 MEGA', shortLabel: '₹1.00', amount: 1.00, color: '#facc15', textColor: '#000' },
  { id: 8, label: '30 पैसे', shortLabel: '₹0.30', amount: 0.30, color: '#3b82f6', textColor: '#fff' },
];

// Scratch Card Possible Rewards: Max ₹1.00
const SCRATCH_REWARDS = [
  { label: '10 पैसे (₹0.10)', amount: 0.10 },
  { label: '20 पैसे (₹0.20)', amount: 0.20 },
  { label: '30 पैसे (₹0.30)', amount: 0.30 },
  { label: '50 पैसे (₹0.50)', amount: 0.50 },
  { label: '75 पैसे (₹0.75)', amount: 0.75 },
  { label: '₹1.00 (1 रुपया जैकपॉट)', amount: 1.00 },
];

export const DailyBonusView: React.FC<DailyBonusViewProps> = ({
  currentUser,
  onClaimDailyReward,
  onDeposit,
  onNavigate,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [wonPrize, setWonPrize] = useState<{ label: string; amount: number } | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(4);
  const [claimedStreakToday, setClaimedStreakToday] = useState(false);
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [scratchPrize, setScratchPrize] = useState<{ label: string; amount: number } | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Depositor verification: Only depositors can do daily check-in, spin wheel, and scratch card
  const isDepositor = Boolean(
    currentUser.hasDeposited ||
    (currentUser.depositBalance && currentUser.depositBalance > 0) ||
    currentUser.firstDepositBonusClaimed
  );

  // Check spin status from localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const lastSpin = localStorage.getItem(`tambola_last_spin_${currentUser.id}`);
      const todayStr = new Date().toDateString();
      if (lastSpin === todayStr) {
        setHasSpunToday(true);
      }
    }
  }, [currentUser.id]);

  const claimRewardHelper = async (amount: number, source: string) => {
    if (!isDepositor) {
      setShowDepositModal(true);
      return;
    }
    if (onClaimDailyReward) {
      await onClaimDailyReward(amount, source);
    } else if (onDeposit) {
      await onDeposit(amount, source);
    }
  };

  const handleSpinWheel = async () => {
    if (!isDepositor) {
      setShowDepositModal(true);
      return;
    }
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setWonPrize(null);
    playNumberCallSound();

    // Pick a random slice (weighted towards fun 10p, 20p, 30p, 50p, 1.00)
    const winningIndex = Math.floor(Math.random() * SPIN_SLICES.length);
    const selectedSlice = SPIN_SLICES[winningIndex];

    const sliceAngle = 360 / SPIN_SLICES.length;
    // Calculate final rotation so the slice lands directly on top pointer (270 deg offset)
    const extraRotations = 360 * 5; // 5 full spins
    const targetDegree = extraRotations + (360 - winningIndex * sliceAngle - sliceAngle / 2);

    setRotationDegree(targetDegree);

    setTimeout(async () => {
      setIsSpinning(false);
      setWonPrize({ label: selectedSlice.label, amount: selectedSlice.amount });
      setHasSpunToday(true);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`tambola_last_spin_${currentUser.id}`, new Date().toDateString());
      }
      playWinningFanfare();
      // Credit to user's daily reward balance
      await claimRewardHelper(selectedSlice.amount, 'Daily Lucky Spin Reward');
    }, 4500);
  };

  const handleClaimStreakDay = async (dayIndex: number, bonusAmt: number) => {
    if (!isDepositor) {
      setShowDepositModal(true);
      return;
    }
    if (claimedStreakToday) return;
    setClaimedStreakToday(true);
    setDailyStreak((prev) => Math.min(prev + 1, 7));
    playWinningFanfare();
    await claimRewardHelper(bonusAmt, `Day ${dayIndex + 1} Daily Check-In Streak`);
  };

  const handleRevealScratch = async () => {
    if (!isDepositor) {
      setShowDepositModal(true);
      return;
    }
    if (scratchRevealed) return;
    const randomReward = SCRATCH_REWARDS[Math.floor(Math.random() * SCRATCH_REWARDS.length)];
    setScratchPrize(randomReward);
    setScratchRevealed(true);
    playWinningFanfare();
    await claimRewardHelper(randomReward.amount, 'Mystery Scratch Card Bonus');
  };

  const currentBonusWallet = currentUser.bonusRewardBalance ?? 0;

  return (
    <div className="space-y-8 pb-16">
      {/* 🔒 NON-DEPOSITOR WARNING & UNLOCK BANNER */}
      {!isDepositor ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950 via-amber-950/80 to-slate-950 border-2 border-amber-500/60 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    🔒 केवल एक्टिव डिपॉजिटर्स हेतु
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    पहला डिपॉजिट करने पर सभी रिवार्ड्स अनलॉक होंगे
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  रोज़ाना चेक-इन, लकी स्पिन और स्क्रैच कार्ड केवल डिपॉजिटर्स के लिए उपलब्ध हैं
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  आपने अभी तक कोई डिपॉजिट नहीं किया है। कृपया अपना <strong>पहला डिपॉजिट (कम से कम ₹100)</strong> करें। पहले डिपॉजिट पर <strong>₹10 का वेलकम बोनस सीधे टिकट वॉलेट में</strong> मिल जाएगा और रोज़ाना मुफ्त स्पिन, स्क्रैच कार्ड व 7-दिन चेक-इन रिवार्ड्स तुरंत अनलॉक हो जाएंगे!
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('wallet')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>अभी डिपॉजिट करें (Deposit & Unlock) →</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">
              ✓ एक्टिव डिपॉजिटर स्टेटस सक्रिय है — आपके सभी दैनिक स्पिन, स्क्रैच कार्ड और चेक-इन रिवार्ड्स अनलॉक हैं!
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 shrink-0">
            UNLOCKED
          </span>
        </div>
      )}

      {/* 🌟 Hot Pink & Gold Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950 border-2 border-pink-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-pink-500/20">
                <Gift className="w-3.5 h-3.5 text-pink-400" />
                <span>DAILY REWARDS • FOR DEPOSITORS</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                10 पैसे से ₹1.00 तक रोज़ाना इनाम
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              लकी स्पिन, स्क्रैच कार्ड और{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-400">
                10% एडमिन पेमेंट कैशबैक!
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              डिपॉजिटर यूज़र्स रोज़ाना मुफ्त स्पिन (10p, 20p, 30p, 50p, ₹1.00), स्क्रैच कार्ड व 7-डे चेक-इन से रिवार्ड इकट्ठा कर सकते हैं। <strong>जब भी आप एडमिन को पेमेंट/डिपॉजिट करेंगे, आपकी डिपॉजिट राशि का 10% सीधे टिकट वॉलेट में जुड़ जाएगा!</strong>
            </p>
          </div>

          {/* Reward Wallet Status Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border-2 border-pink-500/40 text-center space-y-2 self-start lg:self-center shadow-2xl min-w-[220px]">
            <div className="flex items-center justify-center gap-1 text-[11px] uppercase font-black text-pink-300">
              <Gift className="w-3.5 h-3.5 text-pink-400" />
              <span>दैनिक रिवार्ड वॉलेट</span>
            </div>
            <div className="text-3xl font-black text-pink-400 font-mono text-glow">
              ₹{currentBonusWallet.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">
              डिपॉजिट पर 10% अनलॉक होने हेतु तैयार
            </p>
            <button
              onClick={() => onNavigate('wallet')}
              className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1 shadow cursor-pointer"
            >
              <span>Recharge &amp; Unlock 10%</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 💡 10% DEPOSIT BONUS RULES & LIVE CALCULATION STRIP */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border-2 border-amber-400/40 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-black text-amber-300">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-bounce" />
          <span>⚡ यह रिवार्ड कैसे काम करता है? (डिपॉजिटर अनलॉक नियम)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-black text-pink-400 block text-xs">1. रोज़ाना रिवार्ड इकट्ठा करें:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              डिपॉजिटर यूज़र स्पिन व्हील, स्क्रैच कार्ड और 7-दिन चेक-इन से रोज़ 10 पैसे से लेकर ₹1.00 तक का बोनस रिवार्ड वॉलेट में जमा कर सकते हैं।
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-black text-emerald-400 block text-xs">2. एडमिन को डिपॉजिट करें:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              जब भी आप टिकट खरीदने हेतु ₹100, ₹200, ₹500 या कोई भी राशि एडमिन को यूपीआई/क्यूआर से रिचार्ज करते हैं।
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-1">
            <span className="font-black text-amber-300 block text-xs">3. 10% तुरंत टिकट वॉलेट में ऐड:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              जैसे ₹100 रिचार्ज पर <strong>₹10 रिवार्ड वॉलेट से अनलॉक होकर टिकट वॉलेट में जुड़ जाएगा</strong> (कुल ₹110 मिलेगा)।
            </p>
          </div>
        </div>

        {/* Live Example Box */}
        <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span className="text-slate-200">
              <strong>लाइव उदाहरण:</strong> आपके पास <strong>₹{currentBonusWallet.toFixed(2)}</strong> रिवार्ड बैलेंस है। यदि आप अभी <strong>₹100</strong> रिचार्ज करेंगे तो <strong>₹{Math.min(10, currentBonusWallet).toFixed(2)}</strong> रिवार्ड तुरंत अनलॉक होकर आपको कुल <strong>₹{(100 + Math.min(10, currentBonusWallet)).toFixed(2)}</strong> टिकट वॉलेट में मिलेगा!
            </span>
          </div>

          <button
            onClick={() => onNavigate('wallet')}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow"
          >
            अभी ₹100 रिचार्ज करें →
          </button>
        </div>
      </div>

      {/* 🎡 SECTION 1: INTERACTIVE LUCKY SPIN WHEEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Spin Wheel Stage */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/90 border-2 border-pink-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-xs font-black text-pink-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>DAILY LUCKY SPIN WHEEL (10P - ₹1.00)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
              {isDepositor ? '1 FREE / 24H' : '🔒 DEPOSITOR ONLY'}
            </span>
          </div>

          {/* Wheel Pointer */}
          <div className="absolute top-12 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 drop-shadow-[0_4px_8px_rgba(245,158,11,0.8)]" />
          </div>

          {/* SVG Rotating Wheel */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-4">
            <div
              className="w-full h-full rounded-full border-8 border-amber-400/80 shadow-[0_0_40px_rgba(236,72,153,0.4)] overflow-hidden transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
              style={{ transform: `rotate(${rotationDegree}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {SPIN_SLICES.map((slice, i) => {
                  const angle = 360 / SPIN_SLICES.length;
                  const startAngle = i * angle;
                  const endAngle = (i + 1) * angle;

                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  // Text position
                  const textAngle = startAngle + angle / 2;
                  const textX = 50 + 32 * Math.cos((Math.PI * textAngle) / 180);
                  const textY = 50 + 32 * Math.sin((Math.PI * textAngle) / 180);

                  return (
                    <g key={slice.id}>
                      <path d={pathData} fill={slice.color} stroke="#0f172a" strokeWidth="0.8" />
                      <text
                        x={textX}
                        y={textY}
                        fill={slice.textColor}
                        fontSize="3.2"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                      >
                        {slice.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Wheel Center Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-slate-950 border-4 border-amber-400 shadow-xl flex items-center justify-center pointer-events-none">
              <Sparkles className="w-7 h-7 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>

          {/* Spin Trigger Button */}
          <div className="space-y-2 text-center mt-2 w-full max-w-xs">
            {!isDepositor ? (
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>डिपॉजिट करें और स्पिन अनलॉक करें</span>
              </button>
            ) : (
              <button
                onClick={handleSpinWheel}
                disabled={isSpinning || hasSpunToday}
                className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                  hasSpunToday
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-pink-500/40 hover:brightness-110 active:scale-95'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>
                  {isSpinning
                    ? 'SPINNING...'
                    : hasSpunToday
                    ? 'SPUN TODAY (COME BACK TOMORROW)'
                    : 'SPIN WHEEL NOW (मुफ्त स्पिन करें)'}
                </span>
              </button>
            )}
            <p className="text-[11px] text-slate-400">
              {!isDepositor
                ? '🔒 केवल एक्टिव डिपॉजिटर खिलाड़ी ही लकी स्पिन घुमा सकते हैं।'
                : hasSpunToday
                ? 'अगला मुफ्त स्पिन आज रात 12:00 बजे रीसेट होगा।'
                : 'हर 24 घंटे में 1 मुफ्त स्पिन उपलब्ध (10p, 20p, 30p, 50p, ₹1.00)।'}
            </p>
          </div>
        </div>

        {/* Right: Win Announcement & Scratch Card */}
        <div className="lg:col-span-6 space-y-6">
          {wonPrize && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-900/60 to-purple-900/60 border-2 border-pink-400 p-6 space-y-3 shadow-2xl animate-bounce">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-pink-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>बधाई! आपने जीता (CONGRATULATIONS):</span>
              </div>
              <div className="text-3xl font-black text-white">{wonPrize.label} (₹{wonPrize.amount.toFixed(2)})</div>
              <p className="text-xs text-pink-200">
                ₹{wonPrize.amount.toFixed(2)} आपके दैनिक रिवार्ड वॉलेट में जुड़ गया है! अगली बार एडमिन पेमेंट पर इसका 10% आपके टिकट वॉलेट में क्रेडिट होगा।
              </p>
              <button
                onClick={() => onNavigate('wallet')}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-all cursor-pointer shadow"
              >
                रिचार्ज करें और रिवार्ड अनलॉक करें →
              </button>
            </div>
          )}

          {/* 🎁 Mystery Scratch Card (Max ₹1.00) */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-black text-white">Daily Mystery Scratch Card</h3>
                  <p className="text-[10px] text-slate-400">10 पैसे, 20 पैसे, 30 पैसे, 50 पैसे, ₹1.00 तक का इनाम</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                {isDepositor ? 'SECRET BONUS' : '🔒 LOCKED'}
              </span>
            </div>

            <div
              onClick={() => {
                if (!isDepositor) {
                  setShowDepositModal(true);
                } else {
                  handleRevealScratch();
                }
              }}
              className={`p-8 rounded-2xl border-2 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center space-y-2 ${
                !isDepositor
                  ? 'bg-slate-950/80 border-slate-800 text-amber-400/80 hover:border-amber-500/40'
                  : scratchRevealed
                  ? 'bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-400 text-emerald-300'
                  : 'bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-[1.02]'
              }`}
            >
              {!isDepositor ? (
                <>
                  <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
                  <div className="text-sm font-black uppercase text-amber-300">
                    🔒 डिपॉजिट के बाद स्क्रैच कार्ड अनलॉक होगा
                  </div>
                  <p className="text-xs text-slate-400">टैप करके पहला डिपॉजिट करें और रिवार्ड्स पाएं</p>
                </>
              ) : scratchRevealed && scratchPrize ? (
                <>
                  <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
                  <div className="text-xl font-black text-white">🎉 REVEALED: {scratchPrize.label}!</div>
                  <p className="text-xs text-emerald-300">
                    ₹{scratchPrize.amount.toFixed(2)} आपके रिवार्ड वॉलेट में सुरक्षित जुड़ गया है!
                  </p>
                </>
              ) : (
                <>
                  <Gift className="w-8 h-8 text-slate-950 animate-bounce" />
                  <div className="text-base font-black uppercase">SCRATCH TO REVEAL CASH (स्क्रैच करें)</div>
                  <p className="text-xs font-semibold opacity-90">यहाँ टैप करके अपना दैनिक स्क्रैच कार्ड खोलें</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 📅 SECTION 2: 7-DAY LOGIN STREAK REWARDS (10P - ₹1.00) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-purple-500/30 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">7-Day Daily Check-In Streak (दैनिक चेक-इन)</h2>
              <p className="text-xs text-slate-400">
                हर रोज़ लॉगिन करके 10 पैसे, 20 पैसे, 30 पैसे से लेकर ₹1.00 का मेगा बॉक्स क्लेम करें!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-500/30 text-xs font-bold text-purple-300">
            {isDepositor ? (
              <>
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Streak: {dailyStreak} / 7 Days</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>🔒 डिपॉजिट आवश्यक</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { day: 1, label: 'Day 1', reward: '10 पैसे', amount: 0.10 },
            { day: 2, label: 'Day 2', reward: '20 पैसे', amount: 0.20 },
            { day: 3, label: 'Day 3', reward: '30 पैसे', amount: 0.30 },
            { day: 4, label: 'Day 4', reward: '40 पैसे', amount: 0.40 },
            { day: 5, label: 'Day 5', reward: '50 पैसे', amount: 0.50 },
            { day: 6, label: 'Day 6', reward: '75 पैसे', amount: 0.75 },
            { day: 7, label: 'Day 7', reward: '₹1.00 MEGA', amount: 1.00, isMega: true },
          ].map((item, idx) => {
            const isCompleted = isDepositor && idx < dailyStreak;
            const isToday = isDepositor && idx === dailyStreak;
            return (
              <div
                key={item.day}
                onClick={() => {
                  if (!isDepositor) {
                    setShowDepositModal(true);
                  } else if (isToday && !claimedStreakToday) {
                    handleClaimStreakDay(idx, item.amount);
                  }
                }}
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between space-y-2 cursor-pointer ${
                  !isDepositor
                    ? 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:border-amber-500/30'
                    : isCompleted
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : isToday
                    ? 'bg-gradient-to-b from-purple-900/80 to-slate-900 border-purple-400 text-white ring-2 ring-purple-400 shadow-lg shadow-purple-500/30 scale-105'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-black uppercase">{item.label}</div>
                <div className="text-lg">
                  {!isDepositor ? '🔒' : item.isMega ? '👑' : isCompleted ? '✅' : '🎁'}
                </div>
                <div className="text-xs font-black text-amber-300">{item.reward}</div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    !isDepositor
                      ? 'bg-slate-800 text-slate-500'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : isToday
                      ? 'bg-purple-500 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {!isDepositor ? 'LOCKED' : isCompleted ? 'CLAIMED' : isToday ? (claimedStreakToday ? 'DONE' : 'CLAIM NOW') : 'LOCKED'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔐 DEPOSIT REQUIRED POPUP MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border-2 border-amber-400 shadow-2xl text-center space-y-4">
            <button
              onClick={() => setShowDepositModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">डिपॉजिट आवश्यक है!</h3>
              <p className="text-xs font-bold text-amber-400">
                Deposit Required to Unlock Daily Rewards
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>केवल एक्टिव डिपॉजिटर्स के लिए नियम:</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-300">
                <li>दैनिक चेक-इन, लकी स्पिन और स्क्रैच कार्ड केवल डिपॉजिट करने वाले खिलाड़ियों के लिए हैं।</li>
                <li>कम से कम <strong>₹100</strong> का पहला डिपॉजिट करें।</li>
                <li>पहले डिपॉजिट पर <strong>₹10 का वेलकम बोनस तुरंत टिकट वॉलेट में</strong> जमा हो जाएगा।</li>
                <li>डिपॉजिट होते ही सभी रोज़ाना रिवार्ड्स हमेशा के लिए अनलॉक हो जाएंगे!</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  onNavigate('wallet');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Wallet className="w-4 h-4" />
                <span>वॉलेट में जाएं और डिपॉजिट करें →</span>
              </button>

              <button
                onClick={() => setShowDepositModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs cursor-pointer transition-all"
              >
                बाद में (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

