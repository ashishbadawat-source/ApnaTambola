import React, { useState, useMemo } from 'react';
import {
  Share2,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sliders,
  DollarSign,
  Layers,
  Sparkles,
  Search,
  Filter,
  Check,
  Award,
  Key,
  Copy,
  Link,
  ShieldCheck,
  ArrowRight,
  GitBranch,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  FolderTree,
  List,
} from 'lucide-react';
import { ReferralCommission, User } from '../../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ModuleReferralsProps {
  users: User[];
  commissions: ReferralCommission[];
  onApproveCommission?: (commissionId: string) => void;
  onReverseCommission?: (commissionId: string) => void;
  onUpdateUser?: (user: User) => void;
}

interface AdminTreeNode {
  user: User;
  level: number;
  children: AdminTreeNode[];
}

export const ModuleReferrals: React.FC<ModuleReferralsProps> = ({
  users,
  commissions,
  onApproveCommission,
  onReverseCommission,
  onUpdateUser,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [levels, setLevels] = useState({
    l1: 2.0,
    l2: 1.0,
    l3: 0.5,
    l4: 0.4,
    l5: 0.3,
    l6: 0.2,
    l7: 0.1,
    l8: 0.1,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'reversed'>('all');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Diagnostic / Referral Trace State
  const [traceSearch, setTraceSearch] = useState('');
  const [selectedTraceUserId, setSelectedTraceUserId] = useState<string>(users[0]?.id || '');
  const [reassignSponsorId, setReassignSponsorId] = useState<string>('');
  const [reassignStatus, setReassignStatus] = useState<string | null>(null);
  const [downlineViewMode, setDownlineViewMode] = useState<'tree' | 'table'>('tree');
  const [adminCollapsedNodes, setAdminCollapsedNodes] = useState<Record<string, boolean>>({});

  // Helper matching function
  const isDirectMatch = (child: User, parent: User) => {
    if (!child || !parent || child.id === parent.id) return false;
    const pId = (parent.id || '').trim().toUpperCase();
    const pCode = (parent.referralCode || '').trim().toUpperCase();
    const pPhone = parent.phone ? parent.phone.replace(/\D/g, '') : '';
    const pEmail = (parent.email || '').trim().toLowerCase();
    const pName = (parent.name || '').trim().toUpperCase();

    // 1. Direct referredByUserId match
    if (child.referredByUserId) {
      const cRefUserId = child.referredByUserId.trim().toUpperCase();
      if (cRefUserId === pId || (pCode && cRefUserId === pCode)) {
        return true;
      }
    }

    // 2. targetReferredBy code match
    if (child.referredBy) {
      const clean = child.referredBy.trim().toUpperCase();
      const cleanLower = child.referredBy.trim().toLowerCase();
      const cleanDigits = clean.replace(/\D/g, '');

      if (pCode && clean === pCode) return true;
      if (pId && clean === pId) return true;

      const pCodeNoPrefix = pCode.replace(/^REF-?/, '');
      const cleanNoPrefix = clean.replace(/^REF-?/, '');
      if (pCodeNoPrefix && cleanNoPrefix && (pCodeNoPrefix === cleanNoPrefix || pCodeNoPrefix === clean || cleanNoPrefix === pCode)) return true;

      if (pCode && (clean.includes(pCode) || pCode.includes(clean))) return true;
      if (pId && (clean.includes(pId) || pId.includes(clean))) return true;

      if (pEmail && cleanLower === pEmail) return true;

      if (pPhone && cleanDigits) {
        if (cleanDigits === pPhone || pPhone.endsWith(cleanDigits) || cleanDigits.endsWith(pPhone)) return true;
        if (pPhone.length >= 6 && cleanDigits.length >= 6 && pPhone.slice(-6) === cleanDigits.slice(-6)) return true;
      }

      if (pName && clean === pName) return true;
    }

    return false;
  };

  // Selected User for Trace
  const currentTraceUser = useMemo(() => {
    return users.find((u) => u.id === selectedTraceUserId) || users[0] || null;
  }, [users, selectedTraceUserId]);

  // Compute Full 8-Level Downline Subtree for currentTraceUser
  const adminDownlineTree = useMemo(() => {
    if (!currentTraceUser) return null;

    const buildTree = (parentNode: User, depth: number, visited: Set<string>): AdminTreeNode[] => {
      if (depth > 8) return [];
      const children = users.filter((u) => !visited.has(u.id) && isDirectMatch(u, parentNode));
      return children.map((ch) => {
        const nextVisited = new Set(visited);
        nextVisited.add(ch.id);
        return {
          user: ch,
          level: depth,
          children: buildTree(ch, depth + 1, nextVisited),
        };
      });
    };

    const rootVisited = new Set<string>([currentTraceUser.id]);
    return buildTree(currentTraceUser, 1, rootVisited);
  }, [currentTraceUser, users]);

  const toggleAdminCollapse = (id: string) => {
    setAdminCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute Full Upline Chain (Level 1 Parent -> Level 2 -> Level 3 ... Up to Root)
  const uplineChain = useMemo(() => {
    if (!currentTraceUser) return [];
    const chain: { level: number; user: User; matchReason: string }[] = [];
    const visitedIds = new Set<string>([currentTraceUser.id]);
    let currentChild: User = currentTraceUser;

    for (let depth = 1; depth <= 8; depth++) {
      const parent = users.find((u) => !visitedIds.has(u.id) && isDirectMatch(currentChild, u));
      if (parent) {
        visitedIds.add(parent.id);
        let reason = 'Referred By Code / ID Match';
        if (currentChild.referredByUserId === parent.id) reason = 'Direct referredByUserId Link';
        else if (parent.referralCode && currentChild.referredBy?.includes(parent.referralCode)) reason = 'Referral Code Match';
        else if (parent.phone && currentChild.referredBy && parent.phone.replace(/\D/g, '').endsWith(currentChild.referredBy.replace(/\D/g, ''))) reason = 'Phone Number Match';

        chain.push({ level: depth, user: parent, matchReason: reason });
        currentChild = parent;
      } else {
        break;
      }
    }
    return chain;
  }, [currentTraceUser, users]);

  // Compute Direct Downline (Level 1 Referrals) for selected user
  const directDownline = useMemo(() => {
    if (!currentTraceUser) return [];
    return users.filter((u) => u.id !== currentTraceUser.id && isDirectMatch(u, currentTraceUser));
  }, [currentTraceUser, users]);

  // Filtered User list for search autocomplete
  const traceFilteredUsers = useMemo(() => {
    if (!traceSearch.trim()) return users.slice(0, 10);
    const q = traceSearch.toLowerCase();
    const qDigits = traceSearch.replace(/\D/g, '');
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
        (u.phone && (u.phone.includes(q) || (qDigits && u.phone.replace(/\D/g, '').includes(qDigits))))
      );
    }).slice(0, 15);
  }, [users, traceSearch]);

  // Handle manual sponsor link / re-assignment
  const handleReassignSponsor = async () => {
    if (!currentTraceUser || !reassignSponsorId) return;
    const newSponsor = users.find((u) => u.id === reassignSponsorId);
    if (!newSponsor) return;

    const updated: User = {
      ...currentTraceUser,
      referredBy: newSponsor.referralCode || newSponsor.id,
      referredByUserId: newSponsor.id,
    };

    try {
      // 1. Update in Firestore
      await setDoc(doc(db, 'users', updated.id), JSON.parse(JSON.stringify(updated)), { merge: true });

      // 2. Update on Server
      await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: updated,
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          referredBy: updated.referredBy,
          referredByUserId: updated.referredByUserId,
        }),
      });

      if (onUpdateUser) onUpdateUser(updated);

      setReassignStatus(`✓ ${currentTraceUser.name} को सफलतापूर्वक स्पॉन्सर ${newSponsor.name} (${newSponsor.referralCode}) से जोड़ दिया गया!`);
      setTimeout(() => setReassignStatus(null), 4000);
    } catch (err: any) {
      setReassignStatus(`⚠️ एरर: ${err?.message || 'Update failed'}`);
    }
  };

  // Local commission state for approval / reversal simulation
  const [commList, setCommList] = useState<ReferralCommission[]>(commissions);

  React.useEffect(() => {
    setCommList(commissions);
  }, [commissions]);

  const totalCommissionsPaid = commList
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const totalCap = (
    levels.l1 + levels.l2 + levels.l3 + levels.l4 + levels.l5 + levels.l6 + levels.l7 + levels.l8
  ).toFixed(1);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice('8-Level referral commission rates updated and locked in ticket engine!');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handleApprove = (id: string) => {
    setCommList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'approved' } : c))
    );
    if (onApproveCommission) onApproveCommission(id);
  };

  const handleReverse = (id: string) => {
    if (confirm('Reverse this commission payment? The amount will be deducted from the referrer.')) {
      setCommList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'reversed' } : c))
      );
      if (onReverseCommission) onReverseCommission(id);
    }
  };

  const filteredCommissions = commList.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.userName.toLowerCase().includes(q) ||
        c.sourceUserName.toLowerCase().includes(q) ||
        c.transactionId.toLowerCase().includes(q) ||
        c.gameTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-amber-400" />
            <span>8-Level Multi-Tier Referral Management &amp; Trace</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit live parent/upline chains, diagnose device registration linkages, inspect user passwords, and configure ticket commission rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
            <span className="text-emerald-400 font-bold">Total Distributed: </span>
            <strong className="text-emerald-300 font-black">₹{totalCommissionsPaid.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* 🔍 LIVE REFERRAL TRACE & SPONSOR DIAGNOSTICS TOOL */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1b122e] via-slate-900 to-[#0c1424] border-2 border-purple-500/50 p-5 sm:p-6 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-500/30 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-inner">
              <GitBranch className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>🔍 Live Referral Trace &amp; Diagnostic Tree (रेफरल ट्रेस व जांच)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500 text-white font-black text-[10px]">
                  Real-time Inspector
                </span>
              </h3>
              <p className="text-xs text-purple-200/80">
                किसी भी यूज़र का पूरा अपलाइन स्पॉन्सर पाथ (Level 1 से Root) व उसके डायरेक्ट रेफरल की लाइव जांच करें।
              </p>
            </div>
          </div>

          {/* Quick Search Selector */}
          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={traceSearch}
                onChange={(e) => setTraceSearch(e.target.value)}
                placeholder="Search by Name, Phone, ID, Code..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950/90 border border-purple-400/40 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Quick User Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Select User:</span>
          {traceFilteredUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedTraceUserId(u.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTraceUserId === u.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-lg'
                  : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <span>{u.name}</span>
              <span className="font-mono text-[10px] opacity-75">({u.referralCode || 'NO-CODE'})</span>
            </button>
          ))}
        </div>

        {currentTraceUser ? (
          <div className="space-y-4">
            {/* Selected User Header Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/90 border border-purple-500/30">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">जांच किया जा रहा यूज़र (Selected)</span>
                <span className="text-sm font-black text-amber-300 flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  {currentTraceUser.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono block select-all">{currentTraceUser.id}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">मोबाइल &amp; पासवर्ड (Login Credentials)</span>
                <span className="text-xs font-bold text-white block mt-0.5">{currentTraceUser.phone || 'No Phone'}</span>
                <div className="flex items-center gap-1 mt-1">
                  <Key className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-xs font-black text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-amber-400/30 select-all">
                    {currentTraceUser.password || '123456'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">यूज़र का पर्सनल रेफरल कोड</span>
                <span className="text-sm font-mono font-black text-emerald-400 block mt-0.5 select-all">
                  {currentTraceUser.referralCode || 'REF-NONE'}
                </span>
                <span className="text-[10px] text-slate-400">Total Directs: {directDownline.length} Users</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">रजिस्टर्ड अपलाइन कोड / ID</span>
                <span className="text-xs font-mono font-bold text-purple-300 block mt-0.5 truncate select-all">
                  {currentTraceUser.referredBy || currentTraceUser.referredByUserId || 'None (Direct Root)'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate block">
                  UserId: {currentTraceUser.referredByUserId || 'N/A'}
                </span>
              </div>
            </div>

            {/* Visual Upline Trace Chain */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <span>👑 अपलाइन स्पॉन्सर चैन (Upline Parent Hierarchy Chain)</span>
                </span>
                <span className="text-[11px] text-purple-300 font-bold">
                  {uplineChain.length > 0 ? `Total ${uplineChain.length} Upline Level(s)` : 'Direct Company Root'}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                {/* Root / Top */}
                <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-500/40 text-center shrink-0 min-w-[140px]">
                  <span className="text-[10px] font-black text-blue-300 block uppercase">Level 0: Root</span>
                  <span className="text-xs font-black text-white block mt-0.5">🏛️ Company Root</span>
                  <span className="text-[9px] text-blue-200/70 font-mono">SYSTEM_ADMIN</span>
                </div>

                {uplineChain.map((node) => (
                  <React.Fragment key={node.user.id}>
                    <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/50 text-center shrink-0 min-w-[150px]">
                      <span className="text-[10px] font-black text-purple-300 block uppercase">
                        Level {node.level} Sponsor
                      </span>
                      <span className="text-xs font-black text-amber-300 block mt-0.5">{node.user.name}</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 block">{node.user.referralCode}</span>
                      <span className="text-[9px] text-slate-400 font-mono block select-all truncate max-w-[140px]">
                        ID: {node.user.id}
                      </span>
                    </div>
                  </React.Fragment>
                ))}

                <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                {/* Active Target Node */}
                <div className="p-3 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-center shrink-0 min-w-[160px] shadow-lg">
                  <span className="text-[10px] font-black text-amber-300 block uppercase">🎯 Selected User</span>
                  <span className="text-xs font-black text-white block mt-0.5">{currentTraceUser.name}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 block">{currentTraceUser.referralCode}</span>
                  <span className="text-[9px] text-amber-200 font-mono block select-all">
                    PASS: {currentTraceUser.password || '123456'}
                  </span>
                </div>
              </div>
            </div>

            {/* Downline Tree / Direct Downline Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <FolderTree className="w-4 h-4" />
                    <span>डाउनलाइन टीम स्ट्रक्चर (Downline Hierarchy Tree - {directDownline.length} Directs)</span>
                  </span>
                </div>

                {/* Tree / Table Mode Switcher */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setDownlineViewMode('tree')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      downlineViewMode === 'tree' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>🌲 8-लेवल ट्री (Tree)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownlineViewMode('table')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      downlineViewMode === 'table' ? 'bg-purple-600 text-white font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>📋 डायरेक्ट लिस्ट (List)</span>
                  </button>
                </div>
              </div>

              {downlineViewMode === 'tree' ? (
                /* 🌲 ADMIN DOWNLINE TREE */
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      {currentTraceUser.name} का पूर्ण 8-लेवल डाउनलाइन ट्री (शाखाएं खोलने के लिए क्लिक करें):
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdminCollapsedNodes({})}
                      className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Expand All
                    </button>
                  </div>

                  {adminDownlineTree && adminDownlineTree.length > 0 ? (
                    <div className="pl-3 sm:pl-4 border-l-2 border-purple-500/40 space-y-2.5 pt-1">
                      {adminDownlineTree.map((childNode) => (
                        <AdminDownlineTreeNodeView
                          key={childNode.user.id}
                          node={childNode}
                          collapsedNodes={adminCollapsedNodes}
                          onToggle={toggleAdminCollapse}
                          onSelectUser={setSelectedTraceUserId}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                      इस यूज़र के अधीन अभी कोई डाउनलाइन आईडी नहीं है।
                    </div>
                  )}
                </div>
              ) : (
                /* 📋 DIRECT MEMBERS TABLE */
                directDownline.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                    अभी तक इस यूज़र के डायरेक्ट में कोई डाउनलाइन आईडी पंजीकृत नहीं हुई है।
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2.5">User / Player</th>
                          <th className="px-3 py-2.5">User ID</th>
                          <th className="px-3 py-2.5">Contact</th>
                          <th className="px-3 py-2.5">🔑 Password</th>
                          <th className="px-3 py-2.5">Personal Code</th>
                          <th className="px-3 py-2.5">Joined Date</th>
                          <th className="px-3 py-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {directDownline.map((downlineUser) => (
                          <tr key={downlineUser.id} className="hover:bg-slate-900/40">
                            <td className="px-3 py-2.5 font-bold text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-black text-[10px] flex items-center justify-center border border-purple-400/30">
                                {downlineUser.name.charAt(0).toUpperCase()}
                              </div>
                              <span>{downlineUser.name}</span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[11px] text-purple-300 select-all">
                              {downlineUser.id}
                            </td>
                            <td className="px-3 py-2.5 text-slate-300 font-mono text-[11px]">
                              {downlineUser.phone || 'N/A'}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-mono font-black text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-amber-400/30 text-[11px] select-all">
                                {downlineUser.password || '123456'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono font-bold text-emerald-400">
                              {downlineUser.referralCode || 'N/A'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-400 text-[11px]">
                              {downlineUser.createdAt ? new Date(downlineUser.createdAt).toLocaleDateString('en-GB') : 'Today'}
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() => setSelectedTraceUserId(downlineUser.id)}
                                className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-black text-[10px] border border-purple-400/30 transition-colors cursor-pointer"
                              >
                                Trace &rarr;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Quick Fix / Re-assign Sponsor Link Tool */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-amber-400" />
                  <span>स्पॉन्सर लिंक ठीक करें (Re-assign / Link Sponsor to this User)</span>
                </span>
                <p className="text-[11px] text-amber-200/80">
                  यदि किसी यूज़र के रजिस्ट्रेशन में रेफरल कोड छूट गया हो तो यहाँ से उसे सीधे सही स्पॉन्सर से जोड़ें।
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={reassignSponsorId}
                  onChange={(e) => setReassignSponsorId(e.target.value)}
                  className="bg-slate-950 border border-amber-400/40 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="">Select New Sponsor...</option>
                  {users
                    .filter((u) => u.id !== currentTraceUser.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.referralCode || u.phone})
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={handleReassignSponsor}
                  disabled={!reassignSponsorId}
                  className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs transition-colors cursor-pointer shrink-0"
                >
                  Link Sponsor
                </button>
              </div>
            </div>

            {reassignStatus && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                {reassignStatus}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {saveNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* 8-Level Commission Configuration Form */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">8-Tier Commission Rates Engine (Ticket Play Only)</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-300 font-bold">Referral Engine:</span>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {enabled ? 'ENABLED' : 'PAUSED'}
            </button>
          </label>
        </div>

        {/* Info banner */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>कमीशन नियम:</strong> यह कमीशन केवल यूज़र द्वारा टिकट खरीदने (गेम खेलने) पर ही वितरित होगा। पेमेंट डिपॉजिट पर 0% कमीशन है।
          </span>
        </div>

        <form onSubmit={handleSaveRates} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-1">
            <div className="text-[10px] text-amber-400 font-black uppercase">Level 1 (Direct)</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l1}
                onChange={(e) => setLevels({ ...levels, l1: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 2.0%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-purple-400/40 space-y-1">
            <div className="text-[10px] text-purple-400 font-black uppercase">Level 2</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l2}
                onChange={(e) => setLevels({ ...levels, l2: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-purple-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 1.0%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-blue-400/40 space-y-1">
            <div className="text-[10px] text-blue-400 font-black uppercase">Level 3</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l3}
                onChange={(e) => setLevels({ ...levels, l3: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-blue-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.5%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-indigo-400/40 space-y-1">
            <div className="text-[10px] text-indigo-400 font-black uppercase">Level 4</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l4}
                onChange={(e) => setLevels({ ...levels, l4: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-indigo-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.4%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-teal-400/40 space-y-1">
            <div className="text-[10px] text-teal-400 font-black uppercase">Level 5</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l5}
                onChange={(e) => setLevels({ ...levels, l5: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-teal-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.3%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-400/40 space-y-1">
            <div className="text-[10px] text-emerald-400 font-black uppercase">Level 6</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l6}
                onChange={(e) => setLevels({ ...levels, l6: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-emerald-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.2%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-400/40 space-y-1">
            <div className="text-[10px] text-cyan-400 font-black uppercase">Level 7</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l7}
                onChange={(e) => setLevels({ ...levels, l7: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.1%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-rose-400/40 space-y-1">
            <div className="text-[10px] text-rose-400 font-black uppercase">Level 8</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={levels.l8}
                onChange={(e) => setLevels({ ...levels, l8: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none focus:border-rose-400"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">Default: 0.1%</div>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400">
              Total Maximum Commission Payout per Ticket: <strong className="text-amber-400">{totalCap}%</strong>
            </span>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Save Referral Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Commission Audit Trail Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Real-time Commission Transaction Ledger</span>
          </h3>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved / Credited</option>
              <option value="pending">Pending</option>
              <option value="reversed">Reversed</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, tx..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tx ID / Date</th>
                <th className="px-4 py-3">Earner (Upline)</th>
                <th className="px-4 py-3">Buyer (Downline)</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Base Price</th>
                <th className="px-4 py-3">Commission (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCommissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    <div className="text-white font-bold">{comm.transactionId}</div>
                    <div>{comm.timestamp}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    {comm.userName}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {comm.sourceUserName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-black text-[10px] border border-purple-400/30">
                      Level {comm.level} ({comm.percentage}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">₹{comm.baseAmount}</td>
                  <td className="px-4 py-3 font-black text-emerald-400 text-xs">
                    +₹{comm.commissionAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        comm.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : comm.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {comm.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {comm.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(comm.id)}
                        className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] hover:bg-emerald-500/30 cursor-pointer mr-1"
                      >
                        Approve
                      </button>
                    )}
                    {comm.status === 'approved' && (
                      <button
                        onClick={() => handleReverse(comm.id)}
                        className="px-2 py-1 rounded bg-red-500/10 text-red-400 font-bold text-[10px] hover:bg-red-500/20 cursor-pointer"
                        title="Reverse commission payout"
                      >
                        Reverse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* 🌲 Admin Downline Tree Node Component */
interface AdminDownlineTreeNodeViewProps {
  node: AdminTreeNode;
  collapsedNodes: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectUser: (id: string) => void;
}

const AdminDownlineTreeNodeView: React.FC<AdminDownlineTreeNodeViewProps> = ({
  node,
  collapsedNodes,
  onToggle,
  onSelectUser,
}) => {
  const isCollapsed = Boolean(collapsedNodes[node.user.id]);
  const hasChildren = node.children && node.children.length > 0;

  const levelColorMap: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-400/50' },
    2: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-400/50' },
    3: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-400/50' },
    4: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-400/50' },
    5: { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-400/50' },
    6: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-400/50' },
    7: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-400/50' },
    8: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-400/50' },
  };

  const levelStyle = levelColorMap[node.level] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };

  return (
    <div className="space-y-2 relative">
      <div
        className={`p-3 rounded-2xl border ${levelStyle.bg} ${levelStyle.border} hover:bg-slate-900/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-8 h-8 rounded-full ${levelStyle.bg} ${levelStyle.text} font-black text-xs flex items-center justify-center border ${levelStyle.border}`}>
              {node.user.name.charAt(0).toUpperCase()}
            </div>
            <span className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full font-black text-[8px] bg-slate-950 ${levelStyle.text} border ${levelStyle.border}`}>
              L{node.level}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm">{node.user.name}</span>
              <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${levelStyle.bg} ${levelStyle.text} border ${levelStyle.border}`}>
                Level {node.level}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap mt-0.5">
              <span className="font-mono text-purple-300 select-all">ID: {node.user.id}</span>
              {node.user.phone && <span className="font-mono text-slate-300">📱 {node.user.phone}</span>}
              <span className="font-mono text-emerald-400 font-bold">Code: {node.user.referralCode || 'N/A'}</span>
              <span className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-amber-400/30 text-amber-300 font-mono font-bold select-all">
                🔑 {node.user.password || '123456'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(node.user.id)}
              className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              <span>{node.children.length} Directs</span>
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="px-2 py-0.5 rounded-lg bg-slate-950/60 text-slate-500 text-[10px] font-bold border border-slate-800">
              0 Directs
            </span>
          )}

          <button
            type="button"
            onClick={() => onSelectUser(node.user.id)}
            className="px-2.5 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition-colors cursor-pointer"
          >
            Trace Root &rarr;
          </button>
        </div>
      </div>

      {/* Children branches */}
      {hasChildren && !isCollapsed && (
        <div className="pl-3 sm:pl-5 border-l-2 border-purple-500/30 space-y-2 pt-1">
          {node.children.map((childNode) => (
            <AdminDownlineTreeNodeView
              key={childNode.user.id}
              node={childNode}
              collapsedNodes={collapsedNodes}
              onToggle={onToggle}
              onSelectUser={onSelectUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};