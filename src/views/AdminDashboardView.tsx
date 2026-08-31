import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Radio,
  Ticket,
  Trophy,
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
} from 'lucide-react';
import {
  AdminStats,
  TambolaGame,
  User,
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

interface AdminDashboardViewProps {
  stats: AdminStats;
  games: TambolaGame[];
  users: User[];
  withdrawals: WithdrawalRequest[];
  deposits?: DepositRequest[];
  commissions: ReferralCommission[];
  tickets: TambolaTicket[];
  transactions?: WalletTransaction[];
  activityLogs?: ActivityLog[];
  notifications?: AdminNotification[];
  loginHistory?: LoginHistoryEntry[];
  siteSettings?: SiteSettings;
  activeModule?: string;
  onModuleChange?: (module: string) => void;
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
  onUpdateWalletBalance: (userId: string, amount: number, type: 'credit' | 'debit') => Promise<boolean>;
  onToggleKYC: (userId: string) => Promise<boolean>;
  onToggleBlockUser?: (userId: string) => Promise<boolean>;
  onResetPassword?: (userId: string) => Promise<boolean>;
  onAdminGenerateTickets?: (gameId: string, count: number, colorTheme?: TicketColorThemeId) => Promise<boolean>;
  onAdminToggleTicketStatus?: (ticketId: string, isActive: boolean) => Promise<boolean>;
  onAdminBatchToggleTickets?: (ticketIds: string[], isActive: boolean) => Promise<boolean>;
  onApproveCommission?: (commissionId: string) => void;
  onReverseCommission?: (commissionId: string) => void;
  onSendNotification?: (notification: Omit<AdminNotification, 'id' | 'sentAt'>) => Promise<boolean>;
  onDeleteNotification?: (id: string) => void;
  onUpdateSettings?: (settings: Partial<SiteSettings>) => Promise<boolean>;
  onRegisterUser?: (newUser: User) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => Promise<boolean> | void;
  onBatchDeleteUsers?: (userIds: string[]) => Promise<boolean> | void;
  onForceRefresh?: () => void;
  isSyncing?: boolean;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  stats,
  games,
  users,
  withdrawals,
  deposits = [],
  commissions,
  tickets,
  transactions = [],
  activityLogs = [],
  notifications = [],
  loginHistory = [],
  siteSettings = INITIAL_SITE_SETTINGS,
  activeModule,
  onModuleChange,
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
  onUpdateWalletBalance,
  onToggleKYC,
  onToggleBlockUser,
  onResetPassword,
  onAdminGenerateTickets,
  onAdminToggleTicketStatus,
  onAdminBatchToggleTickets,
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
}) => {
  const [internalTab, setInternalTab] = useState<string>('dashboard');
  const activeTab = activeModule || internalTab;

  const handleSetActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (onModuleChange) {
      onModuleChange(tab);
    }
  };

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
  const pendingDepositsCount = deposits.filter((d) => d.status === 'pending').length;
  const liveGamesCount = games.filter((g) => g.status === 'live').length;

  const NAV_ITEMS = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'users', label: '2. User Management', icon: Users, badge: `${users.length}` },
    { id: 'games', label: '3. Game Management', icon: Gamepad2, badge: liveGamesCount > 0 ? `${liveGamesCount} LIVE` : null, badgeColor: 'bg-red-500 text-white' },
    { id: 'live_control', label: '4. Live Game Control', icon: Radio, badge: 'RNG', badgeColor: 'bg-amber-400 text-slate-950' },
    { id: 'tickets', label: '5. Ticket Management', icon: Ticket, badge: `${tickets.length}` },
    { id: 'prizes', label: '6. Prize Management', icon: Trophy, badge: null },
    { id: 'referrals', label: '7. 5-Level Referral', icon: Share2, badge: 'MLM' },
    { id: 'wallets', label: '8. Wallets & UTRs', icon: Wallet, badge: pendingDepositsCount > 0 ? `${pendingDepositsCount} UTR` : null, badgeColor: 'bg-amber-400 text-slate-950 font-black' },
    { id: 'withdrawals', label: '9. Withdrawals', icon: ArrowUpRight, badge: pendingWithdrawalsCount > 0 ? `${pendingWithdrawalsCount}` : null, badgeColor: 'bg-amber-400 text-slate-950' },
    { id: 'reports', label: '10. Reports & Analytics', icon: BarChart3, badge: null },
    { id: 'notifications', label: '11. Notifications', icon: Bell, badge: null },
    { id: 'settings', label: '12. Site & Security', icon: Settings, badge: null },
    { id: 'email_settings', label: '13. Brevo Email Engine', icon: Mail, badge: 'FREE 300/d', badgeColor: 'bg-emerald-400 text-slate-950 font-black' },
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
              13 Comprehensive Modules Active
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
            onToggleKYC={onToggleKYC}
            onToggleBlockUser={onToggleBlockUser || (async () => true)}
            onResetPassword={onResetPassword || (async () => true)}
            onUpdateWalletBalance={onUpdateWalletBalance}
            onRegisterUser={onRegisterUser}
            onDeleteUser={onDeleteUser}
            onBatchDeleteUsers={onBatchDeleteUsers}
            onForceRefresh={onForceRefresh}
            isSyncing={isSyncing}
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
            onAdminGenerateTickets={onAdminGenerateTickets}
            onAdminToggleTicketStatus={onAdminToggleTicketStatus}
            onAdminBatchToggleTickets={onAdminBatchToggleTickets}
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

        {activeTab === 'wallets' && (
          <ModuleWallets
            users={users}
            transactions={transactions}
            deposits={deposits}
            onUpdateWalletBalance={onUpdateWalletBalance}
            onApproveDeposit={onApproveDeposit}
            onRejectDeposit={onRejectDeposit}
          />
        )}

        {activeTab === 'withdrawals' && (
          <ModuleWithdrawals
            withdrawals={withdrawals}
            onApproveWithdrawal={onApproveWithdrawal}
            onRejectWithdrawal={onRejectWithdrawal}
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
      </div>
    </div>
  );
};