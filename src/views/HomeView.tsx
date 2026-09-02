import React, { useState } from 'react';
import {
  Flame,
  Ticket,
  Trophy,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Gift,
  Coins,
  Play,
  Zap,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Dices,
  LayoutDashboard,
  Wallet,
  QrCode,
  MessageSquare,
  Settings,
  Radio,
  Gamepad2,
  Share2,
  FileText,
  Activity,
  Bell,
  Grid,
  Lock,
  Crown,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Percent,
  Check,
  Layers,
  Smartphone,
} from 'lucide-react';
import { TambolaGame, GameWinner, User } from '../types';
import { playNumberCallSound, speakNumberCall } from '../utils/audio';

interface HomeViewProps {
  games: TambolaGame[];
  winners: GameWinner[];
  currentUser?: User | null;
  onNavigate: (tab: string, gameId?: string) => void;
  onOpenDeposit: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenAdminLogin?: () => void;
  activeTemplateId?: string;
  onOpenTemplateSelector?: () => void;
}

// Tambola traditional calling nicknames
const TAMBOLA_NICKNAMES: Record<number, string> = {
  1: 'Son of a gun (1)',
  7: 'Lucky Number Seven (7)',
  11: 'Two beautiful legs (11)',
  13: 'Unlucky for some, lucky for us (13)',
  21: 'Royal Salute (21)',
  22: 'Two little ducks (22)',
  30: 'Flirty thirty (30)',
  44: 'All the fours, chor (44)',
  47: 'Year of Independence (47)',
  50: 'Golden Jubilee (50)',
  55: 'All the fives (55)',
  69: 'Any way up (69)',
  77: 'Two hockey sticks (77)',
  88: 'Two fat ladies (88)',
  90: 'Top of the house (90)',
};

