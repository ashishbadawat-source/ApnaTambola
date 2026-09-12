import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Radio,
  Ticket,
  Trophy,
  Award,
  Share2,
  Wallet,
  ArrowUpRight,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  Palette,
  Sparkles,
  Mail,
  TrendingUp,
  Gift,
  Copy,
  Check,
  X,
  Building2,
  Database,
  Flame,
  Zap,
} from 'lucide-react';
import {
  AdminStats,
  TambolaGame,
  User,
  GameWinner,
  WithdrawalRequest,
  ReferralCommission,
  TambolaTicket,
  TicketColorThemeId,
  WalletTransaction,
  DepositRequest,
  ActivityLog,
  AdminNotification,
  LoginHistoryEntry,
  SiteSettings,
  OfferPopup,
  Franchise,
  FranchiseTransferRecord,
} from '../types';

import { INITIAL_SITE_SETTINGS } from '../data/mockData';

import { ModuleDashboard } from './admin/ModuleDashboard';
import { ModuleUsers } from './admin/ModuleUsers';
import { ModuleGames } from './admin/ModuleGames';
import { ModuleLiveControl } from './admin/ModuleLiveControl';
import { ModuleTickets } from './admin/ModuleTickets';
import { ModulePrizes } from './admin/ModulePrizes';
import { ModuleReferrals } from './admin/ModuleReferrals';
import { ModuleWallets } from './admin/ModuleWallets';
import { ModuleWithdrawals } from './admin/ModuleWithdrawals';
import { ModuleReports } from './admin/ModuleReports';
import { ModuleNotifications } from './admin/ModuleNotifications';
import { ModuleSettings } from './admin/ModuleSettings';
import { ModuleEmailSettings } from './admin/ModuleEmailSettings';
import { ModuleReferralAnalytics } from './admin/ModuleReferralAnalytics';
import { ModuleOfferPopups } from './admin/ModuleOfferPopups';
import { ModuleFranchise } from './admin/ModuleFranchise';
import { ModuleWinners } from './admin/ModuleWinners';
import { FirebaseDiagnosticsModal } from '../components/FirebaseDiagnosticsModal';

