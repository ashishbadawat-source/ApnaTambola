import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Ticket,
  Trophy,
  CheckCircle2,
  Play,
  Volume2,
  VolumeX,
  Zap,
  Star,
  Users,
  Coins,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award,
  Crown,
  Gamepad2,
  Wallet,
  Settings,
  Home,
  BarChart3,
} from 'lucide-react';
import { User, TambolaGame, TambolaTicket, GameWinner } from '../types';

interface ApnaTambolaLiveArenaProps {
  currentUser?: User | null;
  games: TambolaGame[];
  tickets: TambolaTicket[];
  winners: GameWinner[];
  onNavigate: (tab: string, gameId?: string) => void;
  onOpenDeposit: () => void;
}

export const ApnaTambolaLiveArena: React.FC<ApnaTambolaLiveArenaProps> = ({
  currentUser,
  games = [],
  tickets = [],
  winners = [],
  onNavigate,
  onOpenDeposit,
}) => {
  const [activeTab, setActiveTab] = useState<'current_games' | 'active_tickets' | 'call_bingo'>('current_games');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Interactive Ticket State for the center board showcase
  const sampleTicketNumbers = [
    [2, 0, 17, 0, 34, 5, 61, 70, 78, 90], // row 1
    [2, 17, 27, 34, 45, 58, 66, 73, 90],  // row 2
    [1, 17, 23, 36, 49, 61, 75, 80],      // row 3
    [3, 12, 30, 34, 45, 63, 75, 88, 90]   // row 4
  ];

  // Pre-marked/struck numbers to match the tablet preview
  const [markedNumbers, setMarkedNumbers] = useState<number[]>([2, 17, 34, 49, 61, 75, 88]);
  const [claimedPatterns, setClaimedPatterns] = useState<string[]>(['Early Five']);

  const liveGame = (games || []).find((g) => g && g.status === 'live') || (games || [])[0];
  const lastCalledNumber = liveGame?.currentNumber || 75;

  const toggleMarkNumber = (num: number) => {
    if (!num) return;
    if (markedNumbers.includes(num)) {
      setMarkedNumbers(markedNumbers.filter((n) => n !== num));
    } else {
      setMarkedNumbers([...markedNumbers, num]);
    }
  };

  const handleClaimPattern = (patternName: string) => {
    if (!claimedPatterns.includes(patternName)) {
      setClaimedPatterns([...claimedPatterns, patternName]);
    }
  };

  const myActiveTickets = (tickets || []).filter((t) => {
    if (!t) return false;
    const matchedGame = (games || []).find((g) => g && g.id === t.gameId);
    return matchedGame && matchedGame.status !== 'completed';
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0e0725] via-[#120a33] to-[#08041a] border-2 border-amber-400/80 p-4 sm:p-6 lg:p-7 shadow-2xl shadow-purple-950/80">
      {/* Background Decorative Fireworks / Confetti Glows */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Confetti Sparkles Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* 🌟 1. BRAND & PLAYER VIP HEADER BAR (As seen in the Tablet Image) */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-purple-500/30 pb-5">
        {/* Left: Apna Tambola Glowing Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 via-amber-400 to-rose-500 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-cyan-300 via-amber-300 to-rose-400">
                T
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 uppercase tracking-wide">
                APNA TAMBOLA
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-[10px] font-black text-white uppercase tracking-wider animate-pulse shadow">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 font-medium">
              India's #1 Real-Time Multiplayer Live Housie & Cash Gaming
            </p>
          </div>
        </div>

        {/* Center/Right: User Profile Card (Abhishek Kumar style from image) */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-purple-950/90 border border-amber-400/50 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-xl">
          {/* Avatar with Initials/Badge */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 p-0.5 shadow-md shadow-amber-500/40">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'Player'}
                className="w-full h-full rounded-[10px] object-cover bg-slate-900"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-slate-950 flex items-center justify-center text-[10px] text-white font-black">
              ✓
            </span>
          </div>

          {/* User Details */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-white">
                {currentUser?.name || 'Abhishek Kumar'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              ID: <span className="font-mono text-purple-300 font-bold">#{currentUser?.id?.replace('usr_', '') || '10984'}</span> • Rank: <span className="text-amber-300 font-bold">18 (Gold Tier)</span>
            </div>
            <div className="flex items-center gap-3 pt-0.5 flex-wrap">
              <span className="text-xs font-black text-amber-300 font-mono">
                Wallet Balance: ₹{((currentUser?.walletBalance ?? 1450.75) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[11px] font-black text-amber-300">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span>125 Coins</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3D Balls / Top Right Accent */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-cyan-500/40 border border-cyan-200">
            10
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-red-500/40 border border-red-200">
            15
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-yellow-500/40 border border-yellow-200">
            75
          </div>
        </div>
      </div>

      {/* 🧭 2. TOP TABS SUB-NAVIGATION BAR (CURRENT GAMES | ACTIVE TICKETS | CALL BINGO) */}
      <div className="relative z-10 flex items-center justify-between border-b border-purple-500/20 py-3.5 my-2 flex-wrap gap-3">
        <div className="flex items-center gap-4 sm:gap-8">
          <button
            onClick={() => setActiveTab('current_games')}
            className={`text-xs sm:text-sm font-black uppercase tracking-wider pb-1 transition-all cursor-pointer relative ${
              activeTab === 'current_games'
                ? 'text-amber-300 border-b-2 border-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CURRENT GAMES
          </button>

          <button
            onClick={() => {
              setActiveTab('active_tickets');
              onNavigate('my-tickets');
            }}
            className={`text-xs sm:text-sm font-black uppercase tracking-wider pb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'active_tickets'
                ? 'text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>ACTIVE TICKETS</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase shadow">
              ACTIVE
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('call_bingo');
              onNavigate('how-to-play');
            }}
            className={`text-xs sm:text-sm font-black uppercase tracking-wider pb-1 transition-all cursor-pointer ${
              activeTab === 'call_bingo'
                ? 'text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CALL BINGO
          </button>
        </div>

        {/* Quick Audio / Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-purple-900/60 border border-purple-400/40 text-purple-200 text-xs hover:bg-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
            title={soundEnabled ? 'Hindi Voice Caller On' : 'Voice Caller Muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            <span className="text-[11px] font-bold hidden sm:inline">{soundEnabled ? 'Voice Caller' : 'Muted'}</span>
          </button>

          <button
            onClick={onOpenDeposit}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>+ Add Cash</span>
          </button>
        </div>
      </div>

      {/* 🎮 3. MAIN THREE-COLUMN ARENA (Left: JOIN GAMES | Center: MY TICKETS BOARD | Right: CALL BINGO & WINNERS) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        
        {/* ================= LEFT COLUMN (4 Cols): JOIN NEW GAME ================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>JOIN NEW GAME</span>
            </h3>
            <span className="text-[11px] text-purple-300 font-bold">Live Games</span>
          </div>

          {/* Game Card 1: Mega Tambola Night (As in Image) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#240e3b] to-[#140824] border-2 border-purple-500/70 hover:border-amber-400 shadow-xl space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-white">Mega Tambola Night</h4>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>

            <div className="grid grid-cols-2 gap-2 bg-purple-950/60 p-2.5 rounded-xl border border-purple-400/30">
              <div>
                <span className="text-[10px] text-purple-300 block uppercase font-bold">Entry</span>
                <span className="text-sm font-black text-white font-mono">₹50</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-purple-300 block uppercase font-bold">Prize</span>
                <span className="text-sm font-black text-amber-300 font-mono">₹10,000</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-purple-200 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>230 Players</span>
              </span>

              <button
                onClick={() => onNavigate('live', liveGame?.id)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 hover:from-rose-400 hover:to-red-400 text-white font-black text-xs shadow-lg shadow-red-500/50 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider animate-pulse hover:scale-105 transition-all"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>LIVE NOW</span>
              </button>
            </div>
          </div>

          {/* Game Card 2: Fast Track Fun (As in Image) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#142338] to-[#0a1421] border-2 border-cyan-500/50 hover:border-cyan-400 shadow-xl space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-white">Fast Track Fun</h4>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30">
                STARTS IN 15M
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-cyan-400/30">
              <div>
                <span className="text-[10px] text-cyan-300 block uppercase font-bold">Entry</span>
                <span className="text-sm font-black text-white font-mono">₹25</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-cyan-300 block uppercase font-bold">Prize</span>
                <span className="text-sm font-black text-emerald-400 font-mono">₹5,000</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>180 Players</span>
              </span>

              <button
                onClick={() => onNavigate('buy-ticket')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow hover:scale-105 transition-all cursor-pointer"
              >
                Book Ticket
              </button>
            </div>
          </div>

          {/* Game Card 3: Chai Pe Tambola (₹10 Mini) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#2e1d0c] to-[#170e05] border border-amber-500/40 shadow-md flex items-center justify-between gap-2">
            <div>
              <h5 className="text-xs font-black text-amber-200">Chai Pe Tambola (₹10)</h5>
              <p className="text-[10px] text-amber-300/80">Prize Pool: ₹2,500 • Low Entry</p>
            </div>
            <button
              onClick={() => onNavigate('buy-ticket')}
              className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow hover:bg-amber-300 transition-colors cursor-pointer"
            >
              ₹10
            </button>
          </div>
        </div>

        {/* ================= CENTER COLUMN (5 Cols): MY TICKETS & GLOWING NUMBER BOARD ================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-amber-400" />
              <span>MY TICKETS</span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Tap to Daub / Mark Numbers</span>
            </span>
          </div>

          {/* Glowing Golden Ticket Frame (Game #2045 - MEGA TAMBOLA from Image) */}
          <div className="relative rounded-2xl bg-[#0c0820] border-2 border-yellow-400/90 p-3 sm:p-4 shadow-[0_0_25px_rgba(234,179,8,0.35)] space-y-3">
            {/* Ticket Header */}
            <div className="flex items-center justify-between border-b border-yellow-400/40 pb-2 px-1">
              <span className="text-xs font-black text-yellow-300 tracking-wide">
                Game #2045 - MEGA TAMBOLA
              </span>
              <span className="text-[10px] font-bold text-slate-300 bg-yellow-950/80 px-2 py-0.5 rounded border border-yellow-500/30">
                Ticket #01 • Auto Daub ON
              </span>
            </div>

            {/* 3x9 Ticket Grid Table */}
            <div className="bg-white rounded-xl p-1.5 shadow-inner overflow-x-auto">
              <div className="grid grid-rows-4 gap-1 min-w-[280px]">
                {sampleTicketNumbers.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-10 gap-1">
                    {row.map((num, cIdx) => {
                      const isMarked = markedNumbers.includes(num);
                      const isCurrentDraw = num === lastCalledNumber;
                      return (
                        <button
                          key={cIdx}
                          onClick={() => toggleMarkNumber(num)}
                          disabled={num === 0}
                          className={`h-8 sm:h-9 rounded-md font-black text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer select-none ${
                            num === 0
                              ? 'bg-slate-100 text-transparent cursor-default'
                              : isCurrentDraw
                              ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-md scale-105 ring-2 ring-amber-300 animate-pulse'
                              : isMarked
                              ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-sm'
                              : 'bg-slate-50 hover:bg-amber-100 text-slate-900 border border-slate-300'
                          }`}
                        >
                          {num !== 0 ? num : ''}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* LAST NUMBER CALLED WIDGET (Giant Glowing 75 with Fireworks Wings) */}
            <div className="pt-2 text-center space-y-2">
              <span className="text-[11px] font-black uppercase text-amber-300 tracking-widest block">
                LAST NUMBER CALLED:
              </span>

              <div className="flex items-center justify-center gap-3">
                {/* Left Fireworks Wing */}
                <div className="text-lg animate-bounce select-none">🎆✨</div>

                {/* Center Neon Glowing Badge (75) */}
                <div className="relative group">
                  <div className="px-6 py-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-2 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.8)] text-white text-2xl sm:text-3xl font-black font-mono tracking-wider">
                    {lastCalledNumber}
                  </div>
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black uppercase shadow">
                    Active
                  </span>
                </div>

                {/* Right Fireworks Wing */}
                <div className="text-lg animate-bounce select-none">✨🎉</div>
              </div>

              {/* Quick Actions Under Ticket */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleClaimPattern('Full House')}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/40 flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>CLAIM FULL HOUSE</span>
                </button>

                <button
                  onClick={() => onNavigate('live', liveGame?.id)}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/40 flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY IN ROOM</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (4 Cols): CALL BINGO & WINNERS WALL ================= */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 🏆 CALL BINGO CLAIMS TABLE (As seen in the Image) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1b0d33] to-[#0d061c] border-2 border-purple-500/60 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-purple-400/30 pb-2">
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span>CALL BINGO</span>
              </h3>
              <span className="text-[10px] text-purple-300 uppercase font-bold">Prizes</span>
            </div>

            <div className="space-y-2">
              {/* Pattern 1: Early Five */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/70 border border-purple-400/30">
                <span className="text-xs font-bold text-white">Early Five</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-xs font-black uppercase shadow">
                  Won
                </span>
              </div>

              {/* Pattern 2: Top Line */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/70 border border-purple-400/30">
                <span className="text-xs font-bold text-white">Top Line</span>
                <span className="text-xs font-black text-amber-300 font-mono">₹500</span>
              </div>

              {/* Pattern 3: Middle Line */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/70 border border-purple-400/30">
                <span className="text-xs font-bold text-white">Middle Line</span>
                <span className="text-xs font-black text-amber-300 font-mono">₹1000</span>
              </div>

              {/* Pattern 4: Bottom Line */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/70 border border-purple-400/30">
                <span className="text-xs font-bold text-white">Bottom Line</span>
                <span className="text-xs font-black text-amber-300 font-mono">₹1000</span>
              </div>

              {/* Pattern 5: Full House */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/60">
                <span className="text-xs font-black text-yellow-300">Full House</span>
                <span className="text-sm font-black text-yellow-400 font-mono">₹5000</span>
              </div>
            </div>
          </div>

          {/* 🌟 WINNERS WALL (As seen in the Image) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141b38] to-[#090d21] border-2 border-indigo-500/60 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-400/30 pb-2">
              <h3 className="text-sm font-black text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>WINNERS WALL</span>
              </h3>
              <span className="text-[10px] text-indigo-300 font-bold">Live Feed</span>
            </div>

            <div className="space-y-2.5">
              {/* Winner 1: Priya S. */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-indigo-950/70 border border-indigo-400/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 p-0.5 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                    alt="Priya"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-white">Priya S. won</div>
                  <div className="text-[11px] text-emerald-400 font-bold">Full House! (₹10,000)</div>
                </div>
              </div>

              {/* Winner 2: Rahul K. */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-indigo-950/70 border border-indigo-400/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Rahul"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-white">Rahul K. won</div>
                  <div className="text-[11px] text-amber-300 font-bold">Top Line (₹800)</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 🚀 4. BOTTOM FLOATING QUICK-NAVIGATION DOCK (As seen at bottom of tablet) */}
      <div className="relative z-10 mt-6 pt-4 border-t border-purple-500/30 grid grid-cols-6 gap-2 text-center">
        <button
          onClick={() => onNavigate('home')}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-400/30 text-purple-200 hover:text-amber-300 transition-all cursor-pointer group"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold mt-1">Home</span>
        </button>

        <button
          onClick={() => onNavigate('games')}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-400/30 text-purple-200 hover:text-cyan-300 transition-all cursor-pointer group"
        >
          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold mt-1">Games</span>
        </button>

        <button
          onClick={() => onNavigate('wallet')}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-400/30 text-purple-200 hover:text-emerald-300 transition-all cursor-pointer group"
        >
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold mt-1">Wallet</span>
        </button>

        <button
          onClick={() => onNavigate('my-tickets')}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-400/30 text-purple-200 hover:text-yellow-300 transition-all cursor-pointer group"
        >
          <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold mt-1">Tickets</span>
        </button>

        <button
          onClick={() => onNavigate('winners')}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-400/30 text-purple-200 hover:text-orange-300 transition-all cursor-pointer group"
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold mt-1">Rankings</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-400/30 text-purple-200 hover:text-sky-300 transition-all cursor-pointer group"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold mt-1">Settings</span>
        </button>
      </div>
    </div>
  );
};
