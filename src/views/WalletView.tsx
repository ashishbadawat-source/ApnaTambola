import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  Sparkles,
  Trophy,
  Gift,
  Search,
  Clock,
  ArrowDownLeft,
  QrCode,
  IndianRupee,
  Check,
  Copy,
  ExternalLink,
  Send,
  ArrowRightLeft,
  Upload,
  Image as ImageIcon,
  Camera,
  X,
  FileText,
} from 'lucide-react';
import { User, WalletTransaction, WithdrawalRequest, SiteSettings } from '../types';

interface WalletViewProps {
  currentUser: User;
  transactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  settings?: SiteSettings;
  users?: User[];
  onDeposit: (amount: number, method: string, utrNumber?: string, proofUrl?: string) => Promise<boolean>;
  onWithdraw: (data: {
    amount: number;
    paymentMethod: 'upi' | 'bank';
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    accountHolder?: string;
  }) => Promise<boolean>;
  onTransferFund?: (recipientQuery: string, amount: number, note?: string) => Promise<{ success: boolean; message: string; data?: any }>;
  onTransferWinningToTicketWallet?: (amount: number) => Promise<{ success: boolean; message: string }>;
  activeModalTab?: 'overview' | 'deposit' | 'withdraw' | 'convert' | 'transfer' | 'transactions' | 'winnings' | 'referral';
}

