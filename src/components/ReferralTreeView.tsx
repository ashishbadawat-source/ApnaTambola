import React, { useState, useMemo } from 'react';
import {
  Users,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Layers,
  Phone,
  Calendar,
  Ticket,
  DollarSign,
  Share2,
  Check,
  Copy,
  FolderTree,
  Filter,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react';
import { User, ReferralMember, ReferralCommission } from '../types';
import { isDirectChildOf } from '../utils/referralMatcher';

export interface TreeNodeData {
  user: User;
  level: number; // 0 for root (currentUser), 1..5 for downline
  ticketsBought: number;
  commissionEarned: number;
  children: TreeNodeData[];
}

interface ReferralTreeViewProps {
  currentUser: User;
  allUsers?: User[];
  referralMembers: ReferralMember[];
  commissions: ReferralCommission[];
  onOpenDeposit?: () => void;
  onSimulateTestMember?: () => void;
  onShareWhatsApp?: () => void;
}

const LEVEL_CONFIG: Record<
  number,
  {
    name: string;
    rate: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    gradient: string;
    cardBg: string;
    glow: string;
    lineColor: string;
  }
> = {
  1: {
    name: 'Level 1 (Direct)',
    rate: '2.0%',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-slate-950 font-black',
    border: 'border-amber-400',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-slate-950',
    cardBg: 'bg-amber-950/30',
    glow: 'shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/60',
    lineColor: 'border-amber-400/80',
  },
  2: {
    name: 'Level 2 (Tier 2)',
    rate: '1.0%',
    badgeBg: 'bg-purple-500',
    badgeText: 'text-white font-black',
    border: 'border-purple-500/60',
    gradient: 'from-purple-900/30 via-indigo-950/20 to-slate-950',
    cardBg: 'bg-purple-950/25',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]',
    lineColor: 'border-purple-400/70',
  },
  3: {
    name: 'Level 3 (Tier 3)',
    rate: '0.5%',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white font-black',
    border: 'border-blue-500/60',
    gradient: 'from-blue-900/30 via-slate-900 to-slate-950',
    cardBg: 'bg-blue-950/20',
    glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    lineColor: 'border-blue-400/70',
  },
  4: {
    name: 'Level 4 (Tier 4)',
    rate: '0.4%',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-slate-950 font-black',
    border: 'border-emerald-500/60',
    gradient: 'from-emerald-900/30 via-slate-900 to-slate-950',
    cardBg: 'bg-emerald-950/20',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    lineColor: 'border-emerald-400/70',
  },
  5: {
    name: 'Level 5 (Tier 5)',
    rate: '0.3%',
    badgeBg: 'bg-cyan-500',
    badgeText: 'text-slate-950 font-black',
    border: 'border-cyan-500/60',
    gradient: 'from-cyan-900/30 via-slate-900 to-slate-950',
    cardBg: 'bg-cyan-950/20',
    glow: 'shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    lineColor: 'border-cyan-400/70',
  },
};

