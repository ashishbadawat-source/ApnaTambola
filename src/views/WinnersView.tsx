import React, { useState } from 'react';
import { Trophy, Sparkles, Search, Award, Calendar, Ticket } from 'lucide-react';
import { GameWinner } from '../types';

interface WinnersViewProps {
  winners: GameWinner[];
}

export const WinnersView: React.FC<WinnersViewProps> = ({ winners }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [prizeFilter, setPrizeFilter] = useState<string>('all');

  const filteredWinners = winners.filter((w) => {
    if (!w) return false;
    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (w.userName && w.userName.toLowerCase().includes(q)) ||
      (w.gameTitle && w.gameTitle.toLowerCase().includes(q)) ||
      (w.ticketId && w.ticketId.toLowerCase().includes(q));
    const matchesPrize = prizeFilter === 'all' || w.prizeCode === prizeFilter;
    return matchesSearch && matchesPrize;
  });

  const totalPrizePaid = winners.reduce((acc, w) => acc + w.prizeAmount, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
              Hall of Winners &amp; Payouts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time verified Tambola champions and instant wallet payouts.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-right self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payouts Released</span>
          <span className="text-lg font-black text-amber-400">
            ₹{totalPrizePaid.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Winner, Game or Ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'All Prizes' },
            { id: 'full_house', label: 'Full House' },
            { id: 'early5', label: 'Early 5' },
            { id: 'top_line', label: 'Top Line' },
            { id: 'mid_line', label: 'Mid Line' },
            { id: 'bot_line', label: 'Bot Line' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setPrizeFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-colors shrink-0 ${
                prizeFilter === cat.id
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Winners Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWinners.map((w) => (
          <div
            key={w.id}
            className="glass-panel-gold rounded-2xl p-4 sm:p-5 border border-amber-400/40 shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100">
                    {w.userName}
                  </h3>
                  <span className="text-[11px] text-amber-300 font-semibold">
                    {w.prizeName}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-amber-400 text-glow-gold">
                  ₹{w.prizeAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block">
                  ✓ Paid
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Game:</span>
                <span className="truncate max-w-[170px] text-slate-200">{w.gameTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket ID:</span>
                <span className="text-amber-300">{w.ticketId} (#{w.ticketNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Winning Ball:</span>
                <span className="text-amber-400 font-black">Ball #{w.winningNumber}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px]">
                <span className="text-slate-500">Time:</span>
                <span className="text-slate-400">{w.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
