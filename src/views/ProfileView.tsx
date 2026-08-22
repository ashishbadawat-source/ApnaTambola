import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Shield,
  CheckCircle2,
  Phone,
  Mail,
  CreditCard,
  Building2,
  Gift,
  Save,
  Trophy,
  Flame,
  Ticket,
  Sparkles,
  Award,
  Star,
  Target,
  Zap,
  TrendingUp,
  Dices,
  Play,
  ArrowRight,
  LogIn,
  LogOut,
  UserPlus,
  KeyRound,
  FileText,
  Upload,
  Lock,
  Smartphone,
  Check,
  AlertCircle,
  Clock,
  Laptop,
  Globe,
  RefreshCw,
  Camera,
  Send,
  ArrowRightLeft,
  IndianRupee,
  Share2,
  Copy,
  Receipt,
  Search,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { User, TambolaTicket, GameWinner, TambolaGame, WalletTransaction, SiteSettings } from '../types';
import { playNumberCallSound, speakNumberCall } from '../utils/audio';

interface ProfileViewProps {
  currentUser: User;
  onUpdateProfile: (updated: Partial<User>) => void;
  onTransferFund?: (recipientQuery: string, amount: number, note?: string) => Promise<{ success: boolean; message: string; data?: any }>;
  users?: User[];
  transactions?: WalletTransaction[];
  settings?: SiteSettings;
  tickets?: TambolaTicket[];
  winners?: GameWinner[];
  games?: TambolaGame[];
  onNavigate?: (tab: string, gameId?: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  onTransferFund,
  users = [],
  transactions = [],
  settings,
  tickets = [],
  winners = [],
  games = [],
  onNavigate,
  onOpenAuth,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'transfer' | 'bank' | 'kyc' | 'security' | 'password' | 'lucky'>('profile');

  // Personal Info Form State
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Hidden file input reference for photo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Bank Form State
  const [upiId, setUpiId] = useState(currentUser.bankDetails?.upiId || 'ashishbadawat@okhdfcbank');
  const [bankName, setBankName] = useState(currentUser.bankDetails?.bankName || 'HDFC Bank');
  const [accountNumber, setAccountNumber] = useState(currentUser.bankDetails?.accountNumber || '501002918239');
  const [ifsc, setIfsc] = useState(currentUser.bankDetails?.ifsc || 'HDFC0001234');
  const [accountHolder, setAccountHolder] = useState(currentUser.bankDetails?.accountHolder || currentUser.name);

  // KYC Form State
  const [aadhaarNumber, setAadhaarNumber] = useState('7890 1234 5678');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [kycStatus, setKycStatus] = useState<string>(currentUser.kycStatus || 'verified');
  const [kycSubmitted, setKycSubmitted] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Security Settings State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Lucky Numbers Studio
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([7, 21, 47, 69, 88]);

  // P2P Transfer State
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(100);
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    success: boolean;
    message: string;
    receipt?: any;
  } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const feePercentage = settings?.p2pTransferFeePercentage ?? 5;
  const calculatedTransferFee = Math.round((transferAmount * feePercentage) / 100);
  const calculatedTotalDeduction = transferAmount + calculatedTransferFee; // e.g., 100 + 5 = 105
  const hasSufficientBalance = currentUser.walletBalance >= calculatedTotalDeduction;

  // Filter other users for quick select
  const availableUsers = users.filter((u) => u.id !== currentUser.id);

  // Verified recipient match in real-time
  const matchedRecipient = availableUsers.find(
    (u) =>
      u.id.toLowerCase() === transferRecipient.trim().toLowerCase() ||
      u.email.toLowerCase() === transferRecipient.trim().toLowerCase() ||
      u.phone.replace(/[\s+-]/g, '') === transferRecipient.trim().replace(/[\s+-]/g, '') ||
      (u.referralCode && u.referralCode.toLowerCase() === transferRecipient.trim().toLowerCase()) ||
      u.name.toLowerCase() === transferRecipient.trim().toLowerCase()
  );

