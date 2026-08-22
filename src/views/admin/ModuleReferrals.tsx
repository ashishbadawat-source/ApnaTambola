import React, { useState } from 'react';
import {
  Share2,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sliders,
  DollarSign,
  Layers,
  Sparkles,
  Search,
  Filter,
  Check,
  Award,
} from 'lucide-react';
import { ReferralCommission, User } from '../../types';

interface ModuleReferralsProps {
  users: User[];
  commissions: ReferralCommission[];
  onApproveCommission?: (commissionId: string) => void;
  onReverseCommission?: (commissionId: string) => void;
}

export const ModuleReferrals: React.FC<ModuleReferralsProps> = ({
  users,
  commissions,
  onApproveCommission,
  onReverseCommission,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [levels, setLevels] = useState({
    l1: 2.0,
    l2: 1.0,
    l3: 0.5,
    l4: 0.4,
    l5: 0.3,
    l6: 0.2,
    l7: 0.1,
    l8: 0.1,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'reversed'>('all');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Local commission state for approval / reversal simulation
  const [commList, setCommList] = useState<ReferralCommission[]>(commissions);

  const totalCommissionsPaid = commList
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const totalCap = (
    levels.l1 + levels.l2 + levels.l3 + levels.l4 + levels.l5 + levels.l6 + levels.l7 + levels.l8
  ).toFixed(1);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice('8-Level referral commission rates updated and locked in ticket engine!');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handleApprove = (id: string) => {
    setCommList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'approved' } : c))
    );
    if (onApproveCommission) onApproveCommission(id);
  };

  const handleReverse = (id: string) => {
    if (confirm('Reverse this commission payment? The amount will be deducted from the referrer.')) {
      setCommList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'reversed' } : c))
      );
      if (onReverseCommission) onReverseCommission(id);
    }
  };

  const filteredCommissions = commList.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.userName.toLowerCase().includes(q) ||
        c.sourceUserName.toLowerCase().includes(q) ||
        c.transactionId.toLowerCase().includes(q) ||
        c.gameTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-amber-400" />
            <span>8-Level Multi-Tier Referral Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure Tier 1 through Tier 8 ticket commission rates (Total {totalCap}%), monitor network payouts, audit earnings, and reverse invalid transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
            <span className="text-emerald-400 font-bold">Total Distributed: </span>
            <strong className="text-emerald-300 font-black">₹{totalCommissionsPaid.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* 8-Level Commission Configuration Form */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">8-Tier Commission Rates Engine (Ticket Play Only)</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-300 font-bold">Referral Engine:</span>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {enabled ? 'ENABLED' : 'PAUSED'}
            </button>
          </label>
        </div>

        {/* Info banner */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>कमीशन नियम:</strong> यह कमीशन केवल यूज़र द्वारा टिकट खरीदने (गेम खेलने) पर ही वितरित होगा। पेमेंट डिपॉजिट पर 0% कमीशन है।
          </span>
        </div>

        <form onSubmit={handleSaveRates} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-1">
            <div className="text-[10px] text-amber-400 font-black uppercase">Level 1 (Direct)</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l1}
                onChange={(e) => setLevels({ ...levels, l1: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 2.0%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-purple-400/40 space-y-1">
            <div className="text-[10px] text-purple-400 font-black uppercase">Level 2</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l2}
                onChange={(e) => setLevels({ ...levels, l2: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-purple-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 1.0%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-blue-400/40 space-y-1">
            <div className="text-[10px] text-blue-400 font-black uppercase">Level 3</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l3}
                onChange={(e) => setLevels({ ...levels, l3: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-blue-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.5%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-indigo-400/40 space-y-1">
            <div className="text-[10px] text-indigo-400 font-black uppercase">Level 4</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l4}
                onChange={(e) => setLevels({ ...levels, l4: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-indigo-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.4%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-teal-400/40 space-y-1">
            <div className="text-[10px] text-teal-400 font-black uppercase">Level 5</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l5}
                onChange={(e) => setLevels({ ...levels, l5: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-teal-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.3%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-400/40 space-y-1">
            <div className="text-[10px] text-emerald-400 font-black uppercase">Level 6</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l6}
                onChange={(e) => setLevels({ ...levels, l6: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-emerald-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.2%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-400/40 space-y-1">
            <div className="text-[10px] text-cyan-400 font-black uppercase">Level 7</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l7}
                onChange={(e) => setLevels({ ...levels, l7: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.1%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-rose-400/40 space-y-1">
            <div className="text-[10px] text-rose-400 font-black uppercase">Level 8</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l8}
                onChange={(e) => setLevels({ ...levels, l8: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-rose-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.1%</div>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400">
              Total Maximum Commission Payout per Ticket: <strong className="text-amber-400">{totalCap}%</strong>
            </span>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Save Referral Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Commission Audit Trail Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Real-time Commission Transaction Ledger</span>
          </h3>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved / Credited</option>
              <option value="pending">Pending</option>
              <option value="reversed">Reversed</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, tx..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tx ID / Date</th>
                <th className="px-4 py-3">Earner (Upline)</th>
                <th className="px-4 py-3">Buyer (Downline)</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Base Price</th>
                <th className="px-4 py-3">Commission (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCommissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    <div className="text-white font-bold">{comm.transactionId}</div>
                    <div>{comm.timestamp}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    {comm.userName}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {comm.sourceUserName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-black text-[10px] border border-purple-400/30">
                      Level {comm.level} ({comm.percentage}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">₹{comm.baseAmount}</td>
                  <td className="px-4 py-3 font-black text-emerald-400 text-xs">
                    +₹{comm.commissionAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        comm.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : comm.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {comm.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {comm.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(comm.id)}
                        className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] hover:bg-emerald-500/30 cursor-pointer mr-1"
                      >
                        Approve
                      </button>
                    )}
                    {comm.status === 'approved' && (
                      <button
                        onClick={() => handleReverse(comm.id)}
                        className="px-2 py-1 rounded bg-red-500/10 text-red-400 font-bold text-[10px] hover:bg-red-500/20 cursor-pointer"
                        title="Reverse commission payout"
                      >
                        Reverse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};