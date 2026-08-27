import React, { useState, useMemo } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Layers,
  GitBranch,
  ChevronDown,
  ChevronRight,
  UserCheck,
  FolderTree,
  List,
  Search,
  Key,
  RefreshCw,
} from 'lucide-react';
import { User, ReferralMember, ReferralCommission } from '../types';
import { isDirectChildOf } from '../utils/referralMatcher';

interface ReferralViewProps {
  currentUser: User;
  allUsers?: User[];
  referralMembers: ReferralMember[];
  commissions: ReferralCommission[];
  onOpenDeposit: () => void;
  onForceRefresh?: () => void;
  isSyncing?: boolean;
}

interface TreeNode {
  user: User;
  level: number;
  ticketsBought: number;
  commissionEarned: number;
  children: TreeNode[];
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  currentUser,
  allUsers = [],
  referralMembers,
  commissions,
  onOpenDeposit,
  onForceRefresh,
  isSyncing = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [treeSearch, setTreeSearch] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Build Full Recursive Downline Tree
  const downlineTree = useMemo(() => {
    if (!currentUser) return null;

    const buildSubtree = (parentNode: User, currentDepth: number, visited: Set<string>): TreeNode[] => {
      if (currentDepth > 8) return [];
      const directChildren = allUsers.filter((u) => !visited.has(u.id) && isDirectChildOf(u, parentNode, commissions));
      
      return directChildren.map((childUser) => {
        const nextVisited = new Set(visited);
        nextVisited.add(childUser.id);
        
        const memberMeta = referralMembers.find((m) => m.id === childUser.id);
        const userCommissions = commissions
          .filter((c) => c.sourceUserId === childUser.id && c.status === 'approved')
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        return {
          user: childUser,
          level: currentDepth,
          ticketsBought: memberMeta ? memberMeta.ticketsBought : 0,
          commissionEarned: userCommissions || (memberMeta ? memberMeta.commissionEarned : 0),
          children: buildSubtree(childUser, currentDepth + 1, nextVisited),
        };
      });
    };

    const rootVisited = new Set<string>([currentUser.id]);
    const rootChildren = buildSubtree(currentUser, 1, rootVisited);

    const rootTreeNode: TreeNode = {
      user: currentUser,
      level: 0,
      ticketsBought: 0,
      commissionEarned: commissions.filter((c) => c.status === 'approved').reduce((sum, c) => sum + c.commissionAmount, 0),
      children: rootChildren,
    };

    return rootTreeNode;
  }, [currentUser, allUsers, referralMembers, commissions]);

