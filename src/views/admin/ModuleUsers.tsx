import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Edit,
  DollarSign,
  Plus,
  Minus,
  Key,
  Ban,
  UserCheck,
  Eye,
  CreditCard,
  Building2,
  Share2,
  Calendar,
  Phone,
  Mail,
  Trophy,
  Filter,
  Check,
  UserPlus,
  Sparkles,
  ArrowUpDown,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  RefreshCw,
  UserX,
} from 'lucide-react';
import { User, WalletTransaction } from '../../types';

interface ModuleUsersProps {
  users: User[];
  onToggleKYC: (userId: string) => Promise<boolean>;
  onUpdateWalletBalance: (userId: string, amount: number, type: 'credit' | 'debit') => Promise<boolean>;
  onToggleBlockUser?: (userId: string) => void;
  onResetPassword?: (userId: string) => void;
  onRegisterUser?: (newUser: User) => void;
  onDeleteUser?: (userId: string) => Promise<boolean> | void;
  onBatchDeleteUsers?: (userIds: string[]) => Promise<boolean> | void;
  transactions?: WalletTransaction[];
}

export const ModuleUsers: React.FC<ModuleUsersProps> = ({
  users,
  onToggleKYC,
  onUpdateWalletBalance,
  onToggleBlockUser,
  onResetPassword,
  onRegisterUser,
  onDeleteUser,
  onBatchDeleteUsers,
  transactions = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'newest' | 'active' | 'inactive' | 'blocked' | 'kyc_pending' | 'kyc_verified' | 'vip'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'balance_desc' | 'name_asc'>('newest');
  
  // Selected user for details drawer
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Wallet Adjust Modal
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState<string>('Bonus / Manual adjustment');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  // Manual Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserBonus, setNewUserBonus] = useState<number>(10);
  const [newUserReferredBy, setNewUserReferredBy] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Batch Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Local blocked status tracker for optimistic updates
  const [blockedMap, setBlockedMap] = useState<Record<string, boolean>>({});
  const [resetPassMsg, setResetPassMsg] = useState<string | null>(null);

  // Helper to check if a user is recently registered (within last 7 days or newly added)
  const isRecentUser = (u: User) => {
    if (!u.createdAt) return false;
    const regTime = new Date(u.createdAt).getTime();
    if (isNaN(regTime)) return false;
    const now = Date.now();
    return now - regTime < 7 * 24 * 60 * 60 * 1000;
  };

  const newUsersCount = users.filter(isRecentUser).length;

  const filteredUsers = users
    .filter((u) => {
      const isBlocked = blockedMap[u.id] ?? (u.status === 'blocked' || u.isBlocked);
      
      // Tab filter
      if (filterTab === 'newest' && !isRecentUser(u)) return false;
      if (filterTab === 'active' && (isBlocked || u.status === 'inactive')) return false;
      if (filterTab === 'inactive' && u.status !== 'inactive') return false;
      if (filterTab === 'blocked' && !isBlocked) return false;
      if (filterTab === 'kyc_pending' && u.kycStatus !== 'pending') return false;
      if (filterTab === 'kyc_verified' && u.kycStatus !== 'verified') return false;
      if (filterTab === 'vip' && (u.walletBalance || 0) < 1000) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          (u.id && u.id.toLowerCase().includes(q)) ||
          (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
          (u.referredBy && u.referredBy.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      }
      if (sortBy === 'balance_desc') {
        return (b.walletBalance || 0) - (a.walletBalance || 0);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const handleToggleBlock = (user: User) => {
    const currentlyBlocked = blockedMap[user.id] ?? (user.status === 'blocked' || user.isBlocked);
    setBlockedMap((prev) => ({ ...prev, [user.id]: !currentlyBlocked }));
    if (onToggleBlockUser) {
      onToggleBlockUser(user.id);
    }
  };

  const handleResetPassword = (user: User) => {
    if (onResetPassword) {
      onResetPassword(user.id);
    }
    setResetPassMsg(`Temporary PIN sent to ${user.phone} and ${user.email}: 884219`);
    setTimeout(() => setResetPassMsg(null), 5000);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      if (onDeleteUser) {
        await onDeleteUser(userToDelete.id);
      }
      setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
      setDeleteSuccessMsg(`✓ यूज़र "${userToDelete.name}" (ID: ${userToDelete.id}) को सफलतापूर्वक हटा दिया गया!`);
      setTimeout(() => {
        setDeleteSuccessMsg(null);
        setUserToDelete(null);
      }, 1200);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setDeleteLoading(true);
    try {
      if (onBatchDeleteUsers) {
        await onBatchDeleteUsers(selectedUserIds);
      } else if (onDeleteUser) {
        for (const uid of selectedUserIds) {
          await onDeleteUser(uid);
        }
      }
      setDeleteSuccessMsg(`✓ ${selectedUserIds.length} बेकार/चयनित ID सफलतापूर्वक हटा दी गईं!`);
      setSelectedUserIds([]);
      setTimeout(() => {
        setDeleteSuccessMsg(null);
        setShowBatchDeleteModal(false);
      }, 1400);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleExecuteWalletAdjust = async () => {
    if (!adjustingUser || adjustAmount <= 0) return;
    setAdjustLoading(true);
    try {
      await onUpdateWalletBalance(adjustingUser.id, adjustAmount, adjustType);
      setAdjustSuccess(`Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ₹${adjustAmount} to ${adjustingUser.name}`);
      setTimeout(() => {
        setAdjustSuccess(null);
        setAdjustingUser(null);
      }, 1500);
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleCreateNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone.trim()) return;

    const phoneDigits = newUserPhone.replace(/\D/g, '').slice(-10);
    const createdUser: User = {
      id: `usr_${Date.now()}`,
      name: newUserName.trim(),
      phone: `+91 ${phoneDigits}`,
      email: newUserEmail.trim() || `${newUserName.toLowerCase().replace(/\s+/g, '')}${phoneDigits.slice(-4)}@tambolalive.com`,
      password: newUserPassword || '123456',
      role: 'user',
      status: 'active',
      walletBalance: newUserBonus,
      depositBalance: 0,
      winningBalance: newUserBonus,
      referralBalance: 0,
      bonusRewardBalance: 0,
      referralCode: `REF-${newUserName.slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
      referredBy: newUserReferredBy.trim() ? newUserReferredBy.trim().toUpperCase() : undefined,
      kycStatus: 'verified',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      createdAt: new Date().toISOString(),
      bankDetails: {
        accountName: newUserName.trim(),
        accountNumber: 'XXXXXX' + Math.floor(1000 + Math.random() * 9000),
        ifsc: 'SBIN0001234',
        bankName: 'State Bank of India',
        upiId: `${phoneDigits}@upi`,
      },
    };

    if (onRegisterUser) {
      onRegisterUser(createdUser);
    }

    setAddUserSuccess(`✓ नया यूज़र "${createdUser.name}" सफलतापूर्वक जोड़ दिया गया!`);
    setTimeout(() => {
      setAddUserSuccess(null);
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserPhone('');
      setNewUserEmail('');
      setNewUserReferredBy('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>यूज़र व प्लेयर मैनेजमेंट (User Management)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            सभी रजिस्टर्ड और नए जुड़े खिलाड़ियों की लाइव सूची, KYC वेरिफिकेशन, वॉलेट बैलेंस और एक्टिविटी।
          </p>
        </div>

        {/* Global Stats Counter + Add User Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Players: </span>
            <strong className="text-white font-bold">{users.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/40 text-xs">
            <span className="text-amber-400 font-bold">🆕 New Users: </span>
            <strong className="text-amber-300 font-black">{newUsersCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
            <span className="text-emerald-400 font-bold">KYC Verified: </span>
            <strong className="text-emerald-300 font-black">{users.filter((u) => u.kycStatus === 'verified').length}</strong>
          </div>
          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ नया यूज़र जोड़ें</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `All Users (${users.length})` },
            { id: 'newest', label: `🆕 New Registrations (${newUsersCount})` },
            { id: 'active', label: 'Active' },
            { id: 'kyc_pending', label: 'KYC Pending' },
            { id: 'kyc_verified', label: 'KYC Verified' },
            { id: 'vip', label: 'VIP (₹1k+)' },
            { id: 'blocked', label: 'Blocked' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, ref..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900">Newest First</option>
              <option value="oldest" className="bg-slate-900">Oldest First</option>
              <option value="balance_desc" className="bg-slate-900">Highest Balance</option>
              <option value="name_asc" className="bg-slate-900">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {resetPassMsg && (
        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs text-amber-200 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{resetPassMsg}</span>
        </div>
      )}

      {/* Batch Action Toolbar when items are selected */}
      {selectedUserIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
            <span className="text-xs font-black text-white">
              {selectedUserIds.length} यूज़र / ID सेलेक्ट किए गए हैं (Selected)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>🗑️ सेलेक्टेड {selectedUserIds.length} ID डिलीट करें</span>
            </button>
          </div>
        </div>
      )}

      {/* Users Master Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-3 py-3.5 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="cursor-pointer text-slate-400 hover:text-amber-400 transition-colors"
                    title="Select All Filtered"
                  >
                    {filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">User / Player</th>
                <th className="px-4 py-3.5">Registered Date</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Wallet Balances</th>
                <th className="px-4 py-3.5">KYC Status</th>
                <th className="px-4 py-3.5">Referral Details</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isBlocked = blockedMap[user.id] ?? (user.status === 'blocked' || user.isBlocked);
                  const isRecent = isRecentUser(user);
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-red-950/20' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelectUser(user.id)}
                          className="cursor-pointer text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-red-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* User Profile Cell */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl object-cover border border-amber-400/30 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-white text-xs">{user.name}</span>
                              {user.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-black border border-red-500/40">
                                  ADMIN
                                </span>
                              )}
                              {isRecent && (
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-400/50 animate-pulse flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="px-4 py-3.5">
                        <div className="text-white font-medium text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }) : 'Earlier'}
                          </span>
                        </div>
                        {user.createdAt && (
                          <div className="text-[10px] text-slate-400">
                            {new Date(user.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </td>

                      {/* Contact Details */}
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="text-white font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{user.email}</div>
                      </td>

                      {/* Wallet Balances */}
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="text-amber-300 font-black text-xs">
                          ₹{(user.walletBalance || (user.depositBalance + user.winningBalance + user.referralBalance)).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>Dep: ₹{user.depositBalance || 0}</span>
                          <span>Win: ₹{user.winningBalance || 0}</span>
                          <span>Ref: ₹{user.referralBalance || 0}</span>
                        </div>
                      </td>

                      {/* KYC Status */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onToggleKYC(user.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer border transition-colors ${
                            user.kycStatus === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : user.kycStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Click to toggle KYC approval"
                        >
                          {user.kycStatus === 'verified' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>VERIFIED</span>
                            </>
                          ) : user.kycStatus === 'pending' ? (
                            <>
                              <ShieldAlert className="w-3 h-3 text-amber-400" />
                              <span>PENDING</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>UNVERIFIED</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Referral Details */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-amber-400 font-bold text-xs">{user.referralCode}</div>
                        {user.referredBy || user.referredByUserId ? (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            Upline: {user.referredBy || user.referredByUserId}
                            {(() => {
                              const uplineUser = users.find(
                                (u) =>
                                  (user.referredByUserId && u.id === user.referredByUserId) ||
                                  (user.referredBy && (u.referralCode === user.referredBy || u.id === user.referredBy))
                              );
                              return uplineUser ? ` (${uplineUser.name})` : '';
                            })()}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500">Direct Signup</div>
                        )}
                      </td>

                      {/* Account Status Toggle */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleBlock(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer border transition-colors ${
                            isBlocked
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Ban className="w-3 h-3 text-red-400" />
                              <span>BLOCKED</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>ACTIVE</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions Cell */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingUser(user);
                              setAdjustAmount(100);
                              setAdjustType('credit');
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 transition-colors cursor-pointer"
                            title="Direct Wallet Credit / Debit"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 transition-colors cursor-pointer"
                            title="Reset PIN / Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {/* DELETE USER ACTION BUTTON */}
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                            title="ID डिलीट करें (Delete User ID)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    कोई यूज़र नहीं मिला (No users matching the selected criteria).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Register New User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">नया यूज़र जोड़ें (Register User)</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {addUserSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                {addUserSuccess}
              </div>
            )}

            <form onSubmit={handleCreateNewUserSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">पूरा नाम (Full Name) *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="उदा. राहुल शर्मा"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">10-अंकीय मोबाइल नंबर (Phone) *</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="उदा. 9876543210"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">ईमेल पता (Email - Optional)</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="उदा. rahul@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">पासवर्ड (Password)</label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">साइनअप बोनस (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newUserBonus}
                    onChange={(e) => setNewUserBonus(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold text-amber-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">रेफरल कोड (Referred By Code - Optional)</label>
                <input
                  type="text"
                  value={newUserReferredBy}
                  onChange={(e) => setNewUserReferredBy(e.target.value.toUpperCase())}
                  placeholder="उदा. REF-ASH772"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow cursor-pointer active:scale-95 transition-all"
                >
                  ✓ रजिस्टर करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Wallet Adjustment */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">Adjust User Wallet</h3>
              </div>
              <button
                onClick={() => setAdjustingUser(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                src={adjustingUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                alt={adjustingUser.name}
                className="w-12 h-12 rounded-xl object-cover border border-amber-400/40"
              />
              <div>
                <div className="text-white font-black text-sm">{adjustingUser.name}</div>
                <div className="text-xs text-slate-400">{adjustingUser.phone}</div>
                <div className="text-xs text-amber-300 font-bold mt-0.5">
                  Current Balance: ₹{(adjustingUser.walletBalance || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Type selector: Credit vs Debit */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('credit')}
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  adjustType === 'credit'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>CREDIT (ADD MONEY)</span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('debit')}
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  adjustType === 'debit'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Minus className="w-4 h-4" />
                <span>DEBIT (DEDUCT)</span>
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Amount (₹)</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                min={1}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-black text-lg focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold">Reason / Admin Audit Note</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="E.g. Festival Bonus, Game compensation, etc."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {adjustSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                {adjustSuccess}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteWalletAdjust}
                disabled={adjustLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow cursor-pointer active:scale-95 transition-all"
              >
                {adjustLoading ? 'Processing...' : `Confirm ${adjustType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full User Profile & Bank Details Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                  alt={selectedUser.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400"
                />
                <div>
                  <h3 className="text-lg font-black text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Deposit Wallet</div>
                <div className="text-base font-black text-white">₹{selectedUser.depositBalance || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Winning Wallet</div>
                <div className="text-base font-black text-amber-300">₹{selectedUser.winningBalance || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Referral Wallet</div>
                <div className="text-base font-black text-emerald-400">₹{selectedUser.referralBalance || 0}</div>
              </div>
            </div>

            {/* Bank & UPI Details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>Payout & Bank Account Details</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                <div>UPI ID: <strong className="text-white">{selectedUser.bankDetails?.upiId || `${selectedUser.phone.replace(/\D/g, '')}@upi`}</strong></div>
                <div>Bank Name: <strong className="text-white">{selectedUser.bankDetails?.bankName || 'State Bank of India'}</strong></div>
                <div>Account No: <strong className="text-white font-mono">{selectedUser.bankDetails?.accountNumber || 'XXXXXX5892'}</strong></div>
                <div>IFSC Code: <strong className="text-white font-mono">{selectedUser.bankDetails?.ifsc || 'SBIN0001234'}</strong></div>
              </div>
            </div>

            {/* Referral Tree Info */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                <Share2 className="w-4 h-4" />
                <span>8-Level Referral Statistics</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Personal Code: <strong className="text-amber-400 font-mono">{selectedUser.referralCode}</strong></div>
                <div>Referred By: <strong className="text-white">{selectedUser.referredBy || 'Direct Registration'}</strong></div>
                <div>Joined: <strong className="text-emerald-400">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-IN') : 'Active'}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  setUserToDelete(target);
                }}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑️ यह ID डिलीट करें (Delete ID)</span>
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Single User Confirmation (ID डिलीट करें) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40">
                <AlertTriangle className="w-6 h-6 text-red-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">यूज़र / ID डिलीट करें?</h3>
                <p className="text-xs text-red-300">Are you sure you want to delete this user ID?</p>
              </div>
            </div>

            {deleteSuccessMsg ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{deleteSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">नाम (Name):</span>
                    <strong className="text-white font-bold">{userToDelete.name}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">User ID:</span>
                    <strong className="text-amber-400 font-mono text-[11px]">{userToDelete.id}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">फोन नंबर (Phone):</span>
                    <strong className="text-white font-mono">{userToDelete.phone}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">वॉलेट बैलेंस:</span>
                    <strong className="text-amber-300 font-black">
                      ₹{(userToDelete.walletBalance || 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  {userToDelete.referredBy && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Referred By:</span>
                      <strong className="text-purple-300 font-mono">{userToDelete.referredBy}</strong>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  ⚠️ <strong>सूचना:</strong> यह कार्रवाई इस यूज़र ID को हमेशा के लिए सिस्टम और डेटाबेस से हटा देगी। यदि यह कोई बेकार या टेस्ट ID है तो ही हटाएं।
                </div>
              </div>
            )}

            {!deleteSuccessMsg && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-red-500/20 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {deleteLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{deleteLoading ? 'डिलीट हो रहा है...' : 'हाँ, ID डिलीट करें'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Batch Delete Confirmation (मल्टीपल ID डिलीट करें) */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40">
                <UserX className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {selectedUserIds.length} ID एक साथ डिलीट करें?
                </h3>
                <p className="text-xs text-red-300">Bulk delete selected user accounts</p>
              </div>
            </div>

            {deleteSuccessMsg ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{deleteSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  आपने कुल <strong className="text-amber-300 font-black">{selectedUserIds.length}</strong> बेकार / टेस्ट यूज़र ID को डिलीट करने के लिए चुना है।
                </p>

                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  {users
                    .filter((u) => selectedUserIds.includes(u.id))
                    .map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-[11px] text-slate-300 py-1 px-2 rounded-lg bg-slate-900">
                        <span className="font-bold text-white truncate max-w-[150px]">{u.name}</span>
                        <span className="font-mono text-slate-400 text-[10px]">ID: {u.id}</span>
                      </div>
                    ))}
                </div>

                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
                  ⚠️ सभी चयनित ID डेटाबेस से हमेशा के लिए मिटा दी जाएंगी।
                </div>
              </div>
            )}

            {!deleteSuccessMsg && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteModal(false)}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-red-500/20 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {deleteLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{deleteLoading ? 'डिलीट हो रहा है...' : `हाँ, ${selectedUserIds.length} ID डिलीट करें`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};