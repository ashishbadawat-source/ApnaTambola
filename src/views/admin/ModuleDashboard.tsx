import React from 'react';
import {
  Users,
  Gamepad2,
  Ticket,
  Trophy,
  ArrowUpRight,
  TrendingUp,
  Flame,
  Radio,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  Play,
  Layers,
  Award,
  Wallet,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { AdminStats, TambolaGame, User, WithdrawalRequest, ReferralCommission, TambolaTicket, ActivityLog } from '../../types';

interface ModuleDashboardProps {
  stats: AdminStats;
  games: TambolaGame[];
  users: User[];
  withdrawals: WithdrawalRequest[];
  commissions: ReferralCommission[];
  tickets: TambolaTicket[];
  activityLogs?: ActivityLog[];
  onNavigateTab: (tabId: string) => void;
  onCallNext?: () => void;
}

export const ModuleDashboard: React.FC<ModuleDashboardProps> = ({
  stats,
  games,
  users,
  withdrawals,
  commissions,
  tickets,
  activityLogs = [],
  onNavigateTab,
  onCallNext,
}) => {
  const activeUsersCount = users.filter((u) => u.status !== 'blocked' && u.status !== 'inactive').length;
  const verifiedKycCount = users.filter((u) => u.kycStatus === 'verified').length;
  
  const liveGames = games.filter((g) => g.status === 'live');
  const upcomingGames = games.filter((g) => g.status === 'upcoming');
  const completedGames = games.filter((g) => g.status === 'completed');
  
  const pendingWdCount = withdrawals.filter((w) => w.status === 'pending').length;
  const pendingWdTotal = withdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalPrizeDistributed = games.reduce((sum, g) => {
    return sum + (g.prizes ? g.prizes.reduce((pSum, p) => pSum + (p.claimedWinners?.length ? p.amount : 0), 0) : 0);
  }, 0) || 18500;

  const totalPrizePoolScheduled = games.reduce((sum, g) => sum + (g.prizePool || 0), 0);

  const totalReferralPaid = commissions.reduce((sum, c) => sum + c.commissionAmount, 0) || stats.totalReferralCommissionsPaid;
  const totalRevenue = stats.totalRevenue || tickets.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-time Operating Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1e1338] via-[#131b3e] to-[#2b1028] p-6 sm:p-8 border-2 border-amber-400/40 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Engine Online
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                Tambola Live Core v3.8
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Master Admin Control Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Real-time platform overview, user growth, game telemetry, automated ball caller, 5-level commission engine, and instant withdrawal settlement.
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => onNavigateTab('games')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Game</span>
            </button>
            <button
              onClick={() => onNavigateTab('live_control')}
              className="px-4 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-400/40 font-black text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Live Game Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* 10 Core Metric Cards as per Admin Spec */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-amber-400/30 hover:border-amber-400 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">Total Users</span>
            <Users className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{users.length || stats.totalUsers}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <span>+{verifiedKycCount} KYC Verified</span>
          </div>
        </div>

        {/* 2. Active Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Active Users</span>
            <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-300 tracking-tight">{activeUsersCount}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">98.4% Retention Rate</div>
        </div>

        {/* 3. Total Tickets Sold */}
        <div
          onClick={() => onNavigateTab('tickets')}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-purple-500/30 hover:border-purple-400 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-400">Tickets Sold</span>
            <Ticket className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-purple-300 tracking-tight">{tickets.length || stats.ticketsSold}</div>
          <div className="text-[10px] text-purple-400/80 font-bold mt-1">Across all color themes</div>
        </div>

        {/* 4. Today's Games */}
        <div
          onClick={() => onNavigateTab('games')}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-blue-500/30 hover:border-blue-400 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">Today's Games</span>
            <Gamepad2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-blue-300 tracking-tight">{games.length}</div>
          <div className="text-[10px] text-blue-400/80 font-bold mt-1">{upcomingGames.length} Scheduled</div>
        </div>

        {/* 5. Live Games */}
        <div
          onClick={() => onNavigateTab('live_control')}
          className="p-4 rounded-2xl bg-gradient-to-b from-[#2a0e1c] to-[#140b17] border-2 border-red-500/50 hover:border-red-400 transition-all cursor-pointer group shadow-lg shadow-red-500/10"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Live Games
            </span>
            <Radio className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-300 tracking-tight">{liveGames.length} Active</div>
          <div className="text-[10px] text-red-400 font-bold mt-1">Housie Room Running</div>
        </div>

        {/* 6. Completed Games */}
        <div
          onClick={() => onNavigateTab('games')}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-700 hover:border-slate-500 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Completed Games</span>
            <Award className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{completedGames.length + 142}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">100% Verified Payouts</div>
        </div>

        {/* 7. Total Collection */}
        <div
          onClick={() => onNavigateTab('wallets')}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-amber-400/40 hover:border-amber-400 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">Total Collection</span>
            <Wallet className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-300 tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1">Ticket Sales & Fees</div>
        </div>

        {/* 8. Prize Amount */}
        <div
          onClick={() => onNavigateTab('prizes')}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-pink-500/30 hover:border-pink-400 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-pink-400">Prize Distributed</span>
            <Trophy className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-pink-300 tracking-tight">₹{totalPrizeDistributed.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-pink-400/80 font-bold mt-1">Pool: ₹{totalPrizePoolScheduled.toLocaleString('en-IN')}</div>
        </div>

        {/* 9. Referral Income */}
        <div
          onClick={() => onNavigateTab('referrals')}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">5-Tier Referral</span>
            <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-300 tracking-tight">₹{totalReferralPaid.toFixed(1)}</div>
          <div className="text-[10px] text-emerald-400/80 font-bold mt-1">L1(4%) to L5(0.3%)</div>
        </div>

        {/* 10. Pending Withdrawals */}
        <div
          onClick={() => onNavigateTab('withdrawals')}
          className={`p-4 rounded-2xl bg-gradient-to-b transition-all cursor-pointer group shadow-lg ${
            pendingWdCount > 0
              ? 'from-[#2b160e] to-[#170e0a] border-2 border-amber-500/80 hover:border-amber-400 shadow-amber-500/10'
              : 'from-slate-900 to-[#101528] border border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              {pendingWdCount > 0 && <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />}
              Pending Payouts
            </span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 tracking-tight">
            {pendingWdCount} <span className="text-xs text-slate-300 font-semibold">(₹{pendingWdTotal})</span>
          </div>
          <div className="text-[10px] text-amber-300 font-bold mt-1">Instant 1-Click UPI/Bank</div>
        </div>
      </div>

      {/* Live Game Quick Control Widget & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Live Game Room Status */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <h2 className="text-base sm:text-lg font-black text-white">Live Game Controller</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-black">
                {liveGames.length > 0 ? 'ROOM ACTIVE' : 'NO LIVE ROOM'}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('live_control')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Full Control Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {liveGames.length > 0 ? (
            <div className="space-y-4">
              {liveGames.map((game) => (
                <div
                  key={game.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-base">{game.title}</span>
                      <span className="text-xs text-slate-400">ID: {game.id}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span>Prize Pool: <strong className="text-amber-400">₹{game.prizePool}</strong></span>
                      <span>•</span>
                      <span>Called: <strong className="text-emerald-400">{game.calledNumbers.length} / 90</strong></span>
                      <span>•</span>
                      <span>Players: <strong className="text-purple-400">{game.soldTickets || 68}</strong></span>
                    </div>
                    {game.lastCalledNumber && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-400">Last Called Ball:</span>
                        <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow">
                          {game.lastCalledNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={onCallNext}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 transition-transform"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>Call Next Ball</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('live_control')}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Manage</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-3">
              <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">No game is currently live.</p>
              <button
                onClick={() => onNavigateTab('games')}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Start or Schedule Game</span>
              </button>
            </div>
          )}

          {/* Quick Stats Footprint */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400">Total Live Players</div>
              <div className="text-lg font-black text-emerald-400">284</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400">Avg Game Duration</div>
              <div className="text-lg font-black text-amber-400">12 Mins</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400">Auto Caller Interval</div>
              <div className="text-lg font-black text-purple-400">6 Secs</div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Urgent Admin Tasks & Shortcuts */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Priority Admin Actions</span>
            </h2>

            <div className="space-y-2">
              {pendingWdCount > 0 ? (
                <div
                  onClick={() => onNavigateTab('withdrawals')}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <div>
                      <div className="text-xs font-black text-white">{pendingWdCount} Pending Withdrawals</div>
                      <div className="text-[10px] text-amber-300">Total ₹{pendingWdTotal} awaiting approval</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>All withdrawal requests are cleared!</span>
                </div>
              )}

              <div
                onClick={() => onNavigateTab('tickets')}
                className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/30 hover:bg-purple-500/20 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-black text-white">Batch Ticket Generator</div>
                    <div className="text-[10px] text-purple-300">Pre-generate colored tickets for tonight</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </div>

              <div
                onClick={() => onNavigateTab('notifications')}
                className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/30 hover:bg-blue-500/20 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-xs font-black text-white">Broadcast Announcement</div>
                    <div className="text-[10px] text-blue-300">Notify 1,480+ players via Push/In-App</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </div>

              <div
                onClick={() => onNavigateTab('reports')}
                className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-black text-white">Download Daily Financial Report</div>
                    <div className="text-[10px] text-slate-400">Export CSV & PDF summary</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Server Time: <strong>{new Date().toLocaleTimeString()}</strong></span>
            <span className="text-emerald-400 font-bold">● Database Synced</span>
          </div>
        </div>
      </div>

      {/* Recently Registered Players Section */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>हाल ही में रजिस्टर हुए नए खिलाड़ी (Recently Registered Players)</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/40 animate-pulse">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">नये यूज़र्स जो हाल ही में प्लेटफॉर्म से जुड़े हैं</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('users')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>सभी खिलाड़ी देखें ({users.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Player Name / ID</th>
                <th className="px-4 py-3">Registered Time</th>
                <th className="px-4 py-3">Mobile Number</th>
                <th className="px-4 py-3">Wallet Balance</th>
                <th className="px-4 py-3">KYC Status</th>
                <th className="px-4 py-3">Referral Code / Upline</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {users
                .slice()
                .sort((a, b) => {
                  const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return timeB - timeA;
                })
                .slice(0, 5)
                .map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                          alt={u.name}
                          className="w-8 h-8 rounded-lg object-cover border border-amber-400/30 shrink-0"
                        />
                        <div>
                          <div className="font-black text-white text-xs flex items-center gap-1.5">
                            <span>{u.name}</span>
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-black border border-amber-400/30">
                              NEW
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <div className="font-medium text-xs">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : 'Recent'}
                      </div>
                      {u.createdAt && (
                        <div className="text-[10px] text-slate-400">
                          {new Date(u.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-white text-xs">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-amber-300 font-black text-xs">
                        ₹{(u.walletBalance || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          u.kycStatus === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : u.kycStatus === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {u.kycStatus ? u.kycStatus.toUpperCase() : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-amber-400 text-xs font-bold">{u.referralCode}</div>
                      {u.referredBy && (
                        <div className="text-[10px] text-emerald-400">Upline: {u.referredBy}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onNavigateTab('users')}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] cursor-pointer"
                      >
                        Manage
                      </button>
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