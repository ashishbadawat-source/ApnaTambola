import React, { useState } from 'react';
import {
  Trophy,
  Trash2,
  Search,
  Filter,
  Calendar,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  User,
  Sparkles,
  Award,
  Check,
  X,
  Printer,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { GameWinner, TambolaTicket, TambolaGame, User as UserType } from '../../types';
import { generateTambolaTicketMatrix } from '../../utils/tambolaTicket';

interface ModuleWinnersProps {
  winners: GameWinner[];
  tickets: TambolaTicket[];
  games: TambolaGame[];
  users?: UserType[];
  onDeleteWinner?: (winnerId: string) => Promise<boolean> | void;
  onBatchDeleteWinners?: (winnerIds: string[]) => Promise<boolean> | void;
  onClearAllWinners?: () => Promise<boolean> | void;
}

export const ModuleWinners: React.FC<ModuleWinnersProps> = ({
  winners = [],
  tickets = [],
  games = [],
  users = [],
  onDeleteWinner,
  onBatchDeleteWinners,
  onClearAllWinners,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('all');
  const [selectedPrizeFilter, setSelectedPrizeFilter] = useState<string>('all');
  const [selectedWinnerIds, setSelectedWinnerIds] = useState<string[]>([]);
  const [viewingTicketModal, setViewingTicketModal] = useState<{
    winner: GameWinner;
    ticket?: TambolaTicket;
  } | null>(null);
  const [deleteConfirmWinner, setDeleteConfirmWinner] = useState<GameWinner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter logic
  const safeWinners = Array.isArray(winners) ? winners : [];
  const filteredWinners = safeWinners.filter((w) => {
    if (!w) return false;
    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (w.userName && w.userName.toLowerCase().includes(q)) ||
      (w.userId && w.userId.toLowerCase().includes(q)) ||
      (w.ticketId && w.ticketId.toLowerCase().includes(q)) ||
      (w.gameTitle && w.gameTitle.toLowerCase().includes(q)) ||
      (w.prizeName && w.prizeName.toLowerCase().includes(q)) ||
      String(w.winningNumber || '').includes(q) ||
      String(w.ticketNumber || '').includes(q);

    const matchesGame =
      selectedGameFilter === 'all' || w.gameId === selectedGameFilter || w.gameTitle === selectedGameFilter;
    const matchesPrize = selectedPrizeFilter === 'all' || w.prizeCode === selectedPrizeFilter;

    return matchesSearch && matchesGame && matchesPrize;
  });

  // Aggregated Stats
  const totalWinnersCount = safeWinners.length;
  const totalPrizePaid = safeWinners.reduce((sum, w) => sum + (Number(w?.prizeAmount) || 0), 0);
  const fullHouseWinnersCount = safeWinners.filter(
    (w) => w?.prizeCode === 'full_house' || w?.prizeCode === 'second_full_house' || w?.prizeCode === 'third_full_house'
  ).length;
  const lineWinnersCount = safeWinners.filter(
    (w) => w?.prizeCode === 'top_line' || w?.prizeCode === 'mid_line' || w?.prizeCode === 'bot_line' || w?.prizeCode === 'early5' || w?.prizeCode === 'corners'
  ).length;

  // Multi-select handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedWinnerIds(filteredWinners.map((w) => w.id));
    } else {
      setSelectedWinnerIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedWinnerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete Individual Winner
  const handleConfirmDelete = async () => {
    if (!deleteConfirmWinner) return;
    setIsDeleting(true);
    try {
      if (onDeleteWinner) {
        await onDeleteWinner(deleteConfirmWinner.id);
      }
      setSelectedWinnerIds((prev) => prev.filter((id) => id !== deleteConfirmWinner.id));
      setActionNotice(`✓ विजेता रिकॉर्ड (${deleteConfirmWinner.userName} - ${deleteConfirmWinner.prizeName}) सफलतापूर्वक रिमूव कर दिया गया!`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmWinner(null);
    }
  };

  // Batch Delete
  const handleExecuteBatchDelete = async () => {
    if (selectedWinnerIds.length === 0) return;
    if (!confirm(`क्या आप सचमुच चुने गए ${selectedWinnerIds.length} विजेता रिकॉर्ड्स को हमेशा के लिए हटाना चाहते हैं?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      if (onBatchDeleteWinners) {
        await onBatchDeleteWinners(selectedWinnerIds);
      } else if (onDeleteWinner) {
        for (const id of selectedWinnerIds) {
          await onDeleteWinner(id);
        }
      }
      const count = selectedWinnerIds.length;
      setSelectedWinnerIds([]);
      setActionNotice(`✓ ${count} विजेता रिकॉर्ड्स सफलतापूर्वक रिमूव कर दिए गए!`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear All
  const handleExecuteClearAll = async () => {
    if (safeWinners.length === 0) return;
    if (!confirm(`⚠️ चेतावनी: क्या आप सभी ${safeWinners.length} विजेताओं का डेटा पूरी तरह साफ़ (Clear All) करना चाहते हैं?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      if (onClearAllWinners) {
        await onClearAllWinners();
      } else if (onBatchDeleteWinners) {
        await onBatchDeleteWinners(safeWinners.map((w) => w.id));
      } else if (onDeleteWinner) {
        for (const w of safeWinners) {
          await onDeleteWinner(w.id);
        }
      }
      setSelectedWinnerIds([]);
      setActionNotice('✓ सभी विजेता रिकॉर्ड्स सफलतापूर्वक साफ़ कर दिए गए!');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Inspect Ticket details
  const handleInspectTicket = (winner: GameWinner) => {
    const matchedTicket = (tickets || []).find(
      (t) =>
        t.id === winner.ticketId ||
        t.ticketId === winner.ticketId ||
        (t.ticketNumber === winner.ticketNumber && (t.gameId === winner.gameId || t.gameTitle === winner.gameTitle))
    );
    setViewingTicketModal({
      winner,
      ticket: matchedTicket,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredWinners.length === 0) return;
    let csv = 'Sr,Winner Name,User ID,Game Title,Ticket ID,Ticket No,Prize Name,Prize Code,Amount (INR),Winning Number,Date\n';
    filteredWinners.forEach((w, idx) => {
      const cleanGame = (w.gameTitle || '').replace(/,/g, ' ');
      const cleanPrize = (w.prizeName || '').replace(/,/g, ' ');
      const cleanUser = (w.userName || '').replace(/,/g, ' ');
      csv += `${idx + 1},"${cleanUser}","${w.userId || ''}","${cleanGame}","${w.ticketId || ''}",${w.ticketNumber || 1},"${cleanPrize}","${w.prizeCode || ''}",${w.prizeAmount || 0},${w.winningNumber || 0},"${w.date || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tambola_winners_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-purple-950/60 border-2 border-amber-400/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>WINNERS & TICKET LEDGER</span>
              </span>
              <span className="text-xs text-slate-400">विजेता एवं टिकट प्रबंधन लेजर</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>विजेताओं की सूची व टिकट विवरण (Winners List)</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              सभी टूर्नामेंट्स में जीतने वाले खिलाड़ी, उनके विजेता टिकट (Ticket ID/Matrix), ईनाम राशि व विनिंग नंबर का पूरा रिकॉर्ड। आवश्यकतानुसार किसी भी विजेता रिकॉर्ड को रिमूव (हटा) सकते हैं।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              disabled={filteredWinners.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="CSV रिपोर्ट डाउनलोड करें"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV एक्सपोर्ट</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="प्रिंट या PDF सेव करें"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>प्रिंट लेजर</span>
            </button>
            {safeWinners.length > 0 && (
              <button
                onClick={handleExecuteClearAll}
                disabled={isDeleting}
                className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="सभी विजेता रिकॉर्ड्स साफ़ करें"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>सभी साफ़ करें</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-400/30 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> कुल विजेता (Total Winners)
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {totalWinnersCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> कुल वितरित ईनाम (Paid Out)
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              ₹{(totalPrizePaid || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-purple-400" /> फुल हाउस विजेता (Full House)
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
              {fullHouseWinnersCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-cyan-400" /> लाइन / अर्ली 5 विजेता
            </span>
            <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
              {lineWinnersCount}
            </span>
          </div>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="खिलाड़ी का नाम, टिकट ID (TKT-xxx), गेम नाम या बॉल नंबर खोजें..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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

          {/* Game Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedGameFilter}
              onChange={(e) => setSelectedGameFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">🎮 सभी टूर्नामेंट्स (All Games)</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>

            {/* Prize Category Filter */}
            <select
              value={selectedPrizeFilter}
              onChange={(e) => setSelectedPrizeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">🏆 सभी प्राइज प्रकार</option>
              <option value="full_house">🏠 1st Full House</option>
              <option value="second_full_house">🏠 2nd Full House</option>
              <option value="third_full_house">🏠 3rd Full House</option>
              <option value="early5">⚡ Early 5 (Jaldi 5)</option>
              <option value="top_line">📍 Top Line</option>
              <option value="mid_line">📍 Middle Line</option>
              <option value="bot_line">📍 Bottom Line</option>
              <option value="corners">⭐ 4 Corners / Star</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
                title="तालिका व्यू (Table)"
              >
                तालिका
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
                title="कार्ड्स व्यू (Cards)"
              >
                कार्ड्स
              </button>
            </div>
          </div>
        </div>

        {/* Batch Selection Bar */}
        {selectedWinnerIds.length > 0 && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-between text-xs font-bold text-red-200 animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-400" />
              <span>{selectedWinnerIds.length} विजेता चुने गए</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedWinnerIds([])}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px]"
              >
                अनचेक करें
              </button>
              <button
                onClick={handleExecuteBatchDelete}
                disabled={isDeleting}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1 shadow cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>चयनित हटाएं ({selectedWinnerIds.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Winners Display */}
      {filteredWinners.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">कोई विजेता रिकॉर्ड नहीं मिला</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || selectedGameFilter !== 'all' || selectedPrizeFilter !== 'all'
              ? 'दिए गए फ़िल्टर के अनुसार कोई विजेता मौजूद नहीं है। कृपया फ़िल्टर बदलें।'
              : 'अभी तक कोई विजेता पंजीकृत नहीं हुआ है। लाइव गेम में टिकट क्लेम होने पर विजेता स्वतः यहाँ जुड़ेंगे।'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredWinners.length > 0 &&
                        selectedWinnerIds.length === filteredWinners.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">#</th>
                  <th className="p-3">विजेता खिलाड़ी (Winner)</th>
                  <th className="p-3">टूर्नामेंट (Game)</th>
                  <th className="p-3">विजेता टिकट (Winning Ticket)</th>
                  <th className="p-3">जीता गया प्राइज (Prize)</th>
                  <th className="p-3 text-right">ईनाम राशि (Won)</th>
                  <th className="p-3 text-center">विनिंग नंबर</th>
                  <th className="p-3">समय (Timestamp)</th>
                  <th className="p-3 text-right">एक्शन (Remove)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredWinners.map((w, index) => {
                  const isSelected = selectedWinnerIds.includes(w.id);
                  return (
                    <tr
                      key={w.id || index}
                      className={`transition-colors ${
                        isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(w.id)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 font-mono text-slate-500">{index + 1}</td>

                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center border border-amber-400 shrink-0">
                            {(w.userName || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{w.userName || 'Player'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {w.userId || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="max-w-[180px]">
                          <span className="font-bold text-slate-200 truncate block">
                            {w.gameTitle || 'Tambola Tournament'}
                          </span>
                          <span className="text-[10px] text-amber-400/80 font-mono">
                            {w.gameId || ''}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[11px] flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{w.ticketId || `TKT-#${w.ticketNumber || 1}`}</span>
                          </div>
                          <button
                            onClick={() => handleInspectTicket(w)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors"
                            title="विजेता टिकट की ग्रिड देखें"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 text-[11px] font-bold">
                          <Award className="w-3 h-3 text-purple-400" />
                          <span>{w.prizeName || 'Prize'}</span>
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <span className="font-black text-emerald-400 font-mono text-sm block">
                          +₹{(w.prizeAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-emerald-500 font-semibold">✓ Paid</span>
                      </td>

                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black font-mono text-xs shadow-sm">
                          #{w.winningNumber || '-'}
                        </span>
                      </td>

                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {w.date || w.timestamp || 'Just now'}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setDeleteConfirmWinner(w)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                          title="इस विजेता को सूची से हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>रिमूव</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWinners.map((w, index) => {
            const isSelected = selectedWinnerIds.includes(w.id);
            return (
              <div
                key={w.id || index}
                className={`rounded-3xl p-5 border transition-all relative overflow-hidden space-y-3.5 ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-400 shadow-xl shadow-amber-950/50'
                    : 'bg-slate-900/90 border-slate-800 hover:border-amber-400/50'
                }`}
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-amber-300 shadow-md shrink-0">
                      {(w.userName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm leading-tight">
                        {w.userName || 'Player'}
                      </h4>
                      <span className="text-[11px] text-amber-300 font-semibold block">
                        {w.prizeName || 'Prize'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-emerald-400 font-mono block">
                      +₹{(w.prizeAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold inline-block">
                      ✓ Paid
                    </span>
                  </div>
                </div>

                {/* Ticket & Details Box */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">टूर्नामेंट:</span>
                    <span className="text-slate-200 font-bold truncate max-w-[170px]">
                      {w.gameTitle}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">विजेता टिकट ID:</span>
                    <span className="text-cyan-300 font-bold flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5" /> {w.ticketId || `Ticket #${w.ticketNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">विनिंग बॉल:</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                      Ball #{w.winningNumber || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[10px]">
                    <span className="text-slate-500">समय:</span>
                    <span className="text-slate-400">{w.date || w.timestamp || 'Just now'}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    onClick={() => handleInspectTicket(w)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>टिकट देखें</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmWinner(w)}
                    className="py-2 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white font-bold text-xs border border-red-500/40 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="इस विजेता को रिमूव करें"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>रिमूव</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TICKET INSPECTION MODAL */}
      {viewingTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#0e1322] border-2 border-amber-400/60 shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in zoom-in-95">
            {/* Modal Header */}
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
                    खिलाड़ी: <strong className="text-amber-300">{viewingTicketModal.winner.userName}</strong> | प्राइज: <strong className="text-purple-300">{viewingTicketModal.winner.prizeName}</strong>
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

            {/* Ticket Info Pills */}
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

            {/* 3x9 Ticket Grid */}
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
                                  : 'bg-slate-900 text-slate-200 border-slate-700/80 hover:border-slate-500'
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

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
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

              <button
                onClick={() => setViewingTicketModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE WINNER DELETE CONFIRMATION MODAL */}
      {deleteConfirmWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border-2 border-red-500/60 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">विजेता रिकॉर्ड रिमूव करें?</h3>
              <p className="text-xs text-slate-300">
                क्या आप सचमुच <strong className="text-amber-300">{deleteConfirmWinner.userName}</strong> का यह विजेता रिकॉर्ड (टिकट: <span className="font-mono text-cyan-300">{deleteConfirmWinner.ticketId}</span>, ईनाम: <span className="text-purple-300">{deleteConfirmWinner.prizeName}</span>) सूची से हटाना चाहते हैं?
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">खिलाड़ी:</span>
                <span className="text-white font-bold">{deleteConfirmWinner.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">टिकट ID:</span>
                <span className="text-cyan-300 font-bold">{deleteConfirmWinner.ticketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ईनाम राशि:</span>
                <span className="text-emerald-400 font-bold">₹{deleteConfirmWinner.prizeAmount}</span>
              </div>
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
export default ModuleWinners;
