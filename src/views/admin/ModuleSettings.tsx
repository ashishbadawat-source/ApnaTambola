import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Palette,
  Lock,
  Globe,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Key,
  Smartphone,
  History,
  FileText,
  Save,
  Check,
  QrCode,
  IndianRupee,
  Volume2,
  Building2,
  Copy,
  Sparkles,
  Radio,
  Eye,
  Ticket as TicketIcon,
  User,
  MessageSquare,
  Gamepad2,
  Power,
  Flame,
  Clock,
  Ban,
  Coins,
  RefreshCw,
  Trophy,
  Download,
  FileArchive,
  ExternalLink,
} from 'lucide-react';
import { SiteSettings, ActivityLog, LoginHistoryEntry, TicketColorThemeId, TambolaGame } from '../../types';
import { speakNumberCall, setCallerVoiceLanguage } from '../../utils/audio';
import { VoiceLanguage } from '../../utils/tambolaNicknames';
import { TICKET_COLOR_PALETTES, COLOR_KEYS } from '../../utils/ticketColors';

interface ModuleSettingsProps {
  settings: SiteSettings;
  activityLogs: ActivityLog[];
  loginHistory: LoginHistoryEntry[];
  games?: TambolaGame[];
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean>;
  onUpdateSettings: (settings: Partial<SiteSettings>) => Promise<boolean>;
}

