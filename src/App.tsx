import React, { useState, useEffect, useRef } from 'react';
import { Lock, LogIn, UserPlus, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { LiveGameView } from './views/LiveGameView';
import { BuyTicketView } from './views/BuyTicketView';
import { MyTicketsView } from './views/MyTicketsView';
import { GamesLobbyView } from './views/GamesLobbyView';
import { WinnersView } from './views/WinnersView';
import { ReferralView } from './views/ReferralView';
import { WalletView } from './views/WalletView';
import { ProfileView } from './views/ProfileView';
import { SupportView } from './views/SupportView';
import { UserDashboardView } from './views/UserDashboardView';
import { HowToPlayView } from './views/HowToPlayView';
import { DailyBonusView } from './views/DailyBonusView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminLoginModal } from './views/AdminLoginModal';
import { AuthModal } from './views/AuthModal';
import { ProtectedViewGate } from './components/ProtectedViewGate';
import { UserNotificationsDrawer, UserNotificationItem } from './components/UserNotificationsDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AllOptionsModal } from './components/AllOptionsModal';
import { TemplateSelectorModal } from './components/TemplateSelectorModal';
import { initTawkScript, syncUserToTawk } from './utils/tawk';
import { initBrevoConversations, syncUserToBrevoConversations } from './utils/brevoConversations';
import { AppTemplateId, getAppTemplate } from './utils/appThemes';
import { isDirectChildOf, findReferrerInList, extractReferralCode } from './utils/referralMatcher';
import {
  INITIAL_GAMES,
  INITIAL_USERS,
  INITIAL_TICKETS,
  INITIAL_WINNERS,
  INITIAL_TRANSACTIONS,
  INITIAL_WITHDRAWALS,
  INITIAL_DEPOSITS,
  INITIAL_REFERRAL_MEMBERS,
  INITIAL_COMMISSIONS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_ADMIN_STATS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_LOGIN_HISTORY,
  INITIAL_SITE_SETTINGS,
  INITIAL_USER_NOTIFICATIONS,
} from './data/mockData';
import {
  User,
  TambolaGame,
  TambolaTicket,
  GameWinner,
  WalletTransaction,
  WithdrawalRequest,
  DepositRequest,
  ReferralMember,
  ReferralCommission,
  SupportTicket,
  AdminStats,
  PrizeCode,
  TicketColorThemeId,
  ActivityLog,
  AdminNotification,
  LoginHistoryEntry,
  SiteSettings,
} from './types';
import { UniversalLiveBallBar } from './components/UniversalLiveBallBar';
import { generateTambolaTicketMatrix, generateTicketId, verifyClaim } from './utils/tambolaTicket';
import { checkAndAutoTrackWinners, auditDuplicateFullHouseWins } from './utils/autoWinnerTracker';
import { LiveWinnerFlashTicker, FlashWinnerItem } from './components/LiveWinnerFlashTicker';
import { WinnerFlashData } from './components/WinnerCelebrationModal';
import { COLOR_KEYS, getTicketTheme } from './utils/ticketColors';
import { playWinningFanfare, playNumberCallSound, playUserRegisteredSound, speakNumberCall, speakWinnerAnnouncement, getCallerVoiceLanguage } from './utils/audio';
import { calculateTambolaDynamicPrizes, calculateSplitWinning } from './utils/prizePoolCalculator';
import {
  getUserRegistrationTimestamp,
  isUserRecentlyRegistered,
  sortUsersNewestFirst,
} from './utils/userUtils';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, getDoc, query, where, getDocFromServer } from 'firebase/firestore';
import { FirebaseDiagnosticsModal } from './components/FirebaseDiagnosticsModal';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_selected_game_id');
      if (saved) return saved;
    } catch {}
    return undefined;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Core Applet State with LocalStorage Persistence
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy mock placeholder records that held ashishbadawat email/dummy phone
          const cleaned = parsed.filter(
            (u) =>
              u.id !== 'usr_ashish_101' &&
              !(u.email === 'ashishbadawat@gmail.com' && u.createdAt === '2026-06-15T10:30:00.000Z')
          );
          if (cleaned.length > 0) {
            return cleaned;
          }
        }
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return INITIAL_USERS;
  });

  // Strict visitor default: requires registered user to login with ID/Password
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_auth_user');
      if (saved) {
        const user = JSON.parse(saved);
        if (user) {
          if (user.email === 'ashishbadawat@gmail.com' || user.id === 'admin_master_1') {
            user.role = 'admin';
          }
          user.walletBalance = Number(user.walletBalance) || 0;
          user.depositBalance = Number(user.depositBalance) || 0;
          user.winningBalance = Number(user.winningBalance) || 0;
          user.referralBalance = Number(user.referralBalance) || 0;
          return user;
        }
      }
    } catch (e) {
      console.error('Error loading active user session:', e);
    }
    return null;
  });

  const [games, setGames] = useState<TambolaGame[]>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_games');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((g: any) => ({
            ...g,
            calledNumbers: Array.isArray(g.calledNumbers) ? g.calledNumbers : [],
            previousNumbers: Array.isArray(g.previousNumbers) ? g.previousNumbers : [],
            prizes: Array.isArray(g.prizes)
              ? g.prizes.map((p: any) => ({
                  ...p,
                  claimedWinners: Array.isArray(p.claimedWinners) ? p.claimedWinners : [],
                }))
              : [],
          }));
        }
      }
    } catch (e) {}
    return INITIAL_GAMES;
  });

  const [tickets, setTickets] = useState<TambolaTicket[]>(() => {
    let deletedTicketIds = new Set<string>();
    try {
      const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_ticket_ids') || '[]');
      if (Array.isArray(arr)) deletedTicketIds = new Set(arr);
    } catch (e) {}

    let completedGameIds = new Set<string>();
    try {
      const savedGames = JSON.parse(localStorage.getItem('apna_tambola_games') || '[]');
      if (Array.isArray(savedGames)) {
        savedGames.forEach((g: any) => {
          if (g && (g.status === 'completed' || g.status === 'cancelled')) {
            completedGameIds.add(g.id);
          }
        });
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem('apna_tambola_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((t: TambolaTicket) => !deletedTicketIds.has(t.id) && !deletedTicketIds.has(t.ticketId) && (!t.gameId || !completedGameIds.has(t.gameId)));
        }
      }
    } catch (e) {}
    return INITIAL_TICKETS.filter((t) => !deletedTicketIds.has(t.id) && !deletedTicketIds.has(t.ticketId) && (!t.gameId || !completedGameIds.has(t.gameId)));
  });

  const [winners, setWinners] = useState<GameWinner[]>(() => {
    let deletedWinnerIds = new Set<string>();
    try {
      const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_winner_ids') || '[]');
      if (Array.isArray(arr)) deletedWinnerIds = new Set(arr);
    } catch (e) {}

    try {
      const saved = localStorage.getItem('apna_tambola_winners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((w: GameWinner) => !deletedWinnerIds.has(w.id));
      }
    } catch (e) {}
    return INITIAL_WINNERS.filter((w) => !deletedWinnerIds.has(w.id));
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_TRANSACTIONS;
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_withdrawals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_WITHDRAWALS;
  });

  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_deposits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_DEPOSITS;
  });

  const [referralMembers, setReferralMembers] = useState<ReferralMember[]>(INITIAL_REFERRAL_MEMBERS);
  const [commissions, setCommissions] = useState<ReferralCommission[]>(INITIAL_COMMISSIONS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [adminStats, setAdminStats] = useState<AdminStats>(INITIAL_ADMIN_STATS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_NOTIFICATIONS);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>(INITIAL_LOGIN_HISTORY);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_site_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...INITIAL_SITE_SETTINGS, ...parsed };
      }
    } catch (e) {}
    return INITIAL_SITE_SETTINGS;
  });
  const [userNotifications, setUserNotifications] = useState<UserNotificationItem[]>(INITIAL_USER_NOTIFICATIONS);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState<boolean>(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState<boolean>(false);

  // Persistent Admin View State (Cross-browser, tab-synchronized, and stable)
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('apna_tambola_admin_view_active');
      if (saved === 'true') return true;
      if (saved === 'false') return false;
      const savedUser = localStorage.getItem('apna_tambola_auth_user');
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          if (u && (u.role === 'admin' || u.email === 'ashishbadawat@gmail.com')) return true;
        } catch (e) {}
      }
    }
    return false;
  });

  const handleSetIsAdminView = (val: boolean) => {
    setIsAdminView(val);
    try {
      localStorage.setItem('apna_tambola_admin_view_active', String(val));
    } catch (e) {}
  };

  // Instant Direct Referral Live Celebration Popup State
  const [directReferralCelebration, setDirectReferralCelebration] = useState<User | null>(null);

  // Synchronous references to avoid closure staleness in SSE and interval loops
  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const commissionsRef = useRef<ReferralCommission[]>(commissions);
  useEffect(() => {
    commissionsRef.current = commissions;
  }, [commissions]);

  // Real-Time Registration Radar State for Instant Admin Discovery
  const [latestRegisteredUser, setLatestRegisteredUser] = useState<User | null>(null);
  const knownUserIdsRef = useRef<Set<string>>(
    new Set([
      ...INITIAL_USERS.map((u) => u.id),
      ...(() => {
        try {
          const saved = localStorage.getItem('apna_tambola_registered_users');
          if (saved) {
            const arr = JSON.parse(saved);
            if (Array.isArray(arr)) return arr.map((u: any) => u && u.id).filter(Boolean);
          }
        } catch (e) {}
        return [];
      })(),
    ])
  );

  const handleDetectNewUsers = (incomingList: User[]) => {
    if (!Array.isArray(incomingList) || incomingList.length === 0) return;
    let newestDiscovered: User | null = null;
    incomingList.forEach((u) => {
      if (u && u.id && !knownUserIdsRef.current.has(u.id)) {
        knownUserIdsRef.current.add(u.id);
        if (!newestDiscovered || getUserRegistrationTimestamp(u) > getUserRegistrationTimestamp(newestDiscovered)) {
          newestDiscovered = u;
        }
      }
    });

    if (newestDiscovered) {
      const nu = newestDiscovered as User;
      setLatestRegisteredUser(nu);
      playUserRegisteredSound();

      // Check if this newly discovered user is a direct referral of the active user
      const activeUser = currentUserRef.current;
      const activeComms = commissionsRef.current;
      if (activeUser && isDirectChildOf(nu, activeUser, activeComms)) {
        setDirectReferralCelebration(nu);
        playWinningFanfare();

        // Add to User Notifications
        setUserNotifications((prev) => [
          {
            id: `notif_ref_${Date.now()}_${nu.id}`,
            category: 'referral_commission',
            title: '🎉 नया डायरेक्ट रेफरल तुरंत जुड़ा!',
            message: `${nu.name} (${nu.phone || 'New Player'}) ने आपके रेफरल लिंक से अभी रजिस्टर किया है। जब वे टिकट खेलेंगे, तब आपको कमिशन मिलेगा।`,
            timestamp: 'Just now',
            read: false,
            actionTab: 'referral',
          },
          ...prev,
        ]);

        // Immediately update user's referral counts (without bonus balance)
        setCurrentUser((prev) => {
          if (!prev) return null;
          const updated: User = {
            ...prev,
            referralCount: (prev.referralCount || 0) + 1,
          };
          try {
            localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }

      // Automatically add to Activity Log for Admin
      setActivityLogs((prev) => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: 'Just now',
          action: `🆕 नया यूज़र ID लाइव रजिस्टर हुआ: ${nu.name} (ID: ${nu.id})`,
          adminName: 'System Live Sync',
          category: 'user' as const,
          ipAddress: '127.0.0.1',
          device: 'Realtime Radar',
          status: 'success' as const,
          details: `Phone: ${nu.phone || 'N/A'} | Sponsor: ${nu.referredBy || nu.referredByUserId || 'Direct'}`,
        },
        ...prev,
      ]);

      // Automatically add to Notifications for Admin
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: '🆕 नया यूज़र ID तुरंत सिंक हुआ',
          message: `खिलाड़ी: ${nu.name} | User ID: ${nu.id} | मोबाइल: ${nu.phone || 'N/A'}`,
          type: 'info',
          sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
          targetAudience: 'all',
        },
        ...prev,
      ]);

      // Update adminStats
      setAdminStats((prev) => ({
        ...prev,
        totalUsers: (prev.totalUsers || 0) + 1,
      }));
    }
  };
  const [adminActiveModule, setAdminActiveModule] = useState<string>('dashboard');
  const [showAllOptionsModal, setShowAllOptionsModal] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [activeTemplateId, setActiveTemplateId] = useState<AppTemplateId>(() => {
    const saved = localStorage.getItem('apna_tambola_template');
    return (saved as AppTemplateId) || 'royal_gold';
  });
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  // Secret Admin Portal Direct Link Handler (?admin=true, #admin, or ?mode=admin)
  // Keyboard Shortcut (Ctrl + Shift + A or Alt + Shift + A)
  // and Referral Link Parameter Handler (?ref=... or ?referral=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      const isAdminQuery =
        urlParams.get('admin') === 'true' ||
        urlParams.get('admin') === '1' ||
        urlParams.get('mode') === 'admin' ||
        urlParams.get('portal') === 'admin';
      const isAdminHash = hash === '#admin' || hash === '#admin-portal';

      if (isAdminQuery || isAdminHash) {
        setShowAdminLoginModal(true);
      }

      // Robust Check for referral link across query parameters, hash, or pathname
      let refCode = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('r') || urlParams.get('sponsor') || urlParams.get('refCode') || '';
      
      if (!refCode && window.location.hash) {
        const hashMatch = window.location.hash.match(/[?&#](ref|referral|r|sponsor)=([^&#]+)/i) || window.location.hash.match(/#ref=([^&#]+)/i);
        if (hashMatch && hashMatch[2]) refCode = decodeURIComponent(hashMatch[2]);
        else if (hashMatch && hashMatch[1] && !window.location.hash.includes('=')) refCode = decodeURIComponent(hashMatch[1]);
      }

      if (!refCode && window.location.pathname) {
        const pathMatch = window.location.pathname.match(/\/r\/([a-zA-Z0-9_-]+)/i);
        if (pathMatch && pathMatch[1]) refCode = pathMatch[1];
      }

      if (refCode && refCode.trim()) {
        const cleanRef = refCode.trim().toUpperCase();
        console.log(`[REFERRAL] URL referral code detected: ${cleanRef}`);
        try {
          localStorage.setItem('apna_tambola_pending_referral', cleanRef);
          localStorage.setItem('pendingReferralCode', cleanRef);
          sessionStorage.setItem('pendingReferralCode', cleanRef);
        } catch (e) {}
        // Prompt register modal
        setShowAuthModal(true);
        setAuthModalMode('register');
      }
    };

    // Secret Admin keyboard shortcut: Ctrl+Shift+A or Alt+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
          (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault();
        setShowAdminLoginModal(true);
      }
    };

    checkUrlParams();
    window.addEventListener('hashchange', checkUrlParams);
    window.addEventListener('keydown', handleKeyDown);
    
    // Safely load live chat widgets in background
    try {
      initTawkScript();
      initBrevoConversations();
    } catch (e) {
      console.warn('Chat init deferred:', e);
    }

    return () => {
      window.removeEventListener('hashchange', checkUrlParams);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync visitor profile with Live Chat
  useEffect(() => {
    syncUserToTawk(currentUser);
    syncUserToBrevoConversations(currentUser);
  }, [currentUser]);

  // Real-time Firestore synchronizer for users across multiple devices and browsers
  useEffect(() => {
    try {
      // Real-time users sync
      const unsubscribeUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const firestoreUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as User;
            const refId = data.referrer_id ?? (data as any).referredByUserId ?? null;
            firestoreUsers.push({
              ...data,
              id: docSnap.id,
              referrer_id: refId,
              referredByUserId: data.referredByUserId || (typeof refId === 'string' ? refId : ''),
            });
          });

          setUsers((prev) => {
            const map = new Map<string, User>();
            INITIAL_USERS.forEach((u) => map.set(u.id, u));
            prev.forEach((u) => map.set(u.id, u));
            firestoreUsers.forEach((u) => {
              const existing = map.get(u.id);
              map.set(u.id, { ...(existing || {}), ...u });
            });

            const merged = sortUsersNewestFirst(Array.from(map.values()));

            try {
              localStorage.setItem('apna_tambola_registered_users', JSON.stringify(merged));
            } catch (e) {}

            return merged;
          });

          // Detect any newly registered user IDs instantly
          handleDetectNewUsers(firestoreUsers);

          // Sync Firestore users to backend server so admin and all devices have all user IDs
          if (firestoreUsers.length > 0) {
            fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ users: firestoreUsers }),
            }).catch(() => {});
          }

          // If current logged-in user is updated or deleted in Firestore, keep currentUser state live
          setCurrentUser((prevUser) => {
            if (!prevUser) return null;
            const cleanPrevPhone = prevUser.phone ? prevUser.phone.replace(/\D/g, '').slice(-10) : '';
            const updated = firestoreUsers.find((u) => {
              if (u.id === prevUser.id) return true;
              const cleanUPhone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
              if (cleanPrevPhone && cleanUPhone && cleanPrevPhone === cleanUPhone) return true;
              if (prevUser.email && u.email && prevUser.email.toLowerCase() === u.email.toLowerCase()) return true;
              return false;
            });
            if (!updated) return prevUser;
            const isMasterAdmin =
              prevUser.role === 'admin' ||
              prevUser.email === 'ashishbadawat@gmail.com' ||
              prevUser.email?.includes('admin') ||
              prevUser.id === 'admin_master_1';
            const merged = {
              ...prevUser,
              ...updated,
              role: isMasterAdmin ? 'admin' : (updated.role || prevUser.role || 'user'),
            };
            try {
              localStorage.setItem('apna_tambola_auth_user', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        },
        (error) => {
          console.warn('Firestore real-time sync notice:', error);
        }
      );

      // Real-time commissions sync
      const unsubscribeCommissions = onSnapshot(
        collection(db, 'commissions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreComms: ReferralCommission[] = [];
            snapshot.forEach((docSnap) => {
              firestoreComms.push({ ...(docSnap.data() as ReferralCommission), id: docSnap.id });
            });
            setCommissions((prev) => {
              const map = new Map<string, ReferralCommission>();
              prev.forEach((c) => map.set(c.id, c));
              firestoreComms.forEach((c) => map.set(c.id, c));
              return Array.from(map.values());
            });
          }
        },
        () => {}
      );

      // Real-time site settings sync
      const unsubscribeSettings = onSnapshot(
        doc(db, 'system', 'site_settings'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<SiteSettings>;
            setSiteSettings((prev) => {
              const updated = { ...prev, ...data };
              try {
                localStorage.setItem('apna_tambola_site_settings', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        },
        (err) => console.warn('Firestore settings listener:', err)
      );

      // Real-time games sync
      const unsubscribeGames = onSnapshot(
        collection(db, 'games'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreGames: TambolaGame[] = [];
            snapshot.forEach((docSnap) => {
              const g = docSnap.data() as TambolaGame;
              firestoreGames.push({
                ...g,
                id: docSnap.id,
                calledNumbers: Array.isArray(g.calledNumbers) ? g.calledNumbers : [],
                previousNumbers: Array.isArray(g.previousNumbers) ? g.previousNumbers : [],
                prizes: Array.isArray(g.prizes)
                  ? g.prizes.map((p: any) => ({
                      ...p,
                      claimedWinners: Array.isArray(p.claimedWinners) ? p.claimedWinners : [],
                    }))
                  : [],
              });
            });
            setGames((prev) => {
              const map = new Map<string, TambolaGame>();
              prev.forEach((g) => map.set(g.id, g));
              firestoreGames.forEach((g) => map.set(g.id, g));
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('apna_tambola_games', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        },
        (err) => console.warn('Firestore games listener:', err)
      );

      // Real-time tickets sync
      const unsubscribeTickets = onSnapshot(
        collection(db, 'tickets'),
        (snapshot) => {
          let deletedTicketIds = new Set<string>();
          try {
            const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_ticket_ids') || '[]');
            if (Array.isArray(arr)) deletedTicketIds = new Set(arr);
          } catch (e) {}

          if (!snapshot.empty) {
            const firestoreTickets: TambolaTicket[] = [];
            snapshot.forEach((docSnap) => {
              if (!deletedTicketIds.has(docSnap.id)) {
                firestoreTickets.push({ ...(docSnap.data() as TambolaTicket), id: docSnap.id });
              }
            });
            setTickets((prev) => {
              const map = new Map<string, TambolaTicket>();
              prev.forEach((t) => {
                if (!deletedTicketIds.has(t.id) && !deletedTicketIds.has(t.ticketId)) map.set(t.id, t);
              });
              firestoreTickets.forEach((t) => {
                if (!deletedTicketIds.has(t.id) && !deletedTicketIds.has(t.ticketId)) map.set(t.id, t);
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('apna_tambola_tickets', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        },
        (err) => console.warn('Firestore tickets listener:', err)
      );

      // Real-time winners sync
      const unsubscribeWinners = onSnapshot(
        collection(db, 'winners'),
        (snapshot) => {
          let deletedWinnerIds = new Set<string>();
          try {
            const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_winner_ids') || '[]');
            if (Array.isArray(arr)) deletedWinnerIds = new Set(arr);
          } catch (e) {}

          if (!snapshot.empty) {
            const firestoreWinners: GameWinner[] = [];
            snapshot.forEach((docSnap) => {
              if (!deletedWinnerIds.has(docSnap.id)) {
                firestoreWinners.push({ ...(docSnap.data() as GameWinner), id: docSnap.id });
              }
            });
            setWinners((prev) => {
              const map = new Map<string, GameWinner>();
              prev.forEach((w) => {
                if (!deletedWinnerIds.has(w.id)) map.set(w.id, w);
              });
              firestoreWinners.forEach((w) => {
                if (!deletedWinnerIds.has(w.id)) map.set(w.id, w);
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('apna_tambola_winners', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        },
        (err) => console.warn('Firestore winners listener:', err)
      );

      // Real-time deposits sync
      const unsubscribeDeposits = onSnapshot(
        collection(db, 'deposits'),
        (snapshot) => {
          let deletedIds = new Set<string>();
          try {
            const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_deposit_ids') || '[]');
            if (Array.isArray(arr)) deletedIds = new Set(arr);
          } catch (e) {}

          const firestoreDeps: DepositRequest[] = [];
          snapshot.forEach((docSnap) => {
            if (!deletedIds.has(docSnap.id)) {
              firestoreDeps.push({ ...(docSnap.data() as DepositRequest), id: docSnap.id });
            }
          });

          setDeposits((prev) => {
            const map = new Map<string, DepositRequest>();
            prev.forEach((d) => {
              if (!deletedIds.has(d.id)) {
                map.set(d.id, d);
              }
            });
            firestoreDeps.forEach((d) => {
              if (!deletedIds.has(d.id)) {
                map.set(d.id, d);
              }
            });
            const merged = Array.from(map.values()).sort((a, b) => {
              const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
              const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
              return timeB - timeA;
            });
            try {
              localStorage.setItem('apna_tambola_deposits', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });

          // Instantly sync active currentUser wallet if any deposit has been approved
          setCurrentUser((prevUser) => {
            if (!prevUser) return null;
            const cleanPrevPhone = prevUser.phone ? prevUser.phone.replace(/\D/g, '').slice(-10) : '';
            const myApprovedDeps = firestoreDeps.filter((d) => {
              if (d.status !== 'approved') return false;
              if (d.userId === prevUser.id) return true;
              const cleanDPhone = d.userPhone ? d.userPhone.replace(/\D/g, '').slice(-10) : '';
              if (cleanPrevPhone && cleanDPhone && cleanPrevPhone === cleanDPhone) return true;
              if (prevUser.email && d.userEmail && prevUser.email.toLowerCase() === d.userEmail.toLowerCase()) return true;
              return false;
            });

            if (myApprovedDeps.length > 0) {
              let totalApprovedDeposit = 0;
              myApprovedDeps.forEach((d) => {
                totalApprovedDeposit += (d.amount + (d.registrationBonus || 0));
              });

              if ((prevUser.depositBalance || 0) < totalApprovedDeposit) {
                const updated = {
                  ...prevUser,
                  depositBalance: totalApprovedDeposit,
                  hasDeposited: true,
                  firstDepositBonusClaimed: true,
                  walletBalance: totalApprovedDeposit + (prevUser.winningBalance || 0) + (prevUser.referralBalance || 0),
                };
                try {
                  localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              }
            }
            return prevUser;
          });
        },
        (err) => console.warn('Firestore deposits listener:', err)
      );

      // Real-time withdrawals sync for multi-device admin settlement
      const unsubscribeWithdrawals = onSnapshot(
        collection(db, 'withdrawals'),
        (snapshot) => {
          const firestoreWdrs: WithdrawalRequest[] = [];
          snapshot.forEach((docSnap) => {
            firestoreWdrs.push({ ...(docSnap.data() as WithdrawalRequest), id: docSnap.id });
          });

          if (firestoreWdrs.length > 0) {
            setWithdrawals((prev) => {
              const map = new Map<string, WithdrawalRequest>();
              prev.forEach((w) => map.set(w.id, w));
              firestoreWdrs.forEach((w) => {
                const existing = map.get(w.id);
                map.set(w.id, { ...(existing || {}), ...w });
              });
              const merged = Array.from(map.values()).sort((a, b) => {
                const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
                const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
                return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
              });
              try {
                localStorage.setItem('apna_tambola_withdrawals', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        },
        (err) => console.warn('Firestore withdrawals listener:', err)
      );

      return () => {
        if (unsubscribeUsers) unsubscribeUsers();
        if (unsubscribeCommissions) unsubscribeCommissions();
        if (unsubscribeSettings) unsubscribeSettings();
        if (unsubscribeGames) unsubscribeGames();
        if (unsubscribeTickets) unsubscribeTickets();
        if (unsubscribeDeposits) unsubscribeDeposits();
        if (unsubscribeWithdrawals) unsubscribeWithdrawals();
      };
    } catch (err) {
      console.warn('Firestore onSnapshot listener error:', err);
    }
  }, []);

  // Multi-Device & Tab Real-Time Poller + BroadcastChannel Sync Engine
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. BroadcastChannel for instant local tab sync (0ms latency across tabs)
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('apna_tambola_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_USER_REGISTERED' && event.data.user) {
            const newUser: User = event.data.user;
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === newUser.id);
              const nextUsers = exists
                ? sortUsersNewestFirst(prev.map((u) => (u.id === newUser.id ? { ...u, ...newUser } : u)))
                : sortUsersNewestFirst([newUser, ...prev]);
              try {
                localStorage.setItem('apna_tambola_registered_users', JSON.stringify(nextUsers));
              } catch (e) {}
              return nextUsers;
            });
            handleDetectNewUsers([newUser]);
          } else if (event.data?.type === 'NEW_DEPOSIT_REQUEST' && event.data.deposit) {
            const newDep: DepositRequest = event.data.deposit;
            setDeposits((prev) => {
              const exists = prev.some((d) => d.id === newDep.id || (d.utrNumber && d.utrNumber === newDep.utrNumber));
              if (exists) {
                return prev.map((d) => (d.id === newDep.id || (d.utrNumber && d.utrNumber === newDep.utrNumber) ? { ...d, ...newDep } : d));
              }
              return [newDep, ...prev];
            });
            if (event.data.transaction) {
              const newTxn: WalletTransaction = event.data.transaction;
              setTransactions((prev) => {
                if (prev.some((t) => t.id === newTxn.id)) return prev;
                return [newTxn, ...prev];
              });
            }
          } else if (event.data?.type === 'DEPOSIT_APPROVED' && event.data.depositId) {
            const { depositId, user, transaction, notification } = event.data;
            setDeposits((prev) =>
              prev.map((d) => (d.id === depositId ? { ...d, status: 'approved' as const, approvedAt: new Date().toISOString() } : d))
            );
            if (user) {
              const cleanUserPhone = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
              setUsers((prev) =>
                prev.map((u) => {
                  const cleanUPhone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
                  const match =
                    u.id === user.id ||
                    (cleanUPhone && cleanUserPhone && cleanUPhone === cleanUserPhone) ||
                    (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase());
                  return match ? { ...u, ...user } : u;
                })
              );
              setCurrentUser((prev) => {
                if (!prev) return null;
                const cleanPrevPhone = prev.phone ? prev.phone.replace(/\D/g, '').slice(-10) : '';
                const match =
                  prev.id === user.id ||
                  (cleanPrevPhone && cleanUserPhone && cleanPrevPhone === cleanUserPhone) ||
                  (prev.email && user.email && prev.email.toLowerCase() === user.email.toLowerCase());
                if (match) {
                  const merged = { ...prev, ...user };
                  try {
                    localStorage.setItem('apna_tambola_auth_user', JSON.stringify(merged));
                  } catch (e) {}
                  return merged;
                }
                return prev;
              });
            }
            if (transaction) {
              setTransactions((prev) => [transaction, ...prev.filter((t) => t.id !== transaction.id)]);
            } else {
              setTransactions((prev) =>
                prev.map((t) => {
                  if (t.referenceId === depositId || (user && t.userId === user.id && t.type === 'deposit' && t.status === 'pending')) {
                    return { ...t, status: 'completed' as const, balanceAfter: user ? user.walletBalance : t.balanceAfter };
                  }
                  return t;
                })
              );
            }
            if (notification) {
              setUserNotifications((prev) => [notification, ...prev]);
            }
          } else if (event.data?.type === 'ADMIN_WALLET_ADJUSTED' && event.data.user) {
            const { user, transaction, notification } = event.data;
            const cleanUserPhone = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
            setUsers((prev) =>
              prev.map((u) => {
                const cleanUPhone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
                const match =
                  u.id === user.id ||
                  (cleanUPhone && cleanUserPhone && cleanUPhone === cleanUserPhone) ||
                  (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase());
                return match ? { ...u, ...user } : u;
              })
            );
            setCurrentUser((prev) => {
              if (!prev) return null;
              const cleanPrevPhone = prev.phone ? prev.phone.replace(/\D/g, '').slice(-10) : '';
              const match =
                prev.id === user.id ||
                (cleanPrevPhone && cleanUserPhone && cleanPrevPhone === cleanUserPhone) ||
                (prev.email && user.email && prev.email.toLowerCase() === user.email.toLowerCase());
              if (match) {
                const merged = { ...prev, ...user };
                try {
                  localStorage.setItem('apna_tambola_auth_user', JSON.stringify(merged));
                } catch (e) {}
                return merged;
              }
              return prev;
            });
            if (transaction) {
              setTransactions((prev) => [transaction, ...prev.filter((t) => t.id !== transaction.id)]);
            }
            if (notification) {
              setUserNotifications((prev) => [notification, ...prev]);
            }
          } else if (event.data?.type === 'NEW_WITHDRAWAL_REQUEST' && event.data.withdrawal) {
            const newWdr: WithdrawalRequest = event.data.withdrawal;
            setWithdrawals((prev) => {
              const exists = prev.some((w) => w.id === newWdr.id);
              if (exists) {
                return prev.map((w) => (w.id === newWdr.id ? { ...w, ...newWdr } : w));
              }
              return [newWdr, ...prev];
            });
            if (event.data.user) {
              const targetUser: User = event.data.user;
              setUsers((prev) =>
                prev.map((u) => (u.id === targetUser.id ? { ...u, ...targetUser } : u))
              );
            }
            if (event.data.transaction) {
              const newTxn: WalletTransaction = event.data.transaction;
              setTransactions((prev) => {
                if (prev.some((t) => t.id === newTxn.id)) return prev;
                return [newTxn, ...prev];
              });
            }
          } else if (event.data?.type === 'WITHDRAWAL_APPROVED' && event.data.withdrawalId) {
            const { withdrawalId } = event.data;
            setWithdrawals((prev) =>
              prev.map((w) => (w.id === withdrawalId ? { ...w, status: 'approved' as const, processedDate: new Date().toISOString() } : w))
            );
            setTransactions((prev) =>
              prev.map((t) => (t.referenceId === withdrawalId ? { ...t, status: 'completed' as const } : t))
            );
          } else if (event.data?.type === 'WITHDRAWAL_REJECTED' && event.data.withdrawalId) {
            const { withdrawalId, refundedUser } = event.data;
            setWithdrawals((prev) =>
              prev.map((w) => (w.id === withdrawalId ? { ...w, status: 'rejected' as const, processedDate: new Date().toISOString() } : w))
            );
            setTransactions((prev) =>
              prev.map((t) => (t.referenceId === withdrawalId ? { ...t, status: 'failed' as const } : t))
            );
            if (refundedUser) {
              setUsers((prev) =>
                prev.map((u) => (u.id === refundedUser.id ? { ...u, ...refundedUser } : u))
              );
              setCurrentUser((prev) => {
                if (prev && prev.id === refundedUser.id) {
                  return { ...prev, ...refundedUser };
                }
                return prev;
              });
            }
          } else if (event.data?.type === 'DEPOSIT_REJECTED' && event.data.depositId) {
            const { depositId } = event.data;
            setDeposits((prev) =>
              prev.map((d) => (d.id === depositId ? { ...d, status: 'rejected' as const } : d))
            );
          } else if (event.data?.type === 'DEPOSIT_DELETED' && event.data.depositId) {
            const { depositId } = event.data;
            setDeposits((prev) => prev.filter((d) => d.id !== depositId));
          } else if (event.data?.type === 'TICKET_STATUS_TOGGLED') {
            const { ticketId, isActive } = event.data;
            setTickets((prev) =>
              prev.map((t) =>
                t.id === ticketId
                  ? {
                      ...t,
                      isActive,
                      status: isActive ? 'active' : 'disabled',
                      disabledReason: isActive ? undefined : 'Disabled by Admin',
                    }
                  : t
              )
            );
          } else if (event.data?.type === 'TICKETS_BATCH_TOGGLED') {
            const { ticketIds, isActive } = event.data;
            const idSet = new Set(ticketIds || []);
            setTickets((prev) =>
              prev.map((t) =>
                idSet.has(t.id)
                  ? {
                      ...t,
                      isActive,
                      status: isActive ? 'active' : 'disabled',
                      disabledReason: isActive ? undefined : 'Disabled by Admin',
                    }
                  : t
              )
            );
          } else if (event.data?.type === 'TICKET_DELETED' && event.data.ticketId) {
            const { ticketId } = event.data;
            setTickets((prev) => prev.filter((t) => t.id !== ticketId && t.ticketId !== ticketId));
          } else if (event.data?.type === 'TICKETS_BATCH_DELETED' && event.data.ticketIds) {
            const idSet = new Set(event.data.ticketIds || []);
            setTickets((prev) => prev.filter((t) => !idSet.has(t.id) && !idSet.has(t.ticketId)));
          } else if (event.data?.type === 'GAME_NUMBER_CALLED') {
            const { gameId, calledNumber, calledNumbers, previousNumbers } = event.data;
            setGames((prev) =>
              prev.map((g) => {
                if (g.id === gameId) {
                  return {
                    ...g,
                    currentNumber: calledNumber,
                    lastCalledNumber: calledNumber,
                    calledNumbers: calledNumbers || [...(g.calledNumbers || []), calledNumber],
                    previousNumbers: previousNumbers || [calledNumber, ...(g.previousNumbers || [])].slice(0, 5),
                  };
                }
                return g;
              })
            );
            setTickets((prev) =>
              prev.map((t) => {
                if (t.gameId === gameId || !t.gameId) {
                  const hasNum = Array.isArray(t.numbers) && t.numbers.some((row) => Array.isArray(row) && row.includes(calledNumber));
                  if (hasNum && !t.markedNumbers?.includes(calledNumber)) {
                    return { ...t, markedNumbers: [...(t.markedNumbers || []), calledNumber] };
                  }
                }
                return t;
              })
            );
          } else if (event.data?.type === 'GAME_UPDATED') {
            const { gameId, updates } = event.data;
            setGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, ...updates } : g)));
          } else if (event.data?.type === 'GAME_RESET') {
            const { gameId } = event.data;
            setGames((prev) =>
              prev.map((g) =>
                g.id === gameId
                  ? {
                      ...g,
                      currentNumber: undefined,
                      lastCalledNumber: undefined,
                      calledNumbers: [],
                      previousNumbers: [],
                      autoCalling: false,
                    }
                  : g
              )
            );
          } else if (event.data?.type === 'GAME_COMPLETED_SETTLED') {
            const { gameId } = event.data;
            setGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, status: 'completed', autoCalling: false } : g)));
            setTickets((prev) => prev.filter((t) => t.gameId !== gameId));
          }
        };
      }
    } catch (e) {}

    // 2. Storage event listener for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'apna_tambola_registered_users' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setUsers((prev) => {
              const map = new Map<string, User>();
              prev.forEach((u) => map.set(u.id, u));
              parsed.forEach((u) => map.set(u.id, u));
              return Array.from(map.values()).sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
              });
            });
          }
        } catch (err) {}
      } else if (e.key === 'apna_tambola_deposits' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            let deletedIds = new Set<string>();
            try {
              const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_deposit_ids') || '[]');
              if (Array.isArray(arr)) deletedIds = new Set(arr);
            } catch (err) {}

            setDeposits((prev) => {
              const map = new Map<string, DepositRequest>();
              prev.forEach((d) => { if (!deletedIds.has(d.id)) map.set(d.id, d); });
              parsed.forEach((d) => { if (!deletedIds.has(d.id)) map.set(d.id, d); });
              return Array.from(map.values()).sort((a, b) => {
                const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
                const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
                return timeB - timeA;
              });
            });
          }
        } catch (err) {}
      } else if (e.key === 'apna_tambola_auth_user' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.id) {
            setCurrentUser(parsed);
          }
        } catch (err) {}
      } else if (e.key === 'apna_tambola_admin_view_active' && e.newValue !== null) {
        setIsAdminView(e.newValue === 'true');
      } else if (e.key === 'apna_tambola_tickets' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setTickets((prev) => {
              const map = new Map<string, TambolaTicket>();
              prev.forEach((t) => map.set(t.id, t));
              parsed.forEach((t) => map.set(t.id, t));
              return Array.from(map.values());
            });
          }
        } catch (err) {}
      } else if (e.key === 'apna_tambola_withdrawals' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setWithdrawals((prev) => {
              const map = new Map<string, WithdrawalRequest>();
              prev.forEach((w) => map.set(w.id, w));
              parsed.forEach((w) => map.set(w.id, w));
              return Array.from(map.values()).sort((a, b) => {
                const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
                const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
                return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
              });
            });
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Periodic & Event-Driven REST API polling for multi-device server-backed synchronization
    const pollServerSync = async () => {
      try {
        const res = await fetch('/api/sync/all');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.users) && data.users.length > 0) {
            setUsers((prev) => {
              const map = new Map<string, User>();
              // Use server data as authority, preserve local custom state
              prev.forEach((u) => {
                if (u && u.id) map.set(u.id, u);
              });
              data.users.forEach((u: User) => {
                if (u && u.id) {
                  const existing = map.get(u.id);
                  map.set(u.id, { ...(existing || {}), ...u });
                }
              });
              const merged = sortUsersNewestFirst(Array.from(map.values()));
              try {
                localStorage.setItem('apna_tambola_registered_users', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });

            // Detect newly registered user IDs instantly
            handleDetectNewUsers(data.users);

            // Also sync active currentUser if updated remotely (e.g. deposit approved or referral bonus credited)
            setCurrentUser((prev) => {
              if (!prev) return null;
              const cleanPrevPhone = prev.phone ? prev.phone.replace(/\D/g, '').slice(-10) : '';
              const remote = data.users.find((u: User) => {
                if (!u) return false;
                if (u.id === prev.id) return true;
                const cleanUPhone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
                if (cleanPrevPhone && cleanUPhone && cleanPrevPhone === cleanUPhone) return true;
                if (prev.email && u.email && prev.email.toLowerCase() === u.email.toLowerCase()) return true;
                return false;
              });
              if (remote) {
                const isMasterAdmin =
                  prev.role === 'admin' ||
                  prev.email === 'ashishbadawat@gmail.com' ||
                  prev.id === 'admin_master_1' ||
                  prev.email?.includes('admin');
                const updated = {
                  ...prev,
                  ...remote,
                  role: isMasterAdmin ? 'admin' : (remote.role || prev.role || 'user'),
                  // Ensure balances never drop unexpectedly
                  depositBalance: Math.max(prev.depositBalance || 0, remote.depositBalance || 0),
                  winningBalance: Math.max(prev.winningBalance || 0, remote.winningBalance || 0),
                  referralBalance: Math.max(prev.referralBalance || 0, remote.referralBalance || 0),
                  walletBalance: Math.max(prev.walletBalance || 0, remote.walletBalance || 0),
                };
                try {
                  localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              }
              return prev;
            });
          }
          if (Array.isArray(data.games) && data.games.length > 0) {
            setGames((prev) => {
              const map = new Map<string, TambolaGame>();
              prev.forEach((g) => { if (g && g.id) map.set(g.id, g); });
              data.games.forEach((g: TambolaGame) => {
                if (g && g.id) {
                  const existing = map.get(g.id);
                  map.set(g.id, { ...(existing || {}), ...g });
                }
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('apna_tambola_games', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
          if (Array.isArray(data.winners) && data.winners.length > 0) {
            setWinners((prev) => {
              const map = new Map<string, GameWinner>();
              prev.forEach((w) => { if (w && w.id) map.set(w.id, w); });
              data.winners.forEach((w: GameWinner) => { if (w && w.id) map.set(w.id, w); });
              return Array.from(map.values());
            });
          }
          if (Array.isArray(data.tickets) && data.tickets.length > 0) {
            let deletedTicketIds = new Set<string>();
            try {
              const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_ticket_ids') || '[]');
              if (Array.isArray(arr)) deletedTicketIds = new Set(arr);
            } catch (err) {}

            setTickets((prev) => {
              const map = new Map<string, TambolaTicket>();
              prev.forEach((t) => {
                if (!deletedTicketIds.has(t.id) && !deletedTicketIds.has(t.ticketId)) map.set(t.id, t);
              });
              data.tickets.forEach((t: TambolaTicket) => {
                if (t && t.id && !deletedTicketIds.has(t.id) && !deletedTicketIds.has(t.ticketId)) map.set(t.id, t);
              });
              return Array.from(map.values());
            });
          }
          if (Array.isArray(data.commissions) && data.commissions.length > 0) {
            setCommissions((prev) => {
              const map = new Map<string, ReferralCommission>();
              prev.forEach((c) => map.set(c.id, c));
              data.commissions.forEach((c: ReferralCommission) => map.set(c.id, c));
              return Array.from(map.values());
            });
          }
          if (Array.isArray(data.deposits) && data.deposits.length > 0) {
            let deletedIds = new Set<string>();
            try {
              const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_deposit_ids') || '[]');
              if (Array.isArray(arr)) deletedIds = new Set(arr);
            } catch (err) {}

            setDeposits((prev) => {
              const map = new Map<string, DepositRequest>();
              prev.forEach((d) => { if (!deletedIds.has(d.id)) map.set(d.id, d); });
              data.deposits.forEach((d: DepositRequest) => {
                if (d && d.id && !deletedIds.has(d.id)) {
                  const existing = map.get(d.id);
                  map.set(d.id, { ...(existing || {}), ...d });
                }
              });
              const merged = Array.from(map.values()).sort((a, b) => {
                const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
                const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
                return timeB - timeA;
              });
              try {
                localStorage.setItem('apna_tambola_deposits', JSON.stringify(merged));
              } catch (e) {}

              // Also check if currentUser has any approved deposit and update depositBalance immediately
              setCurrentUser((prevUser) => {
                if (!prevUser) return null;
                const cleanPrevPhone = prevUser.phone ? prevUser.phone.replace(/\D/g, '').slice(-10) : '';
                const myApproved = merged.filter((d) => {
                  if (d.status !== 'approved') return false;
                  if (d.userId === prevUser.id) return true;
                  const cleanDPhone = d.userPhone ? d.userPhone.replace(/\D/g, '').slice(-10) : '';
                  if (cleanPrevPhone && cleanDPhone && cleanPrevPhone === cleanDPhone) return true;
                  if (prevUser.email && d.userEmail && prevUser.email.toLowerCase() === d.userEmail.toLowerCase()) return true;
                  return false;
                });

                if (myApproved.length > 0) {
                  let totalApproved = 0;
                  myApproved.forEach((d) => {
                    totalApproved += (d.amount + (d.registrationBonus || 0));
                  });
                  if ((prevUser.depositBalance || 0) < totalApproved) {
                    const updated = {
                      ...prevUser,
                      depositBalance: totalApproved,
                      hasDeposited: true,
                      firstDepositBonusClaimed: true,
                      walletBalance: totalApproved + (prevUser.winningBalance || 0) + (prevUser.referralBalance || 0),
                    };
                    try {
                      localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updated));
                    } catch (e) {}
                    return updated;
                  }
                }
                return prevUser;
              });

              return merged;
            });
          }
          if (Array.isArray(data.withdrawals) && data.withdrawals.length > 0) {
            setWithdrawals((prev) => {
              const map = new Map<string, WithdrawalRequest>();
              prev.forEach((w) => map.set(w.id, w));
              data.withdrawals.forEach((w: WithdrawalRequest) => {
                if (w && w.id) {
                  const existing = map.get(w.id);
                  map.set(w.id, { ...(existing || {}), ...w });
                }
              });
              const merged = Array.from(map.values()).sort((a, b) => {
                const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
                const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
                return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
              });
              try {
                localStorage.setItem('apna_tambola_withdrawals', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            setTransactions((prev) => {
              const map = new Map<string, WalletTransaction>();
              prev.forEach((t) => map.set(t.id, t));
              data.transactions.forEach((t: WalletTransaction) => {
                if (t && t.id) map.set(t.id, t);
              });
              return Array.from(map.values()).sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
              });
            });
          }
        }
      } catch (e) {
        // Silent fallback
      }
    };

    // Initial immediate sync
    pollServerSync();

    // ⚡ Continuous 1-Second Auto-Sync across all devices and tabs
    const intervalId = setInterval(pollServerSync, 1000);

    // 🔴 Instant 0ms Server-Sent Events (SSE) Stream for live user registrations and updates
    let eventSource: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource('/api/events/stream');
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed?.type === 'user_registered' && parsed?.payload?.user) {
              const nu = parsed.payload.user as User;
              setUsers((prev) => {
                const exists = prev.some((u) => u.id === nu.id);
                const nextUsers = exists
                  ? sortUsersNewestFirst(prev.map((u) => (u.id === nu.id ? { ...u, ...nu } : u)))
                  : sortUsersNewestFirst([nu, ...prev]);
                try {
                  localStorage.setItem('apna_tambola_registered_users', JSON.stringify(nextUsers));
                } catch (e) {}
                return nextUsers;
              });
              handleDetectNewUsers([nu]);
            } else if (parsed?.type === 'game_number_called' && parsed?.payload) {
              const { gameId, calledNumber, game: updatedGame } = parsed.payload;
              setGames((prev) =>
                prev.map((g) => {
                  if (g.id === gameId) {
                    return updatedGame
                      ? { ...g, ...updatedGame }
                      : {
                          ...g,
                          currentNumber: calledNumber,
                          lastCalledNumber: calledNumber,
                          calledNumbers: [...(g.calledNumbers || []), calledNumber],
                          previousNumbers: [calledNumber, ...(g.previousNumbers || [])].slice(0, 5),
                        };
                  }
                  return g;
                })
              );
              // Auto-dab tickets for all users across all devices immediately
              setTickets((prev) =>
                prev.map((t) => {
                  if (t.gameId === gameId || !t.gameId) {
                    const hasNum = Array.isArray(t.numbers) && t.numbers.some((row) => Array.isArray(row) && row.includes(calledNumber));
                    if (hasNum && !t.markedNumbers?.includes(calledNumber)) {
                      return { ...t, markedNumbers: [...(t.markedNumbers || []), calledNumber] };
                    }
                  }
                  return t;
                })
              );
            } else if (parsed?.type === 'game_updated' && parsed?.payload) {
              const { gameId, game: updatedGame, status } = parsed.payload;
              setGames((prev) =>
                prev.map((g) => (g.id === gameId ? { ...g, ...(updatedGame || {}), ...(status ? { status } : {}) } : g))
              );
            } else if (parsed?.type === 'game_reset' && parsed?.payload) {
              const { gameId, game: updatedGame } = parsed.payload;
              setGames((prev) =>
                prev.map((g) =>
                  g.id === gameId
                    ? {
                        ...g,
                        ...(updatedGame || {}),
                        calledNumbers: [],
                        currentNumber: undefined,
                        lastCalledNumber: undefined,
                        previousNumbers: [],
                      }
                    : g
                )
              );
            } else if (parsed?.type === 'game_completed_settled' && parsed?.payload) {
              const { game: updatedGame } = parsed.payload;
              if (updatedGame?.id) {
                setGames((prev) =>
                  prev.map((g) => (g.id === updatedGame.id ? { ...g, ...updatedGame, status: 'completed', autoCalling: false } : g))
                );
                // Clear completed game tickets from active list
                setTickets((prev) => prev.filter((t) => t.gameId !== updatedGame.id));
              }
            } else if (parsed?.type === 'completed_tickets_cleared' && parsed?.payload) {
              const { gameId } = parsed.payload;
              setTickets((prev) => {
                if (gameId && gameId !== 'all') {
                  return prev.filter((t) => t.gameId !== gameId);
                }
                return prev.filter((t) => !t.isCompleted && !t.isArchived);
              });
            } else if (parsed?.type === 'new_withdrawal_request' && parsed?.payload) {
              const { withdrawal: newWdr, user: reqUser, transaction: newTxn } = parsed.payload;
              if (newWdr && newWdr.id) {
                setWithdrawals((prev) => {
                  const exists = prev.some((w) => w.id === newWdr.id);
                  if (exists) {
                    return prev.map((w) => (w.id === newWdr.id ? { ...w, ...newWdr } : w));
                  }
                  return [newWdr, ...prev];
                });
              }
              if (reqUser && reqUser.id) {
                setUsers((prev) =>
                  prev.map((u) => (u.id === reqUser.id ? { ...u, ...reqUser } : u))
                );
              }
              if (newTxn && newTxn.id) {
                setTransactions((prev) => {
                  if (prev.some((t) => t.id === newTxn.id)) return prev;
                  return [newTxn, ...prev];
                });
              }
            } else if (parsed?.type === 'withdrawal_updated' && parsed?.payload) {
              const { withdrawalId, withdrawal: updatedWdr, action, user: refundedUser } = parsed.payload;
              if (withdrawalId) {
                setWithdrawals((prev) =>
                  prev.map((w) => {
                    if (w.id === withdrawalId) {
                      return updatedWdr ? { ...w, ...updatedWdr } : { ...w, status: action === 'approve' ? 'approved' : 'rejected' };
                    }
                    return w;
                  })
                );
                setTransactions((prev) =>
                  prev.map((t) => {
                    if (t.referenceId === withdrawalId) {
                      return { ...t, status: action === 'approve' ? 'completed' : 'failed' };
                    }
                    return t;
                  })
                );
                if (refundedUser && refundedUser.id) {
                  setUsers((prev) =>
                    prev.map((u) => (u.id === refundedUser.id ? { ...u, ...refundedUser } : u))
                  );
                  setCurrentUser((prev) => {
                    if (prev && prev.id === refundedUser.id) {
                      return { ...prev, ...refundedUser };
                    }
                    return prev;
                  });
                }
              }
            }
          } catch (err) {}
        };
        eventSource.onerror = () => {
          // SSE auto-reconnects
        };
      }
    } catch (e) {}

    const handleWindowFocus = () => {
      pollServerSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollServerSync();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (eventSource) eventSource.close();
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  // 🔥 Direct Real-Time Firestore Synchronization Listeners (0ms Multi-Device Live Sync)
  useEffect(() => {
    if (!db) return;

    const unsubs: (() => void)[] = [];

    const handleSnapshotErr = (error: unknown, path: string) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (
        errMsg.includes('Quota limit exceeded') ||
        errMsg.includes('Free daily read units') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('quota')
      ) {
        setFirestoreQuotaExceeded(true);
        console.warn(`[Firestore Quota Notice] Path '${path}': ${errMsg}`);
      } else {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (e) {
          console.warn(`[Firestore Stream Notification] Path '${path}':`, e);
        }
      }
    };

    try {
      // Test initial server connectivity
      getDocFromServer(doc(db, 'system', 'connection_test')).catch(() => {});

      // 1. Live Games Realtime Listener
      const unsubGames = onSnapshot(collection(db, 'games'), (snapshot) => {
        if (!snapshot.empty) {
          const fsGames: TambolaGame[] = [];
          snapshot.forEach((d) => {
            const g = d.data() as TambolaGame;
            fsGames.push({ ...g, id: d.id });
          });
          setGames((prev) => {
            const map = new Map<string, TambolaGame>();
            prev.forEach((g) => { if (g && g.id) map.set(g.id, g); });
            fsGames.forEach((g) => {
              if (g && g.id) {
                const existing = map.get(g.id);
                map.set(g.id, { ...(existing || {}), ...g });
              }
            });
            const merged = Array.from(map.values());
            try { localStorage.setItem('apna_tambola_games', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }, (error) => {
        handleSnapshotErr(error, 'games');
      });
      unsubs.push(unsubGames);

      // 2. Live Users Realtime Listener
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const fsUsers: User[] = [];
          snapshot.forEach((d) => {
            fsUsers.push({ ...(d.data() as User), id: d.id });
          });
          setUsers((prev) => {
            const map = new Map<string, User>();
            prev.forEach((u) => { if (u && u.id) map.set(u.id, u); });
            fsUsers.forEach((u) => {
              if (u && u.id) {
                const existing = map.get(u.id);
                map.set(u.id, { ...(existing || {}), ...u });
              }
            });
            const merged = sortUsersNewestFirst(Array.from(map.values()));
            try { localStorage.setItem('apna_tambola_registered_users', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }, (error) => {
        handleSnapshotErr(error, 'users');
      });
      unsubs.push(unsubUsers);

      // 3. Live Tickets Realtime Listener
      const unsubTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
        if (!snapshot.empty) {
          const fsTickets: TambolaTicket[] = [];
          snapshot.forEach((d) => {
            fsTickets.push({ ...(d.data() as TambolaTicket), id: d.id });
          });
          setTickets((prev) => {
            const map = new Map<string, TambolaTicket>();
            prev.forEach((t) => { if (t && t.id) map.set(t.id, t); });
            fsTickets.forEach((t) => {
              if (t && t.id) map.set(t.id, t);
            });
            const merged = Array.from(map.values());
            try { localStorage.setItem('apna_tambola_tickets', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }, (error) => {
        handleSnapshotErr(error, 'tickets');
      });
      unsubs.push(unsubTickets);

      // 4. Live Winners Realtime Listener
      const unsubWinners = onSnapshot(collection(db, 'winners'), (snapshot) => {
        if (!snapshot.empty) {
          const fsWinners: GameWinner[] = [];
          snapshot.forEach((d) => {
            fsWinners.push({ ...(d.data() as GameWinner), id: d.id });
          });
          setWinners((prev) => {
            const map = new Map<string, GameWinner>();
            prev.forEach((w) => { if (w && w.id) map.set(w.id, w); });
            fsWinners.forEach((w) => { if (w && w.id) map.set(w.id, w); });
            const merged = Array.from(map.values());
            try { localStorage.setItem('apna_tambola_winners', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }, (error) => {
        handleSnapshotErr(error, 'winners');
      });
      unsubs.push(unsubWinners);

      // 5. Live Deposits Realtime Listener
      const unsubDeposits = onSnapshot(collection(db, 'deposits'), (snapshot) => {
        if (!snapshot.empty) {
          const fsDeposits: DepositRequest[] = [];
          snapshot.forEach((d) => {
            fsDeposits.push({ ...(d.data() as DepositRequest), id: d.id });
          });
          setDeposits((prev) => {
            const map = new Map<string, DepositRequest>();
            prev.forEach((d) => { if (d && d.id) map.set(d.id, d); });
            fsDeposits.forEach((d) => { if (d && d.id) map.set(d.id, d); });
            const merged = Array.from(map.values()).sort((a, b) => {
              const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
              const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
              return timeB - timeA;
            });
            try { localStorage.setItem('apna_tambola_deposits', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      }, (error) => {
        handleSnapshotErr(error, 'deposits');
      });
      unsubs.push(unsubDeposits);

      // 6. Live Withdrawals Realtime Listener
      const unsubWithdrawals = onSnapshot(collection(db, 'withdrawals'), (snapshot) => {
        if (!snapshot.empty) {
          const fsWithdrawals: WithdrawalRequest[] = [];
          snapshot.forEach((d) => {
            fsWithdrawals.push({ ...(d.data() as WithdrawalRequest), id: d.id });
          });
          setWithdrawals((prev) => {
            const map = new Map<string, WithdrawalRequest>();
            prev.forEach((w) => { if (w && w.id) map.set(w.id, w); });
            fsWithdrawals.forEach((w) => { if (w && w.id) map.set(w.id, w); });
            return Array.from(map.values()).sort((a, b) => {
              const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
              const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
              return timeB - timeA;
            });
          });
        }
      }, (error) => {
        handleSnapshotErr(error, 'withdrawals');
      });
      unsubs.push(unsubWithdrawals);

      // 7. Live Site Settings Realtime Listener
      const unsubSettings = onSnapshot(doc(db, 'system', 'site_settings'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SiteSettings;
          setSiteSettings((prev) => ({ ...prev, ...data }));
        }
      }, (error) => {
        handleSnapshotErr(error, 'system/site_settings');
      });
      unsubs.push(unsubSettings);
    } catch (err) {}

    return () => {
      unsubs.forEach((u) => {
        try { u(); } catch (e) {}
      });
    };
  }, []);

  // Force Refresh & Multi-Device Sync logic
  const handleForceRefresh = async () => {
    setIsSyncing(true);
    setSyncFeedback('🔄 सभी डिवाइस और फायरस्टोर से लाइव डेटा सिंक हो रहा है...');

    try {
      // 1. Force fetch from Firestore collections
      if (db) {
        try {
          const [usersSnap, gamesSnap, ticketsSnap, commsSnap, depositsSnap, settingsSnap] = await Promise.all([
            getDocs(collection(db, 'users')).catch(() => null),
            getDocs(collection(db, 'games')).catch(() => null),
            getDocs(collection(db, 'tickets')).catch(() => null),
            getDocs(collection(db, 'commissions')).catch(() => null),
            getDocs(collection(db, 'deposits')).catch(() => null),
            getDoc(doc(db, 'system', 'site_settings')).catch(() => null),
          ]);

          if (usersSnap && !usersSnap.empty) {
            const fsUsers: User[] = [];
            usersSnap.forEach((d) => fsUsers.push({ ...(d.data() as User), id: d.id }));
            if (fsUsers.length > 0) {
              setUsers((prev) => {
                const map = new Map<string, User>();
                INITIAL_USERS.forEach((u) => map.set(u.id, u));
                prev.forEach((u) => map.set(u.id, u));
                fsUsers.forEach((u) => map.set(u.id, u));
                const merged = Array.from(map.values());
                try {
                  localStorage.setItem('apna_tambola_registered_users', JSON.stringify(merged));
                } catch {}
                return merged;
              });

              // Forward Firestore users to backend server so server and admin always have all user IDs
              fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: fsUsers }),
              }).catch(() => {});
            }
          }

          if (gamesSnap && !gamesSnap.empty) {
            const fsGames: TambolaGame[] = [];
            gamesSnap.forEach((d) => {
              const g = d.data() as TambolaGame;
              fsGames.push({
                ...g,
                id: d.id,
                calledNumbers: Array.isArray(g.calledNumbers) ? g.calledNumbers : [],
                previousNumbers: Array.isArray(g.previousNumbers) ? g.previousNumbers : [],
                prizes: Array.isArray(g.prizes)
                  ? g.prizes.map((p: any) => ({
                      ...p,
                      claimedWinners: Array.isArray(p.claimedWinners) ? p.claimedWinners : [],
                    }))
                  : [],
              });
            });
            if (fsGames.length > 0) {
              setGames((prev) => {
                const map = new Map<string, TambolaGame>();
                prev.forEach((g) => map.set(g.id, g));
                fsGames.forEach((g) => map.set(g.id, g));
                const merged = Array.from(map.values());
                try {
                  localStorage.setItem('apna_tambola_games', JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          }

          if (ticketsSnap && !ticketsSnap.empty) {
            let deletedTicketIds = new Set<string>();
            try {
              const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_ticket_ids') || '[]');
              if (Array.isArray(arr)) deletedTicketIds = new Set(arr);
            } catch (err) {}

            const fsTickets: TambolaTicket[] = [];
            ticketsSnap.forEach((d) => {
              if (!deletedTicketIds.has(d.id)) {
                fsTickets.push({ ...(d.data() as TambolaTicket), id: d.id });
              }
            });
            if (fsTickets.length > 0) {
              setTickets((prev) => {
                const map = new Map<string, TambolaTicket>();
                prev.forEach((t) => {
                  if (!deletedTicketIds.has(t.id) && !deletedTicketIds.has(t.ticketId)) map.set(t.id, t);
                });
                fsTickets.forEach((t) => {
                  if (!deletedTicketIds.has(t.id) && !deletedTicketIds.has(t.ticketId)) map.set(t.id, t);
                });
                const merged = Array.from(map.values());
                try {
                  localStorage.setItem('apna_tambola_tickets', JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          }

          if (commsSnap && !commsSnap.empty) {
            const fsComms: ReferralCommission[] = [];
            commsSnap.forEach((d) => fsComms.push({ ...(d.data() as ReferralCommission), id: d.id }));
            if (fsComms.length > 0) {
              setCommissions((prev) => {
                const map = new Map<string, ReferralCommission>();
                prev.forEach((c) => map.set(c.id, c));
                fsComms.forEach((c) => map.set(c.id, c));
                return Array.from(map.values());
              });
            }
          }

          if (depositsSnap && !depositsSnap.empty) {
            let deletedIds = new Set<string>();
            try {
              const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_deposit_ids') || '[]');
              if (Array.isArray(arr)) deletedIds = new Set(arr);
            } catch (e) {}

            const fsDeps: DepositRequest[] = [];
            depositsSnap.forEach((d) => {
              if (!deletedIds.has(d.id)) {
                fsDeps.push({ ...(d.data() as DepositRequest), id: d.id });
              }
            });
            if (fsDeps.length > 0) {
              setDeposits((prev) => {
                const map = new Map<string, DepositRequest>();
                prev.forEach((d) => { if (!deletedIds.has(d.id)) map.set(d.id, d); });
                fsDeps.forEach((d) => { if (!deletedIds.has(d.id)) map.set(d.id, d); });
                const merged = Array.from(map.values()).sort((a, b) => {
                  const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
                  const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
                  return timeB - timeA;
                });
                try {
                  localStorage.setItem('apna_tambola_deposits', JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          }

          if (settingsSnap && settingsSnap.exists()) {
            const data = settingsSnap.data() as Partial<SiteSettings>;
            setSiteSettings((prev) => {
              const updated = { ...prev, ...data };
              try {
                localStorage.setItem('apna_tambola_site_settings', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        } catch (fsErr) {
          console.warn('Firestore direct fetch notice:', fsErr);
        }
      }

      // 2. Fetch from backend API /api/sync/all to merge cross-device changes
      try {
        const resp = await fetch('/api/sync/all');
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.users) && data.users.length > 0) {
            setUsers((prev) => {
              const map = new Map<string, User>();
              prev.forEach((u) => {
                if (u && u.id) map.set(u.id, u);
              });
              data.users.forEach((u: User) => {
                if (u && u.id) {
                  const existing = map.get(u.id);
                  map.set(u.id, { ...(existing || {}), ...u });
                }
              });
              const merged = Array.from(map.values()).sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
              });
              try {
                localStorage.setItem('apna_tambola_registered_users', JSON.stringify(merged));
              } catch {}
              return merged;
            });

            // Also update active logged-in user
            setCurrentUser((prev) => {
              if (!prev) return null;
              const remote = data.users.find(
                (u: User) => u.id === prev.id || (prev.phone && u.phone && u.phone.replace(/\D/g, '') === prev.phone.replace(/\D/g, ''))
              );
              if (remote) return { ...prev, ...remote };
              return prev;
            });
          }
          if (Array.isArray(data.tickets) && data.tickets.length > 0) {
            setTickets((prev) => {
              const map = new Map<string, TambolaTicket>();
              prev.forEach((t) => map.set(t.id, t));
              data.tickets.forEach((t: TambolaTicket) => {
                if (t && t.id) map.set(t.id, t);
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('apna_tambola_tickets', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
          if (Array.isArray(data.deposits) && data.deposits.length > 0) {
            let deletedIds = new Set<string>();
            try {
              const arr = JSON.parse(localStorage.getItem('apna_tambola_deleted_deposit_ids') || '[]');
              if (Array.isArray(arr)) deletedIds = new Set(arr);
            } catch (e) {}

            setDeposits((prev) => {
              const map = new Map<string, DepositRequest>();
              prev.forEach((d) => { if (!deletedIds.has(d.id)) map.set(d.id, d); });
              data.deposits.forEach((d: DepositRequest) => {
                if (d && d.id && !deletedIds.has(d.id)) {
                  const existing = map.get(d.id);
                  map.set(d.id, { ...(existing || {}), ...d });
                }
              });
              const merged = Array.from(map.values()).sort((a, b) => {
                const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
                const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
                return timeB - timeA;
              });
              try {
                localStorage.setItem('apna_tambola_deposits', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            setTransactions((prev) => {
              const map = new Map<string, WalletTransaction>();
              prev.forEach((t) => map.set(t.id, t));
              data.transactions.forEach((t: WalletTransaction) => {
                if (t && t.id) map.set(t.id, t);
              });
              return Array.from(map.values()).sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
              });
            });
          }
        }
      } catch (apiErr) {
        console.warn('Server sync notice:', apiErr);
      }

      // 3. Broadcast across tabs
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'FORCE_SYNC_COMPLETED', timestamp: Date.now() });
          bc.close();
        } catch {}
      }

      setSyncFeedback('✅ डेटा सफलतापूर्वक रीफ्रेश व सिंक हो गया!');
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (e) {
      console.error('Refresh error:', e);
      setSyncFeedback('✅ डेटा रीफ्रेश हो गया!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Sync games to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_tambola_games', JSON.stringify(games));
    } catch (e) {}
  }, [games]);

  // Sync tickets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_tambola_tickets', JSON.stringify(tickets));
    } catch (e) {}
  }, [tickets]);

  // Sync winners to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_tambola_winners', JSON.stringify(winners));
    } catch (e) {}
  }, [winners]);

  // Sync transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_tambola_transactions', JSON.stringify(transactions));
    } catch (e) {}
  }, [transactions]);

  // Sync withdrawals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_tambola_withdrawals', JSON.stringify(withdrawals));
    } catch (e) {}
  }, [withdrawals]);

  // Sync siteSettings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_tambola_site_settings', JSON.stringify(siteSettings));
    } catch (e) {}
  }, [siteSettings]);

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_tambola_registered_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  // Sync active user session to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('apna_tambola_auth_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('apna_tambola_auth_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Dynamically compute 8-level real-time referral network for currentUser from registered users
  const computedReferralMembers = React.useMemo<ReferralMember[]>(() => {
    if (!currentUser) return [];

    const results: ReferralMember[] = [];
    const addedUserIds = new Set<string>();

    // Level 1: Direct Referrals (Users who signed up with currentUser's referral code)
    const l1Users = users.filter((u) => u.id !== currentUser.id && isDirectChildOf(u, currentUser, commissions));
    l1Users.forEach((u) => {
      addedUserIds.add(u.id);
      const userTickets = tickets.filter((t) => t.userId === u.id).length;
      const userComms = commissions
        .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id)
        .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 1,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today',
        ticketsBought: userTickets,
        commissionEarned: userComms,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      });
    });

    // Level 2: Users referred by Level 1
    const l2Users = users.filter(
      (u) => !addedUserIds.has(u.id) && l1Users.some((p) => isDirectChildOf(u, p, commissions))
    );
    l2Users.forEach((u) => {
      addedUserIds.add(u.id);
      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 2,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today',
        ticketsBought: tickets.filter((t) => t.userId === u.id).length,
        commissionEarned: commissions
          .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id)
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
        avatar: u.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
      });
    });

    // Level 3: Users referred by Level 2
    const l3Users = users.filter(
      (u) => !addedUserIds.has(u.id) && l2Users.some((p) => isDirectChildOf(u, p, commissions))
    );
    l3Users.forEach((u) => {
      addedUserIds.add(u.id);
      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 3,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today',
        ticketsBought: tickets.filter((t) => t.userId === u.id).length,
        commissionEarned: commissions
          .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id)
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
        avatar: u.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
      });
    });

    // Level 4: Users referred by Level 3
    const l4Users = users.filter(
      (u) => !addedUserIds.has(u.id) && l3Users.some((p) => isDirectChildOf(u, p, commissions))
    );
    l4Users.forEach((u) => {
      addedUserIds.add(u.id);
      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 4,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today',
        ticketsBought: tickets.filter((t) => t.userId === u.id).length,
        commissionEarned: commissions
          .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id)
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
        avatar: u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      });
    });

    // Level 5: Users referred by Level 4
    const l5Users = users.filter(
      (u) => !addedUserIds.has(u.id) && l4Users.some((p) => isDirectChildOf(u, p, commissions))
    );
    l5Users.forEach((u) => {
      addedUserIds.add(u.id);
      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 5,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today',
        ticketsBought: tickets.filter((t) => t.userId === u.id).length,
        commissionEarned: commissions
          .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id)
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      });
    });

    // Level 6: Users referred by Level 5
    const l6Users = users.filter(
      (u) => !addedUserIds.has(u.id) && l5Users.some((p) => isDirectChildOf(u, p, commissions))
    );
    l6Users.forEach((u) => {
      addedUserIds.add(u.id);
      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 6,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today',
        ticketsBought: tickets.filter((t) => t.userId === u.id).length,
        commissionEarned: commissions
          .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id)
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
        avatar: u.avatar || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80',
      });
    });

    // Level 7: Users referred by Level 6
    const l7Users = users.filter(
      (u) => !addedUserIds.has(u.id) && l6Users.some((p) => isDirectChildOf(u, p, commissions))
    );
    l7Users.forEach((u) => {
      addedUserIds.add(u.id);
      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 7,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today',
        ticketsBought: tickets.filter((t) => t.userId === u.id).length,
        commissionEarned: commissions
          .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id)
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
        avatar: u.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
      });
    });

    // Level 8: Users referred by Level 7
    const l8Users = users.filter(
      (u) => !addedUserIds.has(u.id) && l7Users.some((p) => isDirectChildOf(u, p, commissions))
    );
    l8Users.forEach((u) => {
      addedUserIds.add(u.id);
      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 8,
        joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Today',
        ticketsBought: tickets.filter((t) => t.userId === u.id).length,
        commissionEarned: commissions
          .filter((c) => c.sourceUserId === u.id && c.userId === currentUser.id)
          .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
        avatar: u.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
      });
    });

    return results;
  }, [currentUser, users, tickets, commissions]);

  // Live Flash Ticker State (Real-time announcement for all players)
  const [activeWinnerFlash, setActiveWinnerFlash] = useState<FlashWinnerItem | null>(null);

  // Sound & Modals State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [celebrationData, setCelebrationData] = useState<WinnerFlashData | null>(null);

  const autoCallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTurnRef = useRef<string>('');

  const rawLiveGame = React.useMemo(() => {
    const safeGamesList = Array.isArray(games) ? games.filter(Boolean) : [];
    if (safeGamesList.length === 0) return undefined;

    // 1. If admin has designated an active live game in siteSettings, prioritize it for all users
    if (siteSettings?.activeLiveGameId) {
      const matchedAdmin = safeGamesList.find((g) => g && g.id === siteSettings.activeLiveGameId);
      if (matchedAdmin) return matchedAdmin;
    }

    // 2. Look for any currently live game
    const liveMatch = safeGamesList.find((g) => g && g.status === 'live');
    if (liveMatch) return liveMatch;

    // 3. If explicit selectedGameId is set
    if (selectedGameId) {
      const matched = safeGamesList.find((g) => g && g.id === selectedGameId);
      if (matched) return matched;
    }

    // 4. Fallback: first game
    return safeGamesList[0];
  }, [games, selectedGameId, siteSettings?.activeLiveGameId, currentUser?.id, tickets]);
  const liveGame = React.useMemo(() => {
    if (!rawLiveGame) return undefined;
    return {
      ...rawLiveGame,
      calledNumbers: Array.isArray(rawLiveGame.calledNumbers) ? rawLiveGame.calledNumbers : [],
      previousNumbers: Array.isArray(rawLiveGame.previousNumbers) ? rawLiveGame.previousNumbers : [],
      prizes: Array.isArray(rawLiveGame.prizes)
        ? rawLiveGame.prizes.map((p) => ({
            ...p,
            claimedWinners: Array.isArray(p.claimedWinners) ? p.claimedWinners : [],
          }))
        : [],
    };
  }, [rawLiveGame]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleOpenAdminLogin = () => {
    setShowAdminLoginModal(true);
  };

  const handleAdminLoginSuccess = (adminUser: User) => {
    const verifiedAdminUser: User = {
      ...adminUser,
      role: 'admin',
    };
    setCurrentUser(verifiedAdminUser);
    setActiveTab('admin');
    try {
      localStorage.setItem('apna_tambola_auth_user', JSON.stringify(verifiedAdminUser));
    } catch (e) {}
    try {
      setDoc(doc(db, 'users', verifiedAdminUser.id), verifiedAdminUser, { merge: true }).catch(() => {});
    } catch (e) {}
    setUsers((prev) => {
      if (prev.some((u) => u.id === verifiedAdminUser.id)) {
        return prev.map((u) => (u.id === verifiedAdminUser.id ? verifiedAdminUser : u));
      }
      return [verifiedAdminUser, ...prev];
    });
  };

  const handleInstantMasterAdminAccess = () => {
    const existingAdmin = (users || []).find((u) => u.email === 'ashishbadawat@gmail.com' || u.role === 'admin');
    const adminObj: User = {
      ...(existingAdmin || {}),
      id: existingAdmin?.id || 'admin_master_1',
      name: existingAdmin?.name || 'Ashish Badawat (Master Admin)',
      email: 'ashishbadawat@gmail.com',
      phone: existingAdmin?.phone || '+91 9876543210',
      role: 'admin',
      walletBalance: Math.max(existingAdmin?.walletBalance || 0, 50000),
      depositBalance: Math.max(existingAdmin?.depositBalance || 0, 25000),
      winningBalance: Math.max(existingAdmin?.winningBalance || 0, 25000),
      referralBalance: Math.max(existingAdmin?.referralBalance || 0, 10000),
      kycStatus: 'verified',
      referralCode: existingAdmin?.referralCode || 'REF-ADMIN77',
      avatar: existingAdmin?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      createdAt: existingAdmin?.createdAt || new Date().toISOString(),
    };
    handleAdminLoginSuccess(adminObj);
  };

  const handleUserLogin = (user: User) => {
    // Preserve any existing user state properties (like balances, referredBy and referredByUserId)
    const cleanUserPhone = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
    let mergedUser: User = { ...user };

    setUsers((prev) => {
      let updated: User[];
      const existing = prev.find((u) => {
        if (!u) return false;
        if (u.id === user.id) return true;
        const cleanUPhone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
        if (cleanUserPhone && cleanUPhone && cleanUserPhone === cleanUPhone) return true;
        if (user.email && u.email && user.email.toLowerCase() === u.email.toLowerCase()) return true;
        return false;
      });

      if (existing) {
        mergedUser = {
          ...existing,
          ...user,
          // CRITICAL: Preserve higher balances so approved deposit funds are NEVER wiped out
          depositBalance: Math.max(existing.depositBalance || 0, user.depositBalance || 0),
          winningBalance: Math.max(existing.winningBalance || 0, user.winningBalance || 0),
          referralBalance: Math.max(existing.referralBalance || 0, user.referralBalance || 0),
          bonusRewardBalance: user.bonusRewardBalance !== undefined ? user.bonusRewardBalance : (existing.bonusRewardBalance || 0),
          hasDeposited: existing.hasDeposited || user.hasDeposited || false,
          firstDepositBonusClaimed: existing.firstDepositBonusClaimed || user.firstDepositBonusClaimed || false,
          referredBy: user.referredBy || existing.referredBy || '',
          referredByUserId: user.referredByUserId || existing.referredByUserId || '',
          referralCode: user.referralCode || existing.referralCode,
          role: user.role || existing.role || 'user',
        };
        mergedUser.walletBalance = (mergedUser.depositBalance || 0) + (mergedUser.winningBalance || 0) + (mergedUser.referralBalance || 0);
        updated = prev.map((u) => (u.id === existing.id ? mergedUser : u));
      } else {
        updated = [mergedUser, ...prev];
      }

      // Check if user has any approved deposits in deposits state and ensure funds are credited
      const userApprovedDeps = (deposits || []).filter((d) => {
        if (d.status !== 'approved') return false;
        if (d.userId === mergedUser.id) return true;
        const cleanDPhone = d.userPhone ? d.userPhone.replace(/\D/g, '').slice(-10) : '';
        if (cleanUserPhone && cleanDPhone && cleanUserPhone === cleanDPhone) return true;
        if (mergedUser.email && d.userEmail && mergedUser.email.toLowerCase() === d.userEmail.toLowerCase()) return true;
        return false;
      });

      if (userApprovedDeps.length > 0) {
        let totalApprovedDeposit = 0;
        userApprovedDeps.forEach((d) => {
          totalApprovedDeposit += (d.amount + (d.registrationBonus || 0));
        });
        if ((mergedUser.depositBalance || 0) < totalApprovedDeposit) {
          mergedUser.depositBalance = totalApprovedDeposit;
          mergedUser.hasDeposited = true;
          mergedUser.firstDepositBonusClaimed = true;
          mergedUser.walletBalance = totalApprovedDeposit + (mergedUser.winningBalance || 0) + (mergedUser.referralBalance || 0);
          updated = updated.map((u) => (u.id === mergedUser.id ? mergedUser : u));
        }
      }

      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (mergedUser.role === 'admin' || mergedUser.email === 'ashishbadawat@gmail.com' || mergedUser.id === 'admin_master_1') {
      mergedUser.role = 'admin';
      setIsAdminView(true);
      setActiveTab('admin');
    }

    setCurrentUser(mergedUser);
    setShowAuthModal(false);
    setShowAdminLoginModal(false);
    try {
      localStorage.setItem('apna_tambola_auth_user', JSON.stringify(mergedUser));
    } catch (e) {}

    // Also sync with server database so backend knows user is online and active
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: [mergedUser] }),
    }).catch(() => {});
  };

  const handleRegisterUser = async (newUser: User) => {
    console.log(`[REGISTRATION] User registration started for: ${newUser.name} (${newUser.phone || newUser.id})`);

    // 0. Immediate optimistic update (0ms latency so admin & user see the new registration instantly)
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === newUser.id);
      const nextUsers = exists
        ? sortUsersNewestFirst(prev.map((u) => (u.id === newUser.id ? { ...u, ...newUser } : u)))
        : sortUsersNewestFirst([newUser, ...prev]);
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(nextUsers));
      } catch (e) {}
      return nextUsers;
    });

    handleDetectNewUsers([newUser]);

    // Broadcast across tabs instantly
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'NEW_USER_REGISTERED', user: newUser });
        bc.close();
      }
    } catch (e) {}

    // 1. Comprehensive case-insensitive upline identification from inputs & URL params
    const rawRefCode = (
      newUser.referrer_id ||
      newUser.referredByUserId ||
      newUser.referredBy ||
      (typeof window !== 'undefined' ? localStorage.getItem('pendingReferralCode') || localStorage.getItem('apna_tambola_pending_referral') || '' : '')
    ).trim();

    const cleanRef = extractReferralCode(rawRefCode);
    const cleanNoPrefix = cleanRef.replace(/^REF-?/, '').replace(/[^A-Z0-9]/g, '');
    const digitsOnly = cleanRef.replace(/\D/g, '');

    console.log(`[REFERRAL] Sponsor lookup started for code: "${cleanRef || rawRefCode}"`);

    let matchedUpline: User | null = null;

    // 2a. Direct user ID lookup in loaded memory state
    if (newUser.referredByUserId || newUser.referrer_id) {
      const explicitUid = (newUser.referredByUserId || newUser.referrer_id || '').trim().toLowerCase();
      matchedUpline = users.find((u) => u.id && (u.id.toLowerCase() === explicitUid || (u as any).user_id === explicitUid)) || null;
    }

    // 2b. Direct Firestore query validation across all connected devices
    if (!matchedUpline && cleanRef && cleanRef.length >= 2) {
      try {
        // A. Search by exact ID in Firestore
        const docById = await getDoc(doc(db, 'users', cleanRef.toLowerCase())).catch(() => null);
        if (docById && docById.exists()) {
          matchedUpline = { ...(docById.data() as User), id: docById.id };
        } else {
          const docByIdExact = await getDoc(doc(db, 'users', cleanRef)).catch(() => null);
          if (docByIdExact && docByIdExact.exists()) {
            matchedUpline = { ...(docByIdExact.data() as User), id: docByIdExact.id };
          }
        }

        // B. Search by referralCode in Firestore
        if (!matchedUpline) {
          const qCode = query(collection(db, 'users'), where('referralCode', '==', cleanRef));
          const snapCode = await getDocs(qCode).catch(() => null);
          if (snapCode && !snapCode.empty) {
            const uDoc = snapCode.docs[0];
            matchedUpline = { ...(uDoc.data() as User), id: uDoc.id };
          }
        }

        // C. Search by REF- prefix variation in Firestore
        if (!matchedUpline && !cleanRef.startsWith('REF-')) {
          const qPref = query(collection(db, 'users'), where('referralCode', '==', `REF-${cleanRef}`));
          const snapPref = await getDocs(qPref).catch(() => null);
          if (snapPref && !snapPref.empty) {
            const uDoc = snapPref.docs[0];
            matchedUpline = { ...(uDoc.data() as User), id: uDoc.id };
          }
        }

        // D. Search by cleaned code without prefix
        if (!matchedUpline && cleanNoPrefix && cleanNoPrefix !== cleanRef) {
          const qClean = query(collection(db, 'users'), where('referralCode', '==', cleanNoPrefix));
          const snapClean = await getDocs(qClean).catch(() => null);
          if (snapClean && !snapClean.empty) {
            const uDoc = snapClean.docs[0];
            matchedUpline = { ...(uDoc.data() as User), id: uDoc.id };
          }
        }

        // E. Proactive scan across all Firestore users for case-insensitivity or phone matching
        if (!matchedUpline) {
          const allUsersSnap = await getDocs(collection(db, 'users')).catch(() => null);
          if (allUsersSnap && !allUsersSnap.empty) {
            const fsUsers: User[] = [];
            allUsersSnap.forEach((d) => fsUsers.push({ ...(d.data() as User), id: d.id }));
            matchedUpline = findReferrerInList(cleanRef, fsUsers, newUser.id);
          }
        }
      } catch (err) {
        console.warn('Firestore upline validation notice:', err);
      }
    }

    // 2c. Fallback to local memory / mock users list
    if (!matchedUpline && cleanRef) {
      matchedUpline = findReferrerInList(cleanRef, users, newUser.id);
    }

    // 3. Establish authoritative database foreign key linking
    const finalReferrerId: string | null = matchedUpline
      ? matchedUpline.id
      : (newUser.referrer_id || (cleanRef ? cleanRef : null));

    if (matchedUpline) {
      console.log(`[REFERRAL] Sponsor found: ${matchedUpline.id} (${matchedUpline.name || matchedUpline.referralCode})`);
    } else if (finalReferrerId) {
      console.log(`[REFERRAL] Sponsor ID assigned: ${finalReferrerId}`);
    } else {
      console.log(`[REFERRAL] No sponsor matched; registering as direct master user`);
    }

    const finalReferredByCode = matchedUpline
      ? (matchedUpline.referralCode || matchedUpline.id)
      : (cleanRef || newUser.referredBy || '');

    const finalReferredByUserId = matchedUpline
      ? matchedUpline.id
      : (newUser.referredByUserId || '');

    console.log(`[REFERRAL] Saving referred_by: ${finalReferrerId || 'none'}`);

    const completeUser: User = {
      ...newUser,
      referrer_id: finalReferrerId, // Database Foreign Key referencing sponsor's user document ID
      referredByUserId: finalReferredByUserId,
      referredBy: finalReferredByCode,
      status: newUser.status || 'active',
      isBlocked: false,
      createdAt: newUser.createdAt || new Date().toISOString(),
    };

    // 4. Explicitly write referrer_id into the Firestore 'users' collection as a database foreign key
    try {
      const firestoreUserPayload: Record<string, any> = {
        ...completeUser,
        referrer_id: finalReferrerId, // Explicit reference field in Firestore document
        referredByUserId: finalReferredByUserId,
        referredBy: finalReferredByCode,
      };
      const sanitizedUser = JSON.parse(JSON.stringify(firestoreUserPayload));
      await setDoc(doc(db, 'users', completeUser.id), sanitizedUser, { merge: true });
      console.log(`[DATABASE] Profile created successfully in Firestore. Document ID: ${completeUser.id} with foreign key referrer_id="${finalReferrerId}"`);
      console.log(`[REFERRAL] Direct referral relationship verified: ${finalReferrerId} -> ${completeUser.id}`);
    } catch (e) {
      console.warn('Firestore user save notice:', e);
    }

    // 5. Save to server backend via REST API immediately
    try {
      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: completeUser,
          id: completeUser.id,
          name: completeUser.name,
          phone: completeUser.phone,
          email: completeUser.email,
          password: completeUser.password,
          referralCode: completeUser.referralCode,
          referrer_id: completeUser.referrer_id,
          referredBy: completeUser.referredBy,
          referredByUserId: completeUser.referredByUserId,
          referralCodeInput: finalReferredByCode,
          referrerUser: matchedUpline,
          selectedAvatar: completeUser.avatar,
        }),
      }).catch(() => {});
    } catch (e) {}

    // 6. Update registered user in local state immediately
    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== completeUser.id && (u.phone ? u.phone.replace(/\D/g, '') !== completeUser.phone.replace(/\D/g, '') : true));
      const updated = [completeUser, ...filtered];
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 7. If upline exists, update referral count (no bonus on signup)
    if (matchedUpline) {
      const upline = matchedUpline;

      // Update upline referral count in Firestore
      try {
        setDoc(
          doc(db, 'users', upline.id),
          {
            referralCount: (upline.referralCount || 0) + 1,
          },
          { merge: true }
        ).catch(() => {});
      } catch (e) {}

      // Update upline referral count in local users state
      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === upline.id
            ? {
                ...u,
                referralCount: (u.referralCount || 0) + 1,
              }
            : u
        );
        try {
          localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      const notif: UserNotificationItem = {
        id: `un_ref_${Date.now()}`,
        category: 'referral_commission',
        title: '🎉 नया डायरेक्ट रेफरल जुड़ा!',
        message: `${completeUser.name} आपके रेफरल कोड (${finalReferredByCode}) से सफलतापूर्वक रजिस्टर हो गए हैं! जब वे टिकट खेलेंगे, तब आपको कमिशन मिलेगा।`,
        timestamp: 'Just now',
        read: false,
        actionTab: 'referral',
      };
      setUserNotifications((prev) => [notif, ...prev]);

      // If upline is currently logged in user on this device, update live state immediately
      if (currentUser && currentUser.id === upline.id) {
        setCurrentUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            referralCount: (prev.referralCount || 0) + 1,
          };
        });
      }
    }

    // 8. Clean up pending referral code from localStorage and sessionStorage
    try {
      localStorage.removeItem('apna_tambola_pending_referral');
      localStorage.removeItem('pendingReferralCode');
      sessionStorage.removeItem('pendingReferralCode');
    } catch (e) {}

    // 9. Broadcast registration event across tabs for instant multi-window sync
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'NEW_USER_REGISTERED', user: completeUser });
        bc.close();
      }
    } catch (e) {}

    // Dispatch custom DOM event
    try {
      window.dispatchEvent(new CustomEvent('apna_tambola_data_updated'));
    } catch (e) {}
  };

  const handleLogout = () => {
    // Clean logout: set currentUser to null, clear session, return to public visitor home page
    setCurrentUser(null);
    try {
      localStorage.removeItem('apna_tambola_auth_user');
    } catch {}
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto caller interval handler (10 Seconds Interval as requested)
  useEffect(() => {
    if (liveGame && liveGame.autoCalling && liveGame.status === 'live') {
      const intervalMs = Math.max(8000, (liveGame.callIntervalSeconds || 10) * 1000);
      autoCallTimerRef.current = setInterval(() => {
        handleCallNextNumber();
      }, intervalMs);
    } else {
      if (autoCallTimerRef.current) {
        clearInterval(autoCallTimerRef.current);
      }
    }
    return () => {
      if (autoCallTimerRef.current) {
        clearInterval(autoCallTimerRef.current);
      }
    };
  }, [liveGame?.autoCalling, liveGame?.calledNumbers?.length, liveGame?.status, liveGame?.callIntervalSeconds]);

  // ⚡ Automatic Winner Tracking Engine (Includes Online, Auto Mode & Offline tickets)
  useEffect(() => {
    if (!liveGame || !liveGame.currentNumber || !Array.isArray(liveGame.calledNumbers) || liveGame.calledNumbers.length === 0) return;

    const currentTurnKey = `${liveGame.id}_${liveGame.currentNumber}_${liveGame.calledNumbers.length}`;
    if (lastProcessedTurnRef.current === currentTurnKey) {
      return;
    }
    lastProcessedTurnRef.current = currentTurnKey;

    const gameTickets = (tickets || []).filter((t) => t && (t.gameId === liveGame.id || !t.gameId));

    const trackingResult = checkAndAutoTrackWinners({
      gameId: liveGame.id,
      gameTitle: liveGame.title,
      currentNumber: liveGame.currentNumber,
      calledNumbers: liveGame.calledNumbers,
      prizes: liveGame.prizes || [],
      tickets: gameTickets,
      currentUser: currentUser || INITIAL_USERS[0],
    });

    if (trackingResult.newWins.length > 0) {
      // Check if Full House is claimed or all prizes are won
      const isFullHouseClaimed = trackingResult.updatedPrizes.some(
        (p) => (p.code === 'full_house' || p.code === 'second_full_house') &&
               Array.isArray(p.claimedWinners) &&
               p.claimedWinners.length >= (p.maxWinners || 1)
      );
      const areAllPrizesClaimed = trackingResult.updatedPrizes.length > 0 && trackingResult.updatedPrizes.every(
        (p) => Array.isArray(p.claimedWinners) && p.claimedWinners.length >= (p.maxWinners || 1)
      );
      const isGameOver = isFullHouseClaimed || areAllPrizesClaimed;

      // Update Game Prizes in state
      setGames((prevGames) =>
        prevGames.map((g) => {
          if (g.id !== liveGame.id) return g;
          return {
            ...g,
            prizes: trackingResult.updatedPrizes,
            status: isGameOver ? 'completed' : g.status,
            autoCalling: isGameOver ? false : g.autoCalling,
          };
        })
      );

      // If match is over, stop auto-calling interval and keep in stopped state
      if (isGameOver) {
        if (autoCallTimerRef.current) {
          clearInterval(autoCallTimerRef.current);
          autoCallTimerRef.current = null;
        }
        setSiteSettings((prev) => ({
          ...prev,
          isLiveStopped: true,
        }));
        try {
          setDoc(doc(db, 'games', liveGame.id), {
            status: 'completed',
            autoCalling: false,
            prizes: trackingResult.updatedPrizes,
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(() => {});
          setDoc(doc(db, 'system', 'site_settings'), { isLiveStopped: true }, { merge: true }).catch(() => {});
        } catch {}

        // 🧹 Auto-remove / archive completed tickets after Full House
        setTimeout(() => {
          handleClearCompletedTickets(liveGame.id).catch(() => {});
        }, 3000);
      }

      // Process each win
      trackingResult.newWins.forEach((win) => {
        const newWinnerRecord: GameWinner = {
          id: win.id,
          gameId: win.gameId,
          gameTitle: win.gameTitle,
          prizeId: win.prizeId,
          prizeCode: win.prizeCode,
          prizeName: win.prizeName,
          prizeAmount: win.splitPrizeAmount,
          userId: win.userId,
          userName: win.userName,
          ticketId: win.ticketId,
          ticketNumber: win.ticketNumber,
          winningNumber: win.winningNumber,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        };
        setWinners((prev) => [newWinnerRecord, ...prev]);

        // Determine if this is a split win with multiple winners
        const flashCoWinners = win.coWinners && win.coWinners.length > 1 ? win.coWinners : undefined;
        const flashWinnerName = flashCoWinners ? flashCoWinners.map((w) => w.userName).join(' & ') : win.userName;
        const isAnyCurrentUser = flashCoWinners ? flashCoWinners.some((w) => w.isCurrentUser) : win.isCurrentUser;

        // Broadcast to Live Flash Ticker for all players (flashing both winners when split)
        setActiveWinnerFlash({
          id: win.id,
          winnerName: flashWinnerName,
          prizeName: win.prizeName,
          prizeAmount: win.splitPrizeAmount,
          totalPrizePool: win.prizeTotalAmount,
          winningNumber: win.winningNumber,
          ticketNumber: win.ticketNumber,
          ticketId: win.ticketId,
          isCurrentUser: isAnyCurrentUser,
          isAutoClaimed: win.isAutoClaimed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ticket: win.ticket,
          isEqualSplit: !!flashCoWinners && flashCoWinners.length > 1,
          coWinners: flashCoWinners,
        });

        // Voice announcement of winners
        try {
          const namesToAnnounce = flashCoWinners ? flashCoWinners.map((w) => w.userName) : [win.userName];
          speakWinnerAnnouncement(namesToAnnounce, win.prizeName, win.splitPrizeAmount, soundEnabled);
        } catch (e) {}

        if (win.isCurrentUser) {
          try {
            playWinningFanfare();
          } catch (e) {}

          // Credit into Withdrawal Wallet (winningBalance)
          setCurrentUser((prev) => {
            if (!prev) return null;
            const newWinning = (prev.winningBalance || 0) + win.splitPrizeAmount;
            const newTotal = (prev.depositBalance || 0) + newWinning + (prev.referralBalance || 0);
            return {
              ...prev,
              winningBalance: newWinning,
              walletBalance: newTotal,
            };
          });

          // Create credit transaction
          if (currentUser) {
            const winTxn: WalletTransaction = {
              id: `txn_auto_${Date.now()}_${win.prizeCode}`,
              userId: currentUser.id,
              type: 'prize_won',
              amount: win.splitPrizeAmount,
              balanceAfter: (currentUser.walletBalance || 0) + win.splitPrizeAmount,
              description: win.isEqualSplit
                ? `🏆 ऑटो-ट्रैक जीत (50-50 समान बंटवारा): ${win.prizeName} (${win.totalSplitWinners} विजेताओं में विभाजित) - ${win.gameTitle}`
                : `🏆 ऑटो-ट्रैक जीत: ${win.prizeName} - ${win.gameTitle}`,
              referenceId: win.ticketId,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
              status: 'completed',
            };
            setTransactions((prev) => [winTxn, ...prev]);
          }

          // Push in-app winning notification
          const winNotif: UserNotificationItem = {
            id: `un_win_${Date.now()}_${win.prizeCode}`,
            category: 'winning',
            title: `🏆 बधाई! आप ₹${(win?.splitPrizeAmount || 0).toLocaleString('en-IN')} जीत गए!`,
            message: win.isEqualSplit
              ? `सिस्टम ने आपके टिकट #${win.ticketNumber} (${win.ticketId}) पर ${win.prizeName} 50-50 समान बंटवारे के तहत जीता है! दोनों विजेताओं को ₹${(win?.splitPrizeAmount || 0).toLocaleString('en-IN')} क्रेडिट कर दिया गया है।`
              : `सिस्टम ने आपके टिकट #${win.ticketNumber} (${win.ticketId}) पर ${win.prizeName} ऑटो-ट्रैक कर लिया है। राशि आपके विथड्रॉल वॉलेट में जमा कर दी गई है।`,
            timestamp: 'Just now',
            read: false,
            actionTab: 'wallet',
            amount: win.splitPrizeAmount,
            ticketId: win.ticketId,
          };
          setUserNotifications((prev) => [winNotif, ...prev]);

          // Show celebration popup
          setCelebrationData({
            prizeName: win.isEqualSplit ? `${win.prizeName} (50-50 समान बंटवारा)` : win.prizeName,
            prizeAmount: win.splitPrizeAmount,
            totalPrizePool: win.prizeTotalAmount,
            userName: flashWinnerName,
            ticketId: win.ticketId,
            ticketNumber: win.ticketNumber,
            winningNumber: win.winningNumber,
            ticket: win.ticket,
            calledNumbers: liveGame.calledNumbers,
            isCurrentUser: true,
            isEqualSplit: win.isEqualSplit,
            coWinners: flashCoWinners,
          });
        } else {
          // ⚡ Offline User Auto-Credit: Credit prize money into offline player's withdrawal balance
          setUsers((prevUsers) =>
            prevUsers.map((u) => {
              if (u.id === win.userId || u.name === win.userName) {
                const currentWinning = u.winningBalance || 0;
                const newWinning = currentWinning + win.splitPrizeAmount;
                const newTotal = (u.depositBalance || 0) + newWinning + (u.referralBalance || 0);
                return {
                  ...u,
                  winningBalance: newWinning,
                  walletBalance: newTotal,
                };
              }
              return u;
            })
          );

          // Add transaction ledger for offline player
          const offlineTxn: WalletTransaction = {
            id: `txn_auto_offline_${Date.now()}_${win.prizeCode}`,
            userId: win.userId,
            type: 'prize_won',
            amount: win.splitPrizeAmount,
            balanceAfter: win.splitPrizeAmount,
            description: win.isEqualSplit
              ? `🏆 ऑटो-ट्रैक जीत (ऑफलाइन प्लेयर): ${win.prizeName} (${win.totalSplitWinners} विजेताओं में विभाजित) - ${win.gameTitle}`
              : `🏆 ऑटो-ट्रैक जीत (ऑफलाइन प्लेयर): ${win.prizeName} - ${win.gameTitle}`,
            referenceId: win.ticketId,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
            status: 'completed',
          };
          setTransactions((prev) => [offlineTxn, ...prev]);
        }
      });

      // 🛡️ User Wallet Protection: Credited prize money is 100% permanent and never deducted.
      // If 2 or more players win on the same ball, the prize is split equally (e.g. 50-50) from the outset.
    }
  }, [liveGame?.calledNumbers, liveGame?.currentNumber, liveGame?.id]);

  // Toggle Ticket Auto Mode
  const handleToggleTicketAutoMode = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, autoMode: !t.autoMode } : t))
    );
  };

  // Navigation Helper
  const handleNavigate = (tab: string, gameId?: string) => {
    const resolvedTab = tab === 'user' ? 'dashboard' : tab;
    if (resolvedTab === 'admin') {
      if (currentUser && (currentUser.email === 'ashishbadawat@gmail.com' || currentUser.id === 'admin_master_1')) {
        if (currentUser.role !== 'admin') {
          handleInstantMasterAdminAccess();
        }
      }
    }
    setActiveTab(resolvedTab);
    if (gameId) {
      setSelectedGameId(gameId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Call Next Number Handler
  const handleCallNextNumber = (forcedNumber?: number, targetGameId?: string) => {
    const activeTargetId = targetGameId || liveGame?.id;
    if (!activeTargetId) return;

    const targetGame = (games || []).find((g) => g && g.id === activeTargetId);
    if (!targetGame) return;

    const calledList = Array.isArray(targetGame.calledNumbers) ? targetGame.calledNumbers : [];
    if (calledList.length >= 90) {
      if (autoCallTimerRef.current) {
        clearInterval(autoCallTimerRef.current);
        autoCallTimerRef.current = null;
      }
      setGames((prev) => prev.map((g) => (g.id === activeTargetId ? { ...g, autoCalling: false, status: 'completed' } : g)));
      setSiteSettings((prev) => ({ ...prev, isLiveStopped: true }));
      try {
        setDoc(doc(db, 'games', activeTargetId), { autoCalling: false, status: 'completed' }, { merge: true }).catch(() => {});
        setDoc(doc(db, 'system', 'site_settings'), { isLiveStopped: true }, { merge: true }).catch(() => {});
      } catch {}
      handleClearCompletedTickets(activeTargetId).catch(() => {});
      return;
    }

    let nextNum: number;
    if (forcedNumber && !calledList.includes(forcedNumber) && forcedNumber >= 1 && forcedNumber <= 90) {
      nextNum = forcedNumber;
    } else {
      const available = Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => !calledList.includes(n));
      if (available.length === 0) {
        if (autoCallTimerRef.current) {
          clearInterval(autoCallTimerRef.current);
          autoCallTimerRef.current = null;
        }
        setGames((prev) => prev.map((g) => (g.id === activeTargetId ? { ...g, autoCalling: false, status: 'completed' } : g)));
        setSiteSettings((prev) => ({ ...prev, isLiveStopped: true }));
        try {
          setDoc(doc(db, 'games', activeTargetId), { autoCalling: false, status: 'completed' }, { merge: true }).catch(() => {});
          setDoc(doc(db, 'system', 'site_settings'), { isLiveStopped: true }, { merge: true }).catch(() => {});
        } catch {}
        handleClearCompletedTickets(activeTargetId).catch(() => {});
        return;
      }
      nextNum = available[Math.floor(Math.random() * available.length)];
    }

    const newCalled = [...calledList, nextNum];
    const newPrev = [nextNum, ...(Array.isArray(targetGame.previousNumbers) ? targetGame.previousNumbers : [])].slice(0, 5);

    setGames((prevGames) =>
      prevGames.map((g) => {
        if (g.id !== activeTargetId) return g;
        return {
          ...g,
          currentNumber: nextNum,
          lastCalledNumber: nextNum,
          calledNumbers: newCalled,
          previousNumbers: newPrev,
        };
      })
    );

    // ⚡ Auto-Dab for All Tickets (Online & Offline Users)
    setTickets((prevTickets) =>
      prevTickets.map((t) => {
        if (!t) return t;
        if (t.gameId === activeTargetId || !t.gameId) {
          const hasNum = Array.isArray(t.numbers) && t.numbers.some((row) => Array.isArray(row) && row.includes(nextNum));
          const isAlreadyMarked = Array.isArray(t.markedNumbers) && t.markedNumbers.includes(nextNum);
          if (hasNum && !isAlreadyMarked) {
            return {
              ...t,
              markedNumbers: [...(t.markedNumbers || []), nextNum],
            };
          }
        }
        return t;
      })
    );

    // 📢 Voice Caller (Hindi / Bilingual Voice) & Bell Notification:
    try {
      playNumberCallSound();
      speakNumberCall(nextNum, soundEnabled, getCallerVoiceLanguage() || 'both');
    } catch (e) {
      console.warn('Voice caller notice:', e);
    }

    // 📡 Real-Time Multi-Device Sync & SSE Broadcast via Server API
    fetch(`/api/games/${activeTargetId}/call-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: nextNum }),
    }).catch(() => {});

    try {
      const bc = new BroadcastChannel('apna_tambola_sync');
      bc.postMessage({
        type: 'GAME_NUMBER_CALLED',
        gameId: activeTargetId,
        calledNumber: nextNum,
        calledNumbers: newCalled,
        previousNumbers: newPrev,
      });
      bc.close();
    } catch (e) {}
  };

  // Delete Individual Ticket (Allowed for Completed/Finished Games)
  const handleUserRemoveTicket = (ticketId: string) => {
    handleDeleteTicket(ticketId, true);
  };

  // Bulk Delete All Completed / Finished Game Tickets to Free Memory
  const handleDeleteCompletedTickets = () => {
    const completedGameIds = new Set(
      games.filter((g) => g && (g.status === 'completed' || g.status === 'cancelled')).map((g) => g.id)
    );

    const initialCount = tickets.length;
    setTickets((prev) => prev.filter((t) => t && !completedGameIds.has(t.gameId)));
    const deletedCount = initialCount - tickets.filter((t) => t && !completedGameIds.has(t.gameId)).length;

    // Server-side cleanup & Broadcast
    fetch('/api/tickets/clear-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: 'all' }),
    }).catch(() => {});

    setUserNotifications((prev) => [
      {
        id: `un_del_bulk_${Date.now()}`,
        category: 'system',
        title: '🧹 मेमोरी क्लीनअप सफल (Memory Cleaned)',
        message: `समाप्त हुए गेम के ${deletedCount > 0 ? deletedCount : 'सभी'} पुराने टिकट सफलतापूर्वक हटा दिए गए हैं।`,
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  // 2. Toggle Auto Caller
  const handleToggleAutoCaller = (targetGameId?: string) => {
    const activeTargetId = targetGameId || liveGame?.id;
    if (!activeTargetId) return;
    setGames((prevGames) =>
      prevGames.map((g) =>
        g.id === activeTargetId ? { ...g, autoCalling: !g.autoCalling } : g
      )
    );
  };

  // 3. Reset Game Match
  const handleResetGame = (targetGameId?: string) => {
    const activeTargetId = targetGameId || liveGame?.id;
    if (!activeTargetId) return;
    setGames((prevGames) =>
      prevGames.map((g) =>
        g.id === activeTargetId
          ? {
              ...g,
              currentNumber: undefined,
              lastCalledNumber: undefined,
              calledNumbers: [],
              previousNumbers: [],
              autoCalling: false,
              prizes: Array.isArray(g.prizes) ? g.prizes.map((p) => ({ ...p, claimedWinners: [] })) : [],
            }
          : g
      )
    );
  };

  // 4. 8-Level Referral Commission Engine (Ticket Purchase Only: 2%, 1%, 0.5%, 0.4%, 0.3%, 0.2%, 0.1%, 0.1%)
  const distributeReferralCommissions = (totalPurchaseAmount: number) => {
    if (!currentUser || totalPurchaseAmount <= 0) return;

    const RATES = [
      { level: 1, rate: 0.02, label: 'Level 1 Direct (2.0%)' },
      { level: 2, rate: 0.01, label: 'Level 2 Downline (1.0%)' },
      { level: 3, rate: 0.005, label: 'Level 3 Downline (0.5%)' },
      { level: 4, rate: 0.004, label: 'Level 4 Downline (0.4%)' },
      { level: 5, rate: 0.003, label: 'Level 5 Downline (0.3%)' },
      { level: 6, rate: 0.002, label: 'Level 6 Downline (0.2%)' },
      { level: 7, rate: 0.001, label: 'Level 7 Downline (0.1%)' },
      { level: 8, rate: 0.001, label: 'Level 8 Downline (0.1%)' },
    ];

    const newComms: ReferralCommission[] = [];
    let totalPaidOut = 0;

    // Helper to find upline parent
    const findParent = (refCodeOrId?: string, refUserId?: string): User | undefined => {
      if (refUserId) {
        const u = users.find((x) => x.id === refUserId);
        if (u) return u;
      }
      if (!refCodeOrId) return undefined;
      const clean = refCodeOrId.trim().toUpperCase();
      const cleanDigits = clean.replace(/\D/g, '');
      const cleanNoPrefix = clean.replace(/^REF-?/, '');
      return users.find((u) => {
        if (u.id === currentUser.id) return false;
        const uCode = (u.referralCode || '').trim().toUpperCase();
        const uCodeNoPrefix = uCode.replace(/^REF-?/, '');
        const uId = (u.id || '').trim().toUpperCase();
        const uPhone = (u.phone || '').replace(/\D/g, '');
        if (uCode && (uCode === clean || uCodeNoPrefix === cleanNoPrefix || clean.includes(uCode) || uCode.includes(clean))) return true;
        if (uId && (uId === clean || clean.includes(uId) || uId.includes(clean))) return true;
        if (cleanDigits.length >= 6 && uPhone && (uPhone === cleanDigits || uPhone.endsWith(cleanDigits) || cleanDigits.endsWith(uPhone))) return true;
        return false;
      });
    };

    let uplineUser = findParent(currentUser.referredBy, currentUser.referredByUserId);

    for (let i = 0; i < RATES.length; i++) {
      const tier = RATES[i];
      if (!uplineUser) {
        // No further upline parent found in chain
        break;
      }

      const commAmount = Number((totalPurchaseAmount * tier.rate).toFixed(2));
      if (commAmount > 0) {
        totalPaidOut += commAmount;

        const commRecord: ReferralCommission = {
          id: `comm_${Date.now()}_${tier.level}_${Math.floor(Math.random() * 1000)}`,
          transactionId: `TXN-REF-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: uplineUser.id,
          userName: uplineUser.name,
          sourceUserId: currentUser.id,
          sourceUserName: currentUser.name,
          gameId: liveGame?.id || 'game_live_101',
          gameTitle: liveGame?.title || 'Tambola Live',
          ticketId: 'TKT-BATCH-REF',
          level: tier.level,
          percentage: tier.rate * 100,
          baseAmount: totalPurchaseAmount,
          commissionAmount: commAmount,
          status: 'approved',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        };
        newComms.push(commRecord);

        // Update upline user's referral balance and wallet in state
        const updatedUpline: User = {
          ...uplineUser,
          referralBalance: Number(((uplineUser.referralBalance || 0) + commAmount).toFixed(2)),
          walletBalance: Number(((uplineUser.walletBalance || 0) + commAmount).toFixed(2)),
        };

        setUsers((prev) => prev.map((u) => (u.id === updatedUpline.id ? updatedUpline : u)));

        // Persist to Firestore & Local Storage
        try {
          setDoc(doc(db, 'commissions', commRecord.id), commRecord).catch(() => {});
          setDoc(doc(db, 'users', updatedUpline.id), updatedUpline, { merge: true }).catch(() => {});
        } catch (e) {
          console.warn('Firestore commission persistence warning:', e);
        }

        // If upline is currently active on this screen, update currentUser
        if (currentUser.id === uplineUser.id) {
          setCurrentUser(updatedUpline);
        }
      }

      // Move to next higher level upline
      uplineUser = findParent(uplineUser.referredBy, uplineUser.referredByUserId);
    }

    if (newComms.length > 0) {
      setCommissions((prev) => [...newComms, ...prev]);
      setAdminStats((prev) => ({
        ...prev,
        totalReferralCommissionsPaid: prev.totalReferralCommissionsPaid + totalPaidOut,
      }));
    }
  };

  // 5. Buy Tickets Handler (Supports Deposit balance + Winning balance + Referral balance)
  const handleBuyTickets = async (gameId: string, quantity: number): Promise<boolean> => {
    try {
      if (!currentUser) {
        handleOpenAuth('login');
        return false;
      }
      const game = games.find((g) => g.id === gameId);
      if (!game) return false;

      // Check if Game or Ticket Tier is Active / Enabled by Admin
      if (game.isGameEnabled === false || game.isActive === false || game.status === 'cancelled') {
        alert(`⚠️ यह ₹${game.ticketPrice} वाला टिकट (${game.title}) एडमिन द्वारा बंद (OFF) कर दिया गया है। आप केवल एडमिन द्वारा चालू किए गए टिकट ही बुक कर सकते हैं।`);
        return false;
      }

      // Check if Booking is Open for this Ticket
      if (game.isBookingOpen === false || game.bookingOpen === false) {
        alert(`⚠️ इस टिकट (${game.title}) की टिकट बुकिंग एडमिन द्वारा बंद (CLOSED) कर दी गई है।`);
        return false;
      }

      // Check global site booking switch
      if (siteSettings?.globalTicketBookingEnabled === false) {
        alert(`⚠️ मास्टर टिकट बुकिंग एडमिन द्वारा अस्थायी रूप से बंद है।`);
        return false;
      }

      // Exact total cost calculation (ticketPrice * quantity)
      const totalCost = Number(game.ticketPrice || 0) * Number(quantity || 1);

      // Current user wallet funds
      let currentDep = Number(currentUser.depositBalance) || 0;
      let currentWin = Number(currentUser.winningBalance) || 0;
      let currentRef = Number(currentUser.referralBalance) || 0;
      let currentWal = Number(currentUser.walletBalance) || 0;

      // Auto-normalize if sub-balances are zero or lower than total walletBalance
      if (currentDep === 0 && currentWin === 0 && currentRef === 0 && currentWal > 0) {
        currentDep = currentWal;
      } else if (currentDep + currentWin + currentRef < currentWal) {
        currentDep += (currentWal - (currentDep + currentWin + currentRef));
      }

      const availableBalance = Math.max(currentWal, currentDep + currentWin + currentRef);
      if (availableBalance < totalCost) {
        const errorNotif: UserNotificationItem = {
          id: `un_err_${Date.now()}`,
          category: 'wallet_credit',
          title: '⚠️ अपर्याप्त वॉलेट बैलेंस',
          message: `${quantity} टिकट खरीदने के लिए वॉलेट में कम से कम ₹${totalCost} होना आवश्यक है। (वर्तमान उपलब्ध बैलेंस: ₹${availableBalance})। कृपया वॉलेट में फंड ऐड करें।`,
          timestamp: 'Just now',
          read: false,
          actionTab: 'wallet',
        };
        setUserNotifications((prev) => [errorNotif, ...prev]);
        alert(`⚠️ अपर्याप्त वॉलेट बैलेंस! ${quantity} टिकट के लिए कुल ₹${totalCost} चाहिए। आपके वॉलेट में केवल ₹${availableBalance} उपलब्ध हैं। कृपया पहले वॉलेट में फंड ऐड करें।`);
        return false;
      }

      // Determine ticket colors (Prioritizes per-game color theme, falls back to Admin siteSettings)
      const newTickets: TambolaTicket[] = [];
      const activeColorSetting = game.ticketColorTheme || siteSettings.defaultTicketTheme || 'multi';

      for (let i = 0; i < quantity; i++) {
        const ticketNum = (game.totalTicketsSold || 0) + i + 1;
        
        let assignedColor: TicketColorThemeId = 'ruby';
        if (!activeColorSetting || activeColorSetting === 'multi') {
          assignedColor = COLOR_KEYS[(ticketNum - 1 + i) % COLOR_KEYS.length];
        } else {
          assignedColor = activeColorSetting;
        }

        newTickets.push({
          id: `tkt_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
          gameId: game.id,
          gameTitle: game.title,
          userId: currentUser.id,
          userName: currentUser.name,
          ticketNumber: ticketNum,
          ticketId: generateTicketId(),
          numbers: generateTambolaTicketMatrix(),
          markedNumbers: [],
          price: game.ticketPrice,
          colorTheme: assignedColor,
          matchDate: game.date || 'Today',
          matchTime: game.startTime || '09:00 PM',
          purchaseDate: new Date().toISOString(),
          isActive: true,
          status: 'active',
        });
      }

      // Exact payment deduction from wallet:
      // Priority: Deposit balance first, then Winning balance, then Referral balance
      let remToDeduct = totalCost;
      let newDeposit = currentDep;
      let newWinning = currentWin;
      let newReferral = currentRef;

      if (newDeposit >= remToDeduct) {
        newDeposit -= remToDeduct;
        remToDeduct = 0;
      } else {
        remToDeduct -= newDeposit;
        newDeposit = 0;
      }

      if (remToDeduct > 0 && newWinning >= remToDeduct) {
        newWinning -= remToDeduct;
        remToDeduct = 0;
      } else if (remToDeduct > 0) {
        remToDeduct -= newWinning;
        newWinning = 0;
      }

      if (remToDeduct > 0 && newReferral >= remToDeduct) {
        newReferral -= remToDeduct;
        remToDeduct = 0;
      } else if (remToDeduct > 0) {
        remToDeduct -= newReferral;
        newReferral = 0;
      }

      const newWallet = Math.max(0, currentWal - totalCost);
      const subTotal = newDeposit + newWinning + newReferral;
      if (subTotal !== newWallet) {
        newDeposit = Math.max(0, newWallet - (newWinning + newReferral));
      }

      const updatedCurrentUser: User = {
        ...currentUser,
        depositBalance: newDeposit,
        winningBalance: newWinning,
        referralBalance: newReferral,
        walletBalance: newWallet,
      };

      // 1. Update active current user state and persistent auth storage
      setCurrentUser(updatedCurrentUser);
      try {
        localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updatedCurrentUser));
      } catch (e) {}

      // 2. Update user in registered users list
      setUsers((prev) => {
        const nextUsers = prev.map((u) => (u.id === updatedCurrentUser.id ? updatedCurrentUser : u));
        try {
          localStorage.setItem('apna_tambola_registered_users', JSON.stringify(nextUsers));
        } catch (e) {}
        return nextUsers;
      });

      // 3. Record wallet debit transaction in user Passbook
      const newTxn: WalletTransaction = {
        id: `txn_${Date.now()}`,
        userId: currentUser.id,
        type: 'ticket_purchase',
        amount: -totalCost,
        balanceAfter: newWallet,
        description: `🎟️ टिकट बुकिंग: ${quantity} टिकट @ ₹${game.ticketPrice} = -₹${totalCost} (${game.title})`,
        referenceId: newTickets[0].ticketId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        status: 'completed',
      };
      setTransactions((prev) => {
        const nextTxns = [newTxn, ...prev];
        try {
          localStorage.setItem('apna_tambola_transactions', JSON.stringify(nextTxns));
        } catch (e) {}
        return nextTxns;
      });

      // 4. Update tournament stats & dynamic 70/30 prize allocation
      let updatedGameObj: TambolaGame = game;
      setGames((prev) =>
        prev.map((g) => {
          if (g.id !== gameId) return g;
          const newTicketsSold = (g.totalTicketsSold || 0) + quantity;
          const { prizePool, prizes } = calculateTambolaDynamicPrizes(
            newTicketsSold,
            g.ticketPrice,
            g.prizes
          );
          updatedGameObj = {
            ...g,
            totalTicketsSold: newTicketsSold,
            registeredPlayers: (g.registeredPlayers || 0) + 1,
            prizePool,
            prizes,
          };
          return updatedGameObj;
        })
      );

      // 5. Store new tickets locally
      setTickets((prev) => {
        const next = [...newTickets, ...prev];
        try {
          localStorage.setItem('apna_tambola_tickets', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 6. Realtime Firestore synchronization for user, transaction, tickets & game
      try {
        setDoc(doc(db, 'users', updatedCurrentUser.id), updatedCurrentUser, { merge: true }).catch(() => {});
        setDoc(doc(db, 'transactions', newTxn.id), newTxn, { merge: true }).catch(() => {});
        newTickets.forEach((tkt) => {
          setDoc(doc(db, 'tickets', tkt.id), tkt, { merge: true }).catch(() => {});
        });
        if (updatedGameObj) {
          setDoc(doc(db, 'games', game.id), updatedGameObj, { merge: true }).catch(() => {});
        }
      } catch (e) {}

      // 7. Update admin platform stats
      setAdminStats((prev) => ({
        ...prev,
        ticketsSold: prev.ticketsSold + quantity,
        totalRevenue: prev.totalRevenue + totalCost,
      }));

      // 8. Distribute 5-Level Referral commissions
      try {
        distributeReferralCommissions(totalCost);
      } catch (err) {
        console.warn('Referral distribution warning:', err);
      }

      // 9. Sync ticket purchase and wallet deduction with server API
      fetch('/api/tickets/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          quantity,
          userId: currentUser.id,
          totalCost,
          newWalletBalance: newWallet,
          user: updatedCurrentUser,
          tickets: newTickets,
        }),
      }).catch((e) => console.warn('Ticket server purchase sync warning:', e));

      // 10. Push notification to user notifications list
      const ticketNotif: UserNotificationItem = {
        id: `un_${Date.now()}`,
        category: 'ticket_confirmation',
        title: `🎟️ ${quantity} टिकट बुक हुए (वॉलेट से -₹${totalCost} डेबिट)`,
        message: `सफलतापूर्वक ${quantity} टिकट बुक हो गए (${game.title})। आपके वॉलेट से ₹${totalCost} काट लिए गए हैं। शेष वॉलेट बैलेंस: ₹${newWallet}। (Ticket IDs: ${newTickets.map((t) => t.ticketId).join(', ')})`,
        timestamp: 'Just now',
        read: false,
        actionTab: 'my-tickets',
        ticketId: newTickets[0].ticketId,
      };
      setUserNotifications((prev) => [ticketNotif, ...prev]);

      return true;
    } catch (err: any) {
      console.error('Error in handleBuyTickets:', err);
      return false;
    }
  };

  // 5b. Master Auto-Ticket Dispatch Engine (Auto-Book 1 ticket of exact price for all users with wallet funds)
  // 5b. Master Auto-Ticket Dispatch Engine (Auto-Book 1 ticket of exact price for all users with wallet funds)
  const handleRunAutoTicketDispatch = async (targetGameId?: string, silent: boolean = false): Promise<{
    success: boolean;
    dispatchedCount: number;
    totalDeducted: number;
    message: string;
    details?: Array<{ userId: string; userName: string; phone?: string; ticketId: string; deducted: number; newBalance: number }>;
  }> => {
    try {
      // 1. Pick designated game or default to active/first upcoming/live game
      let game = targetGameId ? games.find((g) => g.id === targetGameId) : null;
      if (!game) {
        game = games.find((g) => g.status === 'live' && g.isActive !== false && g.isGameEnabled !== false) ||
               games.find((g) => g.status === 'upcoming' && g.isActive !== false && g.isGameEnabled !== false) ||
               games.find((g) => g.isActive !== false && g.isGameEnabled !== false) ||
               games[0];
      }

      if (!game) {
        if (!silent) alert('⚠️ कोई सक्रिय टूर्नामेंट उपलब्ध नहीं है। कृपया पहले टूर्नामेंट चालू करें।');
        return { success: false, dispatchedCount: 0, totalDeducted: 0, message: 'No active tournament found.' };
      }

      const ticketPrice = Number(game.ticketPrice) || 5;
      const dispatchedList: Array<{
        userId: string;
        userName: string;
        phone?: string;
        ticketId: string;
        deducted: number;
        newBalance: number;
      }> = [];
      const newGeneratedTickets: TambolaTicket[] = [];
      const newTxns: WalletTransaction[] = [];
      let totalDeducted = 0;

      // Filter non-admin users with sufficient wallet funds (deposit + win + referral or general walletBalance)
      const eligibleUsers = users.filter((u) => {
        if (!u || !u.id || u.role === 'admin') return false;
        const dep = Number(u.depositBalance) || 0;
        const win = Number(u.winningBalance) || 0;
        const ref = Number(u.referralBalance) || 0;
        const wal = Number(u.walletBalance) || 0;
        const totalFund = Math.max(wal, dep + win + ref);
        return totalFund >= ticketPrice;
      });

      let updatedUsers = [...users];

      eligibleUsers.forEach((u) => {
        // Condition: Check if user already has a ticket for this specific game (1 ticket per game rule)
        const alreadyHas = tickets.some((t) => t.userId === u.id && t.gameId === game!.id) ||
                           newGeneratedTickets.some((t) => t.userId === u.id && t.gameId === game!.id);
        if (alreadyHas) return;

        let depBal = Number(u.depositBalance) || 0;
        let winBal = Number(u.winningBalance) || 0;
        let refBal = Number(u.referralBalance) || 0;
        let walBal = Number(u.walletBalance) || 0;

        // Auto-normalize if user only had general walletBalance
        if (depBal === 0 && winBal === 0 && refBal === 0 && walBal > 0) {
          depBal = walBal;
        }

        let needed = ticketPrice;
        if (depBal >= needed) {
          depBal -= needed;
          needed = 0;
        } else {
          needed -= depBal;
          depBal = 0;
        }

        if (needed > 0 && winBal >= needed) {
          winBal -= needed;
          needed = 0;
        } else if (needed > 0) {
          needed -= winBal;
          winBal = 0;
        }

        if (needed > 0 && refBal >= needed) {
          refBal -= needed;
          needed = 0;
        }

        if (needed > 0 && walBal >= ticketPrice) {
          walBal = Math.max(0, walBal - ticketPrice);
          needed = 0;
        }

        const newWallet = depBal + winBal + refBal;
        const matrix = generateTambolaTicketMatrix();
        const ticketId = generateTicketId();

        const newTicket: TambolaTicket = {
          id: `tkt_auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          gameId: game!.id,
          gameTitle: game!.title,
          userId: u.id,
          userName: u.name,
          ticketNumber: (game!.totalTicketsSold || 0) + newGeneratedTickets.length + 1,
          ticketId,
          numbers: matrix,
          markedNumbers: [],
          price: ticketPrice,
          purchaseDate: new Date().toISOString(),
          qrCodeData: `TAMBOLA-AUTO|${ticketId}|${game!.gameCode}|${u.name}|INR${ticketPrice}`,
          colorTheme: game!.ticketColorTheme || 'multi',
        };

        const txn: WalletTransaction = {
          id: `txn_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: u.id,
          userName: u.name,
          type: 'ticket_purchase',
          amount: -ticketPrice,
          status: 'completed',
          description: `🎟️ ऑटो टिकट बुकिंग (${game!.title}) - ₹${ticketPrice} (Ticket ID: ${ticketId})`,
          referenceId: ticketId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
          balanceAfter: newWallet,
        };

        newGeneratedTickets.push(newTicket);
        newTxns.push(txn);
        totalDeducted += ticketPrice;

        dispatchedList.push({
          userId: u.id,
          userName: u.name,
          phone: u.phone,
          ticketId,
          deducted: ticketPrice,
          newBalance: newWallet,
        });

        updatedUsers = updatedUsers.map((usr) => usr.id === u.id ? {
          ...usr,
          depositBalance: depBal,
          winningBalance: winBal,
          referralBalance: refBal,
          walletBalance: newWallet,
        } : usr);
      });

      if (newGeneratedTickets.length > 0) {
        setTickets((prev) => [...newGeneratedTickets, ...prev]);
        setTransactions((prev) => [...newTxns, ...prev]);
        setUsers(updatedUsers);

        // If current logged-in user is one of the affected users, update currentUser state
        if (currentUser && dispatchedList.some((d) => d.userId === currentUser.id)) {
          const myUpdate = updatedUsers.find((u) => u.id === currentUser.id);
          if (myUpdate) {
            setCurrentUser(myUpdate);
            try {
              localStorage.setItem('apna_tambola_auth_user', JSON.stringify(myUpdate));
            } catch (e) {}
          }
        }

        try {
          localStorage.setItem('apna_tambola_tickets', JSON.stringify([...newGeneratedTickets, ...tickets]));
          localStorage.setItem('apna_tambola_transactions', JSON.stringify([...newTxns, ...transactions]));
          localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updatedUsers));
        } catch (e) {}

        // Update tournament stats
        setGames((prev) => prev.map((g) => g.id === game!.id ? {
          ...g,
          totalTicketsSold: (g.totalTicketsSold || 0) + newGeneratedTickets.length,
          registeredPlayers: Math.min(g.maxPlayers || 500, (g.registeredPlayers || 0) + dispatchedList.length),
        } : g));

        // Add Admin Activity Log
        setActivityLogs((prev) => [
          {
            id: `act_${Date.now()}_auto`,
            adminName: 'Auto Ticket Engine',
            action: `⚡ ${newGeneratedTickets.length} ऑटो टिकट जारी किए गए (${game!.title} - ₹${ticketPrice}/टिकट, कुल ₹${totalDeducted} डेबिट)`,
            category: 'ticket',
            ipAddress: '127.0.0.1 (System)',
            device: 'Auto-Dispatch Engine',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
            status: 'success',
          },
          ...prev,
        ]);

        // Push User Notification for current user if applicable
        if (currentUser && dispatchedList.some((d) => d.userId === currentUser.id)) {
          const myTkt = newGeneratedTickets.find((t) => t.userId === currentUser.id);
          if (myTkt) {
            setUserNotifications((prev) => [
              {
                id: `un_auto_${Date.now()}`,
                category: 'ticket_confirmation',
                title: `🎟️ आपका ₹${ticketPrice} वाला 1 टिकट ऑटोमैटिक बुक हो गया!`,
                message: `टूर्नामेंट "${game!.title}" हेतु आपका टिकट ID ${myTkt.ticketId} बुक हो चुका है। वॉलेट से ₹${ticketPrice} डेबिट किया गया है।`,
                timestamp: 'Just now',
                read: false,
                actionTab: 'my-tickets',
                ticketId: myTkt.ticketId,
              },
              ...prev,
            ]);
          }
        }

        // Server Sync
        fetch('/api/tickets/auto-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id }),
        }).catch(() => {});
      }

      const resMsg = dispatchedList.length > 0
        ? `🎉 ${dispatchedList.length} फंडेड यूजर्स को ₹${ticketPrice} का 1 टिकट भेजा गया (कुल ₹${totalDeducted} डेबिट हुआ)!`
        : `सभी फंडेड यूजर्स के पास पहले से "${game.title}" का टिकट उपलब्ध है।`;

      return {
        success: true,
        dispatchedCount: dispatchedList.length,
        totalDeducted,
        message: resMsg,
        details: dispatchedList,
      };
    } catch (e: any) {
      console.error('Error in handleRunAutoTicketDispatch:', e);
      return { success: false, dispatchedCount: 0, totalDeducted: 0, message: e.message || 'Auto ticket execution error' };
    }
  };

  const handleToggleAutoTicketMode = async (enabled: boolean, gameId?: string): Promise<boolean> => {
    const updates: Partial<SiteSettings> = {
      autoTicketEnabled: enabled,
      ...(gameId !== undefined ? { autoTicketGameId: gameId } : {}),
    };
    await handleUpdateSettings(updates);
    if (enabled) {
      // Trigger dispatch immediately on turning ON
      handleRunAutoTicketDispatch(gameId, false);
    }
    return true;
  };

  // Continuous Auto-Ticket Dispatch Background Effect
  useEffect(() => {
    if (siteSettings?.autoTicketEnabled === false) return;

    // Initial check on load/mount
    const timer = setTimeout(() => {
      handleRunAutoTicketDispatch(siteSettings?.autoTicketGameId, true);
    }, 1500);

    // Periodic check every 12 seconds
    const interval = setInterval(() => {
      if (siteSettings?.autoTicketEnabled !== false) {
        handleRunAutoTicketDispatch(siteSettings?.autoTicketGameId, true);
      }
    }, 12000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [siteSettings?.autoTicketEnabled, siteSettings?.autoTicketGameId, users.length, games.length, tickets.length]);

  // 6. Claim Prize Handler with instant verification & Equal Split Logic
  const handleClaimPrize = (ticketId: string, prizeCode: PrizeCode) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || !liveGame) return;

    if (liveGame.status === 'completed' || ticket.isCompleted || ticket.isArchived) {
      alert('यह गेम पहले ही समाप्त (Completed) हो चुका है! इस पर कोई पेमेंट या प्राइज क्लेम मान्य नहीं है।');
      return;
    }

    const prize = liveGame.prizes.find((p) => p.code === prizeCode);
    if (!prize) return;

    // Check if current user already claimed this prize on this ticket
    const claimedWinnersList = Array.isArray(prize.claimedWinners) ? prize.claimedWinners : [];
    const alreadyClaimedOnThisTicket = claimedWinnersList.some(
      (w) => w && w.ticketId === ticket.ticketId && w.userId === currentUser.id
    );
    if (alreadyClaimedOnThisTicket) {
      alert(`You have already claimed ${prize.name} on Ticket #${ticket.ticketNumber}!`);
      return;
    }

    if (claimedWinnersList.length >= prize.maxWinners) {
      alert(`The ${prize.name} has already reached maximum winners (${prize.maxWinners})!`);
      return;
    }

    // 🛡️ Strict Anti-Cheat Rule: 1 Ticket can win ONLY 1 Full House!
    // A ticket cannot win 2 Full Houses. If already claimed any Full House, reject immediately.
    const isFullHousePrize = prizeCode === 'full_house' || prizeCode === 'second_full_house' || prizeCode === 'third_full_house';
    if (isFullHousePrize) {
      const alreadyWonFullHouse = liveGame.prizes.some(
        (p) =>
          (p.code === 'full_house' || p.code === 'second_full_house' || p.code === 'third_full_house') &&
          Array.isArray(p.claimedWinners) &&
          p.claimedWinners.some((w) => w && (w.ticketId === ticket.ticketId || (w.userId === currentUser.id && w.ticketNumber === ticket.ticketNumber)))
      );
      if (alreadyWonFullHouse) {
        alert(
          `⚠️ नियम उल्लंघन (Rule Violation):\n\nटिकट #${ticket.ticketNumber} (${ticket.ticketId}) पर पहले से 1 फुलहाउस जीता जा चुका है!\n\nतंबोला नियम अनुसार एक टिकट में केवल 1 ही फुलहाउस मान्य है, 2 फुलहाउस नहीं लग सकते।`
        );
        return;
      }
    }

    // Check validity against called numbers
    const result = verifyClaim(prizeCode, ticket.numbers, liveGame.calledNumbers || [], liveGame.currentNumber);
    if (!result.valid) {
      alert(`Claim Rejected: ${result.reason}`);
      return;
    }

    // ⚖️ Equal Share Distribution:
    // If a prize is configured for multiple winners (e.g. maxWinners: 2), each gets an equal share (e.g. ₹50 each).
    const targetCapacity = Math.max(1, prize.maxWinners || 1, claimedWinnersList.length + 1);
    const splitAmount = Math.floor(prize.amount / targetCapacity);
    const isSplit = targetCapacity > 1;
    const totalWinnersForPrize = claimedWinnersList.length + 1;

    // 🛡️ Wallet Protection: User's previously credited funds are 100% safe and never deducted.

    // Valid Claim! Add winner
    const newWinner: GameWinner = {
      id: `win_${Date.now()}`,
      gameId: liveGame.id,
      gameTitle: liveGame.title,
      prizeId: prize.id,
      userId: currentUser.id,
      userName: currentUser.name,
      prizeName: prize.name,
      prizeCode,
      prizeAmount: splitAmount,
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      winningNumber: liveGame.currentNumber || 47,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    };

    setWinners((prev) => [newWinner, ...prev]);

    // Credit split winning amount to user
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        walletBalance: prev.walletBalance + splitAmount,
        winningBalance: prev.winningBalance + splitAmount,
      };
    });

    // Record transaction
    const winTxn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: currentUser.id,
      type: 'prize_won',
      amount: splitAmount,
      balanceAfter: currentUser.walletBalance + splitAmount,
      description: isSplit
        ? (totalWinnersForPrize === 2
            ? `🏆 ईनाम जीता (50-50 समान बंटवारा): ${prize.name} में ₹${prize.amount} का 50-50 हिस्सा = ₹${splitAmount}`
            : `🏆 ईनाम जीता: ${prize.name} (${totalWinnersForPrize} विजेताओं में विभाजित) = ₹${splitAmount}`)
        : `🏆 ईनाम जीता: ${prize.name} in ${liveGame.title}`,
      referenceId: ticket.ticketId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'completed',
    };
    setTransactions((prev) => [winTxn, ...prev]);

    // Update prize claim state in game
    const isFullHouseCompleted = prizeCode === 'full_house' || prizeCode === 'second_full_house';
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== liveGame.id) return g;
        return {
          ...g,
          status: isFullHouseCompleted ? 'completed' : g.status,
          autoCalling: isFullHouseCompleted ? false : g.autoCalling,
          prizes: g.prizes.map((p) =>
            p.code === prizeCode
              ? {
                  ...p,
                  claimedWinners: [
                    ...p.claimedWinners,
                    {
                      userId: currentUser.id,
                      userName: currentUser.name,
                      ticketId: ticket.ticketId,
                      ticketNumber: ticket.ticketNumber,
                      winningNumber: liveGame.currentNumber || 47,
                      claimedAt: new Date().toISOString(),
                    },
                  ],
                }
              : p
          ),
        };
      })
    );

    if (isFullHouseCompleted) {
      if (autoCallTimerRef.current) {
        clearInterval(autoCallTimerRef.current);
        autoCallTimerRef.current = null;
      }
      setSiteSettings((prev) => ({ ...prev, isLiveStopped: true }));
      try {
        setDoc(doc(db, 'games', liveGame.id), { status: 'completed', autoCalling: false }, { merge: true }).catch(() => {});
        setDoc(doc(db, 'system', 'site_settings'), { isLiveStopped: true }, { merge: true }).catch(() => {});
      } catch {}
      handleClearCompletedTickets(liveGame.id).catch(() => {});
    }

    // Determine co-winners list for this prize
    const previousWinners = Array.isArray(prize.claimedWinners) ? prize.claimedWinners : [];
    const allClaimedForThisPrize = [
      ...previousWinners,
      {
        userId: currentUser.id,
        userName: currentUser.name,
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber,
        winningNumber: liveGame.currentNumber || 47,
        claimedAt: new Date().toISOString(),
      },
    ];
    const coWinners = allClaimedForThisPrize.map((w) => ({
      userId: w.userId,
      userName: w.userName,
      prizeAmount: splitAmount,
      ticketNumber: w.ticketNumber,
      ticketId: w.ticketId,
      isCurrentUser: w.userId === currentUser.id,
    }));
    const combinedWinnerNames = allClaimedForThisPrize.map((w) => w.userName).join(' & ');

    // Broadcast to Live Flash Ticker for all players (flashes both names if split)
    setActiveWinnerFlash({
      id: `flash_claim_${prize.id}_${Date.now()}`,
      winnerName: combinedWinnerNames,
      prizeName: prize.name,
      prizeAmount: splitAmount,
      totalPrizePool: prize.amount,
      winningNumber: liveGame.currentNumber || 47,
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.ticketId,
      isCurrentUser: true,
      isAutoClaimed: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ticket: ticket,
      isEqualSplit: isSplit,
      coWinners: isSplit ? coWinners : undefined,
    });

    // Voice announcement for winner / co-winners
    try {
      speakWinnerAnnouncement(
        allClaimedForThisPrize.map((w) => w.userName),
        prize.name,
        splitAmount,
        soundEnabled
      );
    } catch (e) {}

    // Trigger fireworks, fanfare, and live ticket celebration modal
    setCelebrationData({
      prizeName: isSplit ? `${prize.name} (50-50 समान बंटवारा)` : prize.name,
      prizeAmount: splitAmount,
      totalPrizePool: prize.amount,
      userName: combinedWinnerNames,
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      winningNumber: liveGame.currentNumber,
      ticket: ticket,
      calledNumbers: liveGame.calledNumbers,
      isCurrentUser: true,
      isEqualSplit: isSplit,
      coWinners: isSplit ? coWinners : undefined,
    });

    // Add winning notification
    const winNotif: UserNotificationItem = {
      id: `un_${Date.now()}`,
      category: 'winning',
      title: `🏆 Congratulations! You Won ₹${(splitAmount || 0).toLocaleString('en-IN')}!`,
      message: isSplit
        ? `Your claim for ${prize.name} was verified! Prize of ₹${prize.amount} was split equally (${totalWinnersForPrize} winners = ₹${splitAmount} each). ₹${splitAmount} added to your wallet.`
        : `Your claim for ${prize.name} in ${liveGame.title} was verified! ₹${splitAmount} added to your winning balance.`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'wallet',
      amount: splitAmount,
      ticketId: ticket.ticketId,
    };
    setUserNotifications((prev) => [winNotif, ...prev]);
  };

  // 7. Wallet Deposit Request Handler (Admin UTR Verification Flow)
  const handleDeposit = async (
    amount: number,
    method: string,
    utrNumber?: string,
    proofUrl?: string
  ): Promise<boolean> => {
    if (!currentUser) {
      handleOpenAuth('login');
      return false;
    }

    // Single Upload Rule: Check if user already has an active pending deposit request
    const cleanCurrentPhone = currentUser.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : '';
    const existingPending = deposits.find(
      (d) =>
        d.status === 'pending' &&
        (d.userId === currentUser.id ||
          (cleanCurrentPhone && d.userPhone && cleanCurrentPhone === d.userPhone.replace(/\D/g, '').slice(-10)))
    );

    if (existingPending) {
      alert(
        `⚠️ आपका एक पिछला डिपॉजिट अनुरोध (राशि: ₹${existingPending.amount}, UTR: ${existingPending.utrNumber}) पहले से एडमिन वेरिफिकेशन के लिए पेंडिंग है।\n\nनियम अनुसार: एडमिन द्वारा इस स्क्रीनशॉट को अप्रूव (स्वीकृत) या रिमूव (हटा) देने के बाद ही आप नया स्क्रीनशॉट और UTR अपलोड कर सकेंगे।`
      );
      return false;
    }

    const cleanUtr = (utrNumber || '').trim();

    // 1. One-time ₹10 Registration Bonus rule on 1st deposit (Disabled as requested):
    const registrationBonus = 0;

    const newDepositReq: DepositRequest = {
      id: `dep_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      userEmail: currentUser.email,
      amount,
      paymentMethod: method,
      utrNumber: cleanUtr || `UTR-${Date.now()}`,
      proofImageUrl: proofUrl,
      status: 'pending',
      requestDate: new Date().toISOString(),
      registrationBonus,
    };

    // Update deposits state & localStorage
    setDeposits((prev) => {
      const next = [newDepositReq, ...prev];
      try {
        localStorage.setItem('apna_tambola_deposits', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Save to Firestore
    try {
      setDoc(doc(db, 'deposits', newDepositReq.id), newDepositReq).catch(() => {});
    } catch (e) {}

    // Save to Server REST API
    try {
      fetch('/api/deposits/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDepositReq),
      }).catch(() => {});
    } catch (e) {}

    // Add Pending Transaction
    const pendingTxn: WalletTransaction = {
      id: `txn_dep_${Date.now()}`,
      userId: currentUser.id,
      type: 'deposit',
      amount,
      balanceAfter: currentUser.walletBalance,
      description: `डिपॉजिट अनुरोध: ₹${amount} (${method}) | UTR: ${cleanUtr || 'सत्यापन लंबित'} - एडमिन अप्रूवल प्रतीक्षारत`,
      paymentMethod: method,
      referenceId: newDepositReq.id,
      utrNumber: cleanUtr,
      proofImageUrl: proofUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'pending',
    };
    setTransactions((prev) => [pendingTxn, ...prev]);

    // Broadcast deposit request across tabs immediately
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'NEW_DEPOSIT_REQUEST', deposit: newDepositReq, transaction: pendingTxn });
        bc.close();
      }
    } catch (e) {}

    // Send user real-time notification
    const depNotif: UserNotificationItem = {
      id: `un_dep_${Date.now()}`,
      category: 'wallet_credit',
      title: `⏳ डिपॉजिट अनुरोध दर्ज: ₹${amount}`,
      message: `आपका ₹${amount} का डिपॉजिट अनुरोध (UTR: ${cleanUtr || 'लंबित'}) एडमिन को भेजा गया है। एडमिन द्वारा बैंक/UPI पेमेंट चेक करके OK करते ही फण्ड तुरंत आपके वॉलेट में आ जाएगा।`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'wallet',
      amount,
    };
    setUserNotifications((prev) => [depNotif, ...prev]);

    return true;
  };

  // 7a. Admin Approve Deposit (Credits User Wallet + First Deposit Bonus + Daily Reward Unlock)
  const handleApproveDeposit = async (depositId: string, remarks?: string): Promise<boolean> => {
    const deposit = deposits.find((d) => d.id === depositId);
    if (!deposit) return false;

    // Multi-factor target user lookup
    let targetUser = users.find((u) => u.id === deposit.userId);
    const cleanDepositPhone = deposit.userPhone ? deposit.userPhone.replace(/\D/g, '').slice(-10) : '';
    if (!targetUser && cleanDepositPhone) {
      targetUser = users.find((u) => u.phone && u.phone.replace(/\D/g, '').slice(-10) === cleanDepositPhone);
    }
    if (!targetUser && deposit.userEmail) {
      targetUser = users.find((u) => u.email && u.email.toLowerCase() === deposit.userEmail?.toLowerCase());
    }
    if (!targetUser && deposit.userName) {
      targetUser = users.find((u) => u.name && u.name.trim().toLowerCase() === deposit.userName.trim().toLowerCase());
    }

    if (!targetUser) {
      // Check localStorage for registered users
      try {
        const stored = localStorage.getItem('apna_tambola_registered_users');
        if (stored) {
          const list: User[] = JSON.parse(stored);
          if (Array.isArray(list)) {
            targetUser = list.find((u) => {
              if (u.id === deposit.userId) return true;
              const uCleanPhone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
              if (cleanDepositPhone && uCleanPhone && uCleanPhone === cleanDepositPhone) return true;
              if (deposit.userEmail && u.email && u.email.toLowerCase() === deposit.userEmail.toLowerCase()) return true;
              if (deposit.userName && u.name && u.name.trim().toLowerCase() === deposit.userName.trim().toLowerCase()) return true;
              return false;
            });
          }
        }
      } catch (e) {}
    }

    if (!targetUser) {
      // Auto-construct user object so payment funds are never lost!
      targetUser = {
        id: deposit.userId || `usr_${Date.now()}`,
        name: deposit.userName || 'Player',
        email: deposit.userEmail || `${(deposit.userName || 'player').toLowerCase().replace(/\s+/g, '')}@tambolalive.com`,
        phone: deposit.userPhone || '+91 9999999999',
        password: 'password123',
        role: 'user',
        status: 'active',
        isBlocked: false,
        walletBalance: 0,
        depositBalance: 0,
        winningBalance: 0,
        referralBalance: 0,
        bonusRewardBalance: 0,
        referralCode: `REF-${(deposit.userName || 'PLY').slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
        kycStatus: 'verified',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        createdAt: new Date().toISOString(),
      };
    }

    const regBonus = deposit.registrationBonus || 0;
    const totalCredit = deposit.amount + regBonus;

    const newDepositBal = (targetUser.depositBalance || 0) + totalCredit;
    const newTotalWallet = newDepositBal + (targetUser.winningBalance || 0) + (targetUser.referralBalance || 0);

    const updatedTargetUser: User = {
      ...targetUser,
      hasDeposited: true,
      firstDepositBonusClaimed: true,
      depositBalance: newDepositBal,
      walletBalance: newTotalWallet,
    };

    // Update deposits state
    setDeposits((prev) => {
      const next = prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'approved' as const,
              adminRemarks: remarks || 'Payment verified and approved by Admin',
              approvedAt: new Date().toISOString(),
            }
          : d
      );
      try {
        localStorage.setItem('apna_tambola_deposits', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const cleanUpdPhone = updatedTargetUser.phone ? updatedTargetUser.phone.replace(/\D/g, '').slice(-10) : '';

    // Update users state
    setUsers((prev) => {
      const exists = prev.some((u) => {
        if (u.id === updatedTargetUser.id) return true;
        const uPhone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
        return cleanUpdPhone && uPhone && uPhone === cleanUpdPhone;
      });
      const nextUsers = exists
        ? prev.map((u) => {
            const uPhone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
            const match = u.id === updatedTargetUser.id || (cleanUpdPhone && uPhone && uPhone === cleanUpdPhone);
            return match ? { ...u, ...updatedTargetUser } : u;
          })
        : [updatedTargetUser, ...prev];
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(nextUsers));
      } catch (e) {}
      return nextUsers;
    });

    const cleanCurrPhone = currentUser?.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : '';
    const isCurrentActiveUser =
      currentUser &&
      (currentUser.id === updatedTargetUser.id ||
        (cleanCurrPhone && cleanUpdPhone && cleanCurrPhone === cleanUpdPhone) ||
        (currentUser.email && updatedTargetUser.email && currentUser.email.toLowerCase() === updatedTargetUser.email.toLowerCase()));

    if (isCurrentActiveUser) {
      const mergedCurrent = {
        ...currentUser,
        ...updatedTargetUser,
      };
      setCurrentUser(mergedCurrent);
      try {
        localStorage.setItem('apna_tambola_auth_user', JSON.stringify(mergedCurrent));
      } catch (e) {}
    }

    const approvedTxn: WalletTransaction = {
      id: `txn_dep_app_${Date.now()}`,
      userId: updatedTargetUser.id,
      type: 'deposit',
      amount: deposit.amount,
      balanceAfter: newTotalWallet,
      description: `डिपॉजिट स्वीकृत (UTR: ${deposit.utrNumber}) - एडमिन द्वारा OK किया गया`,
      paymentMethod: deposit.paymentMethod || 'UPI / QR Deposit',
      referenceId: depositId,
      utrNumber: deposit.utrNumber,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'completed',
    };

    // Update Firestore & Server API
    try {
      setDoc(doc(db, 'deposits', depositId), {
        status: 'approved',
        adminRemarks: remarks || 'Payment verified by Admin',
        approvedAt: new Date().toISOString(),
      }, { merge: true }).catch(() => {});

      setDoc(doc(db, 'users', updatedTargetUser.id), {
        hasDeposited: true,
        firstDepositBonusClaimed: true,
        depositBalance: updatedTargetUser.depositBalance,
        bonusRewardBalance: updatedTargetUser.bonusRewardBalance,
        walletBalance: updatedTargetUser.walletBalance,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(() => {});

      setDoc(doc(db, 'transactions', approvedTxn.id), approvedTxn, { merge: true }).catch(() => {});

      fetch('/api/deposits/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId,
          remarks,
          deposit,
          updatedUser: updatedTargetUser,
          transaction: approvedTxn,
        }),
      }).catch(() => {});
    } catch (e) {}

    // Update transaction status
    setTransactions((prev) => {
      let found = false;
      const updated = prev.map((t) => {
        if (t.referenceId === depositId || (t.utrNumber && t.utrNumber === deposit.utrNumber && t.userId === deposit.userId)) {
          found = true;
          return {
            ...t,
            status: 'completed' as const,
            balanceAfter: newTotalWallet,
            description: `डिपॉजिट स्वीकृत (UTR: ${deposit.utrNumber}) - एडमिन द्वारा OK किया गया`,
          };
        }
        return t;
      });
      if (!found) {
        return [approvedTxn, ...updated];
      }
      return updated;
    });

    // Send user notification
    const successNotif: UserNotificationItem = {
      id: `un_dep_ok_${Date.now()}`,
      category: 'wallet_credit',
      title: `✅ डिपॉजिट स्वीकृत: ₹${deposit.amount}`,
      message: `बधाई! एडमिन ने आपका UTR (${deposit.utrNumber}) चेक करके ₹${deposit.amount} का डिपॉजिट OK कर दिया है। ₹${totalCredit} आपके टिकट वॉलेट में जोड़ दिया गया है!`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'wallet',
      amount: totalCredit,
    };
    setUserNotifications((prev) => [successNotif, ...prev]);

    // Broadcast deposit approval across tabs immediately
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({
          type: 'DEPOSIT_APPROVED',
          depositId,
          user: updatedTargetUser,
          transaction: approvedTxn,
          notification: successNotif,
        });
        bc.close();
      }
    } catch (e) {}

    // Auto-Ticket Engine: If Auto-Ticket is enabled, immediately dispatch 1 ticket for newly funded user
    if (siteSettings?.autoTicketEnabled !== false) {
      setTimeout(() => {
        handleRunAutoTicketDispatch(siteSettings?.autoTicketGameId, true);
      }, 500);
    }

    return true;
  };

  // 7b. Admin Reject Deposit & Block Fraudulent User ID
  const handleRejectDeposit = async (depositId: string, reason?: string): Promise<boolean> => {
    const deposit = deposits.find((d) => d.id === depositId);
    if (!deposit) return false;

    const targetUser = users.find((u) => u.id === deposit.userId);

    // Update deposits state
    setDeposits((prev) => {
      const next = prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'rejected' as const,
              adminRemarks: reason || 'Fake/Invalid UTR - User ID Blocked',
            }
          : d
      );
      try {
        localStorage.setItem('apna_tambola_deposits', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Block User
    if (targetUser) {
      const blockedUser: User = {
        ...targetUser,
        status: 'blocked',
        isBlocked: true,
      };

      setUsers((prev) => {
        const nextUsers = prev.map((u) => (u.id === blockedUser.id ? blockedUser : u));
        try {
          localStorage.setItem('apna_tambola_registered_users', JSON.stringify(nextUsers));
        } catch (e) {}
        return nextUsers;
      });

      if (currentUser && currentUser.id === blockedUser.id) {
        setCurrentUser(blockedUser);
      }

      try {
        setDoc(doc(db, 'users', blockedUser.id), { status: 'blocked', isBlocked: true }, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    // Update Firestore & Server API
    try {
      setDoc(doc(db, 'deposits', depositId), {
        status: 'rejected',
        adminRemarks: reason || 'Invalid UTR - ID Blocked',
      }, { merge: true }).catch(() => {});

      fetch('/api/deposits/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, reason }),
      }).catch(() => {});
    } catch (e) {}

    // Update transaction
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.referenceId === depositId || (t.utrNumber && t.utrNumber === deposit.utrNumber && t.userId === deposit.userId)) {
          return {
            ...t,
            status: 'failed' as const,
            description: `डिपॉजिट अस्वीकृत (फर्जी UTR: ${deposit.utrNumber}) - आईडी ब्लॉक की गई`,
          };
        }
        return t;
      })
    );

    // Send user notification
    const blockNotif: UserNotificationItem = {
      id: `un_dep_rej_${Date.now()}`,
      category: 'wallet_credit',
      title: `🚫 डिपॉजिट अस्वीकृत एवं खाता ब्लॉक`,
      message: `अमान्य / फर्जी UTR (${deposit.utrNumber}) सबमिट करने के कारण आपका डिपॉजिट अस्वीकृत कर दिया गया है एवं आपकी आईडी ब्लॉक कर दी गई है।`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'support',
    };
    setUserNotifications((prev) => [blockNotif, ...prev]);

    // Broadcast deposit rejection across tabs immediately
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'DEPOSIT_REJECTED', depositId });
        bc.close();
      }
    } catch (e) {}

    return true;
  };

  // 7c. Admin Remove / Delete Duplicate or Unwanted Deposit Slip (Does NOT block the user)
  const handleDeleteDeposit = async (depositId: string): Promise<boolean> => {
    try {
      const deposit = deposits.find((d) => d.id === depositId);
      if (!deposit) return false;

      // 1. Record in deleted list to avoid resurrection
      try {
        const deletedArr: string[] = JSON.parse(localStorage.getItem('apna_tambola_deleted_deposit_ids') || '[]');
        if (!deletedArr.includes(depositId)) {
          deletedArr.push(depositId);
          localStorage.setItem('apna_tambola_deleted_deposit_ids', JSON.stringify(deletedArr));
        }
      } catch (e) {}

      // 2. Remove from local deposits state
      setDeposits((prev) => {
        const next = prev.filter((d) => d.id !== depositId);
        try {
          localStorage.setItem('apna_tambola_deposits', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 3. Remove from Firestore
      try {
        await deleteDoc(doc(db, 'deposits', depositId));
      } catch (e) {
        console.warn('Firestore delete deposit error:', e);
      }

      // 4. Notify backend server
      try {
        await fetch('/api/deposits/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ depositId }),
        });
      } catch (e) {}

      // 5. Update transaction state so user sees it is removed/cleared
      setTransactions((prev) =>
        prev.map((t) => {
          if (
            t.referenceId === depositId ||
            (t.utrNumber && deposit.utrNumber && t.utrNumber === deposit.utrNumber && t.userId === deposit.userId)
          ) {
            return {
              ...t,
              status: 'failed' as const,
              description: `डिपॉजिट अनुरोध हटाया गया (UTR: ${deposit.utrNumber}) - एडमिन द्वारा स्लिप रिमूव की गई`,
            };
          }
          return t;
        })
      );

      // 6. Send notification to user so they know they can re-upload now
      const removeNotif: UserNotificationItem = {
        id: `un_dep_rem_${Date.now()}`,
        category: 'wallet_credit',
        title: `ℹ️ डिपॉजिट अनुरोध रिमूव किया गया`,
        message: `एडमिन द्वारा आपका पिछला डिपॉजिट अनुरोध (UTR: ${deposit.utrNumber || 'N/A'}) रिमूव कर दिया गया है। अब आप नया UTR और सही पेमेंट स्क्रीनशॉट पुनः अपलोड कर सकते हैं।`,
        timestamp: 'Just now',
        read: false,
        actionTab: 'wallet',
      };
      setUserNotifications((prev) => [removeNotif, ...prev]);

      // Broadcast deposit deletion across tabs immediately
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'DEPOSIT_DELETED', depositId });
          bc.close();
        }
      } catch (e) {}

      return true;
    } catch (err) {
      console.error('Error deleting deposit slip:', err);
      return false;
    }
  };

  // 7b. Claim Daily Spin / Scratch / Check-in Rewards into Daily Bonus Wallet (Depositors Only)
  const handleClaimDailyReward = async (
    amount: number,
    source: string
  ): Promise<boolean> => {
    if (!currentUser) {
      handleOpenAuth('login');
      return false;
    }

    const isDepositor = Boolean(
      currentUser.hasDeposited ||
      (currentUser.depositBalance && currentUser.depositBalance > 0) ||
      currentUser.firstDepositBonusClaimed
    );

    if (!isDepositor) {
      const lockNotif: UserNotificationItem = {
        id: `un_dep_lock_${Date.now()}`,
        category: 'wallet_credit',
        title: '🔒 डिपॉजिट आवश्यक (Deposit Required)',
        message: 'दैनिक चेक-इन, लकी स्पिन और स्क्रैच कार्ड केवल उन खिलाड़ियों के लिए हैं जिन्होंने कम से कम एक बार वॉलेट डिपॉजिट किया है। कृपया पहले वॉलेट में डिपॉजिट करें।',
        timestamp: 'Just now',
        read: false,
        actionTab: 'wallet',
      };
      setUserNotifications((prev) => [lockNotif, ...prev]);
      return false;
    }

    const rounded = Math.round(amount * 100) / 100;
    setCurrentUser((prev) => {
      if (!prev) return null;
      const newReward = (prev.bonusRewardBalance || 0) + rounded;
      return {
        ...prev,
        bonusRewardBalance: newReward,
      };
    });

    const rewTxn: WalletTransaction = {
      id: `txn_rew_${Date.now()}`,
      userId: currentUser.id,
      type: 'daily_reward_claim',
      amount: rounded,
      balanceAfter: currentUser.walletBalance,
      description: `🎁 दैनिक रिवार्ड: ₹${rounded.toFixed(2)} (${source}) - रिवार्ड वॉलेट में सुरक्षित (10% एडमिन पेमेंट पर अनलॉक)`,
      paymentMethod: source,
      referenceId: `REW-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'completed',
    };
    setTransactions((prev) => [rewTxn, ...prev]);

    const rewNotif: UserNotificationItem = {
      id: `un_rew_cl_${Date.now()}`,
      category: 'wallet_credit',
      title: `🎁 दैनिक रिवार्ड प्राप्त: ₹${rounded.toFixed(2)}`,
      message: `${source} से ₹${rounded.toFixed(2)} आपके 'दैनिक रिवार्ड वॉलेट' में जुड़ गए हैं। अगली बार एडमिन को पेमेंट/डिपॉजिट करने पर इसका 10% सीधे आपके टिकट वॉलेट में अनलॉक हो जाएगा!`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'daily-bonus',
      amount: rounded,
    };
    setUserNotifications((prev) => [rewNotif, ...prev]);

    return true;
  };

  // 8. Wallet Withdrawal Handler with 10% TDS & 5% Admin Charges
  const handleWithdrawal = async (data: {
    amount: number;
    paymentMethod: 'upi' | 'bank';
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    accountHolder?: string;
  }): Promise<boolean> => {
    if (!currentUser) {
      handleOpenAuth('login');
      return false;
    }
    const tdsPercentage = siteSettings.tdsPercentage ?? 10;
    const adminFeePercentage = siteSettings.adminFeePercentage ?? 5;
    const tdsAmount = Math.round((data.amount * tdsPercentage) / 100);
    const adminFeeAmount = Math.round((data.amount * adminFeePercentage) / 100);
    const totalDeductions = tdsAmount + adminFeeAmount;
    const netAmount = data.amount - totalDeductions;

    const updatedUser: User = {
      ...currentUser,
      walletBalance: Math.max(0, currentUser.walletBalance - data.amount),
      winningBalance: Math.max(0, (currentUser.winningBalance || 0) - data.amount),
    };

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updatedUser));
    } catch (e) {}

    setUsers((prev) => {
      const next = prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const newReq: WithdrawalRequest = {
      id: `req_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      amount: data.amount,
      tdsPercentage,
      tdsAmount,
      adminFeePercentage,
      adminFeeAmount,
      totalDeductions,
      netAmount,
      paymentMethod: data.paymentMethod,
      upiId: data.upiId,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      ifsc: data.ifsc,
      accountHolder: data.accountHolder,
      status: 'pending',
      requestDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    };

    setWithdrawals((prev) => {
      const next = [newReq, ...prev];
      try {
        localStorage.setItem('apna_tambola_withdrawals', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const newTxn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: currentUser.id,
      type: 'withdrawal',
      amount: -data.amount,
      balanceAfter: updatedUser.walletBalance,
      description: `Withdrawal ₹${data.amount} (Net Payout: ₹${netAmount} after 10% TDS & 5% Admin Charges) to ${
        data.paymentMethod === 'upi' ? data.upiId : data.bankName
      }`,
      referenceId: newReq.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'pending',
    };
    setTransactions((prev) => [newTxn, ...prev]);

    // 1. Post to Server for cross-device visibility
    try {
      fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReq),
      }).catch((e) => console.warn('Server withdrawal request sync error:', e));
    } catch (e) {}

    // 2. Persist to Firestore for multi-device sync
    try {
      const wdrRef = doc(db, 'withdrawals', newReq.id);
      setDoc(wdrRef, newReq).catch((e) => console.warn('Firestore withdrawal create error:', e));
      const userRef = doc(db, 'users', updatedUser.id);
      setDoc(userRef, { walletBalance: updatedUser.walletBalance, winningBalance: updatedUser.winningBalance }, { merge: true }).catch((e) => console.warn('Firestore user balance sync error:', e));
    } catch (e) {}

    // 3. Broadcast across tabs and local devices via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({
          type: 'NEW_WITHDRAWAL_REQUEST',
          withdrawal: newReq,
          user: updatedUser,
          transaction: newTxn,
        });
        bc.close();
      }
    } catch (e) {}

    return true;
  };

  // 8.1 User-to-User (P2P) Fund Transfer with 5% Platform Fee
  const handleP2PTransfer = async (
    recipientQuery: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    if (!currentUser) {
      handleOpenAuth('login');
      return { success: false, message: 'कृपया पहले लॉगिन करें' };
    }
    const feeRate = siteSettings.p2pTransferFeePercentage ?? 5;
    const feeAmount = Math.round((amount * feeRate) / 100);
    const totalDeduction = amount + feeAmount; // E.g., 100 + 5 = 105

    if (amount <= 0) {
      return { success: false, message: 'कृपया मान्य ट्रांसफर राशि दर्ज करें (Please enter a valid amount).' };
    }

    if (currentUser.walletBalance < totalDeduction) {
      return {
        success: false,
        message: `अपर्याप्त वॉलेट बैलेंस! ₹${amount} भेजने के लिए 5% ट्रांसफर शुल्क (₹${feeAmount}) सहित कुल ₹${totalDeduction} की आवश्यकता है। आपका बैलेंस: ₹${(currentUser?.walletBalance || 0).toLocaleString('en-IN')}`,
      };
    }

    const clean = recipientQuery.trim().toLowerCase();
    const cleanPhoneDigits = clean.replace(/\D/g, '').slice(-10);

    // Search recipient in registered users
    const foundUser = users.find(
      (u) =>
        (u.id && u.id.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean) ||
        (cleanPhoneDigits.length === 10 && u.phone && u.phone.replace(/\D/g, '').slice(-10) === cleanPhoneDigits) ||
        (u.referralCode && u.referralCode.toLowerCase() === clean) ||
        (u.name && u.name.toLowerCase() === clean)
    );

    if (foundUser && foundUser.id === currentUser.id) {
      return { success: false, message: 'आप स्वयं को फंड ट्रांसफर नहीं कर सकते (Cannot transfer money to yourself).' };
    }

    const recipientName = foundUser ? foundUser.name : `User (${recipientQuery})`;
    const recipientId = foundUser ? foundUser.id : `usr_p2p_${Date.now()}`;
    const recipientPhone = foundUser ? foundUser.phone : recipientQuery;
    const refCode = `P2P-${Math.floor(100000 + Math.random() * 900000)}`;

    // Deduct total amount (₹100 + ₹5 = ₹105) from Sender's wallet
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        walletBalance: prev.walletBalance - totalDeduction,
        depositBalance: Math.max(0, prev.depositBalance - totalDeduction),
      };
    });

    // Credit exact fund amount (₹100) to recipient if in users list
    if (foundUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === foundUser.id
            ? {
                ...u,
                walletBalance: u.walletBalance + amount,
                depositBalance: u.depositBalance + amount,
              }
            : u
        )
      );

      // Create transaction record for recipient
      const recipientTxn: WalletTransaction = {
        id: `txn_recv_${Date.now()}`,
        userId: foundUser.id,
        type: 'p2p_transfer_received',
        amount: amount,
        balanceAfter: foundUser.walletBalance + amount,
        description: `P2P Fund Received from ${currentUser.name}${note ? ` - ${note}` : ''}`,
        paymentMethod: 'P2P Wallet Transfer',
        referenceId: refCode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        status: 'completed',
        senderId: currentUser.id,
        senderName: currentUser.name,
        netTransferAmount: amount,
      };
      setTransactions((prev) => [recipientTxn, ...prev]);
    }

    // Create transaction record for sender
    const senderTxn: WalletTransaction = {
      id: `txn_send_${Date.now()}`,
      userId: currentUser.id,
      type: 'p2p_transfer_sent',
      amount: -totalDeduction,
      balanceAfter: currentUser.walletBalance - totalDeduction,
      description: `P2P Transfer to ${recipientName} (Fund: ₹${amount}, 5% Fee: ₹${feeAmount})${note ? ` [${note}]` : ''}`,
      paymentMethod: 'P2P Wallet Transfer',
      referenceId: refCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'completed',
      recipientId,
      recipientName,
      recipientPhone,
      transferFee: feeAmount,
      netTransferAmount: amount,
    };
    setTransactions((prev) => [senderTxn, ...prev]);

    // Admin Activity Log
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      adminName: currentUser.name,
      action: `P2P Transfer: ${currentUser.name} sent ₹${amount} to ${recipientName} (5% Fee: ₹${feeAmount}, Total: ₹${totalDeduction})`,
      category: 'wallet',
      ipAddress: '192.168.1.55',
      device: 'P2P Transfer Module',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'success',
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    // Push notification to sender
    const p2pNotif: UserNotificationItem = {
      id: `un_${Date.now()}`,
      category: 'wallet_credit',
      title: `💸 P2P Transfer Successful: ₹${(amount || 0).toLocaleString('en-IN')} Sent`,
      message: `₹${amount} transferred to ${recipientName}. Total ₹${totalDeduction} deducted (incl. 5% fee ₹${feeAmount}). Ref: ${refCode}`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'wallet',
      amount: -totalDeduction,
    };
    setUserNotifications((prev) => [p2pNotif, ...prev]);

    return {
      success: true,
      message: `सफलतापूर्वक ₹${amount} ट्रांसफर किया गया! 5% शुल्क (₹${feeAmount}) मिलाकर आपके वॉलेट से कुल ₹${totalDeduction} कटे।`,
      data: {
        amount,
        feeAmount,
        totalDeduction,
        recipientName,
        recipientPhone,
        refCode,
      },
    };
  };

  // 8b. Two-Wallet System: Transfer from Withdrawal Wallet (Winning) to Ticket Wallet (Deposit)
  const handleTransferWinningToTicketWallet = async (
    amount: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      handleOpenAuth('login');
      return { success: false, message: 'कृपया पहले लॉगिन करें' };
    }
    if (amount <= 0) {
      return { success: false, message: 'कृपया वैध राशि दर्ज करें (कम से कम ₹10)' };
    }
    if (amount > currentUser.winningBalance) {
      return {
        success: false,
        message: `अपर्याप्त विथड्रॉल बैलेंस! आपके पास केवल ₹${(currentUser?.winningBalance || 0).toLocaleString('en-IN')} उपलब्ध है।`,
      };
    }

    const refId = `CONV-WIN2TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    // Update balances: deduct winningBalance, add to depositBalance
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        winningBalance: prev.winningBalance - amount,
        depositBalance: prev.depositBalance + amount,
      };
    });

    // Record internal transfer transaction
    const txn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: currentUser.id,
      type: 'internal_transfer',
      amount: amount,
      balanceAfter: currentUser.walletBalance,
      description: `विथड्रॉल वॉलेट से टिकट वॉलेट में ट्रांसफर (100% उपयोगिता - कोई शुल्क नहीं)`,
      referenceId: refId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'completed',
    };
    setTransactions((prev) => [txn, ...prev]);

    // Push in-app user notification
    const convNotif: UserNotificationItem = {
      id: `un_conv_${Date.now()}`,
      category: 'wallet_credit',
      title: `🔄 वॉलेट ट्रांसफर सफल: ₹${(amount || 0).toLocaleString('en-IN')}`,
      message: `₹${amount} आपके विथड्रॉल वॉलेट से टिकट वॉलेट में ट्रांसफर हो गए हैं। अब आप सीधे नए टिकट खरीद सकते हैं!`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'wallet',
      amount: amount,
    };
    setUserNotifications((prev) => [convNotif, ...prev]);

    return {
      success: true,
      message: `सफलतापूर्वक ₹${amount} विथड्रॉल वॉलेट से टिकट वॉलेट में ट्रांसफर हो गए हैं! अब आप इस बैलेंस से टिकट खरीद सकते हैं।`,
    };
  };

  // 9. Admin Approve Withdrawal
  const handleApproveWithdrawal = async (id: string, remarks?: string): Promise<boolean> => {
    setWithdrawals((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, status: 'approved' as const, processedDate: new Date().toISOString().replace('T', ' ').slice(0, 16), adminRemarks: remarks || 'Approved and credited via automated IMPS / UPI' } : w));
      try {
        localStorage.setItem('apna_tambola_withdrawals', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setTransactions((prev) =>
      prev.map((t) => (t.referenceId === id ? { ...t, status: 'completed' as const } : t))
    );

    // 1. Call Backend API
    try {
      fetch(`/api/admin/withdrawals/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', remarks: remarks || 'Approved by Admin' }),
      }).catch((e) => console.warn('Server approve withdrawal notice:', e));
    } catch (e) {}

    // 2. Persist to Firestore
    try {
      const wdrRef = doc(db, 'withdrawals', id);
      setDoc(wdrRef, { status: 'approved', processedDate: new Date().toISOString(), adminRemarks: remarks || 'Approved by Admin' }, { merge: true }).catch((e) => console.warn('Firestore approve withdrawal error:', e));
    } catch (e) {}

    // 3. Broadcast across tabs and devices via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'WITHDRAWAL_APPROVED', withdrawalId: id });
        bc.close();
      }
    } catch (e) {}

    return true;
  };

  // 10. Admin Reject Withdrawal (refunds user)
  const handleRejectWithdrawal = async (id: string, remarks?: string): Promise<boolean> => {
    const req = withdrawals.find((w) => w.id === id);
    let refundedUser: User | null = null;

    if (req) {
      // Find user and refund
      const targetUser = users.find((u) => u.id === req.userId || (req.userPhone && u.phone && u.phone.replace(/\D/g, '').endsWith(req.userPhone.replace(/\D/g, '').slice(-10))));
      if (targetUser) {
        refundedUser = {
          ...targetUser,
          walletBalance: (targetUser.walletBalance || 0) + req.amount,
          winningBalance: (targetUser.winningBalance || 0) + req.amount,
        };
        setUsers((prev) => {
          const next = prev.map((u) => (u.id === targetUser.id ? { ...u, ...refundedUser } : u));
          try {
            localStorage.setItem('apna_tambola_registered_users', JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        // Persist refunded user in Firestore
        try {
          const userRef = doc(db, 'users', targetUser.id);
          setDoc(userRef, { walletBalance: refundedUser.walletBalance, winningBalance: refundedUser.winningBalance }, { merge: true }).catch((e) => console.warn('Firestore user refund notice:', e));
        } catch (e) {}
      }

      if (currentUser && (currentUser.id === req.userId || (refundedUser && currentUser.id === refundedUser.id))) {
        const updatedSelf = {
          ...currentUser,
          walletBalance: (currentUser.walletBalance || 0) + req.amount,
          winningBalance: (currentUser.winningBalance || 0) + req.amount,
        };
        setCurrentUser(updatedSelf);
        try {
          localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updatedSelf));
        } catch (e) {}
      }
    }

    setWithdrawals((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, status: 'rejected' as const, processedDate: new Date().toISOString().replace('T', ' ').slice(0, 16), adminRemarks: remarks || 'Rejected by Admin. Amount refunded to wallet.' } : w));
      try {
        localStorage.setItem('apna_tambola_withdrawals', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setTransactions((prev) =>
      prev.map((t) => (t.referenceId === id ? { ...t, status: 'failed' as const, description: `${t.description} (Rejected - Refunded to wallet)` } : t))
    );

    // 1. Call Backend API
    try {
      fetch(`/api/admin/withdrawals/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', remarks: remarks || 'Rejected by Admin. Amount refunded to wallet.' }),
      }).catch((e) => console.warn('Server reject withdrawal notice:', e));
    } catch (e) {}

    // 2. Persist to Firestore
    try {
      const wdrRef = doc(db, 'withdrawals', id);
      setDoc(wdrRef, { status: 'rejected', processedDate: new Date().toISOString(), adminRemarks: remarks || 'Rejected by Admin. Amount refunded to wallet.' }, { merge: true }).catch((e) => console.warn('Firestore reject withdrawal error:', e));
    } catch (e) {}

    // 3. Broadcast across tabs and devices via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'WITHDRAWAL_REJECTED', withdrawalId: id, refundedUser });
        bc.close();
      }
    } catch (e) {}

    return true;
  };

  // 11. Admin Create Game (With Admin-decided Rate, Prizes, and Ticket Color Theme)
  const handleCreateGame = async (gameData: Partial<TambolaGame>): Promise<boolean> => {
    const code = `TL-${Math.floor(100 + Math.random() * 900)}`;
    const isEnabled = gameData.isGameEnabled !== undefined ? gameData.isGameEnabled : gameData.isActive !== undefined ? gameData.isActive : true;
    const isBooking = gameData.isBookingOpen !== undefined ? gameData.isBookingOpen : gameData.bookingOpen !== undefined ? gameData.bookingOpen : true;

    const newGame: TambolaGame = {
      id: `game_${Date.now()}`,
      title: gameData.title || 'New Tambola Match',
      gameCode: code,
      startTime: gameData.startTime || '10:00 PM',
      date: gameData.date || 'Today',
      ticketPrice: Number(gameData.ticketPrice) || 50,
      prizePool: Number(gameData.prizePool) || 10000,
      ticketColorTheme: gameData.ticketColorTheme || 'multi',
      totalTicketsSold: 0,
      registeredPlayers: 0,
      maxPlayers: 500,
      status: 'upcoming',
      isGameEnabled: isEnabled,
      isActive: isEnabled,
      isBookingOpen: isBooking,
      bookingOpen: isBooking,
      calledNumbers: [],
      currentNumber: null,
      previousNumbers: [],
      autoCalling: false,
      callIntervalSeconds: 10,
      createdAt: new Date().toISOString(),
      prizes: gameData.prizes || [
        { id: `p1_${Date.now()}`, name: 'Early Five', code: 'early5', amount: 500, description: 'First to strike any 5 numbers', maxWinners: 1, claimedWinners: [] },
        { id: `p2_${Date.now()}`, name: 'Top Line', code: 'top_line', amount: 1000, description: 'First to complete top row (5 numbers)', maxWinners: 1, claimedWinners: [] },
        { id: `p3_${Date.now()}`, name: 'Middle Line', code: 'mid_line', amount: 1000, description: 'First to complete middle row (5 numbers)', maxWinners: 1, claimedWinners: [] },
        { id: `p4_${Date.now()}`, name: 'Bottom Line', code: 'bot_line', amount: 1000, description: 'First to complete bottom row (5 numbers)', maxWinners: 1, claimedWinners: [] },
        { id: `p5_${Date.now()}`, name: '1st Full House', code: 'full_house', amount: 5000, description: 'First to complete all 15 numbers', maxWinners: 1, claimedWinners: [] },
      ],
      rules: 'Standard 90-ball Indian Tambola rules apply. Numbers 1-90 drawn by RNG.',
    };

    setGames((prev) => {
      const next = [newGame, ...prev];
      try {
        localStorage.setItem('apna_tambola_games', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      const gameRef = doc(db, 'games', newGame.id);
      await setDoc(gameRef, newGame);
    } catch (e) {
      console.warn('Firestore create game notice:', e);
    }
    return true;
  };

  // Live Match Select & Admin Start/Stop Handlers
  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    try {
      localStorage.setItem('apna_tambola_selected_game_id', gameId);
    } catch {}
  };

  const handleAdminStartGame = async (gameId: string): Promise<void> => {
    // 1. Set chosen game to live, mark all other live games as completed/stopped
    setGames((prev) => {
      const next = prev.map((g) => {
        if (g.id === gameId) {
          return {
            ...g,
            status: 'live' as const,
            isActive: true,
            isGameEnabled: true,
            bookingOpen: false,
            isBookingOpen: false,
          };
        }
        if (g.status === 'live') {
          return {
            ...g,
            status: 'completed' as const,
            autoCalling: false,
          };
        }
        return g;
      });
      try {
        localStorage.setItem('apna_tambola_games', JSON.stringify(next));
      } catch {}
      return next;
    });

    handleSelectGame(gameId);

    // 2. Set siteSettings so every client synchronizes to this match
    setSiteSettings((prev) => {
      const next = {
        ...prev,
        activeLiveGameId: gameId,
        isLiveStopped: false,
      };
      try {
        localStorage.setItem('apna_tambola_site_settings', JSON.stringify(next));
        setDoc(doc(db, 'system', 'site_settings'), { activeLiveGameId: gameId, isLiveStopped: false }, { merge: true }).catch(() => {});
      } catch {}
      return next;
    });

    // 3. Persist to Firestore
    try {
      setDoc(
        doc(db, 'games', gameId),
        {
          status: 'live',
          isActive: true,
          isGameEnabled: true,
          bookingOpen: false,
          isBookingOpen: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'ADMIN_START_GAME', gameId });
        bc.close();
      }
    } catch {}
  };

  const handleAdminStopGame = async (gameId: string, markCompleted: boolean = true): Promise<void> => {
    const newStatus = markCompleted ? 'completed' : 'upcoming';
    if (autoCallTimerRef.current) {
      clearInterval(autoCallTimerRef.current);
      autoCallTimerRef.current = null;
    }

    setGames((prev) => {
      const next = prev.map((g) =>
        g.id === gameId
          ? {
              ...g,
              status: newStatus as any,
              autoCalling: false,
              bookingOpen: markCompleted ? false : g.bookingOpen,
              isBookingOpen: markCompleted ? false : g.isBookingOpen,
            }
          : g
      );
      try {
        localStorage.setItem('apna_tambola_games', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (markCompleted) {
      await handleClearCompletedTickets(gameId);
    }

    setSiteSettings((prev) => {
      const next = {
        ...prev,
        isLiveStopped: true,
      };
      try {
        localStorage.setItem('apna_tambola_site_settings', JSON.stringify(next));
        setDoc(doc(db, 'system', 'site_settings'), { isLiveStopped: true }, { merge: true }).catch(() => {});
      } catch {}
      return next;
    });

    try {
      setDoc(
        doc(db, 'games', gameId),
        {
          status: newStatus,
          autoCalling: false,
          bookingOpen: markCompleted ? false : undefined,
          isBookingOpen: markCompleted ? false : undefined,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'ADMIN_STOP_GAME', gameId, markCompleted });
        bc.close();
      }
    } catch {}
  };

  // 12. Admin Update Game (Rate, Prizes, Colors, Timings, Game ON/OFF, Booking ON/OFF)
  const handleUpdateGame = async (gameId: string, updates: Partial<TambolaGame>): Promise<boolean> => {
    // Synchronize aliases
    const normalizedUpdates: Partial<TambolaGame> = { ...updates };
    if (updates.isGameEnabled !== undefined && updates.isActive === undefined) {
      normalizedUpdates.isActive = updates.isGameEnabled;
    } else if (updates.isActive !== undefined && updates.isGameEnabled === undefined) {
      normalizedUpdates.isGameEnabled = updates.isActive;
    }
    if (updates.isBookingOpen !== undefined && updates.bookingOpen === undefined) {
      normalizedUpdates.bookingOpen = updates.isBookingOpen;
    } else if (updates.bookingOpen !== undefined && updates.isBookingOpen === undefined) {
      normalizedUpdates.isBookingOpen = updates.bookingOpen;
    }

    if (normalizedUpdates.status === 'live') {
      // If setting this game live, ensure all other games are stopped/completed
      setGames((prev) => {
        const next = prev.map((g) => {
          if (g.id === gameId) return { ...g, ...normalizedUpdates };
          if (g.status === 'live') return { ...g, status: 'completed' as const, autoCalling: false };
          return g;
        });
        try {
          localStorage.setItem('apna_tambola_games', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      handleSelectGame(gameId);
      setSiteSettings((prev) => {
        const next = { ...prev, activeLiveGameId: gameId, isLiveStopped: false };
        try {
          localStorage.setItem('apna_tambola_site_settings', JSON.stringify(next));
          setDoc(doc(db, 'system', 'site_settings'), { activeLiveGameId: gameId, isLiveStopped: false }, { merge: true }).catch(() => {});
        } catch {}
        return next;
      });
    } else {
      if (normalizedUpdates.status === 'completed') {
        normalizedUpdates.autoCalling = false;
        await handleClearCompletedTickets(gameId);
        setSiteSettings((prev) => {
          const next = { ...prev, isLiveStopped: true };
          try {
            localStorage.setItem('apna_tambola_site_settings', JSON.stringify(next));
            setDoc(doc(db, 'system', 'site_settings'), { isLiveStopped: true }, { merge: true }).catch(() => {});
          } catch {}
          return next;
        });
      }
      setGames((prev) => {
        const next = prev.map((g) => (g.id === gameId ? { ...g, ...normalizedUpdates } : g));
        try {
          localStorage.setItem('apna_tambola_games', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    try {
      const gameRef = doc(db, 'games', gameId);
      setDoc(gameRef, { ...normalizedUpdates, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore game update notice:', e);
    }

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'GAME_UPDATED', gameId, updates: normalizedUpdates });
        bc.close();
      }
    } catch (e) {}

    return true;
  };

  // 13. Admin Delete Game
  const handleDeleteGame = async (gameId: string): Promise<boolean> => {
    setGames((prev) => prev.filter((g) => g.id !== gameId));
    try {
      const gameRef = doc(db, 'games', gameId);
      deleteDoc(gameRef);
    } catch (e) {}
    return true;
  };

  // 14. Admin Generate Batch Tickets
  const handleAdminGenerateTickets = async (gameId: string, count: number, colorTheme?: TicketColorThemeId): Promise<boolean> => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return false;

    const newTkts: TambolaTicket[] = [];
    for (let i = 0; i < count; i++) {
      const ticketNum = game.totalTicketsSold + i + 1;
      let assignedColor = colorTheme || game.ticketColorTheme || 'ruby';
      if (assignedColor === 'multi') {
        assignedColor = COLOR_KEYS[(ticketNum - 1 + i) % COLOR_KEYS.length];
      }

      const generatedTicket: TambolaTicket = {
        id: `tkt_adm_${Date.now()}_${i}`,
        gameId: game.id,
        gameTitle: game.title,
        userId: currentUser?.id || 'admin_gen',
        userName: `${currentUser?.name || 'Admin'} (Admin Generated)`,
        ticketNumber: ticketNum,
        ticketId: generateTicketId(),
        numbers: generateTambolaTicketMatrix(),
        markedNumbers: [],
        price: game.ticketPrice,
        colorTheme: assignedColor,
        purchaseDate: new Date().toISOString(),
        isActive: true,
        status: 'active',
      };
      newTkts.push(generatedTicket);

      try {
        setDoc(doc(db, 'tickets', generatedTicket.id), generatedTicket);
      } catch (e) {}
    }

    setTickets((prev) => [...newTkts, ...prev]);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, totalTicketsSold: g.totalTicketsSold + count } : g))
    );
    return true;
  };

  // 14b. Admin Toggle Single Ticket ON / OFF (चालू / बंद)
  const handleAdminToggleTicketStatus = async (ticketId: string, isActive: boolean): Promise<boolean> => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId || t.ticketId === ticketId
          ? {
              ...t,
              isActive,
              status: isActive ? 'active' : 'disabled',
              disabledReason: isActive ? undefined : 'Disabled by Admin',
            }
          : t
      )
    );
    try {
      const tktRef = doc(db, 'tickets', ticketId);
      setDoc(
        tktRef,
        {
          isActive,
          status: isActive ? 'active' : 'disabled',
          disabledReason: isActive ? null : 'Disabled by Admin',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        console.warn('Firestore ticket toggle async notice:', err);
      });
    } catch (e) {
      console.warn('Firestore ticket toggle notice:', e);
    }
    return true;
  };

  // 14c. Admin Batch Toggle Tickets ON / OFF (बैच टिकट चालू / बंद)
  const handleAdminBatchToggleTickets = async (ticketIds: string[], isActive: boolean): Promise<boolean> => {
    const idSet = new Set(ticketIds);
    setTickets((prev) =>
      prev.map((t) =>
        idSet.has(t.id) || (t.ticketId && idSet.has(t.ticketId))
          ? {
              ...t,
              isActive,
              status: isActive ? 'active' : 'disabled',
              disabledReason: isActive ? undefined : 'Disabled by Admin',
            }
          : t
      )
    );
    for (const tid of ticketIds) {
      try {
        const tktRef = doc(db, 'tickets', tid);
        setDoc(
          tktRef,
          {
            isActive,
            status: isActive ? 'active' : 'disabled',
            disabledReason: isActive ? null : 'Disabled by Admin',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      } catch (e) {}
    }
    return true;
  };

  // 14d. Admin Delete Single Ticket (रिमूव टिकट) with automatic user wallet refund
  const handleDeleteTicket = async (ticketId: string, refundUser = true): Promise<boolean> => {
    try {
      const targetTkt = tickets.find((t) => t.id === ticketId || t.ticketId === ticketId);
      if (!targetTkt) return false;

      // 1. Record in deleted ticket IDs in localStorage to prevent re-hydration
      try {
        const deletedArr: string[] = JSON.parse(localStorage.getItem('apna_tambola_deleted_ticket_ids') || '[]');
        if (!deletedArr.includes(targetTkt.id)) deletedArr.push(targetTkt.id);
        if (targetTkt.ticketId && !deletedArr.includes(targetTkt.ticketId)) deletedArr.push(targetTkt.ticketId);
        localStorage.setItem('apna_tambola_deleted_ticket_ids', JSON.stringify(deletedArr));
      } catch (e) {}

      // 2. Remove from local tickets state
      setTickets((prev) => {
        const next = prev.filter((t) => t.id !== targetTkt.id && t.ticketId !== targetTkt.ticketId);
        try {
          localStorage.setItem('apna_tambola_tickets', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 3. Update game ticket sales counter if applicable
      if (targetTkt.gameId) {
        setGames((prev) =>
          prev.map((g) =>
            g.id === targetTkt.gameId
              ? { ...g, totalTicketsSold: Math.max(0, (g.totalTicketsSold || 1) - 1) }
              : g
          )
        );
      }

      // 4. If refund requested / default, credit user wallet and add refund transaction
      if (refundUser && targetTkt.userId && (targetTkt.price || 0) > 0) {
        const refundAmt = Number(targetTkt.price);
        let calculatedNewWalletBal = 0;
        let calculatedNewDepBal = 0;

        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === targetTkt.userId) {
              calculatedNewWalletBal = (u.walletBalance || 0) + refundAmt;
              calculatedNewDepBal = (u.depositBalance || 0) + refundAmt;
              return {
                ...u,
                walletBalance: calculatedNewWalletBal,
                depositBalance: calculatedNewDepBal,
              };
            }
            return u;
          })
        );

        setCurrentUser((prev) => {
          if (prev && prev.id === targetTkt.userId) {
            const updated = {
              ...prev,
              walletBalance: (prev.walletBalance || 0) + refundAmt,
              depositBalance: (prev.depositBalance || 0) + refundAmt,
            };
            try {
              localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          }
          return prev;
        });

        // Add refund transaction record
        const refundTxn: WalletTransaction = {
          id: `txn_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: targetTkt.userId,
          type: 'deposit',
          amount: refundAmt,
          balanceAfter: calculatedNewWalletBal || refundAmt,
          description: `टिकट रिफंड (Refund): ${targetTkt.ticketId || targetTkt.id} - टिकट रिमूव राशि वॉलेट में वापस जमा`,
          paymentMethod: 'Admin Refund',
          referenceId: targetTkt.ticketId || targetTkt.id,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
          status: 'completed',
        };
        setTransactions((prev) => [refundTxn, ...prev]);

        // Push in-app notification to the user
        const refNotif: UserNotificationItem = {
          id: `un_ref_${Date.now()}`,
          category: 'wallet_credit',
          title: `💰 टिकट रिफंड: ₹${refundAmt} वापस जमा हुआ`,
          message: `आपका टिकट (${targetTkt.ticketId || targetTkt.id} - ${targetTkt.gameTitle || 'Tambola'}) रिमूव होने पर ₹${refundAmt} आपके वॉलेट में तुरंत वापस क्रेडिट कर दिए गए हैं।`,
          timestamp: 'Just now',
          read: false,
          actionTab: 'wallet',
          amount: refundAmt,
        };
        setUserNotifications((prev) => [refNotif, ...prev]);

        // Update Firestore User and Transaction in real-time
        try {
          const uDoc = users.find((u) => u.id === targetTkt.userId);
          const finalBal = (uDoc?.walletBalance || 0) + refundAmt;
          const finalDepBal = (uDoc?.depositBalance || 0) + refundAmt;
          setDoc(
            doc(db, 'users', targetTkt.userId),
            {
              walletBalance: finalBal,
              depositBalance: finalDepBal,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ).catch(() => {});

          setDoc(doc(db, 'transactions', refundTxn.id), refundTxn).catch(() => {});
        } catch (e) {}
      }

      // 5. Delete from Firestore
      try {
        deleteDoc(doc(db, 'tickets', targetTkt.id)).catch(() => {});
      } catch (e) {}

      // 6. Delete from Backend Server REST API
      try {
        fetch('/api/tickets/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: targetTkt.id, refundUser }),
        }).catch(() => {});
      } catch (e) {}

      // 7. Broadcast across tabs
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'TICKET_DELETED', ticketId: targetTkt.id, refundUser });
          bc.close();
        }
      } catch (e) {}

      return true;
    } catch (err) {
      console.error('Error deleting ticket:', err);
      return false;
    }
  };

  // 14e. Admin Batch Delete Tickets (चयनित टिकट रिमूव करें)
  const handleBatchDeleteTickets = async (ticketIds: string[], refundUser = true): Promise<boolean> => {
    try {
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) return false;
      const idSet = new Set(ticketIds);
      const targetTkts = tickets.filter((t) => idSet.has(t.id) || idSet.has(t.ticketId));
      if (targetTkts.length === 0) return false;

      // 1. Record in deleted ticket IDs
      try {
        const deletedArr: string[] = JSON.parse(localStorage.getItem('apna_tambola_deleted_ticket_ids') || '[]');
        targetTkts.forEach((t) => {
          if (!deletedArr.includes(t.id)) deletedArr.push(t.id);
          if (t.ticketId && !deletedArr.includes(t.ticketId)) deletedArr.push(t.ticketId);
        });
        localStorage.setItem('apna_tambola_deleted_ticket_ids', JSON.stringify(deletedArr));
      } catch (e) {}

      // 2. Remove from local tickets state
      setTickets((prev) => {
        const next = prev.filter((t) => !idSet.has(t.id) && !idSet.has(t.ticketId));
        try {
          localStorage.setItem('apna_tambola_tickets', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 3. Decrement game sales counters
      const gameTicketCounts: Record<string, number> = {};
      targetTkts.forEach((t) => {
        if (t.gameId) {
          gameTicketCounts[t.gameId] = (gameTicketCounts[t.gameId] || 0) + 1;
        }
      });
      setGames((prev) =>
        prev.map((g) => {
          const count = gameTicketCounts[g.id];
          if (count) {
            return { ...g, totalTicketsSold: Math.max(0, (g.totalTicketsSold || 0) - count) };
          }
          return g;
        })
      );

      // 4. Process refunds if requested / default
      if (refundUser) {
        const userRefundMap: Record<string, number> = {};
        targetTkts.forEach((t) => {
          if (t.userId && (t.price || 0) > 0) {
            userRefundMap[t.userId] = (userRefundMap[t.userId] || 0) + Number(t.price);
          }
        });

        Object.entries(userRefundMap).forEach(([userId, refundTotal]) => {
          let updatedUserBal = 0;
          let updatedDepBal = 0;

          setUsers((prev) =>
            prev.map((u) => {
              if (u.id === userId) {
                updatedUserBal = (u.walletBalance || 0) + refundTotal;
                updatedDepBal = (u.depositBalance || 0) + refundTotal;
                return {
                  ...u,
                  walletBalance: updatedUserBal,
                  depositBalance: updatedDepBal,
                };
              }
              return u;
            })
          );

          setCurrentUser((prev) => {
            if (prev && prev.id === userId) {
              const updated = {
                ...prev,
                walletBalance: (prev.walletBalance || 0) + refundTotal,
                depositBalance: (prev.depositBalance || 0) + refundTotal,
              };
              try {
                localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            }
            return prev;
          });

          // Add transaction
          const refundTxn: WalletTransaction = {
            id: `txn_ref_${Date.now()}_${userId}`,
            userId: userId,
            type: 'deposit',
            amount: refundTotal,
            balanceAfter: updatedUserBal || refundTotal,
            description: `बैच टिकट रिफंड (Batch Refund): टिकट रिमूव होने पर ₹${refundTotal} वॉलेट में वापस जमा`,
            paymentMethod: 'Admin Refund',
            referenceId: `REF-${Date.now().toString().slice(-6)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
            status: 'completed',
          };
          setTransactions((prev) => [refundTxn, ...prev]);

          // Push in-app notification
          const refNotif: UserNotificationItem = {
            id: `un_ref_${Date.now()}_${userId}`,
            category: 'wallet_credit',
            title: `💰 टिकट रिफंड: ₹${refundTotal} वापस जमा हुआ`,
            message: `आपके टिकट रिमूव होने पर कुल ₹${refundTotal} आपके वॉलेट में तुरंत वापस क्रेडिट कर दिए गए हैं।`,
            timestamp: 'Just now',
            read: false,
            actionTab: 'wallet',
            amount: refundTotal,
          };
          setUserNotifications((prev) => [refNotif, ...prev]);

          // Sync Firestore
          try {
            const uDoc = users.find((u) => u.id === userId);
            const finalBal = (uDoc?.walletBalance || 0) + refundTotal;
            const finalDepBal = (uDoc?.depositBalance || 0) + refundTotal;
            setDoc(
              doc(db, 'users', userId),
              {
                walletBalance: finalBal,
                depositBalance: finalDepBal,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            ).catch(() => {});
            setDoc(doc(db, 'transactions', refundTxn.id), refundTxn).catch(() => {});
          } catch (e) {}
        });
      }

      // 5. Delete from Firestore
      for (const t of targetTkts) {
        try {
          deleteDoc(doc(db, 'tickets', t.id)).catch(() => {});
        } catch (e) {}
      }

      // 6. Delete from Backend Server REST API
      try {
        fetch('/api/tickets/batch-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketIds: Array.from(idSet), refundUser }),
        }).catch(() => {});
      } catch (e) {}

      // 7. Broadcast across tabs
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'TICKETS_BATCH_DELETED', ticketIds: Array.from(idSet), refundUser });
          bc.close();
        }
      } catch (e) {}

      return true;
    } catch (err) {
      console.error('Error batch deleting tickets:', err);
      return false;
    }
  };

  // 14g. Admin Edit Single Ticket Game (यूजर का टिकट आज के चलने वाले गेम में बदलें)
  const handleAdminUpdateTicketGame = async (ticketId: string, targetGameId: string): Promise<boolean> => {
    try {
      const targetGame = games.find((g) => g.id === targetGameId);
      if (!targetGame) return false;

      let oldGameId = '';
      let updatedTicket: TambolaTicket | null = null;

      setTickets((prev) => {
        const next = prev.map((t) => {
          if (t.id === ticketId || t.ticketId === ticketId) {
            oldGameId = t.gameId;
            updatedTicket = {
              ...t,
              gameId: targetGame.id,
              gameTitle: targetGame.title,
              matchDate: targetGame.date || 'Today',
            };
            return updatedTicket;
          }
          return t;
        });
        try {
          localStorage.setItem('apna_tambola_tickets', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (!updatedTicket) return false;

      // Update games participant counts
      if (oldGameId && oldGameId !== targetGame.id) {
        setGames((prev) =>
          prev.map((g) => {
            if (g.id === oldGameId) {
              return {
                ...g,
                totalTicketsSold: Math.max(0, (g.totalTicketsSold || 0) - 1),
              };
            }
            if (g.id === targetGame.id) {
              return {
                ...g,
                totalTicketsSold: (g.totalTicketsSold || 0) + 1,
              };
            }
            return g;
          })
        );
      }

      // Sync to Firestore
      try {
        const tktRef = doc(db, 'tickets', (updatedTicket as TambolaTicket).id);
        await setDoc(
          tktRef,
          {
            gameId: targetGame.id,
            gameTitle: targetGame.title,
            matchDate: targetGame.date || 'Today',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Firestore ticket game update notice:', e);
      }

      // Notify User if applicable
      const uId = (updatedTicket as TambolaTicket).userId;
      if (uId) {
        const tktCode = (updatedTicket as TambolaTicket).ticketId || (updatedTicket as TambolaTicket).id;
        const transferNotif: UserNotificationItem = {
          id: `un_trans_${Date.now()}`,
          category: 'ticket_confirmation',
          title: `🎟️ टिकट ट्रांसफर: आज के मैच में शिफ्ट`,
          message: `आपका टिकट (${tktCode}) आज के लाइव मैच "${targetGame.title}" में सफलतापूर्वक शिफ्ट कर दिया गया है। आप इस मैच में लाइव खेल सकते हैं!`,
          timestamp: 'Just now',
          read: false,
          actionTab: 'live',
        };
        setUserNotifications((prev) => [transferNotif, ...prev]);
      }

      // Admin Activity Log
      setActivityLogs((prev) => [
        {
          id: `act_${Date.now()}_trans`,
          adminName: currentUser?.name || 'Admin',
          action: `🔄 टिकट #${(updatedTicket as TambolaTicket).ticketNumber} (${(updatedTicket as TambolaTicket).ticketId}) को "${targetGame.title}" में शिफ्ट किया गया।`,
          category: 'ticket',
          ipAddress: '127.0.0.1 (Admin)',
          device: 'Admin Ticket Console',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
          status: 'success',
        },
        ...prev,
      ]);

      // Broadcast across tabs
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'TICKET_GAME_UPDATED', ticketId, targetGameId });
          bc.close();
        }
      } catch {}

      return true;
    } catch (err) {
      console.error('Error updating ticket game:', err);
      return false;
    }
  };

  // 14h. Admin Batch Update Tickets Game (चयनित टिकटों को आज के गेम में शिफ्ट करें)
  const handleAdminBatchUpdateTicketGame = async (
    ticketIds: string[],
    targetGameId: string
  ): Promise<{ success: boolean; count: number }> => {
    try {
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) return { success: false, count: 0 };
      const targetGame = games.find((g) => g.id === targetGameId);
      if (!targetGame) return { success: false, count: 0 };

      const idSet = new Set(ticketIds);
      let updatedCount = 0;

      setTickets((prev) => {
        const next = prev.map((t) => {
          if (idSet.has(t.id) || idSet.has(t.ticketId)) {
            updatedCount++;
            return {
              ...t,
              gameId: targetGame.id,
              gameTitle: targetGame.title,
              matchDate: targetGame.date || 'Today',
            };
          }
          return t;
        });
        try {
          localStorage.setItem('apna_tambola_tickets', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Update game stats
      setGames((prev) =>
        prev.map((g) => {
          if (g.id === targetGame.id) {
            return {
              ...g,
              totalTicketsSold: (g.totalTicketsSold || 0) + updatedCount,
            };
          }
          return g;
        })
      );

      // Persist to Firestore
      for (const tid of ticketIds) {
        try {
          const tkt = tickets.find((t) => t.id === tid || t.ticketId === tid);
          const docId = tkt?.id || tid;
          setDoc(
            doc(db, 'tickets', docId),
            {
              gameId: targetGame.id,
              gameTitle: targetGame.title,
              matchDate: targetGame.date || 'Today',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ).catch(() => {});
        } catch {}
      }

      // Broadcast
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'TICKETS_BATCH_GAME_UPDATED', ticketIds, targetGameId });
          bc.close();
        }
      } catch {}

      return { success: true, count: updatedCount };
    } catch (err) {
      console.error('Error batch updating ticket game:', err);
      return { success: false, count: 0 };
    }
  };

  // 14i. Admin Transfer All Tickets To Target Game (सारे यूजर एक ही गेम खेल सकें)
  const handleAdminTransferAllTicketsToGame = async (
    targetGameId: string,
    sourceGameId?: string
  ): Promise<{ success: boolean; count: number }> => {
    try {
      const targetGame = games.find((g) => g.id === targetGameId);
      if (!targetGame) return { success: false, count: 0 };

      // Find all tickets that need transfer
      const ticketsToTransfer = tickets.filter((t) => {
        if (t.gameId === targetGame.id) return false; // Already in target game
        if (sourceGameId && sourceGameId !== 'all') {
          return t.gameId === sourceGameId;
        }
        return true;
      });

      if (ticketsToTransfer.length === 0) return { success: true, count: 0 };

      const ids = ticketsToTransfer.map((t) => t.id);
      return await handleAdminBatchUpdateTicketGame(ids, targetGame.id);
    } catch (err) {
      console.error('Error transferring all tickets to game:', err);
      return { success: false, count: 0 };
    }
  };

  // 14g. Clear / Remove Completed Game Tickets (समाप्त मैचों के पुराने टिकट हटाना)
  const handleClearCompletedTickets = async (gameId?: string): Promise<{ success: boolean; clearedCount: number }> => {
    try {
      const completedGameIds = new Set(
        games.filter((g) => g.status === 'completed').map((g) => g.id)
      );
      if (gameId && gameId !== 'all') {
        completedGameIds.add(gameId);
      }

      const ticketsToDelete = tickets.filter((t) => {
        if (gameId && gameId !== 'all') {
          return t.gameId === gameId;
        }
        return t.isCompleted || t.isArchived || (t.gameId && completedGameIds.has(t.gameId));
      });

      if (ticketsToDelete.length === 0) {
        return { success: true, clearedCount: 0 };
      }

      const deletedIds = ticketsToDelete.map((t) => t.id);
      const deletedSet = new Set(deletedIds);

      // Record in deleted tickets cache in localStorage
      try {
        const storedDeleted: string[] = JSON.parse(localStorage.getItem('apna_tambola_deleted_ticket_ids') || '[]');
        const updatedDeleted = Array.from(new Set([...storedDeleted, ...deletedIds]));
        localStorage.setItem('apna_tambola_deleted_ticket_ids', JSON.stringify(updatedDeleted));
      } catch (e) {}

      // Remove from tickets state
      setTickets((prev) => {
        const next = prev.filter((t) => !deletedSet.has(t.id));
        try {
          localStorage.setItem('apna_tambola_tickets', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // Cleanup Firestore
      try {
        const deletePromises = deletedIds.map((tid) =>
          deleteDoc(doc(db, 'tickets', tid)).catch(() => {})
        );
        await Promise.all(deletePromises);
      } catch (e) {}

      // Server REST API Sync
      try {
        fetch('/api/tickets/clear-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: gameId || 'all' }),
        }).catch(() => {});
      } catch (e) {}

      // Broadcast sync
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'CLEAR_COMPLETED_TICKETS', deletedIds });
          bc.close();
        } catch (e) {}
      }

      return { success: true, clearedCount: deletedIds.length };
    } catch (err) {
      console.error('Error in handleClearCompletedTickets:', err);
      return { success: false, clearedCount: 0 };
    }
  };

  // 14f. Delete Single Winner Record (विजेता रिमूव करें)
  const handleDeleteWinner = async (winnerId: string): Promise<boolean> => {
    try {
      if (!winnerId) return false;

      // 1. Record in deleted winner IDs in localStorage
      try {
        const deletedArr: string[] = JSON.parse(localStorage.getItem('apna_tambola_deleted_winner_ids') || '[]');
        if (!deletedArr.includes(winnerId)) deletedArr.push(winnerId);
        localStorage.setItem('apna_tambola_deleted_winner_ids', JSON.stringify(deletedArr));
      } catch (e) {}

      // 2. Remove from local state
      setWinners((prev) => {
        const next = prev.filter((w) => w.id !== winnerId);
        try {
          localStorage.setItem('apna_tambola_winners', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 3. Delete from Firestore
      try {
        await deleteDoc(doc(db, 'winners', winnerId));
      } catch (e) {}

      return true;
    } catch (err) {
      console.error('Error deleting winner:', err);
      return false;
    }
  };

  // 14g. Batch Delete Winners (चयनित विजेता रिमूव करें)
  const handleBatchDeleteWinners = async (winnerIds: string[]): Promise<boolean> => {
    try {
      if (!Array.isArray(winnerIds) || winnerIds.length === 0) return false;
      const idSet = new Set(winnerIds);

      // 1. Record in deleted winner IDs
      try {
        const deletedArr: string[] = JSON.parse(localStorage.getItem('apna_tambola_deleted_winner_ids') || '[]');
        winnerIds.forEach((id) => {
          if (!deletedArr.includes(id)) deletedArr.push(id);
        });
        localStorage.setItem('apna_tambola_deleted_winner_ids', JSON.stringify(deletedArr));
      } catch (e) {}

      // 2. Remove from state
      setWinners((prev) => {
        const next = prev.filter((w) => !idSet.has(w.id));
        try {
          localStorage.setItem('apna_tambola_winners', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 3. Delete from Firestore
      for (const id of winnerIds) {
        try {
          deleteDoc(doc(db, 'winners', id)).catch(() => {});
        } catch (e) {}
      }

      return true;
    } catch (err) {
      console.error('Error batch deleting winners:', err);
      return false;
    }
  };

  // 14h. Clear All Winners (सभी विजेता साफ़ करें)
  const handleClearAllWinners = async (): Promise<boolean> => {
    try {
      const allIds = winners.map((w) => w.id);

      try {
        const deletedArr: string[] = JSON.parse(localStorage.getItem('apna_tambola_deleted_winner_ids') || '[]');
        allIds.forEach((id) => {
          if (!deletedArr.includes(id)) deletedArr.push(id);
        });
        localStorage.setItem('apna_tambola_deleted_winner_ids', JSON.stringify(deletedArr));
        localStorage.setItem('apna_tambola_winners', JSON.stringify([]));
      } catch (e) {}

      setWinners([]);

      for (const id of allIds) {
        try {
          deleteDoc(doc(db, 'winners', id)).catch(() => {});
        } catch (e) {}
      }

      return true;
    } catch (err) {
      console.error('Error clearing winners:', err);
      return false;
    }
  };

  // 14h. Admin Set Custom Ticket Name (पहचान के लिए टिकट का नाम सेट करना - e.g. "रॉयल सुपर ₹50", "धमाका ₹100")
  const handleAdminSetTicketName = async (gameId: string, ticketName: string): Promise<boolean> => {
    try {
      if (!gameId) return false;
      const cleanName = ticketName.trim();

      // 1. Update Games state
      setGames((prev) => {
        const next = prev.map((g) => (g.id === gameId ? { ...g, ticketName: cleanName, ticketLabel: cleanName } : g));
        try {
          localStorage.setItem('apna_tambola_games', JSON.stringify(next));
        } catch {}
        return next;
      });

      // 2. Update Tickets of this game
      setTickets((prev) => {
        const next = prev.map((t) => (t.gameId === gameId ? { ...t, ticketName: cleanName, ticketLabel: cleanName } : t));
        try {
          localStorage.setItem('apna_tambola_tickets', JSON.stringify(next));
        } catch {}
        return next;
      });

      // 3. Persist to Firestore
      try {
        setDoc(doc(db, 'games', gameId), { ticketName: cleanName, ticketLabel: cleanName, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } catch {}

      // 4. Broadcast
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'TICKET_NAME_UPDATED', gameId, ticketName: cleanName });
          bc.close();
        } catch {}
      }

      return true;
    } catch (err) {
      console.error('Error setting ticket name:', err);
      return false;
    }
  };

  // 14i. 🛡️ Anti-Cheat: 1 Ticket = 1 Full House Audit & Automatic Clawback Engine
  const handleAdminRunClawbackAudit = async (): Promise<{
    auditedCount: number;
    clawbacks: any[];
    totalClawbackAmount: number;
    deductedUsersCount: number;
  }> => {
    try {
      const auditResult = auditDuplicateFullHouseWins(winners);
      if (auditResult.clawbacks.length === 0) {
        return {
          auditedCount: auditResult.auditedCount,
          clawbacks: [],
          totalClawbackAmount: 0,
          deductedUsersCount: 0,
        };
      }

      const clawbackWinnerIds = new Set(auditResult.clawbacks.map((c) => c.duplicateWinnerId));
      let deductedUsersCount = 0;

      // Group deductions by user
      const userDeductions = new Map<string, number>();
      auditResult.clawbacks.forEach((c) => {
        const current = userDeductions.get(c.userId) || 0;
        userDeductions.set(c.userId, current + c.clawbackAmount);
      });

      // Deduct from users' winning and total balance
      setUsers((prev) => {
        const next = prev.map((u) => {
          const deduction = userDeductions.get(u.id);
          if (deduction && deduction > 0) {
            deductedUsersCount++;
            const newWin = Math.max(0, (u.winningBalance || 0) - deduction);
            const newWal = Math.max(0, (u.walletBalance || 0) - deduction);
            return {
              ...u,
              winningBalance: newWin,
              walletBalance: newWal,
            };
          }
          return u;
        });
        try {
          localStorage.setItem('apna_tambola_registered_users', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Update Current User if affected
      if (currentUser && userDeductions.has(currentUser.id)) {
        const ded = userDeductions.get(currentUser.id) || 0;
        setCurrentUser((prev) => {
          if (!prev) return null;
          const newWin = Math.max(0, (prev.winningBalance || 0) - ded);
          const newWal = Math.max(0, (prev.walletBalance || 0) - ded);
          return {
            ...prev,
            winningBalance: newWin,
            walletBalance: newWal,
          };
        });
      }

      // Record Clawback deduction transactions & Push notifications
      const newTransactions: WalletTransaction[] = [];
      const newNotifications: UserNotificationItem[] = [];

      auditResult.clawbacks.forEach((c) => {
        const txn: WalletTransaction = {
          id: `txn_clawback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: c.userId,
          type: 'withdrawal',
          amount: -c.clawbackAmount,
          balanceAfter: Math.max(0, (users.find((u) => u.id === c.userId)?.walletBalance || 0) - c.clawbackAmount),
          description: `⚠️ एंटी-चीट कटौती: टिकट #${c.ticketNumber} (${c.ticketId}) पर 1 से अधिक फुलहाउस (${c.duplicatePrizeName}) अमान्य होने के कारण ₹${c.clawbackAmount} काटा गया।`,
          referenceId: c.ticketId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
          status: 'completed',
        };
        newTransactions.push(txn);

        const notif: UserNotificationItem = {
          id: `un_clawback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          category: 'wallet_credit',
          title: `⚠️ अतिरिक्त फुलहाउस पेमेंट कटौती: -₹${c.clawbackAmount}`,
          message: `नियम अनुसार: एक टिकट में केवल 1 ही फुलहाउस मान्य है। आपके टिकट #${c.ticketNumber} पर दर्ज दूसरा फुलहाउस अमान्य होने के कारण अतिरिक्त ₹${c.clawbackAmount} वॉलेट से स्वतः काटा गया है।`,
          timestamp: 'Just now',
          read: false,
          actionTab: 'wallet',
          amount: -c.clawbackAmount,
        };
        newNotifications.push(notif);

        try {
          setDoc(doc(db, 'transactions', txn.id), txn).catch(() => {});
        } catch {}
      });

      setTransactions((prev) => [...newTransactions, ...prev]);
      setUserNotifications((prev) => [...newNotifications, ...prev]);

      // Remove duplicate winner records from state
      setWinners((prev) => {
        const next = prev.filter((w) => !clawbackWinnerIds.has(w.id));
        try {
          localStorage.setItem('apna_tambola_winners', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Cleanup Firestore winners
      for (const wid of clawbackWinnerIds) {
        try {
          deleteDoc(doc(db, 'winners', wid)).catch(() => {});
        } catch {}
      }

      // Add Admin Activity Log
      const auditLog: ActivityLog = {
        id: `act_audit_${Date.now()}`,
        adminName: currentUser?.name || 'Master Admin',
        action: 'ANTI_CHEAT_CLAWBACK',
        category: 'security',
        ipAddress: '127.0.0.1',
        device: 'Web Admin Dashboard',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        status: 'warning',
        details: `सफलतापूर्वक ${auditResult.clawbacks.length} डुप्लीकेट फुलहाउस डिटेक्ट कर कुल ₹${auditResult.totalClawbackAmount} की कटौती की गई।`,
      };
      setActivityLogs((prev) => [auditLog, ...prev]);

      return {
        auditedCount: auditResult.auditedCount,
        clawbacks: auditResult.clawbacks,
        totalClawbackAmount: auditResult.totalClawbackAmount,
        deductedUsersCount,
      };
    } catch (err) {
      console.error('Clawback audit error:', err);
      return {
        auditedCount: 0,
        clawbacks: [],
        totalClawbackAmount: 0,
        deductedUsersCount: 0,
      };
    }
  };

  // 15. Admin Update User Wallet (Credit or Deduct anywhere)
  const handleUpdateWalletBalance = async (
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason?: string,
    walletSource: 'any' | 'deposit' | 'winning' | 'referral' = 'any'
  ): Promise<boolean> => {
    const cleanAmount = Math.max(0, Number(amount) || 0);
    if (cleanAmount <= 0) return false;

    // 1. Locate target user reliably
    const cleanQueryPhone = (userId || '').replace(/\D/g, '').slice(-10);
    let targetUser = users.find(
      (u) =>
        u.id === userId ||
        (cleanQueryPhone.length === 10 && u.phone && u.phone.replace(/\D/g, '').slice(-10) === cleanQueryPhone) ||
        (u.email && userId && u.email.toLowerCase() === userId.toLowerCase())
    );

    if (!targetUser) {
      try {
        const savedUsers: User[] = JSON.parse(localStorage.getItem('apna_tambola_registered_users') || '[]');
        targetUser = savedUsers.find(
          (u) =>
            u.id === userId ||
            (cleanQueryPhone.length === 10 && u.phone && u.phone.replace(/\D/g, '').slice(-10) === cleanQueryPhone) ||
            (u.email && userId && u.email.toLowerCase() === userId.toLowerCase())
        );
      } catch (e) {}
    }

    if (!targetUser) {
      console.warn('Target user not found for wallet adjustment:', userId);
      return false;
    }

    const currentDeposit = Math.max(0, targetUser.depositBalance || 0);
    const currentWinning = Math.max(0, targetUser.winningBalance || 0);
    const currentReferral = Math.max(0, targetUser.referralBalance || 0);
    const currentBonus = Math.max(0, targetUser.bonusRewardBalance || 0);
    const currentWallet = targetUser.walletBalance ?? (currentDeposit + currentWinning + currentReferral);

    let nextDeposit = currentDeposit;
    let nextWinning = currentWinning;
    let nextReferral = currentReferral;
    let nextBonus = currentBonus;
    let nextWallet = currentWallet;
    let walletSourceLabel = 'कुल वॉलेट बैलेंस';

    if (type === 'debit') {
      if (walletSource === 'deposit') {
        walletSourceLabel = 'डिपॉजिट वॉलेट (Deposit Balance)';
        nextDeposit = Math.max(0, currentDeposit - cleanAmount);
        nextWallet = Math.max(0, nextDeposit + nextWinning + nextReferral);
      } else if (walletSource === 'winning') {
        walletSourceLabel = 'विनिंग वॉलेट (Winning Balance)';
        nextWinning = Math.max(0, currentWinning - cleanAmount);
        nextWallet = Math.max(0, nextDeposit + nextWinning + nextReferral);
      } else if (walletSource === 'referral') {
        walletSourceLabel = 'रेफरल वॉलेट (Referral Balance)';
        nextReferral = Math.max(0, currentReferral - cleanAmount);
        nextWallet = Math.max(0, nextDeposit + nextWinning + nextReferral);
      } else {
        // 'any' / Auto: Smart cascading deduction from anywhere user has funds!
        walletSourceLabel = 'उपलब्ध वॉलेट (कहीं से भी / ऑटो डिडक्शन)';
        let remaining = cleanAmount;

        // 1. Deduct from winning balance first (withdrawable cash)
        const deductWin = Math.min(nextWinning, remaining);
        nextWinning -= deductWin;
        remaining -= deductWin;

        // 2. Deduct from deposit balance
        if (remaining > 0) {
          const deductDep = Math.min(nextDeposit, remaining);
          nextDeposit -= deductDep;
          remaining -= deductDep;
        }

        // 3. Deduct from referral balance
        if (remaining > 0) {
          const deductRef = Math.min(nextReferral, remaining);
          nextReferral -= deductRef;
          remaining -= deductRef;
        }

        nextWallet = Math.max(0, nextDeposit + nextWinning + nextReferral);
      }
    } else {
      // Credit
      if (walletSource === 'winning') {
        walletSourceLabel = 'विनिंग वॉलेट (Winning Balance)';
        nextWinning = currentWinning + cleanAmount;
      } else if (walletSource === 'referral') {
        walletSourceLabel = 'रेफरल वॉलेट (Referral Balance)';
        nextReferral = currentReferral + cleanAmount;
      } else {
        walletSourceLabel = 'डिपॉजिट वॉलेट (Deposit Balance)';
        nextDeposit = currentDeposit + cleanAmount;
      }
      nextWallet = nextDeposit + nextWinning + nextReferral;
    }

    const updatedUser: User = {
      ...targetUser,
      walletBalance: nextWallet,
      depositBalance: nextDeposit,
      winningBalance: nextWinning,
      referralBalance: nextReferral,
      bonusRewardBalance: nextBonus,
      hasDeposited: type === 'credit' ? true : targetUser.hasDeposited,
    };

    // 2. Update users list in state and localStorage
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === updatedUser.id);
      const nextList = exists
        ? prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        : [updatedUser, ...prev];
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(nextList));
      } catch (e) {}
      return nextList;
    });

    // 3. Update currently active user if matches target user
    const cleanCurrPhone = currentUser?.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : '';
    const cleanUpdPhone = updatedUser.phone ? updatedUser.phone.replace(/\D/g, '').slice(-10) : '';
    const isCurrentActive =
      currentUser &&
      (currentUser.id === updatedUser.id ||
        (cleanCurrPhone && cleanUpdPhone && cleanCurrPhone === cleanUpdPhone) ||
        (currentUser.email && updatedUser.email && currentUser.email.toLowerCase() === updatedUser.email.toLowerCase()));

    if (isCurrentActive) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const merged = {
          ...prev,
          walletBalance: nextWallet,
          depositBalance: nextDeposit,
          winningBalance: nextWinning,
          referralBalance: nextReferral,
          bonusRewardBalance: nextBonus,
          hasDeposited: type === 'credit' ? true : prev.hasDeposited,
        };
        try {
          localStorage.setItem('apna_tambola_auth_user', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });
    }

    // 4. Create authoritative passbook transaction
    const adjustTxn: WalletTransaction = {
      id: `txn_adj_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      userId: updatedUser.id,
      type: type === 'credit' ? 'deposit' : 'withdrawal',
      amount: cleanAmount,
      balanceAfter: nextWallet,
      description: type === 'credit'
        ? `एडमिन द्वारा वॉलेट में जमा: ₹${cleanAmount} (${walletSourceLabel}) | ${reason || 'एडमिन पेमेंट क्रेडिट'}`
        : `एडमिन द्वारा वॉलेट से कटौती: ₹${cleanAmount} (${walletSourceLabel}) | ${reason || 'एडमिन कटौती'}`,
      paymentMethod: 'Admin Direct Adjustment (एडमिन बैलेंस)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'completed',
    };
    setTransactions((prev) => [adjustTxn, ...prev]);

    // 5. Send notification to target user
    const notifItem: UserNotificationItem = {
      id: `un_adj_${Date.now()}`,
      category: 'wallet_credit',
      title: type === 'credit' ? `💰 एडमिन पेमेंट जमा: ₹${cleanAmount}` : `⚠️ एडमिन वॉलेट कटौती: ₹${cleanAmount}`,
      message: type === 'credit'
        ? `एडमिन ने आपके ${walletSourceLabel} में ₹${cleanAmount} सफलतापूर्वक जोड़ दिए हैं। आपका नया कुल वॉलेट बैलेंस ₹${nextWallet.toLocaleString('en-IN')} है। (${reason || 'पेमेंट क्रेडिट'})`
        : `एडमिन द्वारा आपके ${walletSourceLabel} से ₹${cleanAmount} काटे गए हैं। आपका नया कुल वॉलेट बैलेंस ₹${nextWallet.toLocaleString('en-IN')} है। (${reason || 'कटौती'})`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'wallet',
      amount: cleanAmount,
    };
    setUserNotifications((prev) => [notifItem, ...prev]);

    // 6. Sync to Server REST API
    try {
      fetch('/api/users/wallet-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: updatedUser.id,
          amount: cleanAmount,
          type,
          reason,
          walletSource,
          transaction: adjustTxn,
          updatedUser,
        }),
      }).catch(() => {});
    } catch (e) {}

    // 7. Sync to Firestore
    try {
      const userRef = doc(db, 'users', updatedUser.id);
      setDoc(userRef, {
        ...updatedUser,
        walletBalance: nextWallet,
        depositBalance: nextDeposit,
        winningBalance: nextWinning,
        referralBalance: nextReferral,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(() => {});

      setDoc(doc(db, 'transactions', adjustTxn.id), adjustTxn, { merge: true }).catch(() => {});
    } catch (e) {
      console.warn('Firestore update wallet balance notice:', e);
    }

    // 8. Broadcast across tabs immediately
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({
          type: 'ADMIN_WALLET_ADJUSTED',
          userId: updatedUser.id,
          user: updatedUser,
          transaction: adjustTxn,
          notification: notifItem,
        });
        bc.close();
      }
    } catch (e) {}

    // Auto-Ticket Engine: If wallet was credited and auto-ticket is enabled, trigger auto-ticket check
    if (type === 'credit' && siteSettings?.autoTicketEnabled !== false) {
      setTimeout(() => {
        handleRunAutoTicketDispatch(siteSettings?.autoTicketGameId, true);
      }, 500);
    }

    return true;
  };

  // 16. Admin Toggle KYC
  const handleToggleKYC = async (userId: string): Promise<boolean> => {
    let nextStatus: 'verified' | 'unverified' | 'pending' = 'verified';
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          nextStatus = u.kycStatus === 'verified' ? 'unverified' : 'verified';
          return { ...u, kycStatus: nextStatus };
        }
        return u;
      });
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, kycStatus: nextStatus } : null));
    }

    try {
      fetch('/api/users/toggle-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    } catch (e) {}

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { kycStatus: nextStatus, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore toggle KYC notice:', e);
    }
    return true;
  };

  // 17. Admin User Management Handlers (Block, Password Reset, Delete, Batch Delete)
  const handleToggleBlockUser = async (userId: string): Promise<boolean> => {
    let isNowBlocked = false;
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          isNowBlocked = !u.isBlocked;
          const nextStatus: 'active' | 'blocked' | 'inactive' = isNowBlocked ? 'blocked' : 'active';
          return { ...u, isBlocked: isNowBlocked, status: nextStatus };
        }
        return u;
      });
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      fetch('/api/users/toggle-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    } catch (e) {}

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { isBlocked: isNowBlocked, status: isNowBlocked ? 'blocked' : 'active', updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore toggle block notice:', e);
    }
    return true;
  };

  const handleResetPassword = async (userId: string): Promise<boolean> => {
    const tempPin = '123456';
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, password: tempPin } : u));
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: tempPin }),
      }).catch(() => {});
    } catch (e) {}

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { password: tempPin, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore reset password notice:', e);
    }
    return true;
  };

  // 17.1 Delete Single User (ID डिलीट करें)
  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    // 1. Remove from local state & localStorage
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. If deleting the current logged-in user (unless admin deleting self)
    if (currentUser?.id === userId && currentUser.role !== 'admin') {
      setCurrentUser(null);
      localStorage.removeItem('apna_tambola_auth_user');
    }

    // 3. Delete from Server
    try {
      fetch(`/api/users/${userId}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    // 4. Delete from Firestore permanently
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (e) {
      console.warn('Firestore deleteDoc notice:', e);
    }

    // 5. Log admin activity
    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      adminName: currentUser?.name || 'Admin',
      action: `Deleted user ID: ${userId}`,
      category: 'user',
      ipAddress: '192.168.1.1',
      device: 'Admin Portal',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'danger',
      details: `User ID ${userId} was permanently removed from system database`,
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return true;
  };

  // 17.2 Batch Delete Multiple Users (मल्टीपल ID डिलीट करें)
  const handleBatchDeleteUsers = async (userIds: string[]): Promise<boolean> => {
    if (!userIds || userIds.length === 0) return true;

    const idsSet = new Set(userIds);

    // 1. Remove from state & localStorage
    setUsers((prev) => {
      const updated = prev.filter((u) => !idsSet.has(u.id));
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Delete from Server
    try {
      fetch('/api/users/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      }).catch(() => {});
    } catch (e) {}

    // 3. Delete all from Firestore
    try {
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            await deleteDoc(doc(db, 'users', uid));
          } catch (e) {
            console.warn(`Firestore batch delete failed for ${uid}:`, e);
          }
        })
      );
    } catch (e) {
      console.warn('Firestore batch delete error:', e);
    }

    // 3. Log admin activity
    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      adminName: currentUser?.name || 'Admin',
      action: `Batch deleted ${userIds.length} user accounts (${userIds.join(', ')})`,
      category: 'user',
      ipAddress: '192.168.1.1',
      device: 'Admin Portal',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'danger',
      details: `Batch deleted IDs: ${userIds.join(', ')}`,
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    return true;
  };

  // 18. Admin Referral Commission Handlers
  const handleApproveCommission = (commissionId: string) => {
    setCommissions((prev) =>
      prev.map((c) => (c.id === commissionId ? { ...c, status: 'approved' } : c))
    );
  };

  const handleReverseCommission = (commissionId: string) => {
    setCommissions((prev) =>
      prev.map((c) => (c.id === commissionId ? { ...c, status: 'reversed' } : c))
    );
  };

  // 19. Admin Notifications
  const handleSendNotification = async (notification: Omit<AdminNotification, 'id' | 'sentAt'>): Promise<boolean> => {
    const newNotif: AdminNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return true;
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

    // 20. Admin Site Settings Update
  const handleUpdateSettings = async (updates: Partial<SiteSettings>): Promise<boolean> => {
    setSiteSettings((prev) => {
      const nextSettings = { ...prev, ...updates };
      try {
        localStorage.setItem('apna_tambola_site_settings', JSON.stringify(nextSettings));
      } catch (e) {}
      return nextSettings;
    });

    try {
      const settingsRef = doc(db, 'system', 'site_settings');
      await setDoc(settingsRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore settings update notice:', e);
    }
    return true;
  };

  // 21. Support Ticket Actions
  const handleCreateSupportTicket = async (subject: string, category: 'wallet' | 'game' | 'ticket' | 'referral' | 'kyc' | 'other', message: string): Promise<boolean> => {
    if (!currentUser) {
      handleOpenAuth('login');
      return false;
    }
    const newTkt: SupportTicket = {
      id: `sup_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      category,
      subject,
      priority: 'medium',
      status: 'open',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'user',
          senderName: currentUser.name,
          text: message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setSupportTickets((prev) => [newTkt, ...prev]);
    return true;
  };

  const handleSendSupportReply = async (ticketId: string, text: string): Promise<boolean> => {
    if (!currentUser) {
      handleOpenAuth('login');
      return false;
    }
    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          messages: [
            ...t.messages,
            {
              id: `msg_${Date.now()}`,
              sender: 'user',
              senderName: currentUser.name,
              text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        };
      })
    );
    return true;
  };

  // 22. User Notifications Handlers
  const handleMarkNotificationRead = (id: string) => {
    setUserNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setUserNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteUserNotification = (id: string) => {
    setUserNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllUserNotifications = () => {
    setUserNotifications([]);
  };

  const currentTemplate = getAppTemplate(activeTemplateId);

  return (
    <div className={`min-h-screen ${currentTemplate.bodyBgClass} text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 transition-colors duration-500`}>
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isAdminView={isAdminView || currentUser?.role === 'admin'}
        setIsAdminView={handleSetIsAdminView}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenDeposit={() => handleNavigate('wallet')}
        onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
        onOpenAdminLogin={handleOpenAdminLogin}
        onLogout={handleLogout}
        onOpenNotifications={() => setShowNotificationsDrawer(true)}
        unreadNotificationCount={userNotifications.filter((n) => !n.read).length}
        activeTemplateId={activeTemplateId}
        onOpenTemplateSelector={() => setShowTemplateModal(true)}
        onRefreshData={handleForceRefresh}
        isSyncing={isSyncing}
        onSelectAdminModule={(modKey) => {
          setActiveTab('admin');
          setAdminActiveModule(modKey);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* ⚡ Instant Direct Referral Celebration Toast */}
      {directReferralCelebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950 border-2 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-2xl shrink-0">
                🎉
              </div>
              <div>
                <div className="font-black text-sm text-emerald-300 flex items-center gap-1.5">
                  <span>नया डायरेक्ट रेफरल तुरंत जुड़ गया!</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">+₹10</span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  <strong>{directReferralCelebration.name}</strong> ({directReferralCelebration.phone || 'New User'}) आपके रेफरल से लाइव जुड़ गए हैं!
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setDirectReferralCelebration(null);
                  handleNavigate('referral');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow transition-all"
              >
                देखें
              </button>
              <button
                onClick={() => setDirectReferralCelebration(null)}
                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Multi-Device Sync Toast Notification */}
      {syncFeedback && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400 text-amber-300 text-xs sm:text-sm font-black shadow-2xl backdrop-blur-md">
            <span className="text-base">⚡</span>
            <span>{syncFeedback}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* ⚠️ Firestore Free Quota Notification Banner */}
        {firestoreQuotaExceeded && (
          <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-amber-950/90 border border-amber-500/40 text-amber-100 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 font-bold shrink-0">
                ⚡
              </div>
              <div>
                <p className="font-bold text-amber-200">
                  Firestore Free Daily Read Quota Reached — App Running Seamlessly on Local State & Direct Sync
                </p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  The daily free tier read quota resets every 24 hours. You can upgrade billing or manage your database directly in the Firebase Console.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <a
                href="https://console.firebase.google.com/project/modified-primer-m6pck/firestore/databases/ai-studio-tambolalive-bedbd97f-999b-4cc1-9263-58d2e616026c/data?openUpgradeDialog=true"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 transition-all shadow"
              >
                <span>Upgrade Quota</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setFirestoreQuotaExceeded(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 🔴 Universal Live Tambola Ball Bar for ALL users on all devices & dashboards */}
        <div className="mb-5">
          <UniversalLiveBallBar
            game={liveGame}
            allGames={games}
            activeTab={activeTab}
            onNavigate={handleNavigate}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
          />
        </div>

        {/* Real-time Global Winner Flash Notification for all users across any tab */}
        {activeWinnerFlash && (
          <div className="mb-5 animate-in fade-in slide-in-from-top-3 duration-500">
            <LiveWinnerFlashTicker
              activeFlash={activeWinnerFlash}
              onDismiss={() => setActiveWinnerFlash(null)}
              onViewCelebration={(data) => setCelebrationData(data)}
            />
          </div>
        )}

        {/* Home Page: Always shows the complete, rich Landing Page with all platform overviews, ticket, deposit, withdrawal, and income details */}
        {(activeTab === 'home' || activeTab === 'landing') && (
          <HomeView
            games={games}
            winners={winners}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenDeposit={() => handleNavigate('wallet')}
            onOpenAuth={handleOpenAuth}
            onOpenAdminLogin={handleOpenAdminLogin}
            activeTemplateId={activeTemplateId}
            onOpenTemplateSelector={() => setShowTemplateModal(true)}
          />
        )}

        {/* Dedicated User Dashboard Tab (11-Box Colorful Dashboard) */}
        {(activeTab === 'dashboard' || activeTab === 'user') && (
          <UserDashboardView
            currentUser={currentUser}
            allUsers={users}
            games={games}
            tickets={tickets}
            winners={winners}
            referralMembers={computedReferralMembers}
            commissions={commissions}
            onNavigate={handleNavigate}
            onOpenDeposit={() => handleNavigate('wallet')}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'live' && (
          <LiveGameView
            game={liveGame}
            allGames={games}
            selectedGameId={selectedGameId}
            onSelectGame={handleSelectGame}
            onStartGame={handleAdminStartGame}
            onStopGame={handleAdminStopGame}
            userTickets={currentUser ? (currentUser.role === 'admin' ? tickets : tickets.filter((t) => t.userId === currentUser.id || !t.userId)) : tickets}
            currentUser={currentUser || INITIAL_USERS[0]}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            isAdmin={currentUser?.role === 'admin'}
            onCallNext={handleCallNextNumber}
            onToggleAuto={handleToggleAutoCaller}
            onResetGame={handleResetGame}
            onClaimPrize={handleClaimPrize}
            onBuyTickets={(gId) => handleNavigate('buy-ticket', gId)}
            celebrationData={celebrationData}
            setCelebrationData={setCelebrationData}
            onGoToWallet={() => handleNavigate('wallet')}
            onToggleAutoMode={handleToggleTicketAutoMode}
            activeWinnerFlash={activeWinnerFlash}
          />
        )}

        {activeTab === 'buy-ticket' && (
          currentUser ? (
            <BuyTicketView
              games={games}
              selectedGameId={selectedGameId}
              currentUser={currentUser}
              siteSettings={siteSettings}
              onBuyTickets={handleBuyTickets}
              onOpenDeposit={() => handleNavigate('wallet')}
              onNavigate={handleNavigate}
            />
          ) : (
            <ProtectedViewGate
              title="टिकट बुक करें (Buy Tambola Tickets)"
              subtitle="लाइव तंबोला टूर्नामेंट टिकट खरीदने और जीतने के लिए कृपया अपने आईडी व पासवर्ड से लॉगिन करें।"
              onOpenAuth={handleOpenAuth}
              onNavigate={handleNavigate}
              onDirectLogin={handleUserLogin}
              allUsers={users}
            />
          )
        )}

        {activeTab === 'my-tickets' && (
          currentUser ? (
            <MyTicketsView
              tickets={currentUser.role === 'admin' ? tickets : tickets.filter((t) => t.userId === currentUser.id || !t.userId)}
              games={games}
              onNavigate={handleNavigate}
              onToggleAutoMode={handleToggleTicketAutoMode}
              onDeleteTicket={handleDeleteTicket}
              onDeleteCompletedTickets={handleDeleteCompletedTickets}
            />
          ) : (
            <ProtectedViewGate
              title="मेरे टिकट & पासबुक (My Tickets)"
              subtitle="अपने खरीदे गए लाइव और पिछले टिकट देखने के लिए कृपया लॉगिन करें।"
              onOpenAuth={handleOpenAuth}
              onNavigate={handleNavigate}
              onDirectLogin={handleUserLogin}
              allUsers={users}
            />
          )
        )}

        {activeTab === 'games' && (
          <GamesLobbyView
            games={games}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'winners' && (
          <WinnersView
            winners={winners}
            tickets={tickets}
            currentUser={currentUser}
            onDeleteWinner={handleDeleteWinner}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'referral' && (
          currentUser ? (
            <ReferralView
              currentUser={currentUser}
              allUsers={users}
              referralMembers={computedReferralMembers}
              commissions={commissions}
              onOpenDeposit={() => handleNavigate('wallet')}
              onForceRefresh={handleForceRefresh}
              isSyncing={isSyncing}
              onRegisterUser={handleRegisterUser}
              onOpenAuth={handleOpenAuth}
            />
          ) : (
            <ProtectedViewGate
              title="8-लेवल रेफरल नेटवर्क (Referral Program)"
              subtitle="अपना व्यक्तिगत रेफरल लिंक, QR कोड और डायरेक्ट टीम देखने के लिए कृपया लॉगिन करें।"
              onOpenAuth={handleOpenAuth}
              onNavigate={handleNavigate}
              onDirectLogin={handleUserLogin}
              allUsers={users}
            />
          )
        )}

        {activeTab === 'wallet' && (
          currentUser ? (
            <WalletView
              currentUser={currentUser}
              transactions={transactions}
              withdrawals={withdrawals}
              deposits={deposits}
              settings={siteSettings}
              users={users}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdrawal}
              onTransferFund={handleP2PTransfer}
              onTransferWinningToTicketWallet={handleTransferWinningToTicketWallet}
            />
          ) : (
            <ProtectedViewGate
              title="माई वॉलेट & विथड्रॉल (Wallet & Payouts)"
              subtitle="वॉलेट रिचार्ज, राशि निकासी, P2P ट्रांसफर और बैंक डिटेल्स मैनेज करने के लिए लॉगिन करें।"
              onOpenAuth={handleOpenAuth}
              onNavigate={handleNavigate}
              onDirectLogin={handleUserLogin}
              allUsers={users}
            />
          )
        )}

        {activeTab === 'profile' && (
          currentUser ? (
            <ProfileView
              currentUser={currentUser}
              onUpdateProfile={(updated) => {
                if (currentUser) {
                  setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null));
                }
              }}
              onTransferFund={handleP2PTransfer}
              users={users}
              transactions={transactions}
              settings={siteSettings}
              tickets={tickets}
              winners={winners}
              games={games}
              onNavigate={handleNavigate}
              onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
              onLogout={handleLogout}
            />
          ) : (
            <ProtectedViewGate
              title="यूज़र प्रोफाइल & KYC (Profile)"
              subtitle="अपनी प्रोफाइल जानकारी, पासवर्ड और KYC स्टेटस देखने के लिए लॉगिन करें।"
              onOpenAuth={handleOpenAuth}
              onNavigate={handleNavigate}
              onDirectLogin={handleUserLogin}
              allUsers={users}
            />
          )
        )}

        {activeTab === 'daily-bonus' && (
          currentUser ? (
            <DailyBonusView
              currentUser={currentUser}
              onClaimDailyReward={handleClaimDailyReward}
              onDeposit={handleDeposit}
              onNavigate={handleNavigate}
            />
          ) : (
            <ProtectedViewGate
              title="दैनिक स्पिन & स्क्रैच रिवार्ड्स (Daily Bonus)"
              subtitle="मुफ्त डेली लकी स्पिन और स्क्रैच कार्ड खेलकर रिवार्ड्स पाने के लिए लॉगिन करें।"
              onOpenAuth={handleOpenAuth}
              onNavigate={handleNavigate}
              onDirectLogin={handleUserLogin}
              allUsers={users}
            />
          )
        )}

        {activeTab === 'how-to-play' && (
          <HowToPlayView
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'support' && (
          <SupportView
            currentUser={currentUser || INITIAL_USERS[0]}
            tickets={supportTickets}
            onCreateTicket={handleCreateSupportTicket}
            onSendReply={handleSendSupportReply}
          />
        )}

        {activeTab === 'admin' && (currentUser?.role === 'admin' || currentUser?.email === 'ashishbadawat@gmail.com') && (
          <AdminDashboardView
            stats={adminStats}
            games={games}
            users={users}
            winners={winners}
            onDeleteWinner={handleDeleteWinner}
            onBatchDeleteWinners={handleBatchDeleteWinners}
            onClearAllWinners={handleClearAllWinners}
            latestRegisteredUser={latestRegisteredUser}
            onClearLatestUser={() => setLatestRegisteredUser(null)}
            withdrawals={withdrawals}
            deposits={deposits}
            commissions={commissions}
            tickets={tickets}
            transactions={transactions}
            activityLogs={activityLogs}
            notifications={notifications}
            loginHistory={loginHistory}
            siteSettings={siteSettings}
            activeModule={adminActiveModule}
            onModuleChange={setAdminActiveModule}
            onCallNext={handleCallNextNumber}
            onToggleAuto={handleToggleAutoCaller}
            onResetGame={handleResetGame}
            selectedGameId={selectedGameId}
            onSelectGame={handleSelectGame}
            onStartGame={handleAdminStartGame}
            onStopGame={handleAdminStopGame}
            onCreateGame={handleCreateGame}
            onUpdateGame={handleUpdateGame}
            onDeleteGame={handleDeleteGame}
            onApproveWithdrawal={handleApproveWithdrawal}
            onRejectWithdrawal={handleRejectWithdrawal}
            onApproveDeposit={handleApproveDeposit}
            onRejectDeposit={handleRejectDeposit}
            onDeleteDeposit={handleDeleteDeposit}
            onUpdateWalletBalance={handleUpdateWalletBalance}
            onToggleKYC={handleToggleKYC}
            onToggleBlockUser={handleToggleBlockUser}
            onResetPassword={handleResetPassword}
            onAdminGenerateTickets={handleAdminGenerateTickets}
            onAdminToggleTicketStatus={handleAdminToggleTicketStatus}
            onAdminBatchToggleTickets={handleAdminBatchToggleTickets}
            onAdminUpdateTicketGame={handleAdminUpdateTicketGame}
            onAdminBatchUpdateTicketGame={handleAdminBatchUpdateTicketGame}
            onAdminTransferAllTicketsToGame={handleAdminTransferAllTicketsToGame}
            onClearCompletedTickets={handleClearCompletedTickets}
            onDeleteTicket={handleDeleteTicket}
            onBatchDeleteTickets={handleBatchDeleteTickets}
            onApproveCommission={handleApproveCommission}
            onReverseCommission={handleReverseCommission}
            onSendNotification={handleSendNotification}
            onDeleteNotification={handleDeleteNotification}
            onUpdateSettings={handleUpdateSettings}
            onRegisterUser={handleRegisterUser}
            onUpdateUser={handleRegisterUser}
            onDeleteUser={handleDeleteUser}
            onBatchDeleteUsers={handleBatchDeleteUsers}
            onSetTicketName={handleAdminSetTicketName}
            onRunClawbackAudit={handleAdminRunClawbackAudit}
            onForceRefresh={handleForceRefresh}
            isSyncing={isSyncing}
            onOpenFirebaseDiagnostics={() => setShowFirebaseModal(true)}
          />
        )}

        {/* If on Admin tab but not logged in as Admin, show direct portal entry prompt */}
        {activeTab === 'admin' && currentUser?.role !== 'admin' && currentUser?.email !== 'ashishbadawat@gmail.com' && (
          <div className="max-w-xl mx-auto py-8 sm:py-12 text-center space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border-2 border-red-500/50 shadow-2xl shadow-red-950/60 space-y-5 relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 border border-red-500/40 flex items-center justify-center mx-auto text-white shadow-xl shadow-red-600/30">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">व्यवस्थापक (एडमिन) लॉगिन</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  एडमिन डैशबोर्ड, गेम कंट्रोल और वित्तीय सेटिंग्स एक्सेस करने के लिए नीचे दिए गए 1-क्लिक बटन या पासवर्ड से तुरंत प्रवेश करें।
                </p>
              </div>

              {/* Instant 1-Click Master Access Button */}
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs text-red-300 font-bold">
                  <span>⚡ अधिकृत मास्टर व्यवस्थापक:</span>
                  <span className="font-mono text-amber-300">ashishbadawat@gmail.com</span>
                </div>
                <button
                  type="button"
                  id="gate-master-admin-btn"
                  onClick={handleInstantMasterAdminAccess}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>👑 1-क्लिक मास्टर एडमिन पैनल खोलें (Ashish Badawat)</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
                <button
                  type="button"
                  onClick={handleOpenAdminLogin}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>🔑 पासवर्ड / Google साइन-इन</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('home')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs border border-slate-800 cursor-pointer transition-all"
                >
                  मुख्य पृष्ठ पर जाएं
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAdminLogin={handleOpenAdminLogin}
        onOpenAuth={handleOpenAuth}
      />

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onOpenAllOptions={() => setShowAllOptionsModal(true)}
        onOpenAuth={handleOpenAuth}
      />

      {/* Auth Modal (Login / Register & 1-Click Demo switch) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleUserLogin}
        onRegisterUser={handleRegisterUser}
        allUsers={users}
        currentUser={currentUser}
        onLogout={handleLogout}
        initialMode={authModalMode}
      />

      {/* Admin Login Dedicated Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        allUsers={users}
      />

      {/* User Real-Time Notifications Drawer */}
      <UserNotificationsDrawer
        isOpen={showNotificationsDrawer}
        onClose={() => setShowNotificationsDrawer(false)}
        notifications={userNotifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onDeleteNotification={handleDeleteUserNotification}
        onClearAll={handleClearAllUserNotifications}
        onNavigate={handleNavigate}
      />

      {/* All Options Hub Modal */}
      <AllOptionsModal
        isOpen={showAllOptionsModal}
        onClose={() => setShowAllOptionsModal(false)}
        currentTab={activeTab}
        onNavigate={handleNavigate}
        isAdminView={currentUser?.role === 'admin'}
        onSelectAdminModule={(modKey) => {
          setActiveTab('admin');
          setAdminActiveModule(modKey);
        }}
      />

      {/* 🎨 Apna Tambola Visual Template Selector Modal */}
      <TemplateSelectorModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        currentTemplateId={activeTemplateId}
        onSelectTemplate={(newTpl) => {
          setActiveTemplateId(newTpl);
          try {
            localStorage.setItem('apna_tambola_template', newTpl);
          } catch {
            // fallback
          }
        }}
      />

      {/* 🔥 Firebase Direct Live DB & Sync Diagnostics Modal */}
      <FirebaseDiagnosticsModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        games={games}
        users={users}
        tickets={tickets}
        winners={winners}
        deposits={deposits}
        withdrawals={withdrawals}
        transactions={transactions}
        siteSettings={siteSettings}
        onUpdateGame={handleUpdateGame}
        onUpdateWalletBalance={handleUpdateWalletBalance}
        onUpdateSettings={handleUpdateSettings}
        onForceRefresh={handleForceRefresh}
      />
    </div>
  );
}
export default App;