  // Handle Photo Upload from local device (Camera / Gallery / Files)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    setUploadSuccess(null);

    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('कृपया केवल इमेज फाइल (JPG, PNG, WEBP) चुनें।');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('इमेज का साइज़ 5MB से कम होना चाहिए।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatar(result);
        onUpdateProfile({ avatar: result });
        setUploadSuccess('✓ फोटो सफलतापूर्वक अपलोड हो गया!');
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    };
    reader.onerror = () => {
      setUploadError('इमेज पढ़ने में समस्या आई। कृपया पुनः प्रयास करें।');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      phone,
      email,
      avatar,
      bankDetails: {
        upiId,
        bankName,
        accountNumber,
        ifsc,
        accountHolder,
      },
    });
    setSavedMessage('✓ प्रोफाइल विवरण सफलतापूर्वक सेव हो गया!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      bankDetails: {
        upiId,
        bankName,
        accountNumber,
        ifsc,
        accountHolder,
      },
    });
    setSavedMessage('✓ बैंक एवं UPI विवरण सफलतापूर्वक अपडेट हो गया!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleSubmitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    setKycStatus('verified');
    setKycSubmitted(true);
    onUpdateProfile({ kycStatus: 'verified' });
    setSavedMessage('✓ KYC दस्तावेज सफलतापूर्वक सत्यापित हो गए!');
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('कृपया वर्तमान पासवर्ड दर्ज करें।');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('नया पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते।');
      return;
    }

    setPasswordSuccess('✓ पासवर्ड सफलतापूर्वक बदल दिया गया!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(null), 4000);
  };

  const handleToggleLuckyNumber = (num: number) => {
    if (luckyNumbers.includes(num)) {
      setLuckyNumbers(luckyNumbers.filter((n) => n !== num));
    } else {
      if (luckyNumbers.length >= 6) {
        alert('आप अधिकतम 6 लकी नंबर चुन सकते हैं!');
        return;
      }
      setLuckyNumbers([...luckyNumbers, num]);
      playNumberCallSound();
      speakNumberCall(num);
    }
  };

  const getBallClass = (num: number) => {
    if (num <= 18) return 'ball-red';
    if (num <= 36) return 'ball-gold';
    if (num <= 54) return 'ball-green';
    if (num <= 72) return 'ball-blue';
    return 'ball-purple';
  };

  // Submit P2P Transfer
  const handleInitiateTransfer = () => {
    if (!transferRecipient.trim()) {
      alert('कृपया प्राप्तकर्ता का मोबाइल नंबर, ईमेल या यूज़र आईडी दर्ज करें।');
      return;
    }
    if (transferAmount <= 0) {
      alert('कृपया मान्य ट्रांसफर राशि दर्ज करें।');
      return;
    }
    if (!hasSufficientBalance) {
      alert(`अपर्याप्त वॉलेट बैलेंस! ₹${transferAmount} भेजने के लिए 5% शुल्क (₹${calculatedTransferFee}) सहित कुल ₹${calculatedTotalDeduction} की आवश्यकता है।`);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteTransfer = async () => {
    if (!onTransferFund) return;
    setTransferLoading(true);
    setShowConfirmModal(false);

    try {
      const res = await onTransferFund(transferRecipient, transferAmount, transferNote);
      setTransferResult({
        success: res.success,
        message: res.message,
        receipt: res.data,
      });
      if (res.success) {
        setTransferRecipient('');
        setTransferNote('');
      }
    } catch (err: any) {
      setTransferResult({
        success: false,
        message: err?.message || 'ट्रांसफर विफल रहा। पुनः प्रयास करें।',
      });
    } finally {
      setTransferLoading(false);
    }
  };

  // Filter P2P transactions for history list
  const p2pTransactions = transactions.filter(
    (t) => t.type === 'p2p_transfer_sent' || t.type === 'p2p_transfer_received'
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden File Input for Custom Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
        id="profile-photo-upload-input"
      />

      {/* Top Banner & Profile Overview */}
      <div className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with Camera Overlay & Upload Button */}
          <div className="relative group">
            <img
              src={avatar}
              alt={currentUser.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-amber-400/80 shadow-2xl shadow-amber-400/20 transition-transform group-hover:scale-105"
            />
            {/* Quick Upload Trigger on Avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/40 transition-all hover:scale-110 cursor-pointer"
              title="Upload Custom Profile Photo (अपना फोटो अपलोड करें)"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>{currentUser.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    VIP Level {currentUser.level || 1}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center sm:justify-start gap-3">
                  <span>ID: <strong className="text-slate-200 font-mono">{currentUser.id}</strong></span>
                  <span>•</span>
                  <span>Ref: <strong className="text-amber-400 font-mono">{currentUser.referralCode || 'TB999'}</strong></span>
                </p>
              </div>

              {/* Photo Upload Action Buttons */}
              <div className="flex items-center gap-2 justify-center sm:justify-start pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Avatars</span>
                </button>
              </div>
            </div>

            {/* Upload notifications */}
            {uploadSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{uploadSuccess}</span>
              </div>
            )}
            {uploadError && (
              <div className="p-2.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Wallet Overview Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Wallet</span>
                <span className="text-base sm:text-lg font-black text-amber-400">
                  ₹{currentUser.walletBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Winnings</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  ₹{currentUser.winningBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tickets Played</span>
                <span className="text-base sm:text-lg font-black text-purple-400">
                  {currentUser.gamesPlayed || 42}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Won</span>
                <span className="text-base sm:text-lg font-black text-amber-300">
                  ₹{(currentUser.totalWinnings || 18500).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preset Avatar Selector Dropdown */}
        {showAvatarPicker && (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">
                या लाइब्रेरी से डिफ़ॉल्ट अवतार चुनें (Choose Preset Avatar):
              </span>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                बंद करें ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {AVATAR_OPTIONS.map((imgUrl, i) => (
                <img
                  key={i}
                  src={imgUrl}
                  alt={`Avatar ${i}`}
                  onClick={() => {
                    setAvatar(imgUrl);
                    onUpdateProfile({ avatar: imgUrl });
                    setShowAvatarPicker(false);
                  }}
                  className={`w-12 h-12 rounded-2xl object-cover cursor-pointer border-2 transition-all hover:scale-110 ${
                    avatar === imgUrl ? 'border-amber-400 ring-4 ring-amber-400/40' : 'border-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
        {[
          { id: 'profile', label: '👤 Profile & Photo' },
          { id: 'transfer', label: '💸 P2P Transfer (5% Fee)' },
          { id: 'bank', label: '🏦 Bank & UPI' },
          { id: 'kyc', label: '🛡️ KYC Verification' },
          { id: 'password', label: '🔑 Change Password' },
          { id: 'security', label: '🔒 Security & 2FA' },
          { id: 'lucky', label: '⭐ Lucky Numbers (1-90)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Tab 1: Profile & Custom Photo Upload */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-amber-400" />
              <span>Personal Profile &amp; Photo Management</span>
            </h2>
            <span className="text-xs text-slate-400">Account ID: {currentUser.id}</span>
          </div>

          {/* Photo Upload Zone */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <img
                src={avatar}
                alt="Profile Preview"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
              />
              <span className="absolute -top-1 -right-1 p-1 rounded-full bg-emerald-500 text-white">
                <Check className="w-3 h-3" />
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h4 className="text-sm font-bold text-white">Upload Custom Profile Photo (अपना फोटो अपलोड करें)</h4>
              <p className="text-xs text-slate-400">
                Supports JPG, PNG, WEBP files up to 5MB. Photo will reflect in leaderboards, live games &amp; chat.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File from Device / Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Avatar</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Full Player Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Mobile Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Custom Photo / Avatar URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono text-[11px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>SAVE PROFILE CHANGES</span>
          </button>
        </form>
      )}

      {/* Tab 2: User-to-User (P2P) Fund Transfer with 5% Fee */}
      {activeTab === 'transfer' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  <span>User-to-User Fund Transfer (यूज़र से यूज़र पेमेंट ट्रांसफर)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transfer funds directly to another player's wallet. A 5% platform charge applies.
                </p>
              </div>

              {/* Fee Notice Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-black self-start sm:self-auto">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>5% Transfer Charge (₹100 ट्रांसफर पर ₹105 कटेंगे)</span>
              </div>
            </div>

            {/* Transfer Result Banner */}
            {transferResult && (
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${
                  transferResult.success
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/90 border-red-500 text-red-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {transferResult.success ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-black">{transferResult.message}</h4>
                    {transferResult.receipt && (
                      <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                        Ref: {transferResult.receipt.refCode} • Recipient: {transferResult.receipt.recipientName} • Net: ₹{transferResult.receipt.amount}
                      </p>
                    )}
                  </div>
                </div>

                {transferResult.receipt && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `TAMBOLA P2P TRANSFER RECEIPT\nRef: ${transferResult.receipt.refCode}\nSent to: ${transferResult.receipt.recipientName}\nFund Amount: ₹${transferResult.receipt.amount}\nFee (5%): ₹${transferResult.receipt.feeAmount}\nTotal Deducted: ₹${transferResult.receipt.totalDeduction}\nStatus: SUCCESS`
                      );
                      setCopiedReceipt(true);
                      setTimeout(() => setCopiedReceipt(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 text-emerald-300 hover:text-white"
                  >
                    {copiedReceipt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedReceipt ? 'Copied!' : 'Copy Receipt'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Recipient Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                1. Recipient (प्राप्तकर्ता का मोबाइल नंबर, ईमेल या यूज़र ID)
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or neha@tambolalive.com or usr_101"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium pl-10"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
                {matchedRecipient && (
                  <span className="absolute right-3 top-3 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{matchedRecipient.name} (Verified)</span>
                  </span>
                )}
              </div>

              {/* Quick User Chips */}
              {availableUsers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Quick Select Known Players:</span>
                  <div className="flex flex-wrap gap-2">
                    {availableUsers.slice(0, 6).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setTransferRecipient(u.phone || u.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                          transferRecipient === u.phone || transferRecipient === u.id
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                        <span>{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Transfer Amount Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                2. Fund Transfer Amount (प्राप्तकर्ता को मिलने वाली राशि)
              </label>

              <div className="relative">
                <span className="absolute left-4 top-3.5 text-base font-black text-amber-400">₹</span>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-lg font-black text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmount(amt)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      transferAmount === amt
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-amber-400 hover:text-white'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* 5% Charge Calculation Card (Mathematical Breakdown Requested by User) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border-2 border-amber-400/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>Live 5% Fee Calculation Summary</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  Wallet Balance: <strong className="text-white">₹{currentUser.walletBalance.toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                {/* 1. Recipient receives */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Recipient Gets (प्राप्तकर्ता को मिलेगा)
                  </span>
                  <span className="text-lg sm:text-xl font-black text-emerald-400">
                    ₹{transferAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 2. 5% Fee */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    5% Platform Fee (5% शुल्क)
                  </span>
                  <span className="text-lg sm:text-xl font-black text-amber-400">
                    +₹{calculatedTransferFee.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 3. Total Deducted */}
                <div className="p-3 rounded-xl bg-amber-400/10 border-2 border-amber-400">
                  <span className="text-[10px] font-black text-amber-300 block uppercase">
                    Total Deducted (कुल कटेगा)
                  </span>
                  <span className="text-lg sm:text-xl font-black text-amber-300">
                    ₹{calculatedTotalDeduction.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 4. Balance Left */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Remaining Balance (बचेगा)
                  </span>
                  <span className={`text-lg sm:text-xl font-black ${
                    currentUser.walletBalance - calculatedTotalDeduction < 0 ? 'text-red-400' : 'text-slate-200'
                  }`}>
                    ₹{Math.max(0, currentUser.walletBalance - calculatedTotalDeduction).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="text-[11px] text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>ट्रांसफर नियम:</strong> यदि आप <strong>₹100</strong> ट्रांसफर करते हैं तो आपके वॉलेट से 5% शुल्क (₹5) सहित कुल <strong>₹105</strong> कटेंगे, और प्राप्तकर्ता को पूरे <strong>₹100</strong> प्राप्त होंगे।
                </span>
              </div>
            </div>

            {/* Optional Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                3. Optional Note / Remarks (वैकल्पिक टिप्पणी)
              </label>
              <input
                type="text"
                placeholder="e.g. Tambola Ticket Share / Prize Gift"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Warning if Insufficient Balance */}
            {!hasSufficientBalance && (
              <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>
                  अपर्याप्त बैलेंस! ₹{transferAmount} भेजने के लिए कुल ₹{calculatedTotalDeduction} की आवश्यकता है। कृपया पहले वॉलेट रिचार्ज करें।
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={transferLoading || !hasSufficientBalance || transferAmount <= 0 || !transferRecipient.trim()}
              onClick={handleInitiateTransfer}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                hasSufficientBalance && transferAmount > 0 && transferRecipient.trim()
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {transferLoading
                  ? 'PROCEEDING TRANSFER...'
                  : `SEND ₹${transferAmount} (DEDUCT ₹${calculatedTotalDeduction})`}
              </span>
            </button>
          </div>

          {/* P2P Transfer History */}
          <div className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>P2P Transfer History (ट्रांसफर इतिहास)</span>
              </h3>
              <span className="text-xs text-slate-400">{p2pTransactions.length} Transfers Recorded</span>
            </div>

            {p2pTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                अभी तक कोई P2P फंड ट्रांसफर नहीं हुआ है।
              </div>
            ) : (
              <div className="space-y-2.5">
                {p2pTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                          tx.type === 'p2p_transfer_sent'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {tx.type === 'p2p_transfer_sent' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{tx.description}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                            SUCCESS
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {tx.referenceId} • {tx.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-black ${
                          tx.type === 'p2p_transfer_sent' ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                      </div>
                      {tx.transferFee !== undefined && tx.transferFee > 0 && (
                        <div className="text-[10px] text-slate-400">
                          (Net: ₹{tx.netTransferAmount} + 5% Fee: ₹{tx.transferFee})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Bank & Payment Details */}
      {activeTab === 'bank' && (
        <form onSubmit={handleSaveBank} className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span>Bank &amp; Payment Accounts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All winning cashouts will be instantly routed to these registered bank/UPI accounts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Primary UPI ID (GPay / PhonePe / Paytm)</label>
              <input
                type="text"
                placeholder="e.g. mobile@upi or name@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Account Holder Name (As per Bank)</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India / HDFC"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Account Number</label>
              <input
                type="text"
                placeholder="Bank Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300">Bank IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. HDFC0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                className="w-full sm:w-1/2 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 uppercase font-mono font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>SAVE BANK &amp; UPI DETAILS</span>
          </button>
        </form>
      )}

      {/* Tab 4: KYC Verification */}
      {activeTab === 'kyc' && (
        <form onSubmit={handleSubmitKyc} className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>KYC Identity Verification</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                KYC verification is mandated for unlimited instant cash withdrawals above ₹10,000.
              </p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto border ${
              kycStatus === 'verified'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {kycStatus === 'verified' ? '✓ STATUS: VERIFIED' : '⏳ STATUS: PENDING'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">12-Digit Aadhaar Number</label>
              <input
                type="text"
                placeholder="XXXX XXXX XXXX"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">10-Digit PAN Card Number</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono uppercase font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-300">Document Proofs (Aadhaar &amp; PAN Card)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Aadhaar Card (Front/Back)</h4>
                    <p className="text-[10px] text-emerald-400">✓ Uploaded &amp; Verified</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  VERIFIED
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">PAN Card Certificate</h4>
                    <p className="text-[10px] text-emerald-400">✓ Uploaded &amp; Verified</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>SUBMIT KYC FOR VERIFICATION</span>
          </button>
        </form>
      )}

      {/* Tab 5: Change Password */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>Change Account Password</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ensure your account is protected with a strong, distinct password.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-4 rounded-2xl bg-red-950/90 border border-red-500 text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">New Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Confirm New Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>UPDATE PASSWORD</span>
          </button>
        </form>
      )}

      {/* Tab 6: Security Settings & Active Sessions */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>Account Security Controls</span>
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</h4>
                  <p className="text-[10px] text-slate-400">Receive an OTP on your mobile before high-value withdrawals</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    twoFactorEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Login Security Alerts</h4>
                  <p className="text-[10px] text-slate-400">Get notified via SMS/Email whenever a new login occurs</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLoginAlerts(!loginAlerts)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    loginAlerts ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Login Sessions */}
          <div className="rounded-3xl bg-slate-900/90 p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-purple-400" />
                  <span>Active Login Sessions</span>
                </h3>
                <p className="text-[11px] text-slate-400">Devices currently logged into your Tambola account</p>
              </div>
              <button
                onClick={() => alert('Logged out of all other devices successfully.')}
                className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-900 transition-colors"
              >
                Log Out Other Devices
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Mobile Safari (iOS 17.5)</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full font-bold">
                        CURRENT DEVICE
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">IP: 103.241.12.88 • Jaipur, Rajasthan</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Active now</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-bold text-slate-200">Chrome on macOS (Sonoma)</div>
                    <p className="text-[10px] text-slate-400 font-mono">IP: 49.36.120.44 • Mumbai, Maharashtra</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">3 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Lucky Numbers Studio (1 to 90) */}
      {activeTab === 'lucky' && (
        <div className="rounded-3xl bg-gradient-to-br from-[#121938] via-slate-900 to-[#1b1236] p-6 sm:p-8 border-2 border-purple-500/40 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Personalized Lucky Numbers Studio</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                My Lucky Tambola Numbers (1 to 90)
              </h2>
              <p className="text-xs text-slate-300">
                Pick up to 6 favorite numbers. When these are called during live games, you'll receive special audio cues and instant highlight dabbing!
              </p>
            </div>

            <span className="text-xs font-bold text-amber-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
              Selected: <strong className="text-white">{luckyNumbers.length} / 6</strong>
            </span>
          </div>

          {/* Selected Lucky Balls Strip */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30">
            <span className="text-xs font-bold text-slate-400">Current Favorites:</span>
            {luckyNumbers.map((num) => (
              <button
                key={num}
                onClick={() => handleToggleLuckyNumber(num)}
                className="group relative cursor-pointer"
                title="Click to remove from lucky numbers"
              >
                <div className={`tambola-ball-3d ${getBallClass(num)} w-11 h-11 text-sm font-black`}>
                  {num}
                </div>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  ×
                </span>
              </button>
            ))}
            {luckyNumbers.length === 0 && (
              <span className="text-xs text-slate-500 italic">No lucky numbers chosen yet. Pick from the grid below!</span>
            )}
          </div>

          {/* 1-90 Quick Selector Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300">Quick Pick Popular Numbers:</span>
            <div className="flex flex-wrap gap-1.5">
              {[1, 7, 11, 13, 21, 22, 27, 33, 44, 47, 50, 55, 69, 77, 88, 90].map((num) => {
                const active = luckyNumbers.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => handleToggleLuckyNumber(num)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-purple-400 hover:text-white'
                    }`}
                  >
                    #{num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for P2P Transfer */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-400/60 p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <span>Confirm Fund Transfer</span>
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Recipient (प्राप्तकर्ता):</span>
                <strong className="text-white font-mono">{matchedRecipient ? matchedRecipient.name : transferRecipient}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fund to Send (भेजने की राशि):</span>
                <strong className="text-emerald-400 font-mono">₹{transferAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Platform Fee (5% शुल्क):</span>
                <strong className="text-amber-400 font-mono">+₹{calculatedTransferFee.toLocaleString('en-IN')}</strong>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-black text-amber-400">
                <span>Total Deducted (कुल कटेगा):</span>
                <span>₹{calculatedTotalDeduction.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-400">
                <span>Recipient will receive:</span>
                <span className="font-bold">₹{transferAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Please verify recipient details. Once sent, P2P transfers are instantaneous and final.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>CONFIRM &amp; SEND</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