  // Toggle Collapse on a Node
  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Expand all / Collapse all
  const handleExpandAll = () => setCollapsedNodes({});
  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    if (downlineTree) {
      const traverse = (node: TreeNode) => {
        if (node.children.length > 0) {
          allCollapsed[node.user.id] = true;
          node.children.forEach(traverse);
        }
      };
      traverse(downlineTree);
    }
    setCollapsedNodes(allCollapsed);
  };

  // Upline sponsor lookup
  const uplineUser = currentUser ? (
    allUsers.find((u) => {
      if (!currentUser || u.id === currentUser.id) return false;
      if (currentUser.referredByUserId && u.id === currentUser.referredByUserId) return true;
      const refCode = (currentUser.referredBy || '').trim().toUpperCase();
      const refNoPrefix = refCode.replace(/^REF-?/, '');
      const uCode = (u.referralCode || '').trim().toUpperCase();
      const uCodeNoPrefix = uCode.replace(/^REF-?/, '');
      const uId = (u.id || '').trim().toUpperCase();
      const uPhone = (u.phone || '').replace(/\D/g, '');
      const cleanDigits = refCode.replace(/\D/g, '');

      if (uCode && (uCode === refCode || uCodeNoPrefix === refNoPrefix || refCode.includes(uCode) || uCode.includes(refCode))) return true;
      if (uId && (uId === refCode || refCode.includes(uId) || uId.includes(refCode))) return true;
      if (cleanDigits.length >= 6 && uPhone && (uPhone === cleanDigits || uPhone.endsWith(cleanDigits) || cleanDigits.endsWith(uPhone))) return true;
      if (u.name && refCode === u.name.trim().toUpperCase()) return true;
      return false;
    }) || null
  ) : null;

  const getReferralLink = () => {
    if (typeof window === 'undefined') return `/?ref=${currentUser.referralCode}`;
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl.replace(/\/$/, '')}/?ref=${currentUser.referralCode}`;
  };

  const referralLink = getReferralLink();

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🎯 *अपना तंबोला (APNA TAMBOLA) - भारत का #1 लाइव तंबोला गेम!* 🏆\n\n🎁 *₹10 फ्री साइनअप बोनस* तुरंत पाएं!\n👑 8-लेवल अनलिमिटेड रेफरल कमीशन कमाएं और 10-सेकंड में सीधा UPI विथड्रॉल करें!\n\n👉 *मेरे रेफरल कोड (${currentUser.referralCode}) से तुरंत जॉइन करें:*\n${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleNativeShare = async () => {
    const shareTitle = 'अपना तंबोला (Apna Tambola) - Live Fun • Live Win';
    const shareText = `🎯 अपना तंबोला पर लाइव हौसी खेलें और जीतें! ₹10 फ्री बोनस पाएं (रेफरल कोड: ${currentUser.referralCode})`;

    // Try sharing with logo image attachment if supported
    try {
      if (navigator.share) {
        let fileToShare: File | null = null;
        try {
          const res = await fetch('/logo.png');
          if (res.ok) {
            const blob = await res.blob();
            fileToShare = new File([blob], 'apna-tambola-logo.png', { type: 'image/png' });
          }
        } catch (e) {}

        if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: referralLink,
            files: [fileToShare],
          });
          return;
        }

        // Standard Web Share
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: referralLink,
        });
        return;
      }
    } catch (e) {
      console.warn('Native share fallback:', e);
    }

    // Fallback to WhatsApp
    handleShareWhatsApp();
  };

  // Compute comprehensive active referral members list combining props & live allUsers
  const activeReferralMembers = useMemo<ReferralMember[]>(() => {
    const map = new Map<string, ReferralMember>();

    // 1. Seed with passed referral members
    (referralMembers || []).forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });

    if (!currentUser || !allUsers || allUsers.length === 0) {
      return Array.from(map.values());
    }

    // 2. Dynamically calculate 8-level downline members from allUsers
    const visited = new Set<string>([currentUser.id]);
    let currentParents: User[] = [currentUser];

    for (let depth = 1; depth <= 8; depth++) {
      const children = allUsers.filter(
        (u) => !visited.has(u.id) && currentParents.some((p) => isDirectChildOf(u, p, commissions))
      );
      if (children.length === 0) break;

      children.forEach((child) => {
        visited.add(child.id);
        const existing = map.get(child.id);
        const userComms = commissions
          .filter((c) => c.sourceUserId === child.id && c.status === 'approved')
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

        map.set(child.id, {
          id: child.id,
          name: child.name,
          email: child.email,
          phone: child.phone,
          level: depth,
          joinedDate: child.createdAt ? new Date(child.createdAt).toLocaleDateString('en-GB') : (existing?.joinedDate || 'Recently'),
          ticketsBought: existing?.ticketsBought || 0,
          commissionEarned: userComms || existing?.commissionEarned || 0,
          avatar: child.avatar || existing?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        });
      });

      currentParents = children;
    }

    return Array.from(map.values());
  }, [currentUser, allUsers, referralMembers, commissions]);

  // Direct Level 1 Referrals computed live from allUsers
  const directReferralsList = useMemo(() => {
    if (!currentUser || !allUsers || allUsers.length === 0) return [];
    return allUsers
      .filter((u) => u.id !== currentUser.id && isDirectChildOf(u, currentUser, commissions))
      .map((u) => {
        const memberMeta = referralMembers.find((m) => m.id === u.id);
        const earned = commissions
          .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id && c.status === 'approved')
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        return {
          ...u,
          ticketsBought: memberMeta?.ticketsBought || 0,
          commissionEarned: earned || memberMeta?.commissionEarned || 0,
        };
      })
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [currentUser, allUsers, commissions, referralMembers]);

  const totalEarnings = commissions
    .filter((c) => c.status === 'approved')
    .reduce((acc, c) => acc + c.commissionAmount, 0);

  const directMembersCount = activeReferralMembers.filter((m) => m.level === 1).length;
  const teamMembersCount = activeReferralMembers.length;

  const levelStats = [
    { level: 1, percent: '2.0%', name: 'Direct Referral Income (L1)', desc: 'Earned on every direct member ticket purchase', color: 'from-amber-500/20 border-amber-400/50 text-amber-300' },
    { level: 2, percent: '1.0%', name: 'Team Referral Income (L2)', desc: 'Earned when your direct team refers friends', color: 'from-purple-600/20 border-purple-500/50 text-purple-300' },
    { level: 3, percent: '0.5%', name: 'Team Referral Income (L3)', desc: '3rd-tier network ticket purchases', color: 'from-indigo-600/20 border-indigo-500/50 text-indigo-300' },
    { level: 4, percent: '0.4%', name: 'Team Referral Income (L4)', desc: '4th-tier network ticket purchases', color: 'from-blue-600/20 border-blue-500/50 text-blue-300' },
    { level: 5, percent: '0.3%', name: 'Team Referral Income (L5)', desc: '5th-tier network ticket purchases', color: 'from-teal-600/20 border-teal-500/50 text-teal-300' },
    { level: 6, percent: '0.2%', name: 'Team Referral Income (L6)', desc: '6th-tier network ticket purchases', color: 'from-emerald-600/20 border-emerald-500/50 text-emerald-300' },
    { level: 7, percent: '0.1%', name: 'Team Referral Income (L7)', desc: '7th-tier network ticket purchases', color: 'from-cyan-600/20 border-cyan-500/50 text-cyan-300' },
    { level: 8, percent: '0.1%', name: 'Team Referral Income (L8)', desc: '8th-tier network ticket purchases', color: 'from-rose-600/20 border-rose-500/50 text-rose-300' },
  ];

  const filteredMembers = activeReferralMembers.filter((m) => {
    if (selectedLevelFilter === 'all') return true;
    return m.level === selectedLevelFilter;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* 👑 Upline Sponsor Details Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#2c1242] via-[#1a1236] to-[#0d1726] border-2 border-purple-400/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-inner">
              <Users className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>👑 आपकी अपलाइन स्पॉन्सर जानकारी (Your Upline Sponsor)</span>
              </h3>
              <p className="text-[11px] text-purple-200/80">
                आपकी आईडी जिसके रेफरल लिंक / कोड से रजिस्टर्ड है (Direct Level 1 Parent)
              </p>
            </div>
          </div>

          {uplineUser || currentUser.referredBy || currentUser.referredByUserId ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>🟢 वेरिफाइड स्पॉन्सर (Active Upline)</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-black">
              🏛️ डायरेक्ट कंपनी / एडमिन अपलाइन
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-400/30">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">अपलाइन का नाम</span>
            <span className="text-sm font-black text-amber-300">
              {uplineUser ? uplineUser.name : (currentUser.referredBy ? `स्पॉन्सर (${currentUser.referredBy})` : 'Direct Company Root')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-400/30">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">अपलाइन यूज़र ID</span>
            <span className="text-xs font-mono font-bold text-purple-300 truncate block select-all">
              {uplineUser ? uplineUser.id : (currentUser.referredByUserId || currentUser.referredBy || 'SYSTEM_ROOT')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-400/30">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">अपलाइन रेफरल कोड</span>
            <span className="text-sm font-mono font-black text-emerald-400 select-all">
              {uplineUser ? uplineUser.referralCode : (currentUser.referredBy || 'DIRECT')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-400/30">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">आपका रेफरल कोड</span>
            <span className="text-sm font-mono font-black text-amber-400 select-all">
              {currentUser.referralCode || 'REF-YOU'}
            </span>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="relative rounded-3xl glass-panel-purple border-2 border-purple-500/40 p-6 sm:p-10 shadow-2xl space-y-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Apna Tambola Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-xl shadow-amber-500/30 border-2 border-amber-400 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full px-3 py-1 text-xs font-bold text-amber-300">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>8-Level Multi-Tier Revenue Tree</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-100">
              Earn Up to <span className="text-amber-400">4.6% Commission</span> Across 8 Levels
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Build your Tambola squad! Whenever any user in your 8-tier network buys a ticket or plays a match, the server automatically credits your commission in real time. (Only on ticket purchases, no commission on deposit payments).
            </p>
          </div>

          {/* Referral Link & Code Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-amber-400/40 space-y-3 lg:w-96 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase">My Referral ID</span>
              <div className="flex items-center gap-2">
                {onForceRefresh && (
                  <button
                    type="button"
                    onClick={onForceRefresh}
                    disabled={isSyncing}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer disabled:opacity-50"
                    title="रिफ्रेश डायरेक्ट टीम (Live Sync Downline)"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                    <span className="hidden sm:inline">{isSyncing ? 'सिंक...' : 'Sync'}</span>
                  </button>
                )}
                <span className="font-mono text-base font-black text-amber-400">
                  {currentUser.referralCode}
                </span>
              </div>
            </div>

            {/* Link Copy input */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent text-xs text-slate-300 px-2 outline-none truncate font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp शेयर</span>
              </button>
              <button
                onClick={handleNativeShare}
                className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>लिंक शेयर करें</span>
              </button>
            </div>

            {/* Live Link Share Preview Box */}
            <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-[11px] space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                📱 व्हाट्सएप/सोशल मीडिया लिंक प्रीव्यू:
              </span>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <img
                  src="/logo.png"
                  alt="Apna Tambola Preview"
                  className="w-10 h-10 rounded-lg object-cover border border-amber-400/50 shrink-0"
                />
                <div className="truncate">
                  <div className="font-bold text-white text-[11px] truncate">Apna Tambola - Live Fun • Live Win</div>
                  <div className="text-[10px] text-slate-400 truncate">पहला डिपॉजिट करने पर ₹10 बोनस + 8-लेवल कमीशन</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Earnings</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 text-glow-gold">
              ₹{totalEarnings.toFixed(2)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Referrals (L1)</span>
            <span className="text-xl sm:text-2xl font-black text-slate-100">
              {directMembersCount}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Team Network</span>
            <span className="text-xl sm:text-2xl font-black text-purple-300">
              {teamMembersCount} Members
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Commission Cap</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              4.6% (On Ticket Play)
            </span>
          </div>
        </div>

        {/* Important Rule Notice */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>कमीशन नियम:</strong> यह 8-लेवल इनकम केवल यूज़र द्वारा खेले जाने वाले <strong>टिकट की खरीद</strong> पर बनती है। वॉलेट डिपॉजिट (पेमेंट ऐड) पर कोई कमीशन नहीं बनता है।
          </span>
        </div>
      </div>

      {/* 🎯 DIRECT REFERRAL MEMBERS (LEVEL 1) LIVE SECTION */}
      <section className="p-4 sm:p-6 rounded-3xl bg-slate-900/95 border-2 border-amber-400/50 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>🎯 डायरेक्ट रेफरल सदस्य (Direct Referrals - Level 1)</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                {directReferralsList.length} Players
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              आपके रेफरल कोड से दूसरे किसी भी फोन या डिवाइस से रजिस्टर करने वाले खिलाड़ियों की लाइव सूची।
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Sync</span>
            </span>
            {onForceRefresh && (
              <button
                type="button"
                onClick={onForceRefresh}
                disabled={isSyncing}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                title="सभी डिवाइस से तुरंत लाइव रेफरल रीफ्रेश करें"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isSyncing ? 'सिंक...' : 'रीफ्रेश (Sync)'}</span>
              </button>
            )}
          </div>
        </div>

        {directReferralsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Player / User</th>
                  <th className="px-3 py-3">User ID</th>
                  <th className="px-3 py-3">Mobile Number</th>
                  <th className="px-3 py-3">Joined Date & Time</th>
                  <th className="px-3 py-3">Tickets Played</th>
                  <th className="px-3 py-3 text-right">Commission Earned</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {directReferralsList.map((user) => {
                  const isNew = user.createdAt && (Date.now() - new Date(user.createdAt).getTime() < 48 * 60 * 60 * 1000);
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Player Profile */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-amber-400/40 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isNew && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-400/40">
                                  NEW
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{user.email || 'No email'}</span>
                          </div>
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-purple-300 text-xs bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50 select-all">
                            {user.id}
                          </span>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="px-3 py-3 font-medium text-slate-200">
                        {user.phone || 'N/A'}
                      </td>

                      {/* Joined Date & Time */}
                      <td className="px-3 py-3">
                        <div className="text-slate-200 font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }) : 'Today'}
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

                      {/* Tickets */}
                      <td className="px-3 py-3 font-bold text-white">
                        {user.ticketsBought || 0} tickets
                      </td>

                      {/* Commission */}
                      <td className="px-3 py-3 text-right font-black text-amber-400 text-sm">
                        +₹{(user.commissionEarned || 0).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                          🟢 Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
            <Users className="w-8 h-8 text-amber-400/60 mx-auto" />
            <div>
              <h4 className="font-bold text-white text-sm">अभी तक कोई डायरेक्ट रेफरल नहीं जुड़ा है</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                अपना रेफरल कोड <strong className="text-amber-400 font-mono select-all">{currentUser.referralCode}</strong> या रेफरल लिंक शेयर करें। जब कोई नया यूजर दूसरे डिवाइस से रजिस्टर करेगा, वो तुरंत यहाँ और एडमिन पैनल में दिखाई देगा!
              </p>
            </div>
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <span>रेफरल लिंक WhatsApp पर शेयर करें</span>
            </button>
          </div>
        )}
      </section>

      {/* 8 Level-Wise Income Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              8-Level Payout Structure
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Automated Server-Side Calculation (Total 4.6%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
          {levelStats.map((lvl) => {
            const count = referralMembers.filter((m) => m.level === lvl.level).length;
            const earned = commissions
              .filter((c) => c.level === lvl.level && c.status === 'approved')
              .reduce((acc, c) => acc + c.commissionAmount, 0);

            return (
              <div
                key={lvl.level}
                className={`p-4 rounded-3xl glass-panel bg-gradient-to-b ${lvl.color} border shadow-xl flex flex-col justify-between space-y-3`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                      LEVEL {lvl.level}
                    </span>
                    <span className="text-lg sm:text-xl font-black">{lvl.percent}</span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100">{lvl.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-tight">{lvl.desc}</p>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Members:</span>
                    <strong className="text-slate-200">{count}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Earned:</span>
                    <strong className="text-amber-400 font-black">₹{earned.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Referral Network Members & Downline Tree */}
      <section className="glass-panel rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-amber-400" />
              <span>डाउनलाइन टीम नेटवर्क (Downline Genealogy Network)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold">
                {referralMembers.length} Members
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              अपनी पूरी 8-लेवल डाउनलाइन टीम का विजुअल ट्री (Tree View) देखें या लिस्ट में फ़िल्टर करें।
            </p>
          </div>

          {/* View Switcher: Tree vs Table */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>🌲 डाउनलाइन ट्री (Tree)</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-purple-600 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>📋 लिस्ट टेबल (Table)</span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'tree' ? (
          /* 🌲 VISUAL DOWNLINE TREE VIEW */
          <div className="space-y-4">
            {/* Tree Controls Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  placeholder="ट्री में नाम, ID या मोबाइल नंबर खोजें..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-bold transition-colors cursor-pointer"
                >
                  सब खोलें (Expand All)
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-bold transition-colors cursor-pointer"
                >
                  सब समेटें (Collapse All)
                </button>
              </div>
            </div>

            {/* Tree Root Container */}
            <div className="p-3 sm:p-5 rounded-2xl bg-[#090d18] border border-slate-800/80 space-y-4 overflow-x-auto">
              {/* Root User Node (You) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-950/40 to-slate-950 border-2 border-amber-400/60 shadow-lg space-y-2 max-w-2xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-white shadow">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm sm:text-base">{currentUser.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                          👑 YOU (ROOT)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block select-all">ID: {currentUser.id}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">रेफरल कोड</span>
                    <span className="text-sm font-mono font-black text-amber-400 select-all">{currentUser.referralCode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-400/20 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Direct (L1)</span>
                    <strong className="text-amber-300 font-black text-sm">{downlineTree?.children.length || 0} Users</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Team</span>
                    <strong className="text-purple-300 font-black text-sm">{referralMembers.length} Members</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Earned Comm</span>
                    <strong className="text-emerald-400 font-black text-sm">₹{totalEarnings.toFixed(2)}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Max Depth</span>
                    <strong className="text-cyan-300 font-black text-sm">8 Levels</strong>
                  </div>
                </div>
              </div>

              {/* Children Branches */}
              {downlineTree?.children && downlineTree.children.length > 0 ? (
                <div className="pl-3 sm:pl-6 border-l-2 border-purple-500/40 space-y-3 pt-2">
                  {downlineTree.children.map((childNode) => (
                    <DownlineTreeNode
                      key={childNode.user.id}
                      node={childNode}
                      collapsedNodes={collapsedNodes}
                      onToggle={toggleCollapse}
                      searchQuery={treeSearch}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
                  <Users className="w-10 h-10 text-amber-400/60 mx-auto" />
                  <div>
                    <h4 className="font-bold text-white text-sm">अभी आपकी डाउनलाइन में कोई सदस्य नहीं है</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      अपना रेफरल लिंक <strong className="text-amber-400 font-mono">{referralLink}</strong> दोस्तों के साथ शेयर करें। जब वे जुड़ेंगे, तो वे यहाँ ट्री में सीधे दिखेंगे!
                    </p>
                  </div>
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>व्हाट्सएप पर शेयर करें</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 📋 TRADITIONAL TABLE VIEW */
          <div className="space-y-4">
            {/* Level Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
              <button
                onClick={() => setSelectedLevelFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold ${
                  selectedLevelFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                All Levels
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    selectedLevelFilter === lvl ? 'bg-purple-600 text-white' : 'text-slate-400'
                  }`}
                >
                  L{lvl}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Member</th>
                    <th className="p-3">Level</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3">Tickets Bought</th>
                    <th className="p-3 text-right">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Users className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-200">
                          {selectedLevelFilter === 'all'
                            ? 'अभी तक कोई रेफरल सदस्य नहीं जुड़े हैं।'
                            : `लेवल ${selectedLevelFilter} में अभी कोई सदस्य नहीं है।`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          अपना रेफरल कोड <strong className="text-amber-400 font-mono">{currentUser.referralCode}</strong> दोस्तों और व्हाट्सएप्प ग्रुप्स में शेयर करें। जैसे ही कोई नया यूजर रजिस्टर करेगा, उनका नाम व आईडी तुरंत यहाँ दिखेगा!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 flex items-center gap-2.5">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-7 h-7 rounded-full object-cover border border-purple-500/40"
                          />
                          <div>
                            <span className="font-bold text-slate-100 block">{member.name}</span>
                            <span className="text-[10px] text-slate-500">{member.phone || member.email || member.id}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            member.level === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-purple-900/40 text-purple-300'
                          }`}>
                            Level {member.level}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{member.joinedDate}</td>
                        <td className="p-3 font-semibold text-slate-200">{member.ticketsBought} tickets</td>
                        <td className="p-3 text-right font-black text-amber-400">
                          +₹{member.commissionEarned.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Commission Ledger History */}
      <section className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100">
          Recent Commission Transactions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Txn ID</th>
                <th className="p-3">Source Member</th>
                <th className="p-3">Level / Rate</th>
                <th className="p-3">Base Ticket Cost</th>
                <th className="p-3 text-right">Commission Credited</th>
                <th className="p-3">Date &amp; Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {commissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 text-amber-300">{comm.transactionId}</td>
                  <td className="p-3 font-sans font-semibold text-slate-100">{comm.sourceUserName}</td>
                  <td className="p-3">Level {comm.level} ({comm.percentage}%)</td>
                  <td className="p-3 text-slate-400">₹{comm.baseAmount}</td>
                  <td className="p-3 text-right font-black text-amber-400">
                    +₹{comm.commissionAmount.toFixed(2)}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px] font-sans">{comm.timestamp}</td>
                  <td className="p-3 font-sans">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Approved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

/* 🌲 Downline Tree Node Component */
interface DownlineTreeNodeProps {
  node: TreeNode;
  collapsedNodes: Record<string, boolean>;
  onToggle: (id: string) => void;
  searchQuery?: string;
}

const DownlineTreeNode: React.FC<DownlineTreeNodeProps> = ({
  node,
  collapsedNodes,
  onToggle,
  searchQuery = '',
}) => {
  const isCollapsed = Boolean(collapsedNodes[node.user.id]);
  const hasChildren = node.children && node.children.length > 0;

  const isMatch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    const qDigits = searchQuery.replace(/\D/g, '');
    return (
      node.user.name.toLowerCase().includes(q) ||
      node.user.id.toLowerCase().includes(q) ||
      (node.user.referralCode && node.user.referralCode.toLowerCase().includes(q)) ||
      (node.user.phone && (node.user.phone.includes(q) || (qDigits && node.user.phone.replace(/\D/g, '').includes(qDigits))))
    );
  }, [node.user, searchQuery]);

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
      {/* Visual node row */}
      <div
        className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ${
          isMatch
            ? 'ring-2 ring-amber-400 bg-amber-950/40 border-amber-400 shadow-lg'
            : `${levelStyle.bg} ${levelStyle.border} hover:bg-slate-900/80`
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Avatar / Initial */}
          <div className="relative shrink-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${levelStyle.bg} ${levelStyle.text} font-black text-xs sm:text-sm flex items-center justify-center border ${levelStyle.border} shadow`}>
              {node.user.name.charAt(0).toUpperCase()}
            </div>
            <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full font-black text-[8px] bg-slate-950 ${levelStyle.text} border ${levelStyle.border}`}>
              L{node.level}
            </span>
          </div>

          {/* User Name & Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-white text-xs sm:text-sm truncate">{node.user.name}</span>
              <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${levelStyle.bg} ${levelStyle.text} border ${levelStyle.border}`}>
                Level {node.level} {node.level === 1 ? 'Direct' : 'Team'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap mt-0.5">
              <span className="font-mono text-purple-300 select-all">ID: {node.user.id}</span>
              {node.user.phone && <span className="font-mono text-slate-300">📱 {node.user.phone}</span>}
              <span className="font-mono text-emerald-400 font-bold">Code: {node.user.referralCode || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right side stats & toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-bold block">Bought</span>
              <span className="text-xs font-bold text-slate-200">{node.ticketsBought} tickets</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-bold block">Earned</span>
              <span className="text-xs font-black text-amber-400">+₹{node.commissionEarned.toFixed(2)}</span>
            </div>
          </div>

          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(node.user.id)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              <span>{node.children.length} Directs</span>
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-slate-950/60 text-slate-500 text-[10px] font-bold border border-slate-800/80">
              0 Directs
            </span>
          )}
        </div>
      </div>

      {/* Children Nodes (Recursive branch) */}
      {hasChildren && !isCollapsed && (
        <div className="pl-3 sm:pl-6 border-l-2 border-purple-500/30 space-y-2 pt-1">
          {node.children.map((childNode) => (
            <DownlineTreeNode
              key={childNode.user.id}
              node={childNode}
              collapsedNodes={collapsedNodes}
              onToggle={onToggle}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};
