import React, { useState } from 'react';
import {
  Gamepad2,
  Flame,
  Clock,
  Trophy,
  Users,
  Ticket,
  ArrowRight,
  Sparkles,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Zap,
  Star,
  Play,
} from 'lucide-react';
import { TambolaGame } from '../types';

interface GamesLobbyViewProps {
  games: TambolaGame[];
  onNavigate: (tab: string, gameId?: string) => void;
}

export const GamesLobbyView: React.FC<GamesLobbyViewProps> = ({ games = [], onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [stakeFilter, setStakeFilter] = useState<'all' | 'micro' | 'regular' | 'bumper'>('all');

  const safeGames = Array.isArray(games) ? games : [];

  const filteredGames = safeGames.filter((g) => {
    if (!g) return false;
    if (filter !== 'all' && g.status !== filter) return false;
    const price = g.ticketPrice || 0;
    if (stakeFilter === 'micro' && price > 20) return false;
    if (stakeFilter === 'regular' && (price < 25 || price > 100)) return false;
    if (stakeFilter === 'bumper' && price <= 100) return false;
    return true;
  });

  const totalLivePool = safeGames
    .filter((g) => g && g.status !== 'completed')
    .reduce((acc, g) => acc + (Number(g.prizePool) || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* 🌟 1. Royale Gold Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-yellow-950 to-slate-950 border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                <span>OFFICIAL TOURNAMENT SCHEDULE</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[11px] font-bold">
                100% VERIFIED RNG
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              तंबोला गेम्स लॉबी &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">मेगा टूर्नामेंट शेड्यूल</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              लाइव मैचों में तुरंत शामिल हों या ₹5, ₹10, ₹15 से लेकर बम्पर जैकपॉट मैचों के लिए एडवांस टिकट बुक करें!
            </p>
          </div>

          {/* Live Prize Pool Badge */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border-2 border-amber-400/50 text-center space-y-1 shadow-2xl self-stretch sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">Total Active Prize Pool</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono text-glow-gold">
              ₹{(totalLivePool || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 block font-medium">Over {safeGames.length} Live &amp; Scheduled Matches</span>
          </div>
        </div>
      </div>

      {/* 🔍 2. Filter Tabs & Stake Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-2xl border border-amber-500/20">
        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          {(['all', 'live', 'upcoming', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                filter === f
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'All Games' : f === 'live' ? '🔴 Live Now' : f === 'upcoming' ? 'Upcoming' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Stake Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 font-bold hidden md:inline">Ticket Filter:</span>
          {(['all', 'micro', 'regular', 'bumper'] as const).map((sf) => (
            <button
              key={sf}
              onClick={() => setStakeFilter(sf)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                stakeFilter === sf
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
              }`}
            >
              {sf === 'all' ? 'All Rates' : sf === 'micro' ? 'Under ₹20' : sf === 'regular' ? '₹25 - ₹100' : 'Mega ₹100+'}
            </button>
          ))}
        </div>
      </div>

      {/* 🎮 3. Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => {
          if (!game) return null;
          const isGameActive = game.isActive !== false && game.isGameEnabled !== false && game.status !== 'cancelled';
          const isBookingOpen = game.bookingOpen !== false && game.isBookingOpen !== false && isGameActive;
          const isLive = game.status === 'live' && isGameActive;
          const isCompleted = game.status === 'completed';
          const calledNums = game.calledNumbers || [];
          const prizesList = game.prizes || [];

          return (
            <div
              key={game.id}
              className={`rounded-3xl p-6 border-2 transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden ${
                !isGameActive
                  ? 'border-red-500/40 bg-gradient-to-b from-[#1c0808] via-[#120505] to-[#0a0303] opacity-90'
                  : isLive
                  ? 'border-amber-400 bg-gradient-to-b from-[#241738] via-[#151a2e] to-[#0c1020] ring-2 ring-amber-400/40 shadow-amber-500/10'
                  : 'border-amber-500/30 bg-slate-900/90 hover:border-amber-400/70 hover:shadow-2xl'
              }`}
            >
              {isLive ? (
                <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-[10px] px-4 py-1 rounded-bl-2xl uppercase tracking-widest animate-pulse flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>PLAYING LIVE</span>
                </div>
              ) : !isGameActive ? (
                <div className="absolute top-0 right-0 bg-red-900/90 text-red-200 border-b border-l border-red-500/50 font-black text-[10px] px-3 py-1 rounded-bl-2xl uppercase tracking-widest flex items-center gap-1">
                  <span>🔴 GAME OFF</span>
                </div>
              ) : null}

              <div className="space-y-3">
                {/* Header Tag */}
                <div className="flex items-center justify-between text-xs pt-1">
                  {!isGameActive ? (
                    <span className="bg-red-500/20 text-red-300 border border-red-500/40 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                      🚫 बंद (OFF by Admin)
                    </span>
                  ) : isLive ? (
                    <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/50 text-red-300 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                      Ball #{calledNums.length} / 90
                    </span>
                  ) : isCompleted ? (
                    <span className="bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      COMPLETED
                    </span>
                  ) : (
                    <span className="bg-purple-900/60 text-purple-300 border border-purple-500/30 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                      UPCOMING
                    </span>
                  )}
                  <span className="font-mono text-xs text-amber-300 font-bold">
                    {game.gameCode || 'TL-LIVE'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    {game.title || 'Tambola Match'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Starts: {game.startTime || '09:00 PM'} ({game.date || 'Today'})</span>
                  </p>
                </div>

                {/* Prize Pool & Ticket Pricing Card */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Prize Pool</span>
                    <span className="text-lg font-black text-amber-300 font-mono">
                      ₹{(game.prizePool || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ticket Rate</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      ₹{game.ticketPrice || 0}
                    </span>
                  </div>
                </div>

                {/* Prizes Breakdown Pills */}
                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">1st Full House:</span>
                    <strong className="text-amber-300 font-mono">
                      ₹{prizesList.find((p) => p.code === 'full_house')?.amount || 3500}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Early 5:</span>
                    <strong className="text-lime-300 font-mono">
                      ₹{prizesList.find((p) => p.code === 'early_five' || p.code === 'early5')?.amount || 500}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered Players:</span>
                    <span className="text-white font-bold">{game.registeredPlayers || 0} / {game.maxPlayers || 500}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800">
                {!isGameActive ? (
                  <div className="w-full py-3 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-300 font-black text-xs text-center flex items-center justify-center gap-1.5">
                    <span>🔒 यह गेम एडमिन द्वारा बंद (OFF) है</span>
                  </div>
                ) : isLive ? (
                  <button
                    onClick={() => onNavigate('live', game.id)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current text-slate-950" />
                    <span>ENTER LIVE GAME ROOM</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : isCompleted ? (
                  <button
                    onClick={() => onNavigate('winners')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>View Winners List</span>
                  </button>
                ) : !isBookingOpen ? (
                  <div className="w-full py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs text-center">
                    <span>🔒 टिकट बुकिंग वर्तमान में बंद है</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onNavigate('buy-ticket', game.id)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>BUY ADVANCE TICKETS</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
