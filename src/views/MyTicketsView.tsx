import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  Search,
  Printer,
  Share2,
  Flame,
  Sparkles,
  Filter,
  Trophy,
  CheckCircle2,
  Calendar,
  Clock,
  Radio,
  Download,
  Trash2,
  AlertTriangle,
  Layers,
  Database,
} from 'lucide-react';
import { TambolaTicket, TambolaGame } from '../types';
import { TambolaTicketCard } from '../components/TambolaTicketCard';
import { PrintTicketModal } from '../components/PrintTicketModal';
import { TICKET_COLOR_PALETTES } from '../utils/ticketColors';

interface MyTicketsViewProps {
  tickets: TambolaTicket[];
  games: TambolaGame[];
  onNavigate: (tab: string, gameId?: string) => void;
  onToggleAutoMode?: (ticketId: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onDeleteCompletedTickets?: () => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  tickets,
  games,
  onNavigate,
  onToggleAutoMode,
  onDeleteTicket,
  onDeleteCompletedTickets,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'upcoming' | 'winning' | 'completed'>('all');
  const [selectedPrintTicket, setSelectedPrintTicket] = useState<TambolaTicket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<TambolaTicket | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const gameMap = new Map<string, TambolaGame>(games.map((g) => [g.id, g]));

  const winningTicketsCount = tickets.filter((t) => t.isWinningTicket).length;

  const completedTickets = tickets.filter((t) => {
    const game = gameMap.get(t.gameId);
    return game?.status === 'completed' || game?.status === 'cancelled';
  });

  const filteredTickets = tickets.filter((t) => {
    if (!t) return false;
    const game = gameMap.get(t.gameId);
    const tId = (t.ticketId || t.id || '').toLowerCase();
    const gTitle = (t.gameTitle || game?.title || '').toLowerCase();
    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch = !q || tId.includes(q) || gTitle.includes(q);

    if (!matchesSearch) return false;
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'live') return game?.status === 'live';
    if (selectedFilter === 'upcoming') return game?.status === 'upcoming';
    if (selectedFilter === 'winning') return t.isWinningTicket;
    if (selectedFilter === 'completed') return game?.status === 'completed' || game?.status === 'cancelled';
    return true;
  });

