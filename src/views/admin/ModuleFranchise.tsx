import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  DollarSign,
  Coins,
  Users,
  Send,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Edit2,
  Lock,
  Unlock,
  Filter,
  FileText,
  Sparkles,
  Award,
} from 'lucide-react';
import { Franchise, FranchiseTransferRecord, User } from '../../types';

interface ModuleFranchiseProps {
  franchises: Franchise[];
  franchiseTransfers: FranchiseTransferRecord[];
  users: User[];
  onApproveFranchise: (
    franchiseId: string,
    allocatedFund: number,
    commissionRate: number,
    assignedFranchiseId?: string,
    remarks?: string
  ) => Promise<boolean>;
  onRejectFranchise: (franchiseId: string, remarks: string) => Promise<boolean>;
  onUpdateFranchiseFund: (franchiseId: string, amountChange: number, note: string) => Promise<boolean>;
  onUpdateFranchiseStatus: (franchiseId: string, status: 'approved' | 'suspended' | 'rejected') => Promise<boolean>;
  onCreateDirectFranchise: (data: {
    userId: string;
    franchiseId: string;
    franchiseName: string;
    city: string;
    state: string;
    tier: 'bronze' | 'silver' | 'gold' | 'master';
    securityDeposit: number;
    allocatedFund: number;
    commissionRate: number;
  }) => Promise<boolean>;
}

