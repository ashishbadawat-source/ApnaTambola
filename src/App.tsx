import React, { useState, useEffect, useRef } from 'react';
import { Lock, LogIn, UserPlus, Sparkles } from 'lucide-react';
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
import { generateTambolaTicketMatrix, generateTicketId, verifyClaim } from './utils/tambolaTicket';
import { checkAndAutoTrackWinners } from './utils/autoWinnerTracker';
import { LiveWinnerFlashTicker, FlashWinnerItem } from './components/LiveWinnerFlashTicker';
import { WinnerFlashData } from './components/WinnerCelebrationModal';
import { COLOR_KEYS, getTicketTheme } from './utils/ticketColors';
import { playWinningFanfare, playNumberCallSound } from './utils/audio';
import { calculateTambolaDynamicPrizes, calculateSplitWinning } from './utils/prizePoolCalculator';
import { db } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, getDoc, query, where } from 'firebase/firestore';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>();
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
        return JSON.parse(saved);
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_GAMES;
  });

  const [tickets, setTickets] = useState<TambolaTicket[]>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_TICKETS;
  });

  const [winners, setWinners] = useState<GameWinner[]>(() => {
    try {
      const saved = localStorage.getItem('apna_tambola_winners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_WINNERS;
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

            return Array.from(map.values()).sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA;
            });
          });

          // If current logged-in user is updated or deleted in Firestore, keep currentUser state live
          setCurrentUser((prevUser) => {
            if (!prevUser) return null;
            const updated = firestoreUsers.find(
              (u) => u.id === prevUser.id || (prevUser.phone && u.phone === prevUser.phone)
            );
            return updated ? { ...prevUser, ...updated } : prevUser;
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
              firestoreGames.push({ ...(docSnap.data() as TambolaGame), id: docSnap.id });
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
          if (!snapshot.empty) {
            const firestoreTickets: TambolaTicket[] = [];
            snapshot.forEach((docSnap) => {
              firestoreTickets.push({ ...(docSnap.data() as TambolaTicket), id: docSnap.id });
            });
            setTickets((prev) => {
              const map = new Map<string, TambolaTicket>();
              prev.forEach((t) => map.set(t.id, t));
              firestoreTickets.forEach((t) => map.set(t.id, t));
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

      // Real-time deposits sync
      const unsubscribeDeposits = onSnapshot(
        collection(db, 'deposits'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreDeps: DepositRequest[] = [];
            snapshot.forEach((docSnap) => {
              firestoreDeps.push({ ...(docSnap.data() as DepositRequest), id: docSnap.id });
            });
            setDeposits((prev) => {
              const map = new Map<string, DepositRequest>();
              prev.forEach((d) => map.set(d.id, d));
              firestoreDeps.forEach((d) => map.set(d.id, d));
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
          }
        },
        (err) => console.warn('Firestore deposits listener:', err)
      );

      return () => {
        if (unsubscribeUsers) unsubscribeUsers();
        if (unsubscribeCommissions) unsubscribeCommissions();
        if (unsubscribeSettings) unsubscribeSettings();
        if (unsubscribeGames) unsubscribeGames();
        if (unsubscribeTickets) unsubscribeTickets();
        if (unsubscribeDeposits) unsubscribeDeposits();
      };
    } catch (err) {
      console.warn('Firestore onSnapshot listener error:', err);
    }
  }, []);

  // Multi-Device & Tab Real-Time Poller + BroadcastChannel Sync Engine
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. BroadcastChannel for instant local tab sync
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('apna_tambola_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_USER_REGISTERED' && event.data.user) {
            const newUser: User = event.data.user;
            setUsers((prev) => {
              if (prev.some((u) => u.id === newUser.id)) return prev;
              return [newUser, ...prev];
            });
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
              return Array.from(map.values());
            });
          }
        } catch (err) {}
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
              const merged = Array.from(map.values()).sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
              });
              try {
                localStorage.setItem('apna_tambola_registered_users', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });

            // Also sync active currentUser if updated remotely (e.g. referral bonus credited on another device)
            setCurrentUser((prev) => {
              if (!prev) return null;
              const remote = data.users.find(
                (u: User) => u.id === prev.id || (prev.phone && u.phone && u.phone.replace(/\D/g, '') === prev.phone.replace(/\D/g, ''))
              );
              if (remote) {
                return { ...prev, ...remote };
              }
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
            setDeposits((prev) => {
              const map = new Map<string, DepositRequest>();
              prev.forEach((d) => map.set(d.id, d));
              data.deposits.forEach((d: DepositRequest) => map.set(d.id, d));
              return Array.from(map.values()).sort((a, b) => {
                const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
                const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
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
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
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
          const [usersSnap, gamesSnap, ticketsSnap, commsSnap, settingsSnap] = await Promise.all([
            getDocs(collection(db, 'users')).catch(() => null),
            getDocs(collection(db, 'games')).catch(() => null),
            getDocs(collection(db, 'tickets')).catch(() => null),
            getDocs(collection(db, 'commissions')).catch(() => null),
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
            }
          }

          if (gamesSnap && !gamesSnap.empty) {
            const fsGames: TambolaGame[] = [];
            gamesSnap.forEach((d) => fsGames.push({ ...(d.data() as TambolaGame), id: d.id }));
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
            const fsTickets: TambolaTicket[] = [];
            ticketsSnap.forEach((d) => fsTickets.push({ ...(d.data() as TambolaTicket), id: d.id }));
            if (fsTickets.length > 0) {
              setTickets((prev) => {
                const map = new Map<string, TambolaTicket>();
                prev.forEach((t) => map.set(t.id, t));
                fsTickets.forEach((t) => map.set(t.id, t));
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

  const liveGame = games.find((g) => g.id === selectedGameId) || games.find((g) => g.status === 'live') || games[0];

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleOpenAdminLogin = () => {
    setShowAdminLoginModal(true);
  };

  const handleAdminLoginSuccess = (adminUser: User) => {
    setCurrentUser(adminUser);
    setActiveTab('admin');
    setUsers((prev) => {
      if (prev.some((u) => u.id === adminUser.id)) {
        return prev.map((u) => (u.id === adminUser.id ? adminUser : u));
      }
      return [adminUser, ...prev];
    });
  };

  const handleUserLogin = (user: User) => {
    // Preserve any existing user state properties (like referredBy and referredByUserId)
    let mergedUser: User = user;
    setUsers((prev) => {
      let updated: User[];
      const existing = prev.find((u) => u.id === user.id || (u.phone && user.phone && u.phone.replace(/\D/g, '').endsWith(user.phone.replace(/\D/g, ''))));
      if (existing) {
        mergedUser = {
          ...existing,
          ...user,
          referredBy: user.referredBy || existing.referredBy || '',
          referredByUserId: user.referredByUserId || existing.referredByUserId || '',
          referralCode: user.referralCode || existing.referralCode,
          role: user.role || existing.role || 'user',
        };
        updated = prev.map((u) => (u.id === existing.id ? mergedUser : u));
      } else {
        updated = [user, ...prev];
      }
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setCurrentUser(mergedUser);
    try {
      localStorage.setItem('apna_tambola_auth_user', JSON.stringify(mergedUser));
    } catch (e) {}
  };

  const handleRegisterUser = async (newUser: User) => {
    console.log(`[REGISTRATION] User registration started for: ${newUser.name} (${newUser.phone || newUser.id})`);
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

    // 7. If upline exists, credit bonus commission and immediately propagate tree
    if (matchedUpline) {
      const upline = matchedUpline;
      const joinComm: ReferralCommission = {
        id: `comm_join_${Date.now()}_${completeUser.id}`,
        userId: upline.id,
        userName: upline.name,
        sourceUserId: completeUser.id,
        sourceUserName: completeUser.name,
        gameId: 'signup_bonus',
        gameTitle: '🎁 New Direct Referral Join Bonus (Level 1)',
        ticketId: 'REG-DIRECT',
        level: 1,
        percentage: 10,
        baseAmount: 10,
        commissionAmount: 10,
        transactionId: `TXN-REF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'approved',
      };

      setCommissions((prev) => [joinComm, ...prev.filter((c) => c.id !== joinComm.id)]);
      try {
        setDoc(doc(db, 'commissions', joinComm.id), joinComm).catch(() => {});
        fetch('/api/commissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(joinComm),
        }).catch(() => {});
      } catch (e) {}

      // Update upline balance & referral count in Firestore
      try {
        setDoc(
          doc(db, 'users', upline.id),
          {
            referralBalance: (upline.referralBalance || 0) + 10,
            walletBalance: (upline.walletBalance || 0) + 10,
            referralCount: (upline.referralCount || 0) + 1,
          },
          { merge: true }
        ).catch(() => {});
      } catch (e) {}

      // Update upline balance in local users state
      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === upline.id
            ? {
                ...u,
                referralBalance: (u.referralBalance || 0) + 10,
                walletBalance: (u.walletBalance || 0) + 10,
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
        title: '🎉 नया डायरेक्ट रेफरल!',
        message: `${completeUser.name} आपके रेफरल कोड (${finalReferredByCode}) से सफलतापूर्वक रजिस्टर हो गए हैं! वे आपके डायरेक्ट (Level 1) टीम में शामिल हो गए हैं।`,
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
            referralBalance: (prev.referralBalance || 0) + 10,
            walletBalance: (prev.walletBalance || 0) + 10,
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

  // Auto caller interval handler
  useEffect(() => {
    if (liveGame && liveGame.autoCalling && liveGame.status === 'live') {
      autoCallTimerRef.current = setInterval(() => {
        handleCallNextNumber();
      }, 6000);
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
  }, [liveGame?.autoCalling, liveGame?.calledNumbers.length, liveGame?.status]);

  // ⚡ Automatic Winner Tracking Engine (Includes Online, Auto Mode & Offline tickets)
  useEffect(() => {
    if (!liveGame || !liveGame.currentNumber || liveGame.calledNumbers.length === 0) return;

    const gameTickets = tickets.filter((t) => t.gameId === liveGame.id || !t.gameId);

    const trackingResult = checkAndAutoTrackWinners({
      gameId: liveGame.id,
      gameTitle: liveGame.title,
      currentNumber: liveGame.currentNumber,
      calledNumbers: liveGame.calledNumbers,
      prizes: liveGame.prizes,
      tickets: gameTickets,
      currentUser,
    });

    if (trackingResult.newWins.length > 0) {
      // Update Game Prizes in state
      setGames((prevGames) =>
        prevGames.map((g) => {
          if (g.id !== liveGame.id) return g;
          return {
            ...g,
            prizes: trackingResult.updatedPrizes,
          };
        })
      );

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

        // Broadcast to Live Flash Ticker for all players
        setActiveWinnerFlash({
          id: win.id,
          winnerName: win.userName,
          prizeName: win.prizeName,
          prizeAmount: win.splitPrizeAmount,
          winningNumber: win.winningNumber,
          ticketNumber: win.ticketNumber,
          ticketId: win.ticketId,
          isCurrentUser: win.isCurrentUser,
          isAutoClaimed: win.isAutoClaimed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ticket: win.ticket,
        });

        if (win.isCurrentUser) {
          playWinningFanfare();

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
                ? `🏆 ऑटो-ट्रैक जीत: ${win.prizeName} (${win.totalSplitWinners} विजेताओं में विभाजित) - ${win.gameTitle}`
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
            title: `🏆 बधाई! आप ₹${win.splitPrizeAmount.toLocaleString('en-IN')} जीत गए!`,
            message: `सिस्टम ने आपके टिकट #${win.ticketNumber} (${win.ticketId}) पर ${win.prizeName} ऑटो-ट्रैक कर लिया है। राशि आपके विथड्रॉल वॉलेट में जमा कर दी गई है।`,
            timestamp: 'Just now',
            read: false,
            actionTab: 'wallet',
            amount: win.splitPrizeAmount,
            ticketId: win.ticketId,
          };
          setUserNotifications((prev) => [winNotif, ...prev]);

          // Show celebration popup
          setCelebrationData({
            prizeName: win.prizeName,
            prizeAmount: win.splitPrizeAmount,
            userName: currentUser.name,
            ticketId: win.ticketId,
            ticketNumber: win.ticketNumber,
            winningNumber: win.winningNumber,
            ticket: win.ticket,
            calledNumbers: liveGame.calledNumbers,
            isCurrentUser: true,
          });
        }
      });
    }
  }, [liveGame?.calledNumbers, liveGame?.currentNumber]);

  // Toggle Ticket Auto Mode
  const handleToggleTicketAutoMode = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, autoMode: !t.autoMode } : t))
    );
  };

  // Navigation Helper
  const handleNavigate = (tab: string, gameId?: string) => {
    setActiveTab(tab);
    if (gameId) {
      setSelectedGameId(gameId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Call Next Number Handler
  const handleCallNextNumber = (forcedNumber?: number) => {
    setGames((prevGames) => {
      return prevGames.map((g) => {
        if (g.id !== liveGame?.id) return g;
        if (g.calledNumbers.length >= 90) {
          return { ...g, autoCalling: false, status: 'completed' };
        }

        let nextNum: number;
        if (forcedNumber && !g.calledNumbers.includes(forcedNumber)) {
          nextNum = forcedNumber;
        } else {
          const available = Array.from({ length: 90 }, (_, i) => i + 1).filter(
            (n) => !g.calledNumbers.includes(n)
          );
          if (available.length === 0) {
            return { ...g, autoCalling: false, status: 'completed' };
          }
          nextNum = available[Math.floor(Math.random() * available.length)];
        }

        const newCalled = [...g.calledNumbers, nextNum];
        const newPrev = [nextNum, ...g.previousNumbers].slice(0, 5);

        return {
          ...g,
          currentNumber: nextNum,
          calledNumbers: newCalled,
          previousNumbers: newPrev,
        };
      });
    });
  };

  // 2. Toggle Auto Caller
  const handleToggleAutoCaller = () => {
    if (!liveGame) return;
    setGames((prevGames) =>
      prevGames.map((g) =>
        g.id === liveGame.id ? { ...g, autoCalling: !g.autoCalling } : g
      )
    );
  };

  // 3. Reset Game Match
  const handleResetGame = () => {
    if (!liveGame) return;
    setGames((prevGames) =>
      prevGames.map((g) =>
        g.id === liveGame.id
          ? {
              ...g,
              currentNumber: undefined,
              calledNumbers: [],
              previousNumbers: [],
              autoCalling: false,
              prizes: g.prizes.map((p) => ({ ...p, claimedWinners: [] })),
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

        // Persist to Firestore
        try {
          setDoc(doc(db, 'commissions', commRecord.id), commRecord);
          setDoc(doc(db, 'users', updatedUpline.id), updatedUpline, { merge: true });
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

  // 5. Buy Tickets Handler (Strictly requires funded deposit wallet from Admin recharge)
  const handleBuyTickets = async (gameId: string, quantity: number): Promise<boolean> => {
    if (!currentUser) {
      handleOpenAuth('login');
      return false;
    }
    const game = games.find((g) => g.id === gameId);
    if (!game) return false;

    // Exact total cost calculation (e.g., ₹5, ₹10, ₹15, ₹50 etc. * quantity)
    const totalCost = game.ticketPrice * quantity;

    // User CANNOT buy tickets until deposit wallet is funded by admin / recharge
    if (currentUser.depositBalance < totalCost) {
      const errorNotif: UserNotificationItem = {
        id: `un_err_${Date.now()}`,
        category: 'wallet_credit',
        title: '⚠️ टिकट खरीदने हेतु फंड आवश्यक',
        message: `टिकट खरीदने के लिए टिकट वॉलेट (Deposit Wallet) में कम से कम ₹${totalCost} होना आवश्यक है। (वर्तमान टिकट बैलेंस: ₹${currentUser.depositBalance})। जब तक एडमिन से फंड ऐड (Recharge) नहीं होता, तब तक टिकट नहीं खरीदा जा सकता।`,
        timestamp: 'Just now',
        read: false,
        actionTab: 'wallet',
      };
      setUserNotifications((prev) => [errorNotif, ...prev]);
      return false;
    }

    // Determine ticket colors (Prioritizes per-game color theme, falls back to Admin siteSettings)
    const newTickets: TambolaTicket[] = [];
    const activeColorSetting = game.ticketColorTheme || siteSettings.defaultTicketTheme || 'multi';

    for (let i = 0; i < quantity; i++) {
      const ticketNum = game.totalTicketsSold + i + 1;
      
      let assignedColor: TicketColorThemeId = 'ruby';
      if (!activeColorSetting || activeColorSetting === 'multi') {
        // Rotates and changes every ticket dynamically across palettes
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
        purchaseDate: new Date().toISOString(),
      });
    }

    // Deduct exact payment amount from user deposit balance and update wallet balance
    setCurrentUser((prev) => {
      if (!prev) return null;
      const newDeposit = prev.depositBalance - totalCost;
      const newWallet = newDeposit + prev.winningBalance + (prev.referralBalance || 0);
      return {
        ...prev,
        depositBalance: newDeposit,
        walletBalance: newWallet,
      };
    });

    // Record wallet transaction
    const newTxn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: currentUser.id,
      type: 'ticket_purchase',
      amount: -totalCost,
      balanceAfter: (currentUser.depositBalance - totalCost) + currentUser.winningBalance + (currentUser.referralBalance || 0),
      description: `Bought ${quantity} ticket(s) @ ₹${game.ticketPrice} each (Total: -₹${totalCost}) for ${game.title}`,
      referenceId: newTickets[0].ticketId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'completed',
    };
    setTransactions((prev) => [newTxn, ...prev]);

    // Update game tickets sold count & dynamically re-calculate standard 7-prize pool
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        const newTicketsSold = g.totalTicketsSold + quantity;
        const { prizePool, prizes } = calculateTambolaDynamicPrizes(
          newTicketsSold,
          g.ticketPrice,
          g.prizes
        );
        return {
          ...g,
          totalTicketsSold: newTicketsSold,
          registeredPlayers: g.registeredPlayers + 1,
          prizePool,
          prizes,
        };
      })
    );

    setTickets((prev) => [...newTickets, ...prev]);

    // Update admin stats
    setAdminStats((prev) => ({
      ...prev,
      ticketsSold: prev.ticketsSold + quantity,
      totalRevenue: prev.totalRevenue + totalCost,
    }));

    // Distribute 5-Level Referral commissions
    distributeReferralCommissions(totalCost);

    // Push notification to user notifications list
    const ticketNotif: UserNotificationItem = {
      id: `un_${Date.now()}`,
      category: 'ticket_confirmation',
      title: `🎟️ ${quantity} Ticket(s) Confirmed for ${game.title}`,
      message: `Your ${quantity} ticket(s) (IDs: ${newTickets.map((t) => t.ticketId).join(', ')}) are generated. Good luck!`,
      timestamp: 'Just now',
      read: false,
      actionTab: 'my-tickets',
      ticketId: newTickets[0].ticketId,
    };
    setUserNotifications((prev) => [ticketNotif, ...prev]);

    return true;
  };

  // 6. Claim Prize Handler with instant verification & Equal Split Logic
  const handleClaimPrize = (ticketId: string, prizeCode: PrizeCode) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || !liveGame) return;

    const prize = liveGame.prizes.find((p) => p.code === prizeCode);
    if (!prize) return;

    // Check if current user already claimed this prize on this ticket
    const alreadyClaimedOnThisTicket = prize.claimedWinners.some(
      (w) => w.ticketId === ticket.ticketId && w.userId === currentUser.id
    );
    if (alreadyClaimedOnThisTicket) {
      alert(`You have already claimed ${prize.name} on Ticket #${ticket.ticketNumber}!`);
      return;
    }

    if (prize.claimedWinners.length >= prize.maxWinners) {
      alert(`The ${prize.name} has already reached maximum winners (${prize.maxWinners})!`);
      return;
    }

    // Check validity against called numbers
    const result = verifyClaim(prizeCode, ticket.numbers, liveGame.calledNumbers, liveGame.currentNumber);
    if (!result.valid) {
      alert(`Claim Rejected: ${result.reason}`);
      return;
    }

    // Equal Split Calculation: If multiple winners, divide prize pool equally (e.g. ₹400 / 2 = ₹200 each)
    const existingWinnersCount = prize.claimedWinners.length;
    const totalWinnersForPrize = existingWinnersCount + 1;
    const splitInfo = calculateSplitWinning(prize.amount, totalWinnersForPrize);
    const splitAmount = splitInfo.perWinnerAmount;
    const isSplit = splitInfo.isSplit;

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
        ? `Won ${prize.name} in ${liveGame.title} (Split 1/${totalWinnersForPrize} of ₹${prize.amount})`
        : `Won ${prize.name} in ${liveGame.title}`,
      referenceId: ticket.ticketId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'completed',
    };
    setTransactions((prev) => [winTxn, ...prev]);

    // Update prize claim state in game
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== liveGame.id) return g;
        return {
          ...g,
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

    // Trigger fireworks, fanfare, and live ticket flash
    setCelebrationData({
      prizeName: isSplit ? `${prize.name} (Equal Split)` : prize.name,
      prizeAmount: splitAmount,
      userName: currentUser.name,
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      winningNumber: liveGame.currentNumber,
      ticket: ticket,
      calledNumbers: liveGame.calledNumbers,
      isCurrentUser: true,
    });

    // Add winning notification
    const winNotif: UserNotificationItem = {
      id: `un_${Date.now()}`,
      category: 'winning',
      title: `🏆 Congratulations! You Won ₹${splitAmount.toLocaleString('en-IN')}!`,
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

    const cleanUtr = (utrNumber || '').trim();

    // 1. One-time ₹10 Registration Bonus rule on 1st deposit:
    const isFirstDeposit = !currentUser.hasDeposited && !currentUser.firstDepositBonusClaimed;
    const registrationBonus = isFirstDeposit ? 10 : 0;

    // 2. 10% Daily Reward Bonus Unlock Rule:
    const availableReward = currentUser.bonusRewardBalance || 0;
    const maxTenPercent = amount * 0.10;
    const unlockedReward = Math.min(maxTenPercent, availableReward);
    const roundedUnlocked = Math.round(unlockedReward * 100) / 100;

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
      bonusRewardUnlock: roundedUnlocked,
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

    const targetUser = users.find((u) => u.id === deposit.userId);
    if (!targetUser) return false;

    const regBonus = deposit.registrationBonus || 0;
    const rewUnlock = deposit.bonusRewardUnlock || 0;
    const totalCredit = deposit.amount + regBonus + rewUnlock;

    const newDepositBal = (targetUser.depositBalance || 0) + totalCredit;
    const newBonusRewBal = Math.max(0, (targetUser.bonusRewardBalance || 0) - rewUnlock);
    const newTotalWallet = newDepositBal + (targetUser.winningBalance || 0) + (targetUser.referralBalance || 0);

    const updatedTargetUser: User = {
      ...targetUser,
      hasDeposited: true,
      firstDepositBonusClaimed: true,
      depositBalance: newDepositBal,
      bonusRewardBalance: newBonusRewBal,
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

    // Update users state
    setUsers((prev) => {
      const nextUsers = prev.map((u) => (u.id === updatedTargetUser.id ? updatedTargetUser : u));
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(nextUsers));
      } catch (e) {}
      return nextUsers;
    });

    if (currentUser && currentUser.id === updatedTargetUser.id) {
      setCurrentUser(updatedTargetUser);
    }

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
      }, { merge: true }).catch(() => {});

      fetch('/api/deposits/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, remarks }),
      }).catch(() => {});
    } catch (e) {}

    // Update transaction status
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.referenceId === depositId || (t.utrNumber && t.utrNumber === deposit.utrNumber && t.userId === deposit.userId)) {
          return {
            ...t,
            status: 'completed' as const,
            balanceAfter: newTotalWallet,
            description: `डिपॉजिट स्वीकृत (UTR: ${deposit.utrNumber}) - एडमिन द्वारा OK किया गया`,
          };
        }
        return t;
      });
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

    return true;
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

    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        walletBalance: prev.walletBalance - data.amount,
        winningBalance: prev.winningBalance - data.amount,
      };
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
    setWithdrawals((prev) => [newReq, ...prev]);

    const newTxn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: currentUser.id,
      type: 'withdrawal',
      amount: -data.amount,
      balanceAfter: currentUser.walletBalance - data.amount,
      description: `Withdrawal ₹${data.amount} (Net Payout: ₹${netAmount} after 10% TDS & 5% Admin Charges) to ${
        data.paymentMethod === 'upi' ? data.upiId : data.bankName
      }`,
      referenceId: newReq.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'pending',
    };
    setTransactions((prev) => [newTxn, ...prev]);
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
        message: `अपर्याप्त वॉलेट बैलेंस! ₹${amount} भेजने के लिए 5% ट्रांसफर शुल्क (₹${feeAmount}) सहित कुल ₹${totalDeduction} की आवश्यकता है। आपका बैलेंस: ₹${currentUser.walletBalance.toLocaleString('en-IN')}`,
      };
    }

    const clean = recipientQuery.trim().toLowerCase();
    const cleanPhone = clean.replace(/[\s+-]/g, '');

    // Search recipient in registered users
    const foundUser = users.find(
      (u) =>
        (u.id && u.id.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.phone && u.phone.replace(/[\s+-]/g, '') === cleanPhone) ||
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
      title: `💸 P2P Transfer Successful: ₹${amount.toLocaleString('en-IN')} Sent`,
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
        message: `अपर्याप्त विथड्रॉल बैलेंस! आपके पास केवल ₹${currentUser.winningBalance.toLocaleString('en-IN')} उपलब्ध है।`,
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
      title: `🔄 वॉलेट ट्रांसफर सफल: ₹${amount.toLocaleString('en-IN')}`,
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
  const handleApproveWithdrawal = async (id: string): Promise<boolean> => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'approved' } : w))
    );
    setTransactions((prev) =>
      prev.map((t) => (t.referenceId === id ? { ...t, status: 'completed' } : t))
    );
    return true;
  };

  // 10. Admin Reject Withdrawal (refunds user)
  const handleRejectWithdrawal = async (id: string): Promise<boolean> => {
    const req = withdrawals.find((w) => w.id === id);
    if (req) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          walletBalance: (prev.walletBalance || 0) + req.amount,
          winningBalance: (prev.winningBalance || 0) + req.amount,
        };
      });
    }
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'rejected' } : w))
    );
    setTransactions((prev) =>
      prev.map((t) => (t.referenceId === id ? { ...t, status: 'failed' } : t))
    );
    return true;
  };

  // 11. Admin Create Game (With Admin-decided Rate, Prizes, and Ticket Color Theme)
  const handleCreateGame = async (gameData: Partial<TambolaGame>): Promise<boolean> => {
    const code = `TL-${Math.floor(100 + Math.random() * 900)}`;
    const newGame: TambolaGame = {
      id: `game_${Date.now()}`,
      title: gameData.title || 'New Tambola Match',
      gameCode: code,
      startTime: gameData.startTime || '10:00 PM',
      date: gameData.date || 'Today',
      ticketPrice: gameData.ticketPrice || 50,
      prizePool: gameData.prizePool || 10000,
      ticketColorTheme: gameData.ticketColorTheme || 'multi',
      totalTicketsSold: 0,
      registeredPlayers: 0,
      maxPlayers: 500,
      status: 'upcoming',
      isActive: true,
      bookingOpen: true,
      calledNumbers: [],
      currentNumber: null,
      previousNumbers: [],
      autoCalling: false,
      callIntervalSeconds: 6,
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

    setGames((prev) => [newGame, ...prev]);
    try {
      const gameRef = doc(db, 'games', newGame.id);
      await setDoc(gameRef, newGame);
    } catch (e) {
      console.warn('Firestore create game notice:', e);
    }
    return true;
  };

  // 12. Admin Update Game (Rate, Prizes, Colors, Timings, Game ON/OFF, Booking ON/OFF)
  const handleUpdateGame = async (gameId: string, updates: Partial<TambolaGame>): Promise<boolean> => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, ...updates } : g))
    );
    try {
      const gameRef = doc(db, 'games', gameId);
      setDoc(gameRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore game update notice:', e);
    }
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
        userId: currentUser.id,
        userName: `${currentUser.name} (Admin Generated)`,
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

  // 15. Admin Update User Wallet
  const handleUpdateWalletBalance = async (userId: string, amount: number, type: 'credit' | 'debit'): Promise<boolean> => {
    const delta = type === 'credit' ? amount : -amount;
    let targetUser: User | undefined;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextWallet = Math.max(0, (u.walletBalance || 0) + delta);
          const nextDeposit = Math.max(0, (u.depositBalance || 0) + delta);
          targetUser = { ...u, walletBalance: nextWallet, depositBalance: nextDeposit };
          return targetUser;
        }
        return u;
      })
    );

    // Update local state & storage
    let updatedUsers: User[] = [];
    setUsers((prev) => {
      updatedUsers = prev.map((u) => {
        if (u.id === userId) {
          return targetUser;
        }
        return u;
      });
      try {
        localStorage.setItem('apna_tambola_registered_users', JSON.stringify(updatedUsers));
      } catch (e) {}
      return updatedUsers;
    });

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          walletBalance: Math.max(0, prev.walletBalance + delta),
          depositBalance: Math.max(0, prev.depositBalance + delta),
        };
        try {
          localStorage.setItem('apna_tambola_auth_user', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    try {
      fetch('/api/users/wallet-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, type }),
      }).catch(() => {});
    } catch (e) {}

    try {
      if (targetUser) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          walletBalance: targetUser.walletBalance,
          depositBalance: targetUser.depositBalance,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore update wallet balance notice:', e);
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
        {activeTab === 'dashboard' && (
          currentUser ? (
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
            />
          ) : (
            <ProtectedViewGate
              title="यूज़र डैशबोर्ड (User Dashboard)"
              subtitle="डैशबोर्ड, टिकट स्टेटस, इनकम और वॉलेट बैलेंस देखने के लिए कृपया अपने आईडी और पासवर्ड से लॉगिन करें।"
              onOpenAuth={handleOpenAuth}
              onNavigate={handleNavigate}
            />
          )
        )}

        {activeTab === 'live' && (
          <LiveGameView
            game={liveGame}
            userTickets={tickets}
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
            />
          )
        )}

        {activeTab === 'my-tickets' && (
          currentUser ? (
            <MyTicketsView
              tickets={tickets}
              games={games}
              onNavigate={handleNavigate}
              onToggleAutoMode={handleToggleTicketAutoMode}
            />
          ) : (
            <ProtectedViewGate
              title="मेरे टिकट & पासबुक (My Tickets)"
              subtitle="अपने खरीदे गए लाइव और पिछले टिकट देखने के लिए कृपया लॉगिन करें।"
              onOpenAuth={handleOpenAuth}
              onNavigate={handleNavigate}
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
            />
          )
        )}

        {activeTab === 'wallet' && (
          currentUser ? (
            <WalletView
              currentUser={currentUser}
              transactions={transactions}
              withdrawals={withdrawals}
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

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboardView
            stats={adminStats}
            games={games}
            users={users}
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
            onCreateGame={handleCreateGame}
            onUpdateGame={handleUpdateGame}
            onDeleteGame={handleDeleteGame}
            onApproveWithdrawal={handleApproveWithdrawal}
            onRejectWithdrawal={handleRejectWithdrawal}
            onApproveDeposit={handleApproveDeposit}
            onRejectDeposit={handleRejectDeposit}
            onUpdateWalletBalance={handleUpdateWalletBalance}
            onToggleKYC={handleToggleKYC}
            onToggleBlockUser={handleToggleBlockUser}
            onResetPassword={handleResetPassword}
            onAdminGenerateTickets={handleAdminGenerateTickets}
            onAdminToggleTicketStatus={handleAdminToggleTicketStatus}
            onAdminBatchToggleTickets={handleAdminBatchToggleTickets}
            onApproveCommission={handleApproveCommission}
            onReverseCommission={handleReverseCommission}
            onSendNotification={handleSendNotification}
            onDeleteNotification={handleDeleteNotification}
            onUpdateSettings={handleUpdateSettings}
            onRegisterUser={handleRegisterUser}
            onUpdateUser={handleRegisterUser}
            onDeleteUser={handleDeleteUser}
            onBatchDeleteUsers={handleBatchDeleteUsers}
            onForceRefresh={handleForceRefresh}
            isSyncing={isSyncing}
          />
        )}

        {/* If on Admin tab but not logged in as Admin, show direct portal entry prompt */}
        {activeTab === 'admin' && currentUser?.role !== 'admin' && (
          <div className="max-w-xl mx-auto py-12 text-center space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-red-500/50 shadow-2xl shadow-red-950/60 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                <span className="text-3xl">👑</span>
              </div>
              <h2 className="text-2xl font-black text-white">व्यवस्थापक (एडमिन) लॉगिन आवश्यक</h2>
              <p className="text-sm text-slate-300">
                एडमिन डैशबोर्ड में प्रवेश करने के लिए कृपया अधिकृत क्रेडेंशियल्स (ashishbadawat@gmail.com या Google Sign-In) से लॉगिन करें।
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={handleOpenAdminLogin}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>👑 एडमिन लॉगिन पोर्टल खोलें</span>
                </button>
                <button
                  onClick={() => handleNavigate('home')}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
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
    </div>
  );
}
export default App;