export const WalletView: React.FC<WalletViewProps> = ({
  currentUser,
  transactions,
  withdrawals,
  settings,
  users = [],
  onDeposit,
  onWithdraw,
  onTransferFund,
  onTransferWinningToTicketWallet,
  activeModalTab = 'overview',
}) => {
  const [currentTab, setCurrentTab] = useState<'overview' | 'deposit' | 'withdraw' | 'convert' | 'transfer' | 'transactions' | 'winnings' | 'referral'>(activeModalTab);

  // Convert (Winnings to Ticket Wallet) Form State
  const [convertAmount, setConvertAmount] = useState<number>(Math.min(currentUser.winningBalance, 200));
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [depositMethod, setDepositMethod] = useState<string>('UPI (PhonePe / GPay / Paytm)');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofImageName, setProofImageName] = useState<string>('');
  const [isDraggingProof, setIsDraggingProof] = useState<boolean>(false);
  const [copiedAdminUpi, setCopiedAdminUpi] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // P2P Transfer Form State
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(100);
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferReceipt, setTransferReceipt] = useState<any>(null);

  const p2pFeeRate = settings?.p2pTransferFeePercentage ?? 5;
  const p2pFeeAmount = Math.round((transferAmount * p2pFeeRate) / 100);
  const p2pTotalDeduction = transferAmount + p2pFeeAmount; // e.g. 100 + 5 = 105
  const hasP2PBalance = currentUser.walletBalance >= p2pTotalDeduction;

  const availableUsers = users.filter((u) => u && u.id !== currentUser.id);
  const matchedRecipient = availableUsers.find(
    (u) =>
      (u.id && u.id.toLowerCase() === transferRecipient.trim().toLowerCase()) ||
      (u.email && u.email.toLowerCase() === transferRecipient.trim().toLowerCase()) ||
      (u.phone && u.phone.replace(/[\s+-]/g, '') === transferRecipient.trim().replace(/[\s+-]/g, '')) ||
      (u.referralCode && u.referralCode.toLowerCase() === transferRecipient.trim().toLowerCase()) ||
      (u.name && u.name.toLowerCase() === transferRecipient.trim().toLowerCase())
  );

  // Admin Configs (with robust defaults)
  const minDepositLimit = settings?.minDeposit ?? 100;
  const depositMultiple = settings?.depositMultiple ?? 100;
  const minWithdrawLimit = settings?.minWithdrawal ?? 100;
  const withdrawMultiple = settings?.withdrawalMultiple ?? 100;
  const tdsPercent = settings?.tdsPercentage ?? 10;
  const adminFeePercent = settings?.adminFeePercentage ?? 5;

  const activeAdminUpi = settings?.adminUpiId || 'venkannabadawat@sbi';
  const activeAdminName = settings?.adminUpiName || 'Tambola Live Official';
  const activeQrCodeUrl =
    settings?.adminQrCodeUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
      `upi://pay?pa=${activeAdminUpi}&pn=${encodeURIComponent(activeAdminName)}&am=${depositAmount}&cu=INR`
    )}`;

  // Dynamic QR for exact entered amount
  const dynamicDepositQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
    `upi://pay?pa=${activeAdminUpi}&pn=${encodeURIComponent(activeAdminName)}&am=${depositAmount}&cu=INR&tn=TambolaRecharge`
  )}`;

  const upiIntentUrl = `upi://pay?pa=${activeAdminUpi}&pn=${encodeURIComponent(activeAdminName)}&am=${depositAmount}&cu=INR&tn=TambolaRecharge`;

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState<string>(currentUser.bankDetails?.upiId || 'ashishbadawat@okhdfcbank');
  const [bankName, setBankName] = useState<string>(currentUser.bankDetails?.bankName || 'HDFC Bank');
  const [accountNumber, setAccountNumber] = useState<string>(currentUser.bankDetails?.accountNumber || '501002918239');
  const [ifsc, setIfsc] = useState<string>(currentUser.bankDetails?.ifsc || 'HDFC0001234');
  const [accountHolder, setAccountHolder] = useState<string>(currentUser.bankDetails?.accountHolder || currentUser.name);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Live Deduction Calculations
  const calculatedTdsAmount = Math.round((withdrawAmount * tdsPercent) / 100);
  const calculatedAdminFee = Math.round((withdrawAmount * adminFeePercent) / 100);
  const calculatedTotalDeductions = calculatedTdsAmount + calculatedAdminFee;
  const calculatedNetPayout = Math.max(0, withdrawAmount - calculatedTotalDeductions);

  // Filter for transactions
  const [txnFilter, setTxnFilter] = useState<string>('all');
  const [txnSearch, setTxnSearch] = useState<string>('');

  // Screenshot file handlers
  const processScreenshotFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setDepositError('कृपया केवल फोटो/इमेज (JPG, PNG, WebP) फाइल अपलोड करें।');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setDepositError('स्क्रीनशॉट फाइल का साइज 8MB से कम होना चाहिए।');
      return;
    }

    setProofImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProofImage(result);
      setDepositError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processScreenshotFile(file);
    }
  };

  const handleScreenshotDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingProof(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processScreenshotFile(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setProofImage(null);
    setProofImageName('');
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    setDepositSuccess(null);

    if (depositAmount < minDepositLimit) {
      setDepositError(`न्यूनतम डिपोजिट राशि ₹${minDepositLimit} है। (Minimum deposit is ₹${minDepositLimit})`);
      return;
    }
    if (depositAmount % depositMultiple !== 0) {
      setDepositError(`डिपोजिट राशि ₹${depositMultiple} के गुणक (Multiple of ₹${depositMultiple}: जैसे ₹100, ₹200, ₹500, ₹1000) में होनी चाहिए।`);
      return;
    }

    setDepositLoading(true);
    const finalUtr = utrNumber.trim() || `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const success = await onDeposit(depositAmount, depositMethod, finalUtr, proofImage || undefined);
    setDepositLoading(false);
    if (success) {
      setDepositSuccess(
        `₹${depositAmount} की डिपोजिट रिक्वेस्ट सफलतापूर्वक दर्ज हो गई है! ${
          proofImage ? 'पेमेंट स्क्रीनशॉट संलग्न है।' : ''
        } (Ref: ${finalUtr})`
      );
      setUtrNumber('');
      setProofImage(null);
      setProofImageName('');
      setTimeout(() => setDepositSuccess(null), 5000);
    }
  };

  const handleCopyAdminUpi = () => {
    navigator.clipboard?.writeText(activeAdminUpi);
    setCopiedAdminUpi(true);
    setTimeout(() => setCopiedAdminUpi(false), 2500);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    if (withdrawAmount > currentUser.winningBalance) {
      setWithdrawError(`आप केवल अपनी विनिंग बैलेंस (₹${currentUser.winningBalance.toLocaleString('en-IN')}) से निकासी कर सकते हैं।`);
      return;
    }
    if (withdrawAmount < minWithdrawLimit) {
      setWithdrawError(`न्यूनतम विथड्रावल राशि ₹${minWithdrawLimit} है। (Minimum withdrawal is ₹${minWithdrawLimit})`);
      return;
    }
    if (withdrawAmount % withdrawMultiple !== 0) {
      setWithdrawError(`विथड्रावल राशि ₹${withdrawMultiple} के गुणक (Multiple of ₹${withdrawMultiple}: जैसे ₹100, ₹200, ₹500, ₹1000) में होनी चाहिए।`);
      return;
    }

    setWithdrawLoading(true);
    const success = await onWithdraw({
      amount: withdrawAmount,
      paymentMethod: withdrawMethod,
      upiId: withdrawMethod === 'upi' ? upiId : undefined,
      bankName: withdrawMethod === 'bank' ? bankName : undefined,
      accountNumber: withdrawMethod === 'bank' ? accountNumber : undefined,
      ifsc: withdrawMethod === 'bank' ? ifsc : undefined,
      accountHolder,
    });
    setWithdrawLoading(false);
    if (success) {
      setWithdrawSuccess(
        `₹${withdrawAmount} की विथड्रावल रिक्वेस्ट सफलतापूर्वक दर्ज हो गई है! (10% TDS: -₹${calculatedTdsAmount}, 5% एडमिन चार्ज: -₹${calculatedAdminFee}) — आपके खाते में शुद्ध राशि ₹${calculatedNetPayout} 5–15 मिनट में प्राप्त हो जाएगी।`
      );
    }
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvertError(null);
    setConvertSuccess(null);

    if (convertAmount <= 0) {
      setConvertError('कृपया मान्य राशि दर्ज करें (Enter a valid amount)');
      return;
    }
    if (convertAmount > currentUser.winningBalance) {
      setConvertError(`आपकी विथड्रॉल बैलेंस (₹${currentUser.winningBalance.toLocaleString('en-IN')}) से अधिक राशि ट्रांसफर नहीं हो सकती।`);
      return;
    }

    setConvertLoading(true);
    if (onTransferWinningToTicketWallet) {
      const res = await onTransferWinningToTicketWallet(convertAmount);
      setConvertLoading(false);
      if (res.success) {
        setConvertSuccess(`सफलतापूर्वक ₹${convertAmount} विथड्रॉल वॉलेट से टिकट वॉलेट में ट्रांसफर हो गए हैं! (0% Transfer Fee)`);
        setConvertAmount(0);
      } else {
        setConvertError(res.message);
      }
    }
  };

  const filteredTxns = transactions.filter((t) => {
    if (!t) return false;
    if (txnFilter !== 'all' && t.type !== txnFilter) return false;
    if (txnSearch) {
      const q = txnSearch.toLowerCase();
      return (
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.referenceId && t.referenceId.toLowerCase().includes(q)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const winningTxns = transactions.filter((t) => t.type === 'prize_won');
  const referralTxns = transactions.filter((t) => t.type === 'referral_commission');

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <WalletIcon className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
              Wallet &amp; Financials (वॉलेट व वित्तीय सेवाएं)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            2-वॉलेट सिस्टम: 🎟️ टिकट वॉलेट (Deposit) + 💰 विथड्रॉल वॉलेट (Winnings) | आसान निकासी व आंतरिक ट्रांसफर
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start lg:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: '📊 2-वॉलेट Overview' },
            { id: 'deposit', label: '➕ Add Money (टिकट वॉलेट)' },
            { id: 'withdraw', label: '💸 Instant Withdraw (विथड्रॉल वॉलेट)' },
            { id: 'convert', label: '🔄 Win ➔ Ticket Transfer' },
            { id: 'transfer', label: '💸 P2P Transfer (5% Fee)' },
            { id: 'transactions', label: '📜 Transactions' },
            { id: 'winnings', label: '🏆 Winnings' },
            { id: 'referral', label: '💰 Referral Income' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === tab.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Core Wallets Breakdown (Featured Multi-Wallet System) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Ticket Wallet (Deposit Cash) */}
        <div className="glass-panel-purple rounded-3xl p-5 border-2 border-purple-500/40 shadow-xl space-y-2 relative overflow-hidden bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between text-xs font-black uppercase text-purple-300 tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>🎟️ 1. टिकट वॉलेट</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] border border-purple-500/30">
              DEPOSIT
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 drop-shadow">
            ₹{currentUser.depositBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-purple-200/90 font-medium leading-tight">
            एडमिन रिचार्ज + ₹10 1st डिपॉजिट बोनस — <strong>केवल टिकट खरीदने हेतु</strong>
          </p>
          <div className="pt-1 flex items-center gap-1 text-[10px] text-slate-400 border-t border-purple-500/20">
            <span>🔒 नो-विथड्रॉल (Non-withdrawable)</span>
          </div>
        </div>

        {/* 2. Withdrawal Wallet (Winning Cash) */}
        <div className="glass-panel-emerald rounded-3xl p-5 border-2 border-emerald-500/50 shadow-xl space-y-2 relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between text-xs font-black uppercase text-emerald-400 tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>💰 2. विथड्रॉल वॉलेट</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 font-black">
              WINNINGS
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow">
            ₹{currentUser.winningBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-200/90 font-medium leading-tight">
            जीता हुआ ईनाम — <strong>100% बैंक/UPI निकासी</strong>
          </p>
          <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-300 border-t border-emerald-500/20 font-bold">
            <span>✓ निकासी योग्य</span>
            <button
              type="button"
              onClick={() => setCurrentTab('convert')}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              ट्रांसफर →
            </button>
          </div>
        </div>

        {/* 3. Daily Bonus / Reward Wallet (10% Unlocks on Admin Deposit) */}
        <div className="glass-panel rounded-3xl p-5 border-2 border-pink-500/40 shadow-xl space-y-2 relative overflow-hidden bg-gradient-to-br from-pink-950/40 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between text-xs font-black uppercase text-pink-300 tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>🎁 3. दैनिक रिवार्ड</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] border border-pink-500/30 font-black">
              10% UNLOCK
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-pink-400 font-mono drop-shadow">
            ₹{(currentUser.bonusRewardBalance ?? 0).toFixed(2)}
          </div>
          <p className="text-[10px] text-pink-200/90 font-medium leading-tight">
            स्पिन/स्क्रैच रिवार्ड — <strong>डिपॉजिट पर 10% अनलॉक होगा</strong>
          </p>
          <div className="pt-1 flex items-center justify-between text-[10px] text-pink-300 border-t border-pink-500/20 font-bold">
            <span>⚡ ₹100 पे ➔ ₹10 टिकट में</span>
            <button
              type="button"
              onClick={() => setCurrentTab('deposit')}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              डिपॉजिट →
            </button>
          </div>
        </div>

        {/* 4. Total Playable Balance */}
        <div className="glass-panel-gold rounded-3xl p-5 border border-amber-400/50 shadow-xl space-y-2 relative overflow-hidden">
          <span className="text-xs uppercase font-bold text-amber-300 tracking-wider flex items-center justify-between">
            <span>कुल वॉलेट बैलेंस</span>
            <WalletIcon className="w-4 h-4 text-amber-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 text-glow-gold">
            ₹{currentUser.walletBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-300">डिपोजिट + विनिंग + रेफरल का योग</p>
          <div className="pt-1 flex items-center gap-1 text-[10px] text-slate-400 border-t border-amber-500/20">
            <span>Ready for tickets</span>
          </div>
        </div>

        {/* 5. 8-Level Referral Earnings */}
        <div className="glass-panel rounded-3xl p-5 border border-indigo-500/30 shadow-xl space-y-2">
          <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider flex items-center justify-between">
            <span>Referral Income (4.6%)</span>
            <Gift className="w-4 h-4 text-indigo-400" />
          </span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300">
            ₹{currentUser.referralBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-indigo-300 font-medium">Earned from 8-tier network</p>
          <div className="pt-1 flex items-center gap-1 text-[10px] text-slate-400 border-t border-indigo-500/20">
            <span>Direct commission</span>
          </div>
        </div>
      </div>

      {/* 📜 Dual Wallet Rules Info Strip */}
      <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-black text-white text-sm">वॉलेट ट्रांसफर नियम (Wallet Rules):</h4>
            <p className="text-slate-400 text-xs">
              • <strong className="text-emerald-400">विथड्रॉल वॉलेट ➔ टिकट वॉलेट:</strong> स्वीकृत (Allowed ✓ - 0% Fee) &nbsp;|&nbsp; 
              • <strong className="text-red-400">टिकट वॉलेट ➔ विथड्रॉल वॉलेट:</strong> प्रतिबंधित (Not Allowed 🔒 - टिकट बैलेंस केवल गेम खेलने हेतु है)
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('convert')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md"
        >
          🔄 विथड्रॉल से टिकट वॉलेट में ट्रांसफर करें
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Actions Panel */}
          <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Quick Financial Actions</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentTab('deposit')}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all group cursor-pointer"
              >
                <PlusCircle className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-sm font-black text-white">Add Money</h4>
                <p className="text-xs text-slate-400 mt-1">Instant via UPI, PhonePe, GPay, Paytm</p>
              </button>

              <button
                onClick={() => setCurrentTab('withdraw')}
                className="p-5 rounded-2xl bg-gradient-to-br from-amber-600/30 to-slate-900 border border-amber-500/40 hover:border-amber-400 text-left transition-all group cursor-pointer"
              >
                <ArrowUpRight className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-sm font-black text-white">Instant Cashout</h4>
                <p className="text-xs text-slate-400 mt-1">Direct to UPI / Bank Account (5-15 mins)</p>
              </button>
            </div>

            {/* Payout Information Notice */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Safe &amp; Fast Payout Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All winning withdrawals are processed automatically via automated banking IMPS and UPI pipelines. Minimum withdrawal is ₹100.
              </p>
            </div>
          </div>

          {/* Recent Financial Ledger Snapshot */}
          <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Recent Activity</span>
              </h3>
              <button
                onClick={() => setCurrentTab('transactions')}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                View Full Ledger →
              </button>
            </div>

            <div className="space-y-2.5">
              {transactions.slice(0, 4).map((txn) => {
                const isPositive = txn.amount > 0;
                return (
                  <div
                    key={txn.id}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{txn.description}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{txn.timestamp}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-black text-sm block ${isPositive ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {isPositive ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Bal: ₹{txn.balanceAfter}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADD MONEY (DEPOSIT WITH ADMIN UPI & QR CODE) */}
      {currentTab === 'deposit' && (
        <div className="glass-panel-gold rounded-3xl p-5 sm:p-8 border-2 border-amber-400/50 shadow-2xl max-w-2xl mx-auto space-y-6 w-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                  <span>Add Money (पैसे जोड़ें)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                    INSTANT UPI
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Scan Admin QR or pay directly to official UPI ID (Min ₹100, Multiple of ₹100)
                </p>
              </div>
            </div>
          </div>

          {depositSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{depositSuccess}</span>
            </div>
          )}

          {depositError && (
            <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{depositError}</span>
            </div>
          )}

          {/* First Deposit Bonus Highlight Banner */}
          {(!currentUser.hasDeposited && !currentUser.firstDepositBonusClaimed) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-2 border-amber-400/70 flex items-center gap-3 shadow-lg animate-pulse">
              <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-lg shrink-0">
                🎁
              </div>
              <div>
                <div className="font-black text-amber-300 text-sm">
                  पहला डिपॉजिट ऑफर: ₹10 का फ्री रजिस्ट्रेशन बोनस!
                </div>
                <div className="text-xs text-amber-100/90 leading-tight">
                  आपके पहले डिपॉजिट (न्यूनतम ₹100) पर ₹10 का रजिस्ट्रेशन बोनस अतिरिक्त रूप से आपके टिकट वॉलेट में स्वतः जुड़ जाएगा (सिर्फ 1 बार)।
                </div>
              </div>
            </div>
          )}

          {/* Deposit Policy Notice Strip */}
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>नियम: मिनिमम ₹100 | ₹100 के मल्टीपल (100, 200, 300, 500...)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30">
              0% Deposit Fee
            </span>
          </div>

          <form onSubmit={handleDepositSubmit} className="space-y-6">
            {/* Quick Amount Chips (Multiples of 100) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Choose Deposit Amount (जमा राशि चुनें)
                </label>
                <span className="text-[10px] text-amber-300 font-bold">₹100 के मल्टीपल</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[100, 200, 300, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setDepositAmount(amt);
                      setDepositError(null);
                    }}
                    className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                      depositAmount === amt
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 scale-105 ring-2 ring-amber-300'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-amber-400/50'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input with Multiple of 100 validation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Or Enter Amount (न्यूनतम ₹100, मल्टीपल 100)
                </label>
                {depositAmount > 0 && (
                  <span
                    className={`text-[10px] font-bold ${
                      depositAmount >= minDepositLimit && depositAmount % depositMultiple === 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {depositAmount < minDepositLimit
                      ? `न्यूनतम ₹${minDepositLimit}`
                      : depositAmount % depositMultiple !== 0
                      ? `₹${depositMultiple} का मल्टीपल होना चाहिए`
                      : `✓ मान्य राशि (Valid Multiple)`}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                <input
                  type="number"
                  min={minDepositLimit}
                  step={depositMultiple}
                  max="100000"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(Number(e.target.value));
                    setDepositError(null);
                  }}
                  className={`w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-950 border-2 text-emerald-300 font-black text-lg focus:outline-none ${
                    depositAmount >= minDepositLimit && depositAmount % depositMultiple === 0
                      ? 'border-slate-700 focus:border-amber-400'
                      : 'border-red-500/80 focus:border-red-400'
                  }`}
                  required
                />
              </div>
            </div>

            {/* 📸 2. Admin QR Code & UPI Details Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 border-emerald-500/40 space-y-4">
              <div className="text-xs font-black uppercase text-emerald-400 flex items-center justify-between">
                <span>2. Scan &amp; Pay to Official Admin UPI (एडमिन को पेमेंट करें)</span>
                <span className="text-[10px] text-slate-400 font-normal">Amount: ₹{depositAmount}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* QR Code Container */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-900 rounded-2xl border border-emerald-500/30">
                  <div className="p-2 bg-white rounded-xl shadow-md">
                    <img
                      src={dynamicDepositQrUrl}
                      alt="Admin UPI QR Code"
                      className="w-32 sm:w-36 h-32 sm:h-36 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 font-bold">
                    Scan with any UPI App
                  </span>
                </div>

                {/* UPI Details & 1-Click Pay */}
                <div className="sm:col-span-7 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">OFFICIAL ADMIN UPI ID:</span>
                    <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
                      <span className="font-mono text-xs font-black text-emerald-300 truncate flex-1">
                        {activeAdminUpi}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAdminUpi}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        {copiedAdminUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAdminUpi ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Merchant: <strong className="text-white">{activeAdminName}</strong>
                    </span>
                  </div>

                  {/* Quick 1-Click UPI Intent Launchers */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">OPEN DIRECTLY IN UPI APP:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <a
                        href={upiIntentUrl}
                        className="py-1.5 px-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-200 text-[10px] font-bold text-center flex items-center justify-center gap-1"
                      >
                        <span>PhonePe</span>
                      </a>
                      <a
                        href={upiIntentUrl}
                        className="py-1.5 px-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-blue-200 text-[10px] font-bold text-center flex items-center justify-center gap-1"
                      >
                        <span>GPay</span>
                      </a>
                      <a
                        href={upiIntentUrl}
                        className="py-1.5 px-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 text-[10px] font-bold text-center flex items-center justify-center gap-1"
                      >
                        <span>Paytm</span>
                      </a>
                    </div>
                  </div>

                  {/* Bank Transfer Details If Configured */}
                  {settings?.adminBankName && (
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-300 space-y-0.5">
                      <div>Bank: <strong className="text-white">{settings.adminBankName}</strong></div>
                      <div>A/C: <strong className="text-white font-mono">{settings.adminAccountNo}</strong> | IFSC: <strong className="text-white font-mono">{settings.adminIfsc}</strong></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Enter UTR / Reference Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Enter 12-Digit UTR / UPI Reference No. (पेमेंट के बाद UTR नंबर डालें)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 482910394820 (Found in PhonePe / GPay / Paytm receipt)"
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setUtrNumber(`${Math.floor(400000000000 + Math.random() * 500000000000)}`)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 font-bold border border-amber-400/30 cursor-pointer"
                >
                  ⚡ Auto-Detect UTR
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Tip: After transferring via UPI, check your UPI app for the 12-digit UTR or Transaction ID.
              </p>
            </div>

            {/* 📸 4. Upload Payment Screenshot (पेमेंट रसीद / स्क्रीनशॉट) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>4. Payment Screenshot / Proof (स्क्रीनशॉट अपलोड करें - ऐच्छिक/अनुशंसित)</span>
                </label>
                {proofImage && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>संलग्न है</span>
                  </span>
                )}
              </div>

              {!proofImage ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingProof(true);
                  }}
                  onDragLeave={() => setIsDraggingProof(false)}
                  onDrop={handleScreenshotDrop}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center space-y-2 cursor-pointer relative ${
                    isDraggingProof
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-slate-700 hover:border-amber-400/60 bg-slate-950/70'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-300 mx-auto flex items-center justify-center border border-amber-400/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      यहाँ क्लिक करें या स्क्रीनशॉट ड्रैग करके छोड़ें (Click or Drag &amp; Drop)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      PNG, JPG, JPEG, WebP (Max 8MB) — तुरंत अप्रूवल में मददगार
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative">
                      <img
                        src={proofImage}
                        alt="Payment Proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 truncate">
                        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{proofImageName || 'Payment_Receipt.png'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        स्क्रीनशॉट सफलता से अटैच हो गया है
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold flex items-center gap-1 border border-red-500/30 cursor-pointer shrink-0"
                    title="Remove Screenshot"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">हटाएँ</span>
                  </button>
                </div>
              )}
            </div>

            {/* 🎁 10% Daily Bonus Reward Unlock Preview Card */}
            {(() => {
              const availableReward = currentUser.bonusRewardBalance ?? 0;
              const tenPercent = depositAmount * 0.10;
              const willUnlock = Math.min(tenPercent, availableReward);
              const totalCredit = depositAmount + willUnlock;

              return (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/60 via-purple-950/60 to-slate-900 border-2 border-pink-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-pink-300 flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-pink-400" />
                      <span>10% दैनिक रिवार्ड अनलॉक (Daily Reward Bonus)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
                      10% EXTRA
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">आपका रिवार्ड बैलेंस</span>
                      <span className="text-xs font-black text-pink-400 font-mono">₹{availableReward.toFixed(2)}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/70 border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-300 block font-medium">10% अनलॉक होगा</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">+₹{willUnlock.toFixed(2)}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/70 border border-amber-500/40">
                      <span className="text-[10px] text-amber-300 block font-medium">कुल टिकट बैलेंस</span>
                      <span className="text-xs font-black text-amber-400 font-mono">₹{totalCredit.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-tight">
                    {willUnlock > 0 ? (
                      <span>
                        🎉 <strong>बोनस लाभ:</strong> ₹{depositAmount} रिचार्ज पर ₹{willUnlock.toFixed(2)} रिवार्ड वॉलेट से अनलॉक होकर कुल <strong>₹{totalCredit.toFixed(2)}</strong> आपके टिकट वॉलेट में जुड़ेंगे!
                      </span>
                    ) : (
                      <span>
                        💡 स्पिन व स्क्रैच कार्ड खेलकर दैनिक रिवार्ड इकट्ठा करें ताकि रिचार्ज पर 10% अतिरिक्त लाभ मिले!
                      </span>
                    )}
                  </p>
                </div>
              );
            })()}

            {/* Submit Recharge Button */}
            <button
              type="submit"
              disabled={
                depositLoading ||
                depositAmount < minDepositLimit ||
                depositAmount % depositMultiple !== 0
              }
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Check className="w-5 h-5" />
              <span>
                {depositLoading
                  ? 'Verifying & Recharging...'
                  : (() => {
                      const willUnlock = Math.min(depositAmount * 0.10, currentUser.bonusRewardBalance ?? 0);
                      return willUnlock > 0
                        ? `I HAVE PAID — RECHARGE ₹${depositAmount} (+₹${willUnlock.toFixed(2)} UNLOCKED)`
                        : `I HAVE PAID — CONFIRM ₹${depositAmount} RECHARGE`;
                    })()}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: WITHDRAW WITH 10% TDS & 5% ADMIN CHARGES */}
      {currentTab === 'withdraw' && (
        <div className="glass-panel-gold rounded-3xl p-5 sm:p-8 border-2 border-amber-400/50 shadow-2xl max-w-2xl mx-auto space-y-6 w-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  Withdraw Winning Cash (जीत की निकासी)
                </h2>
                <p className="text-xs text-slate-400">
                  न्यूनतम ₹100, ₹100 के मल्टीपल | 10% TDS व 5% एडमिन चार्जेस लागू
                </p>
              </div>
            </div>
          </div>

          {/* Winning Balance Card Notice */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-bold">Withdrawable Winning Cash</span>
              <span className="text-2xl font-black text-emerald-400">
                ₹{currentUser.winningBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-xl border border-amber-500/30 block">
                10% TDS + 5% Admin
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">कुल 15% कटौती</span>
            </div>
          </div>

          {withdrawSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{withdrawSuccess}</span>
            </div>
          )}

          {withdrawError && (
            <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{withdrawError}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-6">
            {/* Quick Amount Chips (Multiples of 100) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Choose Withdrawal Amount (राशि चुनें)
                </label>
                <span className="text-[10px] text-amber-300 font-bold">₹100 के मल्टीपल</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[100, 200, 300, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={amt > currentUser.winningBalance}
                    onClick={() => {
                      setWithdrawAmount(amt);
                      setWithdrawError(null);
                    }}
                    className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      withdrawAmount === amt
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 scale-105 ring-2 ring-amber-300'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-amber-400/50'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input with Multiple of 100 check */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Enter Withdrawal Amount (₹)
                </label>
                {withdrawAmount > 0 && (
                  <span
                    className={`text-[10px] font-bold ${
                      withdrawAmount >= minWithdrawLimit &&
                      withdrawAmount % withdrawMultiple === 0 &&
                      withdrawAmount <= currentUser.winningBalance
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {withdrawAmount < minWithdrawLimit
                      ? `न्यूनतम ₹${minWithdrawLimit}`
                      : withdrawAmount % withdrawMultiple !== 0
                      ? `₹${withdrawMultiple} का मल्टीपल होना चाहिए`
                      : withdrawAmount > currentUser.winningBalance
                      ? `विनिंग बैलेंस से अधिक है`
                      : `✓ मान्य राशि (Valid Multiple)`}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                <input
                  type="number"
                  min={minWithdrawLimit}
                  step={withdrawMultiple}
                  max={currentUser.winningBalance}
                  value={withdrawAmount}
                  onChange={(e) => {
                    setWithdrawAmount(Number(e.target.value));
                    setWithdrawError(null);
                  }}
                  className={`w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-950 border-2 text-white font-black text-lg focus:outline-none ${
                    withdrawAmount >= minWithdrawLimit &&
                    withdrawAmount % withdrawMultiple === 0 &&
                    withdrawAmount <= currentUser.winningBalance
                      ? 'border-slate-700 focus:border-amber-400'
                      : 'border-red-500/80 focus:border-red-400'
                  }`}
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 block">
                न्यूनतम: ₹100 | ₹100 के मल्टीपल (100, 200, 300, 500, 1000...) | दैनिक अधिकतम: ₹50,000
              </span>
            </div>

            {/* 🧾 10% TDS & 5% ADMIN CHARGES TRANSPARENT BREAKDOWN CARD */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border-2 border-amber-400/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-amber-400" />
                  <span>Fee &amp; Payout Calculation (निकासी कटौती व शुद्ध भुगतान)</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">Total Deductions: 15%</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Gross Amount */}
                <div className="flex items-center justify-between text-slate-300">
                  <span>Gross Withdrawal Amount (अनुरोधित राशि):</span>
                  <span className="font-bold text-white font-mono text-sm">₹{withdrawAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* 10% TDS */}
                <div className="flex items-center justify-between text-red-300">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/30">
                      10% TDS
                    </span>
                    <span>सरकारी टैक्स कटौती (Govt TDS):</span>
                  </div>
                  <span className="font-bold text-red-400 font-mono">-₹{calculatedTdsAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* 5% Admin Charges */}
                <div className="flex items-center justify-between text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] border border-amber-500/30">
                      5% ADMIN
                    </span>
                    <span>एडमिन चार्जेस (Platform Handling):</span>
                  </div>
                  <span className="font-bold text-amber-400 font-mono">-₹{calculatedAdminFee.toLocaleString('en-IN')}</span>
                </div>

                {/* Total Deductions */}
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80 text-[11px]">
                  <span>Total Deductions (कुल कटौती - 15%):</span>
                  <span className="font-bold text-red-400 font-mono">-₹{calculatedTotalDeductions.toLocaleString('en-IN')}</span>
                </div>

                {/* Net Payout */}
                <div className="flex items-center justify-between bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/40 text-emerald-300 font-bold">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-black text-emerald-200">
                      Net Amount to Receive (खाते में प्राप्त शुद्ध राशि):
                    </span>
                    <span className="block text-[10px] text-emerald-400/80 font-normal">
                      Direct IMPS / UPI Transfer (85% of Requested Amount)
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
                    ₹{calculatedNetPayout.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payout Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Payout Destination (भुगतान का माध्यम)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setWithdrawMethod('upi')}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                    withdrawMethod === 'upi'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">Instant UPI (GPay / PhonePe)</span>
                </div>
                <div
                  onClick={() => setWithdrawMethod('bank')}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                    withdrawMethod === 'bank'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">Bank Transfer (IMPS)</span>
                </div>
              </div>
            </div>

            {withdrawMethod === 'upi' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">UPI ID / VPA</label>
                <input
                  type="text"
                  placeholder="e.g. mobile@upi or username@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                  required
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 uppercase font-mono font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">Account Holder Name</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                withdrawLoading ||
                currentUser.winningBalance < minWithdrawLimit ||
                withdrawAmount < minWithdrawLimit ||
                withdrawAmount % withdrawMultiple !== 0 ||
                withdrawAmount > currentUser.winningBalance
              }
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>
                {withdrawLoading
                  ? 'Submitting Request...'
                  : `CONFIRM WITHDRAWAL OF ₹${withdrawAmount} (NET PAYOUT: ₹${calculatedNetPayout})`}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB: CONVERT / TRANSFER (WITHDRAWAL WALLET ➔ TICKET WALLET) */}
      {currentTab === 'convert' && (
        <div className="glass-panel-emerald rounded-3xl p-5 sm:p-8 border-2 border-emerald-500/50 shadow-2xl max-w-2xl mx-auto space-y-6 w-full overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-[#0c1020]">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                  <span>विथड्रॉल ➔ टिकट वॉलेट ट्रांसफर</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                    0% FEE • INSTANT
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Transfer winning balance into Ticket Wallet to purchase tickets without recharging.
                </p>
              </div>
            </div>
          </div>

          {convertSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{convertSuccess}</span>
            </div>
          )}

          {convertError && (
            <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-300 text-xs font-bold flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{convertError}</span>
            </div>
          )}

          {/* Balance Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                स्रोत: विथड्रॉल वॉलेट (Winning Balance)
              </span>
              <div className="text-2xl font-black text-emerald-300">
                ₹{currentUser.winningBalance.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 block">यहाँ से राशि डेबिट होगी</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-300 block tracking-wider">
                गंतव्य: टिकट वॉलेट (Ticket Wallet)
              </span>
              <div className="text-2xl font-black text-purple-300">
                ₹{currentUser.depositBalance.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 block">यहाँ राशि क्रेडिट होगी (टिकट खरीदने हेतु)</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleConvertSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  ट्रांसफर करने हेतु राशि चुनें (Select Amount)
                </label>
                <button
                  type="button"
                  onClick={() => setConvertAmount(currentUser.winningBalance)}
                  className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  पूरा बैलेंस (Max ₹{currentUser.winningBalance})
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={amt > currentUser.winningBalance}
                    onClick={() => {
                      setConvertAmount(amt);
                      setConvertError(null);
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-30 ${
                      convertAmount === amt
                        ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  max={currentUser.winningBalance}
                  value={convertAmount || ''}
                  onChange={(e) => {
                    setConvertAmount(Number(e.target.value));
                    setConvertError(null);
                  }}
                  placeholder="Enter transfer amount"
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 text-emerald-300 font-black text-lg focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            {convertAmount > 0 && convertAmount <= currentUser.winningBalance && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2 text-xs">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>ट्रांसफर उपरांत नया बैलेंस (Balance after transfer):</span>
                  <span className="text-emerald-400">0% फ़ीस (Zero Fee)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>नया विथड्रॉल वॉलेट:</span>
                  <strong className="text-emerald-300 font-mono">₹{(currentUser.winningBalance - convertAmount).toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>नया टिकट वॉलेट:</span>
                  <strong className="text-purple-300 font-mono">₹{(currentUser.depositBalance + convertAmount).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            )}

            {/* Rule Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed space-y-1">
              <strong className="font-black block">⚠️ महत्वपूर्ण नियम (Important Rule):</strong>
              <p>
                विथड्रॉल वॉलेट से टिकट वॉलेट में ट्रांसफर किया गया फंड केवल <strong>गेम के टिकट खरीदने</strong> में इस्तेमाल किया जा सकता है। एक बार टिकट वॉलेट में जाने के बाद यह वापस विथड्रॉल वॉलेट में नहीं आएगा।
              </p>
            </div>

            <button
              type="submit"
              disabled={convertLoading || convertAmount <= 0 || convertAmount > currentUser.winningBalance}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-40"
            >
              <ArrowRightLeft className="w-5 h-5" />
              <span>
                {convertLoading
                  ? 'Transferring Funds...'
                  : `CONFIRM ₹${convertAmount} TRANSFER TO TICKET WALLET`}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB: P2P USER-TO-USER TRANSFER (5% FEE) */}
      {currentTab === 'transfer' && (
        <div className="glass-panel-gold rounded-3xl p-5 sm:p-8 border-2 border-amber-400/50 shadow-2xl max-w-2xl mx-auto space-y-6 w-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  User-to-User Fund Transfer (यूज़र से यूज़र ट्रांसफर)
                </h2>
                <p className="text-xs text-slate-400">
                  Transfer money to any player instantly. 5% platform charge applies.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
              5% FEE
            </span>
          </div>

          {/* Transfer Result Banner */}
          {transferSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span>{transferSuccess}</span>
                  {transferReceipt && (
                    <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      Ref: {transferReceipt.refCode} • Sent to: {transferReceipt.recipientName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {transferError && (
            <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-300 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{transferError}</span>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setTransferError(null);
              setTransferSuccess(null);

              if (!transferRecipient.trim()) {
                setTransferError('कृपया प्राप्तकर्ता का मोबाइल नंबर, ईमेल या यूज़र आईडी दर्ज करें।');
                return;
              }
              if (transferAmount <= 0) {
                setTransferError('कृपया मान्य ट्रांसफर राशि दर्ज करें।');
                return;
              }
              if (!hasP2PBalance) {
                setTransferError(`अपर्याप्त वॉलेट बैलेंस! ₹${transferAmount} भेजने हेतु 5% शुल्क (₹${p2pFeeAmount}) सहित कुल ₹${p2pTotalDeduction} की आवश्यकता है।`);
                return;
              }

              if (onTransferFund) {
                setTransferLoading(true);
                try {
                  const res = await onTransferFund(transferRecipient, transferAmount, transferNote);
                  if (res.success) {
                    setTransferSuccess(res.message);
                    setTransferReceipt(res.data);
                    setTransferRecipient('');
                    setTransferNote('');
                  } else {
                    setTransferError(res.message);
                  }
                } catch (err: any) {
                  setTransferError(err?.message || 'ट्रांसफर विफल रहा। पुनः प्रयास करें।');
                } finally {
                  setTransferLoading(false);
                }
              }
            }}
            className="space-y-6"
          >
            {/* 1. Recipient Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Recipient Identifier (प्राप्तकर्ता: मोबाइल / ईमेल / यूज़र ID)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or user@email.com or referral code"
                  value={transferRecipient}
                  onChange={(e) => {
                    setTransferRecipient(e.target.value);
                    setTransferError(null);
                  }}
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3 text-xs text-white font-medium focus:outline-none focus:border-amber-400"
                  required
                />
                {matchedRecipient && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{matchedRecipient.name} (Verified)</span>
                  </span>
                )}
              </div>

              {/* Quick Select from Users List */}
              {availableUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {availableUsers.slice(0, 5).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setTransferRecipient(u.phone || u.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
                        transferRecipient === u.phone || transferRecipient === u.id
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                      <span>{u.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Amount Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Transfer Amount (प्राप्तकर्ता को मिलने वाली राशि)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-amber-400">₹</span>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl pl-9 pr-4 py-3 text-lg font-black text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                {[50, 100, 200, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      transferAmount === amt
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-300'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-amber-400 hover:text-white'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Transparent 5% Fee Breakdown Card (Exact requirement from user) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border-2 border-amber-400/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-amber-400" />
                  <span>5% Fee Calculation Summary (₹100 ट्रांसफर पर ₹105 कटेंगे)</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Balance: <strong className="text-white">₹{currentUser.walletBalance.toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Recipient Receives (प्राप्तकर्ता को मिलेगा):</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">₹{transferAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] border border-amber-500/30">
                      5% FEE
                    </span>
                    <span>5% ट्रांसफर शुल्क (Platform Fee):</span>
                  </div>
                  <span className="font-bold text-amber-400 font-mono">+₹{p2pFeeAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-amber-300 pt-2 border-t border-slate-800/80">
                  <span className="font-black text-sm">Total Deducted from Your Wallet (कुल कटौती):</span>
                  <span className="font-black text-base text-amber-400 font-mono">₹{p2pTotalDeduction.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Remaining Balance After Transfer (बचा हुआ बैलेंस):</span>
                  <span className={`font-bold font-mono ${currentUser.walletBalance - p2pTotalDeduction < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                    ₹{Math.max(0, currentUser.walletBalance - p2pTotalDeduction).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>नियम:</strong> यदि आप <strong>₹100</strong> ट्रांसफर करते हैं तो आपके वॉलेट से कुल <strong>₹105</strong> कटेंगे, और प्राप्तकर्ता को पूरे <strong>₹100</strong> प्राप्त होंगे।
                </span>
              </div>
            </div>

            {/* 4. Optional Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                4. Optional Note (वैकल्पिक टिप्पणी)
              </label>
              <input
                type="text"
                placeholder="e.g. For Housie Tickets / Tambola Prize"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={transferLoading || !hasP2PBalance || transferAmount <= 0 || !transferRecipient.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>
                {transferLoading
                  ? 'Processing Transfer...'
                  : `SEND ₹${transferAmount} (TOTAL DEDUCT ₹${p2pTotalDeduction})`}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS (LEDGER) */}
      {currentTab === 'transactions' && (
        <section className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-100">
              Transaction History ({filteredTxns.length})
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search UTR / Desc..."
                  value={txnSearch}
                  onChange={(e) => setTxnSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'deposit', label: 'Deposits' },
                  { id: 'prize_won', label: 'Winnings' },
                  { id: 'ticket_purchase', label: 'Tickets' },
                  { id: 'withdrawal', label: 'Withdrawals' },
                  { id: 'p2p_transfer_sent', label: 'P2P Sent' },
                  { id: 'p2p_transfer_received', label: 'P2P Received' },
                  { id: 'referral_commission', label: 'Referral' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTxnFilter(f.id)}
                    className={`px-3 py-1 rounded-lg font-bold shrink-0 cursor-pointer ${
                      txnFilter === f.id ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Reference / Mode</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Date &amp; Time</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTxns.map((txn) => {
                  const isPositive = txn.amount > 0;
                  return (
                    <tr key={txn.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          txn.type === 'deposit'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : txn.type === 'prize_won'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : txn.type === 'referral_commission'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {txn.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-100">{txn.description}</td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">{txn.referenceId || txn.paymentMethod || '--'}</td>
                      <td className={`p-3 text-right font-black text-sm ${isPositive ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {isPositive ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                      </td>
                      <td className="p-3 font-mono text-slate-400">₹{txn.balanceAfter}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{txn.timestamp}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: WINNING HISTORY */}
      {currentTab === 'winnings' && (
        <section className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>My Tambola Winning History</span>
              </h3>
              <p className="text-xs text-slate-400">All prizes claimed and credited to your winning cashout balance</p>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold border border-amber-500/30">
              Total Won: ₹{currentUser.winningBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {winningTxns.map((w, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">PRIZE WIN</span>
                  <span className="text-emerald-400 font-black text-base">+₹{w.amount}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{w.description}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Ref: {w.referenceId || 'CLAIM_AUTO'}</span>
                  <span>{w.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 6: REFERRAL INCOME */}
      {currentTab === 'referral' && (
        <section className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-indigo-400" />
                <span>5-Level Referral Commission Income</span>
              </h3>
              <p className="text-xs text-slate-400">Passive revenue earned from your 5-tier network ticket purchases</p>
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold border border-indigo-500/30">
              Commission Earned: ₹{currentUser.referralBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {referralTxns.map((r, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">LEVEL REVENUE</span>
                  <span className="text-indigo-300 font-black text-base">+₹{r.amount}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{r.description}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Direct to Wallet</span>
                  <span>{r.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
export default WalletView;