  const confirmDeleteSingleTicket = () => {
    if (ticketToDelete && onDeleteTicket) {
      onDeleteTicket(ticketToDelete.ticketId || ticketToDelete.id);
      setTicketToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    if (onDeleteCompletedTickets) {
      onDeleteCompletedTickets();
      setShowBulkDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-[#200d3a] via-[#121c42] to-[#2b0c26] p-6 sm:p-8 border-2 border-amber-400/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MY TAMBOLA WALLET &amp; ACTIVE CARDS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            My Housie &amp; Tambola Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            प्रत्येक टिकट केवल उसी गेम में काम करता है जिसके लिए खरीदा गया है। गेम पूरा होने के बाद आप पुराने टिकट डिलीट करके स्टोरेज व मेमोरी खाली कर सकते हैं।
          </p>
        </div>

        {/* Quick Stats & Action Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Cards</div>
            <div className="text-2xl font-black text-amber-400">{tickets.length}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Winning</div>
            <div className="text-2xl font-black text-emerald-300">{winningTicketsCount}</div>
          </div>
          <button
            onClick={() => onNavigate('buy-ticket')}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <TicketIcon className="w-4 h-4" />
            <span>+ Buy New Tickets</span>
          </button>
        </div>
      </div>

      {/* 🧹 Memory Cleanup Banner for Finished/Completed Games */}
      {completedTickets.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>मेमोरी क्लीनअप (Free App Storage &amp; Memory)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  {completedTickets.length} समाप्त टिकट
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                गेम पूरा होने के बाद पुराने टिकटों को हटाकर ऐप की मेमोरी व स्टोरेज को बिल्कुल फ्री और स्मूथ रखें।
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>समाप्त गेम के सभी टिकट हटाएं ({completedTickets.length})</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Ticket ID (e.g. TKT-7729) or Game..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${tickets.length})` },
            { id: 'live', label: '🔴 Live Now' },
            { id: 'upcoming', label: '⏰ Upcoming' },
            { id: 'winning', label: '🏆 Winners' },
            { id: 'completed', label: `Completed (${completedTickets.length})` },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === filter.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List Grid */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => {
            const game = gameMap.get(ticket.gameId);
            const isLive = game?.status === 'live';
            const isCompleted = game?.status === 'completed' || game?.status === 'cancelled';

            return (
              <div
                key={ticket.id}
                className="space-y-3 rounded-3xl p-4 bg-slate-900/80 border border-slate-800 hover:border-amber-400/50 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Game & Ticket Info Header */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-mono text-amber-400 font-black bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-400/30">
                      {ticket.ticketId}
                    </span>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-[10px] text-slate-300 font-bold truncate max-w-[130px]" title={ticket.gameTitle || game?.title}>
                        🎮 {ticket.gameTitle || game?.title || 'Tambola Match'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                          isLive
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                            : game?.status === 'upcoming'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {game?.status || 'SCHEDULED'}
                      </span>
                    </div>
                  </div>

                  {/* Single Game Locking Badge */}
                  <div className="text-[10px] text-amber-300/90 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-400" />
                      <span>गेम-विशिष्ट: केवल <strong>{ticket.gameTitle || game?.title || 'इस गेम'}</strong> में मान्य</span>
                    </span>
                    {ticket.autoMode !== false && (
                      <span className="text-emerald-400 font-bold">⚡ ऑटो-ट्रैक ऑन</span>
                    )}
                  </div>

                  {/* Ticket Card with Color Theme */}
                  <TambolaTicketCard
                    ticket={ticket}
                    calledNumbers={game?.calledNumbers || []}
                    currentNumber={game?.currentNumber}
                    onPrint={(t) => setSelectedPrintTicket(t)}
                    onShare={(t) => setSelectedPrintTicket(t)}
                    onToggleAutoMode={onToggleAutoMode}
                  />
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  {isLive ? (
                    <button
                      onClick={() => onNavigate('live', game?.id)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 cursor-pointer active:scale-95 transition-all"
                    >
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>ENTER LIVE ROOM &amp; CLAIM</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('live', game?.id)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{isCompleted ? 'View Result Room' : 'View Game Room'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedPrintTicket(ticket)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                    title="Print / Export Ticket PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* 🗑️ Delete / Remove Ticket Button (Available for completed games) */}
                  {isCompleted && onDeleteTicket && (
                    <button
                      onClick={() => setTicketToDelete(ticket)}
                      className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 text-xs cursor-pointer transition-colors"
                      title="गेम पूरा होने के बाद यह टिकट हटाएं (Free Memory)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl p-12 text-center space-y-4 bg-slate-900/60 border border-dashed border-slate-800">
          <TicketIcon className="w-14 h-14 text-amber-400/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">No Tickets Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You don't have any tickets matching your selected filter. Buy tickets now to participate in the mega tournaments!
            </p>
          </div>
          <button
            onClick={() => onNavigate('buy-ticket')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Buy Tickets Now
          </button>
        </div>
      )}

      {/* 🗑️ Individual Ticket Delete Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border-2 border-red-500/50 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">पुराना टिकट हटाएं?</h3>
                <p className="text-xs text-slate-400">टिकट ID: {ticketToDelete.ticketId || ticketToDelete.id}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-amber-300">
                🎮 गेम: {ticketToDelete.gameTitle || 'Completed Game'}
              </p>
              <p>
                यह गेम समाप्त हो चुका है। इस टिकट को डिलीट करने से आपके डिवाइस और अकाउंट की स्टोरेज मेमोरी बिल्कुल फ्री हो जाएगी।
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingleTicket}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 cursor-pointer"
              >
                हाँ, टिकट हटाएं (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧹 Bulk Delete Completed Tickets Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border-2 border-purple-500/50 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">समाप्त गेम के टिकट हटाएं</h3>
                <p className="text-xs text-slate-400">कुल {completedTickets.length} समाप्त टिकट डिलीट किए जाएंगे</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-amber-300">
                🧹 मेमोरी क्लीनअप नियम:
              </p>
              <p>
                यह क्रिया समाप्त और रद्द हो चुके सभी मैचों के पुराने टिकटों को एक साथ हटा देगी। आपके एक्टिव (Live व Upcoming) टिकट सुरक्षित रहेंगे।
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-red-600/30 cursor-pointer"
              >
                सभी {completedTickets.length} टिकट हटाएं
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print / Export Ticket Modal */}
      <PrintTicketModal
        ticket={selectedPrintTicket}
        onClose={() => setSelectedPrintTicket(null)}
      />
    </div>
  );
};