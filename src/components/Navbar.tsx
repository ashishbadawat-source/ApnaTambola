import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Ticket,
  Trophy,
  Wallet,
  Users,
  Gamepad2,
  Volume2,
  VolumeX,
  ShieldCheck,
  User,
  Menu,
  X,
  PlusCircle,
  Sparkles,
  HelpCircle,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
  Bell,
  Grid,
  LayoutDashboard,
  Radio,
  Share2,
  ArrowUpRight,
  BarChart3,
  Settings,
  Layers,
  Lock,
  Crown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { User as UserType } from '../types';
import { AllOptionsModal } from './AllOptionsModal';

interface NavbarProps {
  activeTab?: string;
  currentTab?: string;
  onNavigate?: (tab: string, gameId?: string) => void;
  setCurrentTab?: (tab: string) => void;
  currentUser: UserType | null;
  isAdminView?: boolean;
  setIsAdminView?: (val: boolean) => void;
  soundEnabled?: boolean;
  setSoundEnabled?: (val: boolean) => void;
  onOpenDeposit?: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenAdminLogin?: () => void;
  onLogout?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  onSelectAdminModule?: (moduleKey: string) => void;
  activeTemplateId?: string;
  onOpenTemplateSelector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  currentTab,
  onNavigate,
  setCurrentTab,
  currentUser,
  isAdminView,
  setIsAdminView,
  soundEnabled = true,
  setSoundEnabled,
  onOpenDeposit,
  onOpenAuth,
  onOpenAdminLogin,
  onLogout,
  onOpenNotifications,
  unreadNotificationCount = 0,
  onSelectAdminModule,
  activeTemplateId = 'royal_gold',
  onOpenTemplateSelector,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [allOptionsModalOpen, setAllOptionsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unify active tab resolution
  const currentActiveTab = activeTab || currentTab || 'home';
  const inAdminMode = isAdminView !== undefined ? isAdminView : currentActiveTab === 'admin';

  const handleTabChange = (tabId: string) => {
    // If not logged in and user tries to access protected features, open login modal
    const protectedTabs = ['dashboard', 'buy-ticket', 'my-tickets', 'wallet', 'referral', 'profile', 'daily-bonus'];
    if (!currentUser && protectedTabs.includes(tabId)) {
      onOpenAuth('login');
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      return;
    }

    if (onNavigate) {
      onNavigate(tabId);
    } else if (setCurrentTab) {
      setCurrentTab(tabId);
    }
    if (setIsAdminView) {
      setIsAdminView(tabId === 'admin');
    }
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleAdminToggle = (toAdmin: boolean) => {
    if (toAdmin && (!currentUser || currentUser.role !== 'admin')) {
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
        return;
      }
    }
    if (setIsAdminView) {
      setIsAdminView(toAdmin);
    }
    if (onNavigate) {
      onNavigate(toAdmin ? 'admin' : 'home');
    } else if (setCurrentTab) {
      setCurrentTab(toAdmin ? 'admin' : 'home');
    }
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleDepositClick = () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    if (onOpenDeposit) {
      onOpenDeposit();
    } else {
      handleTabChange('wallet');
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollSubnav = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const visitorNavItems = [
    { id: 'landing', label: '1. मुख्य पृष्ठ', icon: Sparkles, colorClass: 'from-amber-400 to-amber-500 text-slate-950', badge: 'Home' },
    { id: 'games', label: '2. टूर्नामेंट्स लॉबी', icon: Gamepad2, colorClass: 'from-amber-400 to-yellow-500 text-slate-950', badge: 'Lobby' },
    { id: 'live', label: '3. लाइव खेल (RNG)', isLive: true, icon: Flame, badge: '🔴 LIVE', colorClass: 'from-red-500 to-purple-600 text-white' },
    { id: 'winners', label: '4. हॉल ऑफ़ विनर्स', icon: Trophy, colorClass: 'from-orange-500 to-rose-600 text-white', badge: 'Prizes' },
    { id: 'how-to-play', label: '5. नियम व गाइड', icon: HelpCircle, colorClass: 'from-lime-400 to-emerald-500 text-slate-950', badge: 'Guide' },
    { id: 'support', label: '6. 24/7 सहायता', icon: HelpCircle, colorClass: 'from-sky-400 to-blue-500 text-slate-950', badge: 'Help' },
  ];

  const userNavItems = [
    { id: 'landing', label: '1. मुख्य पृष्ठ', icon: Sparkles, colorClass: 'from-amber-400 to-amber-500 text-slate-950', badge: 'Home' },
    { id: 'dashboard', label: '2. 11-डैशबोर्ड', icon: LayoutDashboard, colorClass: 'from-purple-600 to-indigo-600 text-white', badge: '11 Box' },
    { id: 'live', label: '3. लाइव गेम', isLive: true, icon: Flame, badge: '🔴 LIVE', colorClass: 'from-red-500 to-purple-600 text-white' },
    { id: 'buy-ticket', label: '4. टिकट खरीदें', icon: Ticket, colorClass: 'from-emerald-400 to-teal-500 text-slate-950', badge: 'Store' },
    { id: 'my-tickets', label: '5. मेरे टिकट्स', icon: Ticket, colorClass: 'from-indigo-500 to-blue-600 text-white', badge: 'Passbook' },
    { id: 'wallet', label: '6. वॉलेट व UPI', icon: Wallet, colorClass: 'from-emerald-500 to-green-600 text-white', badge: 'Instant' },
    { id: 'referral', label: '7. 8-लेवल रेफरल', icon: Users, badge: '4.6%', colorClass: 'from-cyan-400 to-sky-500 text-slate-950' },
    { id: 'games', label: '8. टूर्नामेंट्स', icon: Gamepad2, colorClass: 'from-amber-400 to-yellow-500 text-slate-950', badge: 'Lobby' },
    { id: 'winners', label: '9. विनर्स', icon: Trophy, colorClass: 'from-orange-500 to-rose-600 text-white', badge: 'Prizes' },
    { id: 'daily-bonus', label: '10. डेली बोनस', icon: Sparkles, colorClass: 'from-pink-500 to-fuchsia-600 text-white', badge: 'Free' },
    { id: 'how-to-play', label: '11. नियम', icon: HelpCircle, colorClass: 'from-lime-400 to-emerald-500 text-slate-950', badge: 'Guide' },
    { id: 'profile', label: '12. प्रोफ़ाइल व बैंक', icon: User, colorClass: 'from-violet-500 to-purple-600 text-white', badge: 'KYC' },
    { id: 'support', label: '13. सहायता', icon: HelpCircle, colorClass: 'from-sky-400 to-blue-500 text-slate-950', badge: '24/7' },
  ];

  const displayedNavItems = currentUser ? userNavItems : visitorNavItems;

  const adminNavItems = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'users', label: '2. Users & KYC', icon: Users },
    { id: 'games', label: '3. Game Mgmt', icon: Gamepad2 },
    { id: 'live_control', label: '4. Live Caller RNG', icon: Radio, badge: 'RNG' },
    { id: 'tickets', label: '5. Ticket Gen', icon: Ticket },
    { id: 'prizes', label: '6. Prizes', icon: Trophy },
    { id: 'referrals', label: '7. 8-Level MLM', icon: Share2 },
    { id: 'wallets', label: '8. Ledger', icon: Wallet },
    { id: 'withdrawals', label: '9. Withdrawals', icon: ArrowUpRight },
    { id: 'reports', label: '10. Reports', icon: BarChart3 },
    { id: 'notifications', label: '11. Broadcast', icon: Bell },
    { id: 'settings', label: '12. Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/90 bg-[#090d16]/98 backdrop-blur-md shadow-2xl">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-purple-950/90 via-amber-950/70 to-indigo-950/90 border-b border-amber-500/30 py-1.5 px-3 sm:px-4 text-xs font-medium text-amber-200 text-center flex items-center justify-between sm:justify-center gap-2">
        <div className="flex items-center gap-1.5 mx-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
          <span className="text-[11px] sm:text-xs truncate">
            🎁 <strong>नया खाता बनाएं</strong> और पाएं <strong>₹10 मुफ्त विथड्रॉल बोनस</strong>! | Mega Jackpot: <strong>₹12,500 LIVE</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!currentUser ? (
            <button
              onClick={() => onOpenAuth('register')}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow transition-all cursor-pointer"
            >
              मुफ्त ₹10 बोनस
            </button>
          ) : (
            <span className="text-[10px] font-bold text-emerald-300">
              नमस्ते, {currentUser.name.split(' ')[0]} 👋
            </span>
          )}
        </div>
      </div>

      {/* Main Top Header Navigation */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-17">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => handleTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="relative">
              <div className="tambola-ball-3d ball-gold w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base font-black group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/40 border border-amber-300/40">
                7
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent drop-shadow">
                  अपना TAMBOLA
                </span>
                <span className="bg-red-600 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse shadow">
                  LIVE
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-amber-200/90 -mt-0.5 font-bold tracking-wide flex items-center gap-1">
                <span>Multiplayer Housie</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-extrabold">₹10 Free Bonus</span>
              </p>
            </div>
          </div>

          {/* Center Mode / Public Tabs */}
          {currentUser ? (
            <div className="hidden md:flex items-center gap-1 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button
                id="header-user-mode-btn"
                onClick={() => handleAdminToggle(false)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  !inAdminMode
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-102'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>यूज़र पैनल</span>
              </button>

              {currentUser.role === 'admin' && (
                <button
                  id="header-admin-mode-btn"
                  onClick={() => handleAdminToggle(true)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    inAdminMode
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/25 scale-102'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>एडमिन पैनल</span>
                </button>
              )}

              <button
                id="header-all-options-btn"
                onClick={() => setAllOptionsModalOpen(true)}
                title="सभी विकल्प देखें"
                className="px-2 py-1.5 rounded-xl text-xs font-black text-amber-300 hover:bg-amber-400/15 transition-all flex items-center gap-1 border border-amber-400/30 cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5 text-amber-400" />
                <span>सभी विकल्प</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => handleTabChange('home')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentActiveTab === 'home' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                }`}
              >
                मुख्य पृष्ठ
              </button>
              <button
                onClick={() => handleTabChange('games')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                टूर्नामेंट्स
              </button>
              <button
                onClick={() => handleTabChange('winners')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                विनर्स
              </button>
              <button
                onClick={() => handleTabChange('referral')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-all cursor-pointer"
              >
                रेफरल 7.8%
              </button>
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* 🎨 Template & Theme Selector Button */}
            {onOpenTemplateSelector && (
              <button
                id="header-template-selector-btn"
                onClick={onOpenTemplateSelector}
                title="टेम्पलेट व थीम बदलें (Change Theme)"
                className="px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-emerald-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-400/20 cursor-pointer shadow-sm"
              >
                <span className="text-sm">🎨</span>
                <span className="hidden sm:inline font-bold">टेम्पलेट</span>
              </button>
            )}

            {/* Audio Toggle */}
            <button
              id="audio-toggle-btn"
              onClick={() => setSoundEnabled && setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'आवाज म्यूट करें' : 'आवाज चालू करें'}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors hidden sm:flex items-center justify-center ${
                soundEnabled
                  ? 'bg-slate-800/80 text-amber-300 border-amber-400/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* If NOT logged in (Guest / Visitor State) */}
            {!currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* 🔑 User Login Button */}
                <button
                  id="nav-user-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 sm:px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 text-purple-400" />
                  <span>लॉगिन</span>
                </button>

                {/* 🎁 User Register Button with ₹10 Bonus */}
                <button
                  id="nav-user-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>साइन अप (₹10 बोनस)</span>
                </button>
              </div>
            ) : (
              /* If Logged In State */
              <>
                {/* Real-time Notifications Bell */}
                <button
                  id="user-notifications-btn"
                  onClick={onOpenNotifications}
                  title="सूचनाएं (Notifications)"
                  className="relative p-2 rounded-xl text-xs font-medium border bg-slate-900/90 text-amber-400 border-purple-500/30 hover:border-amber-400/50 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Wallet Balance Chip */}
                <div
                  id="user-wallet-chip"
                  onClick={() => handleTabChange('wallet')}
                  className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 cursor-pointer hover:border-amber-400/50 transition-all group"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Wallet</span>
                    <span className="text-xs sm:text-sm font-black text-amber-300 group-hover:text-amber-200">
                      ₹{currentUser.walletBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    id="quick-add-money-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDepositClick();
                    }}
                    className="hidden sm:flex items-center justify-center text-emerald-400 hover:text-emerald-300 p-0.5 hover:scale-110 transition-transform"
                    title="पैसे जोड़ें"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* User Profile Avatar with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <div
                    id="user-profile-trigger"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 cursor-pointer p-0.5 sm:p-1 rounded-xl hover:bg-slate-800/60 transition-colors border border-purple-500/30"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border-2 border-amber-400/60"
                    />
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                  </div>

                  {/* Profile Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#111628] border-2 border-purple-500/40 p-2 shadow-2xl z-50 space-y-1 animate-in zoom-in-95">
                      <div className="p-2.5 border-b border-slate-800">
                        <p className="text-xs font-black text-white truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-amber-300 font-mono font-bold">
                          {currentUser.phone || currentUser.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="bg-purple-600/30 border border-purple-400/40 text-[9px] font-bold text-purple-200 px-2 py-0.5 rounded-full capitalize">
                            {currentUser.role === 'admin' ? '👑 Admin' : '⭐ Player'}
                          </span>
                          <span className="bg-emerald-600/30 border border-emerald-400/40 text-[9px] font-bold text-emerald-300 px-2 py-0.5 rounded-full">
                            ₹{currentUser.winningBalance} निकासी योग्य
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTabChange('profile')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-purple-400" />
                        <span>प्रोफ़ाइल (Profile & KYC)</span>
                      </button>

                      <button
                        onClick={() => {
                          setAllOptionsModalOpen(true);
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Grid className="w-4 h-4 text-amber-400" />
                        <span>सभी 22 विकल्प (All Options)</span>
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => handleTabChange('admin')}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-red-400" />
                          <span>एडमिन कंट्रोल पैनल</span>
                        </button>
                      )}

                      {/* Direct Logout Button */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-800/80 mt-1"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>लॉगआउट करें (Log Out)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Logout button on Desktop */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="लॉगआउट"
                    className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>लॉगआउट</span>
                  </button>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Sticky Sub-Nav Ribbon - Screen Contained & Scrollable */}
      <div className="bg-[#0b101e] border-t border-slate-800/80 px-2 sm:px-4 py-1.5 shadow-inner relative w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Active Mode Label Tag */}
          <div className="flex items-center gap-1 sm:gap-1.5 pr-1.5 sm:pr-2 border-r border-slate-800 shrink-0">
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                inAdminMode
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
              }`}
            >
              {inAdminMode ? <ShieldCheck className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
              <span className="hidden sm:inline">{inAdminMode ? 'ADMIN PANEL' : currentUser ? 'USER PANEL' : 'VISITOR'}</span>
              <span className="sm:hidden">{inAdminMode ? 'ADMIN' : 'USER'}</span>
            </span>
          </div>

          {/* Left Scroll Arrow */}
          <button
            onClick={() => scrollSubnav('left')}
            className="hidden sm:flex p-1 rounded-lg bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 shrink-0 cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
          >
            {/* Render All User / Public Options */}
            {!inAdminMode && (
              <div className="flex items-center gap-1 shrink-0">
                {displayedNavItems.map((item) => {
                  const active = currentActiveTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      id={`subnav-btn-${item.id}`}
                      onClick={() => handleTabChange(item.id)}
                      className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? `bg-gradient-to-r ${item.colorClass || 'from-amber-400 to-amber-500 text-slate-950'} font-black shadow-lg scale-102`
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${item.isLive && !active ? 'text-red-400 animate-bounce' : ''}`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                            active
                              ? 'bg-slate-950/80 text-white border border-white/20'
                              : item.isLive
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Render All Admin Options */}
            {inAdminMode && (
              <div className="flex items-center gap-1 shrink-0">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      id={`admin-subnav-btn-${item.id}`}
                      onClick={() => {
                        if (onSelectAdminModule) {
                          onSelectAdminModule(item.id);
                        }
                      }}
                      className="relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border border-transparent hover:border-slate-700 shrink-0"
                    >
                      <Icon className="w-3.5 h-3.5 text-red-400" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Scroll Arrow */}
          <button
            onClick={() => scrollSubnav('right')}
            className="hidden sm:flex p-1 rounded-lg bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 shrink-0 cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Quick Hub Trigger */}
          <button
            onClick={() => setAllOptionsModalOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-purple-900/40 text-purple-200 border border-purple-500/40 hover:bg-purple-800/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Grid className="w-3 h-3 text-purple-300" />
            <span className="hidden sm:inline">सभी विकल्प</span>
            <span className="sm:hidden">विकल्प</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel bg-[#0d1322] border-b border-slate-800 px-4 py-4 space-y-3 shadow-2xl">
          {/* Quick Register / Login buttons on Mobile */}
          {!currentUser ? (
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800">
              <button
                onClick={() => {
                  onOpenAuth('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                साइन अप (₹10 बोनस)
              </button>
              <button
                onClick={() => {
                  onOpenAuth('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 bg-slate-900 text-purple-300 border border-purple-400/40 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                यूज़र लॉगिन
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-white block">{currentUser.name}</span>
                <span className="text-[10px] text-amber-400">₹{currentUser.walletBalance} कुल बैलेंस</span>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-3 py-1.5 bg-rose-950/80 border border-rose-500/50 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  लॉगआउट
                </button>
              )}
            </div>
          )}

          {/* User / Visitor Nav Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {displayedNavItems.map((item) => {
              const active = currentActiveTab === item.id && !inAdminMode;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-left flex items-center gap-2 border cursor-pointer ${
                    active
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-400'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Options Hub Modal */}
      <AllOptionsModal
        isOpen={allOptionsModalOpen}
        onClose={() => setAllOptionsModalOpen(false)}
        currentTab={currentActiveTab}
        onNavigate={handleTabChange}
        onSelectAdminModule={(mod) => {
          if (onSelectAdminModule) {
            onSelectAdminModule(mod);
          }
        }}
      />
    </header>
  );
};
export default Navbar;
