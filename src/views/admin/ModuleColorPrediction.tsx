import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Settings,
  Sliders,
  DollarSign,
  TrendingUp,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Flame,
  Clock,
  Trophy,
  Save,
  Trash2,
} from 'lucide-react';
import {
  ColorPredictionMode,
  ColorPredictionRound,
  ColorPredictionBet,
  ColorPredictionAdminControl,
  ColorPredictionSelection,
} from '../../types';
import { getNumberProps } from '../ColorPredictionView';

export const ModuleColorPrediction: React.FC = () => {
  const [adminControl, setAdminControl] = useState<ColorPredictionAdminControl>(() => {
    try {
      const saved = localStorage.getItem('apna_color_admin_control');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      autoMode: true,
      nextTargetNumber: null,
      nextTargetColor: null,
      houseProfitMargin: 10,
      activeMode: 'wingo_30s',
      gameActive: true,
    };
  });

  const [history, setHistory] = useState<ColorPredictionRound[]>(() => {
    try {
      const saved = localStorage.getItem('apna_color_prediction_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [userBets, setUserBets] = useState<ColorPredictionBet[]>(() => {
    try {
      const saved = localStorage.getItem('apna_color_prediction_user_bets');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveControl = (newControl: ColorPredictionAdminControl) => {
    setAdminControl(newControl);
    try {
      localStorage.setItem('apna_color_admin_control', JSON.stringify(newControl));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {}
  };

  const handleClearHistory = () => {
    if (window.confirm('क्या आप सच में कलर प्रेडिक्शन हिस्ट्री रीसेट करना चाहते हैं?')) {
      setHistory([]);
      try {
        localStorage.removeItem('apna_color_prediction_history');
      } catch (e) {}
    }
  };

  // Metrics
  const totalRounds = history.length;
  const totalVolume = history.reduce((acc, r) => acc + (r.totalBetsAmount || 0), 0);
  const totalPayout = history.reduce((acc, r) => acc + (r.totalPayout || 0), 0);
  const netPlatformProfit = totalVolume - totalPayout;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 border-2 border-purple-500/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-purple-500 to-rose-500 flex items-center justify-center text-2xl shadow-xl shadow-purple-500/30">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                LIVE & AUTOMATED
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold">
                WIN GO COLOR TRADING ENGINE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Color Prediction (Win Go) मैनेजमेंट व कंट्रोल
            </h2>
            <p className="text-xs text-slate-300">
              लाइव राउंड रिजल्ट्स कंट्रोल, टारगेट विनर सेटर, हाउस प्रॉफिट मार्जिन और लाइव ट्रेड्स ऑडिट
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveControl({ ...adminControl, gameActive: !adminControl.gameActive })}
            className={`px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer transition-all shadow-lg ${
              adminControl.gameActive
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/30'
                : 'bg-rose-600 text-white hover:bg-rose-500'
            }`}
          >
            {adminControl.gameActive ? '🟢 गेम चालू (Active)' : '🔴 गेम बंद (Paused)'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-bold uppercase">कुल खेले गए राउंड्स</div>
          <div className="text-2xl font-black text-white font-mono">{totalRounds}</div>
          <div className="text-[10px] text-emerald-400">Win Go 30s / 1M / 3M</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-bold uppercase">कुल बेटिंग वॉल्यूम</div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{totalVolume.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400">सभी खिलाड़ियों का टर्नओवर</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-bold uppercase">कुल वितरित पे-आउट</div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            ₹{totalPayout.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400">जीते गए पुरस्कार</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-bold uppercase">प्लेटफ़ॉर्म ग्रॉस प्रॉफिट</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₹{netPlatformProfit.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-400">House Edge / Revenue</div>
        </div>
      </div>

      {/* 🎯 Master Admin Target Outcome Controller */}
      <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-400/60 text-white space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                अगले पीरियड का रिजल्ट सेट करें (Next Outcome Override)
              </h3>
              <p className="text-xs text-slate-400">
                आप किसी भी आने वाले पीरियड के लिए सटीक नंबर या रंग तय कर सकते हैं, या Fair RNG पर छोड़ सकते हैं।
              </p>
            </div>
          </div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
              सेव हो गया!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. सटीक नंबर टारगेट (0 - 9):
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const p = getNumberProps(num);
                const isSelected = adminControl.nextTargetNumber === num;
                return (
                  <button
                    key={`admin-num-target-${num}`}
                    onClick={() =>
                      handleSaveControl({
                        ...adminControl,
                        nextTargetNumber: isSelected ? null : num,
                        nextTargetColor: null,
                      })
                    }
                    className={`py-3 rounded-xl font-mono font-black text-lg transition-all cursor-pointer border-2 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-white shadow-xl shadow-amber-500/50 scale-110'
                        : `${p.badgeBg} text-white border-transparent hover:border-slate-400`
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              {adminControl.nextTargetNumber !== null
                ? `🎯 करंट टारगेट नंबर: #${adminControl.nextTargetNumber} (अगले राउंड में यही नंबर जीतेगा)`
                : '⚡ कोई नंबर लॉक नहीं है (Fair RNG एक्टिव है)'}
            </p>
          </div>

          {/* Target Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              2. या टारगेट रंग (Green / Violet / Red):
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'green' as const, label: '🟢 Green', color: 'bg-emerald-600 border-emerald-400' },
                { id: 'violet' as const, label: '🟣 Violet', color: 'bg-purple-600 border-purple-400' },
                { id: 'red' as const, label: '🔴 Red', color: 'bg-rose-600 border-rose-400' },
              ].map((col) => {
                const isSelected = adminControl.nextTargetColor === col.id;
                return (
                  <button
                    key={`col-target-${col.id}`}
                    onClick={() =>
                      handleSaveControl({
                        ...adminControl,
                        nextTargetColor: isSelected ? null : col.id,
                        nextTargetNumber: null,
                      })
                    }
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border-2 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-white shadow-lg scale-105'
                        : `${col.color} text-white hover:opacity-90`
                    }`}
                  >
                    {col.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              {adminControl.nextTargetColor
                ? `🎯 करंट टारगेट रंग: ${adminControl.nextTargetColor.toUpperCase()}`
                : '⚡ कोई रंग लॉक नहीं है (Fair RNG एक्टिव है)'}
            </p>
          </div>
        </div>

        {/* Clear override button */}
        {(adminControl.nextTargetNumber !== null || adminControl.nextTargetColor !== null) && (
          <div className="pt-2">
            <button
              onClick={() =>
                handleSaveControl({
                  ...adminControl,
                  nextTargetNumber: null,
                  nextTargetColor: null,
                })
              }
              className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>टारगेट हटाएं और Fair RNG चालू करें</span>
            </button>
          </div>
        )}
      </div>

      {/* 📜 Recent Game History Audit */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <h3 className="font-black text-base text-white">
              कलर प्रेडिक्शन हाल के राउंड्स का विवरण (Audit Log)
            </h3>
          </div>
          <button
            onClick={handleClearHistory}
            className="text-xs text-rose-400 hover:underline cursor-pointer"
          >
            हिस्ट्री रीसेट करें
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
                <th className="py-3 px-3">पीरियड (Period)</th>
                <th className="py-3 px-3">मोड (Mode)</th>
                <th className="py-3 px-3 text-center">रिजल्ट नंबर</th>
                <th className="py-3 px-3 text-center">रंग (Color)</th>
                <th className="py-3 px-3 text-center">साइज</th>
                <th className="py-3 px-3 text-right">कुल बेट्स</th>
                <th className="py-3 px-3 text-right">वितरित पे-आउट</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {history.slice(0, 15).map((r) => {
                const p = getNumberProps(r.resultNumber ?? 0);
                return (
                  <tr key={`adm-rnd-${r.period}`} className="hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-amber-300 font-bold">#{r.period}</td>
                    <td className="py-2.5 px-3 font-sans uppercase text-[11px] text-slate-300">
                      {r.mode.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${p.badgeBg} text-white font-black text-xs shadow`}
                      >
                        {r.resultNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans font-bold text-xs">
                      <span className={p.textColor}>{p.colorName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans font-bold text-xs uppercase">
                      {r.resultSize}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      ₹{r.totalBetsAmount?.toLocaleString('en-IN') || '0'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      ₹{r.totalPayout?.toLocaleString('en-IN') || '0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModuleColorPrediction;
