import React, { useState } from 'react';
import {
  Trophy,
  Sparkles,
  Search,
  Award,
  Calendar,
  Ticket,
  Eye,
  Trash2,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { GameWinner, TambolaTicket, User } from '../types';
import { generateTambolaTicketMatrix } from '../utils/tambolaTicket';

interface WinnersViewProps {
  winners: GameWinner[];
  tickets?: TambolaTicket[];
  currentUser?: User | null;
  onDeleteWinner?: (winnerId: string) => Promise<boolean> | void;
  onNavigate?: (tab: string) => void;
}

export const WinnersView: React.FC<WinnersViewProps> = ({
  winners = [],
  tickets = [],
  currentUser,
  onDeleteWinner,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [prizeFilter, setPrizeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [viewingTicketModal, setViewingTicketModal] = useState<{
    winner: GameWinner;
    ticket?: TambolaTicket;
  } | null>(null);
  const [deleteConfirmWinner, setDeleteConfirmWinner] = useState<GameWinner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email === 'ashishbadawat@gmail.com' ||
    currentUser?.email?.includes('admin') ||
    currentUser?.id === 'admin_master_1';

  const safeWinners = Array.isArray(winners) ? winners : [];

  const filteredWinners = safeWinners.filter((w) => {
    if (!w) return false;
    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (w.userName && w.userName.toLowerCase().includes(q)) ||
      (w.gameTitle && w.gameTitle.toLowerCase().includes(q)) ||
      (w.ticketId && w.ticketId.toLowerCase().includes(q)) ||
      (w.prizeName && w.prizeName.toLowerCase().includes(q)) ||
      String(w.winningNumber || '').includes(q);
    const matchesPrize = prizeFilter === 'all' || w.prizeCode === prizeFilter;
    return matchesSearch && matchesPrize;
  });

  const totalPrizePaid = safeWinners.reduce((acc, w) => acc + (Number(w?.prizeAmount) || 0), 0);

  const handleInspectTicket = (winner: GameWinner) => {
    const matched = (tickets || []).find(
      (t) =>
        t.id === winner.ticketId ||
        t.ticketId === winner.ticketId ||
        (t.ticketNumber === winner.ticketNumber && (t.gameId === winner.gameId || t.gameTitle === winner.gameTitle))
    );
    setViewingTicketModal({
      winner,
      ticket: matched,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmWinner) return;
    setIsDeleting(true);
    try {
      if (onDeleteWinner) {
        await onDeleteWinner(deleteConfirmWinner.id);
      }
      setNotice(`✓ विजेता रिकॉर्ड (${deleteConfirmWinner.userName} - ${deleteConfirmWinner.prizeName}) सफलतापूर्वक हटा दिया गया!`);
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmWinner(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredWinners.length === 0) return;
    let csv = 'Sr,Winner Name,User ID,Game Title,Ticket ID,Ticket No,Prize Name,Amount (INR),Winning Ball,Date\n';
    filteredWinners.forEach((w, idx) => {
      const cleanGame = (w.gameTitle || '').replace(/,/g, ' ');
      const cleanPrize = (w.prizeName || '').replace(/,/g, ' ');
      const cleanUser = (w.userName || '').replace(/,/g, ' ');
      csv += `${idx + 1},"${cleanUser}","${w.userId || ''}","${cleanGame}","${w.ticketId || ''}",${w.ticketNumber || 1},"${cleanPrize}",${w.prizeAmount || 0},${w.winningNumber || 0},"${w.date || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tambola_winners_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
              Hall of Winners &amp; Tickets (विजेता सूची)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            प्रत्येक मैच के सत्यापित विजेता, उनके विजयी टिकट (Ticket ID / Matrix) और जीती गई प्राइज राशि।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-right self-start sm:self-auto shadow-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payouts Released</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
              ₹{(totalPrizePaid || 0).toLocaleString('en-IN')}
            </span>
          </div>

          {isAdmin && onNavigate && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-2 rounded-2xl bg-purple-950 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>एडमिन लेजर खोलें</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="खिलाड़ी, गेम नाम या टिकट ID (TKT-xxx) खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'all', label: 'All Prizes' },
              { id: 'full_house', label: 'Full House' },
              { id: 'early5', label: 'Early 5' },
              { id: 'top_line', label: 'Top Line' },
              { id: 'mid_line', label: 'Mid Line' },
              { id: 'bot_line', label: 'Bot Line' },
              { id: 'corners', label: 'Corners' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setPrizeFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                  prizeFilter === cat.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                कार्ड्स
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                तालिका
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={filteredWinners.length === 0}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 disabled:opacity-40"
              title="CSV डाउनलोड करें"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Winners Display */}
      {filteredWinners.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">कोई विजेता नहीं मिला</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || prizeFilter !== 'all'
              ? 'खोज या फ़िल्टर के अनुसार कोई विजेता उपलब्ध नहीं है।'
              : 'अभी तक कोई विजेता रिकॉर्ड नहीं है। लाइव मैच समाप्त होने पर विजेता यहाँ दिखेंगे।'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWinners.map((w, index) => (
            <div
              key={w.id || index}
              className="glass-panel-gold rounded-3xl p-5 border border-amber-400/40 shadow-xl space-y-3.5 relative overflow-hidden transition-all hover:border-amber-400"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md border border-amber-300">
                    {String(w?.userName || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100 leading-tight">
                      {w.userName || 'विजेता'}
                    </h3>
                    <span className="text-[11px] text-amber-300 font-semibold block">
                      {w.prizeName || 'Prize'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-amber-400 font-mono block">
                    +₹{(w?.prizeAmount || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.2 rounded-full border border-emerald-500/30 inline-block">
                    ✓ Paid
                  </span>
                </div>
              </div>

              {/* Ticket Details Box */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">टूर्नामेंट:</span>
                  <span className="truncate max-w-[170px] text-slate-200 font-bold">
                    {w.gameTitle}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">विजेता टिकट ID:</span>
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{w.ticketId || `#${w.ticketNumber}`}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">विनिंग बॉल:</span>
                  <span className="text-slate-950 bg-amber-400 px-1.5 py-0.2 rounded font-black text-[11px]">
                    Ball #{w.winningNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-500">समय:</span>
                  <span className="text-slate-400">{w.date || w.timestamp || 'Just now'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleInspectTicket(w)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-amber-300 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>🎫 टिकट देखें (View Ticket)</span>
                </button>

                {(isAdmin || onDeleteWinner) && (
                  <button
                    onClick={() => setDeleteConfirmWinner(w)}
                    className="p-2 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 hover:text-white border border-red-500/30 transition-all cursor-pointer"
                    title="इस विजेता को रिमूव करें (Remove)"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">#</th>
                  <th className="p-3">विजेता खिलाड़ी</th>
                  <th className="p-3">टूर्नामेंट</th>
                  <th className="p-3">विजेता टिकट ID व #</th>
                  <th className="p-3">प्राइज प्रकार</th>
                  <th className="p-3 text-right">ईनाम राशि</th>
                  <th className="p-3 text-center">विनिंग बॉल</th>
                  <th className="p-3">तारीख/समय</th>
                  <th className="p-3 text-right">एक्शन</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredWinners.map((w, index) => (
                  <tr key={w.id || index} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 text-slate-500">{index + 1}</td>
                    <td className="p-3 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-400/30 shrink-0">
                          {String(w?.userName || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{w?.userName || 'Unknown Player'}</span>
                          <span className="text-[10px] text-slate-500">ID: {w?.userId || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-sans">
                      <span className="font-bold text-slate-200 block truncate max-w-[150px]">
                        {w.gameTitle}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-300 font-bold">
                          {w.ticketId || `TKT-#${w.ticketNumber}`}
                        </span>
                        <button
                          onClick={() => handleInspectTicket(w)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                          title="टिकट मैट्रिक्स देखें"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 font-bold text-[10px]">
                        {w.prizeName}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-black text-emerald-400 font-mono text-sm">
                        +₹{(w.prizeAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs">
                        #{w.winningNumber}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{w.date || 'Just now'}</td>
                    <td className="p-3 text-right font-sans">
                      {(isAdmin || onDeleteWinner) && (
                        <button
                          onClick={() => setDeleteConfirmWinner(w)}
                          className="px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>रिमूव</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TICKET INSPECTION MODAL */}
      {viewingTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#0e1322] border-2 border-amber-400/60 shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    विजेता टिकट विवरण (Winning Ticket Matrix)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    विजेता: <strong className="text-amber-300">{viewingTicketModal.winner.userName}</strong> | प्राइज: <strong className="text-purple-300">{viewingTicketModal.winner.prizeName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingTicketModal(null)}
                className="p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">टिकट ID</span>
                <span className="font-bold text-amber-300">
                  {viewingTicketModal.winner.ticketId || `#${viewingTicketModal.winner.ticketNumber}`}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ईनाम राशि</span>
                <span className="font-bold text-emerald-400">
                  ₹{(viewingTicketModal.winner.prizeAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">विनिंग बॉल</span>
                <span className="font-bold text-amber-400">
                  #{viewingTicketModal.winner.winningNumber}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">तारीख/समय</span>
                <span className="font-bold text-slate-300">
                  {viewingTicketModal.winner.date || 'Today'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                🎫 3×9 टिकट मैट्रिक्स (15 Numbers Grid):
              </span>
              <div className="border-2 border-amber-400/50 rounded-2xl p-3 sm:p-4 bg-gradient-to-b from-[#1b1f30] to-[#0d101b] shadow-inner">
                <div className="grid grid-cols-9 gap-1 sm:gap-1.5 text-center font-bold text-xs sm:text-sm font-mono">
                  {(
                    Array.isArray(viewingTicketModal.ticket?.numbers) &&
                    viewingTicketModal.ticket?.numbers.length === 3
                      ? viewingTicketModal.ticket?.numbers
                      : generateTambolaTicketMatrix()
                  ).map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                      {Array.isArray(row) &&
                        row.map((val, cIdx) => {
                          const isWinBall = val === viewingTicketModal.winner.winningNumber;
                          const isMarked =
                            viewingTicketModal.ticket?.markedNumbers?.includes(val) || isWinBall;
                          return (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className={`h-9 sm:h-11 flex items-center justify-center rounded-lg border transition-all ${
                                val === 0
                                  ? 'bg-slate-900/40 border-slate-800/40 text-transparent select-none'
                                  : isWinBall
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 border-amber-200 font-black shadow-lg scale-105 ring-2 ring-amber-300 animate-pulse'
                                  : isMarked
                                  ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                                  : 'bg-slate-900 text-slate-200 border-slate-700/80'
                              }`}
                            >
                              {val !== 0 ? val : ''}
                            </div>
                          );
                        })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {(isAdmin || onDeleteWinner) && (
                <button
                  onClick={() => {
                    setDeleteConfirmWinner(viewingTicketModal.winner);
                    setViewingTicketModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>यह विजेता रिकॉर्ड रिमूव करें</span>
                </button>
              )}

              <button
                onClick={() => setViewingTicketModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer ml-auto"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border-2 border-red-500/60 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">विजेता रिकॉर्ड रिमूव करें?</h3>
              <p className="text-xs text-slate-300">
                क्या आप सचमुच <strong className="text-amber-300">{deleteConfirmWinner.userName}</strong> का यह विजेता रिकॉर्ड (टिकट: <span className="font-mono text-cyan-300">{deleteConfirmWinner.ticketId}</span>, प्राइज: <span className="text-purple-300">{deleteConfirmWinner.prizeName}</span>) हटाना चाहते हैं?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmWinner(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>हाँ, रिमूव करें</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinnersView;
