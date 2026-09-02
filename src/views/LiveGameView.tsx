import React, { useState, useEffect } from 'react';
import {
  Flame,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Award,
  Ticket as TicketIcon,
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  Radio,
  Sliders,
  ChevronRight,
  Languages,
  Zap,
  Trophy,
} from 'lucide-react';
import { TambolaGame, TambolaTicket, PrizeCode, GameWinner, User } from '../types';
import { NumberBoard } from '../components/NumberBoard';
import { TambolaTicketCard } from '../components/TambolaTicketCard';
import { PrintTicketModal } from '../components/PrintTicketModal';
import { WinnerCelebrationModal, WinnerFlashData } from '../components/WinnerCelebrationModal';
import { LiveWinnerFlashTicker, FlashWinnerItem } from '../components/LiveWinnerFlashTicker';
import {
  TAMBOLA_NICKNAMES_EN,
  TAMBOLA_NICKNAMES_HI,
  HINDI_NUMBERS,
  VoiceLanguage,
} from '../utils/tambolaNicknames';
import {
  playNumberCallSound,
  speakNumberCall,
  getCallerVoiceLanguage,
  setCallerVoiceLanguage,
} from '../utils/audio';

interface LiveGameViewProps {
  game: TambolaGame;
  userTickets: TambolaTicket[];
  currentUser: User;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  isAdmin: boolean;
  onCallNext: (number?: number) => void;
  onToggleAuto: () => void;
  onResetGame: () => void;
  onClaimPrize: (ticketId: string, prizeCode: PrizeCode) => void;
  onBuyTickets: (gameId: string) => void;
  celebrationData: WinnerFlashData | null;
  setCelebrationData: (data: WinnerFlashData | null) => void;
  onGoToWallet: () => void;
  onToggleAutoMode?: (ticketId: string) => void;
  activeWinnerFlash?: FlashWinnerItem | null;
}

