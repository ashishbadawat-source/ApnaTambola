import React, { useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Trophy,
  History,
  CheckCircle2,
  AlertCircle,
  Eye,
  Ticket,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TambolaGame, TambolaTicket, GameWinner } from '../../types';
import { playNumberCallSound, speakNumberCall } from '../../utils/audio';

interface ModuleLiveControlProps {
  games: TambolaGame[];
  tickets: TambolaTicket[];
  selectedGameId?: string;
  onSelectGame?: (gameId: string) => void;
  onStartGame?: (gameId: string) => Promise<void>;
  onStopGame?: (gameId: string, markCompleted?: boolean) => Promise<void>;
  onCallNext: (number?: number, gameId?: string) => void;
  onToggleAuto: (gameId?: string) => void;
  onResetGame: (gameId?: string) => void;
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean>;
}

export const ModuleLiveControl: React.FC<ModuleLiveControlProps> = ({
  games = [],
  tickets = [],
  selectedGameId: propSelectedGameId,
  onSelectGame,
  onStartGame,
  onStopGame,
  onCallNext,
  onToggleAuto,
  onResetGame,
  onUpdateGame,
}) => {
  const safeGames = Array.isArray(games) ? games.filter(Boolean) : [];
  const safeTickets = Array.isArray(tickets) ? tickets.filter(Boolean) : [];

  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    propSelectedGameId || safeGames.find((g) => g.status === 'live')?.id || safeGames[0]?.id || ''
  );
  const selectedGameId = propSelectedGameId || internalSelectedId;

  const handleSelectGame = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectGame) onSelectGame(id);
  };

  const [manualNumberInput, setManualNumberInput] = useState('');
  const [soundVoice, setSoundVoice] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const currentGame = safeGames.find((g) => g.id === selectedGameId) || safeGames.find((g) => g.status === 'live') || safeGames[0];

  const calledNumbers = Array.isArray(currentGame?.calledNumbers) ? currentGame.calledNumbers : [];
  const lastCalledNumber = currentGame?.currentNumber || currentGame?.lastCalledNumber;

  const MIN_TICKETS_TO_START = 100;
  const soldTicketsCount = safeTickets.filter((t) => t.gameId === currentGame?.id).length || currentGame?.soldTickets || currentGame?.totalTicketsSold || 0;
  const isMinTicketsMet = soldTicketsCount >= MIN_TICKETS_TO_START;

  const isLive = currentGame?.status === 'live';
  const isCompleted = currentGame?.status === 'completed';
  const isEnabled = currentGame?.isActive !== false && currentGame?.isGameEnabled !== false;
  const isBookingOpen = currentGame?.bookingOpen !== false && currentGame?.isBookingOpen !== false;

  const handleStartLiveGame = async () => {
    if (!currentGame) return;

    if (soldTicketsCount < MIN_TICKETS_TO_START) {
      const proceed = confirm(
        `⚠️ नियम अलर्ट: गेम शुरू करने के लिए कम से कम 100 टिकट बिकना जरूरी है!\n\nवर्तमान में केवल ${soldTicketsCount}/100 टिकट बिके हैं।\n\nक्या आप अभी भी गेम को लाइव चालू करना चाहते हैं?`
      );
      if (!proceed) return;
    }

    if (onStartGame) {
      await onStartGame(currentGame.id);
    } else if (onUpdateGame) {
      await onUpdateGame(currentGame.id, {
        status: 'live',
        isActive: true,
        isGameEnabled: true,
        bookingOpen: false,
        isBookingOpen: false,
      });
    }
    setStatusNotice(`🟢 गेम "${currentGame.title || 'Tambola Match'}" लाइव चालू कर दिया गया है! बाकी सभी गेम स्वतः STOP रहेंगे।`);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleStopLiveGame = async () => {
    if (!currentGame) return;
    if (confirm(`क्या आप गेम "${currentGame.title || 'Tambola Match'}" का लाइव मोड बंद (LIVE OFF/STOP) करना चाहते हैं?`)) {
      if (onStopGame) {
        await onStopGame(currentGame.id, false);
      } else if (onUpdateGame) {
        await onUpdateGame(currentGame.id, {
          status: 'upcoming',
          isActive: false,
          isGameEnabled: false,
          autoCalling: false,
        });
      }
      setStatusNotice(`🔴 गेम "${currentGame.title || 'Tambola Match'}" का लाइव मोड बंद (STOPPED) कर दिया गया है!`);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  const handlePauseGame = async () => {
    if (!currentGame) return;
    if (onStopGame) {
      await onStopGame(currentGame.id, false);
    } else if (onUpdateGame) {
      await onUpdateGame(currentGame.id, {
        status: 'upcoming',
        autoCalling: false,
      });
    }
    setStatusNotice(`⏸️ गेम "${currentGame.title || 'Tambola Match'}" को रोक दिया गया है (PAUSED / STOPPED).`);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleFinishGame = async () => {
    if (!currentGame) return;
    if (confirm(`क्या आप गेम "${currentGame.title || 'Tambola Match'}" को समाप्त (COMPLETED) घोषित करना चाहते हैं?\n\nइसके बाद कोई अन्य गेम अपने-आप शुरू नहीं होगा। जब तक आप नया गेम लाइव नहीं करते, लाइव रूम STOP रहेगा।`)) {
      if (onStopGame) {
        await onStopGame(currentGame.id, true);
      } else if (onUpdateGame) {
        await onUpdateGame(currentGame.id, {
          status: 'completed',
          autoCalling: false,
        });
      }
      setStatusNotice(`🏁 गेम "${currentGame.title || 'Tambola Match'}" समाप्त (COMPLETED) हो गया है! लाइव रूम STOP मोड में रहेगा जब तक आप अगला गेम शुरू नहीं करते।`);
      setTimeout(() => setStatusNotice(null), 5000);
    }
  };

  const handleToggleBooking = async () => {
    if (!currentGame || !onUpdateGame) return;
    const newBooking = !isBookingOpen;
    await onUpdateGame(currentGame.id, {
      bookingOpen: newBooking,
      isBookingOpen: newBooking,
    });
    setStatusNotice(
      newBooking
        ? `🎟️ "${currentGame.title || 'Tambola Match'}" के लिए टिकट बुकिंग चालू (OPEN) कर दी गई है!`
        : `🔒 "${currentGame.title || 'Tambola Match'}" के लिए टिकट बुकिंग बंद (CLOSED) कर दी गई है!`
    );
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleManualCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGame) return;
    const num = parseInt(manualNumberInput, 10);
    if (!isNaN(num) && num >= 1 && num <= 90) {
      if (calledNumbers.includes(num)) {
        alert(`Number ${num} has already been called!`);
        return;
      }
      onCallNext(num, currentGame.id);
      if (soundVoice) {
        playNumberCallSound();
        speakNumberCall(num);
      }
      setManualNumberInput('');
    }
  };

  const handleBallClick = (num: number) => {
    if (!currentGame || calledNumbers.includes(num)) return;
    onCallNext(num, currentGame.id);
    if (soundVoice) {
      playNumberCallSound();
      speakNumberCall(num);
    }
  };

  // 1-90 Array
  const boardNumbers = Array.from({ length: 90 }, (_, i) => i + 1);

  if (safeGames.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-lg font-black text-white">कोई टूर्नामेंट उपलब्ध नहीं है (No Tournaments Found)</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          लाइव कंट्रोलर का उपयोग करने के लिए कृपया पहले 'Game Management' टैब से एक नया गेम/टूर्नामेंट बनाएं।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Game Selector Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <Radio className="w-6 h-6 text-red-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Live Tambola Game Controller</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  currentGame?.status === 'live'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : currentGame?.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {currentGame?.status === 'live'
                  ? '🔴 ROOM LIVE'
                  : currentGame?.status === 'completed'
                  ? '🏁 FINISHED'
                  : '⏰ SCHEDULED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manual ball picker, automated random generator, live claim validator, and audio voice synthesizer.
            </p>
          </div>
        </div>

        {/* Game Selector & Action Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedGameId}
            onChange={(e) => handleSelectGame(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {safeGames.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} ({(g.status || 'upcoming').toUpperCase()})
              </option>
            ))}
          </select>

          {/* Quick ON / OFF Master Switch for selected game */}
          <button
            onClick={isLive ? handleStopLiveGame : handleStartLiveGame}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition-all cursor-pointer border ${
              isLive
                ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                : isMinTicketsMet
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400/50 shadow-emerald-500/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400/50 shadow-amber-500/30'
            }`}
            title={isLive ? 'गेम को लाइव बंद करें (Turn LIVE OFF / STOP)' : 'गेम को लाइव चालू करें (Turn LIVE ON)'}
          >
            {isLive ? (
              <>
                <Pause className="w-3.5 h-3.5 text-red-400" />
                <span>🔴 STOP GAME (गेम रोकें)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>🟢 START LIVE (गेम शुरू करें)</span>
              </>
            )}
          </button>

          {/* Ticket Booking Toggle */}
          <button
            onClick={handleToggleBooking}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
              isBookingOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 hover:bg-cyan-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/60 hover:bg-amber-500/30'
            }`}
            title={isBookingOpen ? 'टिकट बुकिंग बंद करें (Close Booking)' : 'टिकट बुकिंग चालू करें (Open Booking)'}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>{isBookingOpen ? '🎟️ बुकिंग OPEN' : '🔒 बुकिंग CLOSED'}</span>
          </button>

          {isLive && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePauseGame}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleFinishGame}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Finish</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setSoundVoice(!soundVoice)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              soundVoice
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
            title="Audio voice synthesizer on ball call"
          >
            {soundVoice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Voice {soundVoice ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* ⚠️ Minimum 100 Tickets Rule Progress Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              <span>कम से कम 100 टिकट बिक्री नियम (Minimum 100 Tickets Threshold)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isMinTicketsMet
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {soldTicketsCount}/100 टिकट बिके {isMinTicketsMet ? '✅ लक्ष्य पूरा' : '⏳ बुकिंग जारी'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              नियम: मैच शुरू करने के लिए कम से कम 100 टिकट बिकना जरूरी है ताकि ₹{((currentGame?.ticketPrice || 50) * 100 * 0.7).toLocaleString('en-IN')} का 70% मेगा प्राइज़ पूल बन सके।
            </p>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="w-full sm:w-48 space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>प्रोग्रेस</span>
            <span className={isMinTicketsMet ? 'text-emerald-400 font-black' : 'text-amber-400'}>
              {Math.min(100, Math.round((soldTicketsCount / MIN_TICKETS_TO_START) * 100))}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isMinTicketsMet
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${Math.min(100, (soldTicketsCount / MIN_TICKETS_TO_START) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 🎮 एडमिन गेम चयन व स्टॉप कंट्रोल बोर्ड (Manual Game Selection & Auto-Stop Banner) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <span>🎯 एडमिन मैच नियंत्रण बोर्ड (Manual Match Orchestrator)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                Auto-Stop Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              जिस गेम को आप चुनेंगे वही गेम लाइव चलेगा। गेम खत्म होने पर दूसरा गेम खुद शुरू नहीं होगा, सिस्टम तब तक STOP रहेगा जब तक आप नया गेम शुरू नहीं करते।
            </p>
          </div>
        </div>

        {/* Match selector pills/cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {safeGames.map((g) => {
            const isThisSelected = g.id === currentGame?.id;
            const isThisLive = g.status === 'live';
            const isThisCompleted = g.status === 'completed';
            const ticketsCount = safeTickets.filter((t) => t.gameId === g.id).length || g.soldTickets || g.totalTicketsSold || 0;

            return (
              <div
                key={g.id}
                onClick={() => handleSelectGame(g.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isThisSelected
                    ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-white line-clamp-1">{g.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{g.gameCode}</span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                      isThisLive
                        ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                        : isThisCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isThisLive ? '🔴 LIVE' : isThisCompleted ? '🏁 COMPLETED' : '⏰ SCHEDULED'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>🎟️ {ticketsCount} टिकट</span>
                  <span>🎱 {Array.isArray(g.calledNumbers) ? g.calledNumbers.length : 0}/90 बॉल्स</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {!isThisLive ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectGame(g.id);
                        if (onStartGame) {
                          onStartGame(g.id);
                        } else if (onUpdateGame) {
                          onUpdateGame(g.id, { status: 'live', isActive: true, autoCalling: false, bookingOpen: false });
                        }
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>लाइव चालू करें</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStopGame) {
                          onStopGame(g.id, false);
                        } else if (onUpdateGame) {
                          onUpdateGame(g.id, { status: 'upcoming', autoCalling: false });
                        }
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Pause className="w-3 h-3" />
                      <span>STOP गेम</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {statusNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Main Control Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Prominent Last Called Ball & Auto Engine */}
        <div className="rounded-3xl bg-gradient-to-b from-[#1b1236] to-[#0d091a] border-2 border-amber-400/50 p-6 space-y-6 flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>CURRENT CALLED NUMBER</span>
          </div>

          {/* 3D Ball Sphere */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 text-slate-950 font-black text-6xl flex items-center justify-center shadow-2xl shadow-amber-500/50 border-4 border-amber-200">
              {lastCalledNumber || '--'}
            </div>
            {lastCalledNumber && (
              <span className="absolute -bottom-2 bg-slate-950 text-amber-400 text-[10px] font-black px-3 py-0.5 rounded-full border border-amber-400/40 shadow">
                BALL #{calledNumbers.length}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-300 font-medium">
            Total Called: <strong className="text-emerald-400 font-bold">{calledNumbers.length}</strong> / 90 Numbers
          </div>

          {/* Action Trigger Buttons */}
          <div className="w-full space-y-2.5">
            <button
              onClick={() => {
                if (!currentGame) return;
                onCallNext(undefined, currentGame.id);
                if (soundVoice) {
                  const remaining = Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => !calledNumbers.includes(n));
                  if (remaining.length > 0) {
                    const rnd = remaining[0];
                    playNumberCallSound();
                    speakNumberCall(rnd);
                  }
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>CALL NEXT RANDOM BALL</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleAuto(currentGame?.id)}
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  currentGame?.autoCalling
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-400/40'
                }`}
              >
                {currentGame?.autoCalling ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>PAUSE AUTO</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-purple-300" />
                    <span>AUTO CALL (6s)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (confirm('Reset this game and clear all called balls?')) {
                    onResetGame(currentGame?.id);
                  }
                }}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET BOARD</span>
              </button>
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualCall} className="w-full pt-3 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] text-slate-400 font-bold text-left">Manual Ball Call (1–90):</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={manualNumberInput}
                onChange={(e) => setManualNumberInput(e.target.value)}
                min={1}
                max={90}
                placeholder="Enter 1-90..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-400/30 cursor-pointer"
              >
                Call Ball
              </button>
            </div>
          </form>
        </div>

        {/* Right 2 Cols: 1–90 Master Housie Board Grid */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Interactive 1–90 Housie Board</h3>
              <span className="text-xs text-slate-400">(Click any uncalled number to call)</span>
            </div>
            <span className="text-xs text-emerald-400 font-bold">
              {90 - calledNumbers.length} Balls Remaining
            </span>
          </div>

          {/* 10 x 9 Grid */}
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
            {boardNumbers.map((num) => {
              const isCalled = calledNumbers.includes(num);
              const isLatest = num === lastCalledNumber;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleBallClick(num)}
                  disabled={isCalled}
                  className={`aspect-square rounded-xl text-xs sm:text-sm font-black flex items-center justify-center transition-all ${
                    isLatest
                      ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 scale-105 shadow-lg shadow-amber-500/50 border-2 border-white ring-2 ring-amber-400 animate-bounce'
                      : isCalled
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-not-allowed opacity-90'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-400 hover:text-white hover:bg-slate-800/80 cursor-pointer active:scale-95'
                  }`}
                  title={isCalled ? `Number ${num} already called` : `Click to call ${num}`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Chronological Called Ball Trail */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Call History (Latest first):</span>
              </span>
              <span>{calledNumbers.length} Total</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800/80">
              {calledNumbers.length > 0 ? (
                [...calledNumbers].reverse().map((num, idx) => (
                  <span
                    key={num}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 font-black shadow'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    #{calledNumbers.length - idx}: {num}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic p-1">No balls called yet in this room.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Prize Claim Verification & Winners Log */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Prize Claim & Verification Log</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Automatic algorithm verifies marked numbers against called balls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentGame?.prizes?.map((prz) => {
            const hasWinner = prz.claimedWinners && prz.claimedWinners.length > 0;
            return (
              <div
                key={prz.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                  hasWinner
                    ? 'bg-gradient-to-b from-[#1b1c2b] to-[#101222] border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{prz.name}</span>
                  <span className="text-xs font-black text-amber-400">₹{prz.amount}</span>
                </div>
                <p className="text-[10px] text-slate-400">{prz.description}</p>
                {hasWinner ? (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold space-y-0.5">
                    <div>Winner: <strong>{prz.claimedWinners![0].userName}</strong></div>
                    <div className="text-[9px] text-slate-400 font-mono">Tkt: {prz.claimedWinners![0].ticketId}</div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-bold italic">
                    Unclaimed • Ready for claim
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};