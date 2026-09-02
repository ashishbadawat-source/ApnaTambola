import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Zap, Flame, CheckCircle, Volume2, X } from 'lucide-react';
import { GamePrize, TambolaTicket } from '../types';
import { WinnerFlashData } from './WinnerCelebrationModal';

export interface FlashWinnerItem {
  id: string;
  winnerName: string;
  prizeName: string;
  prizeAmount: number;
  winningNumber: number;
  ticketNumber: number;
  ticketId: string;
  isCurrentUser: boolean;
  isAutoClaimed?: boolean;
  timestamp: string;
  ticket?: TambolaTicket;
}

interface LiveWinnerFlashTickerProps {
  activeFlash: FlashWinnerItem | null;
  onDismiss?: () => void;
  onViewCelebration?: (data: WinnerFlashData) => void;
  allClaimedPrizes?: GamePrize[];
}

export const LiveWinnerFlashTicker: React.FC<LiveWinnerFlashTickerProps> = ({
  activeFlash,
  onDismiss,
  onViewCelebration,
  allClaimedPrizes = [],
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (activeFlash) {
      setVisible(true);
      // Auto-hide the prominent pulse after 12 seconds
      const timer = setTimeout(() => {
        // Keep in ticker bar but reduce pulse
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [activeFlash]);

  if (!activeFlash) return null;

  return (
    <div
      id="live-winner-flash-banner"
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 shadow-2xl ${
        activeFlash.isCurrentUser
          ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 border-yellow-200 shadow-amber-500/40 animate-pulse'
          : 'bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white border-purple-500/60 shadow-purple-500/30'
      }`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

      <div className="relative p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Icon & Winner Announcement */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-lg ${
              activeFlash.isCurrentUser
                ? 'bg-slate-950 text-amber-400 ring-2 ring-yellow-300 animate-bounce'
                : 'bg-gradient-to-br from-amber-500 to-purple-600 text-white ring-1 ring-purple-400'
            }`}
          >
            🏆
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeFlash.isCurrentUser
                    ? 'bg-slate-950 text-yellow-400'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                ⚡ LIVE WINNER FLASH
              </span>

              {activeFlash.isAutoClaimed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Sparkles className="w-2.5 h-2.5" />
                  🤖 ऑटो मोड (Auto Claimed)
                </span>
              )}

              {activeFlash.isCurrentUser && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-emerald-700 shadow">
                  🎉 YOU WON! आपके वॉलेट में क्रेडिट हुआ!
                </span>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-black tracking-tight drop-shadow truncate">
                <strong className={activeFlash.isCurrentUser ? 'text-slate-950 underline decoration-slate-900' : 'text-amber-300'}>
                  {activeFlash.winnerName}
                </strong>{' '}
                ने जीता{' '}
                <span
                  className={`px-2 py-0.5 rounded-lg font-black text-sm ${
                    activeFlash.isCurrentUser
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-purple-800/80 text-white border border-purple-400/40'
                  }`}
                >
                  {activeFlash.prizeName}
                </span>
              </h4>

              <div className="flex items-center gap-1.5 text-xs font-black">
                <span
                  className={`px-2 py-0.5 rounded-md ${
                    activeFlash.isCurrentUser
                      ? 'bg-slate-950/80 text-yellow-300'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  ₹{(activeFlash?.prizeAmount || 0).toLocaleString('en-IN')}
                </span>

                <span className="text-[11px] opacity-80">
                  • नंबर: <strong className="font-black underline">{activeFlash.winningNumber}</strong> • टिकट #{activeFlash.ticketNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {onViewCelebration && (
            <button
              onClick={() =>
                onViewCelebration({
                  prizeName: activeFlash.prizeName,
                  prizeAmount: activeFlash.prizeAmount,
                  userName: activeFlash.winnerName,
                  ticketId: activeFlash.ticketId,
                  ticketNumber: activeFlash.ticketNumber,
                  winningNumber: activeFlash.winningNumber,
                  ticket: activeFlash.ticket,
                  isCurrentUser: activeFlash.isCurrentUser,
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${
                activeFlash.isCurrentUser
                  ? 'bg-slate-950 text-white hover:bg-slate-900 hover:scale-105'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-105'
              }`}
            >
              🎉 टिकट व विनिंग देखें
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-current opacity-70 hover:opacity-100 transition-all cursor-pointer"
              title="Close banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
