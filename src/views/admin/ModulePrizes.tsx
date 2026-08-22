import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  DollarSign,
  Gift,
  Sparkles,
  Layers,
  Award,
  Star,
  Check,
} from 'lucide-react';
import { GamePrize, TambolaGame } from '../../types';

interface ModulePrizesProps {
  games: TambolaGame[];
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean>;
}

const INITIAL_MASTER_PRIZES: Omit<GamePrize, 'id' | 'claimedWinners'>[] = [
  { code: 'early5', name: 'Early 5 (Jaldi 5)', amount: 500, maxWinners: 1, description: 'First player to dab any 5 numbers anywhere on ticket' },
  { code: 'corners', name: '4 Corners', amount: 500, maxWinners: 1, description: '1st & last number of top line and 1st & last number of bottom line' },
  { code: 'top_line', name: 'Top Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of the top horizontal row' },
  { code: 'mid_line', name: 'Middle Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of the middle horizontal row' },
  { code: 'bot_line', name: 'Bottom Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of the bottom horizontal row' },
  { code: 'full_house', name: '1st Full House (Bumper)', amount: 6000, maxWinners: 1, description: 'First player to dab all 15 numbers on the ticket' },
  { code: 'second_full_house', name: '2nd Full House', amount: 3000, maxWinners: 1, description: 'Second player to complete all 15 numbers' },
  { code: 'third_full_house', name: '3rd Full House', amount: 1500, maxWinners: 1, description: 'Third player to complete all 15 numbers' },
  { code: 'special', name: 'Center Star Bonus', amount: 500, maxWinners: 1, description: 'The exact center number on row 2 column 5' },
];

export const ModulePrizes: React.FC<ModulePrizesProps> = ({
  games,
  onUpdateGame,
}) => {
  const [prizesList, setPrizesList] = useState<Omit<GamePrize, 'id' | 'claimedWinners'>[]>(INITIAL_MASTER_PRIZES);
  
  // Custom Prize Form
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState(500);
  const [customDesc, setCustomDesc] = useState('');
  const [customWinners, setCustomWinners] = useState(1);
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Notice
  const [notice, setNotice] = useState<string | null>(null);

  const totalPrizePool = prizesList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleUpdatePrizeAmount = (index: number, newAmount: number) => {
    setPrizesList((prev) =>
      prev.map((p, i) => (i === index ? { ...p, amount: newAmount } : p))
    );
  };

  const handleUpdateMaxWinners = (index: number, winners: number) => {
    setPrizesList((prev) =>
      prev.map((p, i) => (i === index ? { ...p, maxWinners: winners } : p))
    );
  };

  const handleDeletePrize = (index: number) => {
    if (confirm('Remove this prize category from the master template?')) {
      setPrizesList((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddCustomPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newPrize: Omit<GamePrize, 'id' | 'claimedWinners'> = {
      code: `custom_${Date.now()}` as any,
      name: customName.trim(),
      amount: customAmount,
      maxWinners: customWinners,
      description: customDesc.trim() || 'Custom tournament prize condition',
    };

    setPrizesList((prev) => [...prev, newPrize]);
    setCustomName('');
    setCustomAmount(500);
    setCustomDesc('');
    setShowAddCustom(false);
    setNotice(`Added custom prize "${newPrize.name}" successfully!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleApplyToAllActiveGames = async () => {
    if (!onUpdateGame) return;
    for (const game of games) {
      if (game.status === 'live' || game.status === 'upcoming') {
        await onUpdateGame(game.id, {
          prizePool: totalPrizePool,
          prizes: prizesList.map((p, idx) => ({
            ...p,
            id: `prz_dyn_${game.id}_${idx}`,
            claimedWinners: [],
          })),
        });
      }
    }
    setNotice(`Master prize template applied to all live & upcoming games! (Total Pool: ₹${totalPrizePool.toLocaleString('en-IN')})`);
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Tambola Prize Pool & Claim Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure default prize categories (Early 5, Corners, Lines, Full House 1/2/3), custom side-bets, amounts, and winner allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCustom(true)}
            className="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-400/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Prize</span>
          </button>
          <button
            onClick={handleApplyToAllActiveGames}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Apply Template to Tournaments
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Prize Pool Summary Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1b1238] via-[#111938] to-[#250d24] border-2 border-amber-400/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-wider text-amber-400">TOTAL MASTER PRIZE POOL</div>
          <div className="text-3xl sm:text-4xl font-black text-white">
            ₹{totalPrizePool.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-300">
            Across {prizesList.length} defined prize categories • Distributed in real-time upon valid number verification
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold">1st Full House</div>
            <div className="text-base font-black text-amber-400">
              ₹{(prizesList.find((p) => p.code === 'full_house')?.amount || 6000).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Lines Total</div>
            <div className="text-base font-black text-emerald-400">
              ₹{(
                (prizesList.find((p) => p.code === 'top_line')?.amount || 1000) +
                (prizesList.find((p) => p.code === 'mid_line')?.amount || 1000) +
                (prizesList.find((p) => p.code === 'bot_line')?.amount || 1000)
              ).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Prize Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prizesList.map((prz, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-400/30">
                    {idx + 1}
                  </span>
                  <h3 className="font-black text-white text-sm">{prz.name}</h3>
                </div>

                <button
                  onClick={() => handleDeletePrize(idx)}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete Prize"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400">{prz.description}</p>
            </div>

            {/* Editable Amount & Max Winners */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Prize Amount (₹)</label>
                <input
                  type="number"
                  value={prz.amount}
                  onChange={(e) => handleUpdatePrizeAmount(idx, Number(e.target.value))}
                  min={10}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-black focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Max Winners</label>
                <input
                  type="number"
                  value={prz.maxWinners}
                  onChange={(e) => handleUpdateMaxWinners(idx, Number(e.target.value))}
                  min={1}
                  max={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Custom Prize */}
      {showAddCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">Create Custom Prize Rule</h3>
              </div>
              <button
                onClick={() => setShowAddCustom(false)}
                className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomPrize} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Prize Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  placeholder="E.g. Breakfast (Rows 1 & 2), King's Corner, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Prize Amount (₹)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    min={50}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-black focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Max Winners</label>
                  <input
                    type="number"
                    value={customWinners}
                    onChange={(e) => setCustomWinners(Number(e.target.value))}
                    min={1}
                    max={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Description / Winning Rule</label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  rows={2}
                  placeholder="E.g. First player to mark top 2 numbers of column 5..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow cursor-pointer"
                >
                  Add Prize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};