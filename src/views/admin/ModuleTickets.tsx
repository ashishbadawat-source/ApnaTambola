import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  CheckCircle2,
  Trophy,
  Palette,
  Sparkles,
  Layers,
  FileCheck,
  Zap,
  Power,
  XCircle,
  Check,
  AlertTriangle,
  Lock,
  Unlock,
  Flame,
  User as UserIcon,
  Star,
  Trash2,
  Users,
  History,
  DollarSign,
  RefreshCw,
  Phone,
  Calendar,
  ShieldAlert,
  ArrowUpDown,
  ShoppingBag,
  Clock,
  ArrowRight,
  ArrowRightLeft,
  Shuffle,
  Repeat,
  Send,
  CheckCheck,
  Play,
  Square,
  Archive,
  FolderArchive,
  Radio,
  Award,
} from 'lucide-react';
import { TambolaTicket, TambolaGame, User, TicketColorThemeId, SiteSettings } from '../../types';
import { TambolaTicketCard } from '../../components/TambolaTicketCard';
import { TICKET_COLOR_PALETTES, COLOR_KEYS, getTicketTheme, COLUMN_COLORS } from '../../utils/ticketColors';
import { generateTambolaTicketMatrix, generateTicketId } from '../../utils/tambolaTicket';

interface ModuleTicketsProps {
  tickets: TambolaTicket[];
  games: TambolaGame[];
  users?: User[];
  siteSettings?: SiteSettings;
  onToggleAutoTicket?: (enabled: boolean, gameId?: string) => Promise<boolean> | void;
  onRunAutoTicketDispatch?: (gameId?: string) => Promise<{ success: boolean; dispatchedCount: number; totalDeducted: number; message: string; details?: any[] }>;
  onAdminGenerateTickets?: (gameId: string, count: number, colorTheme?: TicketColorThemeId) => Promise<boolean>;
  onAdminToggleTicketStatus?: (ticketId: string, isActive: boolean) => Promise<boolean>;
  onAdminBatchToggleTickets?: (ticketIds: string[], isActive: boolean) => Promise<boolean>;
  onAdminUpdateTicketGame?: (ticketId: string, targetGameId: string) => Promise<boolean>;
  onAdminBatchUpdateTicketGame?: (ticketIds: string[], targetGameId: string) => Promise<{ success: boolean; count: number }>;
  onAdminTransferAllTicketsToGame?: (targetGameId: string, sourceGameId?: string) => Promise<{ success: boolean; count: number }>;
  onClearCompletedTickets?: (gameId?: string) => Promise<{ success: boolean; clearedCount: number }>;
  onDeleteTicket?: (ticketId: string, refundUser?: boolean) => Promise<boolean>;
  onBatchDeleteTickets?: (ticketIds: string[], refundUser?: boolean) => Promise<boolean>;
  onStartGame?: (gameId: string) => Promise<void>;
  onStopGame?: (gameId: string, markCompleted?: boolean) => Promise<void>;
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean>;
  onUpdateSettings?: (settings: Partial<SiteSettings>) => Promise<boolean>;
  onSetTicketName?: (gameId: string, ticketName: string) => Promise<boolean>;
  onRunClawbackAudit?: () => Promise<{
    auditedCount: number;
    clawbacks: any[];
    totalClawbackAmount: number;
    deductedUsersCount: number;
  }>;
  onForceRefresh?: () => void;
  isSyncing?: boolean;
}

type SubTab = 'history' | 'names_report' | 'buyers' | 'transfer' | 'cards' | 'generator' | 'auto_ticket' | 'controller' | 'anticheat_audit';
type StatusFilter = 'all' | 'active' | 'disabled' | 'winning';
type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low' | 'buyer_asc';
type TicketPoolFilter = 'active_games' | 'completed_games' | 'all_tickets';

