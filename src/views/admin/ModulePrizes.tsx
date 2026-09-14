import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  DollarSign,
  Gift,
  Sparkles,
  Layers,
  Award,
  Star,
  Check,
  Target,
  Users,
  Ticket,
  RotateCcw,
  Zap,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { GamePrize, TambolaGame, TambolaTicket, User } from '../../types';
import { ForcedWinnerSelectorModal } from '../../components/ForcedWinnerSelectorModal';
import { getPrizeTargetProgress } from '../../utils/forcedWinnerEngine';

interface ModulePrizesProps {
  games: TambolaGame[];
  users?: User[];
  tickets?: TambolaTicket[];
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean>;
  onSetPrizeWinner?: (
    gameId: string,
    prizeId: string,
    targetData: {
      targetUserId?: string;
      targetUserName?: string;
      targetUserPhone?: string;
      targetTicketId?: string;
      targetTicketNumber?: number;
      isPreTargeted: boolean;
    }
  ) => Promise<boolean> | void;
}

const INITIAL_MASTER_PRIZES: Omit<GamePrize, 'id' | 'claimedWinners'>[] = [
  { code: 'early5', name: 'Early 5 (Jaldi 5)', amount: 500, maxWinners: 1, description: 'First player to dab any 5 numbers anywhere on ticket' },
  { code: 'corners', name: '4 Corners', amount: 500, maxWinners: 1, description: '1st & last number of top line and 1st & last number of bottom line' },
  { code: 'top_line', name: 'Top Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of the top horizontal row' },
  { code: 'mid_line', name: 'Middle Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of the middle horizontal row' },
  { code: 'bot_line', name: 'Bottom Line', amount: 1000, maxWinners: 1, description: 'All 5 numbers of the bottom horizontal row' },
  { code: 'full_house', name: '1st Full House (Bumper)', amount: 6000, maxWinners: 1, description: 'First player to dab all 15 numbers on the ticket' },
  { code: 'second_full_house', name: '2nd Full House', amount: 3000, maxWinners: 1, description: 'Second player to complete all 15 numbers' },
  { code: 'third_full_house', name: '3rd Full House', amount: 1500, maxWinners: 1, description: 'Third player to complete all 15 numbers' },
  { code: 'special', name: 'Center Star Bonus', amount: 500, maxWinners: 1, description: 'The exact center number on row 2 column 5' },
];

