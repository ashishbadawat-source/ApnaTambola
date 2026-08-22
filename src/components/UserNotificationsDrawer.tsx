import React, { useState } from 'react';
import {
  Bell,
  X,
  Radio,
  Ticket,
  Trophy,
  Gift,
  CreditCard,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Volume2,
  VolumeX,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface UserNotificationItem {
  id: string;
  category: 'game_start' | 'ticket_confirmation' | 'winning' | 'referral_commission' | 'withdrawal_status' | 'wallet_credit' | 'p2p_transfer';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionTab?: string;
  actionGameId?: string;
  amount?: number;
  ticketId?: string;
  utr?: string;
}

interface UserNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (tab: string, gameId?: string) => void;
}

export const UserNotificationsDrawer: React.FC<UserNotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'game' | 'ticket' | 'winning' | 'referral' | 'wallet'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'game') return n.category === 'game_start';
    if (activeFilter === 'ticket') return n.category === 'ticket_confirmation';
    if (activeFilter === 'winning') return n.category === 'winning';
    if (activeFilter === 'referral') return n.category === 'referral_commission';
    if (activeFilter === 'wallet') return n.category === 'withdrawal_status';
    return true;
  });

  const getCategoryIcon = (cat: UserNotificationItem['category']) => {
    switch (cat) {
      case 'game_start':
        return <Radio className="w-4 h-4 text-red-400 animate-pulse" />;
      case 'ticket_confirmation':
        return <Ticket className="w-4 h-4 text-purple-400" />;
      case 'winning':
        return <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />;
      case 'referral_commission':
        return <Gift className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal_status':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const getCategoryBadge = (cat: UserNotificationItem['category']) => {
    switch (cat) {
      case 'game_start':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'ticket_confirmation':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'winning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'referral_commission':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'withdrawal_status':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getCategoryLabel = (cat: UserNotificationItem['category']) => {
    switch (cat) {
      case 'game_start':
        return 'Game Start';
      case 'ticket_confirmation':
        return 'Ticket Confirmed';
      case 'winning':
        return 'Winner Alert';
      case 'referral_commission':
        return 'Referral Income';
      case 'withdrawal_status':
        return 'Payout Update';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0d1222] border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Game alerts, winnings, and payout statuses</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Strip */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={onMarkAllAsRead}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
            <button
              onClick={onClearAll}
              className="text-slate-400 hover:text-red-400 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'game', label: '🎮 Games' },
              { id: 'winning', label: '🏆 Winnings' },
              { id: 'ticket', label: '🎟️ Tickets' },
              { id: 'referral', label: '💰 Referrals' },
              { id: 'wallet', label: '💳 Payouts' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all text-[11px] cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onMarkAsRead(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 relative group cursor-pointer ${
                    item.read
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-80'
                      : 'bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 border-purple-500/40 shadow-lg'
                  }`}
                >
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-3.5 right-3.5 animate-ping" />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryBadge(item.category)}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-1">{item.title}</h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-1">{item.message}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>

                    <div className="flex items-center gap-2">
                      {item.actionTab && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(item.id);
                            onClose();
                            onNavigate(item.actionTab!, item.actionGameId);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-transform active:scale-95"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(item.id);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 space-y-3">
                <Bell className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No Notifications</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  You are all caught up! You'll receive real-time updates for game starts, wins, and ticket confirmations here.
                </p>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              🔔 Real-time alerts powered by Tambola Live Notification Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
