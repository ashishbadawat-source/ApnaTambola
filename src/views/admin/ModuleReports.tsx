import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Ticket,
  Users,
  Trophy,
  Share2,
  Wallet,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { User, TambolaGame, TambolaTicket, WalletTransaction, ReferralCommission, WithdrawalRequest } from '../../types';
import { ReferralGrowthChart } from '../../components/admin/ReferralGrowthChart';

interface ModuleReportsProps {
  users: User[];
  games: TambolaGame[];
  tickets: TambolaTicket[];
  transactions: WalletTransaction[];
  commissions: ReferralCommission[];
  withdrawals: WithdrawalRequest[];
}

export const ModuleReports: React.FC<ModuleReportsProps> = ({
  users,
  games,
  tickets,
  transactions,
  commissions,
  withdrawals,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'all'>('month');
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'games' | 'referrals' | 'financials'>('sales');

  // Computed metrics
  const totalTicketRevenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const totalPrizePaid = transactions
    .filter((tx) => tx.type === 'prize_won' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalReferralPaid = commissions
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.commissionAmount, 0);
  const netPlatformProfit = totalTicketRevenue - (totalPrizePaid + totalReferralPaid);
  const profitMarginPercent = totalTicketRevenue > 0 ? ((netPlatformProfit / totalTicketRevenue) * 100).toFixed(1) : '0.0';

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeReportTab === 'sales') {
      csvContent += 'Ticket ID,Game Title,User Name,Price,Status,Winning\n';
      tickets.forEach((t) => {
        csvContent += `${t.ticketId},"${t.gameTitle}","${t.userName}",${t.price},${t.status},${t.isWinningTicket ? 'YES' : 'NO'}\n`;
      });
    } else {
      csvContent += 'Transaction ID,User,Type,Amount,Status,Date\n';
      transactions.forEach((tx) => {
        csvContent += `${tx.id},"${tx.userName}",${tx.type},${tx.amount},${tx.status},${tx.timestamp}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tambola_Report_${activeReportTab}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Business Analytics & Reports</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time financial breakdown, tournament margin analysis, user acquisition rates, and exportable ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="today">Today's Data</option>
            <option value="7days">Past 7 Days</option>
            <option value="month">This Month (Active Cycle)</option>
            <option value="all">All Time History</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-amber-400/30 shadow-lg">
          <div className="text-[10px] text-amber-400 uppercase font-black">Gross Ticket Collections</div>
          <div className="text-2xl font-black text-white mt-1">₹{totalTicketRevenue.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">{tickets.length} tickets sold</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-800 shadow-lg">
          <div className="text-[10px] text-purple-400 uppercase font-black">Prize Payouts</div>
          <div className="text-2xl font-black text-purple-300 mt-1">₹{totalPrizePaid.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Distributed to winners</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-800 shadow-lg">
          <div className="text-[10px] text-emerald-400 uppercase font-black">Referral Commission Paid</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">₹{totalReferralPaid.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">8-Tier MLM distribution (Tickets only)</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-emerald-500/40 shadow-lg">
          <div className="text-[10px] text-emerald-400 uppercase font-black">Net Platform Margin</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">₹{netPlatformProfit.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-amber-300 mt-0.5 font-black">{profitMarginPercent}% Retention Rate</div>
        </div>
      </div>

      {/* Report Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'sales', label: 'Ticket Sales Breakdown' },
          { id: 'games', label: 'Tournament Margin Reports' },
          { id: 'referrals', label: 'MLM Referral Payouts' },
          { id: 'financials', label: 'Financial Settlement Ledger' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === tab.id
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Ticket Sales Breakdown */}
      {activeReportTab === 'sales' && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <h3 className="text-base font-black text-white">Live Tournament Ticket Sales Register</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tournament Name</th>
                  <th className="px-4 py-3">Ticket Price</th>
                  <th className="px-4 py-3">Tickets Sold</th>
                  <th className="px-4 py-3">Total Gross (₹)</th>
                  <th className="px-4 py-3">Prize Pool (₹)</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {games.map((g) => {
                  const gameTickets = tickets.filter((t) => t.gameId === g.id);
                  const gross = gameTickets.reduce((sum, t) => sum + t.price, 0);

                  return (
                    <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{g.title}</td>
                      <td className="px-4 py-3 font-mono">₹{g.ticketPrice}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{gameTickets.length} / {g.totalTickets}</td>
                      <td className="px-4 py-3 font-black text-amber-300">₹{gross.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono">₹{g.prizePool.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            g.status === 'live'
                              ? 'bg-red-500/20 text-red-300'
                              : g.status === 'upcoming'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {g.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Tournament Margin Reports */}
      {activeReportTab === 'games' && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <h3 className="text-base font-black text-white">Profit & Margin Analysis by Tournament</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((g) => {
              const gameTickets = tickets.filter((t) => t.gameId === g.id);
              const gross = gameTickets.reduce((sum, t) => sum + t.price, 0);
              const margin = gross - g.prizePool;

              return (
                <div key={g.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{g.title}</span>
                    <span className="text-xs text-slate-400 font-mono">{g.startTime}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Gross Collection</div>
                      <div className="text-sm font-black text-white">₹{gross}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Prize Pool</div>
                      <div className="text-sm font-black text-amber-400">₹{g.prizePool}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Net Yield</div>
                      <div className={`text-sm font-black ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ₹{margin}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: MLM Referral Payouts & Growth Analysis */}
      {activeReportTab === 'referrals' && (
        <div className="space-y-5">
          <ReferralGrowthChart
            users={users}
            commissions={commissions}
            title="30-Day Referral Acquisition & Viral Spike Trends"
            description="Assess 30-day viral user acquisition curves, peak registration bursts, and high-performing sponsor campaigns."
          />

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">8-Tier Commission Payout Breakdown</h3>
              <span className="text-xs text-amber-400 font-bold">Commission on Ticket Plays Only</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => {
                const lvlComms = commissions.filter((c) => c.level === lvl);
                const sum = lvlComms.reduce((s, c) => s + c.commissionAmount, 0);
                return (
                  <div key={lvl} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-black">Level {lvl}</div>
                    <div className="text-lg font-black text-emerald-400">₹{sum.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">{lvlComms.length} payouts</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Financial Settlement Ledger */}
      {activeReportTab === 'financials' && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <h3 className="text-base font-black text-white">Daily Reconciliation & Cashflow Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Total User Inflow (Deposits)</div>
              <div className="text-xl font-black text-emerald-400">
                ₹{transactions.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Total Outflow (Withdrawals)</div>
              <div className="text-xl font-black text-amber-400">
                ₹{withdrawals.filter((w) => w.status === 'approved').reduce((s, w) => s + w.amount, 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Pending Outflow Demands</div>
              <div className="text-xl font-black text-red-400">
                ₹{withdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};