export const ModuleSettings: React.FC<ModuleSettingsProps> = ({
  settings,
  activityLogs,
  loginHistory,
  games = [],
  onUpdateGame,
  onUpdateSettings,
}) => {
  // Game Action Notice State
  const [gameActionNotice, setGameActionNotice] = useState<string | null>(null);
  const [gameTogglingId, setGameTogglingId] = useState<string | null>(null);

  // General & Branding
  const [siteName, setSiteName] = useState(settings.siteName || 'Tambola Live India');
  const [tagline, setTagline] = useState(settings.tagline || 'India’s #1 Real-Time Multiplayer Housie Tournament Portal');
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || 'tickets@click-earn-hvfde7.p.tawk.email');
  const [supportWhatsapp, setSupportWhatsapp] = useState(settings.supportWhatsapp || '+91 98765 43210');
  const [tawkSiteId, setTawkSiteId] = useState(settings.tawkSiteId || '671ba0224304e3196ad82413');
  const [tawkApiKey, setTawkApiKey] = useState(settings.tawkApiKey || 'dcfa340637fca3d2a0e313d39bec5ba49b10288a');
  const [ticketEmail, setTicketEmail] = useState(settings.ticketEmail || 'tickets@click-earn-hvfde7.p.tawk.email');
  const [noticeMarquee, setNoticeMarquee] = useState(settings.noticeMarquee || '🎉 Mega Sunday Housie Bumper Jackpot starts at 9:00 PM! Win up to ₹1,00,000!');
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode || false);
  const [activeTheme, setActiveTheme] = useState(settings.themeColor || 'gold');

  // Admin Payment UPI & QR Settings (New & Requested)
  const [adminUpiId, setAdminUpiId] = useState(settings.adminUpiId || 'venkannabadawat@sbi');
  const [adminUpiName, setAdminUpiName] = useState(settings.adminUpiName || 'Tambola Live Entertainment');
  const [adminQrCodeUrl, setAdminQrCodeUrl] = useState(
    settings.adminQrCodeUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dvenkannabadawat%40sbi%26pn%3DTambola%2520Live%26cu%3DINR`
  );
  const [adminBankName, setAdminBankName] = useState(settings.adminBankName || 'HDFC Bank');
  const [adminAccountNo, setAdminAccountNo] = useState(settings.adminAccountNo || '50200088991122');
  const [adminIfsc, setAdminIfsc] = useState(settings.adminIfsc || 'HDFC0000123');
  const [adminAccountHolder, setAdminAccountHolder] = useState(settings.adminAccountHolder || 'Tambola Live India Pvt Ltd');
  const [adminUpiNote, setAdminUpiNote] = useState(
    settings.adminUpiNote || 'Pay with any UPI app (GPay, PhonePe, Paytm) and paste 12-digit UTR below.'
  );
  const [minDeposit, setMinDeposit] = useState(settings.minDeposit || 100);
  const [depositMultiple, setDepositMultiple] = useState(settings.depositMultiple || 100);
  const [maxDeposit, setMaxDeposit] = useState(settings.maxDeposit || 100000);
  const [minWithdrawal, setMinWithdrawal] = useState(settings.minWithdrawal || 100);
  const [withdrawalMultiple, setWithdrawalMultiple] = useState(settings.withdrawalMultiple || 100);
  const [tdsPercentage, setTdsPercentage] = useState(settings.tdsPercentage || 10);
  const [adminFeePercentage, setAdminFeePercentage] = useState(settings.adminFeePercentage || 5);

  // Voice Calling Language Settings (English / Hindi / Both)
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>(settings.voiceLanguage || 'both');
  const [testVoiceNumber, setTestVoiceNumber] = useState<number>(47);
  const [isSpeakingTest, setIsSpeakingTest] = useState(false);

  // Security & Admin Credentials
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [adminUsername, setAdminUsername] = useState(settings.adminUsername || 'admin@tambolalive.com');
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || 'admin');
  const [confirmPassword, setConfirmPassword] = useState(settings.adminPassword || 'admin');
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  // Ticket Color Theme (Global default set by admin)
  const [defaultTicketTheme, setDefaultTicketTheme] = useState<TicketColorThemeId>(
    settings.defaultTicketTheme || 'multi'
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Generate dynamic QR URL when UPI ID changes
  const computedQrUrl = adminUpiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `upi://pay?pa=${adminUpiId.trim()}&pn=${encodeURIComponent(adminUpiName.trim())}&cu=INR`
      )}`
    : adminQrCodeUrl;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setCallerVoiceLanguage(voiceLanguage);
      await onUpdateSettings({
        siteName,
        tagline,
        supportEmail,
        supportWhatsapp,
        tawkSiteId,
        tawkApiKey,
        ticketEmail,
        noticeMarquee,
        maintenanceMode,
        themeColor: activeTheme as any,
        defaultTicketTheme,
        adminUsername,
        adminPassword,
        adminUpiId,
        adminUpiName,
        adminQrCodeUrl: computedQrUrl,
        adminBankName,
        adminAccountNo,
        adminIfsc,
        adminAccountHolder,
        adminUpiNote,
        minDeposit,
        depositMultiple,
        maxDeposit,
        minWithdrawal,
        withdrawalMultiple,
        tdsPercentage,
        adminFeePercentage,
        voiceLanguage,
      });
      setSaveSuccess('Master settings, Ticket Color Theme, Admin ID/Password & Financial rules (10% TDS, 5% Admin) live updated!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestVoice = (lang: VoiceLanguage) => {
    setIsSpeakingTest(true);
    speakNumberCall(testVoiceNumber, true, lang);
    setTimeout(() => setIsSpeakingTest(false), 2500);
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(adminUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword || adminPassword !== confirmPassword) {
      alert('Passwords do not match or are empty!');
      return;
    }
    await onUpdateSettings({
      adminUsername,
      adminPassword,
    });
    setSecurityNotice('Admin master login credentials successfully updated & saved live to website!');
    setTimeout(() => setSecurityNotice(null), 4000);
  };

  // 🎮 Game ON/OFF & Booking Toggle Handlers
  const handleToggleGameActive = async (gameId: string, currentActive: boolean) => {
    if (!onUpdateGame) return;
    setGameTogglingId(gameId);
    const newActiveState = !currentActive;
    try {
      await onUpdateGame(gameId, {
        isActive: newActiveState,
        status: newActiveState ? 'upcoming' : 'cancelled',
      });
      setGameActionNotice(
        newActiveState
          ? `🟢 गेम सफलतापूर्वक चालू (ON) कर दिया गया है! खिलाड़ी अब इसमें शामिल हो सकते हैं।`
          : `🔴 गेम सफलतापूर्वक बंद (OFF) कर दिया गया है! खिलाड़ियों के लिए गेम लॉक रहेगा।`
      );
      setTimeout(() => setGameActionNotice(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setGameTogglingId(null);
    }
  };

  const handleToggleGameBooking = async (gameId: string, currentBookingOpen: boolean) => {
    if (!onUpdateGame) return;
    setGameTogglingId(gameId);
    const newBookingState = !currentBookingOpen;
    try {
      await onUpdateGame(gameId, {
        bookingOpen: newBookingState,
      });
      setGameActionNotice(
        newBookingState
          ? `🎟️ टिकट बुकिंग चालू (OPEN) कर दी गई है!`
          : `🔒 टिकट बुकिंग बंद (CLOSED) कर दी गई है!`
      );
      setTimeout(() => setGameActionNotice(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setGameTogglingId(null);
    }
  };

  const handleBatchAllGames = async (turnOn: boolean) => {
    if (!onUpdateGame || games.length === 0) return;
    setGameTogglingId('batch');
    try {
      for (const g of games) {
        await onUpdateGame(g.id, {
          isActive: turnOn,
          bookingOpen: turnOn,
          status: turnOn ? (g.status === 'cancelled' ? 'upcoming' : g.status) : 'cancelled',
        });
      }
      setGameActionNotice(
        turnOn
          ? `🟢 सभी ${games.length} गेम्स और टिकट बुकिंग एक साथ चालू (ALL ON) कर दिए गए हैं!`
          : `🔴 सभी ${games.length} गेम्स और टिकट बुकिंग एक साथ बंद (ALL OFF) कर दिए गए हैं!`
      );
      setTimeout(() => setGameActionNotice(null), 4500);
    } catch (e) {
      console.error(e);
    } finally {
      setGameTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>Master System Settings &amp; Payment Gateway Configuration</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            गेम चालू/बंद (Game ON/OFF), एडमिन यूपीआई आईडी (UPI ID), क्यूआर कोड (QR Code), आवाज एवं वित्तीय सेटिंग्स।
          </p>
        </div>

        {/* Quick ZIP Export Direct Download Button */}
        <a
          href="/apna-tambola-latest.zip"
          download="apna-tambola-latest.zip"
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border border-amber-300"
        >
          <Download className="w-4 h-4" />
          <span>📥 Download Latest Code ZIP</span>
        </a>
      </div>

      {/* 📦 Direct ZIP Download Notification Card for Vercel/Hosting Update */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border-2 border-blue-500/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/40 shrink-0">
            <FileArchive className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">📦 नया अपडेट ZIP फ़ाइल (Vercel लाइव डिप्लॉयमेंट)</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                READY TO DOWNLOAD
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              आपकी लाइव वेबसाइट (<strong className="text-amber-300">apna-tambola-five.vercel.app</strong>) पर नया आईडी डिलीट फीचर और रेफरल अपडेट डालने के लिए नीचे दिए गए बटन से ZIP फाइल सीधे डाउनलोड करें।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          <a
            href="/apna-tambola-latest.zip"
            download="apna-tambola-latest.zip"
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>डाउनलोड ZIP (.zip)</span>
          </a>
          <a
            href="/project-update.tar.gz"
            download="project-update.tar.gz"
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>.tar.gz</span>
          </a>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* 🎮 SECTION 0: GAME ON / OFF MASTER MATRIX (गेम खिलाना है या नहीं खिलाना है - एडमिन नियंत्रण) */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-400/60 p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/40 shadow-lg shadow-amber-400/10">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>गेम चालू / बंद मास्टर सेटिंग्स (Game ON / OFF Master Matrix)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black tracking-wider uppercase">
                  ⚡ एडमिन डायरेक्ट कंट्रोल
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                गेम खिलाना है या नहीं खिलाना है वो पूरी तरह आपके (Admin) हाथ में है। यहाँ से तय करें कौनसा गेम ON रखें और कौनसा गेम OFF।
              </p>
            </div>
          </div>

          {/* Quick Master Batch Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => handleBatchAllGames(true)}
              disabled={gameTogglingId === 'batch'}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Power className="w-3.5 h-3.5 text-emerald-400" />
              <span>सभी गेम चालू करें (All ON)</span>
            </button>
            <button
              type="button"
              onClick={() => handleBatchAllGames(false)}
              disabled={gameTogglingId === 'batch'}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/50 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-red-500/20 active:scale-95"
            >
              <Ban className="w-3.5 h-3.5 text-red-400" />
              <span>सभी गेम बंद करें (All OFF)</span>
            </button>
          </div>
        </div>

        {gameActionNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 text-xs font-black flex items-center gap-2 shadow-xl">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{gameActionNotice}</span>
          </div>
        )}

        {/* Games Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">
          {games.length === 0 ? (
            <div className="col-span-full p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded-2xl border border-slate-800">
              कोई गेम उपलब्ध नहीं है। गेम्स मॉड्यूल से नया गेम बनाएं।
            </div>
          ) : (
            games.map((g) => {
              const isGameActive = g.isActive !== false && g.status !== 'cancelled';
              const isBookingOpen = g.bookingOpen !== false && isGameActive;

              return (
                <div
                  key={g.id}
                  className={`rounded-2xl border-2 p-4 flex flex-col justify-between space-y-3.5 transition-all shadow-xl ${
                    !isGameActive
                      ? 'bg-gradient-to-b from-[#200a0a] via-[#150707] to-[#0c0404] border-red-500/60 opacity-95'
                      : isBookingOpen
                      ? 'bg-gradient-to-b from-[#121c2b] via-[#0d1420] to-[#080d14] border-emerald-500/50 hover:border-emerald-400'
                      : 'bg-slate-950 border-amber-500/40'
                  }`}
                >
                  {/* Game Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/30">
                          {g.gameCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            isGameActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}
                        >
                          {isGameActive ? '🟢 खेल चालू (ON)' : '🔴 खेल बंद (OFF)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300">
                        <span>₹{g.ticketPrice}/Ticket</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white truncate">{g.title}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>समय: {g.startTime} ({g.date})</span>
                      </p>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/40 p-2 rounded-xl border border-white/5">
                      <div>
                        <span className="text-slate-400 block">Prize Pool:</span>
                        <span className="font-black text-amber-400 font-mono">₹{g.prizePool.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Registered:</span>
                        <span className="font-bold text-white">{g.registeredPlayers} Players</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Toggle Switches: 1) Master Game ON/OFF  2) Booking ON/OFF */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    {/* 1. Master Game Toggle */}
                    <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-slate-800/80">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">गेम स्थिति (Game Status)</span>
                        <span className="text-[10px] text-slate-400">
                          {isGameActive ? 'खिलाड़ी खेल सकते हैं' : 'खेल पूरी तरह बंद है'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleGameActive(g.id, isGameActive)}
                        disabled={gameTogglingId === g.id}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isGameActive
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isGameActive ? 'ON (चालू)' : 'OFF (बंद)'}</span>
                      </button>
                    </div>

                    {/* 2. Ticket Booking Toggle */}
                    <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-slate-800/80">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">टिकट बुकिंग (Booking)</span>
                        <span className="text-[10px] text-slate-400">
                          {isBookingOpen ? 'टिकट बिक रहे हैं' : 'बुकिंग बंद है'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleGameBooking(g.id, isBookingOpen)}
                        disabled={gameTogglingId === g.id || !isGameActive}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                          !isGameActive
                            ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border-slate-800'
                            : isBookingOpen
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20 cursor-pointer font-black'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 cursor-pointer'
                        }`}
                      >
                        <TicketIcon className="w-3.5 h-3.5" />
                        <span>{isBookingOpen ? 'बुकिंग OPEN' : 'बुकिंग CLOSED'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* 💳 SECTION 1: ADMIN UPI & QR CODE PAYMENT GATEWAY (USER RECHARGE DEPOSIT) */}
        <div className="rounded-3xl bg-slate-900/90 border-2 border-emerald-500/40 p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Admin UPI ID &amp; QR Code Settings (एडमिन यूपीआई और क्यूआर कोड)</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                    LIVE GATEWAY
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Whenever users click &ldquo;Add Money (पैसे जोड़ें)&rdquo; in their wallet, your configured UPI ID and QR code will be displayed for direct payment.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Inputs (UPI ID & Banking) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Admin UPI ID (एडमिन यूपीआई आईडी) *</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={adminUpiId}
                      onChange={(e) => setAdminUpiId(e.target.value)}
                      required
                      placeholder="e.g. yourname@okhdfcbank / 9876543210@paytm"
                      className="w-full bg-slate-950 border-2 border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Funds transferred by users will go directly to this UPI VPA.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold">Admin / Merchant Name (नाम)</label>
                  <input
                    type="text"
                    value={adminUpiName}
                    onChange={(e) => setAdminUpiName(e.target.value)}
                    required
                    placeholder="e.g. Tambola Live India"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Direct Bank Account Details */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Admin Direct Bank Account (For IMPS / NEFT Deposits)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Bank Name</label>
                    <input
                      type="text"
                      value={adminBankName}
                      onChange={(e) => setAdminBankName(e.target.value)}
                      placeholder="HDFC Bank"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Account Number</label>
                    <input
                      type="text"
                      value={adminAccountNo}
                      onChange={(e) => setAdminAccountNo(e.target.value)}
                      placeholder="50200088991122"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">IFSC Code</label>
                    <input
                      type="text"
                      value={adminIfsc}
                      onChange={(e) => setAdminIfsc(e.target.value)}
                      placeholder="HDFC0000123"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* User Payment Instructions Note */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold">Payment Instructions for User</label>
                <textarea
                  value={adminUpiNote}
                  onChange={(e) => setAdminUpiNote(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Min & Max Deposit & Multiples Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Min Deposit (₹)</label>
                  <input
                    type="number"
                    value={minDeposit}
                    onChange={(e) => setMinDeposit(Number(e.target.value))}
                    min={10}
                    step={100}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Deposit Multiple (₹)</label>
                  <input
                    type="number"
                    value={depositMultiple}
                    onChange={(e) => setDepositMultiple(Number(e.target.value))}
                    min={10}
                    step={50}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Max Deposit (₹)</label>
                  <input
                    type="number"
                    value={maxDeposit}
                    onChange={(e) => setMaxDeposit(Number(e.target.value))}
                    min={100}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-black"
                  />
                </div>
              </div>

              {/* Withdrawal Rules & TDS / Admin Fee Deduction */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>Withdrawal Rules &amp; Fee Policy (निकासी नियम व फीस कटौती)</span>
                  <span className="text-[10px] text-slate-400">Total Deduction: {tdsPercentage + adminFeePercentage}%</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Min Withdraw (₹)</label>
                    <input
                      type="number"
                      value={minWithdrawal}
                      onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Multiple of (₹)</label>
                    <input
                      type="number"
                      value={withdrawalMultiple}
                      onChange={(e) => setWithdrawalMultiple(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-red-400 font-bold">TDS (10%)</label>
                    <input
                      type="number"
                      value={tdsPercentage}
                      onChange={(e) => setTdsPercentage(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-red-300 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-amber-400 font-bold">Admin Fee (5%)</label>
                    <input
                      type="number"
                      value={adminFeePercentage}
                      onChange={(e) => setAdminFeePercentage(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive UPI QR Scanner Preview */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live User Payment Preview</span>
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-emerald-400">
                <img
                  src={computedQrUrl}
                  alt="Admin UPI QR Code"
                  className="w-40 h-40 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-black text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/20">
                  {adminUpiId || 'No UPI ID set'}
                </div>
                <div className="text-[11px] text-slate-300 font-bold">{adminUpiName}</div>
                <p className="text-[10px] text-slate-400">
                  Scan via PhonePe, Google Pay, Paytm, BHIM, Amazon Pay or CRED
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🎙️ SECTION 2: TAMBOLA CALLER VOICE & LANGUAGE (ENGLISH / HINDI / BILINGUAL) */}
        <div className="rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 p-5 sm:p-7 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Tambola Caller Voice &amp; Language (नंबर बताने वाली आवाज: इंग्लिश / हिन्दी)</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                    VOICE ENGINE
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Configure real-time voice speech caller for live matches. Speaks official nicknames and numbers in English, Hindi, or both!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option 1: Hindi */}
            <div
              onClick={() => setVoiceLanguage('hi')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                voiceLanguage === 'hi'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">🇮🇳</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${voiceLanguage === 'hi' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {voiceLanguage === 'hi' ? 'ACTIVE' : 'SELECT'}
                </span>
              </div>
              <h4 className="text-sm font-black text-white">हिन्दी भाषा (Hindi Only)</h4>
              <p className="text-xs text-slate-300 mt-1">
                &ldquo;नंबर सैंतालीस (47) - देश की आज़ादी!&rdquo;
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestVoice('hi');
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer hover:bg-amber-300"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Hindi Voice 🔊</span>
                </button>
              </div>
            </div>

            {/* Option 2: English */}
            <div
              onClick={() => setVoiceLanguage('en')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                voiceLanguage === 'en'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">🇬🇧</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${voiceLanguage === 'en' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {voiceLanguage === 'en' ? 'ACTIVE' : 'SELECT'}
                </span>
              </div>
              <h4 className="text-sm font-black text-white">English Language</h4>
              <p className="text-xs text-slate-300 mt-1">
                &ldquo;Number 47 - Four and Seven, Independence Year!&rdquo;
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestVoice('en');
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer hover:bg-amber-300"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test English Voice 🔊</span>
                </button>
              </div>
            </div>

            {/* Option 3: Both / Bilingual */}
            <div
              onClick={() => setVoiceLanguage('both')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                voiceLanguage === 'both'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">🌐</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${voiceLanguage === 'both' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {voiceLanguage === 'both' ? 'RECOMMENDED' : 'SELECT'}
                </span>
              </div>
              <h4 className="text-sm font-black text-white">Bilingual (English + हिन्दी दोनों)</h4>
              <p className="text-xs text-slate-300 mt-1">
                &ldquo;Number 47 - सैंतालीस, Year of Independence!&rdquo;
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestVoice('both');
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer hover:bg-amber-300"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Bilingual Voice 🔊</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🌐 SECTION 3: PLATFORM BRANDING & MARQUEE */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white">Platform Branding &amp; Helpline Contacts</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-300 font-bold">Maintenance Mode:</span>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                  maintenanceMode ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {maintenanceMode ? 'ON (LOCKED)' : 'OFF (LIVE)'}
              </button>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Platform / Brand Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Support WhatsApp Helpline</label>
              <input
                type="text"
                value={supportWhatsapp}
                onChange={(e) => setSupportWhatsapp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Tawk.to Live Chat & Ticketing Config */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                Tawk.to 24x7 Live Chat &amp; Ticketing Desk Integration
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-bold">Tawk Site ID</label>
                <input
                  type="text"
                  value={tawkSiteId}
                  onChange={(e) => setTawkSiteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  placeholder="671ba0224304e3196ad82413"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-bold">Tawk API Key</label>
                <input
                  type="text"
                  value={tawkApiKey}
                  onChange={(e) => setTawkApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  placeholder="dcfa340637fca3d2a0e313d39bec5ba49b10288a"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-bold">Ticket Email Desk</label>
                <input
                  type="email"
                  value={ticketEmail}
                  onChange={(e) => setTicketEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-emerald-400"
                  placeholder="tickets@click-earn-hvfde7.p.tawk.email"
                />
              </div>
            </div>
          </div>

          {/* Marquee Banner */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Marquee Ticker Headline (Visible on all player screens)</span>
            </label>
            <input
              type="text"
              value={noticeMarquee}
              onChange={(e) => setNoticeMarquee(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* 🎨 Admin Ticket Color Theme Customizer */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border-2 border-amber-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Admin Ticket Color Theme (टिकट का रंग सेट करें)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                      LIVE ON WEBSITE
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    एडमिन द्वारा चुना गया टिकट कलर थीम लाइव वेबसाइट, मैच कार्ड और प्लेयर स्क्रीन पर तुरंत लागू होगा।
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-400/30 self-start sm:self-auto">
                Current: {(defaultTicketTheme || 'classic_gold').toUpperCase()}
              </span>
            </div>

            {/* Ticket Theme Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
              {COLOR_KEYS.map((key) => {
                const palette = TICKET_COLOR_PALETTES[key];
                const isSelected = defaultTicketTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDefaultTicketTheme(key)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-3.5 h-3.5 rounded-full shadow" style={{ backgroundColor: palette.previewHex }} />
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-amber-400 font-black" />
                      ) : (
                        <span className="text-[9px] text-slate-500 uppercase font-mono">{key}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-200 block truncate">{palette.name}</span>
                    <span className="text-[9px] text-slate-400 truncate mt-0.5">{palette.badgeLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Palette */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Primary Festive Theme System</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'gold', name: 'Golden Festival (Royale)', color: '#fbbf24' },
                { id: 'emerald', name: 'Emerald Jackpot', color: '#10b981' },
                { id: 'purple', name: 'Mystic Purple Vegas', color: '#a855f7' },
                { id: 'ruby', name: 'Ruby Casino Red', color: '#ef4444' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setActiveTheme(theme.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                    activeTheme === theme.id
                      ? 'bg-slate-800 text-white border-amber-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }} />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center justify-end p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving Master Settings...' : 'Save All Settings (सेव करें & लाइव अपडेट)'}</span>
          </button>
        </div>
      </form>

      {/* Security & Access Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Admin Login ID & Password Management */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-black text-white">Admin Login Credentials &amp; Security</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
              LIVE SYNC
            </span>
          </div>

          {/* Quick Copy Admin ID / Pass Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                Current Admin Login Details (लॉगिन विवरण)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`Admin ID: ${adminUsername}\nPassword: ${adminPassword}`);
                  setCopiedCreds(true);
                  setTimeout(() => setCopiedCreds(false), 2500);
                }}
                className="text-[10px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-400/30 cursor-pointer"
              >
                {copiedCreds ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCreds ? 'Copied Details!' : 'Copy ID & Password'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Admin Login ID (Email/Phone):</span>
                <span className="text-emerald-300 font-black">{adminUsername}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Admin Password (पासवर्ड):</span>
                <span className="text-amber-300 font-black">{adminPassword || '••••••••'}</span>
              </div>
            </div>
          </div>

          {/* Change Admin ID & Password Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Admin ID &amp; Password (एडमिन आईडी और पासवर्ड बदलें)</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Admin Login ID / Email</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin@tambolalive.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">New Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="New password..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Two-Factor Authentication (2FA)</span>
                </div>
                <div className="text-[10px] text-slate-400">Require OTP on admin panel login</div>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                  twoFactorAuth ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {twoFactorAuth ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            {securityNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{securityNotice}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Update &amp; Apply Admin Password (पासवर्ड सेव करें)</span>
            </button>
          </form>
        </div>

        {/* Right: Security & Login Audit History */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white">Recent Admin Sessions &amp; IP Log</h3>
            </div>
          </div>

          <div className="space-y-2">
            {loginHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{item.userName} ({item.role})</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    IP: {item.ipAddress} • {item.device}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      item.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {item.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
