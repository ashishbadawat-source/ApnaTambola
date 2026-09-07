import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Users,
  Wallet,
  Coins,
  QrCode,
  Send,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { User, Franchise, FranchiseTransferRecord, SiteSettings } from '../types';

interface FranchiseViewProps {
  currentUser: User | null;
  franchises: Franchise[];
  franchiseTransfers: FranchiseTransferRecord[];
  settings?: SiteSettings;
  onApplyFranchise: (data: {
    franchiseName: string;
    city: string;
    state: string;
    tier: 'bronze' | 'silver' | 'gold' | 'master';
    securityDeposit: number;
    desiredFranchiseId?: string;
    utrNumber: string;
  }) => Promise<boolean>;
  onFranchiseTransfer: (
    recipientIdentifier: string,
    amount: number,
    note?: string
  ) => Promise<{ success: boolean; message: string; record?: FranchiseTransferRecord }>;
  onRequestMoreFund?: (amount: number, utr: string) => Promise<boolean>;
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const TIERS = [
  {
    id: 'bronze',
    name: 'ब्रॉन्ज फ्रेंचाइजी (Bronze)',
    deposit: 2000,
    commission: 3.0,
    dailyLimit: '₹10,000/दिन',
    badge: 'Starter',
    color: 'from-amber-700 to-amber-900 border-amber-600/40 text-amber-300',
    iconBg: 'bg-amber-700/20 text-amber-400',
  },
  {
    id: 'silver',
    name: 'सिल्वर फ्रेंचाइजी (Silver)',
    deposit: 5000,
    commission: 4.0,
    dailyLimit: '₹25,000/दिन',
    badge: 'Popular',
    color: 'from-slate-400 to-slate-600 border-slate-400/40 text-slate-200',
    iconBg: 'bg-slate-500/20 text-slate-300',
  },
  {
    id: 'gold',
    name: 'गोल्ड फ्रेंचाइजी (Gold)',
    deposit: 10000,
    commission: 5.0,
    dailyLimit: '₹50,000/दिन',
    badge: '⭐ Most Recommended',
    color: 'from-amber-500 to-yellow-600 border-yellow-400/60 text-yellow-300',
    iconBg: 'bg-yellow-500/20 text-yellow-300',
  },
  {
    id: 'master',
    name: 'मास्टर फ्रेंचाइजी (Master Club)',
    deposit: 25000,
    commission: 7.0,
    dailyLimit: 'असीमित (Unlimited)',
    badge: '👑 VIP Hub',
    color: 'from-purple-600 to-indigo-800 border-purple-400/60 text-purple-200',
    iconBg: 'bg-purple-500/20 text-purple-300',
  },
];

export const FranchiseView: React.FC<FranchiseViewProps> = ({
  currentUser,
  franchises,
  franchiseTransfers,
  settings,
  onApplyFranchise,
  onFranchiseTransfer,
  onRequestMoreFund,
  onNavigate,
  onOpenAuth,
}) => {
  // Find current user's franchise if any
  const myFranchise = currentUser
    ? franchises.find(
        (f) =>
          f.userId === currentUser.id ||
          (currentUser.phone && f.userPhone && currentUser.phone.replace(/\D/g, '').slice(-10) === f.userPhone.replace(/\D/g, '').slice(-10))
      )
    : null;

  const isApproved = myFranchise && myFranchise.status === 'approved';
  const isPending = myFranchise && myFranchise.status === 'pending';

  // Apply Form State
  const [selectedTier, setSelectedTier] = useState<'bronze' | 'silver' | 'gold' | 'master'>('gold');
  const [franchiseName, setFranchiseName] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [desiredId, setDesiredId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Transfer Form State (For Active Franchise Partners)
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(100);
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Top-up Request State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(5000);
  const [topupUtr, setTopupUtr] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  // Copy status
  const [copiedId, setCopiedId] = useState(false);

  const activeTierConfig = TIERS.find((t) => t.id === selectedTier) || TIERS[2];

  const adminUpi = settings?.adminUpiId || 'apnatambola@upi';

  // Handle Apply
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    if (!franchiseName.trim()) {
      setApplyError('कृपया अपनी फ्रेंचाइजी का नाम दर्ज करें (Enter Franchise Name)');
      return;
    }
    if (!city.trim()) {
      setApplyError('कृपया अपने शहर का नाम दर्ज करें (Enter City)');
      return;
    }
    if (!utrNumber.trim()) {
      setApplyError('कृपया सिक्योरिटी डिपॉजिट पेमेंट का UTR नंबर दर्ज करें (Enter UTR Number)');
      return;
    }

    setApplyLoading(true);
    setApplyError(null);
    try {
      const ok = await onApplyFranchise({
        franchiseName: franchiseName.trim(),
        city: city.trim(),
        state: stateName.trim() || 'India',
        tier: selectedTier,
        securityDeposit: activeTierConfig.deposit,
        desiredFranchiseId: desiredId.trim() || undefined,
        utrNumber: utrNumber.trim(),
      });
      setApplyLoading(false);
      if (ok) {
        setApplySuccess('🎉 आपका फ्रेंचाइजी आवेदन सफलतापूर्वक सबमिट हो गया है! एडमिन 10-30 मिनट में समीक्षा कर आपकी फ्रेंचाइजी आईडी एक्टिवेट करेंगे।');
      }
    } catch (err: any) {
      setApplyLoading(false);
      setApplyError(err?.message || 'आवेदन सबमिट करने में समस्या आई, पुनः प्रयास करें।');
    }
  };

  // Handle Franchise Player Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myFranchise || !isApproved) return;
    if (!transferRecipient.trim()) {
      setTransferMsg({ type: 'error', text: 'कृपया खिलाड़ी का फोन नंबर या यूजर आईडी दर्ज करें।' });
      return;
    }
    if (transferAmount < 10) {
      setTransferMsg({ type: 'error', text: 'न्यूनतम ट्रांसफर राशि ₹10 है।' });
      return;
    }
    if (transferAmount > (myFranchise.allocatedFund || 0)) {
      setTransferMsg({
        type: 'error',
        text: `पर्याप्त फंड नहीं है! उपलब्ध फ्रेंचाइजी बैलेंस: ₹${(myFranchise.allocatedFund || 0).toLocaleString('en-IN')}`,
      });
      return;
    }

    setTransferLoading(true);
    setTransferMsg(null);
    try {
      const res = await onFranchiseTransfer(transferRecipient.trim(), transferAmount, transferNote.trim());
      setTransferLoading(false);
      if (res.success) {
        setTransferMsg({ type: 'success', text: res.message });
        setTransferRecipient('');
        setTransferAmount(100);
        setTransferNote('');
      } else {
        setTransferMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setTransferLoading(false);
      setTransferMsg({ type: 'error', text: err?.message || 'ट्रांसफर विफल रहा।' });
    }
  };

  // Handle Top-up
  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupUtr.trim()) return;
    setTopupLoading(true);
    if (onRequestMoreFund) {
      await onRequestMoreFund(topupAmount, topupUtr.trim());
    }
    setTopupLoading(false);
    setTopupSuccess(`₹${topupAmount} का फंड टॉप-अप अनुरोध एडमिन को भेज दिया गया है! UTR: ${topupUtr}`);
    setTopupUtr('');
    setTimeout(() => {
      setShowTopupModal(false);
      setTopupSuccess(null);
    }, 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // My transfer history
  const myTransfers = myFranchise
    ? franchiseTransfers.filter((t) => t.franchiseId === myFranchise.franchiseId || t.franchiseUserId === myFranchise.userId)
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-2 sm:px-4 py-4 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL FRANCHISE PARTNER PROGRAM</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              एडमिन फंड फ्रेंचाइजी (Franchise Portal)
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              अपनी आधिकारिक <strong>फ्रेंचाइजी ID</strong> प्राप्त करें! एडमिन से आवंटित फंड से अपने स्थानीय खिलाड़ियों को तुरंत वॉलेट रिचार्ज करें और हर ट्रांजैक्शन पर <strong>3% से 7% तक इंस्टेंट कमीशन</strong> कमाएं।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isApproved ? (
              <div className="px-5 py-3 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300 flex items-center gap-3 shadow-lg">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase text-emerald-400">वेरिफाइड पार्टनर</div>
                  <div className="font-mono font-black text-white text-base">{myFranchise.franchiseId}</div>
                </div>
              </div>
            ) : isPending ? (
              <div className="px-5 py-3 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-300 flex items-center gap-3 shadow-lg">
                <Clock className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase text-amber-400">आवेदन समीक्षाधीन</div>
                  <div className="font-mono font-black text-white text-sm">सत्यापन पेंडिंग</div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('apply-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm hover:from-amber-300 hover:to-yellow-400 shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>फ्रेंचाइजी के लिए अप्लाई करें →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. IF APPROVED: ACTIVE FRANCHISE DASHBOARD */}
      {isApproved && myFranchise && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-400">
          {/* Hologram Partner ID Card */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-900/60 via-slate-900 to-yellow-950/60 border-2 border-amber-400/60 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 border-b border-amber-500/20 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-lg shrink-0 flex items-center justify-center text-slate-950 font-black text-2xl">
                  🏢
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-white">{myFranchise.franchiseName}</h2>
                    <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow">
                      {myFranchise.tier.toUpperCase()} PARTNER
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    पार्टनर: {myFranchise.userName} | {myFranchise.city}, {myFranchise.state} | {myFranchise.userPhone}
                  </p>
                </div>
              </div>

              {/* Franchise ID Chip */}
              <div className="flex items-center gap-2 bg-slate-950/90 p-3 rounded-2xl border-2 border-amber-500/40">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">आपकी फ्रेंचाइजी आईडी</div>
                  <div className="text-xl font-mono font-black text-amber-400 tracking-wider">
                    {myFranchise.franchiseId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(myFranchise.franchiseId)}
                  className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer active:scale-90 transition-all"
                  title="Copy Franchise ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">उपलब्ध फ्रेंचाइजी फंड</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">
                  ₹{(myFranchise.allocatedFund || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-300/80 block">खिलाड़ियों को बांटने हेतु तैयार</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">कमीशन दर (Commission)</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono block">
                  {myFranchise.commissionRate || 5.0}%
                </span>
                <span className="text-[10px] text-amber-400/80 block">हर ₹100 ट्रांसफर पर ₹{myFranchise.commissionRate || 5}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">कुल अर्जित कमीशन</span>
                <span className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono block">
                  ₹{(myFranchise.totalCommissionEarned || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-yellow-300/80 block">शुद्ध लाभ (Net Profit)</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase block">कुल वितरित फंड</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-200 font-mono block">
                  ₹{(myFranchise.totalDistributed || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">{myFranchise.membersServed || 0} खिलाड़ी लाभान्वित</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-amber-500/20">
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>खिलाड़ियों के फोन नंबर पर तुरंत फंड भेजें और इंस्टेंट कमीशन पाएं।</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTopupModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>अधिक फंड जोड़ें (Request Top-Up)</span>
              </button>
            </div>
          </div>

          {/* Quick Player Transfer Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border-2 border-emerald-500/30 shadow-xl space-y-5 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">खिलाड़ी वॉलेट में फंड डालें (Load Player Wallet)</h3>
                  <p className="text-xs text-slate-400">
                    खिलाड़ी का फोन नंबर डालें — उनके वॉलेट में तुरंत बैलेंस क्रेडिट होगा
                  </p>
                </div>
              </div>

              {transferMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                    transferMsg.type === 'success'
                      ? 'bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300'
                      : 'bg-red-950/90 border-2 border-red-500 text-red-300'
                  }`}
                >
                  {transferMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <span>{transferMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    खिलाड़ी का फोन नंबर या User ID <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. 9876543210 या usr_101"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-emerald-400 focus:outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    ट्रांसफर राशि (₹) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={10}
                      max={myFranchise.allocatedFund || 100000}
                      step={10}
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold focus:border-emerald-400 focus:outline-none text-base"
                    />
                  </div>
                  {/* Preset Amount Badges */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[50, 100, 200, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTransferAmount(amt)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          transferAmount === amt
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instant Commission Preview */}
                {(() => {
                  const rate = myFranchise.commissionRate || 5;
                  const comm = (transferAmount * rate) / 100;
                  return (
                    <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <span>इस ट्रांसफर पर आपका इंस्टेंट कमीशन ({rate}%):</span>
                      </span>
                      <span className="font-mono font-black text-emerald-400 text-base">+₹{comm.toFixed(2)}</span>
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">रिमार्क / नोट (वैकल्पिक)</label>
                  <input
                    type="text"
                    placeholder="उदा. Cash received from player at shop"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={transferLoading || (myFranchise.allocatedFund || 0) < transferAmount}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm hover:from-emerald-400 hover:to-teal-400 shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                >
                  {transferLoading ? (
                    <span>प्रोसेसिंग हो रही है...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>तुरंत फंड ट्रांसफर करें (Transfer ₹{transferAmount})</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Recent Franchise Ledger / Transfers */}
            <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border-2 border-amber-500/30 shadow-xl space-y-4 bg-slate-950/70">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-white">हाल के खिलाड़ी रिचार्ज (Transfer Ledger)</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{myTransfers.length} कुल ट्रांजैक्शन</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {myTransfers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                    <p>अभी तक कोई ट्रांसफर नहीं हुआ है।</p>
                    <p className="text-slate-500">बाएं फॉर्म से किसी खिलाड़ी को पहला फंड ट्रांसफर करें!</p>
                  </div>
                ) : (
                  myTransfers.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs hover:border-amber-500/40 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{item.recipientName || 'खिलाड़ी'}</span>
                          <span className="text-slate-400 font-mono text-[10px]">({item.recipientPhone})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString('hi-IN')} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {item.note && ` • ${item.note}`}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-emerald-400 font-mono">₹{item.amount}</div>
                        <div className="text-[10px] text-amber-300 font-bold">
                          कमीशन: +₹{item.commissionEarned}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. IF PENDING: APPLICATION UNDER REVIEW CARD */}
      {isPending && myFranchise && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-2 border-amber-500/60 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Clock className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">आपका फ्रेंचाइजी आवेदन समीक्षा में है</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                आवेदन आईडी: <strong className="font-mono text-amber-400">{myFranchise.franchiseId}</strong> | नाम: {myFranchise.franchiseName}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">चुना गया टियर:</span>
              <span className="font-bold text-amber-300 uppercase">{myFranchise.tier}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">सिक्योरिटी टोकन:</span>
              <span className="font-bold text-white font-mono">₹{myFranchise.securityDeposit}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">सबमिटेड UTR:</span>
              <span className="font-bold text-amber-300 font-mono truncate block" title={myFranchise.utrNumber}>
                {myFranchise.utrNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">अनुमानित समय:</span>
              <span className="font-bold text-emerald-400">10 से 30 मिनट</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            जैसे ही एडमिन आपके पेमेंट UTR को सत्यापित कर अप्रूवल देंगे, आपका <strong>Franchise ID Card</strong> और <strong>फंड डिस्ट्रीब्यूशन पोर्टल</strong> इसी पेज पर स्वतः एक्टिव हो जाएगा।
          </p>
        </div>
      )}

      {/* 4. IF NOT APPLIED OR WANTS TO EXPLORE TIERS: FRANCHISE PLANS & APPLY FORM */}
      {!isApproved && (
        <div id="apply-section" className="space-y-8">
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              फ्रेंचाइजी पार्टनर प्लान चुनें (Choose Franchise Plan)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              अपनी क्षमता अनुसार सिक्योरिटी डिपॉजिट प्लान चुनें और तुरंत अपनी यूनिक फ्रेंचाइजी आईडी बनाकर बिज़नेस शुरू करें।
            </p>
          </div>

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {TIERS.map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id as any)}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? `bg-gradient-to-b ${tier.color} shadow-2xl scale-[1.02]`
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950/60 text-[10px] font-black border border-white/10 uppercase">
                        {tier.badge}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white">{tier.name}</h3>
                      <div className="text-2xl font-black text-white font-mono mt-1">
                        ₹{tier.deposit.toLocaleString('en-IN')}
                        <span className="text-xs font-normal text-slate-300 ml-1">सिक्योरिटी फंड</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">कमीशन लाभ:</span>
                        <span className="font-black text-amber-400">{tier.commission}% Instant</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">दैनिक सीमा:</span>
                        <span className="font-bold text-white">{tier.dailyLimit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">एडमिन फंड सपोर्ट:</span>
                        <span className="font-bold text-emerald-400">100% फुल बैलेंस</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all ${
                      isSelected
                        ? 'bg-white text-slate-950 shadow-lg'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ यह प्लान चुना गया' : 'प्लान चुनें'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Application Form */}
          <div className="glass-panel-gold rounded-3xl p-6 sm:p-10 border-2 border-amber-500/40 shadow-2xl max-w-3xl mx-auto space-y-6">
            <div className="border-b border-amber-500/20 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">फ्रेंचाइजी आवेदन फॉर्म (Application Form)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  चुना गया प्लान: <strong>{activeTierConfig.name}</strong> (सिक्योरिटी डिपॉजिट: ₹{activeTierConfig.deposit})
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                {activeTierConfig.commission}% Commission
              </span>
            </div>

            {applySuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{applySuccess}</span>
              </div>
            )}

            {applyError && (
              <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    फ्रेंचाइजी / क्लब / शॉप का नाम <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. राजधानी तंबोला क्लब"
                    value={franchiseName}
                    onChange={(e) => setFranchiseName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    मनपसंद फ्रेंचाइजी ID (वैकल्पिक)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. FRN-JAIPUR-01 या FRN-TAM-777"
                    value={desiredId}
                    onChange={(e) => setDesiredId(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono text-sm focus:border-amber-400 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    शहर (City) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. Jaipur, Lucknow, Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    राज्य (State)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. Rajasthan, UP, Maharashtra"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Admin UPI Payment Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border-2 border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>सिक्योरिटी डिपॉजिट भुगतान (Security Deposit ₹{activeTierConfig.deposit})</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    100% Refundable / Usable
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px]">ऑफिशियल एडमिन UPI ID:</span>
                    <span className="font-mono font-black text-amber-300 text-sm">{adminUpi}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(adminUpi)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer"
                  >
                    UPI कॉपी करें
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    भुगतान का 12-अंकीय UTR / Ref नंबर <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. 492817293812"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono text-sm focus:border-amber-400 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={applyLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base hover:from-amber-300 hover:to-yellow-300 shadow-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
              >
                {applyLoading ? (
                  <span>आवेदन सबमिट हो रहा है...</span>
                ) : (
                  <>
                    <Building2 className="w-5 h-5 text-slate-950" />
                    <span>फ्रेंचाइजी आवेदन सबमिट करें (Submit Application)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top-up Fund Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-amber-500/50 space-y-5 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>फंड टॉप-अप अनुरोध (Add More Fund)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {topupSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold text-center">
                {topupSuccess}
              </div>
            ) : (
              <form onSubmit={handleTopupSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">टॉप-अप राशि (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-xs border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Admin UPI:</span>
                  <span className="font-mono text-amber-300 font-bold">{adminUpi}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">UTR / Ref नंबर</label>
                  <input
                    type="text"
                    required
                    placeholder="12-digit UTR"
                    value={topupUtr}
                    onChange={(e) => setTopupUtr(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={topupLoading}
                  className="w-full py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 cursor-pointer"
                >
                  {topupLoading ? 'सबमिट हो रहा है...' : 'टॉप-अप अनुरोध सबमिट करें'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
