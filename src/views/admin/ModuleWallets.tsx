import React, { useState, useMemo } from 'react';
import {
  Wallet,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Minus,
  RefreshCw,
  Check,
  Ban,
  Copy,
  AlertTriangle,
  Sparkles,
  Phone,
  Mail,
  User as UserIcon,
  CreditCard,
  QrCode,
  Eye,
  Image as ImageIcon,
  ExternalLink,
  X,
  Camera,
  Trash2,
} from 'lucide-react';
import { User, WalletTransaction, DepositRequest } from '../../types';

interface ModuleWalletsProps {
  users: User[];
  transactions: WalletTransaction[];
  deposits?: DepositRequest[];
  onUpdateWalletBalance: (userId: string, amount: number, type: 'credit' | 'debit') => Promise<boolean>;
  onApproveDeposit?: (depositId: string, remarks?: string) => Promise<boolean>;
  onRejectDeposit?: (depositId: string, reason?: string) => Promise<boolean>;
  onDeleteDeposit?: (depositId: string) => Promise<boolean>;
}

export const ModuleWallets: React.FC<ModuleWalletsProps> = ({
  users,
  transactions,
  deposits = [],
  onUpdateWalletBalance,
  onApproveDeposit,
  onRejectDeposit,
  onDeleteDeposit,
}) => {
  const [activeTab, setActiveTab] = useState<'deposits' | 'transactions' | 'balances'>('deposits');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [depositStatusFilter, setDepositStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'duplicates'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [previewDeposit, setPreviewDeposit] = useState<DepositRequest | null>(null);

  // Reject / Block Confirmation Modal
  const [rejectingDeposit, setRejectingDeposit] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('अमान्य / फर्जी UTR — पेमेंट प्राप्त नहीं हुआ (Fake/Invalid UTR)');

  // Remove / Delete Deposit Slip Modal (Does NOT block user)
  const [deletingDeposit, setDeletingDeposit] = useState<DepositRequest | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Wallet Adjust Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('Manual adjustment / compensation');
  const [adjustNotice, setAdjustNotice] = useState<string | null>(null);

  const totalUserDeposits = users.reduce((sum, u) => sum + (u.depositBalance || 0), 0);
  const totalUserWinnings = users.reduce((sum, u) => sum + (u.winningBalance || 0), 0);
  const totalUserReferrals = users.reduce((sum, u) => sum + (u.referralBalance || 0), 0);
  const totalPlatformLiabilities = totalUserDeposits + totalUserWinnings + totalUserReferrals;

  const pendingDepositsCount = deposits.filter((d) => d.status === 'pending').length;

  // Detect duplicate deposit slips: same UTR or multiple pending slips by the same user
  const duplicateInfo = useMemo(() => {
    const utrMap = new Map<string, DepositRequest[]>();
    const userPendingMap = new Map<string, DepositRequest[]>();

    deposits.forEach((dep) => {
      if (dep.utrNumber) {
        const u = dep.utrNumber.trim().toLowerCase();
        const list = utrMap.get(u) || [];
        list.push(dep);
        utrMap.set(u, list);
      }
      if (dep.userId && dep.status === 'pending') {
        const list = userPendingMap.get(dep.userId) || [];
        list.push(dep);
        userPendingMap.set(dep.userId, list);
      }
    });

    const duplicateDepIds = new Set<string>();
    const duplicateReasons = new Map<string, string>();

    utrMap.forEach((list) => {
      if (list.length > 1) {
        list.forEach((d) => {
          duplicateDepIds.add(d.id);
          duplicateReasons.set(d.id, `समान UTR (${list.length} बार भेजा गया)`);
        });
      }
    });

    userPendingMap.forEach((list) => {
      if (list.length > 1) {
        list.forEach((d) => {
          duplicateDepIds.add(d.id);
          if (!duplicateReasons.has(d.id)) {
            duplicateReasons.set(d.id, `यूजर की ${list.length} पेंडिंग स्लिप्स मौजूद हैं`);
          }
        });
      }
    });

    return {
      utrMap,
      userPendingMap,
      duplicateDepIds,
      duplicateReasons,
      duplicateCount: duplicateDepIds.size,
    };
  }, [deposits]);

  const filteredDeposits = deposits.filter((d) => {
    if (!d) return false;
    if (depositStatusFilter === 'duplicates') {
      if (!duplicateInfo.duplicateDepIds.has(d.id)) return false;
    } else if (depositStatusFilter !== 'all' && d.status !== depositStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (d.id && d.id.toLowerCase().includes(q)) ||
        (d.userName && d.userName.toLowerCase().includes(q)) ||
        (d.userPhone && d.userPhone.toLowerCase().includes(q)) ||
        (d.userEmail && d.userEmail.toLowerCase().includes(q)) ||
        (d.utrNumber && d.utrNumber.toLowerCase().includes(q)) ||
        (d.userId && d.userId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredTransactions = transactions.filter((tx) => {
    if (!tx) return false;
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (tx.id && tx.id.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.referenceId && tx.referenceId.toLowerCase().includes(q)) ||
        (tx.utrNumber && tx.utrNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard?.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleApprove = async (dep: DepositRequest) => {
    if (!onApproveDeposit) return;
    setActionLoading(true);
    const success = await onApproveDeposit(dep.id, 'UTR Verified & Payment Received - Approved');
    setActionLoading(false);
    if (success) {
      setActionNotice(`✓ डिपॉजिट ₹${dep.amount} स्वीकृत कर दिया गया और ${dep.userName} के वॉलेट में फंड जमा हो गया!`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingDeposit || !onRejectDeposit) return;
    setActionLoading(true);
    const success = await onRejectDeposit(rejectingDeposit.id, rejectReason);
    setActionLoading(false);
    if (success) {
      setActionNotice(`✓ डिपॉजिट रिजेक्ट कर दिया गया और फर्जी UTR के कारण यूजर ${rejectingDeposit.userName} (ID: ${rejectingDeposit.userId}) को तुरंत ब्लॉक (Block) कर दिया गया!`);
      setRejectingDeposit(null);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDeposit) return;
    if (!onDeleteDeposit) {
      alert('Delete function is not available.');
      return;
    }
    setActionLoading(true);
    const idToDelete = deletingDeposit.id;
    const utr = deletingDeposit.utrNumber;
    const uName = deletingDeposit.userName;
    const success = await onDeleteDeposit(idToDelete);
    setActionLoading(false);
    if (success) {
      setDeletingDeposit(null);
      setActionNotice(`🗑️ डिपॉजिट स्लिप (UTR: ${utr} | यूजर: ${uName}) को एडमिन द्वारा सफलतापूर्वक रिमूव (हटा) दिया गया!`);
      setTimeout(() => setActionNotice(null), 5000);
    } else {
      alert('स्लिप हटाने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || adjustAmount <= 0) return;
    await onUpdateWalletBalance(selectedUser.id, adjustAmount, adjustType);
    setAdjustNotice(`Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ₹${adjustAmount} for ${selectedUser.name}`);
    setTimeout(() => {
      setAdjustNotice(null);
      setSelectedUser(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <span>Platform Wallets &amp; UTR Verification System</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            यूजर द्वारा जमा किए गए UTR का सत्यापन करें, OK करके बैलेंस क्रेडिट करें अथवा फर्जी UTR को रिजेक्ट व ID ब्लॉक करें।
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'deposits'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>📥 UTR Deposit Requests</span>
            {pendingDepositsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-black text-[10px] animate-pulse">
                {pendingDepositsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Transactions Ledger
          </button>

          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'balances'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            User Balances Overview
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-amber-400/30 shadow-lg">
          <div className="text-[11px] text-amber-400 uppercase font-black">Total Platform Balances</div>
          <div className="text-2xl font-black text-white mt-1">₹{(totalPlatformLiabilities || 0).toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across {(users || []).length} player accounts</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-800 shadow-lg">
          <div className="text-[11px] text-blue-400 uppercase font-black">Player Deposits</div>
          <div className="text-2xl font-black text-blue-300 mt-1">₹{(totalUserDeposits || 0).toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for ticket purchases</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-800 shadow-lg">
          <div className="text-[11px] text-pink-400 uppercase font-black">Pending UTR Verifications</div>
          <div className="text-2xl font-black text-amber-300 mt-1">{pendingDepositsCount || 0}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Needs Admin OK/Verification</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#101528] border border-slate-800 shadow-lg">
          <div className="text-[11px] text-emerald-400 uppercase font-black">Player Winnings</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">₹{(totalUserWinnings || 0).toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Eligible for withdrawal</div>
        </div>
      </div>

      {/* TAB 1: UTR DEPOSIT APPROVALS */}
      {activeTab === 'deposits' && (
        <div className="rounded-2xl bg-slate-900/90 border-2 border-amber-400/40 p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: `All Requests (${deposits.length})` },
                { id: 'pending', label: `⏳ Pending Verification (${pendingDepositsCount})` },
                ...(duplicateInfo.duplicateCount > 0
                  ? [{ id: 'duplicates', label: `⚠️ डुप्लिकेट स्लिप्स (${duplicateInfo.duplicateCount})` }]
                  : []),
                { id: 'approved', label: '✅ Approved' },
                { id: 'rejected', label: '❌ Rejected / Blocked' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDepositStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    depositStatusFilter === tab.id
                      ? tab.id === 'duplicates'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                        : 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : tab.id === 'duplicates'
                      ? 'bg-amber-500/20 text-amber-300 hover:text-amber-100 border border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UTR, User Name, Phone, ID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* ⚠️ Duplicate Deposit Notification Banner */}
          {duplicateInfo.duplicateCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="leading-relaxed">
                  <strong>⚠️ {duplicateInfo.duplicateCount} डुप्लिकेट/अतिरिक्त स्लिप्स पाई गईं:</strong> यूजर ने 2 या 3 बार एक ही रसीद/स्लिप भेज दी है। आप अतिरिक्त स्लिप्स को <strong>"रिमूव करें (Delete)"</strong> बटन से हटा सकते हैं (यूजर ब्लॉक नहीं होगा)।
                </span>
              </div>
              {depositStatusFilter !== 'duplicates' && (
                <button
                  type="button"
                  onClick={() => setDepositStatusFilter('duplicates')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 cursor-pointer shrink-0 shadow"
                >
                  डुप्लिकेट स्लिप्स देखें ({duplicateInfo.duplicateCount})
                </button>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">User / Player Details</th>
                  <th className="px-4 py-3.5">Deposit Amount</th>
                  <th className="px-4 py-3.5">12-Digit UTR Number</th>
                  <th className="px-4 py-3.5">Screenshot Proof</th>
                  <th className="px-4 py-3.5">Payment Method / Time</th>
                  <th className="px-4 py-3.5">Bonus Benefits</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredDeposits.length > 0 ? (
                  filteredDeposits.map((dep) => {
                    const matchedUser = users.find((u) => u.id === dep.userId);
                    const isUserBlocked = matchedUser?.isBlocked || matchedUser?.status === 'blocked';
                    const isDuplicate = duplicateInfo.duplicateDepIds.has(dep.id);
                    const duplicateReason = duplicateInfo.duplicateReasons.get(dep.id);

                    return (
                      <tr
                        key={dep.id}
                        className={`transition-colors ${
                          isDuplicate
                            ? 'bg-amber-500/10 hover:bg-amber-500/15'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* User Details */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-white text-xs">{dep.userName}</span>
                              {isUserBlocked && (
                                <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-black border border-red-500/40">
                                  BLOCKED
                                </span>
                              )}
                              {isDuplicate && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 text-[9px] font-black border border-amber-400/60 animate-pulse">
                                  ⚠️ DUPLICATE
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-amber-400">ID: {dep.userId}</div>
                            <div className="text-[10px] text-slate-400">{dep.userPhone || dep.userEmail || '—'}</div>
                            {isDuplicate && (
                              <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{duplicateReason || 'डुप्लिकेट स्लिप'}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-black text-emerald-400">₹{(dep.amount || 0).toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-slate-400">Ticket Wallet Fund</div>
                        </td>

                        {/* UTR Number */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-amber-400/40 font-mono text-xs text-amber-300 w-fit">
                            <span className="font-bold select-all">{dep.utrNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyUtr(dep.utrNumber)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer ml-1"
                              title="Copy UTR"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          {copiedUtr === dep.utrNumber && (
                            <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">✓ Copied to clipboard!</span>
                          )}
                        </td>

                        {/* Screenshot Proof */}
                        <td className="px-4 py-3.5">
                          {dep.proofImageUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDeposit(dep)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 text-[11px] font-bold border border-amber-400/40 flex items-center gap-1.5 transition-all cursor-pointer group shadow"
                            >
                              <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-900 shrink-0 border border-amber-400/40">
                                <img
                                  src={dep.proofImageUrl}
                                  alt="Proof thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span>📸 रसीद देखें</span>
                              <Eye className="w-3 h-3 group-hover:scale-110 transition-transform" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">⚡ UTR Only (रसीद नहीं)</span>
                          )}
                        </td>

                        {/* Method & Date */}
                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="text-white font-medium text-xs">{dep.paymentMethod || 'UPI'}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>
                              {dep.requestDate ? new Date(dep.requestDate).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }) : 'Recent'}
                            </span>
                          </div>
                        </td>

                        {/* Bonuses */}
                        <td className="px-4 py-3.5 space-y-0.5">
                          {dep.registrationBonus ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/40">
                              🎁 +₹{dep.registrationBonus} 1st Bonus
                            </span>
                          ) : null}
                          {dep.bonusRewardUnlock ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-black border border-pink-500/40 ml-1">
                              ✨ +₹{dep.bonusRewardUnlock} Reward
                            </span>
                          ) : null}
                          {!dep.registrationBonus && !dep.bonusRewardUnlock && (
                            <span className="text-[10px] text-slate-500">Standard Recharge</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                              dep.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : dep.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                : 'bg-red-500/20 text-red-300 border-red-500/40'
                            }`}
                          >
                            {dep.status === 'approved' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>APPROVED (स्वीकृत)</span>
                              </>
                            ) : dep.status === 'pending' ? (
                              <>
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>PENDING VERIFICATION</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-red-400" />
                                <span>REJECTED (खाता ब्लॉक)</span>
                              </>
                            )}
                          </span>
                          {dep.adminRemarks && (
                            <div className="text-[10px] text-slate-400 mt-1 max-w-xs">{dep.adminRemarks}</div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {dep.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleApprove(dep)}
                                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                  title="डिपॉजिट स्वीकृत करें और वॉलेट में जोड़ें"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>OK / Approve</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => setRejectingDeposit(dep)}
                                  className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                  title="फर्जी UTR होने पर रिजेक्ट करें और यूजर ID ब्लॉक करें"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Reject &amp; Block</span>
                                </button>
                              </>
                            )}

                            {/* 🗑️ Remove / Delete Duplicate or Unwanted Deposit Slip */}
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setDeletingDeposit(dep)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer border shadow-sm ${
                                isDuplicate
                                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/50 ring-1 ring-rose-500/40'
                                  : 'bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-500/40'
                              }`}
                              title="इस डुप्लिकेट / अतिरिक्त स्लिप को हटाएं (यूजर ब्लॉक नहीं होगा)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>रिमूव</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      कोई डिपॉजिट अनुरोध नहीं मिला (No deposit requests found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS LEDGER */}
      {activeTab === 'transactions' && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Transaction Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="prize_won">Winning Amount</option>
                <option value="ticket_purchase">Ticket Payments</option>
                <option value="referral_commission">Referral Commission</option>
                <option value="signup_bonus">Signup / Deposit Bonus</option>
                <option value="refund">Refunds</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tx ID, description, ref..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tx ID / Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount (₹)</th>
                  <th className="px-4 py-3">Balance After</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Method / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTransactions.map((tx) => {
                  const isCredit = ['deposit', 'prize_won', 'referral_commission', 'signup_bonus', 'refund'].includes(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        <div className="text-white font-bold">{tx.id}</div>
                        <div>{tx.timestamp}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded uppercase font-black text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3 font-black text-xs">
                        <span className={isCredit ? 'text-emerald-400' : 'text-red-400'}>
                          {isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        ₹{(tx.balanceAfter || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {(tx.status || 'completed').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-400">
                        {tx.utrNumber || tx.referenceId || tx.paymentMethod || 'SYSTEM'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BALANCES OVERVIEW */}
      {activeTab === 'balances' && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Deposit Wallet</th>
                  <th className="px-4 py-3">Winning Wallet</th>
                  <th className="px-4 py-3">Referral Wallet</th>
                  <th className="px-4 py-3">Total Balance</th>
                  <th className="px-4 py-3 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-300">₹{u.depositBalance || 0}</td>
                    <td className="px-4 py-3 font-mono text-pink-300 font-bold">₹{u.winningBalance || 0}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">₹{u.referralBalance || 0}</td>
                    <td className="px-4 py-3 font-black text-amber-300 text-sm">
                      ₹{((u?.walletBalance ?? ((u?.depositBalance || 0) + (u?.winningBalance || 0) + (u?.referralBalance || 0))) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold cursor-pointer"
                      >
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Deposit & Block User Modal */}
      {rejectingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-500 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-black text-white">डिपॉजिट रिजेक्ट &amp; ID ब्लॉक करें</h3>
              </div>
              <button onClick={() => setRejectingDeposit(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 space-y-1.5 text-xs text-slate-300">
              <div>प्लेयर: <strong className="text-white">{rejectingDeposit.userName}</strong> (ID: {rejectingDeposit.userId})</div>
              <div>राशि: <strong className="text-red-300 font-bold">₹{rejectingDeposit.amount}</strong></div>
              <div>UTR नंबर: <strong className="text-amber-300 font-mono">{rejectingDeposit.utrNumber}</strong></div>
              <p className="text-[11px] text-red-300 pt-1">
                ⚠️ <strong>नोट:</strong> रिजेक्ट करने पर यह डिपॉजिट रद्द होगा और इस यूजर की ID को तुरंत ब्लॉक (Block) कर दिया जाएगा ताकि कोई फर्जी UTR न डाल सके।
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-bold">रिजेक्शन का कारण (Reason for Rejection):</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingDeposit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {actionLoading ? 'Blocking & Rejecting...' : '🚫 रिजेक्ट व ID ब्लॉक करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Wallet Adjust Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Adjust User Balance</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div>User: <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.phone})</div>
                <div>Current: <strong className="text-amber-300">₹{selectedUser.walletBalance || 0}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-2 rounded-xl text-xs font-black ${
                    adjustType === 'credit' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  + CREDIT (ADD)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-2 rounded-xl text-xs font-black ${
                    adjustType === 'debit' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  - DEBIT (SUBTRACT)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Amount (₹)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  min={1}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-black text-base focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Reason / Note</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {adjustNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  {adjustNotice}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📸 PAYMENT SCREENSHOT / RECEIPT PREVIEW MODAL */}
      {previewDeposit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-amber-400 shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Payment Screenshot &amp; Proof</h3>
                  <p className="text-[11px] text-slate-400">
                    User: <strong className="text-white">{previewDeposit.userName}</strong> (ID: {previewDeposit.userId})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDeposit(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Details Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">Deposit Amount:</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  ₹{(previewDeposit.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">UTR Number:</span>
                <span className="text-xs font-black text-amber-300 font-mono select-all">
                  {previewDeposit.utrNumber}
                </span>
              </div>
            </div>

            {/* Screenshot Display */}
            <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center min-h-[260px] max-h-[420px]">
              {previewDeposit.proofImageUrl ? (
                <img
                  src={previewDeposit.proofImageUrl}
                  alt="Payment Proof Receipt"
                  className="max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-md"
                />
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  कोई स्क्रीनशॉट उपलब्ध नहीं है
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
              {previewDeposit.status === 'pending' ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = previewDeposit;
                        setPreviewDeposit(null);
                        setRejectingDeposit(d);
                      }}
                      className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs border border-red-500/40 cursor-pointer"
                    >
                      Reject &amp; Block
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const d = previewDeposit;
                        setPreviewDeposit(null);
                        setDeletingDeposit(d);
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/50 cursor-pointer flex items-center gap-1"
                      title="डुप्लिकेट स्लिप होने पर बिना ब्लॉक किए हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>रिमूव करें (Delete)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const d = previewDeposit;
                      setPreviewDeposit(null);
                      await handleApprove(d);
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve ₹{previewDeposit.amount} (स्वीकृत करें)</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between w-full gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const d = previewDeposit;
                      setPreviewDeposit(null);
                      setDeletingDeposit(d);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/50 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>इस स्लिप को लिस्ट से हटाएं (रिमूव)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewDeposit(null)}
                    className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer"
                  >
                    Close (बंद करें)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ ADMIN REMOVE / DELETE DEPOSIT SLIP CONFIRMATION MODAL */}
      {deletingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-black text-base sm:text-lg">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>डिपॉजिट स्लिप रिमूव करें (Delete Deposit Slip)</span>
              </div>
              <button
                type="button"
                onClick={() => setDeletingDeposit(null)}
                className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation / Notice */}
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-1.5 text-xs text-rose-200">
              <p className="font-bold text-rose-300 flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>क्या आप यह डिपॉजिट स्लिप लिस्ट से हटाना (रिमूव) चाहते हैं?</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                👉 <strong>महत्वपूर्ण:</strong> यदि किसी यूजर ने 2 या 3 बार एक ही स्लिप भेज दी है, तो इस ऑप्शन से केवल यह अतिरिक्त/डुप्लिकेट स्लिप हटाई जाएगी। <strong>यूजर की आईडी ब्लॉक नहीं होगी</strong> और यूजर का अकाउंट पूरी तरह सुरक्षित रहेगा।
              </p>
            </div>

            {/* Slip Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">यूजर नाम (User):</span>
                <span className="font-black text-white">{deletingDeposit.userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">यूजर ID:</span>
                <span className="font-mono text-amber-400 font-bold">{deletingDeposit.userId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">डिपॉजिट राशि (Amount):</span>
                <span className="font-black text-emerald-400 font-mono text-sm">
                  ₹{(deletingDeposit.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">12-Digit UTR:</span>
                <span className="font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {deletingDeposit.utrNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">सबमिट तारीख / समय:</span>
                <span className="text-slate-300">
                  {deletingDeposit.requestDate
                    ? new Date(deletingDeposit.requestDate).toLocaleString('en-IN')
                    : 'Recent'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">वर्तमान स्थिति (Status):</span>
                <span className="font-black uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  {deletingDeposit.status}
                </span>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeletingDeposit(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/40 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>{actionLoading ? 'हटाया जा रहा है...' : '🗑️ हां, स्लिप रिमूव करें (Remove)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
