import React, { useState, useMemo } from 'react';
import {
  Trophy,
  X,
  Search,
  CheckCircle2,
  Users,
  Ticket,
  Target,
  Sparkles,
  Zap,
  RotateCcw,
  ShieldCheck,
  Award,
  Phone,
} from 'lucide-react';
import { GamePrize, TambolaGame, TambolaTicket, User } from '../types';

interface ForcedWinnerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: TambolaGame;
  prize: GamePrize;
  users: User[];
  tickets: TambolaTicket[];
  onSetWinner: (gameId: string, prizeId: string, targetData: {
    targetUserId?: string;
    targetUserName?: string;
    targetUserPhone?: string;
    targetTicketId?: string;
    targetTicketNumber?: number;
    isPreTargeted: boolean;
  }) => Promise<any> | void;
}

export const ForcedWinnerSelectorModal: React.FC<ForcedWinnerSelectorModalProps> = ({
  isOpen,
  onClose,
  game,
  prize,
  users = [],
  tickets = [],
  onSetWinner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'with_tickets' | 'all_users'>('with_tickets');
  const [saving, setSaving] = useState(false);

  // Tickets belonging to this game
  const gameTickets = useMemo(() => {
    return (tickets || []).filter(
      (t) => t && (t.gameId === game.id || !t.gameId) && t.isActive !== false && t.status !== 'disabled'
    );
  }, [tickets, game.id]);

  // Group tickets by userId
  const userTicketsMap = useMemo(() => {
    const map = new Map<string, TambolaTicket[]>();
    gameTickets.forEach((t) => {
      const uId = t.userId || 'unknown';
      if (!map.has(uId)) {
        map.set(uId, []);
      }
      map.get(uId)!.push(t);
    });
    return map;
  }, [gameTickets]);

  // Filter users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (users || []).filter((u) => {
      if (!u) return false;
      const hasTickets = userTicketsMap.has(u.id);
      if (selectedFilter === 'with_tickets' && !hasTickets) return false;

      if (!q) return true;
      const nameMatch = (u.name || '').toLowerCase().includes(q);
      const phoneMatch = (u.phone || '').toLowerCase().includes(q);
      const idMatch = (u.id || '').toLowerCase().includes(q);
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      const tktMatch = (userTicketsMap.get(u.id) || []).some(
        (t) => (t.ticketId || '').toLowerCase().includes(q) || String(t.ticketNumber).includes(q)
      );
      return nameMatch || phoneMatch || idMatch || emailMatch || tktMatch;
    });
  }, [users, userTicketsMap, selectedFilter, searchQuery]);

  if (!isOpen) return null;

  const currentTargetTicketId = prize.targetTicketId;
  const currentTargetUserId = prize.targetUserId;
  const isTargeted = prize.isPreTargeted || !!currentTargetTicketId || !!currentTargetUserId;

  const handleAssignTicket = async (user: User, ticket: TambolaTicket) => {
    setSaving(true);
    try {
      await onSetWinner(game.id, prize.id, {
        targetUserId: user.id,
        targetUserName: user.name,
        targetUserPhone: user.phone,
        targetTicketId: ticket.ticketId,
        targetTicketNumber: ticket.ticketNumber,
        isPreTargeted: true,
      });
      onClose();
    } catch (e) {
      console.error('Error assigning target winner:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleClearTarget = async () => {
    setSaving(true);
    try {
      await onSetWinner(game.id, prize.id, {
        targetUserId: undefined,
        targetUserName: undefined,
        targetUserPhone: undefined,
        targetTicketId: undefined,
        targetTicketNumber: undefined,
        isPreTargeted: false,
      });
      onClose();
    } catch (e) {
      console.error('Error clearing target winner:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border-b border-amber-500/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  एडमिन प्री-सेट विजेता नियंत्रण (Forced Winner)
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {prize.name} (₹{prize.amount.toLocaleString('en-IN')})
              </h3>
              <p className="text-xs text-slate-400">
                गेम: <span className="text-amber-300 font-semibold">{game.title}</span> • तंबोला इसी चुने गए टिकट को यह ईनाम जिताएगा
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Target Banner */}
        {isTargeted && (
          <div className="px-6 py-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs font-bold text-amber-200">
                वर्तमान प्री-सेट विजेता: <span className="text-white font-black">{prize.targetUserName || 'User'}</span> (टिकट #{prize.targetTicketNumber || '?'} - {prize.targetTicketId})
              </span>
            </div>
            <button
              onClick={handleClearTarget}
              disabled={saving}
              className="px-3 py-1 text-xs font-bold text-red-300 hover:text-white bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors border border-red-500/30 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>रैंडम करें (Clear)</span>
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="यूजर का नाम, फोन नंबर, टिकट # या टिकट ID सर्च करें..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFilter('with_tickets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedFilter === 'with_tickets'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>इस गेम में टिकट वाले प्लेयर्स ({Array.from(userTicketsMap.keys()).length})</span>
            </button>
            <button
              onClick={() => setSelectedFilter('all_users')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedFilter === 'all_users'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>सभी रजिस्टर्ड यूजर्स ({users.length})</span>
            </button>
          </div>
        </div>

        {/* Users & Tickets List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">कोई यूजर नहीं मिला</p>
              <p className="text-xs text-slate-500">कृपया अन्य सर्च कीवर्ड का प्रयास करें या 'सभी रजिस्टर्ड यूजर्स' टैब चुनें।</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const uTickets = userTicketsMap.get(user.id) || [];
              const isUserTargeted = prize.targetUserId === user.id;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isUserTargeted
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl object-cover border border-amber-500/30"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{user.name}</h4>
                          {isUserTargeted && (
                            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                              TARGET USER
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {user.phone || 'N/A'}
                          </span>
                          <span>•</span>
                          <span>वॉलेट: ₹{(user.walletBalance || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Count Badge */}
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="bg-purple-900/40 text-purple-300 font-bold px-2.5 py-1 rounded-lg border border-purple-500/30">
                        {uTickets.length} टिकट उपलब्ध
                      </span>
                    </div>
                  </div>

                  {/* Tickets Grid */}
                  {uTickets.length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uTickets.map((tkt) => {
                        const isThisTicketTargeted = prize.targetTicketId === tkt.ticketId;

                        return (
                          <div
                            key={tkt.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                              isThisTicketTargeted
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Ticket className={`w-4 h-4 ${isThisTicketTargeted ? 'text-amber-400' : 'text-slate-400'}`} />
                              <div>
                                <span className="text-xs font-black text-white">टिकट #{tkt.ticketNumber}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({tkt.ticketId})</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAssignTicket(user, tkt)}
                              disabled={saving}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                isThisTicketTargeted
                                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow'
                              }`}
                            >
                              {isThisTicketTargeted ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>चुना गया (ACTIVE)</span>
                                </>
                              ) : (
                                <>
                                  <Target className="w-3.5 h-3.5" />
                                  <span>ईनाम सेट करें</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-500 italic">
                      इस यूजर के पास इस गेम का कोई एक्टिव टिकट नहीं है।
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>स्मार्ट इंजन लाइव नंबर कॉलिंग को इस तरह चलाएगा कि यही टिकट पहला विनर बने।</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
