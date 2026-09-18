import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Sliders,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Gamepad2,
  HelpCircle,
  Zap,
} from 'lucide-react';
import {
  HouseProfitSettings,
  DEFAULT_HOUSE_PROFIT_SETTINGS,
  getHouseProfitSettings,
  saveHouseProfitSettings,
} from '../../utils/houseProfitEngine';

export const ModuleHouseMargin: React.FC = () => {
  const [settings, setSettings] = useState<HouseProfitSettings>(() => getHouseProfitSettings());
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<'super' | 'balanced' | 'attract' | 'custom'>('balanced');
  const [simTurnover, setSimTurnover] = useState<number>(50000);

  // Sync with storage on mount and changes
  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getHouseProfitSettings());
    };
    window.addEventListener('apna_profit_settings_updated', handleUpdate);
    return () => window.removeEventListener('apna_profit_settings_updated', handleUpdate);
  }, []);

  const handleSave = (updated: HouseProfitSettings) => {
    setSettings(updated);
    saveHouseProfitSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const applyPreset = (preset: 'super' | 'balanced' | 'attract') => {
    setActivePreset(preset);
    let updated: HouseProfitSettings;

    if (preset === 'super') {
      // 35% Admin Margin (Super Profit)
      updated = {
        ...settings,
        guaranteedAdminProfit: true,
        globalMarginPercent: 35,
        colorPrediction: {
          ...settings.colorPrediction,
          marginPercent: 35,
          autoMinPayoutMode: true,
          profitPriority: 'max_profit',
        },
        aviator: {
          ...settings.aviator,
          marginPercent: 35,
          earlyCrashRate: 0.25,
          crashBeforeAutoCashoutRate: 0.80,
          maxMultiplierCap: 35.0,
        },
        chickenRoad: {
          ...settings.chickenRoad,
          marginPercent: 35,
          highMultiplierPenalty: 0.20,
        },
        slots: {
          ...settings.slots,
          targetRtpPercent: 65, // 35% house profit
          jackpotRate: 0.04,
          matchTwoRate: 0.20,
        },
        fortuneGems: {
          ...settings.fortuneGems,
          targetRtpPercent: 65,
        },
        dragonTiger: {
          ...settings.dragonTiger,
          marginPercent: 25,
          houseEdgeRate: 0.65,
        },
      };
    } else if (preset === 'balanced') {
      // 25% Admin Margin (Balanced Standard)
      updated = {
        ...settings,
        guaranteedAdminProfit: true,
        globalMarginPercent: 25,
        colorPrediction: {
          ...settings.colorPrediction,
          marginPercent: 25,
          autoMinPayoutMode: true,
          profitPriority: 'max_profit',
        },
        aviator: {
          ...settings.aviator,
          marginPercent: 25,
          earlyCrashRate: 0.20,
          crashBeforeAutoCashoutRate: 0.72,
          maxMultiplierCap: 50.0,
        },
        chickenRoad: {
          ...settings.chickenRoad,
          marginPercent: 25,
          highMultiplierPenalty: 0.15,
        },
        slots: {
          ...settings.slots,
          targetRtpPercent: 75, // 25% house profit
          jackpotRate: 0.06,
          matchTwoRate: 0.24,
        },
        fortuneGems: {
          ...settings.fortuneGems,
          targetRtpPercent: 75,
        },
        dragonTiger: {
          ...settings.dragonTiger,
          marginPercent: 20,
          houseEdgeRate: 0.58,
        },
      };
    } else {
      // 15% Admin Margin (Player Attraction)
      updated = {
        ...settings,
        guaranteedAdminProfit: true,
        globalMarginPercent: 15,
        colorPrediction: {
          ...settings.colorPrediction,
          marginPercent: 15,
          autoMinPayoutMode: false,
          profitPriority: 'balanced',
        },
        aviator: {
          ...settings.aviator,
          marginPercent: 15,
          earlyCrashRate: 0.12,
          crashBeforeAutoCashoutRate: 0.50,
          maxMultiplierCap: 100.0,
        },
        chickenRoad: {
          ...settings.chickenRoad,
          marginPercent: 15,
          highMultiplierPenalty: 0.08,
        },
        slots: {
          ...settings.slots,
          targetRtpPercent: 85, // 15% house profit
          jackpotRate: 0.08,
          matchTwoRate: 0.28,
        },
        fortuneGems: {
          ...settings.fortuneGems,
          targetRtpPercent: 85,
        },
        dragonTiger: {
          ...settings.dragonTiger,
          marginPercent: 15,
          houseEdgeRate: 0.52,
        },
      };
    }

    handleSave(updated);
  };

  const resetToDefaults = () => {
    if (window.confirm('क्या आप सभी गेम्स के एडमिन बचत सेटिंग्स को डिफ़ॉल्ट पर रीसेट करना चाहते हैं?')) {
      handleSave(DEFAULT_HOUSE_PROFIT_SETTINGS);
      setActivePreset('balanced');
    }
  };

  // Estimated profit calculations
  const estimatedProfit = Math.round(simTurnover * (settings.globalMarginPercent / 100));
  const estimatedPlayerPayout = simTurnover - estimatedProfit;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 👑 Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-950 to-purple-950 border-2 border-emerald-500/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 text-2xl shadow-xl shadow-emerald-500/20 shrink-0">
            💰
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                100% ADMIN PROFIT GUARANTEED
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold">
                HOUSE EDGE &amp; MARGIN ENGINE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              हर गेम में एडमिन बचत व प्रॉफिट कंट्रोल
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              सभी गेम्स (कलर प्रेडिक्शन, एविएटर, चिकन रोड, स्लॉट्स, ड्रैगन टाइगर, तंबोला) में एडमिन की बचत (House Margin %) तय करें।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() =>
              handleSave({
                ...settings,
                guaranteedAdminProfit: !settings.guaranteedAdminProfit,
              })
            }
            className={`px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer transition-all shadow-lg flex items-center gap-2 ${
              settings.guaranteedAdminProfit
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/30'
                : 'bg-rose-600 text-white hover:bg-rose-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {settings.guaranteedAdminProfit
                ? '🛡️ गारंटीड बचत: चालू (ON)'
                : '⚠️ गारंटीड बचत: बंद (OFF)'}
            </span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/50 text-emerald-300 text-sm font-bold flex items-center gap-2 shadow-xl animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>सफलतापूर्वक सेव हो गया! सभी गेम्स में नया एडमिन प्रॉफिट मार्जिन लागू हो चुका है।</span>
        </div>
      )}

      {/* ⚡ Quick Preset Selection */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>वन-क्लिक एडमिन बचत प्रीसेट (One-Click Profit Presets)</span>
            </h3>
            <p className="text-xs text-slate-400">
              एक क्लिक में पूरे प्लेटफॉर्म पर वांछित बचत दर लागू करें।
            </p>
          </div>
          <button
            onClick={resetToDefaults}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>डिफ़ॉल्ट रीसेट करें</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Preset 1: Super Profit */}
          <button
            onClick={() => applyPreset('super')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              activePreset === 'super'
                ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-400">👑 सुपर एडमिन बचत</span>
              <span className="text-sm font-black font-mono text-amber-300">35% Margin</span>
            </div>
            <div className="text-xs text-slate-300 font-bold mt-1">अधिकतम प्लेटफ़ॉर्म आय</div>
            <p className="text-[11px] text-slate-400 mt-1">
              कलर प्रेडिक्शन न्यूनतम पे-आउट चुनता है, एविएटर 80% अर्ली कटऑफ, 65% स्लॉट्स RTP।
            </p>
          </button>

          {/* Preset 2: Balanced Standard */}
          <button
            onClick={() => applyPreset('balanced')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              activePreset === 'balanced'
                ? 'bg-emerald-500/10 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-400">⚖️ संतुलित सुरक्षित बचत</span>
              <span className="text-sm font-black font-mono text-emerald-300">25% Margin</span>
            </div>
            <div className="text-xs text-slate-300 font-bold mt-1">सर्वोत्तम अनुशंसित मोड (Recommended)</div>
            <p className="text-[11px] text-slate-400 mt-1">
              खिलाड़ी भी संतुष्ट रहते हैं और एडमिन को प्रत्येक राउंड व गेम में 25% शुद्ध बचत मिलती है।
            </p>
          </button>

          {/* Preset 3: Player Attraction */}
          <button
            onClick={() => applyPreset('attract')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              activePreset === 'attract'
                ? 'bg-purple-500/10 border-purple-400 shadow-lg shadow-purple-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-purple-400">🎯 प्लेयर अट्रैक्शन मोड</span>
              <span className="text-sm font-black font-mono text-purple-300">15% Margin</span>
            </div>
            <div className="text-xs text-slate-300 font-bold mt-1">नये यूजर्स जोड़ने के लिए</div>
            <p className="text-[11px] text-slate-400 mt-1">
              ज्यादा खिलाड़ी जीतते हैं, प्लेटफ़ॉर्म पर भीड़ बढ़ती है, फिर भी एडमिन 15% बचत सुरक्षित रखता है।
            </p>
          </button>
        </div>
      </div>

      {/* 📊 Live Profit Calculator / Simulator */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>लाइव एडमिन बचत कैलकुलेटर (Real-time Profit Simulator)</span>
            </h3>
            <p className="text-xs text-slate-400">
              दैनिक या मासिक टर्नओवर पर एडमिन की शुद्ध बचत का अनुमान देखें:
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">अनुमानित वॉल्यूम:</span>
            <div className="flex gap-1">
              {[25000, 50000, 100000, 500000].map((amt) => (
                <button
                  key={`vol-btn-${amt}`}
                  onClick={() => setSimTurnover(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                    simTurnover === amt
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ₹{(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-bold uppercase">कुल गेम वॉल्यूम / बेट्स</div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              ₹{simTurnover.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500">सभी गेम्स का कुल दांव</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-bold uppercase">वितरित खिलाड़ी पे-आउट (~{100 - settings.globalMarginPercent}%)</div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">
              ₹{estimatedPlayerPayout.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-purple-400/80">खिलाड़ियों की कुल जीत</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/50">
            <div className="text-xs text-emerald-400 font-black uppercase flex items-center justify-between">
              <span>एडमिन की शुद्ध बचत ({settings.globalMarginPercent}%)</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px]">PROFIT</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono mt-1">
              ₹{estimatedProfit.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-400 font-bold">सीधे एडमिन के बैंक/खाते में बचत</div>
          </div>
        </div>
      </div>

      {/* 🎮 Detailed Game-by-Game Margin Sliders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>प्रत्येक गेम का व्यक्तिगत बचत मार्जिन (Game-by-Game Controls)</span>
          </h3>
          <span className="text-xs text-slate-400">परिवर्तन स्वतः सेव होते हैं</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Game 1: Color Prediction */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-rose-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
                  🎨
                </div>
                <div>
                  <h4 className="font-black text-white text-base">1. कलर प्रेडिक्शन (Win Go)</h4>
                  <p className="text-xs text-slate-400">30s, 1M, 3M, 5M राउंड्स</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-400 font-black font-mono bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  {settings.colorPrediction.marginPercent}% बचत
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-bold">
                <span>एडमिन बचत दर (House Margin):</span>
                <span className="text-amber-400 font-mono">{settings.colorPrediction.marginPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={settings.colorPrediction.marginPercent}
                onChange={(e) => {
                  setActivePreset('custom');
                  handleSave({
                    ...settings,
                    colorPrediction: {
                      ...settings.colorPrediction,
                      marginPercent: Number(e.target.value),
                    },
                  });
                }}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10% (आसान)</span>
                <span>25% (संतुलित)</span>
                <span>50% (अधिकतम बचत)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-300">
                <div className="font-bold">न्यूनतम पे-आउट ऑटो सेलेक्टर</div>
                <div className="text-[11px] text-slate-500">
                  खिलाड़ियों के दांव लगने पर सबसे कम पे-आउट वाला नंबर स्वतः चुनना
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePreset('custom');
                  handleSave({
                    ...settings,
                    colorPrediction: {
                      ...settings.colorPrediction,
                      autoMinPayoutMode: !settings.colorPrediction.autoMinPayoutMode,
                    },
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.colorPrediction.autoMinPayoutMode
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.colorPrediction.autoMinPayoutMode ? 'चालू (ON)' : 'बंद (OFF)'}
              </button>
            </div>
          </div>

          {/* Game 2: Apna Aviator */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
                  ✈️
                </div>
                <div>
                  <h4 className="font-black text-white text-base">2. अपना एविएटर (Apna Aviator)</h4>
                  <p className="text-xs text-slate-400">क्रैश मल्टीप्लायर गेम</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-rose-400 font-black font-mono bg-rose-950 px-2 py-0.5 rounded-full border border-rose-500/40">
                  {settings.aviator.marginPercent}% बचत
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-bold">
                <span>एडमिन बचत दर (Crash Bias Margin):</span>
                <span className="text-amber-400 font-mono">{settings.aviator.marginPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={settings.aviator.marginPercent}
                onChange={(e) => {
                  setActivePreset('custom');
                  handleSave({
                    ...settings,
                    aviator: {
                      ...settings.aviator,
                      marginPercent: Number(e.target.value),
                    },
                  });
                }}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10% (लंबी उड़ान)</span>
                <span>25% (संतुलित)</span>
                <span>50% (अधिकतम बचत)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-300">
                <div className="font-bold">ऑटो-कैशआउट से पूर्व क्रैश सुरक्षा</div>
                <div className="text-[11px] text-slate-500">
                  खिलाड़ी द्वारा तय मल्टीप्लायर से थोड़ा पहले क्रैश होना
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                {(settings.aviator.crashBeforeAutoCashoutRate * 100).toFixed(0)}% एक्टिव
              </span>
            </div>
          </div>

          {/* Game 3: Apna Chicken Road */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg font-bold text-slate-950 shadow-md">
                  🐔
                </div>
                <div>
                  <h4 className="font-black text-white text-base">3. अपना चिकन रोड (Chicken Road)</h4>
                  <p className="text-xs text-slate-400">7 लेन सड़क पार मल्टीप्लायर</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-amber-400 font-black font-mono bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500/40">
                  {settings.chickenRoad.marginPercent}% बचत
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-bold">
                <span>हाउस एज (Danger Bias):</span>
                <span className="text-amber-400 font-mono">{settings.chickenRoad.marginPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={settings.chickenRoad.marginPercent}
                onChange={(e) => {
                  setActivePreset('custom');
                  handleSave({
                    ...settings,
                    chickenRoad: {
                      ...settings.chickenRoad,
                      marginPercent: Number(e.target.value),
                    },
                  });
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10% (आसान लेन)</span>
                <span>25% (मानक)</span>
                <span>40% (हाई डेंजर)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="font-bold">लेन 4-7 डेंजर बूस्ट</div>
              <span className="text-emerald-400 font-mono font-bold">सुरक्षित एडमिन बचत</span>
            </div>
          </div>

          {/* Game 4: Apna Slots */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-lg font-bold text-slate-950 shadow-md">
                  🎰
                </div>
                <div>
                  <h4 className="font-black text-white text-base">4. अपना 777 वेगास स्लॉट्स</h4>
                  <p className="text-xs text-slate-400">सुपर ऐस 3-रील स्लॉट मशीन</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-amber-400 font-black font-mono bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500/40">
                  {100 - settings.slots.targetRtpPercent}% बचत
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-bold">
                <span>खिलाड़ी रिटर्न (RTP %):</span>
                <span className="text-yellow-400 font-mono">{settings.slots.targetRtpPercent}% RTP</span>
              </div>
              <input
                type="range"
                min="60"
                max="90"
                step="5"
                value={settings.slots.targetRtpPercent}
                onChange={(e) => {
                  setActivePreset('custom');
                  handleSave({
                    ...settings,
                    slots: {
                      ...settings.slots,
                      targetRtpPercent: Number(e.target.value),
                    },
                  });
                }}
                className="w-full accent-yellow-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>60% (40% एडमिन बचत)</span>
                <span>75% (25% बचत)</span>
                <span>90% (10% बचत)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div>
                <span className="font-bold">जैकपॉट चांस:</span> <span className="font-mono text-amber-400">{(settings.slots.jackpotRate * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="font-bold">2-मैच चांस:</span> <span className="font-mono text-purple-400">{(settings.slots.matchTwoRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Game 5: Apna Dragon Tiger */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
                  🐉
                </div>
                <div>
                  <h4 className="font-black text-white text-base">5. अपना ड्रैगन टाइगर</h4>
                  <p className="text-xs text-slate-400">2-कार्ड इंस्टेंट कैसीनो टेबल</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-red-400 font-black font-mono bg-red-950 px-2 py-0.5 rounded-full border border-red-500/40">
                  {settings.dragonTiger.marginPercent}% बचत
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-bold">
                <span>हाउस मार्जिन (House Edge):</span>
                <span className="text-red-400 font-mono">{settings.dragonTiger.marginPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                step="5"
                value={settings.dragonTiger.marginPercent}
                onChange={(e) => {
                  setActivePreset('custom');
                  handleSave({
                    ...settings,
                    dragonTiger: {
                      ...settings.dragonTiger,
                      marginPercent: Number(e.target.value),
                    },
                  });
                }}
                className="w-full accent-red-400 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="font-bold">डीलर कार्ड फेवर रेट</div>
              <span className="text-emerald-400 font-mono font-bold">
                {(settings.dragonTiger.houseEdgeRate * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Game 6: Apna Tambola Tournament */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
                  🎫
                </div>
                <div>
                  <h4 className="font-black text-white text-base">6. अपना तंबोला (Tambola Tournaments)</h4>
                  <p className="text-xs text-slate-400">मैच रूम और टिकट कलेक्शन</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-indigo-400 font-black font-mono bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-500/40">
                  {settings.tambola.commissionRate}% फिक्स्ड बचत
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between font-bold">
                <span>कुल टिकट बिक्री पर एडमिन कमीशन:</span>
                <span className="text-amber-400 font-mono">30% (फ्लैट बचत)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>खिलाड़ी प्राइज पूल:</span>
                <span className="text-purple-400 font-mono">70% (7 पुरस्कार नियम)</span>
              </div>
              <p className="text-[11px] text-emerald-400 pt-1">
                ✓ हर मैच के खत्म होते ही एडमिन की 30% बचत बिना किसी रिस्क के सुनिश्चित होती है।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 Master Save Button Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            ये सेटिंग्स तुरंत सभी लाइव खिलाड़ियों के लिए एक्टिव हो जाती हैं और बिना किसी लैग के काम करती हैं।
          </span>
        </div>

        <button
          onClick={() => handleSave(settings)}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>सभी बचत सेटिंग्स सेव करें</span>
        </button>
      </div>
    </div>
  );
};