interface AdminDashboardViewProps {
  stats: AdminStats;
  games: TambolaGame[];
  users: User[];
  winners?: GameWinner[];
  withdrawals: WithdrawalRequest[];
  deposits?: DepositRequest[];
  commissions: ReferralCommission[];
  tickets: TambolaTicket[];
  transactions?: WalletTransaction[];
  activityLogs?: ActivityLog[];
  notifications?: AdminNotification[];
  loginHistory?: LoginHistoryEntry[];
  siteSettings?: SiteSettings;
  offers?: OfferPopup[];
  onSaveOffer?: (offer: OfferPopup) => Promise<boolean> | void;
  onDeleteOffer?: (offerId: string) => Promise<boolean> | void;
  onToggleOfferStatus?: (offerId: string) => Promise<boolean> | void;
  activeModule?: string;
  onModuleChange?: (module: string) => void;
  selectedGameId?: string;
  onSelectGame?: (gameId: string) => void;
  onStartGame?: (gameId: string) => Promise<void>;
  onStopGame?: (gameId: string, markCompleted?: boolean) => Promise<void>;
  onCallNext: (number?: number) => void;
  onToggleAuto: () => void;
  onResetGame: () => void;
  onCreateGame: (gameData: Partial<TambolaGame>) => Promise<boolean>;
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean>;
  onDeleteGame?: (gameId: string) => Promise<boolean>;
  onApproveWithdrawal: (id: string) => Promise<boolean>;
  onRejectWithdrawal: (id: string) => Promise<boolean>;
  onApproveDeposit?: (depositId: string, remarks?: string) => Promise<boolean>;
  onRejectDeposit?: (depositId: string, reason?: string) => Promise<boolean>;
  onDeleteDeposit?: (depositId: string) => Promise<boolean>;
  onUpdateWalletBalance: (
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason?: string,
    walletSource?: 'any' | 'deposit' | 'winning' | 'referral'
  ) => Promise<boolean>;
  onOpenAdjustModal?: (user?: User | null, type?: 'credit' | 'debit') => void;
  onToggleKYC: (userId: string) => Promise<boolean>;
  onToggleBlockUser?: (userId: string) => Promise<boolean>;
  onResetPassword?: (userId: string) => Promise<boolean>;
  onAdminGenerateTickets?: (gameId: string, count: number, colorTheme?: TicketColorThemeId) => Promise<boolean>;
  onAdminToggleTicketStatus?: (ticketId: string, isActive: boolean) => Promise<boolean>;
  onAdminBatchToggleTickets?: (ticketIds: string[], isActive: boolean) => Promise<boolean>;
  onAdminUpdateTicketGame?: (ticketId: string, targetGameId: string) => Promise<boolean>;
  onAdminBatchUpdateTicketGame?: (ticketIds: string[], targetGameId: string) => Promise<{ success: boolean; count: number }>;
  onAdminTransferAllTicketsToGame?: (targetGameId: string, sourceGameId?: string) => Promise<{ success: boolean; count: number }>;
  onClearCompletedTickets?: (gameId?: string) => Promise<{ success: boolean; clearedCount: number }>;
  onDeleteTicket?: (ticketId: string, refundUser?: boolean) => Promise<boolean>;
  onBatchDeleteTickets?: (ticketIds: string[], refundUser?: boolean) => Promise<boolean>;
  onApproveCommission?: (commissionId: string) => void;
  onReverseCommission?: (commissionId: string) => void;
  onSendNotification?: (notification: Omit<AdminNotification, 'id' | 'sentAt'>) => Promise<boolean>;
  onDeleteNotification?: (id: string) => void;
  onUpdateSettings?: (settings: Partial<SiteSettings>) => Promise<boolean>;
  onRegisterUser?: (newUser: User) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => Promise<boolean> | void;
  onBatchDeleteUsers?: (userIds: string[]) => Promise<boolean> | void;
  onSetTicketName?: (gameId: string, ticketName: string) => Promise<boolean>;
  onRunClawbackAudit?: () => Promise<{
    auditedCount: number;
    clawbacks: any[];
    totalClawbackAmount: number;
    deductedUsersCount: number;
  }>;
  onForceRefresh?: () => void;
  isSyncing?: boolean;
  onViewUserWallet?: (user: User) => void;
  latestRegisteredUser?: User | null;
  onClearLatestUser?: () => void;
  franchises?: Franchise[];
  franchiseTransfers?: FranchiseTransferRecord[];
  onDeleteWinner?: (winnerId: string) => Promise<boolean> | void;
  onBatchDeleteWinners?: (winnerIds: string[]) => Promise<boolean> | void;
  onClearAllWinners?: () => Promise<boolean> | void;
  onApproveFranchise?: (
    franchiseId: string,
    allocatedFund: number,
    commissionRate: number,
    assignedFranchiseId?: string,
    remarks?: string
  ) => Promise<boolean>;
  onRejectFranchise?: (franchiseId: string, remarks: string) => Promise<boolean>;
  onUpdateFranchiseFund?: (franchiseId: string, amountChange: number, note: string) => Promise<boolean>;
  onUpdateFranchiseStatus?: (franchiseId: string, status: 'approved' | 'suspended' | 'rejected') => Promise<boolean>;
  onCreateDirectFranchise?: (data: {
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
  onToggleAutoTicket?: (enabled: boolean, gameId?: string) => Promise<boolean> | void;
  onRunAutoTicketDispatch?: (gameId?: string) => Promise<{ success: boolean; dispatchedCount: number; totalDeducted: number; message: string; details?: any[] }>;
  onOpenFirebaseDiagnostics?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  stats,
  games,
  users,
  winners = [],
  withdrawals,
  deposits = [],
  commissions,
  tickets,
  transactions = [],
  activityLogs = [],
  notifications = [],
  loginHistory = [],
  siteSettings = INITIAL_SITE_SETTINGS,
  offers = [],
  latestRegisteredUser,
  onClearLatestUser,
  onOpenFirebaseDiagnostics,
  onSaveOffer,
  onDeleteOffer,
  onToggleOfferStatus,
  onDeleteWinner,
  onBatchDeleteWinners,
  onClearAllWinners,
  activeModule,
  onModuleChange,
  selectedGameId,
  onSelectGame,
  onStartGame,
  onStopGame,
  onCallNext,
  onToggleAuto,
  onResetGame,
  onCreateGame,
  onUpdateGame,
  onDeleteGame,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onApproveDeposit,
  onRejectDeposit,
  onDeleteDeposit,
  onUpdateWalletBalance,
  onOpenAdjustModal,
  onToggleKYC,
  onToggleBlockUser,
  onResetPassword,
  onAdminGenerateTickets,
  onAdminToggleTicketStatus,
  onAdminBatchToggleTickets,
  onAdminUpdateTicketGame,
  onAdminBatchUpdateTicketGame,
  onAdminTransferAllTicketsToGame,
  onClearCompletedTickets,
  onDeleteTicket,
  onBatchDeleteTickets,
  onApproveCommission,
  onReverseCommission,
  onSendNotification,
  onDeleteNotification,
  onUpdateSettings,
  onRegisterUser,
  onUpdateUser,
  onDeleteUser,
  onBatchDeleteUsers,
  onForceRefresh,
  isSyncing,
  onViewUserWallet,
  onToggleAutoTicket,
  onRunAutoTicketDispatch,
  onSetTicketName,
  onRunClawbackAudit,
  franchises = [],
  franchiseTransfers = [],
  onApproveFranchise = async () => true,
  onRejectFranchise = async () => true,
  onUpdateFranchiseFund = async () => true,
  onUpdateFranchiseStatus = async () => true,
  onCreateDirectFranchise = async () => true,
}) => {
  const [internalTab, setInternalTab] = useState<string>('dashboard');
  const [copiedLatestId, setCopiedLatestId] = useState<boolean>(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState<boolean>(false);
  const activeTab = activeModule || internalTab;

  const handleCopyLatestUserId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedLatestId(true);
    setTimeout(() => setCopiedLatestId(false), 2000);
  };

  const handleSetActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (onModuleChange) {
      onModuleChange(tab);
    }
  };

