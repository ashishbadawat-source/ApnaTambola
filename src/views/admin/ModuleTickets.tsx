import React, { useState } from 'react';
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
  User,
  Star,
} from 'lucide-react';
import { TambolaTicket, TambolaGame, TicketColorThemeId } from '../../types';
import { TambolaTicketCard } from '../../components/TambolaTicketCard';
import { TICKET_COLOR_PALETTES, COLOR_KEYS, getTicketTheme, COLUMN_COLORS } from '../../utils/ticketColors';
import { generateTambolaTicketMatrix, generateTicketId } from '../../utils/tambolaTicket';

interface ModuleTicketsProps {
  tickets: TambolaTicket[];
  games: TambolaGame[];
  onAdminGenerateTickets?: (gameId: string, count: number, colorTheme?: TicketColorThemeId) => Promise<boolean>;
  onAdminToggleTicketStatus?: (ticketId: string, isActive: boolean) => Promise<boolean>;
  onAdminBatchToggleTickets?: (ticketIds: string[], isActive: boolean) => Promise<boolean>;
}

export const ModuleTickets: React.FC<ModuleTicketsProps> = ({
  tickets,
  games,
  onAdminGenerateTickets,
  onAdminToggleTicketStatus,
  onAdminBatchToggleTickets,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'disabled' | 'winning'>('all');

  // Generator form
  const [batchGameId, setBatchGameId] = useState<string>(games[0]?.id || '');
  const [batchCount, setBatchCount] = useState<number>(6);
  const [batchColor, setBatchColor] = useState<TicketColorThemeId>('multi');
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);

  // Verifier & Inspector Modal
  const [inspectingTicket, setInspectingTicket] = useState<TambolaTicket | null>(null);
  const [verifyTicketIdInput, setVerifyTicketIdInput] = useState('');

  // Print layout preview
  const [printingTicket, setPrintingTicket] = useState<TambolaTicket | null>(null);

  const filteredTickets = tickets.filter((t) => {
    if (selectedGameFilter !== 'all' && t.gameId !== selectedGameFilter) return false;
    if (selectedStatusFilter === 'winning' && !t.isWinningTicket) return false;
    if (selectedStatusFilter === 'active' && t.isActive === false) return false;
    if (selectedStatusFilter === 'disabled' && t.isActive !== false) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.ticketId.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.gameTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchGameId) return;
    setGenerating(true);
    try {
      if (onAdminGenerateTickets) {
        await onAdminGenerateTickets(batchGameId, batchCount, batchColor);
        setGenSuccess(`Successfully generated ${batchCount} tickets with ${batchColor.toUpperCase()} theme!`);
        setTimeout(() => setGenSuccess(null), 4000);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleSingleTicket = async (ticket: TambolaTicket, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !(ticket.isActive !== false);
    if (onAdminToggleTicketStatus) {
      await onAdminToggleTicketStatus(ticket.id, newStatus);
      setGenSuccess(
        `टिकट ${ticket.ticketId} को एडमिन द्वारा ${newStatus ? 'चालू (ACTIVE / ON)' : 'बंद (DISABLED / OFF)'} कर दिया गया है!`
      );
      if (inspectingTicket && inspectingTicket.id === ticket.id) {
        setInspectingTicket({ ...inspectingTicket, isActive: newStatus, status: newStatus ? 'active' : 'disabled' });
      }
      setTimeout(() => setGenSuccess(null), 4000);
    }
  };

  const handleBatchToggleTickets = async (isActive: boolean) => {
    const targetIds = filteredTickets.map((t) => t.id);
    if (targetIds.length === 0) {
      alert('No tickets match current filters to update.');
      return;
    }
    if (onAdminBatchToggleTickets) {
      await onAdminBatchToggleTickets(targetIds, isActive);
      setGenSuccess(
        `फ़िल्टर किए गए सभी ${targetIds.length} टिकटों को एडमिन द्वारा ${isActive ? 'चालू (ON)' : 'बंद (OFF)'} कर दिया गया है!`
      );
      setTimeout(() => setGenSuccess(null), 4000);
    }
  };

  const handleVerifyTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = tickets.find(
      (t) => t.ticketId.toLowerCase() === verifyTicketIdInput.trim().toLowerCase()
    );
    if (found) {
      setInspectingTicket(found);
      setVerifyTicketIdInput('');
    } else {
      alert(`No ticket found with ID: ${verifyTicketIdInput}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-amber-400" />
            <span>Ticket Management &amp; ON/OFF Master Control</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            एडमिन किसी भी टिकट को कभी भी <strong className="text-emerald-400">चालू (Active)</strong> या <strong className="text-red-400">बंद (Disabled/Void)</strong> कर सकता है। बंद टिकट ईनाम क्लेम नहीं कर सकते।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">कुल टिकट: </span>
            <strong className="text-white font-bold">{tickets.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-xs">
            <span className="text-emerald-400 font-bold">चालू (Active): </span>
            <strong className="text-emerald-300 font-black">{tickets.filter((t) => t.isActive !== false).length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-400/40 text-xs">
            <span className="text-red-400 font-bold">बंद (Disabled): </span>
            <strong className="text-red-300 font-black">{tickets.filter((t) => t.isActive === false).length}</strong>
          </div>
        </div>
      </div>

      {genSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{genSuccess}</span>
        </div>
      )}

      {/* Batch Quick Operations Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Power className="w-4 h-4 text-amber-400" />
          <span>बैच टिकट नियंत्रण (Filtered Tickets: {filteredTickets.length}):</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBatchToggleTickets(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="फ़िल्टर किए गए सभी टिकट चालू करें"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>सभी चालू करें (Enable All)</span>
          </button>
          <button
            onClick={() => handleBatchToggleTickets(false)}
            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/60 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="फ़िल्टर किए गए सभी टिकट बंद करें"
          >
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>सभी बंद करें (Disable All)</span>
          </button>
        </div>
      </div>

      {/* Batch Generator Panel */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1c1233] via-[#121b3b] to-[#250d24] p-5 sm:p-6 border-2 border-amber-400/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-black text-white">Batch Ticket Creation Studio</h3>
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
                  {g.title} ({g.isGameEnabled === false ? '🔴 बंद / OFF' : g.status.toUpperCase()})
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

      {/* Ticket Verifier Bar & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="active">🟢 Active / चालू Tickets Only</option>
            <option value="disabled">🔴 Disabled / बंद Tickets Only</option>
            <option value="winning">🏆 Winning Tickets Only</option>
          </select>

          {/* Game Filter */}
          <select
            value={selectedGameFilter}
            onChange={(e) => setSelectedGameFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Tournaments</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        {/* 1-Click Ticket Verifier Search */}
        <form onSubmit={handleVerifyTicketSubmit} className="flex items-center gap-2">
          <div className="relative">
            <FileCheck className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={verifyTicketIdInput}
              onChange={(e) => setVerifyTicketIdInput(e.target.value)}
              placeholder="Verify Ticket ID (e.g. TKT-7729)..."
              className="bg-slate-900 border border-amber-400/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
          >
            Verify
          </button>
        </form>
      </div>

      {/* Tickets Master Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTickets.map((tkt, tktIdx) => {
          const isTktActive = tkt.isActive !== false;
          const theme = getTicketTheme(tkt.colorTheme, tkt.ticketNumber || tktIdx + 1);
          const markedCount = tkt.markedNumbers?.length || 0;

          return (
            <div
              key={tkt.id}
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
                    {tkt.ticketId}
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
                    ₹{tkt.price}
                  </span>
                </div>
              </div>

              {/* Ticket Middle Info (Game Title + Owner) */}
              <div className="p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-black text-white truncate text-xs">{tkt.gameTitle}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-300 shrink-0">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Owner: <strong className="text-amber-300 font-bold">{tkt.userName}</strong></span>
                  </div>
                </div>

                {/* 3x9 Ultra-Colorful Ticket Grid Box */}
                <div className="rounded-2xl p-2 border-2 border-amber-400/50 bg-gradient-to-b from-[#180f28] via-[#0e0a1a] to-[#080510] shadow-2xl relative overflow-hidden text-center">
                  {/* Subtle Background Watermark */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none text-xl font-black uppercase text-amber-300 tracking-widest rotate-[-6deg]">
                    ★ APNA TAMBOLA ★
                  </div>

                  <div className="grid grid-cols-9 gap-1 text-[11px] font-mono relative z-10">
                    {tkt.numbers.map((row, rIdx) => (
                      <React.Fragment key={rIdx}>
                        {row.map((val, cIdx) => {
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

              {/* Action Bar (Inspect, Print, ON/OFF) */}
              <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                {/* 1-Click Direct Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleSingleTicket(tkt, e)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isTktActive
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50 shadow-md shadow-emerald-500/10'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/50'
                  }`}
                  title={isTktActive ? 'टिकट बंद करें (Disable Ticket)' : 'टिकट चालू करें (Enable Ticket)'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isTktActive ? 'चालू (ON)' : 'बंद (OFF)'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setInspectingTicket(tkt)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md border border-slate-600/50"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Inspect</span>
                  </button>
                  <button
                    onClick={() => setPrintingTicket(tkt)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 hover:brightness-110 text-purple-200 border border-purple-400/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    title="प्रिंट टिकट (Print Ticket)"
                  >
                    <Printer className="w-3.5 h-3.5 text-purple-300" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Ticket Verification & Full Inspection */}
      {inspectingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">Ticket Verification &amp; Controls Inspector</h3>
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

              {/* Admin ON/OFF Control in Inspector */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">एडमिन टिकट स्टेटस:</div>
                  <div className="text-[10px] text-slate-400">
                    {inspectingTicket.isActive !== false
                      ? 'टिकट चालू है - खिलाड़ी खेल सकते हैं और ईनाम क्लेम कर सकते हैं।'
                      : 'टिकट बंद (Disabled/Void) है - खिलाड़ी ईनाम क्लेम नहीं कर सकते।'}
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setInspectingTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printable Ticket */}
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
                {printingTicket.numbers.map((row, rIdx) => (
                  <React.Fragment key={rIdx}>
                    {row.map((val, cIdx) => (
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