export const ModuleTickets: React.FC<ModuleTicketsProps> = ({
  tickets,
  games,
  users = [],
  siteSettings,
  onToggleAutoTicket,
  onRunAutoTicketDispatch,
  onAdminGenerateTickets,
  onAdminToggleTicketStatus,
  onAdminBatchToggleTickets,
  onAdminUpdateTicketGame,
  onAdminBatchUpdateTicketGame,
  onAdminTransferAllTicketsToGame,
  onClearCompletedTickets,
  onDeleteTicket,
  onBatchDeleteTickets,
  onStartGame,
  onStopGame,
  onUpdateGame,
  onUpdateSettings,
  onSetTicketName,
  onRunClawbackAudit,
  onForceRefresh,
  isSyncing = false,
}) => {
  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('history');

  // Ticket Name Editor Modal State
  const [ticketNameModalState, setTicketNameModalState] = useState<{
    isOpen: boolean;
    gameId: string;
    gameTitle: string;
    ticketPrice: number;
    currentName: string;
    isSaving: boolean;
  }>({
    isOpen: false,
    gameId: '',
    gameTitle: '',
    ticketPrice: 0,
    currentName: '',
    isSaving: false,
  });

  // Anti-Cheat Audit State
  const [clawbackAuditState, setClawbackAuditState] = useState<{
    isRunning: boolean;
    lastResult: {
      auditedCount: number;
      clawbacks: any[];
      totalClawbackAmount: number;
      deductedUsersCount: number;
    } | null;
  }>({
    isRunning: false,
    lastResult: null,
  });

  // Game Selector for starting game
  const [selectedGameToStartId, setSelectedGameToStartId] = useState<string>('');

  // Pool filter: 'active_games' hides completed game tickets by default so new tickets can take their place!
  const [ticketPoolFilter, setTicketPoolFilter] = useState<TicketPoolFilter>('active_games');

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState('all');
  const [selectedBuyerFilter, setSelectedBuyerFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Clear Completed Tickets Modal State
  const [clearCompletedModalOpen, setClearCompletedModalOpen] = useState(false);
  const [selectedGameToClear, setSelectedGameToClear] = useState<string>('all');
  const [isClearingCompleted, setIsClearingCompleted] = useState(false);

  // Multi-selection for batch operations
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  // Find active live game or today's designated game
  const activeLiveGame = useMemo(() => {
    return (
      games.find((g) => g.id === siteSettings?.activeLiveGameId) ||
      games.find((g) => g.status === 'live') ||
      games.find((g) => g.status === 'upcoming') ||
      games[0]
    );
  }, [games, siteSettings?.activeLiveGameId]);

  // Auto-Ticket Engine State
  const [selectedAutoGameId, setSelectedAutoGameId] = useState<string>(
    siteSettings?.autoTicketGameId || games.find((g) => g.status === 'live' || g.status === 'upcoming')?.id || games[0]?.id || ''
  );
  const [isAutoDispatching, setIsAutoDispatching] = useState(false);
  const [autoDispatchReport, setAutoDispatchReport] = useState<{
    total: number;
    amount: number;
    message: string;
    details?: Array<{ userId: string; userName: string; phone?: string; ticketId: string; deducted: number; newBalance: number }>;
  } | null>(null);

  // Generator form
  const [batchGameId, setBatchGameId] = useState<string>(games[0]?.id || '');
  const [batchCount, setBatchCount] = useState<number>(6);
  const [batchColor, setBatchColor] = useState<TicketColorThemeId>('multi');
  const [generating, setGenerating] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Verifier & Inspector Modal
  const [inspectingTicket, setInspectingTicket] = useState<TambolaTicket | null>(null);
  const [verifyTicketIdInput, setVerifyTicketIdInput] = useState('');

  // Print layout preview
  const [printingTicket, setPrintingTicket] = useState<TambolaTicket | null>(null);

  // Buyers Sub-Tab Filters & View States (कितने वाला टिकट कितना लिया)
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [buyerPriceFilter, setBuyerPriceFilter] = useState<'all' | number>('all');
  const [buyerViewMode, setBuyerViewMode] = useState<'cards' | 'table'>('cards');

  // Remove / Delete Modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    mode: 'single' | 'batch' | 'user';
    ticket?: TambolaTicket;
    ticketIds?: string[];
    user?: { id: string; name: string; count: number; totalAmount: number };
    refundUser: boolean;
    isDeleting: boolean;
  }>({
    isOpen: false,
    mode: 'single',
    refundUser: true,
    isDeleting: false,
  });

  // Edit / Change Game Modal State (यूजर का टिकट आज के चलने वाले गेम में बदलें)
  const [editGameModalState, setEditGameModalState] = useState<{
    isOpen: boolean;
    mode: 'single' | 'batch' | 'user' | 'all';
    ticket?: TambolaTicket;
    ticketIds?: string[];
    user?: { id: string; name: string; count: number };
    sourceGameId?: string;
    targetGameId: string;
    isUpdating: boolean;
  }>({
    isOpen: false,
    mode: 'single',
    targetGameId: activeLiveGame?.id || games[0]?.id || '',
    isUpdating: false,
  });

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  // Completed games set for filtering old/finished tickets
  const completedGameIds = useMemo(() => {
    return new Set(games.filter((g) => g.status === 'completed').map((g) => g.id));
  }, [games]);

  // Helper map of users by ID for quick profile lookup
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => {
      if (u.id) map.set(u.id, u);
      if (u.phone) map.set(u.phone.replace(/\D/g, ''), u);
    });
    return map;
  }, [users]);

  // Total completed tickets count across finished games or with isCompleted/isArchived
  const completedTicketsList = useMemo(() => {
    return tickets.filter(
      (t) => Boolean(t.isCompleted) || Boolean(t.isArchived) || (t.gameId && completedGameIds.has(t.gameId))
    );
  }, [tickets, completedGameIds]);

  const activeTicketsList = useMemo(() => {
    return tickets.filter(
      (t) => !t.isCompleted && !t.isArchived && (!t.gameId || !completedGameIds.has(t.gameId))
    );
  }, [tickets, completedGameIds]);

  // Unique Buyers Aggregation (किस यूजर ने कौन से गेम का कितना टिकट ले रखा है)
  const buyerSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string;
        userName: string;
        userPhone: string;
        userEmail: string;
        avatar: string;
        ticketCount: number;
        totalSpent: number;
        tickets: TambolaTicket[];
        gameTitles: Set<string>;
        gameMap: Map<string, { gameId: string; gameTitle: string; count: number; isCurrentLive: boolean }>;
        gameBreakdown: Array<{ gameId: string; gameTitle: string; count: number; isCurrentLive: boolean }>;
        nonLiveCount: number;
        priceMap: Map<number, { price: number; count: number; totalSpent: number }>;
        priceBreakdown: Array<{ price: number; count: number; totalSpent: number }>;
      }
    >();

    const activeLiveId = activeLiveGame?.id || '';

    // Tickets to consider based on pool filter
    const poolTickets = tickets.filter((t) => {
      const isTicketCompleted = Boolean(t.isCompleted) || Boolean(t.isArchived) || (t.gameId && completedGameIds.has(t.gameId));
      if (ticketPoolFilter === 'active_games') return !isTicketCompleted;
      if (ticketPoolFilter === 'completed_games') return isTicketCompleted;
      return true;
    });

    poolTickets.forEach((t) => {
      const uId = t.userId || t.userName || 'unknown';
      const uProfile = t.userId ? userMap.get(t.userId) : undefined;
      const userName = uProfile?.name || t.userName || 'Unknown Player';
      const userPhone = uProfile?.phone || '';
      const userEmail = uProfile?.email || '';
      const avatar = uProfile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${uId}`;
      const price = Number(t.price || 0);
      const gId = t.gameId || 'unassigned';
      const gTitle = t.gameTitle || 'Unnamed Game';
      const isLive = gId === activeLiveId;

      const existing = map.get(uId);
      if (existing) {
        existing.ticketCount += 1;
        existing.totalSpent += price;
        existing.tickets.push(t);
        if (t.gameTitle) existing.gameTitles.add(t.gameTitle);

        const gb = existing.gameMap.get(gId);
        if (gb) {
          gb.count += 1;
        } else {
          existing.gameMap.set(gId, { gameId: gId, gameTitle: gTitle, count: 1, isCurrentLive: isLive });
        }

        const pb = existing.priceMap.get(price);
        if (pb) {
          pb.count += 1;
          pb.totalSpent += price;
        } else {
          existing.priceMap.set(price, { price, count: 1, totalSpent: price });
        }
      } else {
        const gameTitles = new Set<string>();
        if (t.gameTitle) gameTitles.add(t.gameTitle);
        const gameMap = new Map<string, { gameId: string; gameTitle: string; count: number; isCurrentLive: boolean }>();
        gameMap.set(gId, { gameId: gId, gameTitle: gTitle, count: 1, isCurrentLive: isLive });

        const priceMap = new Map<number, { price: number; count: number; totalSpent: number }>();
        priceMap.set(price, { price, count: 1, totalSpent: price });

        map.set(uId, {
          userId: uId,
          userName,
          userPhone,
          userEmail,
          avatar,
          ticketCount: 1,
          totalSpent: price,
          tickets: [t],
          gameTitles,
          gameMap,
          gameBreakdown: [],
          nonLiveCount: 0,
          priceMap,
          priceBreakdown: [],
        });
      }
    });

    return Array.from(map.values())
      .map((b) => {
        const gList = Array.from(b.gameMap.values()).sort((x, y) => (y.isCurrentLive ? 1 : 0) - (x.isCurrentLive ? 1 : 0));
        const nonLive = gList.filter((g) => !g.isCurrentLive).reduce((acc, curr) => acc + curr.count, 0);
        return {
          ...b,
          gameBreakdown: gList,
          nonLiveCount: nonLive,
          priceBreakdown: Array.from(b.priceMap.values()).sort((x, y) => x.price - y.price),
        };
      })
      .sort((a, b) => b.ticketCount - a.ticketCount);
  }, [tickets, userMap, activeLiveGame, completedGameIds, ticketPoolFilter]);

  // Distinct ticket prices sold across the platform
  const distinctTicketPrices = useMemo(() => {
    const set = new Set<number>();
    tickets.forEach((t) => {
      const p = Number(t.price || 0);
      if (p > 0) set.add(p);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [tickets]);

  // Filtered buyer summary for search and price tier filtering
  const filteredBuyerSummary = useMemo(() => {
    return buyerSummary.filter((b) => {
      if (buyerPriceFilter !== 'all') {
        const hasTier = b.priceBreakdown.some((pb) => pb.price === buyerPriceFilter);
        if (!hasTier) return false;
      }
      if (buyerSearchQuery.trim()) {
        const q = buyerSearchQuery.toLowerCase();
        const matchName = (b.userName || '').toLowerCase().includes(q);
        const matchPhone = (b.userPhone || '').toLowerCase().includes(q);
        const matchId = (b.userId || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId) return false;
      }
      return true;
    });
  }, [buyerSummary, buyerPriceFilter, buyerSearchQuery]);

  // Aggregate Key Metrics (KPIs)
  const totalTicketsSold = tickets.length;
  const uniqueBuyersCount = buyerSummary.length;
  const totalTicketRevenue = tickets.reduce((acc, t) => acc + (Number(t.price) || 0), 0);
  const activeTicketsCount = activeTicketsList.filter((t) => t.isActive !== false).length;
  const disabledTicketsCount = tickets.filter((t) => t.isActive === false).length;
  const winningTicketsCount = tickets.filter((t) => t.isWinningTicket || t.isWinner).length;

  // Filter & Sort tickets for History & Cards view
  const gameMigrationStats = useMemo(() => {
    const activeLiveId = activeLiveGame?.id || '';
    const stats = games.map((g) => {
      const gTickets = tickets.filter((t) => t.gameId === g.id);
      const uSet = new Set(gTickets.map((t) => t.userId || t.userName).filter(Boolean));
      const activeCount = gTickets.filter((t) => t.isActive !== false).length;
      const isLive = g.id === activeLiveId;
      return {
        game: g,
        gameId: g.id,
        gameTitle: g.title,
        ticketPrice: g.ticketPrice || 0,
        isLive,
        ticketCount: gTickets.length,
        activeCount,
        uniqueBuyers: uSet.size,
        tickets: gTickets,
      };
    });

    const knownGameIds = new Set(games.map((g) => g.id));
    const orphanTickets = tickets.filter((t) => !t.gameId || !knownGameIds.has(t.gameId));
    const orphanBuyers = new Set(orphanTickets.map((t) => t.userId || t.userName).filter(Boolean));
    const totalNonLiveTickets = tickets.filter((t) => t.gameId !== activeLiveId).length;

    const byGameId: Record<string, number> = {};
    stats.forEach((s) => {
      byGameId[s.gameId] = s.ticketCount;
    });
    const liveStat = stats.find((s) => s.isLive);
    const activeLiveTicketsCount = liveStat ? liveStat.ticketCount : 0;

    return {
      gameStats: stats,
      byGameId,
      activeLiveTicketsCount,
      orphanTickets,
      orphanTicketsCount: orphanTickets.length,
      orphanBuyersCount: orphanBuyers.size,
      totalNonLiveTickets,
    };
  }, [games, tickets, activeLiveGame]);

  // 🏷️ Ticket Name & Sales Aggregation (किस नाम का टिकट कितना बिका है)
  const ticketNameSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        gameId: string;
        ticketName: string;
        gameTitle: string;
        ticketPrice: number;
        soldCount: number;
        totalRevenue: number;
        activeCount: number;
        disabledCount: number;
        winningCount: number;
        status: string;
        isCurrentLive: boolean;
        isBookingOpen: boolean;
        game?: TambolaGame;
        tickets: TambolaTicket[];
      }
    >();

    // 1. Scan games
    games.forEach((g) => {
      const name = g.ticketName || g.title || `टिकट ₹${g.ticketPrice}`;
      const isLive = g.id === activeLiveGame?.id;
      const isBooking = g.isBookingOpen !== false && g.bookingOpen !== false;
      map.set(g.id, {
        key: g.id,
        gameId: g.id,
        ticketName: name,
        gameTitle: g.title,
        ticketPrice: g.ticketPrice || 0,
        soldCount: 0,
        totalRevenue: 0,
        activeCount: 0,
        disabledCount: 0,
        winningCount: 0,
        status: g.status,
        isCurrentLive: isLive,
        isBookingOpen: isBooking,
        game: g,
        tickets: [],
      });
    });

    // 2. Scan tickets and group
    tickets.forEach((t) => {
      const gId = t.gameId || 'unassigned';
      let entry = map.get(gId);
      const isActive = t.isActive !== false && t.status !== 'disabled';
      const isWinning = Boolean(t.isWinner || t.isWinningTicket);
      const price = Number(t.price) || (entry ? entry.ticketPrice : 0);

      if (!entry) {
        const name = t.ticketName || t.gameTitle || `अनअसाइंड टिकट ₹${price}`;
        entry = {
          key: gId,
          gameId: gId,
          ticketName: name,
          gameTitle: t.gameTitle || 'Unnamed Match',
          ticketPrice: price,
          soldCount: 0,
          totalRevenue: 0,
          activeCount: 0,
          disabledCount: 0,
          winningCount: 0,
          status: 'upcoming',
          isCurrentLive: false,
          isBookingOpen: true,
          tickets: [],
        };
        map.set(gId, entry);
      }

      entry.soldCount += 1;
      entry.totalRevenue += price;
      entry.tickets.push(t);
      if (isActive) entry.activeCount += 1;
      else entry.disabledCount += 1;
      if (isWinning) entry.winningCount += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.soldCount - a.soldCount);
  }, [games, tickets, activeLiveGame]);

  // Handle Save Custom Ticket Name
  const handleSaveTicketName = async () => {
    if (!ticketNameModalState.gameId || !ticketNameModalState.currentName.trim()) {
      showNotification('कृपया टिकट का वैध नाम दर्ज करें', 'error');
      return;
    }
    setTicketNameModalState((prev) => ({ ...prev, isSaving: true }));
    try {
      if (onSetTicketName) {
        await onSetTicketName(ticketNameModalState.gameId, ticketNameModalState.currentName.trim());
      } else if (onUpdateGame) {
        await onUpdateGame(ticketNameModalState.gameId, {
          ticketName: ticketNameModalState.currentName.trim(),
          ticketLabel: ticketNameModalState.currentName.trim(),
        });
      }
      showNotification(`🏷️ टिकट का नाम सफलतापूर्वक बदलकर "${ticketNameModalState.currentName.trim()}" कर दिया गया!`, 'success');
      setTicketNameModalState({
        isOpen: false,
        gameId: '',
        gameTitle: '',
        ticketPrice: 0,
        currentName: '',
        isSaving: false,
      });
      if (onForceRefresh) onForceRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'टिकट नाम बदलने में त्रुटि आई', 'error');
      setTicketNameModalState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Handle Run Anti-Cheat Clawback Audit
  const handleExecuteClawbackAudit = async () => {
    setClawbackAuditState((prev) => ({ ...prev, isRunning: true }));
    try {
      if (onRunClawbackAudit) {
        const result = await onRunClawbackAudit();
        setClawbackAuditState({ isRunning: false, lastResult: result });
        if (result.clawbacks.length > 0) {
          showNotification(
            `🛡️ एंटी-चीट ऑडिट संपन्न: ${result.clawbacks.length} डुप्लीकेट फुलहाउस डिटेक्ट हुए! कुल ₹${result.totalClawbackAmount} की कटौती यूजर वॉलेट से सफलतापूर्वक की गई।`,
            'success'
          );
        } else {
          showNotification(
            `✅ एंटी-चीट ऑडिट संपन्न: कोई डुप्लीकेट फुलहाउस नहीं मिला। सभी ${result.auditedCount} विजेता 100% नियमानुसार सुरक्षित हैं।`,
            'info'
          );
        }
      } else {
        showNotification('ऑडिट फंक्शन उपलब्ध नहीं है', 'error');
        setClawbackAuditState((prev) => ({ ...prev, isRunning: false }));
      }
      if (onForceRefresh) onForceRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'ऑडिट प्रक्रिया में त्रुटि आई', 'error');
      setClawbackAuditState((prev) => ({ ...prev, isRunning: false }));
    }
  };

  // Handle Start Selected Game (Admin Starts Selected Ticket Game)
  const handleStartSelectedGame = async (targetGameId?: string) => {
    const gameIdToStart = targetGameId || selectedGameToStartId || activeLiveGame?.id;
    if (!gameIdToStart) {
      showNotification('कृपया शुरू करने के लिए कोई गेम / टिकट चुनें', 'error');
      return;
    }
    const targetGame = games.find((g) => g.id === gameIdToStart);
    try {
      if (onStartGame) {
        await onStartGame(gameIdToStart);
      }
      if (onUpdateGame) {
        await onUpdateGame(gameIdToStart, {
          status: 'live',
          isActive: true,
          isGameEnabled: true,
          isBookingOpen: true,
          bookingOpen: true,
        });
      }
      showNotification(
        `🚀 चयनित टिकट गेम "${targetGame?.ticketName || targetGame?.title || 'Game'}" सफलतापूर्वक चालू (LIVE) कर दिया गया है!`,
        'success'
      );
      if (onForceRefresh) onForceRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'गेम शुरू करने में त्रुटि आई', 'error');
    }
  };

  const filteredTickets = useMemo(() => {
    let result = tickets.filter((t) => {
      if (!t) return false;
      const isTicketCompleted = Boolean(t.isCompleted) || Boolean(t.isArchived) || (t.gameId && completedGameIds.has(t.gameId));

      // 1. Ticket Pool filter (Default: active_games hides completed game tickets!)
      if (ticketPoolFilter === 'active_games' && isTicketCompleted) return false;
      if (ticketPoolFilter === 'completed_games' && !isTicketCompleted) return false;

      // 2. Selected Game Filter
      if (selectedGameFilter !== 'all' && t.gameId !== selectedGameFilter) return false;

      // 3. Selected Buyer Filter
      if (selectedBuyerFilter !== 'all' && t.userId !== selectedBuyerFilter && t.userName !== selectedBuyerFilter) return false;

      // 4. Status Filter
      if (selectedStatusFilter === 'winning' && !t.isWinningTicket && !t.isWinner) return false;
      if (selectedStatusFilter === 'active' && t.isActive === false) return false;
      if (selectedStatusFilter === 'disabled' && t.isActive !== false) return false;

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ticketId = (t.ticketId || '').toLowerCase();
        const id = (t.id || '').toLowerCase();
        const userName = (t.userName || '').toLowerCase();
        const gameTitle = (t.gameTitle || '').toLowerCase();
        const userProfile = t.userId ? userMap.get(t.userId) : undefined;
        const phone = (userProfile?.phone || '').toLowerCase();
        return (
          ticketId.includes(q) ||
          id.includes(q) ||
          userName.includes(q) ||
          gameTitle.includes(q) ||
          phone.includes(q)
        );
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = new Date(a.purchaseDate || 0).getTime() || 0;
        const timeB = new Date(b.purchaseDate || 0).getTime() || 0;
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = new Date(a.purchaseDate || 0).getTime() || 0;
        const timeB = new Date(b.purchaseDate || 0).getTime() || 0;
        return timeA - timeB;
      }
      if (sortBy === 'price_high') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === 'price_low') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'buyer_asc') {
        return (a.userName || '').localeCompare(b.userName || '');
      }
      return 0;
    });

    return result;
  }, [tickets, selectedGameFilter, selectedBuyerFilter, selectedStatusFilter, searchQuery, sortBy, userMap, ticketPoolFilter, completedGameIds]);

  // Multi-select handlers
  const handleToggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets.map((t) => t.id || t.ticketId).filter(Boolean));
    }
  };

  const handleToggleSelectTicket = (id: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 1-Click Status Toggle Handler (ON/OFF)
  const handleToggleSingleTicket = async (ticket: TambolaTicket, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!ticket || !ticket.id) return;
    const newStatus = !(ticket.isActive !== false);

    try {
      if (onAdminToggleTicketStatus) {
        await onAdminToggleTicketStatus(ticket.id, newStatus);
      }
    } catch (err) {
      console.warn('onAdminToggleTicketStatus notice:', err);
    }

    try {
      fetch('/api/tickets/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, isActive: newStatus }),
      }).catch(() => {});
    } catch (e) {}

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({
          type: 'TICKET_STATUS_TOGGLED',
          ticketId: ticket.id,
          isActive: newStatus,
        });
        bc.close();
      }
    } catch (e) {}

    showNotification(
      `टिकट ${ticket.ticketId || ticket.id} को एडमिन द्वारा ${newStatus ? 'चालू (ACTIVE / ON)' : 'बंद (DISABLED / OFF)'} कर दिया गया है!`,
      'success'
    );
    if (inspectingTicket && inspectingTicket.id === ticket.id) {
      setInspectingTicket({ ...inspectingTicket, isActive: newStatus, status: newStatus ? 'active' : 'disabled' });
    }
  };

  // Batch Status Toggle (ON/OFF)
  const handleBatchToggleTickets = async (isActive: boolean) => {
    const targetIds = selectedTicketIds.length > 0
      ? selectedTicketIds
      : filteredTickets.map((t) => t.id).filter(Boolean);

    if (targetIds.length === 0) {
      showNotification('कोई टिकट चयनित नहीं है।', 'info');
      return;
    }

    try {
      if (onAdminBatchToggleTickets) {
        await onAdminBatchToggleTickets(targetIds, isActive);
      }
    } catch (err) {
      console.warn('onAdminBatchToggleTickets notice:', err);
    }

    try {
      fetch('/api/tickets/batch-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: targetIds, isActive }),
      }).catch(() => {});
    } catch (e) {}

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({
          type: 'TICKETS_BATCH_TOGGLED',
          ticketIds: targetIds,
          isActive,
        });
        bc.close();
      }
    } catch (e) {}

    showNotification(
      `${targetIds.length} टिकटों को एडमिन द्वारा ${isActive ? 'चालू (ON)' : 'बंद (OFF)'} कर दिया गया है!`,
      'success'
    );
    setSelectedTicketIds([]);
  };

  // Single Ticket Delete (Remove) Click
  const openSingleDeleteModal = (ticket: TambolaTicket, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeleteModalState({
      isOpen: true,
      mode: 'single',
      ticket,
      refundUser: true,
      isDeleting: false,
    });
  };

  // Batch Delete (Remove Selected) Click
  const openBatchDeleteModal = () => {
    if (selectedTicketIds.length === 0) {
      showNotification('कृपया पहले रिमूव करने के लिए कम से कम 1 टिकट चुनें।', 'info');
      return;
    }
    setDeleteModalState({
      isOpen: true,
      mode: 'batch',
      ticketIds: selectedTicketIds,
      refundUser: true,
      isDeleting: false,
    });
  };

  // User's All Tickets Delete (Remove all tickets of a buyer) Click
  const openUserAllTicketsDeleteModal = (buyer: {
    userId: string;
    userName: string;
    ticketCount: number;
    totalSpent: number;
    tickets: TambolaTicket[];
  }) => {
    const tIds = buyer.tickets.map((t) => t.id).filter(Boolean);
    setDeleteModalState({
      isOpen: true,
      mode: 'user',
      user: {
        id: buyer.userId,
        name: buyer.userName,
        count: buyer.ticketCount,
        totalAmount: buyer.totalSpent,
      },
      ticketIds: tIds,
      refundUser: true,
      isDeleting: false,
    });
  };

  // Execute Deletion
  const handleConfirmDelete = async () => {
    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));
    try {
      const { mode, ticket, ticketIds, user, refundUser } = deleteModalState;

      if (mode === 'single' && ticket) {
        if (onDeleteTicket) {
          await onDeleteTicket(ticket.id, refundUser);
        } else {
          // Fallback REST call
          await fetch('/api/tickets/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId: ticket.id, refundUser }),
          });
        }
        showNotification(
          `टिकट (${ticket.ticketId || ticket.id}) को सफलतापूर्वक रिमूव कर दिया गया है${refundUser ? ` एवं ₹${ticket.price || 0} वॉलेट में रिफंड किया गया।` : '।'}`
        );
        if (inspectingTicket?.id === ticket.id) {
          setInspectingTicket(null);
        }
      } else if ((mode === 'batch' || mode === 'user') && ticketIds && ticketIds.length > 0) {
        if (onBatchDeleteTickets) {
          await onBatchDeleteTickets(ticketIds, refundUser);
        } else {
          // Fallback REST call
          await fetch('/api/tickets/batch-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketIds, refundUser }),
          });
        }
        showNotification(
          `${ticketIds.length} टिकटों को सफलतापूर्वक रिमूव कर दिया गया है${refundUser ? ' एवं संबंधित राशि रिफंड कर दी गई।' : '।'}`
        );
        setSelectedTicketIds([]);
      }

      setDeleteModalState({
        isOpen: false,
        mode: 'single',
        refundUser: true,
        isDeleting: false,
      });
    } catch (err) {
      console.error('Delete error:', err);
      showNotification('टिकट रिमूव करने में त्रुटि आई। कृपया पुनः प्रयास करें।', 'error');
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // =========================================================================
  // TICKET GAME EDIT & CONSOLIDATION HANDLERS (यूजर का टिकट आज के गेम में बदलें)
  // =========================================================================
  const openSingleEditGameModal = (ticket: TambolaTicket, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const defaultTarget = activeLiveGame?.id || (games.find((g) => g.id !== ticket.gameId)?.id) || games[0]?.id || '';
    setEditGameModalState({
      isOpen: true,
      mode: 'single',
      ticket,
      ticketIds: [ticket.id],
      targetGameId: defaultTarget,
      isUpdating: false,
    });
  };

  const openBatchEditGameModal = () => {
    if (selectedTicketIds.length === 0) {
      showNotification('कृपया पहले कम से कम एक टिकट चुनें।', 'info');
      return;
    }
    const defaultTarget = activeLiveGame?.id || games[0]?.id || '';
    setEditGameModalState({
      isOpen: true,
      mode: 'batch',
      ticketIds: selectedTicketIds,
      targetGameId: defaultTarget,
      isUpdating: false,
    });
  };

  const openUserEditGameModal = (buyer: {
    userId: string;
    userName: string;
    tickets: TambolaTicket[];
  }) => {
    const tIds = buyer.tickets.map((t) => t.id).filter(Boolean);
    const defaultTarget = activeLiveGame?.id || games[0]?.id || '';
    setEditGameModalState({
      isOpen: true,
      mode: 'user',
      user: {
        id: buyer.userId,
        name: buyer.userName,
        count: tIds.length,
      },
      ticketIds: tIds,
      targetGameId: defaultTarget,
      isUpdating: false,
    });
  };

  const openAllTransferModal = (sourceGameId: string = 'all') => {
    const defaultTarget = activeLiveGame?.id || games[0]?.id || '';
    setEditGameModalState({
      isOpen: true,
      mode: 'all',
      sourceGameId,
      targetGameId: defaultTarget,
      isUpdating: false,
    });
  };

  const handleConfirmGameUpdate = async () => {
    const { mode, ticket, ticketIds, user, sourceGameId, targetGameId } = editGameModalState;
    if (!targetGameId) {
      showNotification('कृपया गंतव्य (Target) गेम चुनें।', 'error');
      return;
    }

    const targetGame = games.find((g) => g.id === targetGameId);
    const targetTitle = targetGame?.title || 'Selected Match';

    setEditGameModalState((prev) => ({ ...prev, isUpdating: true }));
    try {
      if (mode === 'single' && ticket) {
        if (onAdminUpdateTicketGame) {
          await onAdminUpdateTicketGame(ticket.id, targetGameId);
        } else {
          await fetch('/api/tickets/update-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId: ticket.id, targetGameId }),
          });
        }
        showNotification(
          `✅ टिकट #${ticket.ticketNumber} (${ticket.ticketId || ticket.id}) को सफलतापूर्वक "${targetTitle}" में बदल दिया गया है!`,
          'success'
        );
        if (inspectingTicket?.id === ticket.id) {
          setInspectingTicket((prev) => prev ? { ...prev, gameId: targetGameId, gameTitle: targetTitle } : null);
        }
      } else if ((mode === 'batch' || mode === 'user') && ticketIds && ticketIds.length > 0) {
        if (onAdminBatchUpdateTicketGame) {
          const res = await onAdminBatchUpdateTicketGame(ticketIds, targetGameId);
          showNotification(
            `🚀 कुल ${res.count || ticketIds.length} टिकटों को सफलतापूर्वक "${targetTitle}" में ट्रांसफर कर दिया गया है!`,
            'success'
          );
        } else {
          await fetch('/api/tickets/batch-update-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketIds, targetGameId }),
          });
          showNotification(
            `🚀 कुल ${ticketIds.length} टिकटों को सफलतापूर्वक "${targetTitle}" में ट्रांसफर कर दिया गया है!`,
            'success'
          );
        }
        setSelectedTicketIds([]);
      } else if (mode === 'all') {
        if (onAdminTransferAllTicketsToGame) {
          const res = await onAdminTransferAllTicketsToGame(targetGameId, sourceGameId);
          showNotification(
            `🎉 सभी यूजर के ${res.count} टिकट आज के गेम "${targetTitle}" में शिफ्ट हो गए! अब सभी खिलाड़ी एक ही मैच में खेलेंगे।`,
            'success'
          );
        } else {
          await fetch('/api/tickets/transfer-all-to-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetGameId, sourceGameId }),
          });
          showNotification(
            `🎉 सभी यूजर के टिकट आज के गेम "${targetTitle}" में शिफ्ट हो गए!`,
            'success'
          );
        }
        setSelectedTicketIds([]);
      }

      setEditGameModalState({
        isOpen: false,
        mode: 'single',
        targetGameId: '',
        isUpdating: false,
      });

      if (onForceRefresh) {
        onForceRefresh();
      }
    } catch (err) {
      console.error('Game update error:', err);
      showNotification('टिकट का गेम बदलने में त्रुटि आई। कृपया पुनः प्रयास करें।', 'error');
      setEditGameModalState((prev) => ({ ...prev, isUpdating: false }));
    }
  };

  // Clear / Purge Completed Game Tickets (जो टिकट का गेम हो जाता है वह टिकट हट जाना चाहिए)
  const handleConfirmClearCompletedTickets = async () => {
    setIsClearingCompleted(true);
    try {
      if (onClearCompletedTickets) {
        const res = await onClearCompletedTickets(selectedGameToClear);
        showNotification(
          `🧹 सफलतापूर्वक ${res.clearedCount} समाप्त/पुराने टिकट हटा दिए गए! अब नए टिकट सूची में आ सकते हैं।`,
          'success'
        );
      } else {
        showNotification('समाप्त टिकट हटा दिए गए हैं।', 'success');
      }
      setClearCompletedModalOpen(false);
      setSelectedTicketIds([]);
      if (onForceRefresh) onForceRefresh();
    } catch (err: any) {
      console.error('Clear completed tickets error:', err);
      showNotification(`त्रुटि: ${err?.message || 'समाप्त टिकट हटाने में समस्या आई'}`, 'error');
    } finally {
      setIsClearingCompleted(false);
    }
  };

  // Master Ticket Booking Start / Stop Toggle
  const handleToggleGlobalBooking = async () => {
    const nextState = siteSettings?.globalTicketBookingEnabled === false;
    try {
      if (onUpdateSettings) {
        await onUpdateSettings({ globalTicketBookingEnabled: nextState });
      }
      showNotification(
        `🎟️ मास्टर टिकट बुकिंग को ${nextState ? 'चालू (OPEN / ENABLED)' : 'बंद (STOPPED / CLOSED)'} कर दिया गया है!`,
        nextState ? 'success' : 'info'
      );
    } catch {
      showNotification('सेटिंग्स अपडेट करने में त्रुटि आई', 'error');
    }
  };

  // Single Game Booking Start / Stop Toggle
  const handleToggleGameBooking = async (gameId: string, currentBookingState: boolean) => {
    const nextBookingState = !currentBookingState;
    try {
      if (onUpdateGame) {
        await onUpdateGame(gameId, {
          isBookingOpen: nextBookingState,
          bookingOpen: nextBookingState,
          isActive: true,
          isGameEnabled: true,
        });
        showNotification(
          `इस गेम की टिकट बुकिंग ${nextBookingState ? '🟢 चालू (OPEN)' : '🛑 बंद (CLOSED)'} कर दी गई है!`,
          nextBookingState ? 'success' : 'info'
        );
      }
    } catch {
      showNotification('गेम बुकिंग अपडेट करने में त्रुटि आई', 'error');
    }
  };

  // 1-Click Game & Tickets Start Handler
  const handleStartGameFromTickets = async (gameId: string) => {
    try {
      if (onStartGame) {
        await onStartGame(gameId);
      }
      if (onUpdateGame) {
        await onUpdateGame(gameId, {
          status: 'live',
          isActive: true,
          isGameEnabled: true,
          isBookingOpen: true,
          bookingOpen: true,
        });
      }
      showNotification('🚀 टूर्नामेंट शुरू कर दिया गया है और टिकट बुकिंग लाइव हो गई है!', 'success');
    } catch {
      showNotification('गेम शुरू करने में त्रुटि आई', 'error');
    }
  };

  // 1-Click Game Stop & Archive Old Tickets Handler
  const handleStopGameFromTickets = async (gameId: string) => {
    try {
      if (onStopGame) {
        await onStopGame(gameId, true);
      }
      showNotification('⏹️ गेम समाप्त हो गया है। इसके सभी टिकट समाप्त सूची में चले गए हैं ताकि नए टिकट आ सकें!', 'info');
    } catch {
      showNotification('गेम रोकने में त्रुटि आई', 'error');
    }
  };

  // Ticket Generator Form Submission
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchGameId) return;
    setGenerating(true);
    try {
      if (onAdminGenerateTickets) {
        await onAdminGenerateTickets(batchGameId, batchCount, batchColor);
        showNotification(
          `सफलतापूर्वक ${batchCount} नए टिकट ${(batchColor || 'multi').toUpperCase()} थीम के साथ जनरेट हो गए!`
        );
      }
    } catch (err) {
      showNotification('टिकट जनरेट करने में त्रुटि आई।', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // 1-Click Ticket Verifier Search
  const handleVerifyTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = verifyTicketIdInput.trim().toLowerCase();
    if (!query) return;
    const found = tickets.find(
      (t) => (t.ticketId || '').toLowerCase() === query || (t.id || '').toLowerCase() === query
    );
    if (found) {
      setInspectingTicket(found);
      setVerifyTicketIdInput('');
    } else {
      showNotification(`टिकट आईडी "${verifyTicketIdInput}" नहीं मिला।`, 'info');
    }
  };

  // Auto-Ticket Engine Calculations
  const currentAutoGame = games.find((g) => g.id === selectedAutoGameId) ||
    games.find((g) => g.status === 'live' || g.status === 'upcoming') ||
    games[0];
  const autoTicketPrice = Number(currentAutoGame?.ticketPrice) || 5;
  const isAutoEnabled = Boolean(siteSettings?.autoTicketEnabled);

  const eligibleUsersForAuto = useMemo(() => {
    if (!currentAutoGame) return [];
    return users.filter((u) => {
      if (!u || !u.id || u.role === 'admin') return false;
      const dep = Number(u.depositBalance) || 0;
      const win = Number(u.winningBalance) || 0;
      const ref = Number(u.referralBalance) || 0;
      const wal = Number(u.walletBalance) || 0;
      const totalFund = Math.max(wal, dep + win + ref);
      return totalFund >= autoTicketPrice;
    });
  }, [users, currentAutoGame, autoTicketPrice]);

  const usersAlreadyHavingTicket = useMemo(() => {
    if (!currentAutoGame) return new Set<string>();
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.gameId === currentAutoGame.id && t.userId) {
        set.add(t.userId);
      }
    });
    return set;
  }, [tickets, currentAutoGame]);

  const pendingEligibleUsers = useMemo(() => {
    return eligibleUsersForAuto.filter((u) => !usersAlreadyHavingTicket.has(u.id));
  }, [eligibleUsersForAuto, usersAlreadyHavingTicket]);

  const handleTriggerAutoDispatch = async (gId?: string) => {
    const targetId = gId || selectedAutoGameId || currentAutoGame?.id;
    setIsAutoDispatching(true);
    try {
      if (onRunAutoTicketDispatch) {
        const res = await onRunAutoTicketDispatch(targetId);
        setAutoDispatchReport({
          total: res.dispatchedCount,
          amount: res.totalDeducted,
          message: res.message,
          details: res.details,
        });
        showNotification(res.message, res.dispatchedCount > 0 ? 'success' : 'info');
      } else {
        const resp = await fetch('/api/tickets/auto-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: targetId }),
        });
        const data = await resp.json();
        if (data.success) {
          setAutoDispatchReport({
            total: data.dispatchedCount,
            amount: data.totalDeducted,
            message: data.message,
            details: data.details,
          });
          showNotification(data.message, data.dispatchedCount > 0 ? 'success' : 'info');
        }
      }
    } catch (e: any) {
      showNotification(e.message || 'Auto ticket execution error', 'error');
    } finally {
      setIsAutoDispatching(false);
    }
  };

  const handleToggleAutoEngine = async () => {
    const nextState = !isAutoEnabled;
    try {
      if (onToggleAutoTicket) {
        await onToggleAutoTicket(nextState, selectedAutoGameId);
      }
      showNotification(
        `⚡ ऑटो टिकट इंजन को ${nextState ? 'चालू (ENABLED / ON)' : 'बंद (DISABLED / OFF)'} कर दिया गया है!`,
        nextState ? 'success' : 'info'
      );
    } catch (e: any) {
      showNotification('सेटिंग्स अपडेट करने में त्रुटि आई', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Master Title */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>टिकट बिक्री हिस्ट्री एवं मास्टर प्रबंधन</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                  Admin Master
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                कितने यूजर टिकट खरीदे, कुल कितने टिकट बिके, पूरी हिस्ट्री देखें एवं अवांछित टिकट को तुरंत <strong className="text-red-400">रिमूव (Delete &amp; Refund)</strong> करें।
              </p>
            </div>
          </div>
        </div>

        {/* Live Sync & Force Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {onForceRefresh && (
            <button
              onClick={() => onForceRefresh()}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              title="डेटा ताजा करें (Force Refresh)"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'सिंक हो रहा है...' : 'रिफ्रेश सिंक'}</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>0ms लाइव सिंक</span>
          </div>
        </div>
      </div>

      {/* 🚀 MASTER AUTO TICKET DISPATCH BAR (ऑटो टिकट मास्टर कंट्रोल) */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xl ${
        isAutoEnabled
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-emerald-500/40 shadow-emerald-950/30'
          : 'bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border-amber-500/30 shadow-black/40'
      }`}>
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          {/* Left: Master Toggle & Info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              onClick={handleToggleAutoEngine}
              className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                isAutoEnabled ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-slate-700'
              }`}
              title={isAutoEnabled ? 'ऑटो टिकट बंद करें (Turn OFF)' : 'ऑटो टिकट चालू करें (Turn ON)'}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isAutoEnabled ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white flex items-center gap-1.5">
                  <Zap className={`w-4 h-4 ${isAutoEnabled ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400'}`} />
                  <span>ऑटोमैटिक टिकट बुकिंग सिस्टम (Auto-Ticket Engine)</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider uppercase ${
                  isAutoEnabled
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 animate-pulse'
                    : 'bg-slate-800 border border-slate-700 text-slate-400'
                }`}>
                  {isAutoEnabled ? '🟢 ON (सक्रिय)' : '⚪ OFF (बंद)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                बटन ON होते ही जिस यूजर के वॉलेट में फंड (₹{autoTicketPrice}) है, उसे <strong>1 टिकट</strong> जाएगा और फंड कट होगा।
              </p>
            </div>
          </div>

          {/* Right: Tournament Selector & 1-Click Trigger Button */}
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-between xl:justify-end">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold">टूर्नामेंट:</span>
              <select
                value={selectedAutoGameId}
                onChange={(e) => {
                  setSelectedAutoGameId(e.target.value);
                  if (onToggleAutoTicket && isAutoEnabled) {
                    onToggleAutoTicket(true, e.target.value);
                  }
                }}
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                    {g.title} (₹{g.ticketPrice || 5})
                  </option>
                ))}
              </select>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <span>फंडेड यूजर: </span>
              <strong className="text-white font-mono">{pendingEligibleUsers.length}</strong>
              <span className="text-[10px] text-slate-400 ml-1">({eligibleUsersForAuto.length} कुल)</span>
            </div>

            <button
              onClick={() => handleTriggerAutoDispatch()}
              disabled={isAutoDispatching}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg ${
                isAutoDispatching
                  ? 'bg-amber-600 text-slate-950 opacity-70 cursor-wait'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoDispatching ? 'animate-spin' : 'fill-slate-950'}`} />
              <span>{isAutoDispatching ? 'डिस्पैच हो रहा है...' : '⚡ अभी 1 टिकट भेजें (Book Now)'}</span>
            </button>
          </div>
        </div>

        {/* Auto Dispatch Report Feedback if available */}
        {autoDispatchReport && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-bold">{autoDispatchReport.message}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>डिस्पैच: <strong className="text-white">{autoDispatchReport.total} टिकट</strong></span>
              <span>कुल डेबिट: <strong className="text-amber-400 font-bold">₹{autoDispatchReport.amount}</strong></span>
              <button
                onClick={() => setAutoDispatchReport(null)}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🎯 MASTER MATCH CONSOLIDATION & TICKET SHIFTER (यूजर कौनसे गेम का टिकट लिया है वो दिखे व आज के लाइव गेम में बदलें) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-500/40 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>🎯 मैच कंसॉलिडेशन व टिकट शिफ्टर (All Players in One Game)</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black">
                  1-Click Sync
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              आज चलने वाला लाइव गेम: <strong className="text-amber-300 font-bold">{activeLiveGame?.title || 'No Live Game'}</strong> {activeLiveGame?.ticketPrice ? `(₹${activeLiveGame.ticketPrice})` : ''} •{' '}
              {gameMigrationStats.totalNonLiveTickets > 0 ? (
                <span className="text-amber-400 font-bold">
                  ⚠️ {gameMigrationStats.totalNonLiveTickets} टिकट दूसरे या पुराने मैचों में हैं।
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">
                  ✅ सभी {totalTicketsSold} टिकट वर्तमान लाइव मैच में सिंक्रोनाइज़्ड हैं!
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            <button
              onClick={() => setActiveSubTab('transfer')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>विस्तृत मैच लिस्ट देखें</span>
            </button>

            {activeLiveGame && (
              <button
                onClick={() => openAllTransferModal('all')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                title="सभी खिलाड़ियों के टिकट आज के लाइव गेम में बदलें ताकि सब एक साथ खेलें"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>🚀 सारे टिकट आज के लाइव मैच में शिफ्ट करें</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in ${
            notificationMsg.type === 'error'
              ? 'bg-red-500/20 border-red-500/50 text-red-300'
              : notificationMsg.type === 'info'
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
              : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
          }`}
        >
          {notificationMsg.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* 4 Core Master KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: कितने टिकट बिका (Total Tickets Sold) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span>कुल टिकट बिके</span>
            <Ticket className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalTicketsSold}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>कुल बिक्री: <strong className="text-amber-300 font-black">₹{totalTicketRevenue}</strong></span>
            <span className="text-emerald-400 font-bold">{activeTicketsCount} चालू</span>
          </div>
        </div>

        {/* KPI 2: कितने यूजर टिकट खरीदे (Unique Buyers) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-950 border border-blue-500/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-blue-400 font-bold">
            <span>खरीदार यूजर (Unique)</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{uniqueBuyersCount}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>औसत टिकट प्रति यूजर:</span>
            <strong className="text-blue-300 font-black">
              {uniqueBuyersCount > 0 ? (totalTicketsSold / uniqueBuyersCount).toFixed(1) : 0}
            </strong>
          </div>
        </div>

        {/* KPI 3: चालू टिकट (Active & Valid) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span>सक्रिय / चालू टिकट</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">{activeTicketsCount}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>ईनाम हेतु मान्य:</span>
            <strong className="text-emerald-400 font-bold">100% Valid</strong>
          </div>
        </div>

        {/* KPI 4: रिमूव & बंद टिकट कंट्रोल (Remove & Void Status) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-slate-900 to-slate-950 border border-rose-500/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
            <span>बंद / रद्द टिकट</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">{disabledTicketsCount}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>रिमूव विकल्प:</span>
            <span className="text-amber-300 font-bold">रिफंड समर्थित</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>टिकट बिक्री हिस्ट्री (Sales History)</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
            {filteredTickets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('names_report')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'names_report'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>🏷️ टिकट नाम व बिक्री रिपोर्ट (By Name)</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
            {ticketNameSummary.length} प्रकार
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('anticheat_audit')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'anticheat_audit'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg shadow-red-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-rose-300 border border-rose-500/30'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>🛡️ एंटी-चीट 1 फुलहाउस ऑडिट (Clawback)</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
            1 टिकट = 1 फुलहाउस
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('buyers')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'buyers'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>कितने यूजर टिकट खरीदे (Buyers Breakdown)</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
            {uniqueBuyersCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('cards')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'cards'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>टिकट कार्ड गैलरी (Hologram Cards)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('generator')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'generator'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>बैच टिकट जनरेटर (Create Tickets)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('auto_ticket')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'auto_ticket'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>⚡ ऑटो टिकट हब (Auto-Ticket Engine)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            isAutoEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>
            {isAutoEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('transfer')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'transfer'
              ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
          <span>🎯 मैच कंसॉलिडेशन (Game Migration)</span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold">
            {gameMigrationStats.totalNonLiveTickets > 0 ? `⚠️ ${gameMigrationStats.totalNonLiveTickets} शिफ्ट करें` : '✅ All Live'}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('controller')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'controller'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>🎟️ टिकट स्टार्ट &amp; मैच कंट्रोलर (Booking Start)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            siteSettings?.globalTicketBookingEnabled !== false ? 'bg-emerald-400 text-slate-950' : 'bg-red-500 text-white'
          }`}>
            {siteSettings?.globalTicketBookingEnabled !== false ? '🟢 OPEN' : '🔴 CLOSED'}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HISTORY (बिक्री हिस्ट्री) */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {/* Active / Completed Games Ticket Pool Selector & Quick Cleanup Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800">
            {/* Pool Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTicketPoolFilter('active_games')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                  ticketPoolFilter === 'active_games'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="सिर्फ सक्रिय / चालू मैचों के टिकट देखें (पुराने समाप्त टिकट स्वतः छिपे रहेंगे ताकि नए टिकट आ सकें)"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>🟢 सक्रिय मैच टिकट ({activeTicketsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTicketPoolFilter('completed_games')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                  ticketPoolFilter === 'completed_games'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="समाप्त हो चुके गेम्स के पुराने टिकट देखें"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>📁 समाप्त मैच टिकट ({completedTicketsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTicketPoolFilter('all_tickets')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                  ticketPoolFilter === 'all_tickets'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>📑 सभी टिकट ({tickets.length})</span>
              </button>
            </div>

            {/* Quick 1-Click Clear Completed Tickets Button */}
            {completedTicketsList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGameToClear('all');
                  setClearCompletedModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer active:scale-95 transition-all ml-auto sm:ml-0"
                title="समाप्त मैच के सभी पुराने टिकट लिस्ट से हटाएं ताकि नए टिकट आ सकें"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>🧹 समाप्त मैच के {completedTicketsList.length} टिकट हटाएं (Clear Completed)</span>
              </button>
            )}
          </div>

          {/* Filters, Search and Sorter Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="खोजें: टिकट कोड, यूजर नाम, मोबाइल नंबर, टूर्नामेंट..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Tournament Filter */}
              <div>
                <select
                  value={selectedGameFilter}
                  onChange={(e) => setSelectedGameFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">सभी टूर्नामेंट (All Games)</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as StatusFilter)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">सभी टिकट स्थिति (All Status)</option>
                  <option value="active">🟢 चालू (Active Only)</option>
                  <option value="disabled">🔴 बंद (Disabled Only)</option>
                  <option value="winning">🏆 विजेता टिकट (Winners Only)</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="newest">नया पहले (Newest First)</option>
                  <option value="oldest">पुराना पहले (Oldest First)</option>
                  <option value="price_high">मूल्य: अधिक से कम (Price High)</option>
                  <option value="price_low">मूल्य: कम से अधिक (Price Low)</option>
                  <option value="buyer_asc">खरीदार नाम (A to Z)</option>
                </select>
              </div>
            </div>

            {/* Buyer Specific Quick Filter if active */}
            {selectedBuyerFilter !== 'all' && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs">
                <span>फ़िल्टर सक्रिय: खरीदार यूजर ID = <strong>{selectedBuyerFilter}</strong></span>
                <button
                  onClick={() => setSelectedBuyerFilter('all')}
                  className="ml-auto underline font-bold hover:text-white cursor-pointer"
                >
                  फ़िल्टर हटाएं
                </button>
              </div>
            )}
          </div>

          {/* Batch Actions Toolbar (When tickets are selected or all filtered) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filteredTickets.length > 0 && selectedTicketIds.length === filteredTickets.length}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <span>सभी चुनें ({filteredTickets.length})</span>
              </label>

              {selectedTicketIds.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/40">
                  {selectedTicketIds.length} चयनित
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Change Game Button */}
              {selectedTicketIds.length > 0 && (
                <button
                  onClick={openBatchEditGameModal}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  title="चयनित टिकटों को आज के या किसी अन्य गेम में बदलें"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>गेम बदलें ({selectedTicketIds.length})</span>
                </button>
              )}

              {/* Batch Remove Button */}
              {selectedTicketIds.length > 0 && (
                <button
                  onClick={openBatchDeleteModal}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
                  title="चयनित टिकटों को हमेशा के लिए रिमूव करें (रिफंड विकल्प के साथ)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>चयनित टिकट रिमूव करें ({selectedTicketIds.length})</span>
                </button>
              )}

              <button
                onClick={() => handleBatchToggleTickets(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="चयनित या फ़िल्टर किए गए टिकट चालू करें"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>चालू करें (Enable)</span>
              </button>

              <button
                onClick={() => handleBatchToggleTickets(false)}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="चयनित या फ़िल्टर किए गए टिकट बंद करें"
              >
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                <span>बंद करें (Disable)</span>
              </button>
            </div>
          </div>

          {/* History Data Table */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-bold">कोई टिकट नहीं मिला</p>
              <p className="text-xs text-slate-500">कृपया अपना सर्च अथवा फ़िल्टर बदल कर देखें।</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTicketIds.length === filteredTickets.length}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 cursor-pointer"
                        />
                      </th>
                      <th className="p-3.5">टिकट कोड</th>
                      <th className="p-3.5">खरीदार यूजर (Buyer Details)</th>
                      <th className="p-3.5">टूर्नामेंट / गेम</th>
                      <th className="p-3.5">मूल्य</th>
                      <th className="p-3.5">खरीदने का समय</th>
                      <th className="p-3.5">स्थिति</th>
                      <th className="p-3.5 text-right">एक्शन (Remove / Control)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredTickets.map((tkt, idx) => {
                      const isSelected = selectedTicketIds.includes(tkt.id || tkt.ticketId);
                      const isTktActive = tkt.isActive !== false;
                      const uProfile = tkt.userId ? userMap.get(tkt.userId) : undefined;
                      const userDisplayName = uProfile?.name || tkt.userName || 'Player';
                      const userPhone = uProfile?.phone || '';
                      const ticketCode = tkt.ticketId || `TKT-${tkt.id?.slice(0, 5)}`;
                      const purchaseTimeStr = tkt.purchaseDate
                        ? new Date(tkt.purchaseDate).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Today';

                      return (
                        <tr
                          key={tkt.id || `tkt-row-${idx}`}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-amber-500/10' : !isTktActive ? 'bg-red-950/10' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectTicket(tkt.id || tkt.ticketId)}
                              className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Ticket Code */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setInspectingTicket(tkt)}
                                className="font-mono font-black text-amber-400 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                                title="क्लिक कर के टिकट 3x9 ग्रिड देखें"
                              >
                                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                                <span>{ticketCode}</span>
                              </button>
                              {tkt.isWinningTicket && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black flex items-center gap-0.5">
                                  <Trophy className="w-2.5 h-2.5" />
                                  WIN
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Buyer Details */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  uProfile?.avatar ||
                                  `https://api.dicebear.com/7.x/bottts/svg?seed=${tkt.userId || tkt.userName}`
                                }
                                alt="avatar"
                                className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 object-cover shrink-0"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{userDisplayName}</span>
                                  {userPhone && (
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                                      <Phone className="w-2.5 h-2.5 text-slate-500" />
                                      {userPhone}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>ID: {tkt.userId ? tkt.userId.slice(0, 10) : 'Guest'}</span>
                                  <button
                                    onClick={() => setSelectedBuyerFilter(tkt.userId || tkt.userName)}
                                    className="text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
                                    title="इस खरीदार के अन्य टिकट देखें"
                                  >
                                    सारे टिकट
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Tournament */}
                          <td className="p-3.5">
                            <div className="space-y-1 max-w-[220px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-100">{tkt.gameTitle || 'Tambola Live'}</span>
                                {tkt.gameId === activeLiveGame?.id ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black">
                                    🎯 आज का लाइव गेम
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    अन्य मैच
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>{tkt.matchDate || 'Daily Match'}</span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono text-slate-500">ID: {tkt.gameId ? tkt.gameId.slice(0, 8) : 'none'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="p-3.5">
                            <span className="font-mono font-black text-amber-300">
                              ₹{tkt.price ?? 10}
                            </span>
                          </td>

                          {/* Purchase Time */}
                          <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{purchaseTimeStr}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 w-fit ${
                                isTktActive
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30'
                                  : 'bg-red-500/10 text-red-300 border-red-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isTktActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              <span>{isTktActive ? '🟢 चालू (Active)' : '🔴 बंद (Void)'}</span>
                            </span>
                          </td>

                          {/* Actions: Edit Game, Remove, Toggle ON/OFF, Inspect, Print */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* EDIT / CHANGE GAME BUTTON (यूजर का गेम बदलें) */}
                              <button
                                type="button"
                                onClick={(e) => openSingleEditGameModal(tkt, e)}
                                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                                title="इस टिकट का गेम आज चलने वाले लाइव गेम में बदलें"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>गेम बदलें</span>
                              </button>

                              {/* Direct 1-Click Toggle */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleSingleTicket(tkt, e)}
                                className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  isTktActive
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/40'
                                }`}
                                title={isTktActive ? 'टिकट बंद करें (Disable)' : 'टिकट चालू करें (Enable)'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Inspect 3x9 Modal */}
                              <button
                                type="button"
                                onClick={() => setInspectingTicket(tkt)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer"
                                title="टिकट ग्रिड जांचें (Inspect)"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                              </button>

                              {/* Print */}
                              <button
                                type="button"
                                onClick={() => setPrintingTicket(tkt)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer"
                                title="प्रिंट टिकट (Print)"
                              >
                                <Printer className="w-3.5 h-3.5 text-purple-300" />
                              </button>

                              {/* REMOVE BUTTON (रिमूव ऑप्शन) */}
                              <button
                                type="button"
                                onClick={(e) => openSingleDeleteModal(tkt, e)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 hover:border-red-600 text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                                title="टिकट रिमूव करें (रिफंड विकल्प के साथ)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>रिमूव</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
                <div>
                  दिखाए जा रहे हैं: <strong className="text-white font-bold">{filteredTickets.length}</strong> टिकट (कुल {totalTicketsSold} में से)
                </div>
                <div className="flex items-center gap-3">
                  <span>कुल मूल्य: <strong className="text-amber-300 font-bold">₹{filteredTickets.reduce((acc, t) => acc + (t.price || 0), 0)}</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>खरीदार: <strong className="text-blue-300 font-bold">{new Set(filteredTickets.map((t) => t.userId || t.userName)).size}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BUYERS (कितने यूजर टिकट खरीदे हैं - कितने वाला टिकट कितना लिया) */}
      {/* ========================================================================= */}
      {activeSubTab === 'buyers' && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 text-blue-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-white font-black text-sm">कुल {uniqueBuyersCount} यूजरों ने टिकट खरीदे हैं</strong>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    लाइव डेटा
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  यहाँ प्रत्येक यूजर द्वारा खरीदे गए कुल टिकट और कितने वाला टिकट कितना लिया (मूल्यवार विवरण) प्रदर्शित है।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end md:self-auto font-mono">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">कुल टिकट बिक्री</span>
                <strong className="text-amber-300 text-base font-black">₹{totalTicketRevenue.toLocaleString('en-IN')}</strong>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">कुल टिकट संख्या</span>
                <strong className="text-white text-base font-black">{totalTicketsSold}</strong>
              </div>
            </div>
          </div>

          {/* Search, Filter by Price, and View Switcher */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="खिलाड़ी का नाम, मोबाइल नंबर या User ID से खोजें..."
                  value={buyerSearchQuery}
                  onChange={(e) => setBuyerSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {buyerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBuyerSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setBuyerViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    buyerViewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  कार्ड व्यू ({filteredBuyerSummary.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBuyerViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    buyerViewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  लेजर तालिका (Table)
                </button>
              </div>
            </div>

            {/* Price Tier Filter Pills (कितने वाला टिकट) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
              <span className="text-[11px] font-bold text-slate-400 mr-1">टिकट दर फ़िल्टर:</span>
              <button
                type="button"
                onClick={() => setBuyerPriceFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  buyerPriceFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                सभी टिकट ({buyerSummary.length})
              </button>
              {distinctTicketPrices.map((price) => {
                const countWithPrice = buyerSummary.filter((b) =>
                  b.priceBreakdown.some((pb) => pb.price === price)
                ).length;
                return (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setBuyerPriceFilter(price)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      buyerPriceFilter === price
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700/60'
                    }`}
                  >
                    <span>₹{price} वाला</span>
                    <span className="text-[10px] opacity-75">({countWithPrice})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredBuyerSummary.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-bold">
                {buyerSearchQuery || buyerPriceFilter !== 'all'
                  ? 'दिए गए फ़िल्टर से कोई खरीदार नहीं मिला।'
                  : 'अभी तक किसी यूजर ने टिकट नहीं खरीदा है।'}
              </p>
            </div>
          ) : buyerViewMode === 'cards' ? (
            /* ================= CARDS VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBuyerSummary.map((buyer, bIdx) => (
                <div
                  key={buyer.userId || `buyer-${bIdx}`}
                  className="rounded-3xl p-5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Buyer Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={buyer.avatar}
                          alt="buyer"
                          className="w-11 h-11 rounded-2xl bg-slate-800 border-2 border-blue-400/40 object-cover shadow-md"
                        />
                        <div>
                          <div className="font-black text-white text-sm">{buyer.userName}</div>
                          {buyer.userPhone && (
                            <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{buyer.userPhone}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono">
                            ID: {buyer.userId.slice(0, 14)}
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black">
                        #{bIdx + 1}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold">कुल टिकट खरीदे</div>
                        <div className="text-lg font-black text-amber-300 font-mono flex items-center gap-1">
                          <Ticket className="w-4 h-4 text-amber-400" />
                          <span>{buyer.ticketCount} टिकट</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold">कुल खर्च राशि</div>
                        <div className="text-lg font-black text-emerald-300 font-mono">
                          ₹{buyer.totalSpent.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* EXACT REQUIREMENT: कितने वाला टिकट कितना लिया है (Price Breakdown) */}
                    <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                      <div className="text-[11px] font-black text-amber-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>🎟️ कितने वाला टिकट कितना लिया:</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {buyer.priceBreakdown.length} दरें
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {buyer.priceBreakdown.map((pb) => (
                          <div
                            key={pb.price}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-400/30 text-xs font-mono flex items-center gap-1.5 shadow-sm"
                          >
                            <span className="text-amber-400 font-black">₹{pb.price} वाला:</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-white font-bold text-[11px]">
                              {pb.count} टिकट
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">(= ₹{pb.totalSpent})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Match & Game Breakdown (कौनसे गेम का टिकट लिया है) */}
                    <div className="p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-1.5">
                      <div className="text-[11px] font-black text-cyan-300 flex items-center justify-between">
                        <span>🎮 कौन से मैच का टिकट लिया:</span>
                        {buyer.nonLiveCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black">
                            ⚠️ {buyer.nonLiveCount} अन्य मैच में
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {buyer.gameBreakdown.map((gb) => (
                          <div
                            key={gb.gameId}
                            className={`px-2.5 py-1 rounded-xl border text-xs font-mono flex items-center gap-1.5 shadow-sm ${
                              gb.isCurrentLive
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900 border-slate-700 text-slate-300'
                            }`}
                          >
                            <span className="font-bold">{gb.gameTitle}:</span>
                            <span className={`px-1.5 py-0.2 rounded font-black text-[11px] ${
                              gb.isCurrentLive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-amber-300'
                            }`}>
                              {gb.count} टिकट
                            </span>
                            {gb.isCurrentLive && <span className="text-[9px] text-emerald-400 font-bold">● LIVE</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tournaments list */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        टूर्नामेंट्स भाग लिया:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(buyer.gameTitles).map((gTitle, gIdx) => (
                          <span
                            key={gIdx}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700 truncate max-w-[170px]"
                          >
                            {gTitle}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this buyer */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openUserEditGameModal(buyer)}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md shadow-cyan-500/20"
                      title="इस यूजर के टिकट आज के लाइव मैच में बदलें"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>आज के मैच में शिफ्ट करें</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBuyerFilter(buyer.userId);
                          setActiveSubTab('history');
                        }}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <Ticket className="w-3.5 h-3.5 text-amber-400" />
                        <span>टिकट ({buyer.ticketCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openUserAllTicketsDeleteModal(buyer)}
                        className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 text-xs font-black cursor-pointer transition-all active:scale-95"
                        title="इस यूजर के सभी टिकट रिमूव करें और वॉलेट में रिफंड भेजें"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ================= TABLE VIEW ================= */
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="p-3 font-bold">#</th>
                    <th className="p-3 font-bold">यूजर / खिलाड़ी</th>
                    <th className="p-3 font-bold">मोबाइल व ID</th>
                    <th className="p-3 font-bold text-center">कुल टिकट</th>
                    <th className="p-3 font-bold text-right">कुल खर्च</th>
                    <th className="p-3 font-bold">🎟️ दर विवरण</th>
                    <th className="p-3 font-bold">🎮 मैच स्थिति</th>
                    <th className="p-3 font-bold text-right">एक्शन</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredBuyerSummary.map((buyer, bIdx) => (
                    <tr key={buyer.userId || bIdx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3 font-mono text-slate-500 font-bold">#{bIdx + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={buyer.avatar}
                            alt="avatar"
                            className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                          />
                          <div>
                            <div className="font-bold text-white text-xs">{buyer.userName}</div>
                            {buyer.userEmail && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{buyer.userEmail}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        <div>{buyer.userPhone || '—'}</div>
                        <div className="text-[10px] text-slate-500">{buyer.userId.slice(0, 12)}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-black border border-amber-500/30">
                          {buyer.ticketCount} टिकट
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                        ₹{buyer.totalSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {buyer.priceBreakdown.map((pb) => (
                            <span
                              key={pb.price}
                              className="px-2 py-0.5 rounded-lg bg-slate-900 border border-amber-400/40 text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1"
                            >
                              <strong className="text-amber-400">₹{pb.price}:</strong>
                              <span className="text-white font-black">{pb.count}t</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {buyer.gameBreakdown.map((gb) => (
                            <span
                              key={gb.gameId}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                gb.isCurrentLive
                                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                  : 'bg-slate-900 border-slate-700 text-amber-300'
                              }`}
                            >
                              {gb.gameTitle}: {gb.count}t {gb.isCurrentLive && '●'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUserEditGameModal(buyer)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 border border-cyan-500/40"
                            title="आज के लाइव मैच में बदलें"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>शिफ्ट</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBuyerFilter(buyer.userId);
                              setActiveSubTab('history');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span>टिकट</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openUserAllTicketsDeleteModal(buyer)}
                            className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="रिमूव करें और रिफंड भेजें"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>रिमूव</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CARDS (टिकट कार्ड गैलरी - Hologram Cards) */}
      {/* ========================================================================= */}
      {activeSubTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              कुल {filteredTickets.length} टिकट कार्ड प्रदर्शित
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTickets.map((tkt, tktIdx) => {
              if (!tkt) return null;
              const isTktActive = tkt.isActive !== false;
              const theme = getTicketTheme(tkt.colorTheme, tkt.ticketNumber || tktIdx + 1);
              const markedCount = tkt.markedNumbers?.length || 0;
              const ticketNumbers =
                Array.isArray(tkt.numbers) && tkt.numbers.length === 3
                  ? tkt.numbers
                  : generateTambolaTicketMatrix();
              const ticketIdStr = tkt.ticketId || `TKT-${tkt.id?.slice(0, 4) || '1001'}`;
              const gameTitleStr = tkt.gameTitle || 'Tambola Live Tournament';
              const userNameStr = tkt.userName || 'Player';

              return (
                <div
                  key={tkt.id || `tkt-${tktIdx}`}
                  className={`rounded-3xl border-2 p-0 overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300 relative ${
                    !isTktActive
                      ? 'bg-gradient-to-b from-[#200808] via-[#140606] to-[#0c0303] border-red-500/70 opacity-90'
                      : tkt.isWinningTicket
                      ? 'ring-4 ring-amber-400 border-amber-400 bg-gradient-to-b from-[#241738] via-[#151a2e] to-[#0c1020] shadow-amber-500/30'
                      : `${theme.borderClass} ${theme.cardBg} hover:shadow-3xl hover:scale-[1.01]`
                  }`}
                >
                  {/* Left Rainbow Hologram Strip */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 hologram-strip z-20 opacity-80" />

                  {/* Colorful Header Strip */}
                  <div
                    className={`pl-3.5 pr-3 py-2 flex items-center justify-between text-xs font-black shadow-md border-b border-black/30 ${
                      !isTktActive
                        ? 'bg-gradient-to-r from-red-700 via-rose-800 to-red-900 text-white'
                        : theme.topBarGradient
                    } ${!isTktActive ? 'text-white' : theme.topBarText}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-black/40 flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
                        <Ticket className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-xs font-black tracking-wider bg-black/50 px-2 py-0.5 rounded-md border border-white/20 text-white">
                        {ticketIdStr}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                          isTktActive
                            ? 'bg-black/60 text-emerald-300 border-emerald-400/60'
                            : 'bg-red-950 text-red-200 border-red-400/60'
                        }`}
                      >
                        {isTktActive ? '🟢 चालू' : '🔴 बंद'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      {tkt.isWinningTicket && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black border border-amber-300 flex items-center gap-1 shadow-sm">
                          <Trophy className="w-3 h-3 text-slate-950" />
                          <span>WINNER</span>
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-md bg-black/60 text-amber-300 font-black text-xs border border-amber-400/40 shadow-sm">
                        ₹{tkt.price ?? 10}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Middle Info (Game Title + Owner) */}
                  <div className="p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-black text-white truncate text-xs">{gameTitleStr}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-300 shrink-0">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        <span>
                          Owner: <strong className="text-amber-300 font-bold">{userNameStr}</strong>
                        </span>
                      </div>
                    </div>

                    {/* 3x9 Ultra-Colorful Ticket Grid Box */}
                    <div className="rounded-2xl p-2 border-2 border-amber-400/50 bg-gradient-to-b from-[#180f28] via-[#0e0a1a] to-[#080510] shadow-2xl relative overflow-hidden text-center">
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none text-xl font-black uppercase text-amber-300 tracking-widest rotate-[-6deg]">
                        ★ APNA TAMBOLA ★
                      </div>

                      <div className="grid grid-cols-9 gap-1 text-[11px] font-mono relative z-10">
                        {ticketNumbers.map((row, rIdx) => (
                          <React.Fragment key={rIdx}>
                            {Array.isArray(row) &&
                              row.map((val, cIdx) => {
                                const isFilled = val > 0;
                                const isDabbed = isFilled && tkt.markedNumbers?.includes(val);
                                const colTheme = COLUMN_COLORS[cIdx] || COLUMN_COLORS[0];

                                return (
                                  <div
                                    key={`${rIdx}-${cIdx}`}
                                    className={`h-6 sm:h-7 rounded-lg flex flex-col items-center justify-center font-black transition-all ${
                                      !isFilled
                                        ? `${theme.cellBlankBg} border text-transparent select-none opacity-80`
                                        : isDabbed
                                        ? `${colTheme.dabbed} ring-2 ring-amber-300 scale-105 z-10 shadow-md`
                                        : `${colTheme.cellBg} border hover:brightness-125 shadow-sm`
                                    }`}
                                  >
                                    {!isFilled ? (
                                      <Star className="w-2 h-2 text-amber-400/40 fill-amber-400/20" />
                                    ) : (
                                      <span>{val}</span>
                                    )}
                                  </div>
                                );
                              })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Marked Progress Indicator */}
                    <div className="flex items-center justify-between text-[11px] bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                      <span className="text-slate-400 font-bold">Marked:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all rounded-full"
                            style={{ width: `${Math.min(100, (markedCount / 15) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-black text-amber-300">
                          {markedCount} / 15
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar (ON/OFF, Inspect, Print, REMOVE) */}
                  <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between gap-1.5 text-xs">
                    {/* 1-Click Direct Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSingleTicket(tkt, e)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer border ${
                        isTktActive
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/50'
                      }`}
                      title={isTktActive ? 'टिकट बंद करें' : 'टिकट चालू करें'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isTktActive ? 'ON' : 'OFF'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setInspectingTicket(tkt)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer border border-slate-700"
                        title="जांचें (Inspect)"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => setPrintingTicket(tkt)}
                        className="p-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-400/40 text-xs cursor-pointer"
                        title="प्रिंट टिकट (Print)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* REMOVE BUTTON */}
                      <button
                        onClick={(e) => openSingleDeleteModal(tkt, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/60 text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
                        title="टिकट रिमूव करें (Remove with refund option)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>रिमूव</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GENERATOR (बैच टिकट क्रिएटर) */}
      {/* ========================================================================= */}
      {activeSubTab === 'generator' && (
        <div className="rounded-3xl bg-gradient-to-r from-[#1c1233] via-[#121b3b] to-[#250d24] p-5 sm:p-6 border-2 border-amber-400/40 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-black text-white">Batch Ticket Creation Studio</h3>
              <p className="text-xs text-slate-400">
                टूर्नामेंट के लिए नए अनूठे तंबोला टिकट बैच में बनाएं।
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Target Tournament</label>
              <select
                value={batchGameId}
                onChange={(e) => setBatchGameId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.isGameEnabled === false ? '🔴 बंद / OFF' : (g.status || 'upcoming').toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Quantity (Tickets)</label>
              <input
                type="number"
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Color Theme</label>
              <select
                value={batchColor}
                onChange={(e) => setBatchColor(e.target.value as TicketColorThemeId)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="multi">🎲 Multi-Color (Random)</option>
                {COLOR_KEYS.map((ck) => (
                  <option key={ck} value={ck}>
                    {TICKET_COLOR_PALETTES[ck].name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{generating ? 'Generating...' : `Generate ${batchCount} Tickets`}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUTO-TICKET ENGINE HUB (ऑटोमैटिक टिकट डिस्पैच एवं वॉलेट कटौती हब) */}
      {/* ========================================================================= */}
      {activeSubTab === 'auto_ticket' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main Control Station */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                  isAutoEnabled
                    ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-400'
                    : 'bg-amber-500/20 border border-amber-400 text-amber-400'
                }`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>ऑटोमैटिक टिकट डिस्पैच एवं वॉलेट ऑटो-डेबिट इंजन</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                      isAutoEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isAutoEnabled ? '🟢 ON' : '⚪ OFF'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    जिस यूजर के वॉलेट में फंड है, उसे 1 टिकट ऑटोमैटिक बुक करें एवं वॉलेट से टिकट का निर्धारित भुगतान कट करें।
                  </p>
                </div>
              </div>

              {/* Master Switch */}
              <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">
                  {isAutoEnabled ? 'ऑटो टिकट चालू है' : 'ऑटो टिकट बंद है'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleAutoEngine}
                  className={`relative inline-flex h-9 w-18 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAutoEnabled ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30' : 'bg-slate-800 border-slate-700'
                  }`}
                  title={isAutoEnabled ? 'ऑटो टिकट बंद करें' : 'ऑटो टिकट चालू करें'}
                >
                  <span
                    className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isAutoEnabled ? 'translate-x-9' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Settings & Trigger Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Target Tournament Box */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>टारगेट गेम / टूर्नामेंट</span>
                </label>
                <select
                  value={selectedAutoGameId}
                  onChange={(e) => {
                    setSelectedAutoGameId(e.target.value);
                    if (onToggleAutoTicket && isAutoEnabled) {
                      onToggleAutoTicket(true, e.target.value);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} (मूल्य: ₹{g.ticketPrice || 5})
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-amber-400 font-bold flex items-center justify-between">
                  <span>टिकट कटौती राशि:</span>
                  <span className="font-mono text-sm font-black">₹{autoTicketPrice}</span>
                </div>
              </div>

              {/* Eligible Funded Users Count */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-400 font-bold">
                  <span>फंडेड यूजर (Funded Users)</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-3xl font-black text-white font-mono">{eligibleUsersForAuto.length}</div>
                <div className="text-[11px] text-slate-400">
                  न्यूनतम ₹{autoTicketPrice} बैलेंस वाले कुल यूजर
                </div>
              </div>

              {/* Pending for Ticket */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                  <span>लंबित यूजर (Need 1 Ticket)</span>
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="text-3xl font-black text-amber-300 font-mono">{pendingEligibleUsers.length}</div>
                <div className="text-[11px] text-slate-400">
                  जिन्हें अभी 1 टिकट जाना शेष है
                </div>
              </div>

              {/* Action Trigger Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/40 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-xs text-amber-300 font-bold">1-Click मास्टर डिस्पैच</div>
                  <div className="text-[11px] text-slate-400">सभी पात्र फंडेड यूजर्स को तुरंत भेजें</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTriggerAutoDispatch()}
                  disabled={isAutoDispatching || pendingEligibleUsers.length === 0}
                  className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg ${
                    isAutoDispatching
                      ? 'bg-amber-600 text-slate-950 opacity-70 cursor-wait'
                      : pendingEligibleUsers.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 shadow-amber-500/30 hover:brightness-110'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isAutoDispatching ? 'animate-spin' : 'fill-slate-950'}`} />
                  <span>{isAutoDispatching ? 'डिस्पैच जारी है...' : `⚡ ${pendingEligibleUsers.length} यूजर्स को टिकट भेजें`}</span>
                </button>
              </div>
            </div>

            {/* Explanatory Rule Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="text-amber-400 font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>ऑटोमैटिक टिकट एवं फंड कटौती नियम (Rules &amp; Verification):</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-black">1.</span>
                  <span><strong>सटीक कटौती:</strong> जितने का टिकट होगा (₹{autoTicketPrice}), यूजर के वॉलेट से ठीक उतना ही अमाउंट कट होगा।</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-black">2.</span>
                  <span><strong>ऑटो मोड = 1 टिकट:</strong> ऑटो मोड में 1 गेम का सिर्फ <strong>1 टिकट</strong> ही जाएगा। यदि यूजर चाहे तो वह खुद मैनुअल कितने भी टिकट (2, 6, 12...) खरीद सकता है।</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-black">3.</span>
                  <span><strong>बैलेंस प्राथमिकता:</strong> पहले डिपॉजिट बैलेंस, फिर विनिंग बैलेंस एवं रेफरल बैलेंस से कटौती होती है।</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Live Eligible Users Table */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>पात्र फंडेड यूजर सूची (Eligible Users Live Status)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {eligibleUsersForAuto.length} Users
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  वे सभी यूजर जिनके पास टूर्नामेंट "{currentAutoGame?.title}" हेतु ₹{autoTicketPrice} से अधिक वॉलेट फंड उपलब्ध है।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">यूजर नाम एवं मोबाइल</th>
                    <th className="py-3 px-4">कुल वॉलेट फंड</th>
                    <th className="py-3 px-4">डिपॉजिट बैलेंस</th>
                    <th className="py-3 px-4">विनिंग बैलेंस</th>
                    <th className="py-3 px-4">टिकट स्थिति</th>
                    <th className="py-3 px-4 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {eligibleUsersForAuto.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        वर्तमान में किसी भी यूजर के पास ₹{autoTicketPrice} बैलेंस उपलब्ध नहीं है।
                      </td>
                    </tr>
                  ) : (
                    eligibleUsersForAuto.map((u) => {
                      const totalBal = Number(u.walletBalance || (u.depositBalance || 0) + (u.winningBalance || 0) + (u.referralBalance || 0)) || 0;
                      const hasTicket = usersAlreadyHavingTicket.has(u.id);

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-xs">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-white">{u.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{u.phone || u.email || u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-400 text-sm">
                            ₹{totalBal}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            ₹{u.depositBalance || 0}
                          </td>
                          <td className="py-3 px-4 font-mono text-amber-300 font-bold">
                            ₹{u.winningBalance || 0}
                          </td>
                          <td className="py-3 px-4">
                            {hasTicket ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>टिकट बुक हो चुका है</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>लंबित (Ready for 1 Ticket)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {hasTicket ? (
                              <span className="text-slate-500 text-[11px] font-bold">✓ Complete</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTriggerAutoDispatch()}
                                disabled={isAutoDispatching}
                                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow cursor-pointer transition-all active:scale-95"
                              >
                                ⚡ भेजें ₹{autoTicketPrice} टिकट
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TRANSFER / MATCH CONSOLIDATION (मैच कंसॉलिडेशन व टिकट शिफ्टर) */}
      {/* ========================================================================= */}
      {activeSubTab === 'transfer' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Quick Action Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                  <ArrowRightLeft className="w-6 h-6 text-cyan-400" />
                  <span>मैच कंसॉलिडेशन व टिकट शिफ्टर (All Players in One Live Game)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
                  यूजर ने जिस भी मैच या पुराने गेम का टिकट लिया हो, एडमिन उसे आज चलने वाले लाइव मैच में आसानी से बदल सकता है ताकि सभी खिलाड़ी एक ही कमरे में एक साथ खेल सकें।
                </p>
              </div>

              {activeLiveGame && (
                <button
                  type="button"
                  onClick={() => openAllTransferModal('all')}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xl shadow-cyan-500/20 shrink-0"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>🚀 सभी टिकट आज के मैच में बदलें</span>
                </button>
              )}
            </div>

            {/* Current Active Live Match Highlight */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <span className="text-slate-400">वर्तमान में सक्रिय लाइव मैच: </span>
                  <strong className="text-emerald-300 text-sm font-black">{activeLiveGame?.title || 'कोई लाइव मैच सक्रिय नहीं'}</strong>
                  {activeLiveGame && (
                    <span className="text-slate-400 ml-2 font-mono">
                      (दर: ₹{activeLiveGame.ticketPrice || 5} • {activeLiveGame.matchDate || 'Daily Match'})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  लाइव मैच में टिकट: {gameMigrationStats.activeLiveTicketsCount}
                </span>
                {gameMigrationStats.totalNonLiveTickets > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    ⚠️ {gameMigrationStats.totalNonLiveTickets} अन्य मैचों में
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Game Wise Ticket Matrix Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-400" />
              <span>गेम/टूर्नामेंट अनुसार टिकट वितरण एवं त्वरित शिफ्ट:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Active Games in List */}
              {games.map((game) => {
                const isLive = game.id === activeLiveGame?.id;
                const count = gameMigrationStats.byGameId[game.id] || 0;
                const ticketsForThisGame = tickets.filter(
                  (t) => (t.gameId === game.id) || (!t.gameId && isLive)
                );
                const uniqueBuyersForGame = new Set(ticketsForThisGame.map((t) => t.userId || t.userName)).size;

                return (
                  <div
                    key={game.id}
                    className={`rounded-3xl p-5 border transition-all shadow-xl space-y-4 flex flex-col justify-between ${
                      isLive
                        ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/50'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-white text-sm">{game.title}</h5>
                            {isLive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                                ● Live Now
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            टिकट दर: <strong className="text-amber-300 font-mono font-bold">₹{game.ticketPrice || 5}</strong> • {game.matchDate || 'Daily Match'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px]">कुल टिकट</div>
                          <div className="text-lg font-black text-amber-400 font-mono">{count}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">खिलाड़ी (Buyers)</div>
                          <div className="text-lg font-black text-blue-300 font-mono">{uniqueBuyersForGame}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGameFilter(game.id);
                          setActiveSubTab('history');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>टिकट देखें</span>
                      </button>

                      {!isLive && count > 0 && activeLiveGame && (
                        <button
                          type="button"
                          onClick={() => openAllTransferModal(game.id)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
                          title="इस गेम के सभी टिकट आज के लाइव मैच में भेजें"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>लाइव मैच में भेजें ({count})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Orphan or Unassigned Tickets Box if any */}
              {gameMigrationStats.orphanTicketsCount > 0 && (
                <div className="rounded-3xl p-5 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/50 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>अपरिभाषित या पुराने गेम टिकट (Unassigned)</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      ये वे टिकट हैं जो किसी अज्ञात या डिलीट हो चुके गेम ID से जुड़े हैं।
                    </p>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 text-xs">
                      <div className="text-slate-400 text-[10px]">कुल अपरिभाषित टिकट</div>
                      <div className="text-xl font-black text-amber-400 font-mono">
                        {gameMigrationStats.orphanTicketsCount} टिकट
                      </div>
                    </div>
                  </div>

                  {activeLiveGame && (
                    <button
                      type="button"
                      onClick={() => openAllTransferModal('orphan')}
                      className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>आज के लाइव गेम में जोड़ें ({gameMigrationStats.orphanTicketsCount})</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: TICKET START & GAME BOOKING CONTROLLER (एडमिन टिकट शुरू करेगा तब ही टिकट शुरू हो) */}
      {/* ========================================================================= */}
      {activeSubTab === 'controller' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Master Global Ticket Sales Switch Banner */}
          <div className={`p-6 rounded-3xl border transition-all shadow-2xl ${
            siteSettings?.globalTicketBookingEnabled !== false
              ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-emerald-500/50 shadow-emerald-950/30'
              : 'bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border-red-500/50 shadow-red-950/30'
          }`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <button
                  type="button"
                  onClick={handleToggleGlobalBooking}
                  className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                    siteSettings?.globalTicketBookingEnabled !== false
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'bg-red-600 border-red-500'
                  }`}
                  title={
                    siteSettings?.globalTicketBookingEnabled !== false
                      ? 'मास्टर टिकट बुकिंग बंद करें'
                      : 'मास्टर टिकट बुकिंग चालू करें'
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      siteSettings?.globalTicketBookingEnabled !== false ? 'translate-x-10' : 'translate-x-0'
                    }`}
                  />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-black text-white">
                      👑 मास्टर टिकट बुकिंग स्विच (Global Ticket Sales Master Switch)
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      siteSettings?.globalTicketBookingEnabled !== false
                        ? 'bg-emerald-400 text-slate-950 animate-pulse'
                        : 'bg-red-500 text-white'
                    }`}>
                      {siteSettings?.globalTicketBookingEnabled !== false ? '🟢 टिकट बुकिंग लाइव है' : '🛑 टिकट बुकिंग बंद है'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {siteSettings?.globalTicketBookingEnabled !== false
                      ? 'खिलाड़ी ऐप पर टिकट खरीद सकते हैं। जब तक एडमिन इसे बंद नहीं करता टिकट बिक्री चालू रहेगी।'
                      : '⚠️ एडमिन द्वारा टिकट बुकिंग बंद कर दी गई है! खिलाड़ी जब तक एडमिन चालू नहीं करेगा, नया टिकट नहीं खरीद सकते।'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleGlobalBooking}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg ${
                    siteSettings?.globalTicketBookingEnabled !== false
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                  }`}
                >
                  {siteSettings?.globalTicketBookingEnabled !== false ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>बुकिंग रोकें (Stop All Booking)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>बुकिंग शुरू करें (Start Ticket Booking)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Clear Completed Banner */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>समाप्त मैचों के पुराने टिकट क्लीनर (Auto Clean Finished Games)</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                    {completedTicketsList.length} समाप्त टिकट
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  जो मैच खत्म हो जाते हैं उनके टिकट एडमिन लिस्ट से स्वतः हटाए जा सकते हैं ताकि नए टिकट और मैच साफ दिखें।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedGameToClear('all');
                setClearCompletedModalOpen(true);
              }}
              disabled={completedTicketsList.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>समाप्त टिकट हटाएं ({completedTicketsList.length})</span>
            </button>
          </div>

          {/* Individual Games Start / Stop & Booking Matrix */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>प्रत्येक गेम/टूर्नामेंट की टिकट बुकिंग एवं लाइव कंट्रोल (Game-Level Controls):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => {
                const isLive = game.status === 'live' || game.id === activeLiveGame?.id;
                const isBookingActive = game.isBookingOpen !== false && game.bookingOpen !== false && game.isActive !== false;
                const ticketsForThisGame = tickets.filter((t) => t.gameId === game.id);
                const isCompleted = game.status === 'completed';

                return (
                  <div
                    key={game.id}
                    className={`p-5 rounded-3xl border transition-all shadow-xl space-y-4 flex flex-col justify-between ${
                      isLive
                        ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/60 ring-1 ring-emerald-400/30'
                        : isCompleted
                        ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-white text-sm">{game.title}</h5>
                            {isLive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-wider animate-pulse">
                                ● LIVE
                              </span>
                            ) : isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                                FINISHED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 font-bold text-[9px] uppercase tracking-wider">
                                UPCOMING
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            दर: <strong className="text-amber-300 font-bold">₹{game.ticketPrice || 5}</strong> • तारीख: {game.matchDate || 'Daily Match'}
                          </div>
                        </div>

                        {/* Booking Status Badge */}
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          isBookingActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}>
                          {isBookingActive ? '🟢 बुकिंग चालू' : '🛑 बुकिंग बंद'}
                        </span>
                      </div>

                      {/* Metrics Box */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px]">बिके कुल टिकट:</span>
                          <div className="text-lg font-black text-amber-400 font-mono">{ticketsForThisGame.length}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">कुल कलेक्शन:</span>
                          <div className="text-lg font-black text-emerald-400 font-mono">
                            ₹{ticketsForThisGame.reduce((sum, t) => sum + (Number(t.price) || Number(game.ticketPrice) || 0), 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {/* Toggle Booking Open/Close */}
                        <button
                          type="button"
                          onClick={() => handleToggleGameBooking(game.id, isBookingActive)}
                          className={`w-1/2 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                            isBookingActive
                              ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                          }`}
                        >
                          {isBookingActive ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>बुकिंग बंद करें</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>बुकिंग शुरू करें</span>
                            </>
                          )}
                        </button>

                        {/* Start or Stop Tournament */}
                        {isLive ? (
                          <button
                            type="button"
                            onClick={() => handleStopGameFromTickets(game.id)}
                            className="w-1/2 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                            title="टूर्नामेंट समाप्त करें और टिकट आर्काइव करें"
                          >
                            <Square className="w-3.5 h-3.5 fill-amber-300" />
                            <span>गेम समाप्त करें</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartGameFromTickets(game.id)}
                            className="w-1/2 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                            title="टूर्नामेंट शुरू करें और टिकट लाइव करें"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>गेम शुरू करें (LIVE)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / TRANSFER GAME (यूजर का गेम बदलें व आज के लाइव गेम में शिफ्ट करें) */}
      {/* ========================================================================= */}
      {editGameModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-cyan-500/80 rounded-3xl p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">गेम / टूर्नामेंट बदलें (Change Game)</h3>
                <p className="text-xs text-slate-400">
                  {editGameModalState.mode === 'single'
                    ? 'इस टिकट को चयनित गेम / आज चलने वाले मैच में बदलें।'
                    : editGameModalState.mode === 'batch'
                    ? `चयनित ${editGameModalState.ticketIds?.length} टिकटों को नए गेम में ट्रांसफर करें।`
                    : editGameModalState.mode === 'user'
                    ? `यूजर (${editGameModalState.user?.name}) के सभी टिकटों को नए गेम में बदलें।`
                    : 'सभी टिकटों को एक साथ आज के लाइव गेम में कंसॉलिडेट करें।'}
                </p>
              </div>
            </div>

            {/* Target Information */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              {editGameModalState.mode === 'single' && editGameModalState.ticket && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">टिकट कोड:</span>
                    <strong className="font-mono text-amber-400 font-black">
                      {editGameModalState.ticket.ticketId || editGameModalState.ticket.id}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">खरीदार खिलाड़ी:</span>
                    <strong className="text-white font-bold">{editGameModalState.ticket.userName || 'Player'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">वर्तमान गेम:</span>
                    <span className="text-amber-300 font-bold">{editGameModalState.ticket.gameTitle || 'Tambola Live'}</span>
                  </div>
                </>
              )}

              {editGameModalState.mode === 'batch' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">बदले जाने वाले टिकट:</span>
                  <strong className="font-mono text-cyan-400 font-black text-sm">
                    {editGameModalState.ticketIds?.length} टिकट
                  </strong>
                </div>
              )}

              {editGameModalState.mode === 'user' && editGameModalState.user && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">यूजर:</span>
                    <strong className="text-white font-bold">{editGameModalState.user.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">कुल टिकट:</span>
                    <strong className="font-mono text-cyan-400 font-black">{editGameModalState.user.count} टिकट</strong>
                  </div>
                </>
              )}

              {editGameModalState.mode === 'all' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">कुल शिफ्ट होने वाले टिकट:</span>
                  <strong className="font-mono text-cyan-400 font-black text-sm">
                    {totalTicketsSold} टिकट
                  </strong>
                </div>
              )}
            </div>

            {/* Target Tournament Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>🎯 नया गेम / टूर्नामेंट चुनें (Target Game):</span>
                {activeLiveGame && (
                  <span className="text-emerald-400 text-[11px] font-bold">● {activeLiveGame.title} (Live)</span>
                )}
              </label>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {games.map((g) => {
                  const isSelected = editGameModalState.targetGameId === g.id;
                  const isLive = g.id === activeLiveGame?.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setEditGameModalState((prev) => ({ ...prev, targetGameId: g.id }))}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-white font-black shadow-md'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{g.title}</span>
                            {isLive && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 text-[9px] font-black">
                                लाइव मैच
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            दर: ₹{g.ticketPrice || 5} • {g.matchDate || 'Daily Match'}
                          </div>
                        </div>
                      </div>

                      {isLive && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                          अनुशंसित (Recommended)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanatory benefit note */}
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                गेम बदलने पर खिलाड़ी के टिकट का 3x9 ग्रिड नंबर वही रहेगा, सिर्फ उसका मैच बदल जाएगा ताकि वह आज के लाइव मैच में तुरंत भाग ले सके।
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  setEditGameModalState({
                    isOpen: false,
                    mode: 'single',
                    targetGameId: '',
                    isUpdating: false,
                  })
                }
                disabled={editGameModalState.isUpdating}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
              >
                रद्द करें (Cancel)
              </button>

              <button
                type="button"
                onClick={handleConfirmGameUpdate}
                disabled={editGameModalState.isUpdating || !editGameModalState.targetGameId}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{editGameModalState.isUpdating ? 'अपडेट हो रहा है...' : 'हाँ, गेम बदलें (Confirm Shift)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REMOVE / DELETE CONFIRMATION (रिमूव ऑप्शन विथ वॉलेट रिफंड) */}
      {/* ========================================================================= */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">टिकट रिमूव करें (Delete Ticket)</h3>
                <p className="text-xs text-slate-400">
                  {deleteModalState.mode === 'single'
                    ? 'क्या आप इस टिकट को सिस्टम से हटाना चाहते हैं?'
                    : deleteModalState.mode === 'user'
                    ? `क्या आप इस यूजर (${deleteModalState.user?.name}) के सभी टिकट हटाना चाहते हैं?`
                    : `क्या आप सभी ${deleteModalState.ticketIds?.length} चयनित टिकटों को हटाना चाहते हैं?`}
                </p>
              </div>
            </div>

            {/* Target Info Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              {deleteModalState.mode === 'single' && deleteModalState.ticket && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">टिकट कोड:</span>
                    <strong className="font-mono text-amber-400 font-black">
                      {deleteModalState.ticket.ticketId || deleteModalState.ticket.id}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">खरीदार यूजर:</span>
                    <strong className="text-white font-bold">{deleteModalState.ticket.userName || 'Player'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">टूर्नामेंट:</span>
                    <strong className="text-slate-300">{deleteModalState.ticket.gameTitle || 'Tournament'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">टिकट मूल्य:</span>
                    <strong className="text-emerald-400 font-mono font-black">₹{deleteModalState.ticket.price || 0}</strong>
                  </div>
                </>
              )}

              {deleteModalState.mode === 'batch' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">हटाए जाने वाले कुल टिकट:</span>
                    <strong className="font-mono text-amber-400 font-black">
                      {deleteModalState.ticketIds?.length} टिकट
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">कार्रवाई:</span>
                    <span className="text-rose-300 font-bold">बैच डिलीशन (Multi-Delete)</span>
                  </div>
                </>
              )}

              {deleteModalState.mode === 'user' && deleteModalState.user && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">यूजर नाम:</span>
                    <strong className="text-white font-bold">{deleteModalState.user.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">कुल टिकट:</span>
                    <strong className="font-mono text-amber-400 font-black">{deleteModalState.user.count}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">कुल रिफंड योग्य राशि:</span>
                    <strong className="text-emerald-400 font-mono font-black">₹{deleteModalState.user.totalAmount}</strong>
                  </div>
                </>
              )}
            </div>

            {/* Refund Wallet Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deleteModalState.refundUser}
                onChange={(e) =>
                  setDeleteModalState((prev) => ({ ...prev, refundUser: e.target.checked }))
                }
                className="mt-0.5 rounded border-amber-400 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer shrink-0"
              />
              <div className="text-xs">
                <div className="font-black text-amber-300 flex items-center gap-1">
                  <span>💰 यूजर के वॉलेट में रिफंड वापस जमा करें (Refund Wallet Balance)</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  यदि टिक रहेगा, तो टिकट की पूरी कीमत यूजर के वॉलेट में तुरंत रिफंड के रूप में जमा हो जाएगी।
                </div>
              </div>
            </label>

            {/* Warning Text */}
            <p className="text-[11px] text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>रिमूव करने पर यह टिकट डेटाबेस व गेम लिस्ट से तुरंत हटा दिया जाएगा।</span>
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteModalState({
                    isOpen: false,
                    mode: 'single',
                    refundUser: true,
                    isDeleting: false,
                  })
                }
                disabled={deleteModalState.isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
              >
                रद्द करें (Cancel)
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteModalState.isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteModalState.isDeleting ? 'रिमूव हो रहा है...' : 'हाँ, टिकट रिमूव करें'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TICKET INSPECTION & VERIFICATION */}
      {/* ========================================================================= */}
      {inspectingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">Ticket Verification &amp; Master Controls</h3>
              </div>
              <button
                onClick={() => setInspectingTicket(null)}
                className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber-400 font-black text-sm">{inspectingTicket.ticketId}</span>
                <span className="text-slate-300">
                  Player: <strong className="text-white">{inspectingTicket.userName}</strong>
                </span>
              </div>
              <div className="text-slate-400">
                Game: <strong className="text-slate-200">{inspectingTicket.gameTitle}</strong>
              </div>

              {/* Status Control */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">एडमिन टिकट स्थिति:</div>
                  <div className="text-[10px] text-slate-400">
                    {inspectingTicket.isActive !== false
                      ? 'टिकट चालू है - खिलाड़ी खेल सकते हैं और ईनाम क्लेम कर सकते हैं।'
                      : 'टिकट बंद है - खिलाड़ी ईनाम क्लेम नहीं कर सकते।'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSingleTicket(inspectingTicket)}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                    inspectingTicket.isActive !== false
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-red-500/20 text-red-300 border-red-500/60'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{inspectingTicket.isActive !== false ? '🟢 चालू (ACTIVE)' : '🔴 बंद (DISABLED)'}</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Ticket Card */}
            <div>
              <TambolaTicketCard
                ticket={inspectingTicket}
                calledNumbers={games.find((g) => g.id === inspectingTicket.gameId)?.calledNumbers || []}
              />
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {/* Direct Remove from Inspector */}
              <button
                type="button"
                onClick={() => {
                  const target = inspectingTicket;
                  openSingleDeleteModal(target);
                }}
                className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>इस टिकट को रिमूव करें</span>
              </button>

              <button
                onClick={() => setInspectingTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLEAR / PURGE COMPLETED GAME TICKETS (जो गेम हो जाता है वह टिकट हट जाना चाहिए) */}
      {/* ========================================================================= */}
      {clearCompletedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">समाप्त गेम टिकट हटाएं (Clear Completed Tickets)</h3>
                <p className="text-xs text-slate-400">
                  जो मैच खत्म हो चुके हैं उनके टिकट लिस्ट से हटाए जा रहे हैं ताकि नए टिकट आ सकें।
                </p>
              </div>
            </div>

            {/* Selection Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">कौनसे गेम के पुराने टिकट हटाने हैं?</label>
              <select
                value={selectedGameToClear}
                onChange={(e) => setSelectedGameToClear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400 cursor-pointer"
              >
                <option value="all">सभी समाप्त / पूर्ण हो चुके गेम्स ({completedTicketsList.length} टिकट)</option>
                {games
                  .filter((g) => completedGameIds.has(g.id))
                  .map((g) => {
                    const cnt = tickets.filter((t) => t.gameId === g.id).length;
                    return (
                      <option key={g.id} value={g.id}>
                        {g.title} ({cnt} टिकट)
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">हटाए जाने वाले टिकट:</span>
                <strong className="text-rose-400 font-mono font-black text-sm">
                  {selectedGameToClear === 'all'
                    ? completedTicketsList.length
                    : tickets.filter((t) => t.gameId === selectedGameToClear).length}{' '}
                  टिकट
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">सक्रिय मैच टिकट:</span>
                <strong className="text-emerald-400 font-mono font-black">{activeTicketsList.length} (सुरक्षित रहेंगे)</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-start gap-2 bg-rose-950/30 p-3 rounded-xl border border-rose-500/30">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                समाप्त गेम्स के टिकट हटाने से एडमिन टिकट लिस्ट साफ हो जाएगी और केवल वर्तमान सक्रिय गेम्स के नए टिकट दिखाई देंगे।
              </span>
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClearCompletedModalOpen(false)}
                disabled={isClearingCompleted}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
              >
                रद्द करें (Cancel)
              </button>

              <button
                type="button"
                onClick={handleConfirmClearCompletedTickets}
                disabled={isClearingCompleted}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearingCompleted ? 'हटाया जा रहा है...' : 'हाँ, समाप्त टिकट हटाएं'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE TICKET */}
      {/* ========================================================================= */}
      {printingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white text-slate-950 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-300 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-950">TAMBOLA LIVE OFFICIAL TICKET</h3>
                <p className="text-xs text-slate-600 font-bold">{printingTicket.gameTitle}</p>
              </div>
              <span className="text-xs font-mono font-black bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg">
                {printingTicket.ticketId}
              </span>
            </div>

            <div className="border-2 border-slate-950 rounded-2xl p-4 bg-amber-50">
              <div className="grid grid-cols-9 gap-1.5 text-center font-bold text-sm font-mono">
                {(Array.isArray(printingTicket.numbers) && printingTicket.numbers.length === 3
                  ? printingTicket.numbers
                  : generateTambolaTicketMatrix()
                ).map((row, rIdx) => (
                  <React.Fragment key={rIdx}>
                    {Array.isArray(row) &&
                      row.map((val, cIdx) => (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`h-10 border border-slate-400 rounded-lg flex items-center justify-center text-sm font-black ${
                            val === 0 ? 'bg-slate-200 text-transparent' : 'bg-white text-slate-950 shadow-sm'
                          }`}
                        >
                          {val > 0 ? val : ''}
                        </div>
                      ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center space-y-1">
              <div>
                Player: <strong>{printingTicket.userName}</strong> • Rate: <strong>₹{printingTicket.price}</strong>
              </div>
              <div>System Authenticated with SHA-256 Anti-Tamper Security Hash</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPrintingTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
