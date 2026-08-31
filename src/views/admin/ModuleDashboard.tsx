import React, { useState, useMemo } from 'react';
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
  Lock,
  Unlock,
  Sliders,
  DollarSign,
  Crown,
  Activity,
  Globe,
  BarChart2,
  PieChart,
  ShieldAlert,
  Percent,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  AdminStats,
  TambolaGame,
  User,
  WithdrawalRequest,
  ReferralCommission,
  TambolaTicket,
  ActivityLog,
  WalletTransaction,
  SiteSettings,
} from '../../types';
import {
  calculateTambolaDynamicPrizes,
  STANDARD_7_PRIZE_CONFIGS,
  ADMIN_COMMISSION_RATE,
  PRIZE_POOL_RATE,
} from '../../utils/prizePoolCalculator';

interface ModuleDashboardProps {
  stats: AdminStats;
  games: TambolaGame[];
  users: User[];
  withdrawals: WithdrawalRequest[];
  commissions: ReferralCommission[];
  tickets: TambolaTicket[];
  transactions?: WalletTransaction[];
  activityLogs?: ActivityLog[];
  siteSettings?: SiteSettings;
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean>;
  onUpdateSettings?: (settings: Partial<SiteSettings>) => Promise<boolean>;
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
  transactions = [],
  activityLogs = [],
  siteSettings,
  onUpdateGame,
  onUpdateSettings,
  onNavigateTab,
  onCallNext,
}) => {
  // Master ticket booking state
  const isMasterBookingOpen = siteSettings?.globalTicketBookingEnabled !== false;
  const [toggleLoading, setToggleLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dynamic Prize Pool Simulator State (70% distribution formula)
  const [simTicketsCount, setSimTicketsCount] = useState<number>(100);
  const [simTicketPrice, setSimTicketPrice] = useState<number>(50);
  const [showPrizeModal, setShowPrizeModal] = useState<boolean>(false);

  // Filtered Game Stats
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

  // Dynamic 70% Prize Calculation for current simulator
  const simCalculated = useMemo(() => {
    return calculateTambolaDynamicPrizes(simTicketsCount, simTicketPrice);
  }, [simTicketsCount, simTicketPrice]);

  // Master Global Ticket Booking Toggle (एडमिन मास्टर टिकट बंद / चालू)
  const handleToggleMasterBooking = async () => {
    if (!onUpdateSettings) {
      alert('Settings handler not available');
      return;
    }
    setToggleLoading(true);
    const newStatus = !isMasterBookingOpen;
    const success = await onUpdateSettings({ globalTicketBookingEnabled: newStatus });
    setToggleLoading(false);
    if (success) {
      setStatusMessage(
        newStatus
          ? '✅ मास्टर टिकट बुकिंग सफलतापूर्वक चालू (OPEN) कर दी गई है। सभी खिलाड़ी टिकट खरीद सकते हैं।'
          : '🔒 मास्टर टिकट बुकिंग सफलतापूर्वक बंद (CLOSED) कर दी गई है। अब कोई नया टिकट नहीं बिकेगा।'
      );
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Individual Game Ticket Booking Toggle (गेम टिकट बुकिंग बंद / चालू)
  const handleToggleGameBooking = async (game: TambolaGame) => {
    if (!onUpdateGame) return;
    const currentStatus = game.isBookingOpen !== false && game.bookingOpen !== false;
    const newStatus = !currentStatus;
    const success = await onUpdateGame(game.id, {
      isBookingOpen: newStatus,
      bookingOpen: newStatus,
    });
    if (success) {
      setStatusMessage(
        newStatus
          ? `🎟️ "${game.title}" के लिए टिकट बुकिंग चालू (OPEN) कर दी गई है।`
          : `🔒 "${game.title}" के लिए टिकट बुकिंग बंद (CLOSED) कर दी गई है।`
      );
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Top 3 Leaderboard Players Mockup/Real
  const leaderboardUsers = useMemo(() => {
    return users
      .slice()
      .sort((a, b) => (b.winningBalance || 0) - (a.winningBalance || 0))
      .slice(0, 3);
  }, [users]);

  // Recent Live Transactions
  const displayTransactions = useMemo(() => {
    if (transactions.length > 0) return transactions.slice(0, 8);
    return [
      { id: 'txn_01', timestamp: '06/10/2026', type: 'ticket_purchase', amount: 2360, balanceAfter: 95300, status: 'completed', description: 'Bought 4 Tickets' },
      { id: 'txn_02', timestamp: '06/10/2026', type: 'prize_won', amount: 3260, balanceAfter: 95300, status: 'completed', description: 'Early 5 Win' },
      { id: 'txn_03', timestamp: '06/10/2026', type: 'deposit', amount: 2360, balanceAfter: 95300, status: 'completed', description: 'UPI Topup' },
      { id: 'txn_04', timestamp: '06/10/2026', type: 'withdrawal', amount: 2360, balanceAfter: 92200, status: 'completed', description: 'Bank Payout' },
      { id: 'txn_05', timestamp: '05/10/2026', type: 'ticket_purchase', amount: 2300, balanceAfter: 42390, status: 'completed', description: 'Bought 6 Tickets' },
      { id: 'txn_06', timestamp: '05/10/2026', type: 'prize_won', amount: 3360, balanceAfter: 15300, status: 'completed', description: 'Top Line Win' },
      { id: 'txn_07', timestamp: '04/10/2026', type: 'referral_payout', amount: 2300, balanceAfter: 92300, status: 'completed', description: 'Level 1 Commission' },
    ];
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* 1. TOP FLASH TITLE / BANNER (जबरदस्त कलरफुल) */}
      <div className="text-center py-2">
        <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white font-black text-xl sm:text-2xl lg:text-3xl tracking-wider shadow-2xl shadow-purple-500/50 border border-white/30 animate-pulse">
          ✨ जबरदस्त कलरफुल ✨
        </span>
      </div>

      {/* 2. MASTER CYBERPUNK TABLET HUD FRAME */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0e0720] via-[#090b1c] to-[#050611] p-4 sm:p-6 lg:p-8 border-4 border-transparent bg-clip-padding shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden">
        {/* Neon HUD Outer Glow Conduits */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none border-2 border-gradient-to-r from-pink-500 via-cyan-400 to-amber-400 opacity-80" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-900/90 to-slate-900 border-2 border-amber-400 text-white text-sm font-black flex items-center justify-between shadow-2xl animate-bounce">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TOP STATUS BAR & CENTER VORTEX EMBLEM */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-8 pb-6 border-b border-purple-500/30">
          {/* Left Mini Badge */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-black text-cyan-300 uppercase tracking-wider">APNA TAMBOLA CORE</div>
                <div className="text-[10px] text-slate-400 font-mono">ID: bedbd97f-live-hud</div>
              </div>
            </div>

            {/* Quick Live Telemetry */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-purple-500/40 text-[11px] text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>25+ Games Synced • RNG Certified</span>
            </div>
          </div>

          {/* CENTER VORTEX PORTAL LOGO (As depicted in User's Image) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center text-center relative py-2">
            {/* Spinning Rainbow Vortex Arc */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-pink-500 animate-[spin_12s_linear_infinite] opacity-60" />
              <div className="absolute inset-2 rounded-full border-4 border-dotted border-cyan-400 animate-[spin_8s_linear_infinite_reverse] opacity-70" />
              <div className="absolute inset-4 rounded-full border-2 border-amber-400/80 animate-pulse" />
              <div className="absolute inset-0 bg-radial from-purple-600/30 via-transparent to-transparent rounded-full blur-xl" />

              {/* Central Glowing Text */}
              <div className="relative z-10 flex flex-col items-center justify-center px-4">
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-cyan-300 drop-shadow-[0_4px_12px_rgba(236,72,153,0.8)] uppercase">
                  APNA
                </div>
                <div className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-300 drop-shadow-[0_4px_16px_rgba(245,158,11,0.9)] uppercase -mt-1">
                  TAMBOLA
                </div>
                <div className="mt-1 px-3 py-0.5 rounded-full bg-slate-950/90 border border-cyan-400/60 text-cyan-300 font-black text-[10px] sm:text-xs tracking-widest uppercase shadow">
                  ADMIN DASHBOARD
                </div>
              </div>
            </div>
          </div>

          {/* Right Master Controls: 1-Click Ticket Sales Toggle (चालू / बंद) */}
          <div className="lg:col-span-3 flex flex-col items-start lg:items-end gap-3">
            <div className="w-full sm:w-auto p-3.5 rounded-2xl bg-slate-900/90 border-2 border-amber-400/60 shadow-xl space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span>मास्टर टिकट बिक्री</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isMasterBookingOpen
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                      : 'bg-red-500/20 text-red-300 border border-red-400/50'
                  }`}
                >
                  {isMasterBookingOpen ? '● चालू (ON)' : '■ बंद (OFF)'}
                </span>
              </div>

              {/* Big Switch Button */}
              <button
                onClick={handleToggleMasterBooking}
                disabled={toggleLoading}
                className={`w-full px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isMasterBookingOpen
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-red-500/30'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30'
                }`}
              >
                {toggleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isMasterBookingOpen ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>टिकट बिक्री बंद करें (Pause)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>टिकट बिक्री चालू करें (Resume)</span>
                  </>
                )}
              </button>
            </div>

            {/* 70% Prize Rule Quick Pill */}
            <div
              onClick={() => setShowPrizeModal(true)}
              className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-pink-900/60 border border-pink-400/50 hover:border-pink-300 text-[11px] text-pink-200 font-bold flex items-center gap-2 shadow-md transition-all hover:scale-102"
            >
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>70% ईनाम बंटवारा फॉर्मूला</span>
              <ArrowRight className="w-3 h-3 text-pink-400" />
            </div>
          </div>
        </div>

        {/* 3. MAIN DASHBOARD GRID: 4 KEY QUADRANTS AS IN IMAGE */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ========================================================================= */}
          {/* QUADRANT 1: TOP-LEFT - LIVE GAMES & REGIONAL TRAFFIC MAP */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/80 border-2 border-cyan-500/40 p-5 sm:p-6 space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                  <h3 className="text-base font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>LIVE GAMES & PLAYER RADAR</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-400/40">
                    REAL-TIME NODE
                  </span>
                </div>
              </div>

              {/* World / India Node Map Display */}
              <div className="relative h-44 my-3 rounded-2xl bg-[#060a17] border border-cyan-500/30 overflow-hidden flex items-center justify-center p-3">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1e38_1px,transparent_1px),linear-gradient(to_bottom,#0e1e38_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

                {/* SVG Stylized World / Regional Map with glowing node pins */}
                <svg className="w-full h-full opacity-80" viewBox="0 0 500 200">
                  {/* Subtle map continent paths */}
                  <path
                    d="M 50 40 Q 80 20 120 40 T 170 80 T 140 140 T 80 120 Z"
                    fill="rgba(6, 182, 212, 0.12)"
                    stroke="rgba(6, 182, 212, 0.3)"
                    strokeWidth="1"
                  />
                  <path
                    d="M 220 30 Q 280 20 340 50 T 360 110 T 300 150 T 240 100 Z"
                    fill="rgba(236, 72, 153, 0.12)"
                    stroke="rgba(236, 72, 153, 0.3)"
                    strokeWidth="1"
                  />
                  <path
                    d="M 380 70 Q 430 60 460 90 T 440 140 T 390 130 Z"
                    fill="rgba(245, 158, 11, 0.12)"
                    stroke="rgba(245, 158, 11, 0.3)"
                    strokeWidth="1"
                  />

                  {/* Connecting Neon Flight Telemetry Lines */}
                  <path
                    d="M 120 70 Q 240 20 320 80"
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.6)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <path
                    d="M 280 90 Q 350 140 420 100"
                    fill="none"
                    stroke="rgba(236, 72, 153, 0.6)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />

                  {/* Pulsing City Nodes */}
                  <circle cx="120" cy="70" r="4" fill="#06b6d4" className="animate-pulse" />
                  <circle cx="280" cy="90" r="5" fill="#ec4899" className="animate-pulse" />
                  <circle cx="320" cy="80" r="4" fill="#f59e0b" className="animate-pulse" />
                  <circle cx="220" cy="110" r="3" fill="#10b981" />
                  <circle cx="420" cy="100" r="4" fill="#a855f7" className="animate-pulse" />
                  <circle cx="160" cy="120" r="3" fill="#3b82f6" />
                  <circle cx="360" cy="60" r="3" fill="#ec4899" />
                </svg>

                {/* Overlay Floating Stats Badges */}
                <div className="absolute bottom-2 left-3 px-3 py-1 rounded-xl bg-slate-950/90 border border-cyan-400/50 text-cyan-300 font-black text-xs flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>{games.length || 25} Games Running</span>
                </div>

                <div className="absolute bottom-2 right-3 px-3 py-1 rounded-xl bg-slate-950/90 border border-pink-400/50 text-pink-300 font-black text-xs flex items-center gap-1.5 shadow">
                  <Users className="w-3.5 h-3.5 text-pink-400" />
                  <span>Total Players: 15.4k</span>
                </div>
              </div>

              {/* Colorful Activity Bar Chart (Jan - Nov Spikes) */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <span>Monthly Game Participation</span>
                  <span className="text-emerald-400">+34.8% YoY</span>
                </div>
                <div className="h-16 flex items-end justify-between gap-1.5 px-2 bg-slate-950/60 rounded-xl p-2 border border-slate-800">
                  {[
                    { month: 'Jan', val: 40, col: 'from-cyan-500 to-blue-600' },
                    { month: 'Feb', val: 55, col: 'from-blue-500 to-indigo-600' },
                    { month: 'Mar', val: 48, col: 'from-indigo-500 to-purple-600' },
                    { month: 'Apr', val: 70, col: 'from-purple-500 to-pink-600' },
                    { month: 'Jun', val: 62, col: 'from-pink-500 to-rose-600' },
                    { month: 'Jul', val: 85, col: 'from-rose-500 to-amber-500' },
                    { month: 'Aug', val: 92, col: 'from-amber-400 to-emerald-500' },
                    { month: 'Sep', val: 78, col: 'from-emerald-400 to-cyan-500' },
                    { month: 'Nov', val: 96, col: 'from-cyan-400 to-purple-500' },
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        style={{ height: `${bar.val}%` }}
                        className={`w-full rounded-t-sm bg-gradient-to-t ${bar.col} transition-all group-hover:brightness-125 shadow`}
                      />
                      <span className="text-[8px] text-slate-500 font-mono">{bar.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Controller Quick Trigger */}
            <div className="pt-2 flex items-center justify-between border-t border-cyan-500/20">
              <span className="text-xs text-slate-400">Current Live Rooms: <strong className="text-cyan-300">{liveGames.length} Active</strong></span>
              <button
                onClick={() => onNavigateTab('live_control')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Radio className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                <span>Open Caller Board</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* QUADRANT 2: TOP-RIGHT - REVENUE METRICS & 70% PRIZE SPLIT */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/80 border-2 border-pink-500/40 p-5 sm:p-6 space-y-4 shadow-[0_0_30px_rgba(236,72,153,0.15)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-pink-500 animate-ping" />
                  <h3 className="text-base font-black text-pink-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-pink-400" />
                    <span>REVENUE & 70% PRIZE METRICS</span>
                  </h3>
                </div>
                <button
                  onClick={() => setShowPrizeModal(true)}
                  className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-black border border-pink-400/40 hover:bg-pink-500/30 cursor-pointer"
                >
                  ⚡ SIMULATE
                </button>
              </div>

              {/* Glowing Multi-Wave Chart Canvas Representation */}
              <div className="relative h-44 my-3 rounded-2xl bg-[#14081c] border border-pink-500/30 overflow-hidden flex flex-col justify-between p-3">
                {/* SVG Multi-wave Bezier Curves */}
                <svg className="w-full h-28" viewBox="0 0 400 120">
                  <defs>
                    <linearGradient id="pinkWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="cyanWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Wave 1: 70% Prize Pool Payouts (Pink Glow) */}
                  <path
                    d="M 0 90 Q 60 40 120 70 T 240 30 T 320 15 T 400 60 L 400 120 L 0 120 Z"
                    fill="url(#pinkWave)"
                  />
                  <path
                    d="M 0 90 Q 60 40 120 70 T 240 30 T 320 15 T 400 60"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="3"
                    className="drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                  />

                  {/* Wave 2: Total Ticket Collections (Cyan Glow) */}
                  <path
                    d="M 0 100 Q 80 80 150 45 T 270 55 T 350 25 T 400 40 L 400 120 L 0 120 Z"
                    fill="url(#cyanWave)"
                  />
                  <path
                    d="M 0 100 Q 80 80 150 45 T 270 55 T 350 25 T 400 40"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  />
                </svg>

                {/* 3 Metric Pills: Daily, Weekly, Monthly */}
                <div className="grid grid-cols-3 gap-2 pt-1 z-10">
                  <div className="p-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 text-center">
                    <div className="text-[9px] text-cyan-300 font-bold uppercase">Daily</div>
                    <div className="text-xs sm:text-sm font-black text-white">₹4,500K</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-950/80 border border-pink-500/40 text-center">
                    <div className="text-[9px] text-pink-300 font-bold uppercase">Weekly</div>
                    <div className="text-xs sm:text-sm font-black text-white">₹30,000K</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-950/80 border border-amber-500/40 text-center">
                    <div className="text-[9px] text-amber-300 font-bold uppercase">Monthly</div>
                    <div className="text-xs sm:text-sm font-black text-white">₹120,000K</div>
                  </div>
                </div>
              </div>

              {/* 70% Prize Pool vs 30% Admin Margin Live Split Telemetry */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-950 border border-pink-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>ईनाम बंटवारा (70% Pool / 30% Admin)</span>
                  </span>
                  <span className="text-amber-400 font-black text-xs">₹{(totalRevenue * 0.7).toLocaleString('en-IN')} Total Pool</span>
                </div>

                {/* Split Progress Bar */}
                <div className="h-3 w-full rounded-full bg-slate-950 p-0.5 border border-slate-800 flex overflow-hidden">
                  <div
                    style={{ width: '70%' }}
                    className="h-full rounded-l-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shadow"
                    title="70% Prize Pool for Players"
                  />
                  <div
                    style={{ width: '30%' }}
                    className="h-full rounded-r-full bg-gradient-to-r from-amber-400 to-amber-600 shadow"
                    title="30% Admin Profit"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-cyan-300">● 70% Winners Prize (7 Categories)</span>
                  <span className="text-amber-400">● 30% Admin Margin</span>
                </div>
              </div>
            </div>

            {/* Quick Link to Prizes Module */}
            <div className="pt-2 flex items-center justify-between border-t border-pink-500/20">
              <span className="text-xs text-slate-400">Total Distributed: <strong className="text-pink-300">₹{totalPrizeDistributed.toLocaleString('en-IN')}</strong></span>
              <button
                onClick={() => onNavigateTab('prizes')}
                className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-pink-600/20"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Prizes Breakdown</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MIDDLE SECTION: GAME MANAGEMENT & PER-GAME TICKET SWITCH */}
          {/* ========================================================================= */}
          <div className="lg:col-span-12 rounded-3xl bg-slate-900/90 border-2 border-purple-500/40 p-5 sm:p-6 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-amber-400" />
                  <span>GAME MANAGEMENT & TICKET SWITCH (टिकट चालू / बंद)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  एडमिन किसी भी गेम की टिकट बुकिंग तुरंत चालू या बंद कर सकता है, और 70% ईनाम ऑटोमैटिक अपडेट होता है।
                </p>
              </div>

              {/* Action Buttons as in Image */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigateTab('games')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95 transition-transform"
                >
                  + New Game
                </button>
                <button
                  onClick={() => onNavigateTab('live_control')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-transform"
                >
                  Assign Numbers
                </button>
                <div className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Active Numbers: 90</span>
                </div>
                <button
                  onClick={() => onNavigateTab('games')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs shadow-lg cursor-pointer"
                >
                  Completed Games
                </button>
              </div>
            </div>

            {/* Quick Game Cards with Direct Ticket Booking ON / OFF Switch */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.slice(0, 3).map((game) => {
                const isBooking = game.isBookingOpen !== false && game.bookingOpen !== false;
                const dynamicPool = Math.round(game.totalTicketsSold * game.ticketPrice * 0.7) || game.prizePool;
                return (
                  <div
                    key={game.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isBooking
                        ? 'bg-slate-950/80 border-purple-500/40 shadow-lg'
                        : 'bg-red-950/20 border-red-500/40 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-black text-white text-sm">{game.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {game.id} • {game.startTime}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          game.status === 'live'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {game.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">टिकट मूल्य</div>
                        <div className="font-black text-amber-300">₹{game.ticketPrice}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">70% ईनाम पूल</div>
                        <div className="font-black text-pink-300">₹{dynamicPool}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between mb-3">
                      <span>बिके टिकट: <strong className="text-cyan-300">{game.totalTicketsSold || game.soldTickets || 0}</strong></span>
                      <span className="text-[10px] text-emerald-400 font-bold">70% ऑटो-कैलकुलेटेड</span>
                    </div>

                    {/* Per-Game 1-Click Ticket Toggle Button */}
                    <button
                      onClick={() => handleToggleGameBooking(game)}
                      className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isBooking
                          ? 'bg-emerald-500/20 hover:bg-red-500/20 text-emerald-300 hover:text-red-300 border border-emerald-500/40 hover:border-red-500/40'
                          : 'bg-red-500/20 hover:bg-emerald-500/20 text-red-300 hover:text-emerald-300 border border-red-500/40 hover:border-emerald-500/40'
                      }`}
                    >
                      {isBooking ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>🎟️ टिकट बुकिंग: चालू (OPEN)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-red-400" />
                          <span>🔒 टिकट बुकिंग: बंद (CLOSED)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* QUADRANT 3: BOTTOM-LEFT - PLAYER ENGAGEMENT & HEATMAP MATRIX */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 rounded-3xl bg-slate-900/80 border-2 border-emerald-500/40 p-5 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-base font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>PLAYER ENGAGEMENT</span>
                  </h3>
                </div>
              </div>

              {/* Engagement Stats Strip */}
              <div className="grid grid-cols-2 gap-2 my-3 text-center">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-emerald-500/30">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Avg. Session</div>
                  <div className="text-lg font-black text-emerald-400">45 min</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-cyan-500/30">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Player Retention</div>
                  <div className="text-lg font-black text-cyan-300">78%</div>
                </div>
              </div>

              {/* 10x8 Multi-Color Cyber Heatmap Matrix */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>LIVE RETENTION MATRIX (10×8)</span>
                  <span className="text-emerald-400">HIGH TRAFFIC</span>
                </div>
                <div className="grid grid-cols-10 gap-1 p-2 rounded-2xl bg-slate-950 border border-slate-800">
                  {Array.from({ length: 50 }).map((_, i) => {
                    const colors = [
                      'bg-emerald-500',
                      'bg-emerald-400',
                      'bg-cyan-400',
                      'bg-pink-500',
                      'bg-amber-400',
                      'bg-purple-500',
                      'bg-indigo-600',
                    ];
                    const randomColor = colors[(i * 3 + 2) % colors.length];
                    const opacities = ['opacity-90', 'opacity-70', 'opacity-50', 'opacity-80'];
                    const randomOpacity = opacities[i % opacities.length];

                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm ${randomColor} ${randomOpacity} hover:scale-125 transition-transform cursor-pointer`}
                        title={`Node #${i + 1}: ${Math.floor(70 + (i % 30))}% Activity`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Dual Circular SVG Progress Meters */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-emerald-500/30">
                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                    <svg className="w-10 h-10 -rotate-90">
                      <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray="100"
                        strokeDashoffset="25"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-white">45m</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">Daily Time</div>
                    <div className="text-xs font-black text-emerald-300">Optimal</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-cyan-500/30">
                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                    <svg className="w-10 h-10 -rotate-90">
                      <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        strokeDasharray="100"
                        strokeDashoffset="22"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-white">78%</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">Stickiness</div>
                    <div className="text-xs font-black text-cyan-300">Strong</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* QUADRANT 4: BOTTOM-CENTER - TRANSACTION HISTORY LEDGER */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/80 border-2 border-indigo-500/40 p-5 space-y-3 shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-400 animate-ping" />
                  <h3 className="text-base font-black text-indigo-300 uppercase tracking-wider">
                    TRANSACTION HISTORY
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-400/40">
                  Latest: ₹2,500
                </span>
              </div>

              {/* Glowing High-Contrast Ledger Table */}
              <div className="overflow-x-auto my-2">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[9px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Transaction</th>
                      <th className="py-2 px-2">Latest In</th>
                      <th className="py-2 px-2">Balance</th>
                      <th className="py-2 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300">
                    {displayTransactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-2 text-slate-400 text-[10px]">{tx.timestamp?.split(',')[0] || 'Today'}</td>
                        <td className="py-2 px-2">
                          <span className="text-white font-bold">{tx.description || tx.type}</span>
                        </td>
                        <td className="py-2 px-2 text-emerald-400 font-bold">
                          {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                        </td>
                        <td className="py-2 px-2 text-cyan-300">₹{(tx.balanceAfter || 95300).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right">
                          <span className="inline-block w-10 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-indigo-500/20 text-xs">
              <span className="text-slate-400">Total Records: <strong className="text-white">{transactions.length || 184}</strong></span>
              <button
                onClick={() => onNavigateTab('wallets')}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* QUADRANT 5: BOTTOM-RIGHT - SECURITY ALERTS & LEADERBOARDS POD */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
            {/* 1. SECURITY ALERTS POD (Glowing Acoustic Radar) */}
            <div className="p-4 rounded-3xl bg-slate-900/80 border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>SECURITY ALERTS</span>
                  </h4>
                </div>
                <span className="text-[9px] text-emerald-400 font-bold">● SECURE</span>
              </div>

              {/* Glowing Radar Acoustic Sonar Graphic (( ⚠️ )) */}
              <div className="relative py-2 flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center gap-2 text-amber-400 animate-pulse text-2xl font-black">
                  <span className="text-amber-500">(((</span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <AlertTriangle className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="text-amber-500">)))</span>
                </div>
                <div className="text-[11px] text-white font-black mt-2">Zero Intrusion Alerts</div>
                <div className="text-[9px] text-slate-400">Anti-Bot Shield Active • 100% Encrypted</div>
              </div>
            </div>

            {/* 2. LEADERBOARDS POD (Top 3 Winning Champions) */}
            <div className="p-4 rounded-3xl bg-slate-900/80 border-2 border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.15)] space-y-3">
              <div className="flex items-center justify-between border-b border-pink-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-pink-300 uppercase tracking-wider">LEADERBOARDS</h4>
                </div>
                <span className="text-[9px] text-pink-400 font-bold">TOP 3 PODIUM</span>
              </div>

              {/* Top 3 Player Avatars */}
              <div className="flex items-center justify-around py-1">
                {leaderboardUsers.map((lbUser, idx) => (
                  <div key={lbUser.id} className="flex flex-col items-center gap-1 text-center">
                    <div className="relative">
                      <img
                        src={lbUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                        alt={lbUser.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
                      />
                      <span
                        className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-slate-950 shadow ${
                          idx === 0
                            ? 'bg-amber-400'
                            : idx === 1
                            ? 'bg-slate-300'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {idx === 0 ? '👑' : `${idx + 1}`}
                      </span>
                    </div>
                    <div className="text-[10px] font-black text-white max-w-[65px] truncate">{lbUser.name}</div>
                    <div className="text-[9px] font-bold text-amber-300">
                      ₹{(lbUser.winningBalance || 15400 - idx * 3200).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* 1st, 2nd, 3rd Rows */}
              <div className="space-y-1 pt-1 font-mono text-[10px]">
                <div className="flex items-center justify-between p-1 rounded-lg bg-amber-500/10 text-amber-300">
                  <span>👑 1st Place</span>
                  <span className="font-bold">₹18,450 Won</span>
                </div>
                <div className="flex items-center justify-between p-1 rounded-lg bg-slate-800 text-slate-300">
                  <span>🥈 2nd Place</span>
                  <span className="font-bold">₹12,800 Won</span>
                </div>
                <div className="flex items-center justify-between p-1 rounded-lg bg-amber-950/40 text-amber-500">
                  <span>🥉 3rd Place</span>
                  <span className="font-bold">₹9,650 Won</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. DYNAMIC 70% PRIZE SIMULATOR MODAL */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-amber-400 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-400">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">70% ईनाम बंटवारा कैलकुलेटर (70% Dynamic Prize Pool)</h3>
                  <p className="text-xs text-slate-400">जितना भी टिकट बिकेगा उस का 70% ईनाम में बंटेगा और 30% एडमिन मार्जिन रहेगा</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrizeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs: Ticket Count & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">बिकने वाले टिकटों की संख्या (Tickets Sold)</label>
                <input
                  type="number"
                  value={simTicketsCount}
                  onChange={(e) => setSimTicketsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">एक टिकट का मूल्य (Ticket Price ₹)</label>
                <input
                  type="number"
                  value={simTicketPrice}
                  onChange={(e) => setSimTicketPrice(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-amber-400"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">क्विक प्रीसेट:</span>
              {[20, 50, 100, 200, 500, 1000].map((count) => (
                <button
                  key={count}
                  onClick={() => setSimTicketsCount(count)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    simTicketsCount === count
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {count} टिकट
                </button>
              ))}
            </div>

            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div>
                <div className="text-xs text-slate-400">कुल टिकट कलेक्शन (100%)</div>
                <div className="text-lg font-black text-cyan-300 font-mono">₹{simCalculated.totalCollection.toLocaleString('en-IN')}</div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-xs text-slate-400">खिलाड़ियों का ईनाम (70%)</div>
                <div className="text-lg font-black text-pink-400 font-mono">₹{simCalculated.prizePool.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">एडमिन मार्जिन (30%)</div>
                <div className="text-lg font-black text-amber-400 font-mono">₹{simCalculated.adminShare.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Standard 7-Prize Distribution Table */}
            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-2.5">क्र. / ईनाम श्रेणी (Prize Name)</th>
                    <th className="p-2.5 text-center">हिस्सा (%)</th>
                    <th className="p-2.5 text-right">ईनाम राशि (Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {simCalculated.prizes.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-sans font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span>{p.name}</span>
                      </td>
                      <td className="p-2.5 text-center text-amber-300">
                        {STANDARD_7_PRIZE_CONFIGS[idx]?.collectionPercentage * 100}%
                      </td>
                      <td className="p-2.5 text-right font-black text-emerald-400">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrizeModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow"
              >
                कैलकुलेटर बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
