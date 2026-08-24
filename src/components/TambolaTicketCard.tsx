import React from 'react';
import { Ticket as TicketIcon, CheckCircle2, Printer, Share2, Award, Sparkles, Star, Flame, Trophy, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { TambolaTicket, PrizeCode } from '../types';
import { playDabSound } from '../utils/audio';
import { getTicketTheme, TicketColorThemeId, COLUMN_COLORS } from '../utils/ticketColors';
import { getStarNumbers, generateTambolaTicketMatrix } from '../utils/tambolaTicket';

interface TambolaTicketCardProps {
  ticket: TambolaTicket;
  calledNumbers?: number[];
  currentNumber?: number | null;
  onToggleNumber?: (ticketId: string, num: number) => void;
  onPrint?: (ticket: TambolaTicket) => void;
  onShare?: (ticket: TambolaTicket) => void;
  onClaim?: (ticketId: string, prizeCode: PrizeCode) => void;
  onToggleAutoMode?: (ticketId: string) => void;
  showClaimButtons?: boolean;
  highlightWinning?: boolean;
  compact?: boolean;
  themeOverride?: TicketColorThemeId;
}

export const TambolaTicketCard: React.FC<TambolaTicketCardProps> = ({
  ticket,
  calledNumbers = [],
  currentNumber = null,
  onToggleNumber,
  onPrint,
  onShare,
  onClaim,
  onToggleAutoMode,
  showClaimButtons = false,
  highlightWinning = false,
  compact = false,
  themeOverride,
}) => {
  if (!ticket) {
    return null;
  }

  // Safe Matrix Fallback
  const ticketNumbers =
    Array.isArray(ticket.numbers) && ticket.numbers.length === 3
      ? ticket.numbers
      : generateTambolaTicketMatrix();

  const theme = getTicketTheme(themeOverride || ticket.colorTheme, ticket.ticketNumber || 1);
  const calledSet = new Set(calledNumbers || []);
  const markedSet = new Set(ticket.markedNumbers || []);

  // Calculate stats
  let totalTicketNumbers = 0;
  let markedCount = 0;
  let rowMarkedCounts = [0, 0, 0];

  ticketNumbers.forEach((row, rIdx) => {
    if (Array.isArray(row)) {
      row.forEach((num) => {
        if (num > 0) {
          totalTicketNumbers++;
          if (markedSet.has(num) || calledSet.has(num)) {
            markedCount++;
            if (rowMarkedCounts[rIdx] !== undefined) rowMarkedCounts[rIdx]++;
          }
        }
      });
    }
  });

  const starNums = getStarNumbers(ticketNumbers);
  const starMarkedCount = starNums.filter((n) => markedSet.has(n) || calledSet.has(n)).length;

  const handleCellClick = (num: number) => {
    if (num <= 0) return;
    playDabSound();
    if (onToggleNumber) {
      onToggleNumber(ticket.id, num);
    }
  };

  const isTicketDisabled = ticket.isActive === false || ticket.status === 'disabled' || ticket.status === 'void';
  const ticketIdDisplay = ticket.ticketId || `TKT-${ticket.id?.slice(0, 4) || '1001'}`;
  const gameTitleDisplay = ticket.gameTitle || 'Tambola Live Tournament';

  return (
    <div
      id={`ticket-card-${ticket.ticketId}`}
      className={`relative rounded-3xl overflow-hidden transition-all duration-300 border-2 ticket-perforated ${
        isTicketDisabled
          ? 'border-red-500/70 bg-gradient-to-b from-[#200808] to-[#120505] shadow-2xl opacity-90'
          : highlightWinning
          ? 'ring-4 ring-amber-400 shadow-2xl shadow-amber-500/40 border-amber-400 bg-gradient-to-b from-[#241738] via-[#151a2e] to-[#0c1020] animate-pulse'
          : `${theme.borderClass} ${theme.cardBg} shadow-2xl hover:shadow-3xl`
      }`}
    >
      {/* 🌈 Hologram security strip on the far left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 hologram-strip z-30 opacity-80" />

      {/* 🌟 Top Color Header Banner with authentic perforation tear-off look */}
      <div className={`${isTicketDisabled ? 'bg-gradient-to-r from-red-700 via-rose-800 to-red-900 text-white' : theme.topBarGradient} pl-3.5 pr-3 py-2 flex items-center justify-between text-xs font-black ${isTicketDisabled ? 'text-white' : theme.topBarText} shadow-md border-b border-black/20`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 rounded-lg bg-black/40 flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
            <TicketIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="tracking-wider uppercase font-black text-xs sm:text-sm">
                Ticket #{ticket.ticketNumber}
              </span>
              {isTicketDisabled ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-950 text-red-200 font-black border border-red-400/50">
                  🚫 बंद / VOID
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-bold backdrop-blur-sm hidden sm:inline-block border border-white/20">
                  {theme.badgeLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Brand Stamp & Price */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs">
          {isTicketDisabled ? (
            <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-200 font-black text-[10px] sm:text-xs tracking-wider border border-red-500/50">
              🔴 TICKET DISABLED
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-black/60 text-amber-300 font-black text-[10px] sm:text-xs tracking-wider border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>अपना तंबोला</span>
            </span>
          )}
          <span className={`px-2 py-0.5 rounded font-black ${isTicketDisabled ? 'bg-black/50 text-red-300' : theme.ticketIdBadge}`}>
            {ticketIdDisplay}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${isTicketDisabled ? 'bg-black/50 text-slate-400' : theme.priceBadge}`}>
            ₹{ticket.price ?? 10}
          </span>
        </div>
      </div>

      {/* Disabled Ticket Banner notice if turned off */}
      {isTicketDisabled && (
        <div className="bg-red-950/90 border-b border-red-500/50 px-4 py-1.5 text-[11px] font-bold text-red-200 flex items-center justify-between">
          <span>⚠️ यह टिकट एडमिन द्वारा बंद (Inactive/Void) कर दिया गया है।</span>
          <span className="bg-red-900/80 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-black">OFF / DISABLED</span>
        </div>
      )}

      {/* Ticket Body */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Game Title & Progress Bar & Auto Mode Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 truncate max-w-[230px]">
            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/30" style={{ backgroundColor: theme.previewHex }} />
            <span className="text-slate-100 font-black truncate text-xs sm:text-sm">
              {gameTitleDisplay}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 🤖 Auto Mode (ऑटो मोड) Toggle */}
            {onToggleAutoMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAutoMode(ticket.id);
                }}
                className={`px-2 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 transition-all cursor-pointer border ${
                  ticket.autoMode !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-sm shadow-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="ऑटो मोड: यदि आप ऑफलाइन हों तो भी सिस्टम आपके लिए नंबर ट्रैक करेगा और ईनाम आने पर आपके विथड्रॉल वॉलेट में जमा कर देगा।"
              >
                <Zap className={`w-3 h-3 ${ticket.autoMode !== false ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'}`} />
                <span>ऑटो:</span>
                <span className={ticket.autoMode !== false ? 'text-emerald-300 font-black' : 'text-slate-400'}>
                  {ticket.autoMode !== false ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            <span
              className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                markedCount >= 15
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-bounce'
                  : markedCount >= 10
                  ? `${theme.progressBadge} font-black ring-1 ring-amber-400/50`
                  : `${theme.progressBadge}`
              }`}
            >
              {markedCount}/15 Marked {markedCount === 15 ? '🎉 FULL HOUSE' : ''}
            </span>
          </div>
        </div>

        {/* 3x9 Color-Coordinated Rainbow Tambola Grid */}
        <div className="rounded-2xl p-1.5 sm:p-2.5 border-2 border-amber-400/50 bg-gradient-to-b from-[#180f28] via-[#0e0a1a] to-[#080510] shadow-2xl relative overflow-hidden">
          {/* Subtle background brand watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none text-2xl sm:text-3xl font-black uppercase text-amber-300 tracking-widest rotate-[-10deg]">
            ★ APNA TAMBOLA ★
          </div>

          <div className="grid grid-rows-3 gap-1.5 sm:gap-2 select-none relative z-10">
            {ticketNumbers.map((row, rowIdx) => {
              const rowTheme = theme.rows?.[rowIdx as 0 | 1 | 2];
              return (
                <div key={rowIdx} className="grid grid-cols-9 gap-1 sm:gap-2">
                  {row.map((num, colIdx) => {
                    const isNumber = num > 0;
                    const isCalled = isNumber && calledSet.has(num);
                    const isUserMarked = isNumber && markedSet.has(num);
                    const isCurrent = isNumber && currentNumber === num;
                    const isDabbed = isCalled || isUserMarked;
                    const colTheme = COLUMN_COLORS[colIdx] || COLUMN_COLORS[0];

                    if (!isNumber) {
                      return (
                        <div
                          key={colIdx}
                          className={`h-9 sm:h-12 rounded-xl ${rowTheme?.blankBg || theme.cellBlankBg} border flex flex-col items-center justify-center p-0.5 transition-all opacity-85 select-none`}
                          title="खाली स्थान / अपना तंबोला"
                        >
                          <span className="text-[8px] sm:text-[9px] font-black text-amber-300/80 leading-none tracking-tighter text-center">
                            अपना
                          </span>
                          <span className="text-[7px] sm:text-[8px] font-black text-amber-400/90 leading-none tracking-tighter text-center mt-0.5">
                            तंबोला
                          </span>
                          <Star className="w-2.5 h-2.5 text-amber-400/50 fill-amber-400/30 mt-0.5" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={colIdx}
                        id={`ticket-${ticket.ticketId}-cell-${num}`}
                        onClick={() => handleCellClick(num)}
                        className={`relative h-9 sm:h-12 rounded-xl font-black text-xs sm:text-base flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                          isCurrent
                            ? 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400 text-slate-950 scale-110 z-20 animate-bounce shadow-xl ring-4 ring-yellow-300 font-black'
                            : isDabbed
                            ? `${colTheme.dabbed} border-2 scale-[1.03] stamp-dabbed z-10 shadow-md`
                            : `${colTheme.cellBg} border-2 hover:brightness-125 hover:scale-105 shadow-sm`
                        }`}
                      >
                        <span className="drop-shadow-sm font-black">{num}</span>
                        {isDabbed && !isCurrent && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border border-white/40">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* 🏆 Claim Buttons (Shown in live game mode) with 1st Full House & 2nd Full House */}
        {showClaimButtons && onClaim && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-300">
                <Trophy className="w-3.5 h-3.5" />
                <span>क्लेम प्राइज (Claim Prize)</span>
              </span>
              {isTicketDisabled ? (
                <span className="text-red-400 font-bold text-[10px] flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  🚫 Ticket Disabled
                </span>
              ) : (
                <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" /> Auto-Verified
                </span>
              )}
            </div>

            {isTicketDisabled ? (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-center text-xs text-red-300 font-bold">
                ⚠️ यह टिकट एडमिन द्वारा बंद (Inactive/Void) है। इस टिकट से ईनाम क्लेम नहीं किया जा सकता।
              </div>
            ) : (
              /* Prize Buttons Grid (7 Standard Prizes) */
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                <button
                  onClick={() => onClaim(ticket.id, 'early5')}
                  className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    markedCount >= 5
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 ring-1 ring-amber-300 hover:scale-105 animate-pulse'
                      : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                  title="1. जल्दी 5 / Early 5 (Any first 5 numbers marked)"
                >
                  1. Early 5 {markedCount >= 5 ? '🔥' : ''}
                </button>

                <button
                  onClick={() => onClaim(ticket.id, 'star')}
                  className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    starMarkedCount === 5
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-yellow-500/30 ring-1 ring-yellow-300 hover:scale-105 animate-pulse'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:text-white'
                  }`}
                  title="2. स्टार / Star (4 Corners + 1 Center Middle number)"
                >
                  2. Star {starMarkedCount === 5 ? '⭐' : ''}
                </button>

                <button
                  onClick={() => onClaim(ticket.id, 'top_line')}
                  className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    rowMarkedCounts[0] === 5
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow ring-1 ring-emerald-300 hover:scale-105 animate-pulse'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                  title="3. पहली लाइन / Top Line (Row 1 Complete - 5 numbers)"
                >
                  3. Top Line {rowMarkedCounts[0] === 5 ? '✨' : ''}
                </button>

                <button
                  onClick={() => onClaim(ticket.id, 'mid_line')}
                  className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    rowMarkedCounts[1] === 5
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow ring-1 ring-emerald-300 hover:scale-105 animate-pulse'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                  title="4. दूसरी लाइन / Middle Line (Row 2 Complete - 5 numbers)"
                >
                  4. Mid Line {rowMarkedCounts[1] === 5 ? '✨' : ''}
                </button>

                <button
                  onClick={() => onClaim(ticket.id, 'bot_line')}
                  className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    rowMarkedCounts[2] === 5
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow ring-1 ring-emerald-300 hover:scale-105 animate-pulse'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                  title="5. तीसरी लाइन / Bottom Line (Row 3 Complete - 5 numbers)"
                >
                  5. Bot Line {rowMarkedCounts[2] === 5 ? '✨' : ''}
                </button>

                {/* 🥇 6. 1st Full House (पहला फुलहाउस) */}
                <button
                  onClick={() => onClaim(ticket.id, 'full_house')}
                  className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    markedCount === 15
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/50 ring-2 ring-yellow-300 animate-pulse hover:scale-105'
                      : 'bg-gradient-to-r from-amber-950/60 to-yellow-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60'
                  }`}
                  title="6. पहला फुलहाउस / 1st Full House (All 15 Numbers - 1st Winner)"
                >
                  6. 1st FH 🏆
                </button>

                {/* 🥈 7. 2nd Full House (दूसरा फुलहाउस) */}
                <button
                  onClick={() => onClaim(ticket.id, 'second_full_house')}
                  className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    markedCount === 15
                      ? 'bg-gradient-to-r from-slate-200 via-gray-300 to-slate-400 text-slate-950 shadow-lg ring-2 ring-white hover:scale-105 animate-pulse'
                      : 'bg-slate-900/90 text-purple-300 border border-purple-500/40 hover:bg-purple-950/60'
                  }`}
                  title="7. दूसरा फुलहाउस / 2nd Full House (All 15 Numbers - 2nd Winner)"
                >
                  7. 2nd FH 🥈
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[10px] text-amber-400/80 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>अपना तंबोला • 100% VERIFIED</span>
          </span>

          <div className="flex items-center gap-1.5">
            {onPrint && (
              <button
                onClick={() => onPrint(ticket)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold border border-slate-800 cursor-pointer"
                title="Print / Download Ticket"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Print / QR</span>
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(ticket)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800 cursor-pointer"
                title="Share Ticket"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

