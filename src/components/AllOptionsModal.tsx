import React from 'react';
import {
  X,
  Home,
  Flame,
  Ticket,
  Trophy,
  Users,
  Wallet,
  User,
  HelpCircle,
  Gamepad2,
  LayoutDashboard,
  Radio,
  Share2,
  ArrowUpRight,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Gift,
  Award,
  LogOut,
} from 'lucide-react';

interface AllOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onNavigate: (tab: string, gameId?: string) => void;
  isAdminView?: boolean;
  onSelectAdminModule?: (moduleKey: string) => void;
  onLogout?: () => void;
}

export const AllOptionsModal: React.FC<AllOptionsModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  onNavigate,
  isAdminView = false,
  onSelectAdminModule,
  onLogout,
}) => {
  if (!isOpen) return null;

  const USER_MODULES = [
    {
      id: 'home',
      name: '1. User Dashboard Hub',
      nameHi: 'यूजर डैशबोर्ड व मुख्य पृष्ठ',
      desc: 'Player VIP status, live spotlight, quick deposit, stats & active ticket passbook',
      icon: LayoutDashboard,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40',
      badge: 'Gold Hub',
    },
    {
      id: 'games',
      name: '2. Tournament Games Lobby',
      nameHi: 'गेम्स लॉबी व शेड्यूल',
      desc: 'Upcoming, live and completed matches with timer countdowns and pools',
      icon: Gamepad2,
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/40',
      badge: 'Royale Gold',
    },
    {
      id: 'live',
      name: '3. Play Tambola Live (RNG)',
      nameHi: 'लाइव हाउसी खेलें',
      desc: 'Interactive 1–90 Master Board, audio voice caller & real-time prize claims',
      icon: Flame,
      color: 'from-purple-500/20 to-red-500/20 text-red-300 border-red-500/40',
      badge: '🔴 LIVE NOW',
    },
    {
      id: 'buy-ticket',
      name: '4. Buy Tickets & Store',
      nameHi: 'टिकट बुक करें (स्टोर)',
      desc: 'Interactive ticket selector, 6 color themes, quantity multiplier & discounts',
      icon: Ticket,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40',
      badge: 'Emerald Jade',
    },
    {
      id: 'my-tickets',
      name: '5. My Tickets & Passbook',
      nameHi: 'मेरे टिकट व प्रिंट',
      desc: 'View active/past tickets, instant QR codes, PDF/PNG download, WhatsApp share',
      icon: Ticket,
      color: 'from-indigo-500/20 to-blue-500/20 text-indigo-300 border-indigo-500/40',
      badge: 'Electric Indigo',
    },
    {
      id: 'wallet',
      name: '6. Wallet & UPI Banking',
      nameHi: 'वॉलेट, डिपॉजिट व निकासी',
      desc: 'Instant UPI/QR deposits, fast bank withdrawals & complete transaction ledger',
      icon: Wallet,
      color: 'from-emerald-500/20 to-green-500/20 text-green-300 border-green-500/40',
      badge: 'Mint Green & Gold',
    },
    {
      id: 'referral',
      name: '7. 5-Level Referral (7.8%)',
      nameHi: 'रेफरल और 5-लेवल कमाई',
      desc: 'Lifetime multi-tier commission tree, dynamic invite links & projection calc',
      icon: Users,
      color: 'from-cyan-500/20 to-sky-500/20 text-cyan-300 border-cyan-500/40',
      badge: 'Cyan Sapphire',
    },
    {
      id: 'winners',
      name: '8. Leaderboard & Winners',
      nameHi: 'लीडरबोर्ड व विजेता सूची',
      desc: 'Live winner feeds, verified claims, prize amounts & UPI payout proof tags',
      icon: Trophy,
      color: 'from-orange-500/20 to-rose-500/20 text-orange-300 border-orange-500/40',
      badge: 'Sunset Orange',
    },
    {
      id: 'daily-bonus',
      name: '9. Daily Spin & Win Rewards',
      nameHi: 'लकी स्पिन व दैनिक रिवॉर्ड',
      desc: '24h lucky wheel for free tickets, 7-day login streak cash, mystery scratch card',
      icon: Gift,
      color: 'from-pink-500/20 to-fuchsia-500/20 text-pink-300 border-pink-500/40',
      badge: 'Fuchsia Pink',
    },
    {
      id: 'how-to-play',
      name: '10. How to Play & Rules',
      nameHi: 'तंबोला नियम व गाइड',
      desc: 'Interactive pattern visualizer (Early 5, Top/Mid/Bottom line, Corners, Full House)',
      icon: HelpCircle,
      color: 'from-lime-500/20 to-emerald-500/20 text-lime-300 border-lime-500/40',
      badge: 'Lime Mint',
    },
    {
      id: 'profile',
      name: '11. Profile & KYC Center',
      nameHi: 'प्रोफ़ाइल व केवाईसी',
      desc: 'User details, Aadhaar/PAN KYC verification, UPI IDs & security settings',
      icon: User,
      color: 'from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/40',
      badge: 'Amethyst Violet',
    },
    {
      id: 'support',
      name: '12. 24x7 Support Helpline',
      nameHi: 'सहायता व हेल्पलाइन',
      desc: '24x7 Live support tickets, interactive FAQs, WhatsApp & Telegram channels',
      icon: HelpCircle,
      color: 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/40',
      badge: 'Sky Blue',
    },
  ];

  const ADMIN_MODULES = [
    {
      id: 'dashboard',
      num: '1',
      name: 'Executive Dashboard',
      desc: 'Overview stats, live revenue, active users, ticket velocity & quick actions',
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      num: '2',
      name: 'User Management',
      desc: 'KYC review, block/unblock, password reset & wallet balance credit/debit',
      icon: Users,
    },
    {
      id: 'games',
      num: '3',
      name: 'Game Management',
      desc: 'Create tournaments, configure ticket pricing, schedules & prize pools',
      icon: Gamepad2,
    },
    {
      id: 'live_control',
      num: '4',
      name: 'Live Game Control',
      desc: 'Manual/auto RNG caller engine, call next ball, game timer & board reset',
      icon: Radio,
    },
    {
      id: 'tickets',
      num: '5',
      name: 'Ticket Management',
      desc: 'Bulk ticket generator, duplication validator & high-resolution print exports',
      icon: Ticket,
    },
    {
      id: 'prizes',
      num: '6',
      name: 'Prize Matrix Management',
      desc: 'Configure prize distribution for Jaldi 5, Lines, Corners & Full House',
      icon: Trophy,
    },
    {
      id: 'referrals',
      num: '7',
      name: '5-Level MLM Structure',
      desc: 'Tiered commissions (4%, 2%, 1%, 0.5%, 0.3%), payouts & promoter tracking',
      icon: Share2,
    },
    {
      id: 'wallets',
      num: '8',
      name: 'Wallet & Ledger Master',
      desc: 'Full financial audit trail, credit/debit adjustments & transaction records',
      icon: Wallet,
    },
    {
      id: 'withdrawals',
      num: '9',
      name: 'Withdrawal Approvals',
      desc: 'Instant UPI payout dispatcher, manual approval queue & payment verification',
      icon: ArrowUpRight,
    },
    {
      id: 'reports',
      num: '10',
      name: 'Analytics & Revenue Reports',
      desc: 'P&L statements, platform margins, user acquisition & engagement metrics',
      icon: BarChart3,
    },
    {
      id: 'notifications',
      num: '11',
      name: 'Notification Broadcast Center',
      desc: 'Push announcements, game alerts, WhatsApp/SMS alerts & live ticker',
      icon: Bell,
    },
    {
      id: 'settings',
      num: '12',
      name: 'Global Site Settings & Branding',
      desc: 'UPI ID config, QR upload, voice caller language & deposit thresholds',
      icon: Settings,
    },
  ];

  const handleUserClick = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  const handleAdminClick = (moduleKey: string) => {
    if (onSelectAdminModule) {
      onSelectAdminModule(moduleKey);
    }
    onNavigate('admin');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] my-auto bg-[#0c101c] border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 bg-gradient-to-r from-purple-950/40 via-slate-900 to-amber-950/40 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl sm:rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                <span>All Options &amp; Dedicated Pages (सभी विकल्प)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase">
                  24 Dedicated Pages
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                12 User Portal Modules + 12 Full Master Admin Control Panels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-6">
          {/* Section 1: User Options (12 Items) */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                  User Dashboard Modules (12 Dedicated Pages)
                </h3>
              </div>
              <span className="text-[10px] sm:text-xs text-amber-400 font-bold">1-Click Open</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {USER_MODULES.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleUserClick(item.id)}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 group hover:scale-[1.01] bg-gradient-to-br ${item.color} ${
                      isActive ? 'ring-2 ring-amber-400 shadow-lg' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/60 border border-white/10 text-white group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/10 text-slate-300">
                        {item.badge}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors truncate">
                        {item.name}
                      </h4>
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-300 opacity-90 truncate">
                        {item.nameHi}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-300">
                      <span>Open Page</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-amber-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Admin Options */}
          <div className="space-y-3 sm:space-y-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                  Admin Master Control Panels (12 Modules)
                </h3>
              </div>
              <span className="text-[10px] sm:text-xs text-red-400 font-bold">Admin Master Suite</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {ADMIN_MODULES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAdminClick(item.id)}
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/80 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 group hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-xs font-mono font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                        MOD #{item.num}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-red-300 transition-colors truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-red-400">
                      <span>Launch Panel</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Account Session & Logout */}
          {onLogout && (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">खाता सत्र व सुरक्षा (Account Session)</h4>
                  <p className="text-[11px] text-slate-400">इस डिवाइस से तुरंत सुरक्षित रूप से बाहर निकलें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लॉगआउट करें (Log Out)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
