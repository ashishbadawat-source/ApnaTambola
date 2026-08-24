import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  MessageSquare,
  Smartphone,
  Users,
  CheckCircle2,
  Trash2,
  Sparkles,
  Radio,
  Clock,
  Check,
} from 'lucide-react';
import { AdminNotification, User } from '../../types';

interface ModuleNotificationsProps {
  notifications?: AdminNotification[];
  users?: User[];
  onSendNotification?: (notification: Omit<AdminNotification, 'id' | 'sentAt'>) => Promise<boolean>;
  onDeleteNotification?: (id: string) => void;
}

export const ModuleNotifications: React.FC<ModuleNotificationsProps> = ({
  notifications = [],
  users = [],
  onSendNotification,
  onDeleteNotification,
}) => {
  const [notifList, setNotifList] = useState<AdminNotification[]>(() => notifications || []);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'urgent'>('info');
  const [targetAudience, setTargetAudience] = useState<'all' | 'active_players' | 'referrers' | 'single'>('all');
  const [channel, setChannel] = useState<'in_app' | 'push' | 'sms' | 'whatsapp'>('in_app');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync with prop updates if changed externally
  useEffect(() => {
    if (notifications && Array.isArray(notifications)) {
      setNotifList(notifications);
    }
  }, [notifications]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';
      const newNotif: AdminNotification = {
        id: `notif_${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        type,
        targetAudience,
        channel,
        sentAt: nowStr,
        createdAt: new Date().toISOString(),
        status: 'sent',
        readCount: 0,
        totalRecipients: targetAudience === 'all' ? (users?.length || 1) : 1,
      };

      if (onSendNotification) {
        await onSendNotification({
          title: title.trim(),
          message: message.trim(),
          type,
          targetAudience,
          channel,
          readCount: 0,
          totalRecipients: targetAudience === 'all' ? (users?.length || 1) : 1,
        });
      }

      setNotifList((prev) => [newNotif, ...(prev || [])]);
      setTitle('');
      setMessage('');
      const channelLabel = (channel || 'in_app').toUpperCase();
      const targetLabel = (targetAudience || 'all').replace('_', ' ').toUpperCase();
      setSuccessMsg(`Broadcast sent to ${targetLabel} via ${channelLabel}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.warn('Failed to send broadcast:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (id: string) => {
    setNotifList((prev) => (prev || []).filter((n) => n?.id !== id));
    if (onDeleteNotification) onDeleteNotification(id);
  };

  const safeList = (notifList && notifList.length > 0 ? notifList : notifications) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Broadcast &amp; Player Notification Center</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dispatch in-app banners, push alerts, SMS reminders for upcoming jackpot games, and bonus credit notices.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Broadcast Compose Box */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-black text-white">Compose Broadcast Message</h3>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Registered Players ({users?.length || 0})</option>
                <option value="active_players">Active Room Players Only</option>
                <option value="referrers">Top Referrers (MLM)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Delivery Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="in_app">🔔 In-App Bell Notification</option>
                <option value="push">📱 Browser Push Alert</option>
                <option value="sms">💬 SMS Broadcast</option>
                <option value="whatsapp">🟢 WhatsApp Alert</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Priority / Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="info">Info / Announcement</option>
                <option value="success">Success / Prize Alert</option>
                <option value="urgent">Urgent / Tournament Starting</option>
                <option value="warning">Warning / Maintenance</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-bold">Headline / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="E.g. 🏆 Mega ₹50,000 Housie Game Starts in 15 Minutes!"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-bold">Message Content</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={3}
              placeholder="Type your alert message here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending...' : 'Broadcast Notification Now'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sent Notifications History */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
        <h3 className="text-base font-black text-white">Broadcast History Log</h3>

        {safeList.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-semibold">
            कोई ब्रॉडकास्ट संदेश नहीं है। ऊपर दिए गए फ़ॉर्म से पहला ब्रॉडकास्ट भेजें।
          </div>
        ) : (
          <div className="space-y-3">
            {safeList.map((n) => {
              if (!n) return null;
              const notifType = n.type || 'info';
              const notifChannel = (n.channel || 'in_app').toUpperCase();
              const notifTarget = (n.targetAudience || 'all').replace('_', ' ').toUpperCase();
              const notifDate = n.sentAt || n.createdAt || 'Recent';

              return (
                <div
                  key={n.id || `notif_${Math.random()}`}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          notifType === 'urgent'
                            ? 'bg-red-500/20 text-red-300'
                            : notifType === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : notifType === 'warning'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {notifType}
                      </span>
                      <span className="font-bold text-white text-xs">{n.title || 'Broadcast Alert'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">• {notifDate}</span>
                    </div>
                    <p className="text-xs text-slate-300">{n.message || ''}</p>
                    <div className="text-[10px] text-slate-400">
                      Channel: <strong className="text-slate-200">{notifChannel}</strong> • Target:{' '}
                      <strong className="text-slate-200">{notifTarget}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
                    title="Delete Broadcast"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