export const HomeView: React.FC<HomeViewProps> = ({
  games,
  winners,
  currentUser,
  onNavigate,
  onOpenDeposit,
  onOpenAuth,
  onOpenAdminLogin,
  activeTemplateId = 'royal_gold',
  onOpenTemplateSelector,
}) => {
  const liveGame = games.find((g) => g.status === 'live');
  const upcomingGames = games.filter((g) => g.status === 'upcoming');
  const totalPrizePool = games.reduce((acc, g) => acc + g.prizePool, 0);

  // Interactive Mini Game: Lucky Number Roller
  const [luckyNumber, setLuckyNumber] = useState<number>(47);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [luckyCallText, setLuckyCallText] = useState<string>('Year of Independence (47)');

  // Interactive Referral Calculator State (8-Level: 2%, 1%, 0.5%, 0.4%, 0.3%, 0.2%, 0.1%, 0.1% = 4.6% on Ticket Play)
  const [friendsCount, setFriendsCount] = useState<number>(10);
  const [ticketsPerFriend, setTicketsPerFriend] = useState<number>(4);
  const ticketPrice = 50;

  // Calculate projected 8-level commission on ticket sales (No deposit commission)
  const dailyL1Sales = friendsCount * ticketsPerFriend * ticketPrice;
  const monthlyL1 = dailyL1Sales * 30 * 0.02;
  const monthlyL2To8 = dailyL1Sales * 30 * 0.026 * 3;
  const totalMonthlyEarnings = Math.round(monthlyL1 + monthlyL2To8);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleRollLuckyNumber = () => {
    if (isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * 90) + 1;
      setLuckyNumber(rand);
      count++;
      if (count > 12) {
        clearInterval(interval);
        const finalNum = Math.floor(Math.random() * 90) + 1;
        setLuckyNumber(finalNum);
        setIsRolling(false);
        const nickname = TAMBOLA_NICKNAMES[finalNum] || `Number ${finalNum}`;
        setLuckyCallText(nickname);
        playNumberCallSound();
        speakNumberCall(finalNum);
      }
    }, 70);
  };

  const getBallClass = (num: number) => {
    if (num <= 18) return 'ball-red';
    if (num <= 36) return 'ball-gold';
    if (num <= 54) return 'ball-green';
    if (num <= 72) return 'ball-blue';
    return 'ball-purple';
  };

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Live Animated Winner Marquee Ticker */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-purple-600 p-[1.5px] shadow-xl shadow-amber-500/10">
        <div className="flex items-center gap-3 bg-[#0a0f1d] px-4 py-2.5 rounded-2xl overflow-x-auto text-xs whitespace-nowrap">
          <span className="flex items-center gap-1.5 font-black uppercase text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40 shrink-0">
            <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" />
            <span>लाइव विनर्स व अपडेट्स</span>
          </span>

          <div className="flex items-center gap-6 text-slate-200 font-medium text-xs">
            <span className="flex items-center gap-2">
              <span className="tambola-ball-3d ball-red w-5 h-5 text-[10px]">7</span>
              <span>राहुल एस. ने जीता <strong>₹5,000 (1st Full House)</strong> - UPI पर भेजा गया!</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-2">
              <span className="tambola-ball-3d ball-gold w-5 h-5 text-[10px]">21</span>
              <span>पूजा एम. ने क्लेम किया <strong>₹1,200 (Top Line)</strong></span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-2">
              <span className="tambola-ball-3d ball-green w-5 h-5 text-[10px]">47</span>
              <span>विक्रम जे. ने जीता <strong>₹500 (Early Five)</strong></span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-2">
              <span className="tambola-ball-3d ball-purple w-5 h-5 text-[10px]">88</span>
              <span>आज 5-लेवल रेफरल कमीशन वितरित: <strong className="text-emerald-400">₹48,920</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* 🌟 2. VIP Logged-In User Quick Action & Balances Strip (अगर यूजर लॉगिन है) */}
      {currentUser && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171b30] via-[#20153b] to-[#171b30] border-2 border-amber-400/60 p-5 sm:p-7 shadow-2xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    नमस्ते, {currentUser.name}! 👋
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/40 uppercase">
                    KYC Verified
                  </span>
                  {currentUser.role === 'admin' && (
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  रेफरल कोड: <strong className="text-amber-300 font-mono">{currentUser.referralCode}</strong> • होम पेज पर आपका स्वागत है!
                </p>
              </div>
            </div>

            {/* Quick Balances Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-400/40 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">कुल वॉलेट</span>
                <span className="text-sm font-black text-amber-300 font-mono">
                  ₹{(currentUser?.walletBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-blue-400/40 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">टिकट बैलेंस</span>
                <span className="text-sm font-black text-blue-300 font-mono">
                  ₹{(currentUser?.depositBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-400/40 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">विथड्रॉल बैलेंस</span>
                <span className="text-sm font-black text-emerald-300 font-mono">
                  ₹{(currentUser?.winningBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-purple-400/40 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">रेफरल कमाई</span>
                <span className="text-sm font-black text-purple-300 font-mono">
                  ₹{(currentUser?.referralBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Direct One-Click Navigation Strip for Logged In User */}
          <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>📊 मेरा 11-बॉक्स डैशबोर्ड खोलें</span>
            </button>

            <button
              onClick={() => onNavigate('live')}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>🔴 लाइव रूम में जाएं</span>
            </button>

            <button
              onClick={() => onNavigate('buy-ticket')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-slate-950" />
              <span>🎟️ टिकट बुक करें</span>
            </button>

            <button
              onClick={onOpenDeposit}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>➕ पैसे जोड़ें (Deposit)</span>
            </button>

            <button
              onClick={() => onNavigate('wallet')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>💸 पैसे निकालें (Withdraw)</span>
            </button>

            <button
              onClick={() => onNavigate('referral')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>👥 5-लेवल रेफरल (7.8%)</span>
            </button>
          </div>
        </section>
      )}

      {/* 3. Brand New Grand Hero Festival Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121933] via-[#1c1236] to-[#280c29] border-2 border-amber-400/40 p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Glow Spheres */}
        <div className="absolute -top-28 -right-28 w-96 h-96 bg-red-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-28 w-96 h-96 bg-purple-600/35 rounded-full blur-3xl pointer-events-none" />

        {/* Floating 3D Tambola Balls */}
        <div className="hidden lg:block absolute top-8 right-12 pointer-events-none animate-float-ball">
          <div className="tambola-ball-3d ball-gold w-16 h-16 text-2xl font-black shadow-2xl">7</div>
        </div>
        <div className="hidden lg:block absolute bottom-10 right-1/3 pointer-events-none animate-float-ball" style={{ animationDelay: '1.2s' }}>
          <div className="tambola-ball-3d ball-red w-14 h-14 text-xl font-black shadow-2xl">21</div>
        </div>
        <div className="hidden lg:block absolute top-1/3 left-8 pointer-events-none animate-float-ball" style={{ animationDelay: '2.4s' }}>
          <div className="tambola-ball-3d ball-green w-12 h-12 text-base font-black shadow-2xl">47</div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headlines, Value Prop & Main CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <img
                src="/logo.png"
                alt="Apna Tambola Logo"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-xl shadow-amber-500/30 border-2 border-amber-400/80 shrink-0 animate-pulse"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/30 via-red-500/20 to-purple-600/30 border-2 border-amber-400/50 rounded-full px-4 py-1.5 text-xs font-black text-amber-300 shadow-lg">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="tracking-wider uppercase">भारत का #1 रियल-मनी तंबोला व हाउसी गेम</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
                लाइव तंबोला खेलें, <br />
                <span className="bg-gradient-to-r from-amber-300 via-red-400 to-pink-400 bg-clip-text text-transparent drop-shadow-md">
                  हर मैच में नकद जीतें!
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-200 max-w-xl font-normal leading-relaxed">
                भारत का सबसे लोकप्रिय ऑनलाइन मल्टीप्लेयर तंबोला! ऑटोमैटिक <strong>1 से 90 वॉइस नंबर कॉलिंग</strong>, विभिन्न रंगों के प्रिंटेबल टिकट्स, <strong>पहले डिपॉजिट पर ₹10 बोनस</strong> और <strong>10-सेकंड में सीधा UPI विथड्रॉल</strong>!
              </p>
            </div>

            {/* Main Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* 🎁 Instant Signup CTA with Bonus if not logged in */}
              {!currentUser ? (
                <button
                  id="hero-signup-btn"
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth('register');
                    else onNavigate('profile');
                  }}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Gift className="w-5 h-5 text-slate-950" />
                  <span>साइन अप करें (₹10 डिपॉजिट बोनस)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="hero-dashboard-btn"
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <LayoutDashboard className="w-5 h-5 text-amber-300" />
                  <span>📊 मेरा 11-बॉक्स डैशबोर्ड</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* ⚡ Play Live */}
              <button
                id="hero-play-live-btn"
                onClick={() => onNavigate('live')}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-black text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-red-600/30 hover:scale-105 transition-all cursor-pointer border border-red-400/40"
              >
                <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
                <span>लाइव रूम में जाएं</span>
              </button>

              {/* 🎟️ Buy Tickets */}
              <button
                id="hero-buy-tickets-btn"
                onClick={() => onNavigate('buy-ticket')}
                className="px-5 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/50 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>टिकट बुक करें (₹10)</span>
              </button>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/60">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-900/80 border border-amber-400/40 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">कुल प्राइज पूल</span>
                <span className="text-base sm:text-lg font-black text-amber-200">
                  ₹{(totalPrizePool || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-slate-900/80 border border-purple-400/40 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-300 block">लाइव एक्टिव खिलाड़ी</span>
                <span className="text-base sm:text-lg font-black text-purple-200">1,480+ ऑनलाइन</span>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-900/80 border border-emerald-400/40 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">UPI विथड्रॉल</span>
                <span className="text-base sm:text-lg font-black text-emerald-200">10-सेकंड इंस्टेंट</span>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-slate-900/80 border border-red-400/40 text-center">
                <span className="text-[10px] uppercase font-bold text-red-300 block">RNG फेयर ड्रा</span>
                <span className="text-base sm:text-lg font-black text-red-200">100% सर्टिफाइड</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Match Arena Spotlight Card */}
          <div className="lg:col-span-5">
            {liveGame ? (
              <div className="relative rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900/95 to-[#12182c] p-6 border-2 border-amber-400/60 shadow-2xl space-y-5">
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span className="bg-red-600 text-white font-black text-xs px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                      🔴 लाइव मैच चालू है
                    </span>
                  </div>
                  <span className="font-mono text-xs text-amber-300 font-bold bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-500/40">
                    {liveGame.gameCode}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{liveGame.title}</h3>
                  <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                    ग्रैंड बंपर प्राइज पूल: <strong className="text-amber-400 text-sm">₹{(liveGame?.prizePool || 0).toLocaleString('en-IN')}</strong>
                  </p>
                </div>

                {/* Big 3D Ball Caller Visual */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-400/40 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-amber-400/20 animate-pulse-ring absolute inset-0 -m-1" />
                      <div className={`tambola-ball-3d ${getBallClass(liveGame.currentNumber || 47)} w-16 h-16 text-2xl font-black`}>
                        {liveGame.currentNumber || '47'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-amber-400 block tracking-wider">वर्तमान नंबर (CALL)</span>
                      <span className="text-sm font-bold text-slate-100">
                        {TAMBOLA_NICKNAMES[liveGame.currentNumber || 47] || `नंबर #${liveGame.currentNumber || 47}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">हाल ही के नंबर</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {liveGame.previousNumbers.slice(0, 4).map((n, i) => (
                        <div key={i} className={`tambola-ball-3d ${getBallClass(n)} w-7 h-7 text-[11px]`}>
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Prizes Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 flex justify-between items-center">
                    <span className="text-slate-300 font-bold">1st Full House</span>
                    <span className="text-amber-400 font-black">₹4,500</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-400/30 flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Early 5</span>
                    <span className="text-purple-300 font-black">₹500</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Top Line</span>
                    <span className="text-emerald-300 font-black">₹1,200</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Bottom Line</span>
                    <span className="text-cyan-300 font-black">₹1,200</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('live', liveGame.id)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/40 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>लाइव एरीना में प्रवेश करें (Enter Match)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 text-center space-y-4 border border-amber-400/30">
                <Clock className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">अगला ग्रैंड टूर्नामेंट जल्द शुरू होगा</h3>
                <button
                  onClick={() => onNavigate('buy-ticket')}
                  className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs"
                >
                  एडवांस में टिकट खरीदें
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 🎟️ 4. सेक्शन: टिकट के बारे में संपूर्ण जानकारी (Everything About Tickets) */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121933] via-[#1a1233] to-[#121933] border-2 border-emerald-500/40 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/40">
              <Ticket className="w-4 h-4" />
              <span>टिकट संरचना, 6-टिकट सेट व रंगीन थीम्स</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              🎟️ टिकट के बारे में सब कुछ (Everything About Tickets)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              तंबोला लाइव पर हर टिकट गणितीय रूप से संतुलित, निष्पक्ष और सर्टिफाइड RNG द्वारा तैयार किया जाता है।
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('buy-ticket')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>अभी टिकट खरीदें</span>
            </button>
            <button
              onClick={() => onNavigate('my-tickets')}
              className="px-4 py-3 rounded-2xl bg-slate-950/90 text-emerald-300 border border-emerald-400/40 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>मेरे टिकट्स</span>
            </button>
          </div>
        </div>

        {/* 4 Feature Cards About Tickets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-base">
              15
            </div>
            <h3 className="text-base font-black text-white">3 पंक्तियाँ × 15 नंबर</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              प्रत्येक टिकट में 3 पंक्तियां और 9 कॉलम होते हैं। हर पंक्ति में 5 रैंडम नंबर और 4 खाली खाने होते हैं।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-base">
              6x
            </div>
            <h3 className="text-base font-black text-white">6-टिकट फुल शीट गारंटी</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              6 टिकटों के पूरे सेट में 1 से 90 तक के <strong>सभी 90 नंबर</strong> बिना दोहराव के मौजूद होते हैं। हर नंबर पर आपका कोई न कोई टिकट अवश्य कटेगा!
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-base">
              🎨
            </div>
            <h3 className="text-base font-black text-white">5 प्रीमियम रंगीन थीम्स</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              गोल्डन सनबर्स्ट, रूबी रेड, एमराल्ड ग्रीन, नीलम ब्लू और एमेथिस्ट पर्पल में टिकट चुनें और कस्टमाइज करें।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-base">
              ⚡
            </div>
            <h3 className="text-base font-black text-white">ऑटो-डबिंग (Auto-Daubing)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              यदि आप व्यस्त हैं, तो ऑटो मोड ऑन करें। सिस्टम अपने आप नंबर काटेगा और जीतने पर तुरंत क्लेम करेगा।
            </p>
          </div>
        </div>
      </section>

      {/* 💰 5. सेक्शन: डिपॉजिट एवं पैसे जोड़ने के बारे में (Everything About Deposits) */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#101c2b] via-[#122238] to-[#101c2b] border-2 border-blue-500/40 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/40">
              <ArrowDownLeft className="w-4 h-4" />
              <span>सुरक्षित UPI, QR कोड व नेटबैंकिंग डिपॉजिट्स</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              💳 डिपॉजिट (पैसे जोड़ने) के बारे में जानकारी
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              100% सुरक्षित और त्वरित डिपॉजिट। 0% अतिरिक्त शुल्क और 10 सेकंड में आपके टिकट वॉलेट में राशि तैयार।
            </p>
          </div>

          <button
            onClick={onOpenDeposit}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer shrink-0"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>➕ तुरंत पैसे जोड़ें (Deposit)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-500 text-slate-950 font-black text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-sm text-white">राशि चुनें</h3>
            </div>
            <p className="text-xs text-slate-300">
              वॉलेट पेज पर जाएं और पसंदीदा राशि (₹50, ₹100, ₹500, ₹1,000 या अपनी पसंद की रकम) चुनें।
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[10px] font-bold">₹50</span>
              <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[10px] font-bold">₹100</span>
              <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[10px] font-bold">₹500</span>
              <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[10px] font-bold">₹1,000</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-500 text-slate-950 font-black text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-sm text-white">UPI या QR से भुगतान करें</h3>
            </div>
            <p className="text-xs text-slate-300">
              PhonePe, Google Pay, Paytm, BHIM UPI या किसी भी बैंक UPI ऐप द्वारा QR कोड स्कैन करके सीधा भुगतान करें।
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>✓ PhonePe</span>
              <span>✓ Google Pay</span>
              <span>✓ Paytm</span>
              <span>✓ BHIM</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-500 text-slate-950 font-black text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-sm text-white">10-सेकंड में बैलेंस तैयार</h3>
            </div>
            <p className="text-xs text-slate-300">
              भुगतान पूरा होते ही राशि सीधे आपके टिकट वॉलेट में जुड़ जाती है, जिससे आप तुरंत मैच में टिकट खरीद सकते हैं।
            </p>
            <span className="inline-block text-[11px] font-bold text-emerald-400">
              🎁 100% वेलकम बोनस कोड: TAMBOLA100
            </span>
          </div>
        </div>
      </section>

      {/* 💸 6. सेक्शन: विथड्रॉवल एवं पैसे निकालने के बारे में (Everything About Withdrawals) */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1c1228] via-[#281538] to-[#1c1228] border-2 border-pink-500/40 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-pink-400 bg-pink-500/20 px-3 py-1 rounded-full border border-pink-400/40">
              <ArrowUpRight className="w-4 h-4" />
              <span>10-सेकंड इंस्टेंट बैंक व UPI विथड्रॉल</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              💸 विथड्रॉवल (पैसे निकालने) के बारे में जानकारी
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              आपकी जीती हुई राशि और रेफरल कमीशन 100% निकासी योग्य है। न्यूनतम विथड्रॉल केवल ₹50 है!
            </p>
          </div>

          <button
            onClick={() => onNavigate('wallet')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-pink-500/30 transition-all cursor-pointer shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>💸 विथड्रॉल लगाएं (Withdraw)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-pink-500/30 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-base">
              ₹50
            </div>
            <h3 className="font-bold text-sm text-white">न्यूनतम निकासी मात्र ₹50</h3>
            <p className="text-xs text-slate-300">
              छोटी से छोटी जीत भी आप आसानी से सीधे अपने UPI या बैंक खाते में निकाल सकते हैं।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-pink-500/30 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-base">
              10s
            </div>
            <h3 className="font-bold text-sm text-white">10-सेकंड इंस्टेंट पेआउट</h3>
            <p className="text-xs text-slate-300">
              ऑटोमेटेड IMPS और UPI गेटवे द्वारा पैसे सीधे आपके बैंक खाते में 10 सेकंड में पहुंचते हैं।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-pink-500/30 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-base">
              0%
            </div>
            <h3 className="font-bold text-sm text-white">0% विथड्रॉल शुल्क</h3>
            <p className="text-xs text-slate-300">
              कोई अतिरिक्त या छुपा हुआ कटौती शुल्क नहीं। जितनी रकम आप विथड्रॉ करेंगे, पूरी आपके खाते में आएगी।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-pink-500/30 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-base">
              🛡️
            </div>
            <h3 className="font-bold text-sm text-white">100% सुरक्षित व ऑडिटेड</h3>
            <p className="text-xs text-slate-300">
              प्रत्येक विथड्रॉल के लिए पासबुक रसीद और यूटीआर नंबर तुरंत उपलब्ध कराया जाता है।
            </p>
          </div>
        </div>
      </section>

      {/* 🌟 7. सेक्शन: इनकम एवं कमाई के सभी स्रोत (All Income Streams) */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1c1830] via-[#2a1738] to-[#1c1830] border-2 border-amber-400/50 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
              <TrendingUp className="w-4 h-4" />
              <span>तंबोला लाइव पर कमाई के 4 बड़े माध्यम</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              💰 इनकम एवं कमाई के सभी अवसर (All Income Sources)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              सिर्फ गेम खेलने से ही नहीं, बल्कि रेफरल नेटवर्क, डेली स्पिन और टूर्नामेंट जैकपॉट्स से भी दैनिक हजारों रुपये कमाएं:
            </p>
          </div>

          <button
            onClick={() => onNavigate('referral')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>👥 5-लेवल रेफरल प्रोग्राम देखें</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Income 1 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-400/30 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">इनकम स्रोत 1</span>
            <h3 className="text-base font-black text-white">🎮 7 गेम विनिंग प्राइजेस</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Early 5, Four Corners, Top Line, Middle Line, Bottom Line, 1st Full House व 2nd Full House में <strong>10x से 100x</strong> तक का कैश रिटर्न।
            </p>
          </div>

          {/* Income 2 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-400/30 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">इनकम स्रोत 2</span>
            <h3 className="text-base font-black text-white">👥 5-लेवल 7.8% रेफरल</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              L1: 4%, L2: 2%, L3: 1%, L4: 0.5%, L5: 0.3% - आपके 5 पीढ़ियों के नेटवर्क में हर टिकट बिक्री पर लाइफटाइम कमीशन।
            </p>
          </div>

          {/* Income 3 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-pink-400/30 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-pink-400 block tracking-wider">इनकम स्रोत 3</span>
            <h3 className="text-base font-black text-white">🎁 डेली स्पिन व चेक-इन</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              प्रतिदिन लॉग इन करें और व्हील घुमाकर ₹5 से ₹100 तक का मुफ्त कैश बोनस और गेम पासेस प्राप्त करें।
            </p>
          </div>

          {/* Income 4 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-400/30 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">इनकम स्रोत 4</span>
            <h3 className="text-base font-black text-white">🏆 वीकली लीडरबोर्ड जैकपॉट</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              हर हफ्ते सबसे ज्यादा गेम जीतने और रेफर करने वाले टॉप 10 लीडर्स को विशेष ₹25,000 का पूल बोनस।
            </p>
          </div>
        </div>
      </section>

      {/* 8. 8-Level Referral Income Calculator */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121933] via-[#1f1538] to-[#121933] p-6 sm:p-10 border-2 border-amber-400/40 shadow-2xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>8-लेवल रेफरल नेटवर्क कमीशन कैलकुलेटर</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              8 स्तरों में 4.6% तक लाइफटाइम पैसिव कमीशन कमाएं!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              अपना रेफरल लिंक WhatsApp, Telegram या Instagram पर शेयर करें। आपके 8-लेवल नेटवर्क में जब भी कोई टिकट खरीदेगा, आपको तुरंत कमीशन मिलेगा! (नोट: कमीशन केवल टिकट गेम खेलने पर बनेगा, पेमेंट डिपॉजिट पर 0% कमीशन है)
            </p>
          </div>

          <button
            onClick={() => onNavigate('referral')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all self-start lg:self-auto cursor-pointer"
          >
            <span>रेफरल लिंक प्राप्त करें</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 8-Level Commission Tiers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-950 border-2 border-amber-400/50 text-center space-y-1 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">L1 (Direct)</span>
            <div className="text-2xl font-black text-amber-300">2.0%</div>
            <p className="text-[10px] text-slate-300">डायरेक्ट मित्र</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-600/20 to-slate-950 border border-purple-500/40 text-center space-y-1 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">LEVEL 2</span>
            <div className="text-2xl font-black text-purple-200">1.0%</div>
            <p className="text-[10px] text-slate-300">मित्रों के मित्र</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-600/20 to-slate-950 border border-blue-500/40 text-center space-y-1 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">LEVEL 3</span>
            <div className="text-2xl font-black text-blue-200">0.5%</div>
            <p className="text-[10px] text-slate-300">तीसरी पीढ़ी</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-indigo-600/20 to-slate-950 border border-indigo-500/40 text-center space-y-1 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">LEVEL 4</span>
            <div className="text-2xl font-black text-indigo-200">0.4%</div>
            <p className="text-[10px] text-slate-300">चौथी पीढ़ी</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-teal-600/20 to-slate-950 border border-teal-500/40 text-center space-y-1 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 block">LEVEL 5</span>
            <div className="text-2xl font-black text-teal-200">0.3%</div>
            <p className="text-[10px] text-slate-300">पाँचवी पीढ़ी</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-600/20 to-slate-950 border border-emerald-500/40 text-center space-y-1 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">LEVEL 6</span>
            <div className="text-2xl font-black text-emerald-200">0.2%</div>
            <p className="text-[10px] text-slate-300">छठी पीढ़ी</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-cyan-600/20 to-slate-950 border border-cyan-500/40 text-center space-y-1 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">LEVEL 7</span>
            <div className="text-2xl font-black text-cyan-200">0.1%</div>
            <p className="text-[10px] text-slate-300">सातवीं पीढ़ी</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-rose-600/20 to-slate-950 border border-rose-500/40 text-center space-y-1 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">LEVEL 8</span>
            <div className="text-2xl font-black text-rose-200">0.1%</div>
            <p className="text-[10px] text-slate-300">आठवीं पीढ़ी</p>
          </div>
        </div>

        {/* Interactive Earnings Calculator Widget */}
        <div className="rounded-2xl bg-slate-950/80 p-5 sm:p-6 border border-amber-400/30 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex justify-between">
              <span>आपके डायरेक्ट मित्र (Level 1):</span>
              <strong className="text-amber-400 text-sm font-black">{friendsCount} खिलाड़ी</strong>
            </label>
            <input
              type="range"
              min="2"
              max="50"
              value={friendsCount}
              onChange={(e) => setFriendsCount(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex justify-between">
              <span>प्रति खिलाड़ी दैनिक टिकट:</span>
              <strong className="text-purple-300 text-sm font-black">{ticketsPerFriend} टिकट्स</strong>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={ticketsPerFriend}
              onChange={(e) => setTicketsPerFriend(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-emerald-500/20 border border-amber-400/40 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">अनुमानित मासिक पैसिव कमाई</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">
              ₹{(totalMonthlyEarnings || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-400 font-bold block">✓ सीधे बैंक / UPI में निकासी योग्य</span>
          </div>
        </div>
      </section>

      {/* 9. Complete User Directory */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5" />
              <span>वेबसाइट संपूर्ण डायरेक्टरी • 12 मुख्य फीचर्स</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              यूज़र पोर्टल के सभी मुख्य विकल्प
            </h2>
          </div>
        </div>

        {/* User Options Quick Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>12 यूज़र फीचर्स (डैशबोर्ड, टिकट्स, 3-वॉलेट, 5-लेवल MLM, KYC, विनर्स)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {[
              { id: 'dashboard', label: '1. मेरा डैशबोर्ड', icon: LayoutDashboard, color: 'text-amber-400', desc: '11 रंग-बिरंगे बॉक्स' },
              { id: 'live', label: '2. लाइव हाउसी', icon: Flame, color: 'text-red-400', desc: '1-90 वॉइस कॉलर' },
              { id: 'buy-ticket', label: '3. टिकट खरीदें', icon: Ticket, color: 'text-amber-400', desc: '₹10 मल्टी-थीम' },
              { id: 'my-tickets', label: '4. मेरे टिकट्स', icon: QrCode, color: 'text-purple-400', desc: 'प्रिंट व डाउनलोड' },
              { id: 'wallet', label: '5. वॉलेट व निकासी', icon: Wallet, color: 'text-emerald-400', desc: 'इंस्टेंट UPI पेआउट' },
              { id: 'referral', label: '6. 8-लेवल रेफरल', icon: Share2, color: 'text-cyan-400', desc: '4.6% लाइफटाइम MLM' },
              { id: 'games', label: '7. टूर्नामेंट लॉबी', icon: Gamepad2, color: 'text-indigo-400', desc: 'आगामी जैकपॉट' },
              { id: 'winners', label: '8. हॉल ऑफ़ विनर्स', icon: Trophy, color: 'text-yellow-400', desc: 'रियल विनर्स फीड' },
              { id: 'profile', label: '9. प्रोफ़ाइल व बैंक', icon: Users, color: 'text-teal-400', desc: 'बैंक/UPI व पासबुक' },
              { id: 'daily-bonus', label: '10. डेली बोनस', icon: Sparkles, color: 'text-pink-400', desc: 'मुफ्त डेली स्पिन' },
              { id: 'how-to-play', label: '11. नियम व गाइड', icon: HelpCircle, color: 'text-lime-400', desc: 'हाउसी खेलने के नियम' },
              { id: 'support', label: '12. 24/7 हेल्पडेस्क', icon: MessageSquare, color: 'text-orange-400', desc: 'लाइव सपोर्ट टिकट्स' },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => onNavigate(mod.id)}
                  className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-400/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${mod.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
                      {mod.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{mod.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. Interactive Lucky Ball Roller Mini-Game Station */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 border-2 border-purple-500/40 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
              <Dices className="w-4 h-4 text-amber-400" />
              <span>इंटरएक्टिव फन स्टेशन</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              अपना लकी तंबोला बॉल घुमाएं (1 से 90)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              मैच से पहले अपनी किस्मत आजमाएं! नीचे दिए गए बटन पर क्लिक करें, असली 3D तंबोला केज घूमेगा और प्रामाणिक हाउसी वॉइस कॉल सुनाई देगा।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* 3D Ball Showcase */}
            <div className="flex items-center gap-4 bg-slate-950/90 p-4 rounded-3xl border-2 border-purple-400/40 shadow-xl">
              <div className={`tambola-ball-3d ${getBallClass(luckyNumber)} w-20 h-20 text-3xl font-black ${isRolling ? 'animate-spin' : 'animate-float-ball'}`}>
                {luckyNumber}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider block">कॉलर निकनेम</span>
                <span className="text-sm font-black text-amber-300 block">{luckyCallText}</span>
                <span className="text-[11px] text-slate-400 block font-medium">बॉल कलर: <strong className="text-white capitalize">{getBallClass(luckyNumber).replace('ball-', '')}</strong></span>
              </div>
            </div>

            <button
              id="spin-lucky-ball-btn"
              onClick={handleRollLuckyNumber}
              disabled={isRolling}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Dices className={`w-5 h-5 text-amber-300 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'केज घूम रहा है...' : 'लकी बॉल रोल करें'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. Official Tambola Winning Patterns (7 Ways to Win) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>जीतने के 7 तरीके (Winning Patterns)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            हर तंबोला मैच में नकद जीतने के 7 आसान तरीके!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            प्रत्येक टिकट में 15 नंबर (3 पंक्तियाँ × 9 कॉलम) होते हैं। जैसे ही नंबर कॉल हो, अपने टिकट पर स्ट्राइक करें और तुरंत नकद क्लेम करें:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pattern 1: Early Five */}
          <div className="rounded-2xl bg-gradient-to-b from-purple-900/40 to-slate-950 border border-purple-500/30 p-5 space-y-3 shadow-lg hover:border-amber-400/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 uppercase">स्पीड क्लेम</span>
              <span className="bg-purple-500/20 text-purple-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-400/40">
                10x रिटर्न
              </span>
            </div>
            <h3 className="text-lg font-black text-white">Early Five (जल्दी 5)</h3>
            <p className="text-xs text-slate-300">अपने टिकट पर कोई भी 5 नंबर सबसे पहले काटने वाले खिलाड़ी को।</p>
            <div className="grid grid-cols-5 gap-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold text-center">
              <span className="p-1 rounded bg-purple-600 text-white">✓ 7</span>
              <span className="p-1 rounded bg-slate-800 text-slate-500">14</span>
              <span className="p-1 rounded bg-purple-600 text-white">✓ 23</span>
              <span className="p-1 rounded bg-purple-600 text-white">✓ 45</span>
              <span className="p-1 rounded bg-purple-600 text-white">✓ 89</span>
            </div>
          </div>

          {/* Pattern 2: Four Corners */}
          <div className="rounded-2xl bg-gradient-to-b from-blue-900/40 to-slate-950 border border-blue-500/30 p-5 space-y-3 shadow-lg hover:border-amber-400/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-300 uppercase">कोने का स्ट्राइक</span>
              <span className="bg-blue-500/20 text-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-400/40">
                15x रिटर्न
              </span>
            </div>
            <h3 className="text-lg font-black text-white">Four Corners (चार कोने)</h3>
            <p className="text-xs text-slate-300">ऊपर और नीचे की पंक्ति के पहले और आखिरी 4 नंबर।</p>
            <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold text-center">
              <span className="p-1 rounded bg-blue-600 text-white">✓ TopL</span>
              <span className="p-1 rounded bg-slate-800 text-slate-500">-</span>
              <span className="p-1 rounded bg-slate-800 text-slate-500">-</span>
              <span className="p-1 rounded bg-blue-600 text-white">✓ TopR</span>
            </div>
          </div>

          {/* Pattern 3: Line Strikes */}
          <div className="rounded-2xl bg-gradient-to-b from-emerald-900/40 to-slate-950 border border-emerald-500/30 p-5 space-y-3 shadow-lg hover:border-amber-400/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 uppercase">3 पंक्तियाँ</span>
              <span className="bg-emerald-500/20 text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/40">
                25x रिटर्न
              </span>
            </div>
            <h3 className="text-lg font-black text-white">Top, Mid &amp; Bottom Line</h3>
            <p className="text-xs text-slate-300">किसी भी क्षैतिज पंक्ति (Row) के सभी 5 नंबर पूरे होने पर।</p>
            <div className="grid grid-cols-5 gap-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold text-center">
              <span className="p-1 rounded bg-emerald-600 text-white">✓ 11</span>
              <span className="p-1 rounded bg-emerald-600 text-white">✓ 24</span>
              <span className="p-1 rounded bg-emerald-600 text-white">✓ 38</span>
              <span className="p-1 rounded bg-emerald-600 text-white">✓ 59</span>
              <span className="p-1 rounded bg-emerald-600 text-white">✓ 76</span>
            </div>
          </div>

          {/* Pattern 4: 1st Full House Grand Bumper */}
          <div className="rounded-2xl bg-gradient-to-b from-amber-900/40 via-red-900/30 to-slate-950 border-2 border-amber-400/60 p-5 space-y-3 shadow-xl hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase">मेगा बंपर जैकपॉट</span>
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                100x रिटर्न
              </span>
            </div>
            <h3 className="text-lg font-black text-white">1st Full House (हाउसी)</h3>
            <p className="text-xs text-amber-200/90 font-medium">टिकट के सभी 15 नंबर सबसे पहले पूरा करने वाले विजेता को!</p>
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-[11px] font-black text-amber-300 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ग्रैंड बंपर कैश प्राइज (₹4,500+)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Upcoming Tournaments with Color Badges */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              आगामी टूर्नामेंट्स एवं दैनिक मैचेस
            </h2>
          </div>
          <button
            onClick={() => onNavigate('games')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>सभी मैच देखें</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {upcomingGames.map((game) => (
            <div
              key={game.id}
              className="rounded-3xl bg-gradient-to-b from-slate-900 to-[#0e1424] border border-purple-500/30 hover:border-amber-400/60 p-6 space-y-4 shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="bg-purple-900/80 text-purple-200 font-bold px-2.5 py-1 rounded-lg border border-purple-500/40 font-mono">
                  {game.gameCode}
                </span>
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{game.startTime}</span>
                </span>
              </div>

              <div>
                <h3 className="font-black text-lg text-white group-hover:text-amber-300 transition-colors">
                  {game.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {game.rules}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block font-bold">प्राइज पूल</span>
                  <span className="font-black text-amber-400 text-base">
                    ₹{(game?.prizePool || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block font-bold">टिकट मूल्य</span>
                  <span className="font-black text-slate-100 text-base">
                    ₹{game.ticketPrice} / टिकट
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onNavigate('buy-ticket', game.id)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>टिकट बुक करें</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 13. Hall of Recent Winners & Live Proofs */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900/90 to-[#10172e] p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                हाल ही के विजेता (Hall of Fame)
              </h2>
              <p className="text-xs text-slate-400">दैनिक रूप से वितरित वास्तविक नकद पुरस्कार व लाइव यूपीआई पेआउट्स</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('winners')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>सभी 50+ विजेता</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {winners.slice(0, 6).map((win, idx) => (
            <div
              key={win.id || idx}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-amber-400/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm">
                  {win.userName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">{win.userName}</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold">
                      ✓ Paid
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-300 font-medium block">
                    {win.prizeName}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-emerald-400 block font-mono">
                  +₹{(win?.prizeAmount || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-500">{win.timestamp || 'Just now'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 14. How to Play (4 Simple Steps) */}
      <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-[#121933] via-slate-900 to-[#121933] border border-slate-800 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>शुरुआत कैसे करें</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            तंबोला खेलना और जीतना बेहद आसान है!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            केवल 4 सरल चरणों में आप लाइव मैच में शामिल हो सकते हैं और नकद जीत सकते हैं:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-black text-xl mx-auto">
              1
            </div>
            <h3 className="font-bold text-sm text-white">खाता बनाएं (साइन अप)</h3>
            <p className="text-xs text-slate-400">
              मोबाइल नंबर या गूगल से 10-सेकंड में रजिस्टर करें और <strong>₹10 फ्री बोनस</strong> प्राप्त करें।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-xl mx-auto">
              2
            </div>
            <h3 className="font-bold text-sm text-white">टिकट बुक करें</h3>
            <p className="text-xs text-slate-400">
              अपनी पसंद के मैच में ₹10, ₹25 या ₹50 का रंग-बिरंगा टिकट चुनें। 6-टिकट सेट भी उपलब्ध हैं।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-red-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-black text-xl mx-auto">
              3
            </div>
            <h3 className="font-bold text-sm text-white">लाइव वॉइस कॉल सुनें</h3>
            <p className="text-xs text-slate-400">
              मैच के समय लाइव रूम में आएं, कॉलर द्वारा पुकारे गए नंबर टिकट पर काटें (ऑटो-डबिंग भी उपलब्ध)।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-xl mx-auto">
              4
            </div>
            <h3 className="font-bold text-sm text-white">तुरंत नकद निकालें</h3>
            <p className="text-xs text-slate-400">
              पैटर्न पूरा होते ही क्लेम बटन दबाएं और जीती हुई राशि सीधे अपने बैंक या UPI खाते में निकालें।
            </p>
          </div>
        </div>
      </section>

      {/* 15. FAQ Accordion Section */}
      <section className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
            अक्सर पूछे जाने वाले प्रश्न (FAQ)
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            क्या आपके मन में कोई सवाल है?
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {[
            {
              q: 'क्या तंबोला लाइव गेम खेलना कानूनी और सुरक्षित है?',
              a: 'हाँ, तंबोला (हाउसी) भारत में कौशल-आधारित (Skill-based) गेमिंग के अंतर्गत आता है। हमारा प्लेटफॉर्म 100% सुरक्षित, 256-बिट एन्क्रिप्टेड और सर्टिफाइड RNG (रैंडम नंबर जनरेटर) द्वारा संचालित है।',
            },
            {
              q: '₹10 का फ्री वेलकम बोनस कैसे मिलेगा?',
              a: 'जैसे ही आप अपने मोबाइल नंबर या गूगल खाते से रजिस्टर करते हैं, ₹10 का बोनस तुरंत आपके विथड्रॉल वॉलेट में जमा हो जाता है, जिसे आप खेलने या निकालने में उपयोग कर सकते हैं।',
            },
            {
              q: 'विथड्रॉल (पैसे निकालने) में कितना समय लगता है?',
              a: 'हमारे सभी विथड्रॉल 100% इंस्टेंट UPI और IMPS बैंक ट्रांसफर द्वारा प्रोसेस किए जाते हैं। अनुरोध करने के 10 सेकंड से 15 मिनट के अंदर पैसे आपके खाते में पहुँच जाते हैं।',
            },
            {
              q: '5-लेवल रेफरल कमीशन कैसे काम करता है?',
              a: 'जब आप अपने दोस्तों को आमंत्रित करते हैं, तो आपको लेवल 1 पर 4%, लेवल 2 पर 2%, लेवल 3 पर 1%, लेवल 4 पर 0.5% और लेवल 5 पर 0.3% कमीशन उनके द्वारा खरीदे गए हर टिकट पर आजीवन मिलता है।',
            },
            {
              q: 'रजिस्ट्रेशन और लॉगिन कैसे करें?',
              a: 'आप ऊपर दिए गए "लॉगिन / साइन अप" बटन पर क्लिक करके अपना मोबाइल नंबर/ईमेल और पासवर्ड डालकर तुरंत नया अकाउंट बना सकते हैं और ₹10 वेलकम बोनस पा सकते हैं। बिना लॉगिन आईडी पासवर्ड के कोई अन्य व्यक्ति आपका खाता नहीं खोल सकता।',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:text-amber-300 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-amber-400 shrink-0 transition-transform ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-300 border-t border-slate-800/80 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 16. Bottom Sticky / Floating Join Bar for Visitors */}
      {!currentUser && (
        <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-slate-950/95 via-purple-950/95 to-slate-950/95 border-2 border-amber-400/60 p-3 sm:p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shrink-0 animate-bounce">
              🎁
            </div>
            <div className="truncate">
              <span className="text-xs font-black text-white block truncate">
                मुफ्त ₹10 विथड्रॉल बोनस पाएं!
              </span>
              <span className="text-[10px] text-amber-300 font-medium hidden sm:block">
                10-सेकंड मोबाइल ओटीपी साइन अप • 100% निकासी योग्य
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenAuth ? onOpenAuth('register') : onNavigate('profile')}
              className="px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer whitespace-nowrap"
            >
              साइन अप (₹10 फ्री)
            </button>
            <button
              onClick={() => onOpenAuth ? onOpenAuth('login') : onNavigate('profile')}
              className="px-3 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
            >
              लॉगिन
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default HomeView;