export const ModuleFranchise: React.FC<ModuleFranchiseProps> = ({
  franchises,
  franchiseTransfers,
  users,
  onApproveFranchise,
  onRejectFranchise,
  onUpdateFranchiseFund,
  onUpdateFranchiseStatus,
  onCreateDirectFranchise,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'create' | 'ledger'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Approval Modal State
  const [approvingFranchise, setApprovingFranchise] = useState<Franchise | null>(null);
  const [allocatedFundInput, setAllocatedFundInput] = useState<number>(10000);
  const [commissionRateInput, setCommissionRateInput] = useState<number>(5.0);
  const [assignedIdInput, setAssignedIdInput] = useState<string>('');
  const [approveRemarks, setApproveRemarks] = useState<string>('Official Franchise Partner Approved');
  const [actionLoading, setActionLoading] = useState(false);

  // Fund Adjustment Modal State
  const [fundAdjustFranchise, setFundAdjustFranchise] = useState<Franchise | null>(null);
  const [fundAdjustAmount, setFundAdjustAmount] = useState<number>(5000);
  const [fundAdjustType, setFundAdjustType] = useState<'add' | 'deduct'>('add');
  const [fundAdjustNote, setFundAdjustNote] = useState<string>('Admin manual fund topup');

  // Direct Creation Form State
  const [newUserId, setNewUserId] = useState('');
  const [newFranchiseId, setNewFranchiseId] = useState(`FRN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newFranchiseName, setNewFranchiseName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('Rajasthan');
  const [newTier, setNewTier] = useState<'bronze' | 'silver' | 'gold' | 'master'>('gold');
  const [newSecurity, setNewSecurity] = useState<number>(10000);
  const [newAllocated, setNewAllocated] = useState<number>(10000);
  const [newCommission, setNewCommission] = useState<number>(5.0);
  const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const pendingList = franchises.filter((f) => f.status === 'pending');
  const activeList = franchises.filter((f) => f.status === 'approved' || f.status === 'suspended');

  const totalAllocatedFund = activeList.reduce((sum, f) => sum + (f.allocatedFund || 0), 0);
  const totalDistributedAll = franchiseTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCommissionAll = franchiseTransfers.reduce((sum, t) => sum + (t.commissionEarned || 0), 0);

  const filteredActive = activeList.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      f.franchiseId.toLowerCase().includes(q) ||
      f.franchiseName.toLowerCase().includes(q) ||
      f.userName.toLowerCase().includes(q) ||
      f.userPhone.includes(q) ||
      (f.city && f.city.toLowerCase().includes(q));
    const matchTier = tierFilter === 'all' || f.tier === tierFilter;
    return matchQ && matchTier;
  });

  const handleOpenApprove = (f: Franchise) => {
    setApprovingFranchise(f);
    setAllocatedFundInput(f.securityDeposit || 10000);
    setCommissionRateInput(f.commissionRate || (f.tier === 'master' ? 7 : f.tier === 'gold' ? 5 : f.tier === 'silver' ? 4 : 3));
    setAssignedIdInput(f.franchiseId || `FRN-${Math.floor(1000 + Math.random() * 9000)}`);
    setApproveRemarks('Official Verified Franchise Partner');
  };

  const handleConfirmApprove = async () => {
    if (!approvingFranchise) return;
    setActionLoading(true);
    await onApproveFranchise(
      approvingFranchise.id,
      allocatedFundInput,
      commissionRateInput,
      assignedIdInput.trim() || undefined,
      approveRemarks
    );
    setActionLoading(false);
    setApprovingFranchise(null);
  };

  const handleConfirmReject = async (f: Franchise) => {
    const reason = prompt(`फ्रेंचाइजी आवेदन (${f.franchiseName}) अस्वीकार करने का कारण दर्ज करें:`, 'UTR नॉट वेरिफाइड / अपूर्ण जानकारी');
    if (reason === null) return;
    setActionLoading(true);
    await onRejectFranchise(f.id, reason || 'Rejected by Admin');
    setActionLoading(false);
  };

  const handleConfirmFundAdjust = async () => {
    if (!fundAdjustFranchise) return;
    setActionLoading(true);
    const delta = fundAdjustType === 'add' ? fundAdjustAmount : -fundAdjustAmount;
    await onUpdateFranchiseFund(fundAdjustFranchise.id, delta, fundAdjustNote);
    setActionLoading(false);
    setFundAdjustFranchise(null);
  };

  const handleDirectCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId) {
      setCreateMsg({ type: 'error', text: 'कृपया यूजर चुनें।' });
      return;
    }
    if (!newFranchiseName.trim()) {
      setCreateMsg({ type: 'error', text: 'फ्रेंचाइजी नाम दर्ज करें।' });
      return;
    }
    setActionLoading(true);
    setCreateMsg(null);
    try {
      const ok = await onCreateDirectFranchise({
        userId: newUserId,
        franchiseId: newFranchiseId.trim().toUpperCase(),
        franchiseName: newFranchiseName.trim(),
        city: newCity.trim() || 'Jaipur',
        state: newState.trim() || 'Rajasthan',
        tier: newTier,
        securityDeposit: newSecurity,
        allocatedFund: newAllocated,
        commissionRate: newCommission,
      });
      setActionLoading(false);
      if (ok) {
        setCreateMsg({ type: 'success', text: `फ्रेंचाइजी ${newFranchiseId} सफलतापूर्वक बन गई है!` });
        setNewFranchiseId(`FRN-${Math.floor(1000 + Math.random() * 9000)}`);
        setNewFranchiseName('');
        setNewCity('');
      }
    } catch (err: any) {
      setActionLoading(false);
      setCreateMsg({ type: 'error', text: err?.message || 'फ्रेंचाइजी बनाने में त्रुटि आई।' });
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>एडमिन फंड फ्रेंचाइजी प्रबंधन (Admin Fund Franchise System)</span>
          </h2>
          <p className="text-xs text-slate-400">
            फ्रेंचाइजी पार्टनर्स को अप्रूव करें, फंड आवंटित करें, कमीशन दरें सेट करें व डिस्ट्रीब्यूशन ट्रैक करें।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>नई फ्रेंचाइजी बनाएं</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">पेंडिंग आवेदन</span>
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{pendingList.length}</div>
          <p className="text-[10px] text-amber-300">स्वीकृति हेतु प्रतीक्षारत</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">एक्टिव पार्टनर्स</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{activeList.length}</div>
          <p className="text-[10px] text-emerald-300">वेरिफाइड फ्रेंचाइजी</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">कुल आवंटित फंड</span>
            <span className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-yellow-300 font-mono">₹{totalAllocatedFund.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-slate-400">फ्रेंचाइजी वॉलेट्स में उपलब्ध</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">कुल वितरित राशि</span>
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">₹{totalDistributedAll.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-purple-300">कमीशन: ₹{totalCommissionAll.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-amber-400 text-slate-950 font-black shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>पेंडिंग आवेदन ({pendingList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-amber-400 text-slate-950 font-black shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>एक्टिव फ्रेंचाइजी सूची ({activeList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'create'
              ? 'bg-amber-400 text-slate-950 font-black shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>डायरेक्ट बनाएं (Direct Create)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-amber-400 text-slate-950 font-black shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>डिस्ट्रीब्यूशन ऑडिट लेजर ({franchiseTransfers.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING APPLICATIONS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">कोई पेंडिंग आवेदन नहीं है</h3>
              <p className="text-xs text-slate-400">सभी फ्रेंचाइजी आवेदन स्वीकृत या संसाधित हो चुके हैं।</p>
            </div>
          ) : (
            pendingList.map((f) => (
              <div
                key={f.id}
                className="p-5 sm:p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-white">{f.franchiseName}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase border border-amber-500/40">
                        {f.tier.toUpperCase()} TIER
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs">
                        ID: {f.franchiseId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      आवेदक: <strong className="text-white">{f.userName}</strong> | फोन: <span className="font-mono text-amber-300">{f.userPhone}</span> | शहर: {f.city}, {f.state}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenApprove(f)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>स्वीकार करें (Approve)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmReject(f)}
                      className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>अस्वीकार (Reject)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">सिक्योरिटी टोकन:</span>
                    <span className="text-emerald-400 font-black text-base font-mono">₹{f.securityDeposit}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">सबमिटेड UTR:</span>
                    <span className="text-amber-300 font-mono font-bold truncate block" title={f.utrNumber}>
                      {f.utrNumber}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">आवेदन समय:</span>
                    <span className="text-slate-300 font-mono text-[11px] block truncate">
                      {new Date(f.createdAt).toLocaleDateString('hi-IN')} {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">प्रस्तावित कमीशन:</span>
                    <span className="text-yellow-400 font-black text-sm">{f.tier === 'master' ? '7%' : f.tier === 'gold' ? '5%' : f.tier === 'silver' ? '4%' : '3%'} Instant</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE FRANCHISES */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="फ्रेंचाइजी ID, नाम, फोन, या शहर खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
              >
                <option value="all">सभी टियर (All Tiers)</option>
                <option value="bronze">Bronze (ब्रॉन्ज)</option>
                <option value="silver">Silver (सिल्वर)</option>
                <option value="gold">Gold (गोल्ड)</option>
                <option value="master">Master (मास्टर)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-black uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">फ्रेंचाइजी ID व नाम</th>
                  <th className="p-4">पार्टनर विवरण</th>
                  <th className="p-4">टियर व कमीशन</th>
                  <th className="p-4">उपलब्ध फंड (Balance)</th>
                  <th className="p-4">कुल वितरित / लाभ</th>
                  <th className="p-4">स्थिति</th>
                  <th className="p-4 text-right">एक्शन</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredActive.map((f) => {
                  const isSuspended = f.status === 'suspended';
                  return (
                    <tr key={f.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-black text-xs border border-amber-500/30">
                            {f.franchiseId}
                          </div>
                          <div>
                            <div className="font-black text-white text-sm">{f.franchiseName}</div>
                            <div className="text-[10px] text-slate-400">{f.city}, {f.state}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white">{f.userName}</div>
                        <div className="text-[10px] font-mono text-amber-300">{f.userPhone}</div>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-black uppercase text-amber-300 border border-amber-500/30">
                          {f.tier}
                        </span>
                        <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                          {f.commissionRate}% Commission
                        </div>
                      </td>

                      <td className="p-4 font-mono">
                        <div className="text-base font-black text-emerald-400">
                          ₹{(f.allocatedFund || 0).toLocaleString('en-IN')}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFundAdjustFranchise(f);
                            setFundAdjustAmount(5000);
                            setFundAdjustType('add');
                          }}
                          className="text-[10px] text-amber-400 hover:underline font-bold mt-0.5 block cursor-pointer"
                        >
                          + फंड एडजस्ट करें
                        </button>
                      </td>

                      <td className="p-4 font-mono">
                        <div className="font-bold text-slate-200">
                          ₹{(f.totalDistributed || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-yellow-400">
                          लाभ: ₹{(f.totalCommissionEarned || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isSuspended
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isSuspended ? 'सस्पेंडेड' : 'सक्रिय (Active)'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateFranchiseStatus(f.id, isSuspended ? 'approved' : 'suspended');
                            }}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSuspended
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                            }`}
                            title={isSuspended ? 'Activate Franchise' : 'Suspend Franchise'}
                          >
                            {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT FRANCHISE CREATION */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>एडमिन द्वारा डायरेक्ट फ्रेंचाइजी बनाएं (Create Direct Franchise)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              किसी भी पंजीकृत यूजर को सीधे फ्रेंचाइजी ID और प्रारंभिक फंड आवंटित करें।
            </p>
          </div>

          {createMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                createMsg.type === 'success'
                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                  : 'bg-red-950 border border-red-500 text-red-300'
              }`}
            >
              {createMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{createMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleDirectCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">यूजर चुनें (Select Registered User)</label>
              <select
                required
                value={newUserId}
                onChange={(e) => {
                  setNewUserId(e.target.value);
                  const u = users.find((x) => x.id === e.target.value);
                  if (u) {
                    setNewFranchiseName(`${u.name} तंबोला क्लब`);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none"
              >
                <option value="">-- खिलाड़ी चुनें --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.phone}) - {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">फ्रेंचाइजी ID (Custom Franchise ID)</label>
                <input
                  type="text"
                  required
                  value={newFranchiseId}
                  onChange={(e) => setNewFranchiseId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold text-xs uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">फ्रेंचाइजी / शॉप नाम</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. राजधानी गेमिंग पॉइंट"
                  value={newFranchiseName}
                  onChange={(e) => setNewFranchiseName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">शहर (City)</label>
                <input
                  type="text"
                  placeholder="उदा. Jaipur"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">टियर (Tier Plan)</label>
                <select
                  value={newTier}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setNewTier(t);
                    if (t === 'master') {
                      setNewCommission(7.0);
                      setNewAllocated(25000);
                    } else if (t === 'gold') {
                      setNewCommission(5.0);
                      setNewAllocated(10000);
                    } else if (t === 'silver') {
                      setNewCommission(4.0);
                      setNewAllocated(5000);
                    } else {
                      setNewCommission(3.0);
                      setNewAllocated(2000);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  <option value="bronze">Bronze (3%)</option>
                  <option value="silver">Silver (4%)</option>
                  <option value="gold">Gold (5%)</option>
                  <option value="master">Master (7%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">प्रारंभिक फंड आवंटन (₹)</label>
                <input
                  type="number"
                  min={100}
                  step={500}
                  value={newAllocated}
                  onChange={(e) => setNewAllocated(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">कमीशन दर (%)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={0.5}
                  value={newCommission}
                  onChange={(e) => setNewCommission(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-yellow-400 font-mono font-bold text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm hover:from-amber-300 shadow-xl cursor-pointer active:scale-98 transition-all disabled:opacity-50"
            >
              {actionLoading ? 'फ्रेंचाइजी बन रही है...' : '✓ फ्रेंचाइजी बनाएं व फंड एक्टिवेट करें'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: DISTRIBUTION AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-black uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">समय</th>
                  <th className="p-4">फ्रेंचाइजी ID व नाम</th>
                  <th className="p-4">प्राप्तकर्ता (खिलाड़ी)</th>
                  <th className="p-4">ट्रांसफर राशि</th>
                  <th className="p-4">कमीशन अर्जित</th>
                  <th className="p-4">नोट</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {franchiseTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      अभी तक कोई डिस्ट्रीब्यूशन ट्रांजैक्शन नहीं हुआ है।
                    </td>
                  </tr>
                ) : (
                  franchiseTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/50">
                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {new Date(t.timestamp).toLocaleDateString('hi-IN')} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-amber-300">{t.franchiseId}</span>
                        <div className="text-[10px] text-slate-400">{t.franchiseName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{t.recipientName || 'खिलाड़ी'}</div>
                        <div className="text-[10px] font-mono text-slate-400">{t.recipientPhone}</div>
                      </td>
                      <td className="p-4 font-mono font-black text-emerald-400 text-sm">
                        ₹{t.amount}
                      </td>
                      <td className="p-4 font-mono text-yellow-400 font-bold">
                        +₹{t.commissionEarned} ({t.commissionRate}%)
                      </td>
                      <td className="p-4 text-[11px] text-slate-400">
                        {t.note || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approvingFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 max-w-lg w-full border-2 border-emerald-500/50 space-y-5 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>फ्रेंचाइजी अप्रूवल (Approve Franchise)</span>
              </h3>
              <button
                type="button"
                onClick={() => setApprovingFranchise(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">आवेदक नाम:</span>
                <span className="font-bold text-white">{approvingFranchise.userName} ({approvingFranchise.userPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">फ्रेंचाइजी नाम:</span>
                <span className="font-bold text-amber-300">{approvingFranchise.franchiseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">सिक्योरिटी डिपॉजिट UTR:</span>
                <span className="font-mono font-bold text-emerald-400">{approvingFranchise.utrNumber} (₹{approvingFranchise.securityDeposit})</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">आधिकारिक फ्रेंचाइजी ID (Official ID)</label>
                <input
                  type="text"
                  value={assignedIdInput}
                  onChange={(e) => setAssignedIdInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">प्रारंभिक फंड आवंटन (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={500}
                    value={allocatedFundInput}
                    onChange={(e) => setAllocatedFundInput(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">कमीशन दर (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    step={0.5}
                    value={commissionRateInput}
                    onChange={(e) => setCommissionRateInput(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-yellow-400 font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">एडमिन रिमार्क</label>
                <input
                  type="text"
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmApprove}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl cursor-pointer"
              >
                {actionLoading ? 'स्वीकृत हो रहा है...' : '✓ अप्रूव करें व फ्रेंचाइजी ID एक्टिवेट करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund Adjust Modal */}
      {fundAdjustFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-amber-500/50 space-y-5 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>फंड एडजस्टमेंट (Fund Adjustment)</span>
              </h3>
              <button
                type="button"
                onClick={() => setFundAdjustFranchise(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-xs border border-slate-800 space-y-1">
              <span className="text-slate-400">फ्रेंचाइजी:</span>
              <span className="font-bold text-white block">{fundAdjustFranchise.franchiseName} ({fundAdjustFranchise.franchiseId})</span>
              <span className="text-slate-400">वर्तमान उपलब्ध फंड:</span>
              <span className="font-mono text-emerald-400 font-bold block">₹{fundAdjustFranchise.allocatedFund || 0}</span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFundAdjustType('add')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    fundAdjustType === 'add'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  + फंड जोड़ें (Add Fund)
                </button>
                <button
                  type="button"
                  onClick={() => setFundAdjustType('deduct')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    fundAdjustType === 'deduct'
                      ? 'bg-red-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  - फंड घटाएं (Deduct)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">राशि (₹)</label>
                <input
                  type="number"
                  min={100}
                  step={500}
                  value={fundAdjustAmount}
                  onChange={(e) => setFundAdjustAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">कारण / नोट</label>
                <input
                  type="text"
                  value={fundAdjustNote}
                  onChange={(e) => setFundAdjustNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmFundAdjust}
                className="w-full py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 cursor-pointer"
              >
                {actionLoading ? 'अपडेट हो रहा है...' : '✓ फंड अपडेट करें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
