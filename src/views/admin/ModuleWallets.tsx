import React, { useState } from 'react';
import {
  Wallet,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { User, WalletTransaction, TransactionType, TransactionStatus } from '../../types';

interface ModuleWalletsProps {
  users: User[];
  transactions: WalletTransaction[];
  onUpdateWalletBalance: (userId: string, amount: number, type: 'credit' | 'debit') => Promise<boolean>;
}

export const ModuleWallets: React.FC<ModuleWalletsProps> = ({
  users,
  transactions,
  onUpdateWalletBalance,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'balances'>('transactions');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Wallet Adjust Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('Manual adjustment / compensation');
  const [adjustNotice, setAdjustNotice] = useState<string | null>(null);

  const totalUserDeposits = users.reduce((sum, u) => sum + (u.depositBalance || 0), 0);
  const totalUserWinnings = users.reduce((sum, u) => sum + (u.winningBalance || 0), 0);
  const totalUserReferrals = users.reduce((sum, u) => sum + (u.referralBalance || 0), 0);
  const totalPlatformLiabilities = totalUserDeposits + totalUserWinnings + totalUserReferrals;

  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        (tx.referenceId && tx.referenceId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || adjustAmount <= 0) return;
    await onUpdateWalletBalance(selectedUser.id, adjustAmount, adjustType);
    setAdjustNotice(`Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ₹${adjustAmount} for ${selectedUser.name}`);
    setTimeout(() => {
      setAdjustNotice(null);
      setSelectedUser(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <span>Platform Wallets & Transaction Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit player wallet balances, trace instant UPI deposits, monitor prize payouts, and execute audited ledger corrections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Transactions Ledger
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'balances'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            User Balances Overview
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-amber-400/30 shadow-lg">
          <div className="text-[11px] text-amber-400 uppercase font-black">Total Platform Balances</div>
          <div className="text-2xl font-black text-white mt-1">₹{totalPlatformLiabilities.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across {users.length} player accounts</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-800 shadow-lg">
          <div className="text-[11px] text-blue-400 uppercase font-black">Player Deposits</div>
          <div className="text-2xl font-black text-blue-300 mt-1">₹{totalUserDeposits.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for ticket purchases</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-800 shadow-lg">
          <div className="text-[11px] text-pink-400 uppercase font-black">Player Winnings</div>
          <div className="text-2xl font-black text-pink-300 mt-1">₹{totalUserWinnings.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Eligible for instant withdrawal</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-800 shadow-lg">
          <div className="text-[11px] text-emerald-400 uppercase font-black">Referral Commission Pool</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">₹{totalUserReferrals.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Earned from downlines</div>
        </div>
      </div>

      {activeTab === 'transactions' ? (
        /* Transactions Ledger Table */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Transaction Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="prize_won">Winning Amount</option>
                <option value="ticket_purchase">Ticket Payments</option>
                <option value="referral_commission">Referral Commission</option>
                <option value="refund">Refunds</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tx ID, description, ref..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tx ID / Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount (₹)</th>
                  <th className="px-4 py-3">Balance After</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Method / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTransactions.map((tx) => {
                  const isCredit = ['deposit', 'prize_won', 'referral_commission', 'refund'].includes(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        <div className="text-white font-bold">{tx.id}</div>
                        <div>{tx.timestamp}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded uppercase font-black text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3 font-black text-xs">
                        <span className={isCredit ? 'text-emerald-400' : 'text-red-400'}>
                          {isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        ₹{tx.balanceAfter.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-400">
                        {tx.referenceId || tx.paymentMethod || 'SYSTEM'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Balances Overview Table */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Deposit Wallet</th>
                  <th className="px-4 py-3">Winning Wallet</th>
                  <th className="px-4 py-3">Referral Wallet</th>
                  <th className="px-4 py-3">Total Balance</th>
                  <th className="px-4 py-3 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-300">₹{u.depositBalance || 0}</td>
                    <td className="px-4 py-3 font-mono text-pink-300 font-bold">₹{u.winningBalance || 0}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">₹{u.referralBalance || 0}</td>
                    <td className="px-4 py-3 font-black text-amber-300 text-sm">
                      ₹{(u.walletBalance || (u.depositBalance + u.winningBalance + u.referralBalance)).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold cursor-pointer"
                      >
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Direct Wallet Adjust Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Adjust User Balance</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div>User: <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.phone})</div>
                <div>Current: <strong className="text-amber-300">₹{selectedUser.walletBalance || 0}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-2 rounded-xl text-xs font-black ${
                    adjustType === 'credit' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  + CREDIT (ADD)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-2 rounded-xl text-xs font-black ${
                    adjustType === 'debit' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  - DEBIT (SUBTRACT)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Amount (₹)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  min={1}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-black text-base focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Reason / Note</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {adjustNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  {adjustNotice}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};