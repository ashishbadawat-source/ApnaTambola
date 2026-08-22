import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X, CheckCircle2, ArrowRight, Zap, Radio, Crown, Star } from 'lucide-react';
import { playWinningFanfare } from '../utils/audio';
import { TambolaTicket } from '../types';
import { getTicketTheme } from '../utils/ticketColors';

export interface WinnerFlashData {
  prizeName: string;
  prizeAmount: number;
  userName: string;
  userAvatar?: string;
  ticketId: string;
  ticketNumber?: number;
  winningNumber?: number;
  ticket?: TambolaTicket;
  calledNumbers?: number[];
  isCurrentUser?: boolean;
}

interface WinnerCelebrationModalProps {
  winnerData: WinnerFlashData | null;
  onClose: () => void;
  onGoToWallet?: () => void;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  winnerData,
  onClose,
  onGoToWallet,
}) => {
  useEffect(() => {
    if (winnerData) {
      playWinningFanfare();

      // Trigger Confetti blast
      const count = 250;
      const defaults = { origin: { y: 0.6 } };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 30, startVelocity: 60 });
      fire(0.2, { spread: 70 });
      fire(0.35, { spread: 120, decay: 0.91, scalar: 0.9 });
      fire(0.1, { spread: 140, startVelocity: 30, decay: 0.92, scalar: 1.3 });
      fire(0.1, { spread: 140, startVelocity: 50 });
    }
  }, [winnerData]);

  if (!winnerData) return null;

  const isSelf = winnerData.isCurrentUser !== false;
  const theme = getTicketTheme(winnerData.ticket?.colorTheme || 'gold', winnerData.ticketNumber || 1);
  const calledSet = new Set(winnerData.calledNumbers || []);

  // Demo ticket matrix if not explicitly passed
  const displayNumbers = winnerData.ticket?.numbers || [
    [7, 0, 23, 0, 41, 0, 62, 75, 0],
    [0, 14, 0, 36, 0, 58, 0, 79, 82],
    [9, 0, 28, 39, 47, 0, 69, 0, 89],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[95vh] overflow-y-auto glass-panel-gold rounded-3xl p-4 sm:p-6 text-center space-y-4 shadow-2xl border-2 border-amber-400/90 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 z-20 cursor-pointer"
          title="Close announcement"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ⚡ Flashing Header Alert Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest animate-pulse shadow-lg shadow-amber-500/30">
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>⚡ LIVE WINNER FLASH • लाइव विजेता फ़्लैश ⚡</span>
          <Radio className="w-4 h-4" />
        </div>

        {/* Winner Hero Block */}
        <div className="space-y-2">
          <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/50 ring-4 ring-amber-300/60">
            <Trophy className="w-9 h-9 sm:w-10 sm:h-10 text-slate-950" />
            <Crown className="w-6 h-6 text-amber-200 absolute -top-2 -right-1 animate-bounce" />
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
              <span>{winnerData.userName}</span>
              {isSelf && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                  YOU! (आप)
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-amber-300">
              Claimed: <span className="text-white underline">{winnerData.prizeName}</span>
            </p>
          </div>
        </div>

        {/* Prize Cash Box */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 border-2 border-amber-400/60 space-y-1">
          <span className="text-[11px] text-amber-300 uppercase font-black tracking-wider">
            🏆 WINNING PRIZE AMOUNT 🏆
          </span>
          <div className="text-3xl sm:text-4xl font-black text-amber-300 text-glow-gold">
            ₹{winnerData.prizeAmount.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSelf ? 'Credited to Your Winning Wallet instantly!' : 'Verified & Credited via Secure RNG!'}</span>
          </div>
        </div>

        {/* 🎟️ THE EXACT FLASHED WINNING TICKET WITH SOLID BOX COLOR */}
        <div className="text-left space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Flashed Winning Ticket (लाइव टिकट):</span>
            </span>
            <span className="font-mono text-amber-400 font-black text-[11px]">
              {winnerData.ticketId}
            </span>
          </div>

          {/* Rendered Live Color Ticket */}
          <div className={`rounded-2xl border-2 ${theme.borderClass} ${theme.cardBg} p-2.5 sm:p-3 space-y-2 shadow-xl ring-2 ring-amber-400/40`}>
            {/* Top Bar */}
            <div className={`${theme.topBarGradient} px-2.5 py-1 rounded-lg flex items-center justify-between text-[11px] font-black ${theme.topBarText}`}>
              <div className="flex items-center gap-1.5">
                <span>TICKET #{winnerData.ticketNumber || 1}</span>
                <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] text-white">
                  {theme.badgeLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-black/50 text-amber-300 px-1.5 py-0.2 rounded text-[10px]">
                  अपना तंबोला
                </span>
                <span className="text-[10px]">{winnerData.ticketId}</span>
              </div>
            </div>

            {/* Grid */}
            <div className={`${theme.gridBg} rounded-xl p-1.5 border ${theme.gridBorder}`}>
              <div className="grid grid-rows-3 gap-1 select-none">
                {displayNumbers.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-9 gap-1">
                    {row.map((num, colIdx) => {
                      const isNumber = num > 0;
                      const isCalled = isNumber && (calledSet.has(num) || calledSet.size === 0 || num === winnerData.winningNumber);
                      const isWinningBall = num === winnerData.winningNumber;

                      if (!isNumber) {
                        return (
                          <div
                            key={colIdx}
                            className={`h-7 sm:h-9 rounded-lg ${theme.cellBlankBg} border border-amber-500/20 flex flex-col items-center justify-center p-0.5`}
                            title="अपना तंबोला"
                          >
                            <span className="text-[7px] sm:text-[8px] font-black text-amber-300/80 leading-none">
                              अपना
                            </span>
                            <span className="text-[6px] sm:text-[7px] font-black text-amber-400/90 leading-none">
                              तंबोला
                            </span>
                            <Star className="w-1.5 h-1.5 text-amber-400/60 fill-amber-400/30" />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={colIdx}
                          className={`relative h-7 sm:h-9 rounded-lg font-black text-[11px] sm:text-xs flex items-center justify-center shadow-sm ${
                            isWinningBall
                              ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 ring-2 ring-white animate-bounce z-10'
                              : isCalled
                              ? `${theme.cellDabbedBg} ${theme.cellDabbedText} border ${theme.cellDabbedBorder}`
                              : `${theme.cellNormalBg} ${theme.cellNormalText} border ${theme.cellNormalBorder}`
                          }`}
                        >
                          <span>{num}</span>
                          {isCalled && !isWinningBall && (
                            <span className="absolute -top-1 -right-0.5 w-3 h-3 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-[7px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {isSelf && onGoToWallet && (
            <button
              onClick={() => {
                onClose();
                onGoToWallet();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
            >
              <span>View In Winning Wallet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
          >
            Continue Live Game (गेम जारी रखें)
          </button>
        </div>
      </div>
    </div>
  );
};

