import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  Sparkles,
  Plus,
  Minus,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Gift,
  ArrowRight,
  AlertTriangle,
  Lock,
  XCircle,
} from 'lucide-react';
import { TambolaGame, User, TambolaTicket, SiteSettings } from '../types';
import { generateTambolaTicketMatrix, generateTicketId } from '../utils/tambolaTicket';
import { TambolaTicketCard } from '../components/TambolaTicketCard';

interface BuyTicketViewProps {
  games: TambolaGame[];
  selectedGameId?: string;
  currentUser: User;
  siteSettings?: SiteSettings;
  onBuyTickets: (gameId: string, quantity: number) => Promise<boolean>;
  onOpenDeposit: () => void;
  onNavigate: (tab: string, gameId?: string) => void;
}

export const BuyTicketView: React.FC<BuyTicketViewProps> = ({
  games,
  selectedGameId,
  currentUser,
  siteSettings,
  onBuyTickets,
  onOpenDeposit,
  onNavigate,
}) => {
  const allGames = Array.isArray(games) && games.length > 0 ? games : [];
  const activeGames = allGames.filter((g) => g.status !== 'completed');

  // Default to the first game that is enabled by admin, or the first game
  const initialGame =
    allGames.find((g) => g.id === selectedGameId) ||
    allGames.find((g) => g.isGameEnabled !== false && g.isActive !== false && g.isBookingOpen !== false) ||
    allGames[0];

  const [chosenGameId, setChosenGameId] = useState<string>(initialGame?.id || '');
  const [quantity, setQuantity] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Live interactive preview ticket generator
  const [previewMatrix, setPreviewMatrix] = useState<number[][]>(() => generateTambolaTicketMatrix());

  const selectedGame = allGames.find((g) => g.id === chosenGameId) || initialGame;
  const ticketPrice = selectedGame?.ticketPrice || 50;
  const totalCost = ticketPrice * quantity;
  // Available wallet balance (deposit + winning + referral)
  const availableBalance = (currentUser?.depositBalance || 0) + (currentUser?.winningBalance || 0) + (currentUser?.referralBalance || 0);
  const canAfford = availableBalance >= totalCost;

  const isGlobalBookingOpen = siteSettings?.globalTicketBookingEnabled !== false;
  const isGameActive = selectedGame?.isGameEnabled !== false && selectedGame?.isActive !== false && selectedGame?.status !== 'cancelled';
  const isBookingAllowed = isGlobalBookingOpen && selectedGame?.isBookingOpen !== false && selectedGame?.bookingOpen !== false;
  const canPurchaseNow = isGameActive && isBookingAllowed && canAfford;

  const handleRegeneratePreview = () => {
    setPreviewMatrix(generateTambolaTicketMatrix());
  };

  const handlePurchase = async () => {
    if (!selectedGame) return;
    if (!isGlobalBookingOpen) {
      alert('मास्टर टिकट बुकिंग एडमिन द्वारा अस्थायी रूप से बंद (OFF) कर दी गई है। कृपया थोड़ी देर बाद प्रयास करें।');
      return;
    }
    if (!isGameActive) {
      alert(`यह ₹${ticketPrice} वाला टिकट एडमिन द्वारा बंद (OFF) कर दिया गया है। कृपया चालू टिकट चुनें।`);
      return;
    }
    if (!isBookingAllowed) {
      alert(`इस गेम (₹${ticketPrice}) की टिकट बुकिंग एडमिन द्वारा बंद कर दी गई है।`);
      return;
    }
    if (!canAfford) {
      onOpenDeposit();
      return;
    }

    try {
      setLoading(true);
      setErrorNotice(null);
      setSuccessMessage(null);
      const success = await onBuyTickets(selectedGame.id, quantity);
      setLoading(false);
      if (success) {
        setSuccessMessage(
          `🎉 सफलतापूर्वक ${quantity} टिकट बुक हो गए (${selectedGame.title})! आपके वॉलेट से ₹${totalCost} काट लिए गए हैं।`
        );
        handleRegeneratePreview();
      } else {
        setErrorNotice('टिकट बुकिंग पूरी नहीं हो सकी। कृपया वॉलेट बैलेंस चेक करें या पुनः प्रयास करें।');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorNotice(`त्रुटि: ${err?.message || 'टिकट बुक नहीं हो सका। कृपया पुनः प्रयास करें।'}`);
    }
  };

  const previewTicket: TambolaTicket = {
    id: 'preview_tkt',
    gameId: selectedGame?.id || '',
    gameTitle: selectedGame?.title || 'Preview Game',
    userId: currentUser.id,
    userName: currentUser.name,
    ticketNumber: (selectedGame?.totalTicketsSold || 0) + 1,
    ticketId: 'TKT-SAMPLE-PREVIEW',
    numbers: previewMatrix,
    markedNumbers: [],
    price: ticketPrice,
    purchaseDate: new Date().toISOString(),
    matchDate: selectedGame?.date || 'Today',
    matchTime: selectedGame?.startTime || '09:00 PM',
    isActive: true,
    status: 'active',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full px-3 py-1 text-xs font-bold text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-Time Ticket Generator with RNG Security</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-100">
          Buy <span className="text-amber-400">Tambola</span> Tickets
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Choose your tournament, select number of tickets, and receive instantly generated unique 3x9 Tambola tickets.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => onNavigate('my-tickets')}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            View My Tickets
          </button>
        </div>
      )}

      {/* Main Grid: Purchase Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Options & Checkout */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20 shadow-2xl space-y-6">
            {/* 1. Select Ticket Rate & Game */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. टिकट दर (Ticket Rate) व मैच चुनें
                </label>
                <span className="text-[11px] text-amber-400 font-bold">
                  {allGames.filter((g) => g.isGameEnabled !== false && g.isActive !== false && g.isBookingOpen !== false).length} टिकट चालू हैं
                </span>
              </div>

              {/* Quick Rate Selector Pills */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allGames
                  .slice()
                  .sort((a, b) => (a.ticketPrice || 0) - (b.ticketPrice || 0))
                  .map((g) => {
                    const gEnabled = g.isGameEnabled !== false && g.isActive !== false && g.status !== 'cancelled';
                    const gBooking = g.isBookingOpen !== false && g.bookingOpen !== false;
                    const isFullyActive = gEnabled && gBooking;
                    const isSelected = chosenGameId === g.id;

                    return (
                      <button
                        key={`pill-${g.id}`}
                        type="button"
                        onClick={() => setChosenGameId(g.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 ring-2 ring-amber-400 font-black'
                            : isFullyActive
                            ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700 font-bold'
                            : 'bg-red-950/30 border-red-500/30 text-slate-400 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="text-sm font-black font-mono">₹{g.ticketPrice}</div>
                        <div className="text-[9px] truncate mt-0.5">
                          {isFullyActive ? (
                            <span className={isSelected ? 'text-slate-900 font-bold' : 'text-emerald-400 font-bold'}>🟢 चालू</span>
                          ) : (
                            <span className="text-red-400 font-bold">🔴 बंद</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Detailed Game Cards List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {allGames
                  .slice()
                  .sort((a, b) => (a.ticketPrice || 0) - (b.ticketPrice || 0))
                  .map((g) => {
                    const gEnabled = g.isGameEnabled !== false && g.isActive !== false && g.status !== 'cancelled';
                    const gBooking = g.isBookingOpen !== false && g.bookingOpen !== false;
                    const isFullyActive = gEnabled && gBooking;
                    const isSelected = chosenGameId === g.id;

                    return (
                      <div
                        key={g.id}
                        onClick={() => setChosenGameId(g.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-900/40 border-amber-400 shadow-lg shadow-purple-900/30 ring-1 ring-amber-400/60'
                            : isFullyActive
                            ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                            : 'bg-[#1a0c0e] border-red-500/30 opacity-75 hover:opacity-90'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {g.status === 'live' && isFullyActive && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            )}
                            <span className="font-bold text-sm text-slate-100">{g.title}</span>
                            {isFullyActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black">
                                🟢 चालू (BOOK NOW)
                              </span>
                            ) : !gEnabled ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-black">
                                🔴 एडमिन द्वारा बंद (OFF)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>बुकिंग बंद</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <span className="text-amber-300 font-semibold">📅 {g.date || 'Today'}</span>
                            <span>•</span>
                            <span className="text-purple-300 font-semibold">⏰ {g.startTime || '09:00 PM'}</span>
                            <span>•</span>
                            <span>पूल: <strong className="text-amber-400">₹{(g.prizePool || 0).toLocaleString('en-IN')}</strong></span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-black text-base font-mono block ${isSelected ? 'text-amber-300' : 'text-slate-100'}`}>
                            ₹{g.ticketPrice}
                          </span>
                          <span className="text-[10px] text-slate-400">प्रति टिकट</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Admin Game / Booking Status Notices */}
            {!isGameActive && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs space-y-1.5 shadow-lg">
                <div className="font-black flex items-center gap-1.5 text-red-300 text-sm">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>यह ₹{ticketPrice} वाला टिकट एडमिन द्वारा बंद (OFF) कर दिया गया है</span>
                </div>
                <p className="text-[11px] text-red-300/90 leading-relaxed">
                  एडमिन ने ₹{ticketPrice} वाले टिकट को वर्तमान में बंद (Disabled) कर रखा है। आप केवल वही टिकट बुक कर सकते हैं जो एडमिन ने चालू (🟢) किया है। कृपया ऊपर से चालू टिकट (जैसे ₹5 या ₹10) चुनें।
                </p>
              </div>
            )}

            {isGameActive && !isBookingAllowed && (
              <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs space-y-1.5 shadow-lg">
                <div className="font-black flex items-center gap-1.5 text-amber-300 text-sm">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>टिकट बुकिंग बंद (Booking Closed by Admin)</span>
                </div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  इस गेम (₹{ticketPrice}) की टिकट बुकिंग एडमिन द्वारा बंद कर दी गई है। कृपया अगले मैच या टूर्नामेंट के लिए प्रतीक्षा करें।
                </p>
              </div>
            )}

            {/* 2. Select Quantity */}
            <div className={`space-y-2 ${!isGameActive || !isBookingAllowed ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Select Number of Tickets
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center text-2xl font-black text-slate-100 font-mono">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(20, quantity + 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuantity(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        quantity === num
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {num} {num === 1 ? 'Tkt' : 'Tkts'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Cost & Wallet Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>मैच नाम (Match):</span>
                <span className="font-bold text-slate-200">
                  {selectedGame?.title || 'Tambola Match'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>मैच शेड्यूल (Schedule):</span>
                <span className="font-bold text-amber-300">
                  📅 {selectedGame?.date || 'Today'} • ⏰ {selectedGame?.startTime || '09:00 PM'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>टिकट दर (Ticket Rate):</span>
                <span className="font-black text-amber-400 font-mono">
                  ₹{ticketPrice} / टिकट
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>टिकट संख्या (Quantity):</span>
                <span className="font-bold text-slate-200 font-mono">
                  {quantity} {quantity === 1 ? 'Ticket' : 'Tickets'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/80">
                <span className="font-bold text-slate-300">कुल देय राशि (Total Amount):</span>
                <span className="font-black text-amber-400 text-base font-mono">
                  ₹{totalCost}
                </span>
              </div>

              {/* Two-Wallet Balance Status */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>टिकट वॉलेट (Deposit Balance):</span>
                  </span>
                  <span className={`font-black ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{(currentUser?.depositBalance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span>💰 विथड्रॉल वॉलेट (Winnings/Bonus):</span>
                  </span>
                  <span className="font-bold text-slate-300">
                    ₹{(currentUser?.winningBalance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Fund Requirement Alert if Insufficient Deposit Balance */}
            {!canAfford && isGameActive && isBookingAllowed && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-300">
                  <span>⚠️ एडमिन से फंड ऐड करना आवश्यक है</span>
                </div>
                <p className="text-[11px] text-red-300/90 leading-relaxed">
                  जब तक एडमिन को पेमेंट करके फंड ऐड (Recharge) नहीं होता, तब तक टिकट नहीं खरीदा जा सकता। टिकट वॉलेट में ₹{Math.max(0, totalCost - (currentUser?.depositBalance || 0))} और चाहिए।
                </p>
              </div>
            )}

            {/* Referral note */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Every ticket purchase generates <strong>5-Level Referral Commissions (7.8%)</strong> automatically for upline referrers!
              </span>
            </div>

            {/* Checkout Action Button */}
            {!isGameActive ? (
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-300 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
              >
                <XCircle className="w-5 h-5 text-red-400" />
                <span>₹{ticketPrice} वाला टिकट एडमिन द्वारा बंद (OFF) है</span>
              </button>
            ) : !isBookingAllowed ? (
              <button
                disabled
                className="w-full py-4 rounded-2xl bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
              >
                <Lock className="w-5 h-5 text-amber-400" />
                <span>₹{ticketPrice} वाले टिकट की बुकिंग बंद है</span>
              </button>
            ) : canAfford ? (
              <div className="space-y-1.5">
                <button
                  id="confirm-buy-tickets-btn"
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <TicketIcon className="w-5 h-5" />
                  <span>{loading ? 'Processing Order...' : `PAY ₹${totalCost} & BUY ${quantity} TICKET(S)`}</span>
                </button>
                <p className="text-center text-[11px] text-slate-400 font-medium">
                  ✓ आपके टिकट वॉलेट से ₹{totalCost} बराबर कट जाएंगे
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={onOpenDeposit}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>+ एडमिन से फंड ऐड करें (Add ₹{totalCost - currentUser.depositBalance})</span>
                </button>
                <p className="text-center text-xs text-slate-400">
                  Instant deposit with Google Pay, PhonePe, Paytm, UPI, Cards &amp; NetBanking.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Ticket Sample */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100">
                Live Ticket Generator Preview
              </h3>
            </div>
            <button
              onClick={handleRegeneratePreview}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Shuffle Sample</span>
            </button>
          </div>

          <TambolaTicketCard ticket={previewTicket} />

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <h4 className="font-bold text-slate-200">Standard Tambola Ticket Specifications:</h4>
            <p>• 3 Rows × 9 Columns with exactly 15 numbers (5 numbers per row, 4 blanks).</p>
            <p>• Verified column range distribution (Col 1: 1–9, Col 2: 10–19 ... Col 9: 80–90).</p>
            <p>• Numbers in each column are sorted strictly in ascending order.</p>
            <p>• Every purchased ticket includes a unique Ticket ID and authentic QR code.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
