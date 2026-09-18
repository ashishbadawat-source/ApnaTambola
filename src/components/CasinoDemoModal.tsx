import React, { useState } from 'react';
import { X, Sparkles, Trophy, RotateCcw, Volume2, VolumeX, ShieldCheck, ArrowRight } from 'lucide-react';
import { playWinningFanfare } from '../utils/audio';

interface CasinoDemoModalProps {
  gameName: string;
  gameType: 'slot' | 'dragontiger' | 'roulette';
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const SLOT_ICONS = ['💎', '👑', '7️⃣', '🍒', '🔔', '🍀', '⭐'];

export const CasinoDemoModal: React.FC<CasinoDemoModalProps> = ({
  gameName,
  gameType,
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  // Slot states
  const [reels, setReels] = useState<string[]>(['👑', '7️⃣', '💎']);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [demoCoins, setDemoCoins] = useState<number>(1000);
  const [winMessage, setWinMessage] = useState<string>('');

  // Dragon Tiger states
  const [dtResult, setDtResult] = useState<{ dragon: number; tiger: number; winner: string } | null>(null);
  const [dtBet, setDtBet] = useState<'dragon' | 'tiger' | 'tie'>('dragon');

  // Spin Slot
  const handleSpin = () => {
    if (isSpinning || demoCoins < 50) return;
    setIsSpinning(true);
    setWinMessage('');
    setDemoCoins((prev) => prev - 50);

    let count = 0;
    const interval = setInterval(() => {
      setReels([
        SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)],
        SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)],
        SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)],
      ]);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const final1 = SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)];
        const final2 = Math.random() < 0.35 ? final1 : SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)];
        const final3 = Math.random() < 0.25 ? final1 : SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)];
        const finalReels = [final1, final2, final3];
        setReels(finalReels);
        setIsSpinning(false);

        if (final1 === final2 && final2 === final3) {
          setDemoCoins((prev) => prev + 500);
          setWinMessage('🎉 JACKPOT! 3 मैच! +500 कॉइन्स!');
          playWinningFanfare();
        } else if (final1 === final2 || final2 === final3 || final1 === final3) {
          setDemoCoins((prev) => prev + 100);
          setWinMessage('✨ बढ़िया! 2 मैच! +100 कॉइन्स!');
        } else {
          setWinMessage('अगली बार फिर कोशिश करें!');
        }
      }
    }, 80);
  };

  // Dragon Tiger Deal
  const handleDealDT = () => {
    if (isSpinning || demoCoins < 50) return;
    setIsSpinning(true);
    setWinMessage('');
    setDemoCoins((prev) => prev - 50);

    setTimeout(() => {
      const dragonCard = Math.floor(Math.random() * 13) + 1;
      const tigerCard = Math.floor(Math.random() * 13) + 1;
      let winner = 'tie';
      if (dragonCard > tigerCard) winner = 'dragon';
      else if (tigerCard > dragonCard) winner = 'tiger';

      setDtResult({ dragon: dragonCard, tiger: tigerCard, winner });
      setIsSpinning(false);

      if (winner === dtBet) {
        const mult = winner === 'tie' ? 8 : 2;
        const winAmt = 50 * mult;
        setDemoCoins((prev) => prev + winAmt);
        setWinMessage(`🎉 आपकी जीत! ${winner.toUpperCase()} जीता! +${winAmt} कॉइन्स!`);
        playWinningFanfare();
      } else {
        setWinMessage(`हार गए! ${winner.toUpperCase()} जीता!`);
      }
    }, 700);
  };

  const getCardLabel = (val: number) => {
    if (val === 1) return 'A';
    if (val === 11) return 'J';
    if (val === 12) return 'Q';
    if (val === 13) return 'K';
    return val.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#141b2d] to-[#0a0f1c] border-2 border-amber-400/60 shadow-2xl p-6 text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{gameType === 'slot' ? '🎰' : '🃏'}</span>
            <div>
              <h2 className="font-black text-lg bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                {gameName}
              </h2>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                APNA WIN CASINO ARENA
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Badge */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 font-bold">डेमो बैलेंस:</span>
          <span className="font-black text-amber-300 text-sm">🪙 {demoCoins} कॉइन्स</span>
        </div>

        {/* Slot View */}
        {gameType === 'slot' ? (
          <div className="space-y-4 text-center">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-amber-500/40 shadow-inner flex justify-center gap-4 text-5xl">
              {reels.map((r, i) => (
                <div
                  key={i}
                  className={`w-20 h-24 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg transition-all ${
                    isSpinning ? 'animate-bounce' : ''
                  }`}
                >
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {winMessage && (
              <div className="text-sm font-black text-amber-300 animate-fadeIn">
                {winMessage}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSpin}
                disabled={isSpinning || demoCoins < 50}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 hover:scale-[1.02] cursor-pointer transition-all disabled:opacity-50"
              >
                {isSpinning ? 'घूम रहा है...' : '🎰 स्पिन करें (50 कॉइन्स)'}
              </button>
            </div>
          </div>
        ) : (
          /* Dragon Tiger View */
          <div className="space-y-4 text-center">
            <div className="grid grid-cols-2 gap-4">
              {/* Dragon */}
              <div
                onClick={() => setDtBet('dragon')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  dtBet === 'dragon' ? 'bg-red-950/40 border-red-500 shadow-lg' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="text-sm font-black text-red-400">🐉 DRAGON (2X)</div>
                <div className="text-4xl my-2 font-black">
                  {dtResult ? getCardLabel(dtResult.dragon) : '🂠'}
                </div>
              </div>

              {/* Tiger */}
              <div
                onClick={() => setDtBet('tiger')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  dtBet === 'tiger' ? 'bg-amber-950/40 border-amber-500 shadow-lg' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="text-sm font-black text-amber-400">🐯 TIGER (2X)</div>
                <div className="text-4xl my-2 font-black">
                  {dtResult ? getCardLabel(dtResult.tiger) : '🂠'}
                </div>
              </div>
            </div>

            {winMessage && (
              <div className="text-sm font-black text-amber-300 animate-fadeIn">
                {winMessage}
              </div>
            )}

            <button
              onClick={handleDealDT}
              disabled={isSpinning || demoCoins < 50}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-base shadow-xl shadow-red-500/30 hover:scale-[1.02] cursor-pointer transition-all disabled:opacity-50"
            >
              {isSpinning ? 'डील हो रहा है...' : '🃏 डील करें (BET 50)'}
            </button>
          </div>
        )}

        {/* Real Money Promo CTA */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">असली कैश जीतना चाहते हैं?</span>
          <button
            onClick={() => {
              onClose();
              if (gameType === 'dragontiger') {
                onNavigate('apna-dragon-tiger');
              } else {
                onNavigate('apna-slots');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-amber-500/20"
          >
            <span>🎮 पूरा गेम असली खेलें (PLAY REAL)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CasinoDemoModal;
