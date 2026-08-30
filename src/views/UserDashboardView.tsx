import React, { useState } from 'react';
import {
  Gamepad2,
  Flame,
  Ticket,
  Wallet,
  Users,
  Trophy,
  Gift,
  HelpCircle,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  QrCode,
  Clock,
  CheckCircle2,
  Star,
  Zap,
  Activity,
  Play,
  RotateCcw,
  IndianRupee,
  Share2,
  Radio,
  FileText,
  Percent,
  Layers,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import { User, TambolaGame, TambolaTicket, GameWinner, ReferralMember, ReferralCommission } from '../types';
import { isDirectChildOf } from '../utils/referralMatcher';

interface UserDashboardViewProps {
  currentUser?: User | null;
  allUsers?: User[];
  games: TambolaGame[];
  tickets: TambolaTicket[];
  winners: GameWinner[];
  referralMembers?: ReferralMember[];
  commissions?: ReferralCommission[];
  onNavigate: (tab: string, gameId?: string) => void;
  onOpenDeposit: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  currentUser,
  allUsers = [],
  games,
  tickets,
  winners,
  referralMembers,
  commissions = [],
  onNavigate,
  onOpenDeposit,
  onOpenAuth,
}) => {
  const liveGame = games.find((g) => g.status === 'live');
  const upcomingGames = games.filter((g) => g.status === 'upcoming');
  const myActiveTickets = tickets.filter((t) => {
    const matchedGame = games.find((g) => g.id === t.gameId);
    return matchedGame && matchedGame.status !== 'completed';
  });

  // Upline sponsor lookup using canonical referral matching
  const uplineUser = currentUser ? (
    allUsers.find((u) => {
      if (!currentUser || u.id === currentUser.id) return false;
      return isDirectChildOf(currentUser, u, commissions);
    }) || null
  ) : null;

  // Calculate player stats
  const totalGamesPlayed = currentUser?.gamesPlayed || 0;
  const totalWinnings = currentUser?.totalWon || 0;
  // Direct Live Users from canonical matcher & database fields (works across all devices)
  const directLiveUsers = currentUser
    ? allUsers.filter((u) => {
        if (!u || u.id === currentUser.id) return false;
        if (u.referrer_id && (u.referrer_id === currentUser.id || u.referrer_id === (currentUser as any).user_id || u.referrer_id === currentUser.referralCode)) {
          return true;
        }
        if (u.referredByUserId && (u.referredByUserId === currentUser.id || u.referredByUserId === currentUser.referralCode)) {
          return true;
        }
        if (u.referredBy && (u.referredBy === currentUser.referralCode || u.referredBy === currentUser.id)) {
          return true;
        }
        return isDirectChildOf(u, currentUser, commissions);
      })
    : [];

  const directReferralCount = directLiveUsers.length;
  const referralCount = referralMembers && referralMembers.length > 0
    ? referralMembers.length
    : directLiveUsers.length;
  const isDepositor = Boolean(
    currentUser?.hasDeposited ||
    (currentUser?.depositBalance || 0) > 0 ||
    currentUser?.firstDepositBonusClaimed
  );

  const [copiedRefLink, setCopiedRefLink] = useState(false);
  const [directSearch, setDirectSearch] = useState('');

  const referralCode = currentUser?.referralCode || currentUser?.id || 'AT10001';
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${referralCode}`
    : `https://apnatambola.in/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopiedRefLink(true);
      setTimeout(() => setCopiedRefLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉 Join Apna Tambola Live & Play Online Housie with me! Use my Referral Code *${referralCode}* to get ₹10 Bonus: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const filteredDirectUsers = directLiveUsers.filter((u) => {
    if (!directSearch) return true;
    const q = directSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.referralCode?.toLowerCase().includes(q)
    );
  });

  // 11 Distinct Dashboard Options with High-Contrast, Vibrant, Beautiful Color Themes
  const DASHBOARD_MODULES = [
    {
      id: 'games',
      name: 'Games Lobby & Schedule',
      nameHi: '1. गेम्स लॉबी & शेड्यूल',
      desc: '₹5, ₹10, ₹15, ₹50 के सभी लाइव व आगामी तंबोला मैचों का टाइम टेबल और बम्पर जैकपॉट प्राइज पूल देखें।',
      icon: Gamepad2,
      themeName: 'Royale Gold (स्वर्ण)',
      colorTitle: 'गोल्डन थीम',
      bgGradient: 'from-[#3a2004] via-[#241402] to-[#120901]',
      borderColor: 'border-amber-400 hover:border-amber-300',
      textColor: 'text-amber-300',
      headerBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md',
      badgeText: '🏆 ₹1,00,000+ प्राइज पूल',
      iconBg: 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30',
      actionText: 'शेड्यूल देखें (Games Lobby)',
      accentPill: 'bg-amber-950/80 border border-amber-400/40 text-amber-200',
    },
    {
      id: 'live',
      name: 'Play Tambola Live',
      nameHi: '2. लाइव तंबोला हाउसी खेलें',
      desc: 'लाइव मैच रूम में प्रवेश करें, रीयल-टाइम वॉइस कॉलर (हिंदी/इंग्लिश), ऑटो टिकट मार्किंग और तुरंत प्राइज जीतें।',
      icon: Flame,
      themeName: 'Vegas Ruby Red (रूबी लाल)',
      colorTitle: 'रेड/रूबी थीम',
      bgGradient: 'from-[#420a12] via-[#28050a] to-[#140205]',
      borderColor: 'border-red-400 hover:border-red-300',
      textColor: 'text-red-300',
      headerBg: 'bg-red-500/20 text-red-300 border-red-400/40',
      badgeBg: 'bg-gradient-to-r from-red-500 to-rose-500 text-white font-black shadow-md animate-pulse',
      badgeText: liveGame ? '🔴 मैच चालू है (LIVE)' : '⚡ अगला मैच 09:00 PM',
      iconBg: 'bg-red-500 text-white shadow-lg shadow-red-500/30',
      actionText: 'लाइव रूम में खेलें (Play Live)',
      isLive: true,
      accentPill: 'bg-red-950/80 border border-red-400/40 text-red-200',
    },
    {
      id: 'buy-ticket',
      name: 'Buy Tickets & Booking',
      nameHi: '3. टिकट बुक करें (Store)',
      desc: '₹5, ₹10, ₹15, ₹50 के 1 से 20 टिकट तुरंत खरीदें। 6 अलग-अलग रंगों में 100% सुरक्षित RNG टिकट जनरेशन।',
      icon: Ticket,
      themeName: 'Emerald Jade (पन्ना हरा)',
      colorTitle: 'एमराल्ड ग्रीन थीम',
      bgGradient: 'from-[#053322] via-[#032015] to-[#01120c]',
      borderColor: 'border-emerald-400 hover:border-emerald-300',
      textColor: 'text-emerald-300',
      headerBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md',
      badgeText: '🎟️ ₹5 से ₹50 टिकट रेट',
      iconBg: 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30',
      actionText: 'एडवांस टिकट लें (Buy Now)',
      accentPill: 'bg-emerald-950/80 border border-emerald-400/40 text-emerald-200',
    },
    {
      id: 'my-tickets',
      name: 'My Tickets & Passbook',
      nameHi: '4. मेरे टिकट & प्रिंट पासबुक',
      desc: 'अपने खरीदे गए सभी मैच टिकट देखें, ऑटो-मोड ऑन/ऑफ करें, HD/PDF प्रिंट करें और दोस्तों को WhatsApp पर शेयर करें।',
      icon: Layers,
      themeName: 'Electric Indigo (शाही नीला)',
      colorTitle: 'रॉयल इंडिगो थीम',
      bgGradient: 'from-[#121a47] via-[#0b102e] to-[#050817]',
      borderColor: 'border-indigo-400 hover:border-indigo-300',
      textColor: 'text-indigo-300',
      headerBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
      badgeBg: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black shadow-md',
      badgeText: `${myActiveTickets.length} एक्टिव टिकट उपलब्ध`,
      iconBg: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
      actionText: 'पासबुक खोलें (My Tickets)',
      accentPill: 'bg-indigo-950/80 border border-indigo-400/40 text-indigo-200',
    },
    {
      id: 'wallet',
      name: 'Wallet & Instant UPI',
      nameHi: '5. वॉलेट, डिपॉजिट & निकासी',
      desc: 'एडमिन QR कोड स्कैन करके पेमेंट ऐड करें, PhonePe/GPay/Paytm से रिचार्ज करें व जीत राशि बैंक/UPI में तुरंत निकालें।',
      icon: Wallet,
      themeName: 'Ocean Teal & Cyan (सियान)',
      colorTitle: 'सियान टर्कॉइश थीम',
      bgGradient: 'from-[#063538] via-[#042124] to-[#021112]',
      borderColor: 'border-cyan-400 hover:border-cyan-300',
      textColor: 'text-cyan-300',
      headerBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      badgeBg: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-md',
      badgeText: `₹${currentUser.walletBalance.toLocaleString('en-IN')} कुल बैलेंस`,
      iconBg: 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30',
      actionText: 'डिपॉजिट / निकासी (Wallet)',
      accentPill: 'bg-cyan-950/80 border border-cyan-400/40 text-cyan-200',
    },
    {
      id: 'referral',
      name: '8-Level Affiliate Portal',
      nameHi: '6. रेफरल & 8-लेवल इनकम',
      desc: 'अपनी 8-लेवल टीम बनाएं और डाउनलाइन के हर खिलाड़ी द्वारा खरीदे गए टिकट पर 4.6% लाइफटाइम कमीशन ऑटो-क्रेडिट पाएं।',
      icon: Users,
      themeName: 'Amethyst Purple (बैंगनी)',
      colorTitle: 'पर्पल वायलेट थीम',
      bgGradient: 'from-[#330c42] via-[#20072b] to-[#100317]',
      borderColor: 'border-purple-400 hover:border-purple-300',
      textColor: 'text-purple-300',
      headerBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      badgeBg: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-black shadow-md',
      badgeText: `👥 4.6% 8-लेवल कमीशन (${directReferralCount} Direct)`,
      iconBg: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30',
      actionText: 'एफिलिएट ट्री खोलें (Referral)',
      accentPill: 'bg-purple-950/80 border border-purple-400/40 text-purple-200',
    },
    {
      id: 'winners',
      name: 'Leaderboard & Winners',
      nameHi: '7. विजेता लीडरबोर्ड & रिकॉर्ड्स',
      desc: 'हॉल ऑफ फेम, इस हफ्ते के टॉप विजेता, फुलहाउस विनर्स और 100% वेरिफाइड डिजिटल विनिंग रसीदें देखें।',
      icon: Trophy,
      themeName: 'Sunset Orange (नारंगी)',
      colorTitle: 'ऑरेंज सनसेट थीम',
      bgGradient: 'from-[#421e06] via-[#2a1303] to-[#140901]',
      borderColor: 'border-orange-400 hover:border-orange-300',
      textColor: 'text-orange-300',
      headerBg: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
      badgeBg: 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md',
      badgeText: '💰 ₹10 Lakh+ कुल भुगतान',
      iconBg: 'bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/30',
      actionText: 'विजेता सूची देखें (Winners)',
      accentPill: 'bg-orange-950/80 border border-orange-400/40 text-orange-200',
    },
    {
      id: 'daily-bonus',
      name: 'Lucky Spin & Daily Bonus',
      nameHi: '8. लकी स्पिन & स्क्रैच कार्ड',
      desc: 'हर 24 घंटे में फ्री लकी व्हील घुमाएं, 7-दिवसीय लॉगिन स्ट्रीक बोनस, स्क्रैच कार्ड व एडमिन रीचार्ज पर 10% बोनस अनलॉक करें।',
      icon: Gift,
      themeName: 'Hot Magenta Pink (गुलाबी)',
      colorTitle: 'मैजेंटा पिंक थीम',
      bgGradient: 'from-[#42062c] via-[#29031b] to-[#14010d]',
      borderColor: 'border-pink-400 hover:border-pink-300',
      textColor: 'text-pink-300',
      headerBg: 'bg-pink-500/20 text-pink-300 border-pink-400/40',
      badgeBg: isDepositor ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black shadow-md' : 'bg-amber-500 text-slate-950 font-black shadow-md',
      badgeText: isDepositor ? '🎡 एक्टिव - डेली रिवार्ड्स अनलॉक' : '🔒 डिपॉजिट आवश्यक (Locked)',
      iconBg: 'bg-pink-500 text-white shadow-lg shadow-pink-500/30',
      actionText: isDepositor ? 'स्पिन व्हील घुमाएं (Spin & Win)' : 'डिपॉजिट करके अनलॉक करें',
      accentPill: 'bg-pink-950/80 border border-pink-400/40 text-pink-200',
    },
    {
      id: 'how-to-play',
      name: 'How to Play & Rules Guide',
      nameHi: '9. तंबोला नियम & खेल गाइड',
      desc: 'तंबोला के सभी 7 प्राइज (Early 5, Top Line, Mid Line, Bottom Line, Star Corners, Full House) जीतने के आसान नियम सीखें।',
      icon: HelpCircle,
      themeName: 'Chartreuse Lime (नींबू हरा)',
      colorTitle: 'लाइम ग्रीन थीम',
      bgGradient: 'from-[#2b3805] via-[#1a2303] to-[#0c1201]',
      borderColor: 'border-lime-400 hover:border-lime-300',
      textColor: 'text-lime-300',
      headerBg: 'bg-lime-500/20 text-lime-300 border-lime-400/40',
      badgeBg: 'bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-black shadow-md',
      badgeText: '📖 7 प्राइज पैटर्न गाइड',
      iconBg: 'bg-lime-400 text-slate-950 shadow-lg shadow-lime-500/30',
      actionText: 'नियम सीखें (Learn Rules)',
      accentPill: 'bg-lime-950/80 border border-lime-400/40 text-lime-200',
    },
    {
      id: 'profile',
      name: 'Player Profile & KYC',
      nameHi: '10. प्रोफाइल, KYC & बैंक खाता',
      desc: 'अपना नाम, अवतार फोटो बदलें, आधार/पैन KYC वेरिफिकेशन पूरा करें और बैंक खाता व UPI आईडी सुरक्षित रूप से जोड़ें।',
      icon: UserIcon,
      themeName: 'Azure Sky Blue (आसमानी)',
      colorTitle: 'स्काई ब्लू थीम',
      bgGradient: 'from-[#0b2845] via-[#06192c] to-[#030c17]',
      borderColor: 'border-sky-400 hover:border-sky-300',
      textColor: 'text-sky-300',
      headerBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
      badgeBg: 'bg-gradient-to-r from-sky-400 to-blue-500 text-slate-950 font-black shadow-md',
      badgeText: currentUser?.isKycVerified ? '✅ KYC वेरिफाइड' : '⚠️ KYC पूरा करें',
      iconBg: 'bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/30',
      actionText: 'प्रोफाइल सेटिंग्स (Profile & KYC)',
      accentPill: 'bg-sky-950/80 border border-sky-400/40 text-sky-200',
    },
    {
      id: 'support',
      name: '24x7 Customer Helpline',
      nameHi: '11. कस्टमर सपोर्ट & व्हाट्सएप',
      desc: 'किसी भी पेमेंट, टिकट या निकासी समस्या के समाधान के लिए सीधे हमारे 24x7 व्हाट्सएप हेल्पलाइन पर तुरंत सहायता पाएं।',
      icon: MessageCircle,
      themeName: 'WhatsApp Green (व्हाट्सएप हरा)',
      colorTitle: 'व्हाट्सएप ग्रीन थीम',
      bgGradient: 'from-[#093817] via-[#05240e] to-[#021207]',
      borderColor: 'border-green-400 hover:border-green-300',
      textColor: 'text-green-300',
      headerBg: 'bg-green-500/20 text-green-300 border-green-400/40',
      badgeBg: 'bg-gradient-to-r from-green-500 to-emerald-500 text-slate-950 font-black shadow-md',
      badgeText: '🟢 व्हाट्सएप 24/7 लाइव',
      iconBg: 'bg-green-500 text-white shadow-lg shadow-green-500/30',
      actionText: 'व्हाट्सएप चैट करें (Get Help)',
      accentPill: 'bg-green-950/80 border border-green-400/40 text-green-200',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* 👑 1. Top Player VIP Header Bar (Royal Purple & Gold) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#241138] via-[#141b38] to-[#0c1f24] border-2 border-amber-400/60 p-6 sm:p-8 shadow-2xl shadow-purple-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 p-1 shadow-xl shadow-amber-500/30">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser?.name || 'Guest User'}
                  className="w-full h-full rounded-xl object-cover bg-slate-900"
                />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black border border-slate-950 shadow-sm">
                {currentUser ? 'PRO VIP' : 'GUEST'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {currentUser ? currentUser.name : 'नमस्ते विज़िटर (Guest Visitor)'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-black border border-amber-400/40">
                  {currentUser ? (currentUser.role === 'admin' ? '⭐ MASTER ADMIN' : '🎮 VERIFIED PLAYER') : '🎁 ₹10 FREE BONUS'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {currentUser ? (
                  <>Player ID: <span className="text-amber-300 font-bold">{currentUser.id}</span> • {currentUser.phone || currentUser.email}</>
                ) : (
                  'नया खाता बनाएं और ₹10 मुफ्त विथड्रॉल बोनस सीधे अपने वॉलेट में पाएं!'
                )}
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {currentUser ? (
                  <>
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{currentUser.isKycVerified ? 'Aadhaar Verified' : 'Standard Member'}</span>
                    </span>
                    <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span>VIP Rank: Level 5</span>
                    </span>
                  </>
                ) : (
                  <button
                    onClick={() => onOpenAuth && onOpenAuth('register')}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black shadow cursor-pointer hover:scale-105 transition-transform"
                  >
                    🚀 ₹10 बोनस के साथ अभी रजिस्टर करें
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Right Badge with Official Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Apna Tambola"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-xl shadow-amber-500/40 border-2 border-amber-400 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-amber-400/40 text-right">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 block">All-in-One Dashboard</span>
              <span className="text-xs font-black text-white">11 Dedicated Color Themed Modules</span>
            </div>
          </div>
        </div>

        {/* 👑 Upline / Sponsor Information Card (डैशबोर्ड में अपलाइन ID व स्पॉन्सर जानकारी) */}
        {currentUser && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2a1340] via-[#1a1438] to-[#0c1824] border-2 border-purple-400/60 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-inner">
                  <Users className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>👑 मेरी अपलाइन & स्पॉन्सर जानकारी (My Upline Sponsor Details)</span>
                  </h3>
                  <p className="text-[11px] text-purple-200/80">
                    आप जिस स्पॉन्सर / यूजर के रेफरल लिंक से जुड़े हैं उसकी सम्पूर्ण जानकारी
                  </p>
                </div>
              </div>

              {uplineUser || currentUser.referredBy || currentUser.referredByUserId ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>🟢 एक्टिव डायरेक्ट अपलाइन (Level 1 Sponsor)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-black">
                  🏛️ डायरेक्ट कंपनी / एडमिन अपलाइन (Root Member)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-400/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">अपलाइन का नाम (Sponsor Name)</span>
                <span className="text-sm font-black text-amber-300">
                  {uplineUser ? uplineUser.name : (currentUser.referredBy ? `स्पॉन्सर (${currentUser.referredBy})` : 'Direct Company Root')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-400/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">अपलाइन यूज़र ID (Upline ID)</span>
                <span className="text-xs font-mono font-bold text-purple-300 truncate block select-all">
                  {uplineUser ? uplineUser.id : (currentUser.referredByUserId || currentUser.referredBy || 'SYSTEM_ROOT')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-400/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">अपलाइन रेफरल कोड (Sponsor Code)</span>
                <span className="text-sm font-mono font-black text-emerald-400 select-all">
                  {uplineUser ? uplineUser.referralCode : (currentUser.referredBy || 'DIRECT')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-400/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">आपका पर्सनल रेफरल कोड</span>
                <span className="text-sm font-mono font-black text-amber-400 select-all">
                  {currentUser.referralCode || 'REF-YOU'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 💳 3 VIBRANT WALLET BALANCE BOXES (साफ-साफ अलग-अलग रंगों में 3 वॉलेट बॉक्स) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/80">
          {/* Wallet Box 1: 🎟️ Ticket Wallet (Deposit) in Blue / Cyan */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/90 via-indigo-900/60 to-slate-950 border-2 border-blue-400 shadow-xl shadow-blue-950/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400 text-blue-300">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-blue-300 block">टिकट वॉलेट (Ticket Wallet)</span>
                  <span className="text-[10px] text-blue-200/80">डिपॉजिट + ₹10 प्रथम डिपॉजिट बोनस</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[10px] font-bold">
                Ticket Fund
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-blue-200 font-mono">
                ₹{(currentUser?.depositBalance || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-blue-300/80 block mt-0.5">
                {(currentUser?.depositBalance || 0) > 0 ? '✓ टिकट खरीदने हेतु फंड उपलब्ध' : '⚠️ एडमिन से फंड जोड़ें (पहले डिपॉजिट पर ₹10 बोनस)'}
              </span>
            </div>

            <button
              onClick={onOpenDeposit}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-blue-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ एडमिन से फंड ऐड करें (Recharge)</span>
            </button>
          </div>

          {/* Wallet Box 2: 💰 Withdrawal Wallet (Winnings) in Emerald Green */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-teal-900/60 to-slate-950 border-2 border-emerald-400 shadow-xl shadow-emerald-950/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-300 block">विथड्रॉल वॉलेट (Winnings)</span>
                  <span className="text-[10px] text-emerald-200/80">गेम में जीती गई शुद्ध राशि</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                Instant UPI
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                ₹{(currentUser?.winningBalance || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-200/80 block mt-0.5">
                सीधे बैंक खाता या UPI में 24x7 ट्रांसफर योग्य
              </span>
            </div>

            <button
              onClick={() => onNavigate('wallet')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>बैंक / UPI में तुरंत निकालें (Withdraw)</span>
            </button>
          </div>

          {/* Wallet Box 3: 👥 8-Level Referral Wallet in Amber Gold */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-900/90 via-yellow-900/60 to-slate-950 border-2 border-amber-400 shadow-xl shadow-amber-950/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-300 block">रेफरल वॉलेट (4.6%)</span>
                  <span className="text-[10px] text-amber-200/80">8-लेवल टीम नेटवर्क इनकम</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                8-Levels Lifetime
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                ₹{(currentUser?.referralBalance || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-amber-200/80 block mt-0.5">
                कुल टीम सदस्य: <strong>{referralCount} लोग</strong>
              </span>
            </div>

            <button
              onClick={() => onNavigate('referral')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>रेफरल ट्री & टीम देखें (Affiliate)</span>
            </button>
          </div>
        </div>

        {/* 📊 4 Mini Stat Counter Boxes in 4 Rich Distinct Colors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/80">
          {/* Stat 1: Games Played (Purple) */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-900/80 to-slate-950 border-2 border-purple-400/70 shadow-md">
            <span className="text-[10px] uppercase font-bold text-purple-300 block">🎮 खेले गए मैच</span>
            <div className="text-lg font-black text-white font-mono mt-0.5">{totalGamesPlayed} Matches</div>
          </div>
          {/* Stat 2: Total Won (Gold) */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-900/80 to-slate-950 border-2 border-amber-400/70 shadow-md">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">🏆 कुल जीती राशि</span>
            <div className="text-lg font-black text-amber-300 font-mono mt-0.5">₹{totalWinnings.toLocaleString('en-IN')}</div>
          </div>
          {/* Stat 3: Active Tickets (Indigo) */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-900/80 to-slate-950 border-2 border-indigo-400/70 shadow-md">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">🎟️ एक्टिव टिकट</span>
            <div className="text-lg font-black text-indigo-300 font-mono mt-0.5">{myActiveTickets.length} Cards</div>
          </div>
          {/* Stat 4: Referral Network (Rose Pink) */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-900/80 to-slate-950 border-2 border-rose-400/70 shadow-md">
            <span className="text-[10px] uppercase font-bold text-rose-300 block">👥 रेफरल टीम</span>
            <div className="text-lg font-black text-rose-300 font-mono mt-0.5">{referralCount} Members</div>
          </div>
        </div>
      </div>

      {/* 👥 MY DIRECT REFERRALS (मेरे डायरेक्ट रेफरल्स - LEVEL 1) - Real-time Database Powered & Flashing */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1a0b2e] via-[#120824] to-[#0a0414] border-2 border-amber-400 p-5 sm:p-6 shadow-2xl shadow-purple-950/60 space-y-4 relative overflow-hidden">
        {/* Golden Flash Accent Top Light Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-inner animate-pulse">
              <Users className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  MY DIRECT REFERRALS (लेवल 1 डायरेक्ट मेंबर्स)
                </h3>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs font-mono shadow-md animate-pulse">
                  ⚡ {directLiveUsers.length} DIRECT MEMBERS
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                सीधे आपके रेफरल लिंक से जुड़े खिलाड़ी (Database-Verified Level 1 Downline)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-900 border border-purple-400/50 text-xs font-black text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedRefLink ? '✓ Copied Link' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Share</span>
            </button>
          </div>
        </div>

        {/* Quick Search & Count Filter */}
        {directLiveUsers.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <span>कुल डायरेक्ट सक्रिय सदस्य:</span>
              <strong className="text-amber-300 font-mono text-sm">{directLiveUsers.length} लोग</strong>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                🟢 2.0% L1 Commission Active
              </span>
            </div>
            <input
              type="text"
              value={directSearch}
              onChange={(e) => setDirectSearch(e.target.value)}
              placeholder="Search by name, ID or mobile..."
              className="bg-slate-950/80 border border-amber-400/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {/* Direct Referrals List Table */}
        {directLiveUsers.length === 0 ? (
          <div className="p-6 rounded-2xl bg-purple-950/30 border border-dashed border-purple-400/40 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-300 mx-auto flex items-center justify-center border border-purple-400/40">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">अभी तक कोई डायरेक्ट रेफरल नहीं जुड़ा है</h4>
              <p className="text-xs text-purple-200/80 max-w-md mx-auto mt-1">
                अपना रेफरल लिंक <strong>{referralLink}</strong> दोस्तों के साथ शेयर करें। जैसे ही कोई नया खिलाड़ी आपके लिंक से रजिस्टर करेगा, उसका नाम और आईडी यहाँ तुरंत दिखाई देगा।
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleShareWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>व्हाट्सएप पर शेयर करें (Share on WhatsApp)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-amber-500/40 bg-slate-950/90 shadow-inner">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/60 text-amber-300 uppercase font-black text-[10px] tracking-wider border-b border-purple-500/30">
                <tr>
                  <th className="px-3.5 py-3">Player Name</th>
                  <th className="px-3.5 py-3">User ID</th>
                  <th className="px-3.5 py-3">Contact</th>
                  <th className="px-3.5 py-3">Level Status</th>
                  <th className="px-3.5 py-3">Referral Code</th>
                  <th className="px-3.5 py-3">Registration Date</th>
                  <th className="px-3.5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30 text-slate-300">
                {filteredDirectUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-purple-900/20 transition-colors">
                    <td className="px-3.5 py-3 font-bold text-white flex items-center gap-2.5">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-amber-400 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-purple-300 font-bold select-all">
                      {u.id}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-slate-200 font-bold">
                      {u.phone ? `${u.phone.slice(0, 7)}XXXX` : 'N/A'}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-[9px] shadow animate-pulse">
                        ⚡ LEVEL 1 DIRECT
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-mono font-black text-amber-300">
                      {u.referralCode}
                    </td>
                    <td className="px-3.5 py-3 text-slate-300 text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today'}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.isBlocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-xs font-bold text-purple-300">
          <button
            onClick={() => onNavigate('referral')}
            className="hover:underline flex items-center gap-1 cursor-pointer text-amber-300"
          >
            <span>8-लेवल एफिलिएट पोर्टल & कमीशन ट्री खोलें &rarr;</span>
          </button>
        </div>
      </div>

      {/* 🚀 2. Live Match Spotlight Banner (Vegas Red / Crimson Flame) */}
      {liveGame && (
        <div className="rounded-3xl bg-gradient-to-r from-red-900 via-rose-900 to-amber-950 border-2 border-red-400 p-5 sm:p-6 shadow-2xl shadow-red-950/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-red-600 text-white animate-bounce shadow-lg shadow-red-600/50">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                  🔴 TOURNAMENT LIVE NOW
                </span>
                <span className="text-xs text-amber-300 font-bold">{liveGame.title}</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                प्राइज पूल: <span className="text-amber-300 font-mono">₹{liveGame.prizePool.toLocaleString('en-IN')}</span> • करंट ड्रा: बॉल #{liveGame.calledNumbers.length} / 90
              </h3>
            </div>
          </div>
          <button
            onClick={() => onNavigate('live', liveGame.id)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/40 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>लाइव मैच रूम में खेलें (JOIN NOW)</span>
          </button>
        </div>
      )}

      {/* 🎨 3. ALL 11 USER DASHBOARD MODULE BOXES IN DISTINCT VIBRANT COLORS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>यूजर डैशबोर्ड मॉड्यूल्स (सभी अलग-अलग रंग के बॉक्सेज)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              प्रत्येक बॉक्स को स्पष्ट पहचान और अलग रंग दिया गया है ताकि आप आसानी से अपनी पसंद का विकल्प चुन सकें।
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-400/40 text-[11px] font-bold text-purple-300 self-start sm:self-auto">
            <span>✨ 11 Dedicated Colored Modules</span>
          </div>
        </div>

        {/* 11 Distinct Colorful Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DASHBOARD_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigate(mod.id)}
                className={`group p-6 rounded-3xl bg-gradient-to-br ${mod.bgGradient} border-2 ${mod.borderColor} shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 hover:-translate-y-1.5 relative overflow-hidden`}
              >
                {/* Subtle Glow Overlay on Card Corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-3.5 relative z-10">
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between gap-2">
                    <div className={`p-3.5 rounded-2xl ${mod.iconBg} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${mod.badgeBg}`}>
                      {mod.badgeText}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white group-hover:text-amber-200 transition-colors">
                        {mod.nameHi}
                      </h3>
                    </div>
                    <div className={`text-xs font-bold ${mod.textColor} opacity-90`}>
                      {mod.name}
                    </div>
                    <p className="text-xs text-slate-200 mt-2 leading-relaxed font-normal">
                      {mod.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Link & Color Identity Chip */}
                <div className="pt-3.5 border-t border-white/15 flex items-center justify-between text-xs font-black relative z-10">
                  <span className={`flex items-center gap-1.5 ${mod.textColor} group-hover:underline`}>
                    <span>{mod.actionText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${mod.accentPill}`}>
                    {mod.colorTitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