export const ModulePrizes: React.FC<ModulePrizesProps> = ({
  games = [],
  users = [],
  tickets = [],
  onUpdateGame,
  onSetPrizeWinner,
}) => {
  const safeGames = Array.isArray(games) ? games : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  const [activeTab, setActiveTab] = useState<'preset_winners' | 'templates' | 'calculator'>('preset_winners');
  const [selectedGameId, setSelectedGameId] = useState<string>(
    safeGames.find((g) => g.status === 'live')?.id || safeGames[0]?.id || ''
  );

  const selectedGame = safeGames.find((g) => g.id === selectedGameId) || safeGames[0];

  // Target Winner Modal State
  const [targetModalPrize, setTargetModalPrize] = useState<GamePrize | null>(null);

  const [prizesList, setPrizesList] = useState<Omit<GamePrize, 'id' | 'claimedWinners'>[]>(INITIAL_MASTER_PRIZES);

  // Custom Prize Form
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState(500);
  const [customDesc, setCustomDesc] = useState('');
  const [customWinners, setCustomWinners] = useState(1);
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Notice
  const [notice, setNotice] = useState<string | null>(null);

  // Dynamic 70-30 Simulator State
  const [calcTickets, setCalcTickets] = useState(100);
  const [calcPrice, setCalcPrice] = useState(50);
  const simCollection = calcTickets * calcPrice;
  const simPrizePool = Math.round(simCollection * 0.70);
  const simAdminMargin = Math.round(simCollection * 0.30);

  const handleApply7030Preset = () => {
    const e5 = Math.max(10, Math.round(simCollection * 0.025));
    const star = Math.max(10, Math.round(simCollection * 0.025));
    const tl = Math.max(10, Math.round(simCollection * 0.025));
    const ml = Math.max(10, Math.round(simCollection * 0.025));
    const bl = Math.max(10, Math.round(simCollection * 0.025));
    const fh1 = Math.max(50, Math.round(simCollection * 0.40));
    const fh2 = Math.max(25, Math.round(simCollection * 0.175));

    const newSet: Omit<GamePrize, 'id' | 'claimedWinners'>[] = [
      { code: 'early5', name: '1. जल्दी 5 (Early 5)', amount: e5, maxWinners: 1, description: 'First ticket to complete any 5 numbers (2.5% of collection)' },
      { code: 'corners', name: '2. स्टार / 4 कोने (Star/Corners)', amount: star, maxWinners: 1, description: '4 corner numbers + center star (2.5% of collection)' },
      { code: 'top_line', name: '3. पहली लाइन (Top Line)', amount: tl, maxWinners: 1, description: 'All 5 numbers of top row (2.5% of collection)' },
      { code: 'mid_line', name: '4. दूसरी लाइन (Middle Line)', amount: ml, maxWinners: 1, description: 'All 5 numbers of middle row (2.5% of collection)' },
      { code: 'bot_line', name: '5. तीसरी लाइन (Bottom Line)', amount: bl, maxWinners: 1, description: 'All 5 numbers of bottom row (2.5% of collection)' },
      { code: 'full_house', name: '6. पहला फुलहाउस (1st Full House)', amount: fh1, maxWinners: 1, description: 'First player to complete all 15 numbers (40% of collection)' },
      { code: 'second_full_house', name: '7. दूसरा फुलहाउस (2nd Full House)', amount: fh2, maxWinners: 1, description: 'Second player to complete all 15 numbers (17.5% of collection)' },
    ];

    setPrizesList(newSet);
    setNotice(`✅ 70% प्राइज पूल (₹${(simPrizePool || 0).toLocaleString('en-IN')}) और 30% एडमिन मार्जिन (₹${(simAdminMargin || 0).toLocaleString('en-IN')}) का मास्टर प्राइज सेट लोड कर दिया गया है!`);
    setTimeout(() => setNotice(null), 5000);
  };

  const totalPrizePool = prizesList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleUpdatePrizeAmount = (index: number, newAmount: number) => {
    setPrizesList((prev) =>
      prev.map((p, i) => (i === index ? { ...p, amount: newAmount } : p))
    );
  };

  const handleUpdateMaxWinners = (index: number, winners: number) => {
    setPrizesList((prev) =>
      prev.map((p, i) => (i === index ? { ...p, maxWinners: winners } : p))
    );
  };

  const handleDeletePrize = (index: number) => {
    if (confirm('Remove this prize category from the master template?')) {
      setPrizesList((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddCustomPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newPrize: Omit<GamePrize, 'id' | 'claimedWinners'> = {
      code: `custom_${Date.now()}` as any,
      name: customName.trim(),
      amount: customAmount,
      maxWinners: customWinners,
      description: customDesc.trim() || 'Custom tournament prize condition',
    };

    setPrizesList((prev) => [...prev, newPrize]);
    setCustomName('');
    setCustomAmount(500);
    setCustomDesc('');
    setShowAddCustom(false);
    setNotice(`Added custom prize "${newPrize.name}" successfully!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleApplyToAllActiveGames = async () => {
    if (!onUpdateGame) return;
    for (const game of safeGames) {
      if (game.status === 'live' || game.status === 'upcoming') {
        await onUpdateGame(game.id, {
          prizePool: totalPrizePool,
          prizes: prizesList.map((p, idx) => ({
            ...p,
            id: `prz_dyn_${game.id}_${idx}`,
            claimedWinners: [],
          })),
        });
      }
    }
    setNotice(`Master prize template applied to all live & upcoming games! (Total Pool: ₹${(totalPrizePool || 0).toLocaleString('en-IN')})`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleSetTargetWinner = async (
    gameId: string,
    prizeId: string,
    targetData: {
      targetUserId?: string;
      targetUserName?: string;
      targetUserPhone?: string;
      targetTicketId?: string;
      targetTicketNumber?: number;
      isPreTargeted: boolean;
    }
  ) => {
    if (onSetPrizeWinner) {
      await onSetPrizeWinner(gameId, prizeId, targetData);
    } else if (onUpdateGame && selectedGame) {
      const updatedPrizes = (selectedGame.prizes || []).map((p) => {
        if (p.id === prizeId || p.code === (prizeId as any)) {
          return {
            ...p,
            ...targetData,
          };
        }
        return p;
      });
      await onUpdateGame(gameId, { prizes: updatedPrizes });
    }

    setNotice(
      targetData.isPreTargeted
        ? `🎯 विजेता सफलतापूर्वक सेट हो गया! ${targetData.targetUserName} (टिकट #${targetData.targetTicketNumber || '?'}) को ईनाम मिलेगा।`
        : `🎲 ईनाम को सामान्य रैंडम मोड पर सेट कर दिया गया है।`
    );
    setTimeout(() => setNotice(null), 5000);
  };

  // Game tickets for selected game
  const currentGameTickets = selectedGame
    ? safeTickets.filter((t) => t && (t.gameId === selectedGame.id || !t.gameId))
    : [];

  const targetedPrizesCount = (selectedGame?.prizes || []).filter(
    (p) => p && (p.isPreTargeted || p.targetTicketId || p.targetUserId)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-3 py-0.5 rounded-full border border-amber-500/30">
              ईनाम और विजेता नियंत्रण (Prize & Winner Governance)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>ईनाम प्रबंधन & प्री-सेट विजेता नियंत्रण (Forced Winner Manager)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            एडमिन तय कर सकता है कि किस यूजर/टिकट को कौनसा ईनाम मिलेगा। स्मार्ट गेम इंजन उसी अनुसार तंबोला नंबर कॉलिंग चलाएगा।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCustom(true)}
            className="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-400/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>कस्टम ईनाम जोड़ें</span>
          </button>
          <button
            onClick={handleApplyToAllActiveGames}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            सभी गेम्स पर लागू करें
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('preset_winners')}
          className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
            activeTab === 'preset_winners'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>1. प्री-सेट विजेता नियंत्रण (Set User Winners)</span>
          {targetedPrizesCount > 0 && (
            <span className="bg-slate-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-black">
              {targetedPrizesCount} TARGETED
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
            activeTab === 'calculator'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. 70%-30% फॉर्मूला कैलकुलेटर</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
            activeTab === 'templates'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. मास्टर प्राइज लिस्ट (Master Template)</span>
        </button>
      </div>

      {/* TAB 1: PRESET WINNER CONTROLLER (KEY REQUEST) */}
      {activeTab === 'preset_winners' && (
        <div className="space-y-6">
          {/* Game Selector Card */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black border border-amber-500/30">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">गेम चुनें (Select Tournament to Configure)</h3>
                  <p className="text-xs text-slate-400">
                    जिस गेम में आपको प्री-सेट विनर सेट करना है, उसे नीचे से सेलेक्ट करें।
                  </p>
                </div>
              </div>

              {/* Game Selector Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="bg-slate-950 border-2 border-amber-400/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                >
                  {safeGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.status === 'live' ? '🟢 LIVE: ' : '📅 '} {g.title} (₹{g.ticketPrice}) - {g.status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Game Quick Info Bar */}
            {selectedGame && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400">टूर्नामेंट:</span>{' '}
                  <span className="text-amber-300 font-bold">{selectedGame.title}</span>
                </div>
                <div>
                  <span className="text-slate-400">टिकट मूल्य:</span>{' '}
                  <span className="text-white font-bold">₹{selectedGame.ticketPrice}</span>
                </div>
                <div>
                  <span className="text-slate-400">बिके टिकट:</span>{' '}
                  <span className="text-emerald-400 font-bold">{currentGameTickets.length} Tickets</span>
                </div>
                <div>
                  <span className="text-slate-400">स्थिति:</span>{' '}
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded-full text-[10px] ${
                      selectedGame.status === 'live'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {selectedGame.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">प्री-सेट ईनाम:</span>{' '}
                  <span className="text-amber-400 font-black">{targetedPrizesCount} Set</span>
                </div>
              </div>
            )}
          </div>

          {/* Prizes Table with Forced Winner Badges */}
          {selectedGame ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>ईनाम सूची और विजेता असाइनमेंट (Prizes & Assigned Winners)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  कुल ईनाम श्रेणियां: {(selectedGame.prizes || []).length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedGame.prizes || []).map((prz, idx) => {
                  const isTargeted = prz.isPreTargeted || !!prz.targetTicketId || !!prz.targetUserId;
                  const claimedCount = Array.isArray(prz.claimedWinners) ? prz.claimedWinners.length : 0;
                  const isClaimed = claimedCount >= (prz.maxWinners || 1);

                  // Progress of target ticket if game is active
                  const targetTicket = currentGameTickets.find(
                    (t) => (prz.targetTicketId && (t.ticketId === prz.targetTicketId || t.id === prz.targetTicketId)) ||
                           (prz.targetUserId && t.userId === prz.targetUserId)
                  );

                  const progress = targetTicket
                    ? getPrizeTargetProgress(prz.code, targetTicket.numbers, selectedGame.calledNumbers || [])
                    : null;

                  return (
                    <div
                      key={prz.id || `prz_${idx}`}
                      className={`p-5 rounded-3xl border transition-all ${
                        isTargeted
                          ? 'bg-gradient-to-br from-amber-950/40 via-purple-950/20 to-slate-900 border-2 border-amber-400/80 shadow-xl shadow-amber-500/10'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              #{idx + 1}
                            </span>
                            <h4 className="text-base font-black text-white">{prz.name}</h4>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{prz.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-amber-300 block">
                            ₹{(prz.amount || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {prz.maxWinners} विजेता क्षमता
                          </span>
                        </div>
                      </div>

                      {/* Status / Assigned Winner Box */}
                      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                        {isTargeted ? (
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                🎯 प्री-सेट विजेता (FORCED WINNER ACTIVE)
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                                गारंटेड विनर
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <span className="text-white font-black text-sm">{prz.targetUserName || 'User'}</span>
                                {prz.targetUserPhone && (
                                  <span className="text-slate-400 text-xs ml-2">({prz.targetUserPhone})</span>
                                )}
                              </div>
                              <div className="text-amber-200 font-bold">
                                टिकट #{prz.targetTicketNumber || '?'}{' '}
                                <span className="text-[10px] text-slate-400 font-mono">({prz.targetTicketId})</span>
                              </div>
                            </div>

                            {/* Progression indicator */}
                            {progress && (
                              <div className="pt-1 text-[11px] text-slate-300 flex items-center justify-between">
                                <span>
                                  कॉलिंग प्रोग्रेस: <strong className="text-amber-400">{progress.markedCount}/{progress.requiredTotal}</strong> नंबर मार्क हुए
                                </span>
                                {progress.isComplete ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> जीत के लिए तैयार!
                                  </span>
                                ) : (
                                  <span className="text-amber-300">
                                    {progress.remainingCount} नंबर बाकी
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <span>🎲</span>
                              <span>रैंडम मोड (कोई भी योग्य टिकट जीत सकता है)</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">नो प्री-सेट</span>
                          </div>
                        )}

                        {/* Claimed status */}
                        {isClaimed && (
                          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>यह ईनाम क्लेम हो चुका है ({claimedCount}/{prz.maxWinners})</span>
                            </span>
                            <span>{prz.claimedWinners?.[0]?.userName}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center justify-end gap-2">
                          {isTargeted && (
                            <button
                              onClick={() =>
                                handleSetTargetWinner(selectedGame.id, prz.id, {
                                  targetUserId: undefined,
                                  targetUserName: undefined,
                                  targetUserPhone: undefined,
                                  targetTicketId: undefined,
                                  targetTicketNumber: undefined,
                                  isPreTargeted: false,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-colors border border-red-500/20 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>रैंडम करें (Reset)</span>
                            </button>
                          )}

                          <button
                            onClick={() => setTargetModalPrize(prz)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow ${
                              isTargeted
                                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>{isTargeted ? 'विजेता बदलें (Change)' : '🎯 विजेता सेट करें (Set Winner)'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400">
              कृपया ऊपर से एक गेम सेलेक्ट करें।
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 70%-30% FORMULA CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#180a29] via-[#0e162d] to-[#0d2224] border-2 border-yellow-400/80 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-yellow-500/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/30 text-base">
                %
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>70% प्राइज पूल & 30% एडमिन शेयर फॉर्मूला (Admin 30% / Players 70%)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                    Active Rule
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  कुल टिकट बिक्री का 70% हिस्सा सभी विजेताओं के ईनाम में ऑटो-कैलकुलेट होकर बंटता है और 30% हिस्सा एडमिन के पास रहता है।
                </p>
              </div>
            </div>

            <button
              onClick={handleApply7030Preset}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/40 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider shrink-0 transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply 70%-30% Master Formula</span>
            </button>
          </div>

          {/* Live Simulator Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
              <label className="text-[11px] text-slate-400 font-bold uppercase block">1. Total Tickets Sold</label>
              <input
                type="number"
                value={calcTickets}
                onChange={(e) => setCalcTickets(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-black focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
              <label className="text-[11px] text-slate-400 font-bold uppercase block">2. Ticket Price (₹)</label>
              <input
                type="number"
                value={calcPrice}
                onChange={(e) => setCalcPrice(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-black focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-500/40 space-y-0.5">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">
                Total Collection (100%)
              </span>
              <span className="text-xl font-black text-emerald-300">
                ₹{simCollection.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-500 block">
                {calcTickets} tickets × ₹{calcPrice}
              </span>
            </div>

            <div className="p-3 bg-amber-950/40 rounded-2xl border border-amber-500/40 space-y-0.5">
              <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">
                Prize Pool (70%) / Admin (30%)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-amber-300">
                  ₹{simPrizePool.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  + ₹{simAdminMargin.toLocaleString('en-IN')} Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prizesList.map((prz, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative group hover:border-amber-400/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                      Prize #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-white">{prz.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{prz.description}</p>
                </div>
                <button
                  onClick={() => handleDeletePrize(idx)}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Editable Amount & Max Winners */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Prize Amount (₹)</label>
                  <input
                    type="number"
                    value={prz.amount}
                    onChange={(e) => handleUpdatePrizeAmount(idx, Number(e.target.value))}
                    min={10}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-black focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Max Winners</label>
                  <input
                    type="number"
                    value={prz.maxWinners}
                    onChange={(e) => handleUpdateMaxWinners(idx, Number(e.target.value))}
                    min={1}
                    max={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Target Winner Selection Modal */}
      {targetModalPrize && selectedGame && (
        <ForcedWinnerSelectorModal
          isOpen={!!targetModalPrize}
          onClose={() => setTargetModalPrize(null)}
          game={selectedGame}
          prize={targetModalPrize}
          users={safeUsers}
          tickets={safeTickets}
          onSetWinner={handleSetTargetWinner}
        />
      )}

      {/* Custom Prize Modal */}
      {showAddCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">Create Custom Prize Rule</h3>
              </div>
              <button
                onClick={() => setShowAddCustom(false)}
                className="text-slate-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomPrize} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Prize Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  placeholder="E.g. Breakfast (Rows 1 & 2), King's Corner, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Prize Amount (₹)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    min={50}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-black focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Max Winners</label>
                  <input
                    type="number"
                    value={customWinners}
                    onChange={(e) => setCustomWinners(Number(e.target.value))}
                    min={1}
                    max={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Description / Winning Rule</label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  rows={2}
                  placeholder="E.g. First player to mark top 2 numbers of column 5..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow cursor-pointer"
                >
                  Add Prize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