  const safeGames = Array.isArray(games) ? games : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
  const safeDeposits = Array.isArray(deposits) ? deposits : [];
  const safeOffers = Array.isArray(offers) ? offers : [];
  const safeWinners = Array.isArray(winners) ? winners : [];

  const pendingWithdrawalsCount = safeWithdrawals.filter((w) => w && w.status === 'pending').length;
  const pendingDepositsCount = safeDeposits.filter((d) => d && d.status === 'pending').length;
  const liveGamesCount = safeGames.filter((g) => g && g.status === 'live').length;
  const activeOffersCount = safeOffers.filter((o) => o && o.isActive).length;

  const NAV_ITEMS = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'users', label: '2. User Management', icon: Users, badge: `${safeUsers.length}` },
    { id: 'games', label: '3. Game Management', icon: Gamepad2, badge: liveGamesCount > 0 ? `${liveGamesCount} LIVE` : null, badgeColor: 'bg-red-500 text-white' },
    { id: 'live_control', label: '4. Live Game Control', icon: Radio, badge: 'RNG', badgeColor: 'bg-amber-400 text-slate-950' },
    { id: 'tickets', label: '5. Ticket Management', icon: Ticket, badge: `${safeTickets.length}` },
    { id: 'winners', label: '6. Winners & Ticket Ledger', icon: Trophy, badge: `${safeWinners.length} WIN`, badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black' },
    { id: 'prizes', label: '7. Prize Management', icon: Award, badge: null },
    { id: 'referrals', label: '8. 5-Level Referral', icon: Share2, badge: 'MLM' },
    { id: 'referral_growth', label: '9. Referral Growth Chart', icon: TrendingUp, badge: '30D LINE', badgeColor: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black' },
    { id: 'wallets', label: '10. Wallets & UTRs', icon: Wallet, badge: pendingDepositsCount > 0 ? `${pendingDepositsCount} UTR` : null, badgeColor: 'bg-amber-400 text-slate-950 font-black' },
    { id: 'withdrawals', label: '11. Withdrawals', icon: ArrowUpRight, badge: pendingWithdrawalsCount > 0 ? `${pendingWithdrawalsCount}` : null, badgeColor: 'bg-amber-400 text-slate-950' },
    { id: 'offers', label: '12. Offer Popups', icon: Gift, badge: activeOffersCount > 0 ? `${activeOffersCount} ON` : 'NEW', badgeColor: 'bg-pink-500 text-white font-black' },
    { id: 'reports', label: '13. Reports & Analytics', icon: BarChart3, badge: null },
    { id: 'notifications', label: '14. Notifications', icon: Bell, badge: null },
    { id: 'settings', label: '15. Site & Security', icon: Settings, badge: null },
    { id: 'email_settings', label: '16. Brevo Email Engine', icon: Mail, badge: 'FREE 300/d', badgeColor: 'bg-emerald-400 text-slate-950 font-black' },
    { id: 'franchise', label: '17. Fund Franchise', icon: Building2, badge: 'ID & FUND', badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black' },
    { id: 'firebase_diagnostics', label: '18. Firebase DB & Sync', icon: Flame, badge: 'REALTIME', badgeColor: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black animate-pulse' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Super Admin Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1c1236] via-[#101838] to-[#250d24] p-5 sm:p-6 border-2 border-amber-400/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
              SUPER ADMIN MASTER GOVERNANCE
            </span>
            <span className="text-xs text-amber-300 font-semibold hidden sm:inline">
              14 Comprehensive Modules Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>Tambola Master Admin Panel</span>
            <Sparkles className="w-6 h-6 text-amber-400" />
          </h1>
        </div>

        {/* Global Quick Action Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenFirebaseDiagnostics ? onOpenFirebaseDiagnostics() : setIsDiagnosticsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            title="Firebase Firestore Direct Live Sync & Realtime Testing Tool"
          >
            <Flame className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>🔥 Firebase DB & Sync</span>
          </button>
          <button
            onClick={() => handleSetActiveTab('games')}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>+ Create Tournament</span>
          </button>
          <button
            onClick={() => handleSetActiveTab('live_control')}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Live Caller Room</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Registration Alert Banner */}
      {latestRegisteredUser && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0a2319] via-[#09182a] to-[#24121a] border-2 border-emerald-400 text-white shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  🎉 नया यूजर ID तुरंत रजिस्टर हुआ (Live Instant Sync)!
                </span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap mt-0.5">
                <span>यूजर ID:</span>
                <span className="font-mono bg-slate-950 px-2.5 py-0.5 rounded-lg text-amber-300 border border-amber-400/40 select-all font-black text-xs">
                  {latestRegisteredUser.id}
                </span>
                <span>• नाम: <strong className="text-white">{latestRegisteredUser.name}</strong></span>
                <span>• मोबाइल: <strong className="text-slate-300">{latestRegisteredUser.phone}</strong></span>
                <span>• वॉलेट: <strong className="text-emerald-400 font-black">₹{latestRegisteredUser.walletBalance || 0}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleCopyLatestUserId(latestRegisteredUser.id)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-400/40 cursor-pointer transition-colors"
            >
              {copiedLatestId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">कॉपी हो गया!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>ID कॉपी करें</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSetActiveTab('users')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Users className="w-3.5 h-3.5" />
              <span>यूजर लिस्ट में देखें</span>
            </button>

            {onClearLatestUser && (
              <button
                type="button"
                onClick={onClearLatestUser}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                title="हटाएं (Dismiss)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Container: Sticky Horizontal Module Navigator */}
      <div className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSetActiveTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 scale-102'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      item.badgeColor || (isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Module Views Rendering */}
      <div>
        {activeTab === 'dashboard' && (
          <ModuleDashboard
            stats={stats}
            games={games}
            users={users}
            tickets={tickets}
            withdrawals={withdrawals}
            commissions={commissions}
            transactions={transactions}
            activityLogs={activityLogs}
            siteSettings={siteSettings}
            onUpdateGame={onUpdateGame}
            onUpdateSettings={onUpdateSettings}
            onCallNext={onCallNext}
            onNavigateTab={(tab) => handleSetActiveTab(tab)}
          />
        )}

        {activeTab === 'users' && (
          <ModuleUsers
            users={users}
            tickets={tickets}
            onToggleKYC={onToggleKYC}
            onToggleBlockUser={onToggleBlockUser || (async () => true)}
            onResetPassword={onResetPassword || (async () => true)}
            onUpdateWalletBalance={onUpdateWalletBalance}
            onRegisterUser={onRegisterUser}
            onDeleteUser={onDeleteUser}
            onBatchDeleteUsers={onBatchDeleteUsers}
            onForceRefresh={onForceRefresh}
            isSyncing={isSyncing}
            onViewUserWallet={onViewUserWallet}
            onOpenAdjustModal={onOpenAdjustModal}
          />
        )}

        {activeTab === 'games' && (
          <ModuleGames
            games={games}
            onCreateGame={onCreateGame}
            onUpdateGame={onUpdateGame}
            onDeleteGame={onDeleteGame}
            onNavigateTab={(tab) => handleSetActiveTab(tab)}
            onCallNext={onCallNext}
            onToggleAuto={onToggleAuto}
            onResetGame={onResetGame}
          />
        )}

        {activeTab === 'live_control' && (
          <ModuleLiveControl
            games={games}
            tickets={tickets}
            selectedGameId={selectedGameId}
            onSelectGame={onSelectGame}
            onStartGame={onStartGame}
            onStopGame={onStopGame}
            onCallNext={onCallNext}
            onToggleAuto={onToggleAuto}
            onResetGame={onResetGame}
            onUpdateGame={onUpdateGame}
          />
        )}

        {activeTab === 'tickets' && (
          <ModuleTickets
            tickets={tickets}
            games={games}
            users={users}
            siteSettings={siteSettings}
            onToggleAutoTicket={onToggleAutoTicket}
            onRunAutoTicketDispatch={onRunAutoTicketDispatch}
            onAdminGenerateTickets={onAdminGenerateTickets}
            onAdminToggleTicketStatus={onAdminToggleTicketStatus}
            onAdminBatchToggleTickets={onAdminBatchToggleTickets}
            onAdminUpdateTicketGame={onAdminUpdateTicketGame}
            onAdminBatchUpdateTicketGame={onAdminBatchUpdateTicketGame}
            onAdminTransferAllTicketsToGame={onAdminTransferAllTicketsToGame}
            onClearCompletedTickets={onClearCompletedTickets}
            onDeleteTicket={onDeleteTicket}
            onBatchDeleteTickets={onBatchDeleteTickets}
            onStartGame={onStartGame}
            onStopGame={onStopGame}
            onUpdateGame={onUpdateGame}
            onUpdateSettings={onUpdateSettings}
            onSetTicketName={onSetTicketName}
            onRunClawbackAudit={onRunClawbackAudit}
            onForceRefresh={onForceRefresh}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'winners' && (
          <ModuleWinners
            winners={winners}
            tickets={tickets}
            games={games}
            users={users}
            onDeleteWinner={onDeleteWinner}
            onBatchDeleteWinners={onBatchDeleteWinners}
            onClearAllWinners={onClearAllWinners}
          />
        )}

        {activeTab === 'prizes' && (
          <ModulePrizes
            games={games}
            onUpdateGame={onUpdateGame}
          />
        )}

        {activeTab === 'referrals' && (
          <ModuleReferrals
            users={users}
            commissions={commissions}
            onApproveCommission={onApproveCommission}
            onReverseCommission={onReverseCommission}
            onUpdateUser={onUpdateUser || onRegisterUser}
            onForceRefresh={onForceRefresh}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'referral_growth' && (
          <ModuleReferralAnalytics
            users={users}
            commissions={commissions}
            onNavigateToReferrals={() => handleSetActiveTab('referrals')}
            title="30-Day Referral Sign-ups Growth Analysis"
            description="Daily line chart aggregation based on createdAt timestamp to track campaign effectiveness and growth velocity."
          />
        )}

        {activeTab === 'wallets' && (
          <ModuleWallets
            users={users}
            transactions={transactions}
            deposits={deposits}
            onUpdateWalletBalance={onUpdateWalletBalance}
            onApproveDeposit={onApproveDeposit}
            onRejectDeposit={onRejectDeposit}
            onDeleteDeposit={onDeleteDeposit}
            onForceRefresh={onForceRefresh}
            isSyncing={isSyncing}
            onViewUserWallet={onViewUserWallet}
            onOpenAdjustModal={onOpenAdjustModal}
          />
        )}

        {activeTab === 'withdrawals' && (
          <ModuleWithdrawals
            withdrawals={withdrawals}
            onApproveWithdrawal={onApproveWithdrawal}
            onRejectWithdrawal={onRejectWithdrawal}
            onOpenAdjustModal={onOpenAdjustModal}
          />
        )}

        {activeTab === 'offers' && (
          <ModuleOfferPopups
            offers={offers}
            onSaveOffer={onSaveOffer || (() => {})}
            onDeleteOffer={onDeleteOffer || (() => {})}
            onToggleOfferStatus={onToggleOfferStatus || (() => {})}
          />
        )}

        {activeTab === 'reports' && (
          <ModuleReports
            users={users}
            games={games}
            tickets={tickets}
            transactions={transactions}
            commissions={commissions}
            withdrawals={withdrawals}
          />
        )}

        {activeTab === 'notifications' && (
          <ModuleNotifications
            notifications={notifications}
            users={users}
            onSendNotification={onSendNotification || (async () => true)}
            onDeleteNotification={onDeleteNotification}
          />
        )}

        {activeTab === 'settings' && (
          <ModuleSettings
            settings={siteSettings}
            activityLogs={activityLogs}
            loginHistory={loginHistory}
            games={games}
            onUpdateGame={onUpdateGame}
            onUpdateSettings={onUpdateSettings || (async () => true)}
          />
        )}

        {activeTab === 'email_settings' && (
          <ModuleEmailSettings
            adminEmail={users.find((u) => u.role === 'admin')?.email || 'ashishbadawat@gmail.com'}
          />
        )}

        {activeTab === 'franchise' && (
          <ModuleFranchise
            franchises={franchises}
            franchiseTransfers={franchiseTransfers}
            users={users}
            onApproveFranchise={onApproveFranchise}
            onRejectFranchise={onRejectFranchise}
            onUpdateFranchiseFund={onUpdateFranchiseFund}
            onUpdateFranchiseStatus={onUpdateFranchiseStatus}
            onCreateDirectFranchise={onCreateDirectFranchise}
          />
        )}

        {activeTab === 'firebase_diagnostics' && (
          <div className="rounded-3xl bg-slate-900 border border-amber-400/40 p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400">
              <Flame className="w-8 h-8 animate-bounce text-amber-400" />
            </div>
            <h2 className="text-xl font-black text-white">Firebase Firestore Database Live Diagnostics</h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Real-time synchronization engine is connected to your Firestore cluster. Test live updates, push instant ball calls, modify user wallets, and inspect Firestore collections.
            </p>
            <button
              onClick={() => onOpenFirebaseDiagnostics ? onOpenFirebaseDiagnostics() : setIsDiagnosticsModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm inline-flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <Zap className="w-5 h-5 text-slate-950" />
              <span>Launch Full Firebase Diagnostics Lab & Live Push</span>
            </button>
          </div>
        )}
      </div>

      {/* Embedded / Fallback Diagnostics Modal if opened directly in AdminDashboardView */}
      <FirebaseDiagnosticsModal
        isOpen={isDiagnosticsModalOpen}
        onClose={() => setIsDiagnosticsModalOpen(false)}
        games={games}
        users={users}
        tickets={tickets}
        winners={winners}
        deposits={deposits}
        withdrawals={withdrawals}
        transactions={transactions}
        siteSettings={siteSettings}
        onUpdateGame={onUpdateGame}
        onUpdateWalletBalance={onUpdateWalletBalance}
        onUpdateSettings={onUpdateSettings}
        onForceRefresh={onForceRefresh}
      />
    </div>
  );
};