export const LiveGameView: React.FC<LiveGameViewProps> = ({
  game,
  userTickets,
  currentUser,
  soundEnabled,
  setSoundEnabled,
  isAdmin,
  onCallNext,
  onToggleAuto,
  onResetGame,
  onClaimPrize,
  onBuyTickets,
  celebrationData,
  setCelebrationData,
  onGoToWallet,
  onToggleAutoMode,
  activeWinnerFlash,
}) => {
  const [selectedPrintTicket, setSelectedPrintTicket] = useState<TambolaTicket | null>(null);
  const [manualNumberInput, setManualNumberInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tickets' | 'board' | 'prizes'>('tickets');
  const [autoMarkEnabled, setAutoMarkEnabled] = useState<boolean>(true);
  const [voiceLang, setVoiceLang] = useState<VoiceLanguage>(
    game.voiceLanguage || getCallerVoiceLanguage() || 'both'
  );

  // Latest claimed prize for the live flash ticker
  const latestClaimedPrize = (game.prizes || [])
    .filter((p) => p && Array.isArray(p.claimedWinners) && p.claimedWinners.length > 0)
    .sort((a, b) => (b.claimedWinners[0]?.claimedAt || '').localeCompare(a.claimedWinners[0]?.claimedAt || ''))[0];

  const handleLanguageChange = (newLang: VoiceLanguage) => {
    setVoiceLang(newLang);
    setCallerVoiceLanguage(newLang);
    if (game.currentNumber && soundEnabled) {
      speakNumberCall(game.currentNumber, true, newLang);
    }
  };

  // Play sound when currentNumber changes
  useEffect(() => {
    if (game.currentNumber && soundEnabled) {
      playNumberCallSound();
      speakNumberCall(game.currentNumber, soundEnabled, voiceLang);
    }
  }, [game.currentNumber, soundEnabled, voiceLang]);

  const enNickname = game.currentNumber ? TAMBOLA_NICKNAMES_EN[game.currentNumber] || '' : '';
  const hiNickname = game.currentNumber ? TAMBOLA_NICKNAMES_HI[game.currentNumber] || '' : '';
  const hiWord = game.currentNumber ? HINDI_NUMBERS[game.currentNumber] || '' : '';

  // Filter player tickets for this game
  const currentGameTickets = userTickets.filter((t) => t.gameId === game.id);

  const handleManualCall = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(manualNumberInput, 10);
    if (!isNaN(num) && num >= 1 && num <= 90) {
      onCallNext(num);
      setManualNumberInput('');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ⚡ Live Winner Flash Ticker Banner (Instant announcement for all players) */}
      <LiveWinnerFlashTicker
        activeFlash={
          activeWinnerFlash ||
          (latestClaimedPrize && latestClaimedPrize.claimedWinners[0]
            ? {
                id: latestClaimedPrize.id,
                winnerName: latestClaimedPrize.claimedWinners[0].userName,
                prizeName: latestClaimedPrize.name,
                prizeAmount: latestClaimedPrize.amount,
                winningNumber: latestClaimedPrize.claimedWinners[0].winningNumber || 47,
                ticketNumber: latestClaimedPrize.claimedWinners[0].ticketNumber,
                ticketId: latestClaimedPrize.claimedWinners[0].ticketId,
                isCurrentUser: latestClaimedPrize.claimedWinners[0].userId === currentUser.id,
                isAutoClaimed: true,
                timestamp: 'Just now',
              }
            : null)
        }
        onViewCelebration={(data) => setCelebrationData(data)}
        allClaimedPrizes={(game.prizes || []).filter((p) => Array.isArray(p.claimedWinners) && p.claimedWinners.length > 0)}
      />

      {/* Live Header & Game Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-purple-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-red-600/90 text-white font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              <Radio className="w-3.5 h-3.5" /> LIVE ROOM
            </span>
            <span className="font-mono text-xs text-amber-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              {game.gameCode}
            </span>
            <span className="text-xs text-slate-400">
              Ticket: ₹{game.ticketPrice}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100">
            {game.title}
          </h1>
        </div>

        {/* Live Counters & Audio Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300">
              <strong className="text-slate-100">{game.registeredPlayers}</strong> Players
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-amber-500/30 text-xs">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">
              Prize: <strong className="text-amber-300 font-black">₹{game.prizePool.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          {/* Voice Language Selector */}
          <div className="flex items-center bg-slate-950/90 rounded-2xl border border-slate-800 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleLanguageChange('both')}
              className={`px-2 py-1 rounded-xl transition-all cursor-pointer ${
                voiceLang === 'both'
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Bilingual Voice (English + Hindi)"
            >
              🌐 Both
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('hi')}
              className={`px-2 py-1 rounded-xl transition-all cursor-pointer ${
                voiceLang === 'hi'
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hindi Voice Only"
            >
              🇮🇳 हिन्दी
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 rounded-xl transition-all cursor-pointer ${
                voiceLang === 'en'
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="English Voice Only"
            >
              🇬🇧 English
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-purple-600/30 text-amber-300 border-amber-400/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Voice ON' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Arena: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Big Ball Announcement & Master Board */}
        <div className="lg:col-span-7 space-y-6">
          {/* Master Ball Caller Spotlight Card */}
          <div className="relative rounded-3xl glass-panel-gold p-6 sm:p-8 border-2 border-amber-400/50 shadow-2xl text-center space-y-6 overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-amber-500/20 pb-3">
              <span className="uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> LIVE BINGO BALL
              </span>
              <span className="font-mono">
                Drawn: <strong className="text-slate-100">{(game.calledNumbers || []).length}</strong> / 90
              </span>
            </div>

            {/* Giant 3D Glowing Ball */}
            <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-2 shadow-2xl shadow-amber-500/50 flex items-center justify-center animate-in zoom-in-90 duration-300 select-none">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-950 via-[#18112e] to-slate-900 flex flex-col items-center justify-center border-4 border-amber-400/80 shadow-inner">
                <span className="text-4xl sm:text-6xl font-black text-amber-300 tracking-tighter text-glow-gold">
                  {game.currentNumber || '--'}
                </span>
                {game.currentNumber && (
                  <span className="text-[10px] uppercase font-bold text-amber-400/80 mt-1">
                    {hiWord ? `${hiWord} (${game.currentNumber})` : 'TAMBOLA'}
                  </span>
                )}
              </div>
            </div>

            {/* Nickname & Bilingual Voice announcement */}
            <div className="space-y-1.5">
              {game.currentNumber ? (
                <div className="space-y-1">
                  <div className="text-base sm:text-lg font-black text-amber-300">
                    &ldquo;{hiNickname || enNickname}&rdquo;
                  </div>
                  {enNickname && hiNickname && (
                    <div className="text-xs text-slate-300 font-semibold">
                      English: &ldquo;{enNickname}&rdquo;
                    </div>
                  )}
                  <p className="text-xs text-slate-400">
                    Number {game.currentNumber} ({hiWord}) is drawn live. Mark your tickets!
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-base sm:text-lg font-black text-slate-100">
                    Waiting for draw...
                  </div>
                  <p className="text-xs text-slate-400">
                    The host will draw the first ball shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Previous Numbers Strip */}
            <div className="pt-2 border-t border-amber-500/20">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Previous Drawn Numbers:
              </span>
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {(game.previousNumbers || []).length > 0 ? (
                  game.previousNumbers.map((num, idx) => (
                    <div
                      key={idx}
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-purple-800 to-indigo-950 border border-purple-400/50 text-amber-200 font-black text-sm sm:text-base flex items-center justify-center shadow-md shadow-purple-950/50"
                    >
                      {num}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No previous numbers yet</span>
                )}
              </div>
            </div>

            {/* Admin Caller Controls Overlay */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t-2 border-dashed border-amber-400/40 bg-slate-950/60 -mx-6 -mb-6 p-4 sm:p-6 text-left space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" /> Live Admin Caller Controls
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    game.autoCalling ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {game.autoCalling ? 'Auto-Caller Active (6s)' : 'Manual Mode'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onToggleAuto}
                    className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow ${
                      game.autoCalling
                        ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {game.autoCalling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{game.autoCalling ? 'Pause Auto Call' : 'Start Auto Call (6s)'}</span>
                  </button>

                  <button
                    onClick={() => onCallNext()}
                    className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <span>Call Next Ball</span>
                  </button>

                  <button
                    onClick={onResetGame}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Force Specific Number Form */}
                <form onSubmit={handleManualCall} className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="Force Ball # (1-90)"
                    value={manualNumberInput}
                    onChange={(e) => setManualNumberInput(e.target.value)}
                    className="w-40 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Call Specific
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Master 1-90 Board Component */}
          <NumberBoard
            calledNumbers={game.calledNumbers}
            currentNumber={game.currentNumber}
          />
        </div>

        {/* Right Column: Player's Interactive Live Tickets & Prize Pool Board */}
        <div className="lg:col-span-5 space-y-6">
          {/* Prize Rules & Live Claim Status Board */}
          <div className="glass-panel rounded-3xl p-5 border border-purple-500/20 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-100">
                  Game Prizes &amp; Claim Status
                </h3>
              </div>
              <span className="text-[11px] text-amber-300 font-bold">
                Pool: ₹{game.prizePool.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(game.prizes || []).map((prize) => {
                const claimedWinnersList = Array.isArray(prize.claimedWinners) ? prize.claimedWinners : [];
                const isClaimed = claimedWinnersList.length >= prize.maxWinners;
                const winner = claimedWinnersList[0];
                return (
                  <div
                    key={prize.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isClaimed
                        ? 'bg-slate-950/40 border-slate-800 text-slate-500'
                        : 'bg-slate-900/80 border-purple-500/30 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isClaimed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {prize.name}
                      </span>
                      <span className={`font-black ${isClaimed ? 'text-slate-500' : 'text-amber-400'}`}>
                        ₹{prize.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1">
                      <span className="text-slate-400 text-[10px]">{prize.description}</span>
                      {isClaimed ? (
                        <span className="text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Won by {winner?.userName || 'Player'}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold text-[10px] animate-pulse">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player's Tickets Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-slate-100">
                  My Active Tickets ({currentGameTickets.length})
                </h3>
              </div>

              <button
                onClick={() => onBuyTickets(game.id)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                + Buy More Tickets
              </button>
            </div>

            {currentGameTickets.length > 0 ? (
              <div className="space-y-4">
                {currentGameTickets.map((ticket) => (
                  <TambolaTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    calledNumbers={game.calledNumbers}
                    currentNumber={game.currentNumber}
                    showClaimButtons={true}
                    onClaim={(tId, pCode) => onClaimPrize(tId, pCode)}
                    onPrint={(t) => setSelectedPrintTicket(t)}
                    onToggleAutoMode={onToggleAutoMode}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 text-center space-y-4 border border-dashed border-purple-500/40">
                <TicketIcon className="w-12 h-12 text-purple-400 mx-auto opacity-60" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200">No Tickets for this Match</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Buy tickets now for ₹{game.ticketPrice} to mark called numbers in real time and win cash prizes!
                  </p>
                </div>
                <button
                  onClick={() => onBuyTickets(game.id)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all"
                >
                  Buy Ticket Now (₹{game.ticketPrice})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print / QR Code Ticket Modal */}
      <PrintTicketModal
        ticket={selectedPrintTicket}
        onClose={() => setSelectedPrintTicket(null)}
      />

      {/* Winner Celebration Fireworks Modal */}
      <WinnerCelebrationModal
        winnerData={celebrationData}
        onClose={() => setCelebrationData(null)}
        onGoToWallet={onGoToWallet}
      />
    </div>
  );
};
