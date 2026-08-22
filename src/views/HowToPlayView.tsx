import React, { useState } from 'react';
import {
  HelpCircle,
  Trophy,
  CheckCircle2,
  Sparkles,
  Play,
  Volume2,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap,
  Info,
  ChevronRight,
  Gift,
  Target,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import { playWinningFanfare, speakNumberCall } from '../utils/audio';

interface HowToPlayViewProps {
  onNavigate: (tab: string, gameId?: string) => void;
}

export const HowToPlayView: React.FC<HowToPlayViewProps> = ({ onNavigate }) => {
  const [selectedPattern, setSelectedPattern] = useState<string>('early5');
  const [activeLang, setActiveLang] = useState<'hi' | 'en'>('hi');

  // Interactive sample ticket matrix (3x9)
  const sampleTicket: (number | null)[][] = [
    [4, null, 23, null, 47, null, 62, null, 85],
    [null, 12, null, 38, null, 55, null, 71, 90],
    [7, null, 29, null, 49, null, 68, 77, null],
  ];

  // Helper to check if a number in sample ticket matches pattern
  const isSampleNumberHighlighted = (row: number, col: number, num: number | null): boolean => {
    if (num === null) return false;
    switch (selectedPattern) {
      case 'early5':
        // Highlight first 5 numbers on ticket
        return [4, 23, 12, 38, 7].includes(num);
      case 'topLine':
        return row === 0;
      case 'middleLine':
        return row === 1;
      case 'bottomLine':
        return row === 2;
      case 'corners':
        return (row === 0 && col === 0) || (row === 0 && col === 8) || (row === 2 && col === 0) || (row === 2 && col === 7);
      case 'fullHouse':
        return true;
      case 'breakfast':
        return col < 3; // First 3 columns
      case 'lunch':
        return col >= 3 && col < 6; // Middle 3 columns
      case 'dinner':
        return col >= 6; // Last 3 columns
      default:
        return false;
    }
  };

  const PATTERNS = [
    {
      id: 'early5',
      name: 'Early 5 (जल्दी 5)',
      descHi: 'टिकट में मौजूद कोई भी 5 नंबर सबसे पहले कटने पर मिलता है।',
      descEn: 'Awarded to the player whose ticket strikes any 5 numbers first.',
      badge: 'Fastest Prize',
      color: 'from-amber-500 to-yellow-500',
    },
    {
      id: 'topLine',
      name: 'Top Line (पहली लाइन)',
      descHi: 'टिकट की सबसे ऊपर वाली (पहली) पंक्ति के सभी 5 नंबर कटने पर।',
      descEn: 'Completed when all 5 numbers on the 1st horizontal row are marked.',
      badge: 'Row 1 Winner',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'middleLine',
      name: 'Middle Line (बीच की लाइन)',
      descHi: 'टिकट की बीच वाली (दूसरी) पंक्ति के सभी 5 नंबर कटने पर।',
      descEn: 'Completed when all 5 numbers on the 2nd middle row are marked.',
      badge: 'Row 2 Winner',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'bottomLine',
      name: 'Bottom Line (तीसरी लाइन)',
      descHi: 'टिकट की सबसे नीचे वाली (तीसरी) पंक्ति के सभी 5 नंबर कटने पर।',
      descEn: 'Completed when all 5 numbers on the 3rd bottom row are marked.',
      badge: 'Row 3 Winner',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'corners',
      name: 'Four Corners (चार कोने)',
      descHi: 'टिकट के चारों कोनों (Top-Left, Top-Right, Bottom-Left, Bottom-Right) के नंबर कटने पर।',
      descEn: 'Awarded when the 4 extreme outer corner numbers of the ticket are marked.',
      badge: 'Corner Jackpot',
      color: 'from-rose-500 to-pink-500',
    },
    {
      id: 'fullHouse',
      name: 'Full House (फुल हाउस / जैकपॉट)',
      descHi: 'टिकट के सभी 15 नंबर सबसे पहले कटने पर सबसे बड़ा बम्पर इनाम मिलता है!',
      descEn: 'The Ultimate Bumper Prize awarded when all 15 numbers on the ticket are struck!',
      badge: '🏆 Bumper Mega Prize',
      color: 'from-amber-400 via-yellow-500 to-orange-500',
    },
    {
      id: 'breakfast',
      name: 'Breakfast Line (1st 3 Columns)',
      descHi: 'टिकट के पहले 3 कॉलम (1 से 29 तक) के सभी नंबर पूरे होने पर।',
      descEn: 'When all numbers in the first 3 columns (Cols 1, 2, 3) are marked.',
      badge: 'Special Combo',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      id: 'lunch',
      name: 'Lunch Line (Middle 3 Columns)',
      descHi: 'टिकट के बीच के 3 कॉलम (30 से 59 तक) के सभी नंबर पूरे होने पर।',
      descEn: 'When all numbers in the middle 3 columns (Cols 4, 5, 6) are marked.',
      badge: 'Special Combo',
      color: 'from-sky-500 to-blue-500',
    },
    {
      id: 'dinner',
      name: 'Dinner Line (Last 3 Columns)',
      descHi: 'टिकट के अंतिम 3 कॉलम (60 से 90 तक) के सभी नंबर पूरे होने पर।',
      descEn: 'When all numbers in the last 3 columns (Cols 7, 8, 9) are marked.',
      badge: 'Special Combo',
      color: 'from-violet-500 to-purple-500',
    },
  ];

  const handleTestVoiceCall = () => {
    playWinningFanfare();
    speakNumberCall(47, true, activeLang);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 🌟 Lime & Emerald Glow Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lime-950 via-emerald-950 to-slate-950 border-2 border-lime-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-lime-500/20 text-lime-300 border border-lime-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-lime-500/20">
                <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                <span>OFFICIAL TAMBOLA / HOUSIE RULES GUIDE</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                100% FAIR RNG
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              तंबोला / हाउसी कैसे खेलें और <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-300 to-teal-400">रोज़ाना इनाम जीतें!</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              तंबोला (Housie) भारत का सबसे लोकप्रिय और भरोसेमंद गेम है। यहाँ जानिए हर पैटर्न (Early 5, Lines, Corners, Full House) के नियम और लाइव गेम खेलने का तरीका।
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('games')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-lime-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Live Game Now (अभी खेलें)</span>
              </button>

              <button
                onClick={handleTestVoiceCall}
                className="px-4 py-2.5 rounded-xl bg-slate-900/90 text-lime-300 border border-lime-500/40 text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-lime-400" />
                <span>Hear Voice Caller (आवाज सुनें)</span>
              </button>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-lime-500/40 self-start lg:self-center shadow-lg">
            <button
              onClick={() => setActiveLang('hi')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeLang === 'hi'
                  ? 'bg-lime-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇮🇳 हिन्दी गाइड
            </button>
            <button
              onClick={() => setActiveLang('en')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeLang === 'en'
                  ? 'bg-lime-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇬🇧 English Guide
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 Interactive Winning Pattern Simulator */}
      <div className="rounded-3xl bg-slate-900/90 border-2 border-lime-500/30 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lime-500/20 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-lime-400" />
              <span>Interactive Winning Pattern Simulator (पैटर्न सिम्युलेटर)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click on any pattern button below to see how numbers highlight on the real Tambola ticket.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-lime-500/20 text-lime-300 text-xs font-bold border border-lime-500/30 self-start sm:self-auto">
            ⚡ 100% Instant Claim Validation
          </span>
        </div>

        {/* Pattern Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PATTERNS.slice(0, 6).map((p) => {
            const isSelected = selectedPattern === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPattern(p.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-lime-500/20 border-lime-400 text-lime-200 shadow-lg shadow-lime-500/20 ring-1 ring-lime-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-lime-500/40 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] font-black uppercase text-lime-400 mb-0.5">{p.badge}</div>
                <div className="text-xs font-black text-white truncate">{p.name}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Pattern Explanation & Live Ticket Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Info Card */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950/90 border border-lime-500/30 space-y-3">
            {(() => {
              const current = PATTERNS.find((p) => p.id === selectedPattern) || PATTERNS[0];
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-lime-500/20 text-lime-300 text-[11px] font-black border border-lime-500/30">
                      {current.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">CODE: {current.id.toUpperCase()}</span>
                  </div>
                  <h3 className="text-base font-black text-white">{current.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeLang === 'hi' ? current.descHi : current.descEn}
                  </p>
                  <div className="p-3 rounded-xl bg-lime-950/60 border border-lime-500/20 text-[11px] text-lime-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span>
                      {activeLang === 'hi'
                        ? 'जैसे ही आपके टिकट में यह पैटर्न पूरा हो, तुरंत स्क्रीन पर "CLAIM PRIZE" बटन दबाएं!'
                        : 'As soon as this pattern completes on your ticket, hit the "CLAIM PRIZE" button immediately!'}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Right: Live Interactive Sample Ticket Matrix */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-md bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 rounded-3xl border-2 border-lime-500/50 shadow-2xl space-y-2">
              <div className="flex items-center justify-between px-1 text-[11px]">
                <span className="font-mono text-lime-400 font-bold">SAMPLE TICKET #84920</span>
                <span className="text-slate-400 font-bold">TAMBOLA LIVE</span>
              </div>

              {/* 3x9 Ticket Grid */}
              <div className="grid grid-cols-9 gap-1 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
                {sampleTicket.map((row, rIdx) =>
                  row.map((num, cIdx) => {
                    const isLit = isSampleNumberHighlighted(rIdx, cIdx, num);
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`h-10 sm:h-12 flex items-center justify-center rounded-xl text-xs sm:text-sm font-black transition-all ${
                          num === null
                            ? 'bg-slate-950/40 text-transparent border border-slate-800/40'
                            : isLit
                            ? 'bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 shadow-lg shadow-lime-500/40 scale-105 border border-lime-300 ring-2 ring-lime-400'
                            : 'bg-slate-800/80 text-white border border-slate-700'
                        }`}
                      >
                        {num !== null ? num : ''}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-md bg-lime-400 inline-block" />
                  <span>Highlighted = Marked Number</span>
                </span>
                <span className="text-lime-300 font-bold">Pattern: {selectedPattern}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 Step-by-Step Guide for Beginners */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            step: '01',
            titleHi: 'टिकट खरीदें',
            titleEn: '1. Buy Tickets',
            descHi: 'गेम्स लॉबी में जाएं और अपनी पसंद के मैच में ₹10 से ₹50 में 1 या अधिक टिकट खरीदें।',
            descEn: 'Pick any scheduled game from lobby and purchase 1 to 24 tickets from wallet.',
            color: 'border-emerald-500/30 text-emerald-400',
          },
          {
            step: '02',
            titleHi: 'लाइव गेम में जुड़ें',
            titleEn: '2. Join Live Room',
            descHi: 'मैच शुरू होने पर लाइव रूम में प्रवेश करें। ऑटो-कॉलर 1 से 90 तक नंबर बोलेगा।',
            descEn: 'Enter the live game room when match starts. Auto caller draws numbers 1 to 90.',
            color: 'border-lime-500/30 text-lime-400',
          },
          {
            step: '03',
            titleHi: 'नंबर काटें / ऑटो मार्क',
            titleEn: '3. Strike Numbers',
            descHi: 'जैसे ही नंबर निकले, अपनी टिकट पर टिक करें या ऑटो-मार्क (Auto-Mark) चालू रखें।',
            descEn: 'Strike numbers as they appear or keep Auto-Mark ON for instant marking.',
            color: 'border-cyan-500/30 text-cyan-400',
          },
          {
            step: '04',
            titleHi: 'इनाम क्लेम करें',
            titleEn: '4. Claim & Withdraw',
            descHi: 'पैटर्न पूरा होते ही "Claim Prize" दबाएं। जीती गई राशि तुरंत वॉलेट में आ जाएगी जिसे UPI से निकालें!',
            descEn: 'Press Claim as soon as your pattern is made. Winnings credit instantly to wallet!',
            color: 'border-amber-500/30 text-amber-400',
          },
        ].map((s) => (
          <div
            key={s.step}
            className={`p-5 rounded-3xl bg-slate-900/90 border ${s.color} space-y-2 shadow-xl`}
          >
            <div className="text-2xl font-black font-mono text-slate-600">{s.step}</div>
            <h3 className="text-sm font-black text-white">{activeLang === 'hi' ? s.titleHi : s.titleEn}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{activeLang === 'hi' ? s.descHi : s.descEn}</p>
          </div>
        ))}
      </div>

      {/* ❓ Frequently Asked Questions */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <HelpCircle className="w-5 h-5 text-lime-400" />
          <h2 className="text-base sm:text-lg font-black text-white">
            {activeLang === 'hi' ? 'अक्सर पूछे जाने वाले सवाल (FAQs)' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-white">Q: बोगी (Bogey) या गलत क्लेम क्या होता है?</h4>
            <p className="text-slate-400 leading-relaxed">
              यदि आपने बिना नंबर पूरे हुए क्लेम दबाया, तो सिस्टम आपकी टिकट की जांच करेगा और गलत क्लेम रिजेक्ट हो जाएगा ताकि अन्य खिलाड़ियों का गेम बिना बाधा के चले।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-white">Q: यदि 2 लोग एक साथ क्लेम करें तो क्या होगा?</h4>
            <p className="text-slate-400 leading-relaxed">
              यदि एक ही नंबर पर 2 या अधिक खिलाड़ी एक ही इनाम क्लेम करते हैं, तो इनाम राशि सभी वैध विजेताओं में बराबर बांट दी जाती है।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-white">Q: क्या ऑटो-मार्क (Auto-Mark) सुरक्षित है?</h4>
            <p className="text-slate-400 leading-relaxed">
              हाँ, ऑटो-मार्क फीचर आपके सभी टिकटों पर बोले गए नंबर अपने आप काट देता है जिससे इंटरनेट स्लो होने पर भी आपका कोई नंबर नहीं छूटता।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-white">Q: जीती हुई राशि बैंक या UPI में कैसे ट्रांसफर करें?</h4>
            <p className="text-slate-400 leading-relaxed">
              वॉलेट सेक्शन में जाएं, विथड्रॉल (Withdraw) चुनें, अपनी UPI आईडी या बैंक खाता संख्या डालें और सबमिट करें। 5 मिनट में पेमेंट मिल जाता है।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
