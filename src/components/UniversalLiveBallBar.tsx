import React, { useState, useEffect } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  Sparkles,
  Zap,
  Flame,
  Award,
  ChevronRight,
  Eye,
  Languages,
} from 'lucide-react';
import { TambolaGame } from '../types';
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

interface UniversalLiveBallBarProps {
  game?: TambolaGame;
  allGames: TambolaGame[];
  activeTab: string;
  onNavigate: (tab: string, gameId?: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
}

export const UniversalLiveBallBar: React.FC<UniversalLiveBallBarProps> = ({
  game,
  allGames,
  activeTab,
  onNavigate,
  soundEnabled,
  setSoundEnabled,
}) => {
  // Find currently active live game if not provided or to ensure freshest
  const activeLiveGame =
    game && game.status === 'live'
      ? game
      : allGames.find((g) => g && g.status === 'live') ||
        (game && Array.isArray(game.calledNumbers) && game.calledNumbers.length > 0 && game.status !== 'completed'
          ? game
          : null);

  const [lastAnimatedNumber, setLastAnimatedNumber] = useState<number | null>(null);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [voiceLang, setVoiceLang] = useState<VoiceLanguage>(() => getCallerVoiceLanguage() || 'both');

  const currentNumber = activeLiveGame?.currentNumber || (activeLiveGame?.calledNumbers && activeLiveGame.calledNumbers.length > 0 ? activeLiveGame.calledNumbers[activeLiveGame.calledNumbers.length - 1] : null);
  const previousNumbers = activeLiveGame?.previousNumbers || (activeLiveGame?.calledNumbers ? activeLiveGame.calledNumbers.slice(-6, -1).reverse() : []);
  const calledCount = activeLiveGame?.calledNumbers?.length || 0;

  // Animate when a new ball arrives
  useEffect(() => {
    if (currentNumber && currentNumber !== lastAnimatedNumber) {
      setLastAnimatedNumber(currentNumber);
      setIsPulsing(true);

      if (soundEnabled) {
        try {
          playNumberCallSound();
          speakNumberCall(currentNumber, soundEnabled, voiceLang);
        } catch (e) {}
      }

      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [currentNumber, soundEnabled, voiceLang, lastAnimatedNumber]);

  if (!activeLiveGame || activeLiveGame.status === 'completed' || activeLiveGame.status === 'cancelled') {
    return null;
  }

  const enNickname = currentNumber ? TAMBOLA_NICKNAMES_EN[currentNumber] || '' : '';
  const hiNickname = currentNumber ? TAMBOLA_NICKNAMES_HI[currentNumber] || '' : '';
  const hiWord = currentNumber ? HINDI_NUMBERS[currentNumber] || '' : '';

  const handleToggleVoiceLang = () => {
    const nextLang: VoiceLanguage = voiceLang === 'hi' ? 'en' : voiceLang === 'en' ? 'both' : 'hi';
    setVoiceLang(nextLang);
    setCallerVoiceLanguage(nextLang);
    if (currentNumber && soundEnabled) {
      speakNumberCall(currentNumber, true, nextLang);
    }
  };

  return (
    <div
      id="universal-live-ball-bar"
      className="w-full mb-4 animate-in fade-in slide-in-from-top-3 duration-500"
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950/90 to-slate-950 border-2 border-red-500/80 shadow-[0_0_35px_rgba(239,68,68,0.35)] p-3 sm:p-4 text-white">
        {/* Glow ambient background beam */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left Column: Live Game Info & Status Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] sm:text-xs tracking-wider uppercase animate-pulse shadow-sm shadow-red-500/50">
                    🔴 LIVE TAMBOLA
                  </span>
                  <span className="text-xs font-bold text-amber-300 truncate max-w-[140px] sm:max-w-[200px]">
                    {activeLiveGame.title}
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {activeLiveGame.gameCode}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                  <span>
                    कुल बॉलें: <strong className="text-amber-400 font-mono">{calledCount} / 90</strong>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    प्राइज: ₹{activeLiveGame.prizePool?.toLocaleString('en-IN') || '10,000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile-only Sound & Language Quick Toggle */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={handleToggleVoiceLang}
                title={`आवाज भाषा: ${voiceLang.toUpperCase()}`}
                className="p-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700"
              >
                <Languages className="w-3 h-3 text-amber-400" />
                <span>{voiceLang === 'both' ? 'हिं+EN' : voiceLang === 'hi' ? 'हिन्दी' : 'ENG'}</span>
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'आवाज म्यूट करें' : 'आवाज चालू करें'}
                className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                  soundEnabled
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Center Column: HUGE CURRENT BALL & PREVIOUS BALLS */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 w-full md:w-auto py-1 sm:py-0">
            {/* 🔴 Current Number Ball Display */}
            <div className="flex items-center gap-2.5 sm:gap-3 bg-slate-900/90 border border-amber-500/40 rounded-2xl px-3 py-1.5 shadow-inner">
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-wider font-black text-amber-400 block leading-none">
                  अभी आई बॉल (Current Ball)
                </span>
                <span className="text-[11px] text-slate-300 font-medium truncate max-w-[110px] sm:max-w-[150px] block mt-0.5">
                  {hiWord ? `${hiWord}` : 'तैयार रहें...'} {hiNickname ? `• ${hiNickname}` : ''}
                </span>
              </div>

              {/* Glowing 3D Sphere for Current Number */}
              <div
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-2xl sm:text-3xl text-slate-950 shadow-2xl transition-all duration-300 ${
                  isPulsing
                    ? 'scale-110 ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-950'
                    : ''
                }`}
                style={{
                  background:
                    'radial-gradient(circle at 35% 35%, #fffde7 0%, #fbbf24 35%, #f59e0b 65%, #b45309 100%)',
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.75), inset 0 2px 4px rgba(255,255,255,0.8)',
                }}
              >
                <span className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                  {currentNumber !== null && currentNumber !== undefined ? currentNumber : '--'}
                </span>
                {isPulsing && (
                  <span className="absolute -top-1 -right-1 text-xs animate-bounce">⚡</span>
                )}
              </div>
            </div>

            {/* ⚪ Previous 5 Balls */}
            {previousNumbers.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-2xl px-2.5 py-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 mr-1 writing-mode-vertical">
                  पिछली बॉलें:
                </span>
                {previousNumbers.slice(0, 5).map((num, idx) => (
                  <div
                    key={`${num}-${idx}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center shadow-md"
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Audio & Go To Live Game Arena CTA Button */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Desktop Sound & Language Toggle */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={handleToggleVoiceLang}
                title={`आवाज भाषा: ${voiceLang.toUpperCase()}`}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-amber-400 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span>{voiceLang === 'both' ? 'हिन्दी + EN' : voiceLang === 'hi' ? 'हिन्दी' : 'English'}</span>
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'आवाज म्यूट करें' : 'आवाज चालू करें'}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  soundEnabled
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Direct Jump Button to Live Arena */}
            <button
              id="btn-join-live-game-universal"
              onClick={() => onNavigate('live', activeLiveGame.id)}
              className="flex-1 md:flex-none px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>
                {activeTab === 'live' ? '🔴 लाइव बोर्ड पर हैं' : '🔴 लाइव मैच खेलें / टिकट देखें'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
