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
} from 'lucide-react';
import { TambolaTicket, TambolaGame, User, TicketColorThemeId } from '../../types';
import { TambolaTicketCard } from '../../components/TambolaTicketCard';
import { TICKET_COLOR_PALETTES, COLOR_KEYS, getTicketTheme, COLUMN_COLORS } from '../../utils/ticketColors';
import { generateTambolaTicketMatrix, generateTicketId } from '../../utils/tambolaTicket';

interface ModuleTicketsProps {
  tickets: TambolaTicket[];
  games: TambolaGame[];
  users?: User[];
  onAdminGenerateTickets?: (gameId: string, count: number, colorTheme?: TicketColorThemeId) => Promise<boolean>;
  onAdminToggleTicketStatus?: (ticketId: string, isActive: boolean) => Promise<boolean>;
  onAdminBatchToggleTickets?: (ticketIds: string[], isActive: boolean) => Promise<boolean>;
  onDeleteTicket?: (ticketId: string, refundUser?: boolean) => Promise<boolean>;
  onBatchDeleteTickets?: (ticketIds: string[], refundUser?: boolean) => Promise<boolean>;
  onForceRefresh?: () => void;
  isSyncing?: boolean;
}

type SubTab = 'history' | 'buyers' | 'cards' | 'generator';
type StatusFilter = 'all' | 'active' | 'disabled' | 'winning';
type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low' | 'buyer_asc';

export const ModuleTickets: React.FC<ModuleTicketsProps> = ({
  tickets,
  games,
  users = [],
  onAdminGenerateTickets,
  onAdminToggleTicketStatus,
  onAdminBatchToggleTickets,
  onDeleteTicket,
  onBatchDeleteTickets,
  onForceRefresh,
  isSyncing = false,
}) => {
  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('history');

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState('all');
  const [selectedBuyerFilter, setSelectedBuyerFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Multi-selection for batch operations
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

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

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  // Helper map of users by ID for quick profile lookup
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => {
      if (u.id) map.set(u.id, u);
      if (u.phone) map.set(u.phone.replace(/\D/g, ''), u);
    });
    return map;
  }, [users]);

  // Unique Buyers Aggregation (कितने यूजर टिकट खरीदे हैं)
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
      }
    >();

    tickets.forEach((t) => {
      const uId = t.userId || t.userName || 'unknown';
      const uProfile = t.userId ? userMap.get(t.userId) : undefined;
      const userName = uProfile?.name || t.userName || 'Unknown Player';
      const userPhone = uProfile?.phone || '';
      const userEmail = uProfile?.email || '';
      const avatar = uProfile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${uId}`;

      const existing = map.get(uId);
      if (existing) {
        existing.ticketCount += 1;
        existing.totalSpent += Number(t.price || 0);
        existing.tickets.push(t);
        if (t.gameTitle) existing.gameTitles.add(t.gameTitle);
      } else {
        const gameTitles = new Set<string>();
        if (t.gameTitle) gameTitles.add(t.gameTitle);
        map.set(uId, {
          userId: uId,
          userName,
          userPhone,
          userEmail,
          avatar,
          ticketCount: 1,
          totalSpent: Number(t.price || 0),
          tickets: [t],
          gameTitles,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.ticketCount - a.ticketCount);
  }, [tickets, userMap]);

  // Aggregate Key Metrics (KPIs)
  const totalTicketsSold = tickets.length;
  const uniqueBuyersCount = buyerSummary.length;
  const totalTicketRevenue = tickets.reduce((acc, t) => acc + (Number(t.price) || 0), 0);
  const activeTicketsCount = tickets.filter((t) => t.isActive !== false).length;
  const disabledTicketsCount = tickets.filter((t) => t.isActive === false).length;
  const winningTicketsCount = tickets.filter((t) => t.isWinningTicket || t.isWinner).length;

  // Filter & Sort tickets for History & Cards view
  const filteredTickets = useMemo(() => {
    let result = tickets.filter((t) => {
      if (!t) return false;
      if (selectedGameFilter !== 'all' && t.gameId !== selectedGameFilter) return false;
      if (selectedBuyerFilter !== 'all' && t.userId !== selectedBuyerFilter && t.userName !== selectedBuyerFilter) return false;
      if (selectedStatusFilter === 'winning' && !t.isWinningTicket && !t.isWinner) return false;
      if (selectedStatusFilter === 'active' && t.isActive === false) return false;
      if (selectedStatusFilter === 'disabled' && t.isActive !== false) return false;

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
  }, [tickets, selectedGameFilter, selectedBuyerFilter, selectedStatusFilter, searchQuery, sortBy, userMap]);

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
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HISTORY (बिक्री हिस्ट्री) */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
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
                            <div className="max-w-[200px] truncate">
                              <span className="font-bold text-slate-200">{tkt.gameTitle || 'Tambola Live'}</span>
                              <div className="text-[10px] text-slate-400">
                                {tkt.matchDate || 'Daily Match'}
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

                          {/* Actions: Remove, Toggle ON/OFF, Inspect, Print */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
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
      {/* TAB 2: BUYERS (कितने यूजर टिकट खरीदे हैं) */}
      {/* ========================================================================= */}
      {activeSubTab === 'buyers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <strong className="text-white font-bold text-sm">कुल {uniqueBuyersCount} यूजरों ने टिकट खरीदे हैं।</strong>
                <p className="text-[11px] text-slate-300">
                  नीचे प्रत्येक खरीदार की पूरी जानकारी, खरीदे गए कुल टिकट एवं खर्च राशि का विवरण है।
                </p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400">कुल टिकट बिक्री: </span>
              <strong className="text-amber-300 text-sm font-black">₹{totalTicketRevenue}</strong>
            </div>
          </div>

          {buyerSummary.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-bold">अभी तक किसी यूजर ने टिकट नहीं खरीदा है।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buyerSummary.map((buyer, bIdx) => (
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
                        #{bIdx + 1} Buyer
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold">कुल टिकट खरीदे</div>
                        <div className="text-lg font-black text-amber-300 font-mono flex items-center gap-1">
                          <Ticket className="w-4 h-4 text-amber-400" />
                          <span>{buyer.ticketCount}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold">कुल खर्च राशि</div>
                        <div className="text-lg font-black text-emerald-300 font-mono">
                          ₹{buyer.totalSpent}
                        </div>
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
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBuyerFilter(buyer.userId);
                        setActiveSubTab('history');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-400" />
                      <span>टिकट देखें ({buyer.ticketCount})</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openUserAllTicketsDeleteModal(buyer)}
                      className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      title="इस यूजर के सभी टिकट रिमूव करें"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>सभी रिमूव</span>
                    </button>
                  </div>
                </div>
              ))}
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