export const ReferralTreeView: React.FC<ReferralTreeViewProps> = ({
  currentUser,
  allUsers = [],
  referralMembers = [],
  commissions = [],
  onSimulateTestMember,
  onShareWhatsApp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [maxDisplayLevel, setMaxDisplayLevel] = useState<number>(5);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Recursively build the 1-to-5 Level Hierarchy Tree for currentUser
  const downlineTree = useMemo(() => {
    if (!currentUser) return null;

    const buildSubtree = (parentNode: User, currentDepth: number, visited: Set<string>): TreeNodeData[] => {
      // Limit tree depth strictly to Level 5
      if (currentDepth > 5) return [];

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

    const rootTreeNode: TreeNodeData = {
      user: currentUser,
      level: 0,
      ticketsBought: 0,
      commissionEarned: commissions
        .filter((c) => c.status === 'approved')
        .reduce((sum, c) => sum + c.commissionAmount, 0),
      children: rootChildren,
    };

    return rootTreeNode;
  }, [currentUser, allUsers, referralMembers, commissions]);

  // 2. Count statistics for Level 1 through Level 5
  const levelMetrics = useMemo(() => {
    const counts: Record<number, { count: number; commission: number; tickets: number }> = {
      1: { count: 0, commission: 0, tickets: 0 },
      2: { count: 0, commission: 0, tickets: 0 },
      3: { count: 0, commission: 0, tickets: 0 },
      4: { count: 0, commission: 0, tickets: 0 },
      5: { count: 0, commission: 0, tickets: 0 },
    };

    const traverse = (node: TreeNodeData) => {
      if (node.level >= 1 && node.level <= 5) {
        counts[node.level].count += 1;
        counts[node.level].commission += node.commissionEarned;
        counts[node.level].tickets += node.ticketsBought;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    if (downlineTree?.children) {
      downlineTree.children.forEach(traverse);
    }

    const totalL1ToL5Members = Object.values(counts).reduce((sum, item) => sum + item.count, 0);
    const totalL1ToL5Commission = Object.values(counts).reduce((sum, item) => sum + item.commission, 0);

    return { counts, totalL1ToL5Members, totalL1ToL5Commission };
  }, [downlineTree]);

  // 3. Node collapse / expand handlers
  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleExpandAll = () => {
    setCollapsedNodes({});
  };

  const handleCollapseAll = () => {
    if (!downlineTree) return;
    const allIds: Record<string, boolean> = {};
    const recordIds = (node: TreeNodeData) => {
      if (node.children && node.children.length > 0) {
        allIds[node.user.id] = true;
        node.children.forEach(recordIds);
      }
    };
    downlineTree.children.forEach(recordIds);
    setCollapsedNodes(allIds);
  };

  const handleExpandToLevel = (targetLevel: number) => {
    if (!downlineTree) return;
    const newCollapsed: Record<string, boolean> = {};
    const traverse = (node: TreeNodeData) => {
      if (node.level >= targetLevel) {
        newCollapsed[node.user.id] = true;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    downlineTree.children.forEach(traverse);
    setCollapsedNodes(newCollapsed);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Top Header & Hierarchy Metrics Banner (Level 1 down to Level 5) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#170929] via-[#0d162f] to-[#071f24] border-2 border-amber-400/80 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-400/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/30 text-xl shrink-0">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  5-Level Downline Hierarchy Tree
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                  Level 1 ➔ Level 5 Live
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Hierarchically explore your Level 1 to Level 5 downline network with collapsible nodes and real-time commission stats.
              </p>
            </div>
          </div>

          {/* Direct WhatsApp Share or Invite */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {onSimulateTestMember && (
              <button
                type="button"
                onClick={onSimulateTestMember}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Add Test Member</span>
              </button>
            )}
            {onShareWhatsApp && (
              <button
                type="button"
                onClick={onShareWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Code</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-Level Summary Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const config = LEVEL_CONFIG[lvl];
            const data = levelMetrics.counts[lvl];
            const isActiveFilter = maxDisplayLevel >= lvl;

            return (
              <div
                key={lvl}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isActiveFilter ? `${config.cardBg} ${config.border} shadow-lg` : 'bg-slate-950/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${config.badgeBg} ${config.badgeText}`}>
                    L{lvl} • {config.rate}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{config.name.split(' ')[0]}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="text-lg font-black text-white font-mono">{data.count} <span className="text-[10px] text-slate-400 font-normal">users</span></div>
                  <div className="text-xs font-black text-amber-400 font-mono">+₹{data.commission.toFixed(1)}</div>
                </div>
                <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                  <span>Tickets:</span>
                  <span className="font-bold text-slate-300">{data.tickets}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🛠️ Tree Navigation & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl">
        {/* Search in Tree */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search downline by name, User ID, phone, or code..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Level Depth & Expand / Collapse Controls */}
        <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
          {/* Depth Limiter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-bold uppercase flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-400" /> Max Depth:
            </span>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setMaxDisplayLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg font-black text-xs transition-colors cursor-pointer ${
                  maxDisplayLevel === lvl
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                L{lvl}
              </button>
            ))}
          </div>

          {/* Expand / Collapse Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Expand all Level 1 to Level 5 branches"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Expand All</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Collapse all child nodes"
            >
              <Minimize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Collapse All</span>
            </button>
            <button
              type="button"
              onClick={() => handleExpandToLevel(2)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold hidden sm:flex items-center gap-1 cursor-pointer transition-colors"
              title="Show Level 1 Only"
            >
              <span>L1 Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌲 HIERARCHICAL TREE CANVAS */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#090e1a] border-2 border-slate-800 shadow-2xl space-y-4 overflow-x-auto min-h-[380px]">
        {/* 👑 Root Node: Current User */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-purple-950/40 to-slate-950 border-2 border-amber-400/80 shadow-xl space-y-3 max-w-3xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-lg flex items-center justify-center border-2 border-white shadow-lg">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] border border-white">
                  ROOT
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white text-base sm:text-lg">{currentUser.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-[10px] shadow">
                    👑 YOU (TREE APEX)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                  <span>ID: {currentUser.id}</span>
                  {currentUser.phone && <span>• 📱 {currentUser.phone}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              <div className="p-2 bg-slate-950/80 rounded-xl border border-amber-400/40">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Referral Code</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono font-black text-amber-400">{currentUser.referralCode}</span>
                  <button
                    onClick={() => handleCopy(currentUser.referralCode, 'root_ref')}
                    className="p-1 text-slate-400 hover:text-amber-400"
                    title="Copy Referral Code"
                  >
                    {copiedId === 'root_ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Apex Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-400/20 text-xs">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40">
              <span className="text-[10px] text-amber-300 font-bold block">Direct Level 1</span>
              <strong className="text-amber-300 font-black text-sm">{downlineTree?.children.length || 0} Members ⚡</strong>
            </div>
            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40">
              <span className="text-[10px] text-purple-300 font-bold block">L1-L5 Downline</span>
              <strong className="text-purple-300 font-black text-sm">{levelMetrics.totalL1ToL5Members} Total</strong>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <span className="text-[10px] text-emerald-300 font-bold block">Total Commission</span>
              <strong className="text-emerald-400 font-black text-sm">₹{levelMetrics.totalL1ToL5Commission.toFixed(2)}</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block">Hierarchy Depth</span>
              <strong className="text-cyan-300 font-black text-sm">5 Active Levels</strong>
            </div>
          </div>
        </div>

        {/* 🌿 Level 1 down to Level 5 Branches */}
        {downlineTree?.children && downlineTree.children.length > 0 ? (
          <div className="relative pl-3 sm:pl-6 border-l-2 border-amber-400/80 space-y-3 pt-2">
            {downlineTree.children.map((childNode) => (
              <VisualTreeNodeItem
                key={childNode.user.id}
                node={childNode}
                collapsedNodes={collapsedNodes}
                onToggle={toggleCollapse}
                searchQuery={searchQuery}
                maxDisplayLevel={maxDisplayLevel}
                onCopy={handleCopy}
                copiedId={copiedId}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-950/60 border-2 border-dashed border-slate-800 text-center space-y-4 my-4">
            <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
              <Users className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="font-black text-white text-base">No Downline Network Members Yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Share your referral code <strong className="text-amber-400 font-mono select-all">{currentUser.referralCode}</strong> with friends. When they register and buy tickets, their nodes and subsequent Level 2 to Level 5 invites will populate this interactive tree!
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              {onSimulateTestMember && (
                <button
                  type="button"
                  onClick={onSimulateTestMember}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg hover:from-amber-300 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ 1-Click Add Test Member</span>
                </button>
              )}
              {onShareWhatsApp && (
                <button
                  type="button"
                  onClick={onShareWhatsApp}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 🌿 Sub-Component: Individual Hierarchical Tree Node (Recursive Level 1 to 5)
interface VisualTreeNodeItemProps {
  node: TreeNodeData;
  collapsedNodes: Record<string, boolean>;
  onToggle: (id: string) => void;
  searchQuery: string;
  maxDisplayLevel: number;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}

const VisualTreeNodeItem: React.FC<VisualTreeNodeItemProps> = ({
  node,
  collapsedNodes,
  onToggle,
  searchQuery,
  maxDisplayLevel,
  onCopy,
  copiedId,
}) => {
  // If beyond max selected level, skip
  if (node.level > maxDisplayLevel) return null;

  const isCollapsed = Boolean(collapsedNodes[node.user.id]);
  const hasChildren = node.children && node.children.length > 0 && node.level < 5;
  const config = LEVEL_CONFIG[node.level] || LEVEL_CONFIG[5];

  // Match check for highlighting
  const isMatch = useMemo(() => {
    if (!searchQuery.trim() || !node.user) return false;
    const q = searchQuery.toLowerCase();
    const qDigits = searchQuery.replace(/\D/g, '');
    return (
      (node.user.name && node.user.name.toLowerCase().includes(q)) ||
      (node.user.id && node.user.id.toLowerCase().includes(q)) ||
      (node.user.referralCode && node.user.referralCode.toLowerCase().includes(q)) ||
      (node.user.phone && (node.user.phone.includes(q) || (qDigits && node.user.phone.replace(/\D/g, '').includes(qDigits))))
    );
  }, [node.user, searchQuery]);

  return (
    <div className="space-y-2 relative animate-in fade-in duration-200">
      {/* Node Horizontal Connector Guide */}
      <div className="absolute -left-3 sm:-left-6 top-6 w-3 sm:w-6 h-0.5 bg-slate-700 pointer-events-none" />

      {/* Main Node Card */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
          isMatch
            ? 'ring-4 ring-amber-400 bg-amber-950/70 border-amber-300 shadow-2xl scale-[1.01]'
            : `${config.cardBg} ${config.border} ${config.glow} hover:bg-slate-900/90`
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
      >
        {/* Flash Accent Light Bar on Level 1 */}
        {node.level === 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse pointer-events-none" />
        )}

        {/* Left Side: Avatar, Name, Level Badge, Details */}
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          {/* Avatar with Level Badge */}
          <div className="relative shrink-0">
            {node.user.avatar ? (
              <img
                src={node.user.avatar}
                alt={node.user.name}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 ${config.border}`}
              />
            ) : (
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${config.cardBg} text-white font-black text-sm flex items-center justify-center border-2 ${config.border}`}
              >
                {node.user.name ? node.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md text-[9px] font-black ${config.badgeBg} ${config.badgeText} shadow`}
            >
              L{node.level}
            </span>
          </div>

          {/* User Information */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-white text-xs sm:text-sm tracking-wide">
                {node.user.name}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${config.badgeBg} ${config.badgeText}`}>
                {config.name} • {config.rate}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/40">
                🟢 Active
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-300 flex-wrap mt-1">
              <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-purple-300 font-bold select-all">
                ID: {node.user.id}
              </span>
              {node.user.phone && (
                <span className="font-mono text-slate-300">
                  📱 {node.user.phone}
                </span>
              )}
              {node.user.referralCode && (
                <span className="font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">
                  Ref: {node.user.referralCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Performance Metrics & Collapsible Branch Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
          <div className="flex items-center gap-2 text-right">
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 font-bold block">Tickets</span>
              <span className="text-xs font-black text-slate-200">{node.ticketsBought}</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-400/40">
              <span className="text-[9px] uppercase text-amber-300/80 font-bold block">Commission</span>
              <span className="text-xs font-black text-amber-400 font-mono">+₹{node.commissionEarned.toFixed(2)}</span>
            </div>
          </div>

          {/* Collapsible toggle button */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(node.user.id)}
              className={`px-3 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isCollapsed
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{node.children.length} Downline</span>
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="px-2.5 py-1.5 rounded-xl bg-slate-950 text-slate-500 text-[10px] font-bold border border-slate-800">
              0 Direct Sub-nodes
            </span>
          )}
        </div>
      </div>

      {/* Recursive Children Subtree (Level 2 to Level 5) */}
      {hasChildren && !isCollapsed && (
        <div className={`pl-3 sm:pl-6 border-l-2 ${config.lineColor} space-y-2.5 pt-1.5`}>
          {node.children.map((childNode) => (
            <VisualTreeNodeItem
              key={childNode.user.id}
              node={childNode}
              collapsedNodes={collapsedNodes}
              onToggle={onToggle}
              searchQuery={searchQuery}
              maxDisplayLevel={maxDisplayLevel}
              onCopy={onCopy}
              copiedId={copiedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
