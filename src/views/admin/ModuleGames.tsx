import React, { useState } from 'react';
import {
  Gamepad2,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Edit,
  Trash2,
  Clock,
  Ticket,
  Trophy,
  Users,
  Calendar,
  Sparkles,
  AlertTriangle,
  Layers,
  Palette,
  Check,
  Radio,
  XCircle,
  TrendingUp,
  Power,
  Lock,
  Unlock,
  CheckCircle2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { TambolaGame, GamePrize, TicketColorThemeId, PrizeCode } from '../../types';
import { TICKET_COLOR_PALETTES, COLOR_KEYS } from '../../utils/ticketColors';

interface ModuleGamesProps {
  games: TambolaGame[];
  onCreateGame: (gameData: Partial<TambolaGame>) => Promise<boolean>;
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean>;
  onDeleteGame?: (gameId: string) => Promise<boolean>;
  onNavigateTab: (tabId: string, gameId?: string) => void;
  onCallNext: () => void;
  onToggleAuto: () => void;
  onResetGame: () => void;
}

const DEFAULT_PRIZE_SET: Omit<GamePrize, 'id' | 'claimedWinners'>[] = [
  { code: 'early5', name: 'Early 5 (Jaldi 5)', amount: 500, maxWinners: 1, description: 'First to strike any 5 numbers' },
  { code: 'corners', name: '4 Corners', amount: 500, maxWinners: 1, description: '4 corner numbers' },
  { code: 'top_line', name: 'Top Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of top line' },
  { code: 'mid_line', name: 'Middle Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of middle line' },
  { code: 'bot_line', name: 'Bottom Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of bottom line' },
  { code: 'full_house', name: '1st Full House (Bumper)', amount: 6000, maxWinners: 1, description: 'All 15 numbers completed' },
  { code: 'second_full_house', name: '2nd Full House', amount: 3000, maxWinners: 1, description: 'Second to complete 15 numbers' },
  { code: 'third_full_house', name: '3rd Full House', amount: 1500, maxWinners: 1, description: 'Third to complete 15 numbers' },
];

export const ModuleGames: React.FC<ModuleGamesProps> = ({
  games = [],
  onCreateGame,
  onUpdateGame,
  onDeleteGame,
  onNavigateTab,
  onCallNext,
  onToggleAuto,
  onResetGame,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'live' | 'upcoming' | 'completed' | 'disabled'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGame, setEditingGame] = useState<TambolaGame | null>(null);

  const safeGames = Array.isArray(games) ? games : [];

  // Form State
  const [title, setTitle] = useState('Mega Bumper Housie Night');
  const [date, setDate] = useState('Today');
  const [startTime, setStartTime] = useState('09:00 PM');
  const [ticketPrice, setTicketPrice] = useState(50);
  const [maxTicketsPerUser, setMaxTicketsPerUser] = useState(6);
  const [ticketColorTheme, setTicketColorTheme] = useState<TicketColorThemeId>('multi');
  const [isGameEnabled, setIsGameEnabled] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(true);
  const [prizes, setPrizes] = useState<Omit<GamePrize, 'id' | 'claimedWinners'>[]>(DEFAULT_PRIZE_SET);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  // Real-time schedule draft edits for quick inline date & time modification
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, { date: string; time: string }>>({});

  const getGameScheduleDraft = (game: TambolaGame) => {
    if (!game) return { date: 'Today', time: '09:00 PM' };
    return (
      scheduleDrafts[game.id] || {
        date: game.date || 'Today',
        time: game.startTime || '09:00 PM',
      }
    );
  };

  const updateScheduleDraft = (gameId: string, field: 'date' | 'time', value: string) => {
    setScheduleDrafts((prev) => {
      const current = prev[gameId] || {
        date: safeGames.find((g) => g.id === gameId)?.date || 'Today',
        time: safeGames.find((g) => g.id === gameId)?.startTime || '09:00 PM',
      };
      return {
        ...prev,
        [gameId]: { ...current, [field]: value },
      };
    });
  };

  const handleSaveGameSchedule = async (gameId: string) => {
    if (!onUpdateGame || !gameId) return;
    const game = safeGames.find((g) => g.id === gameId);
    if (!game) return;
    const draft = scheduleDrafts[gameId] || {
      date: game.date || 'Today',
      time: game.startTime || '09:00 PM',
    };
    await onUpdateGame(gameId, {
      date: draft.date.trim() || 'Today',
      startTime: draft.time.trim() || '09:00 PM',
    });
    setActionNotice(`गेम "${game.title}" का शेड्यूल: दिनांक "${draft.date}" व समय "${draft.time}" सफलतापूर्वक सेव कर दिया गया है!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleQuickToggleTicketTier = async (game: TambolaGame, enable: boolean) => {
    if (!onUpdateGame || !game) return;
    await onUpdateGame(game.id, {
      isGameEnabled: enable,
      isActive: enable,
      isBookingOpen: enable,
      bookingOpen: enable,
      status: enable ? (game.status === 'cancelled' ? 'upcoming' : game.status) : 'cancelled',
    });
    setActionNotice(
      `₹${game.ticketPrice} का टिकट (${game.title}) एडमिन द्वारा ${enable ? 'चालू (ON) - बुकिंग खुली' : 'बंद (OFF) - बुकिंग बंद'} कर दिया गया है!`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleQuickCreateTier = async (price: number) => {
    const titles: Record<number, string> = {
      5: '⚡ ₹5 Mini Fast Housie',
      10: '🚀 ₹10 Quick Super Housie',
      15: '🎯 ₹15 Express Dhamaka',
      20: '🔥 ₹20 Mega 20 Tambola',
      30: '⚡ ₹30 Lightning Super Housie',
      50: '🏆 ₹50 Jackpot Night Bumper',
      100: '👑 ₹100 Weekend Grand Maha Housie',
    };
    const title = titles[price] || `₹${price} Special Tambola Match`;
    const pool = price * 200 * 0.7; // 70% prize pool
    await onCreateGame({
      title,
      ticketPrice: price,
      date: 'Today',
      startTime: '09:30 PM',
      prizePool: pool,
      isGameEnabled: true,
      isActive: true,
      isBookingOpen: true,
      bookingOpen: true,
      status: 'upcoming',
    });
    setActionNotice(`₹${price} वाला नया गेम "${title}" सफलतापूर्वक शुरू कर दिया गया और चालू (ON) है!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const computedPrizePool = prizes.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const filteredGames = safeGames.filter((g) => {
    if (!g) return false;
    if (filterTab === 'disabled') return g.isGameEnabled === false || g.isActive === false;
    if (filterTab === 'live') return g.status === 'live';
    if (filterTab === 'upcoming') return g.status === 'upcoming';
    if (filterTab === 'completed') return g.status === 'completed';
    return true;
  });

  const handleOpenCreate = () => {
    setEditingGame(null);
    setTitle('Mega Jackpot Tambola Night');
    setDate('Today');
    setStartTime('10:00 PM');
    setTicketPrice(50);
    setTicketColorTheme('multi');
    setIsGameEnabled(true);
    setIsBookingOpen(true);
    setPrizes(DEFAULT_PRIZE_SET);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (game: TambolaGame) => {
    if (!game) return;
    setEditingGame(game);
    setTitle(game.title || 'Tambola Match');
    setDate(game.date || 'Today');
    setStartTime(game.startTime || '09:00 PM');
    setTicketPrice(game.ticketPrice || 50);
    setTicketColorTheme(game.ticketColorTheme || 'multi');
    setIsGameEnabled(game.isGameEnabled !== false && game.isActive !== false);
    setIsBookingOpen(game.isBookingOpen !== false && game.bookingOpen !== false);
    if (game.prizes && Array.isArray(game.prizes) && game.prizes.length > 0) {
      setPrizes(game.prizes.map((p) => ({
        code: (p.code as PrizeCode) || 'early5',
        name: p.name || 'Prize',
        amount: p.amount || 0,
        maxWinners: p.maxWinners || 1,
        description: p.description || '',
      })));
    } else {
      setPrizes(DEFAULT_PRIZE_SET);
    }
    setShowCreateModal(true);
  };

  const handleToggleGameMaster = async (game: TambolaGame, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!game) return;
    const newStatus = !(game.isActive !== false && game.isGameEnabled !== false && game.status !== 'cancelled');
    if (onUpdateGame) {
      await onUpdateGame(game.id, {
        isActive: newStatus,
        isGameEnabled: newStatus,
        status: newStatus ? (game.status === 'cancelled' ? 'upcoming' : game.status) : 'cancelled',
      });
      setActionNotice(
        `गेम "${game.title}" को एडमिन द्वारा ${newStatus ? 'चालू (ENABLED / ON)' : 'बंद (DISABLED / OFF)'} कर दिया गया है!`
      );
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleToggleBooking = async (game: TambolaGame, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!game) return;
    const newBooking = !(game.bookingOpen !== false && game.isBookingOpen !== false);
    if (onUpdateGame) {
      await onUpdateGame(game.id, {
        bookingOpen: newBooking,
        isBookingOpen: newBooking,
      });
      setActionNotice(
        `गेम "${game.title}" की टिकट बुकिंग ${newBooking ? 'चालू (OPEN)' : 'बंद (CLOSED)'} कर दी गई है!`
      );
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleBatchToggleAll = async (enable: boolean) => {
    if (onUpdateGame) {
      for (const g of safeGames) {
        if (!g) continue;
        await onUpdateGame(g.id, {
          isActive: enable,
          isGameEnabled: enable,
          bookingOpen: enable,
          isBookingOpen: enable,
          status: enable ? (g.status === 'cancelled' ? 'upcoming' : g.status) : 'cancelled',
        });
      }
      setActionNotice(
        `सभी गेम (${safeGames.length}) को एडमिन द्वारा एक साथ ${enable ? 'चालू (ON)' : 'बंद (OFF)'} कर दिया गया है!`
      );
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingGame && onUpdateGame) {
        await onUpdateGame(editingGame.id, {
          title,
          date,
          startTime,
          ticketPrice,
          ticketColorTheme,
          isGameEnabled,
          isBookingOpen,
          prizePool: computedPrizePool,
          prizes: prizes.map((p, idx) => ({
            ...p,
            id: `prz_edit_${idx + 1}`,
            claimedWinners: [],
          })),
        });
        setActionNotice(`Game "${title}" successfully updated & live synced!`);
      } else {
        await onCreateGame({
          title,
          date,
          startTime,
          ticketPrice,
          maxTicketsPerUser,
          ticketColorTheme,
          isGameEnabled,
          isBookingOpen,
          prizePool: computedPrizePool,
          totalTickets: 200,
          soldTickets: 0,
          status: 'upcoming',
          prizes: prizes.map((p, idx) => ({
            ...p,
            id: `prz_new_${Date.now()}_${idx}`,
            claimedWinners: [],
          })),
        });
        setActionNotice(`New Game "${title}" successfully scheduled & live synced!`);
      }
      setShowCreateModal(false);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGame = async (game: TambolaGame) => {
    if (confirm(`Are you sure you want to cancel "${game.title}"? All purchased tickets will be refunded to player wallets automatically.`)) {
      if (onUpdateGame) {
        await onUpdateGame(game.id, { status: 'completed' });
      }
      setActionNotice(`Game "${game.title}" cancelled and tickets refunded.`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-amber-400" />
            <span>Tambola Game Management &amp; Live Controls</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            एडमिन किसी भी गेम या टिकट बुकिंग को कभी भी <strong className="text-amber-300">चालू (ON)</strong> या <strong className="text-red-400">बंद (OFF)</strong> कर सकता है। सभी बदलाव तुरंत लाइव वेबसाइट पर अपडेट होते हैं।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Quick Switches */}
          <button
            onClick={() => handleBatchToggleAll(true)}
            className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="सभी गेम को एक साथ चालू (ON) करें"
          >
            <Power className="w-3.5 h-3.5 text-emerald-400" />
            <span>सभी गेम चालू करें (All ON)</span>
          </button>

          <button
            onClick={() => handleBatchToggleAll(false)}
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="सभी गेम को एक साथ बंद (OFF) करें"
          >
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>सभी गेम बंद करें (All OFF)</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Game</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 🎟️ टिकट दर & लाइव शेड्यूल मास्टर कंट्रोलर (User Requested Ticket Master Control) */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#17142b] via-[#1f1938] to-[#17142b] border-2 border-amber-400/60 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
              <Ticket className="w-3.5 h-3.5" />
              <span>टिकट दर, चालू/बंद व दिनांक-समय मास्टर कंट्रोल</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              🎟️ टिकट श्रेणियां (₹5, ₹10, ₹15, ₹50...) चालू / बंद &amp; शेड्यूल
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl">
              एडमिन जो भी टिकट दर (जैसे ₹5 या ₹10 वाला) यहाँ <strong className="text-emerald-400">चालू (ON)</strong> करेगा, यूजर वही टिकट खरीद सकेगा। जो टिकट <strong className="text-red-400">बंद (OFF)</strong> होगा, उस पर यूजर को 'एडमिन द्वारा बंद' दिखेगा। आप प्रत्येक टिकट की तारीख और समय भी यहीं से तुरंत सेट व सेव कर सकते हैं।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[5, 10, 15, 20, 50, 100].map((p) => {
              const exists = safeGames.some((g) => (g.ticketPrice || 0) === p);
              if (exists) return null;
              return (
                <button
                  key={p}
                  onClick={() => handleQuickCreateTier(p)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title={`₹${p} वाला नया टिकट मैच जोड़ें`}
                >
                  <Plus className="w-3 h-3" />
                  <span>+ ₹{p} टिकट जोड़ें</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Grid of Ticket Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {safeGames
            .slice()
            .sort((a, b) => (a.ticketPrice || 0) - (b.ticketPrice || 0))
            .map((game) => {
              const draft = getGameScheduleDraft(game);
              const isEnabled = game.isGameEnabled !== false && game.isActive !== false && game.status !== 'cancelled';
              const isBooking = game.isBookingOpen !== false && game.bookingOpen !== false;
              const isFullyActive = isEnabled && isBooking;

              return (
                <div
                  key={`tier-${game.id}`}
                  className={`rounded-2xl p-4 border transition-all space-y-3 shadow-lg ${
                    isFullyActive
                      ? 'bg-slate-900/90 border-emerald-500/50 shadow-emerald-950/30'
                      : 'bg-[#180b0e] border-red-500/50 shadow-red-950/30 opacity-90'
                  }`}
                >
                  {/* Top: Price Pill & Master Switch */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-sm font-black font-mono shadow-md border ${
                        isFullyActive
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        ₹{game.ticketPrice || 0} का टिकट
                      </span>
                      <span className="text-[11px] font-bold text-slate-300 truncate max-w-[130px]" title={game.title}>
                        {game.title}
                      </span>
                    </div>

                    {/* 1-Click Master ON / OFF Toggle */}
                    <button
                      type="button"
                      onClick={() => handleQuickToggleTicketTier(game, !isFullyActive)}
                      className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border shadow-md active:scale-95 ${
                        isFullyActive
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300'
                          : 'bg-red-600 hover:bg-red-500 text-white border-red-400'
                      }`}
                      title={isFullyActive ? 'इस टिकट को बंद करें (Turn OFF)' : 'इस टिकट को चालू करें (Turn ON)'}
                    >
                      {isFullyActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                          <span>🟢 चालू (ON)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-white" />
                          <span>🔴 बंद (OFF)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Status Indicator text for user */}
                  <div className="text-[11px] flex items-center justify-between px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 font-mono">
                    <span className="text-slate-400">यूजर बुकिंग स्थिति:</span>
                    <span className={`font-black ${isFullyActive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isFullyActive ? '✓ यूजर खरीद सकता है' : '✗ बुकिंग बंद (OFF)'}
                    </span>
                  </div>

                  {/* Inline Date & Time Schedule Setter */}
                  <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>ड्रॉ तारीख व समय सेट करें:</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {game.totalTicketsSold || 0} टिकट सोल्ड
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">तारीख (Date)</label>
                        <input
                          type="text"
                          value={draft.date}
                          onChange={(e) => updateScheduleDraft(game.id, 'date', e.target.value)}
                          placeholder="e.g. Today / 2026-09-02"
                          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-amber-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">समय (Time)</label>
                        <input
                          type="text"
                          value={draft.time}
                          onChange={(e) => updateScheduleDraft(game.id, 'time', e.target.value)}
                          placeholder="e.g. 09:00 PM"
                          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-amber-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveGameSchedule(game.id)}
                        className="flex-1 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>💾 सेव शेड्यूल (Save Schedule)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(game)}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                        title="Edit all details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: `All Games (${safeGames.length})` },
          { id: 'live', label: `Live (${safeGames.filter((g) => g && g.status === 'live').length})` },
          { id: 'upcoming', label: `Upcoming (${safeGames.filter((g) => g && g.status === 'upcoming').length})` },
          { id: 'completed', label: `Completed (${safeGames.filter((g) => g && g.status === 'completed').length})` },
          { id: 'disabled', label: `🔴 Disabled / बंद (${safeGames.filter((g) => g && (g.isGameEnabled === false || g.isActive === false)).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterTab === tab.id
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Games List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGames.map((game) => {
          const isLive = game.status === 'live';
          const isUpcoming = game.status === 'upcoming';
          const isCompleted = game.status === 'completed';
          const isEnabled = game.isGameEnabled !== false;
          const isBookingActive = game.isBookingOpen !== false;

          return (
            <div
              key={game.id}
              className={`rounded-2xl p-5 border transition-all space-y-4 flex flex-col justify-between shadow-xl ${
                !isEnabled
                  ? 'bg-gradient-to-b from-[#250d0d] via-[#1a0808] to-[#100404] border-red-500/60 shadow-red-500/20'
                  : isLive
                  ? 'bg-gradient-to-b from-[#2a0f1e] to-[#120815] border-red-500/50 shadow-red-500/10'
                  : isUpcoming
                  ? 'bg-slate-900/90 border-amber-400/30 hover:border-amber-400/60'
                  : 'bg-slate-950/90 border-slate-800 opacity-80'
              }`}
            >
              <div className="space-y-3">
                {/* Status Badge & Master ON/OFF Switch */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        !isEnabled
                          ? 'bg-red-950 text-red-300 border border-red-500/60'
                          : isLive
                          ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                          : isUpcoming
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isLive && isEnabled && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                      {!isEnabled ? '🔴 बंद (OFF)' : (game.status || 'upcoming').toUpperCase()}
                    </span>

                    {/* Booking Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black ${
                        isBookingActive
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-900/40 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {isBookingActive ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      <span>{isBookingActive ? 'बुकिंग चालू' : 'बुकिंग बंद'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(game)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      title="Edit Game"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteGame && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete game "${game.title}"?`)) {
                            onDeleteGame(game.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs cursor-pointer"
                        title="Delete Game"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Timing */}
                <div>
                  <h3 className={`text-base font-black ${isEnabled ? 'text-white' : 'text-red-200'}`}>
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {game.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      {game.startTime}
                    </span>
                  </div>
                </div>

                {/* 🎛️ Admin Direct Quick Control Switch Bar */}
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Power className={`w-3.5 h-3.5 ${isEnabled ? 'text-emerald-400' : 'text-red-400'}`} />
                      <span className="text-[11px] font-bold text-slate-300">गेम मास्टर स्विच:</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleGameMaster(game, e)}
                      className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/60 hover:bg-red-500/30'
                      }`}
                      title={isEnabled ? 'गेम को बंद करें (Turn OFF)' : 'गेम को चालू करें (Turn ON)'}
                    >
                      {isEnabled ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>🟢 चालू (ON)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span>🔴 बंद (OFF)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Ticket className={`w-3.5 h-3.5 ${isBookingActive ? 'text-cyan-400' : 'text-amber-400'}`} />
                      <span className="text-[11px] font-bold text-slate-300">टिकट बुकिंग स्विच:</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleBooking(game, e)}
                      className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isBookingActive
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 hover:bg-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/60 hover:bg-amber-500/30'
                      }`}
                      title={isBookingActive ? 'बुकिंग बंद करें (Close Booking)' : 'बुकिंग चालू करें (Open Booking)'}
                    >
                      {isBookingActive ? (
                        <>
                          <Unlock className="w-3 h-3 text-cyan-400" />
                          <span>🎟️ बुकिंग चालू</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>🔒 बुकिंग बंद</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Prize Pool (70%)</div>
                    <div className="text-sm font-black text-amber-400">₹{(game.prizePool || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Ticket Rate</div>
                    <div className="text-sm font-black text-white">₹{game.ticketPrice || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Sold / Min 100</div>
                    <div className={`text-sm font-black ${(game.soldTickets || 0) >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {game.soldTickets || 0} / 100
                    </div>
                  </div>
                </div>

                {/* 100 Tickets Requirement Mini Banner */}
                {isUpcoming && (
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">100 टिकट नियम (Min 100 to Start):</span>
                      <span className={`font-black ${(game.soldTickets || 0) >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {(game.soldTickets || 0) >= 100 ? '✅ रेडी टू स्टार्ट' : `${100 - (game.soldTickets || 0)} टिकट शेष`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          (game.soldTickets || 0) >= 100
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        }`}
                        style={{ width: `${Math.min(100, ((game.soldTickets || 0) / 100) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 📅 Quick Date & Time Schedule Quick Editor */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>तारीख &amp; समय तुरंत अपडेट करें:</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">तारीख (Date)</label>
                      <input
                        type="text"
                        value={getGameScheduleDraft(game).date}
                        onChange={(e) => updateScheduleDraft(game.id, 'date', e.target.value)}
                        placeholder="e.g. Today"
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">समय (Time)</label>
                      <input
                        type="text"
                        value={getGameScheduleDraft(game).time}
                        onChange={(e) => updateScheduleDraft(game.id, 'time', e.target.value)}
                        placeholder="e.g. 09:00 PM"
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveGameSchedule(game.id)}
                    className="w-full py-1.5 rounded-lg bg-amber-400/90 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow"
                  >
                    <Check className="w-3 h-3" />
                    <span>💾 तारीख व समय सेव करें</span>
                  </button>
                </div>

                {/* Prizes Breakdown summary */}
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">Prizes Configured ({game.prizes?.length || 8}):</div>
                  <div className="flex flex-wrap gap-1">
                    {game.prizes?.slice(0, 4).map((prz) => (
                      <span key={prz.id} className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                        {prz.name}: <strong>₹{prz.amount}</strong>
                      </span>
                    ))}
                    {(game.prizes?.length || 0) > 4 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-amber-400">
                        +{(game.prizes?.length || 0) - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                {isLive ? (
                  <>
                    <button
                      onClick={() => onNavigateTab('live_control', game.id)}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>ENTER LIVE ROOM</span>
                    </button>
                    <button
                      onClick={onToggleAuto}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
                      title={game.autoCalling ? 'Pause Auto Call' : 'Resume Auto Call'}
                    >
                      {game.autoCalling ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </>
                ) : isUpcoming ? (
                  <>
                    <button
                      onClick={async () => {
                        const sold = game.soldTickets || 0;
                        if (sold < 100) {
                          const proceed = confirm(
                            `⚠️ नियम अलर्ट: गेम शुरू करने के लिए कम से कम 100 टिकट बिकना जरूरी है!\n\nवर्तमान में केवल ${sold}/100 टिकट बिके हैं।\n\nक्या आप अभी भी गेम को लाइव शुरू करना चाहते हैं?`
                          );
                          if (!proceed) return;
                        }
                        if (onUpdateGame) {
                          await onUpdateGame(game.id, { status: 'live' });
                          onNavigateTab('live_control', game.id);
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 transition-transform"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>START GAME NOW</span>
                    </button>
                    <button
                      onClick={() => handleCancelGame(game)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer"
                      title="Cancel Game"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center text-xs text-slate-500 font-bold py-1">
                    Game Concluded &amp; Verified
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Game */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">
                  {editingGame ? 'Edit Tambola Tournament' : 'Create New Tambola Game'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGame} className="space-y-4">
              {/* Master Game ON/OFF & Booking in Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Game Master Status</div>
                    <div className="text-[10px] text-slate-400">खेल चालू या बंद रखें</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGameEnabled(!isGameEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      isGameEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                        : 'bg-red-500/20 text-red-300 border-red-500/50'
                    }`}
                  >
                    {isGameEnabled ? '🟢 चालू (ON)' : '🔴 बंद (OFF)'}
                  </button>
                </div>

                <div className="flex items-center justify-between sm:border-l sm:border-slate-800 sm:pl-3">
                  <div>
                    <div className="text-xs font-bold text-white">Ticket Booking Status</div>
                    <div className="text-[10px] text-slate-400">टिकट बिक्री चालू या बंद रखें</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(!isBookingOpen)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      isBookingOpen
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {isBookingOpen ? '🎟️ चालू (OPEN)' : '🔒 बंद (CLOSED)'}
                  </button>
                </div>
              </div>

              {/* Row 1: Title & Timing */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Tournament Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="E.g. Sunday Super Bumper Jackpot"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Date</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    placeholder="Today / DD MMM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    placeholder="09:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Ticket Price (₹)</label>
                  <input
                    type="number"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    min={5}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-black focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Max Tkts/Player</label>
                  <input
                    type="number"
                    value={maxTicketsPerUser}
                    onChange={(e) => setMaxTicketsPerUser(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Ticket Color Theme Palette */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assigned Ticket Color Theme</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTicketColorTheme('multi')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      ticketColorTheme === 'multi'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🎲 Multi-Color (Random per ticket)
                  </button>
                  {COLOR_KEYS.map((ck) => {
                    const theme = TICKET_COLOR_PALETTES[ck];
                    return (
                      <button
                        key={ck}
                        type="button"
                        onClick={() => setTicketColorTheme(ck)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          ticketColorTheme === ck
                            ? 'bg-slate-800 text-white border-amber-400 shadow'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.previewHex }} />
                        <span>{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prize Pool Distribution */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prize Breakdown (Total Pool: ₹{(computedPrizePool || 0).toLocaleString('en-IN')})</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {prizes.map((prz, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-white text-[11px] truncate">{prz.name}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[10px]">₹</span>
                        <input
                          type="number"
                          value={prz.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPrizes((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, amount: val } : p))
                            );
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-amber-300 font-bold text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {loading ? 'Saving...' : editingGame ? 'Update Game' : 'Publish Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
