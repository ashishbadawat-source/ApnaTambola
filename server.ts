import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_USER,
  ADMIN_USER,
  INITIAL_USERS,
  INITIAL_GAMES,
  INITIAL_USER_TICKETS,
  INITIAL_WINNERS,
  INITIAL_REFERRAL_MEMBERS,
  INITIAL_COMMISSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_WITHDRAWALS,
  INITIAL_DEPOSITS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_SITE_SETTINGS,
} from './src/data/mockData';
import {
  generateTambolaTicketMatrix,
  generateTicketId,
  verifyClaim,
} from './src/utils/tambolaTicket';
import {
  extractReferralCode,
  findReferrerInList,
  isDirectChildOf,
} from './src/utils/referralMatcher';
import {
  User,
  TambolaGame,
  TambolaTicket,
  GameWinner,
  ReferralCommission,
  ReferralMember,
  WalletTransaction,
  WithdrawalRequest,
  DepositRequest,
  SupportTicket,
  SiteSettings,
  PrizeCode,
  EmailEventType,
} from './src/types';
import {
  sendBrevoEmail,
  brevoSettings,
  emailLogs,
  getMaskedSettings,
} from './src/server/emailServiceBackend';

// Durable File Storage Path
const DATA_FILE = path.join(process.cwd(), 'server_store.json');

// In-Memory Durable Server State
let users: User[] = [ADMIN_USER, ...(INITIAL_USERS || []).filter((u) => u.id !== ADMIN_USER.id)];
let games: TambolaGame[] = [...INITIAL_GAMES];
let tickets: TambolaTicket[] = [...INITIAL_USER_TICKETS];
let winners: GameWinner[] = [...INITIAL_WINNERS];
let referralMembers: ReferralMember[] = [...INITIAL_REFERRAL_MEMBERS];
let commissions: ReferralCommission[] = [...INITIAL_COMMISSIONS];
let transactions: WalletTransaction[] = [...INITIAL_TRANSACTIONS];
let withdrawals: WithdrawalRequest[] = [...INITIAL_WITHDRAWALS];
let deposits: DepositRequest[] = [...INITIAL_DEPOSITS];
let supportTickets: SupportTicket[] = [...INITIAL_SUPPORT_TICKETS];
let siteSettings: SiteSettings = { ...INITIAL_SITE_SETTINGS };

// Load persistent state from disk on boot
function loadStateFromDisk() {
  try {
    const userMap = new Map<string, User>();
    [ADMIN_USER, ...(INITIAL_USERS || [])].forEach((u) => {
      if (u && u.id) userMap.set(u.id, u);
    });

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users) && data.users.length > 0) {
        data.users.forEach((u: User) => {
          if (u && u.id) {
            userMap.set(u.id, { ...(userMap.get(u.id) || {}), ...u });
          }
        });
      }
      users = Array.from(userMap.values());
      if (Array.isArray(data.games) && data.games.length > 0) games = data.games;
      if (Array.isArray(data.tickets) && data.tickets.length > 0) tickets = data.tickets;
      if (Array.isArray(data.commissions) && data.commissions.length > 0) commissions = data.commissions;
      if (Array.isArray(data.transactions) && data.transactions.length > 0) transactions = data.transactions;
      if (Array.isArray(data.withdrawals) && data.withdrawals.length > 0) withdrawals = data.withdrawals;
      if (Array.isArray(data.deposits) && data.deposits.length > 0) deposits = data.deposits;
      if (Array.isArray(data.supportTickets) && data.supportTickets.length > 0) supportTickets = data.supportTickets;
      if (data.siteSettings) siteSettings = { ...siteSettings, ...data.siteSettings };
      console.log(`[Storage] Loaded persistent data: ${users.length} users, ${commissions.length} commissions, ${deposits.length} deposits`);
    } else {
      users = Array.from(userMap.values());
      saveStateToDisk();
    }
  } catch (e) {
    console.warn('[Storage] Could not load persistent server state:', e);
  }
}

// Save state to disk helper
function saveStateToDisk() {
  try {
    const payload = {
      users,
      games,
      tickets,
      commissions,
      transactions,
      withdrawals,
      deposits,
      supportTickets,
      siteSettings,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Storage] Could not save persistent server state:', e);
  }
}

// Initialize persistence immediately
loadStateFromDisk();

// Automatic interval timer for live games
let liveGameInterval: NodeJS.Timeout | null = null;

function broadcastLiveGameState() {
  const liveGame = games.find((g) => g.status === 'live' && g.autoCalling);
  if (!liveGame) return;

  // Check if all 90 numbers called
  if (liveGame.calledNumbers.length >= 90) {
    liveGame.status = 'completed';
    liveGame.autoCalling = false;
    return;
  }

  // Draw uncalled number
  const uncalled = [];
  for (let i = 1; i <= 90; i++) {
    if (!liveGame.calledNumbers.includes(i)) {
      uncalled.push(i);
    }
  }

  if (uncalled.length === 0) {
    liveGame.status = 'completed';
    liveGame.autoCalling = false;
    return;
  }

  const nextNum = uncalled[Math.floor(Math.random() * uncalled.length)];
  liveGame.calledNumbers.push(nextNum);
  liveGame.currentNumber = nextNum;
  liveGame.previousNumbers = liveGame.calledNumbers.slice(-6, -1).reverse();
}

// Start master ticker
function startLiveGameTicker() {
  if (liveGameInterval) clearInterval(liveGameInterval);
  liveGameInterval = setInterval(() => {
    broadcastLiveGameState();
  }, 6000);
}
startLiveGameTicker();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Supabase Status & Connection Diagnostic API
  const SUPABASE_PROJECT_ID = 'ztdfzpyxurdpljzphhgz';
  const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

  function normalizeUrl(rawUrl?: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_SUPABASE_URL;
    let url = rawUrl.trim();
    if (!url || url === '""' || url === "''") return DEFAULT_SUPABASE_URL;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.')) {
        url = `https://${url}`;
      } else {
        url = `https://${url}.supabase.co`;
      }
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // ignore
    }
    return DEFAULT_SUPABASE_URL;
  }

  const SUPABASE_URL = normalizeUrl(process.env.SUPABASE_URL);
  const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  let serverSupabase: SupabaseClient | null = null;

  if (SUPABASE_KEY && SUPABASE_KEY.length > 10 && SUPABASE_URL.startsWith('http')) {
    try {
      serverSupabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
      console.warn('[Supabase Server] Client init notice:', e);
    }
  }

  app.get('/api/supabase/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      projectId: SUPABASE_PROJECT_ID,
      region: 'ap-southeast-2 (Oceania Sydney)',
      url: SUPABASE_URL,
      configured: Boolean(SUPABASE_KEY),
      hasClient: Boolean(serverSupabase),
    });
  });

  // 1b. Users API - Cross-device sync, Registration & Referral linking
  app.get('/api/users', (req: Request, res: Response) => {
    res.json(users);
  });

  // Direct Referral Query API - Database Source of Truth
  app.get(['/api/referrals/direct', '/api/users/:userId/referrals'], (req: Request, res: Response) => {
    try {
      const rawUserId = String(req.query.userId || req.query.id || req.query.referralCode || req.params.userId || '').trim();
      if (!rawUserId) {
        return res.status(400).json({ success: false, error: 'User ID or referral code required' });
      }

      // Find the user/referrer in database
      const cleanRef = extractReferralCode(rawUserId);
      const parentUser = users.find(
        (u) =>
          u.id === rawUserId ||
          ((u as any).user_id && (u as any).user_id === rawUserId) ||
          u.referralCode === rawUserId ||
          u.referralCode === cleanRef ||
          (u.phone && u.phone.replace(/\D/g, '') === rawUserId.replace(/\D/g, ''))
      );

      if (!parentUser) {
        return res.json({
          success: true,
          count: 0,
          directReferrals: [],
          referrer: null,
          message: 'Referrer not found in database',
        });
      }

      // Query database for all direct children
      const directUsers = users.filter((u) => {
        if (!u || u.id === parentUser.id) return false;
        // Direct database field check
        if (u.referrer_id && (u.referrer_id === parentUser.id || u.referrer_id === (parentUser as any).user_id || u.referrer_id === parentUser.referralCode)) {
          return true;
        }
        if (u.referredByUserId && u.referredByUserId === parentUser.id) {
          return true;
        }
        return isDirectChildOf(u, parentUser, commissions);
      });

      res.json({
        success: true,
        count: directUsers.length,
        directReferrals: directUsers,
        referrer: {
          id: parentUser.id,
          name: parentUser.name,
          referralCode: parentUser.referralCode,
          phone: parentUser.phone,
          avatar: parentUser.avatar,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Validate Referral Code API before registration
  app.get('/api/referrals/validate', (req: Request, res: Response) => {
    try {
      const rawCode = String(req.query.code || req.query.ref || req.query.referral || '').trim();
      if (!rawCode) {
        return res.json({ valid: false, message: 'No referral code provided' });
      }
      const cleanCode = extractReferralCode(rawCode);
      const referrer = findReferrerInList(cleanCode, users);
      if (referrer) {
        return res.json({
          valid: true,
          referrer: {
            id: referrer.id,
            user_id: (referrer as any).user_id || referrer.id,
            name: referrer.name,
            referralCode: referrer.referralCode,
            phone: referrer.phone ? `${referrer.phone.slice(0, 7)}XXXX` : '',
            avatar: referrer.avatar,
          },
        });
      }
      return res.json({ valid: false, message: 'Referral code does not match any existing user' });
    } catch (e: any) {
      res.status(500).json({ valid: false, error: e.message });
    }
  });

  // Atomic Registration Endpoint (Database-Authoritative)
  const handleUserRegistration = (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const name = body.name || body.user_name || (body.user && (body.user.name || body.user.user_name));
      const phone = body.phone || body.mobile || (body.user && (body.user.phone || body.user.mobile));
      const email = body.email || (body.user && body.user.email);
      const password = body.password || (body.user && body.user.password);
      const rawReferralInput =
        body.referralCodeInput ||
        body.referrer_id ||
        body.referredBy ||
        body.referredByUserId ||
        body.sponsorCode ||
        body.sponsorId ||
        body.referrerCode ||
        body.uplineCode ||
        (body.user && (body.user.referralCodeInput || body.user.referrer_id || body.user.referredBy || body.user.referredByUserId || (body.user as any).sponsorCode || (body.user as any).sponsorId)) ||
        '';
      const selectedAvatar = body.selectedAvatar || body.avatar || (body.user && body.user.avatar);
      const providedId = body.id || body.user_id || (body.user && (body.user.id || body.user.user_id));
      const providedRefCode = body.referralCode || (body.user && body.user.referralCode);
      const providedReferredByUserId = body.referredByUserId || (body.user && body.user.referredByUserId);

      if (!name || !phone) {
        return res.status(400).json({ success: false, error: 'Name and mobile number are required.' });
      }

      const phoneDigits = String(phone).replace(/\D/g, '');
      const existingUserIdx = users.findIndex(
        (u) => (u.phone && u.phone.replace(/\D/g, '').endsWith(phoneDigits)) || (providedId && u.id === providedId)
      );

      // STEP 1: Database validation of Referrer
      const cleanRef = extractReferralCode(rawReferralInput);
      let referrer: User | null = null;

      // Check if client provided the resolved referrerUser object
      if (body.referrerUser && body.referrerUser.id) {
        referrer = body.referrerUser;
        // Make sure it exists or is updated in memory users array
        const refIdx = users.findIndex((u) => u.id === body.referrerUser.id);
        if (refIdx >= 0) {
          users[refIdx] = { ...users[refIdx], ...body.referrerUser };
        } else {
          users.push(body.referrerUser);
        }
      }

      // Prevent self-referral (only if the referral input matches this user's OWN ID or OWN newly generated code)
      const isSelfReferral =
        (providedId && (providedId === cleanRef || providedId === rawReferralInput)) ||
        (existingUserIdx >= 0 && (users[existingUserIdx].referralCode === cleanRef || users[existingUserIdx].id === cleanRef));

      if (!isSelfReferral) {
        if (!referrer && providedReferredByUserId) {
          referrer = users.find((u) => u.id === providedReferredByUserId || (u as any).user_id === providedReferredByUserId) || null;
        }

        if (!referrer && cleanRef) {
          referrer = findReferrerInList(cleanRef, users, providedId);
        }
      }

      // STEP 2 & 3: Create / Update user with atomic database referral linkage
      const finalId = providedId || (existingUserIdx >= 0 ? users[existingUserIdx].id : `usr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`);
      const resolvedReferralCode =
        providedRefCode ||
        (existingUserIdx >= 0 && users[existingUserIdx].referralCode
          ? users[existingUserIdx].referralCode
          : `REF-${String(name).replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PLY'}${Math.floor(100 + Math.random() * 900)}`);

      // Preserve referral code and referrer ID even if referrer user was temporarily cold
      const finalReferrerId = referrer ? referrer.id : (providedReferredByUserId || (cleanRef ? cleanRef : null));
      const finalReferredBy = referrer ? (referrer.referralCode || referrer.id) : (cleanRef || rawReferralInput || body.referredBy || (body.user && body.user.referredBy) || '');
      const finalReferredByUserId = referrer ? referrer.id : (providedReferredByUserId || (cleanRef ? cleanRef : ''));

      const nowIso = new Date().toISOString();

      const newUser: User = {
        id: finalId,
        user_id: finalId,
        name: String(name).trim(),
        user_name: String(name).trim(),
        email: email ? String(email).trim() : `${String(name).toLowerCase().replace(/[^a-z0-9]/g, '')}${phoneDigits.slice(-4)}@tambolalive.com`,
        phone: `+91 ${phoneDigits}`,
        mobile: `+91 ${phoneDigits}`,
        password: password || '123456',
        role: 'user',
        status: 'active',
        isBlocked: false,
        walletBalance: existingUserIdx >= 0 ? (users[existingUserIdx].walletBalance ?? 0) : 0,
        depositBalance: existingUserIdx >= 0 ? (users[existingUserIdx].depositBalance ?? 0) : 0,
        winningBalance: existingUserIdx >= 0 ? (users[existingUserIdx].winningBalance ?? 0) : 0,
        referralBalance: existingUserIdx >= 0 ? (users[existingUserIdx].referralBalance ?? 0) : 0,
        bonusRewardBalance: existingUserIdx >= 0 ? (users[existingUserIdx].bonusRewardBalance ?? 0) : 0,
        firstDepositBonusClaimed: existingUserIdx >= 0 ? (users[existingUserIdx].firstDepositBonusClaimed ?? false) : false,
        hasDeposited: existingUserIdx >= 0 ? (users[existingUserIdx].hasDeposited ?? false) : false,
        referralCode: resolvedReferralCode,
        referrer_id: finalReferrerId,
        referredBy: finalReferredBy,
        referredByUserId: finalReferredByUserId,
        kycStatus: 'verified',
        avatar: selectedAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        createdAt: existingUserIdx >= 0 ? users[existingUserIdx].createdAt : (body.user?.createdAt || nowIso),
        created_at: existingUserIdx >= 0 ? users[existingUserIdx].createdAt : (body.user?.createdAt || nowIso),
        bankDetails: {
          accountName: String(name).trim(),
          accountNumber: 'XXXXXX' + Math.floor(1000 + Math.random() * 9000),
          ifsc: 'SBIN0001234',
          bankName: 'State Bank of India',
          upiId: `${phoneDigits}@upi`,
        },
      };

      if (existingUserIdx >= 0) {
        users[existingUserIdx] = { ...users[existingUserIdx], ...newUser };
      } else {
        users.unshift(newUser);
      }

      // STEP 4: Award referrer bonus & commission record atomically
      let joinComm: ReferralCommission | null = null;
      if (referrer) {
        const refInArray = users.find((u) => u.id === referrer!.id) || referrer;
        refInArray.walletBalance = (refInArray.walletBalance || 0) + 10;
        refInArray.referralBalance = (refInArray.referralBalance || 0) + 10;
        refInArray.referralCount = (refInArray.referralCount || 0) + 1;

        const existingJoinComm = commissions.find(
          (c) => c.userId === referrer!.id && c.sourceUserId === newUser.id && c.gameId === 'signup_bonus'
        );

        if (!existingJoinComm) {
          joinComm = {
            id: `comm_join_${Date.now()}_${newUser.id}`,
            userId: referrer.id,
            userName: referrer.name,
            sourceUserId: newUser.id,
            sourceUserName: newUser.name,
            gameId: 'signup_bonus',
            gameTitle: '🎁 New Direct Referral Join Bonus (Level 1)',
            ticketId: 'REG-DIRECT',
            level: 1,
            percentage: 10,
            baseAmount: 10,
            commissionAmount: 10,
            transactionId: `TXN-REF-${Date.now()}`,
            timestamp: nowIso,
            status: 'approved',
          };
          commissions.unshift(joinComm);
        }
      }

      // STEP 5: Commit to durable persistent disk storage
      saveStateToDisk();

      console.log(`[Referral Registration] Registered user ${newUser.name} (${newUser.id}), Referrer ID: ${newUser.referrer_id || 'NONE (Direct)'}`);

      res.json({
        success: true,
        user: newUser,
        referrer: referrer
          ? {
              id: referrer.id,
              name: referrer.name,
              referralCode: referrer.referralCode,
              phone: referrer.phone,
              walletBalance: referrer.walletBalance,
              referralBalance: referrer.referralBalance,
            }
          : null,
        commission: joinComm,
        totalUsers: users.length,
        message: 'User registered successfully with database referral linkage!',
      });
    } catch (err: any) {
      console.error('[Referral Registration Error]', err);
      res.status(500).json({ success: false, error: err.message || 'Registration failed' });
    }
  };

  app.post('/api/users/register', handleUserRegistration);
  app.post('/api/auth/register', handleUserRegistration);

  app.post('/api/users/update-balances', (req: Request, res: Response) => {
    try {
      const { userId, depositBalance, bonusRewardBalance, walletBalance, hasDeposited, firstDepositBonusClaimed } = req.body;
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        if (depositBalance !== undefined) targetUser.depositBalance = depositBalance;
        if (bonusRewardBalance !== undefined) targetUser.bonusRewardBalance = bonusRewardBalance;
        if (walletBalance !== undefined) targetUser.walletBalance = walletBalance;
        if (hasDeposited !== undefined) targetUser.hasDeposited = hasDeposited;
        if (firstDepositBonusClaimed !== undefined) targetUser.firstDepositBonusClaimed = firstDepositBonusClaimed;
        saveStateToDisk();
      }
      res.json({ success: true, user: targetUser });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/users/toggle-kyc', (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        targetUser.kycStatus = targetUser.kycStatus === 'verified' ? 'unverified' : 'verified';
        saveStateToDisk();
        return res.json({ success: true, user: targetUser, nextStatus: targetUser.kycStatus });
      }
      res.status(404).json({ success: false, error: 'User not found' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/users/toggle-block', (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        targetUser.isBlocked = !targetUser.isBlocked;
        targetUser.status = targetUser.isBlocked ? 'blocked' : 'active';
        saveStateToDisk();
        return res.json({ success: true, user: targetUser, isBlocked: targetUser.isBlocked });
      }
      res.status(404).json({ success: false, error: 'User not found' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/users/reset-password', (req: Request, res: Response) => {
    try {
      const { userId, newPassword } = req.body;
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        targetUser.password = newPassword || '123456';
        saveStateToDisk();
        return res.json({ success: true, user: targetUser });
      }
      res.status(404).json({ success: false, error: 'User not found' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      users = users.filter((u) => u.id !== id);
      saveStateToDisk();
      res.json({ success: true, message: 'User deleted' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/users/batch-delete', (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;
      const idSet = new Set(userIds || []);
      users = users.filter((u) => !idSet.has(u.id));
      saveStateToDisk();
      res.json({ success: true, message: 'Users batch deleted' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/users/wallet-adjust', (req: Request, res: Response) => {
    try {
      const { userId, amount, type } = req.body;
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        const num = Number(amount) || 0;
        if (type === 'credit') {
          targetUser.walletBalance = (targetUser.walletBalance || 0) + num;
          targetUser.depositBalance = (targetUser.depositBalance || 0) + num;
        } else {
          targetUser.walletBalance = Math.max(0, (targetUser.walletBalance || 0) - num);
        }
        saveStateToDisk();
        return res.json({ success: true, user: targetUser });
      }
      res.status(404).json({ success: false, error: 'User not found' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/users/sync', (req: Request, res: Response) => {
    const incomingUsers: User[] = req.body.users || [];
    const map = new Map<string, User>();
    users.forEach((u) => {
      if (u && u.id) map.set(u.id, u);
    });
    incomingUsers.forEach((u) => {
      if (u && u.id) {
        const prev = map.get(u.id);
        map.set(u.id, { ...(prev || {}), ...u });
      }
    });
    users = Array.from(map.values());
    saveStateToDisk();
    res.json({ success: true, totalUsers: users.length, users });
  });

  app.get('/api/commissions', (req: Request, res: Response) => {
    res.json(commissions);
  });

  app.post('/api/commissions', (req: Request, res: Response) => {
    const comm = req.body;
    if (comm && comm.id) {
      const idx = commissions.findIndex((c) => c.id === comm.id);
      if (idx >= 0) commissions[idx] = { ...commissions[idx], ...comm };
      else commissions.unshift(comm);
      saveStateToDisk();
    }
    res.json({ success: true, commissions });
  });

  // Comprehensive Real-Time Sync endpoint for cross-device sync
  app.get('/api/sync/all', (req: Request, res: Response) => {
    res.json({
      users,
      commissions,
      games,
      tickets,
      winners,
      transactions,
      withdrawals,
      deposits,
      supportTickets,
      siteSettings,
      serverTime: new Date().toISOString(),
    });
  });

  // Deposits API (Admin UTR Verification & User Recharge Workflow)
  app.get('/api/deposits', (req: Request, res: Response) => {
    res.json(deposits);
  });

  app.post('/api/deposits/request', (req: Request, res: Response) => {
    try {
      const {
        userId,
        userName,
        userPhone,
        userEmail,
        amount,
        paymentMethod,
        utrNumber,
        proofImageUrl,
        registrationBonus,
        bonusRewardUnlock,
      } = req.body;

      const numAmount = Number(amount) || 0;
      if (numAmount < 10) {
        return res.status(400).json({ success: false, error: 'Minimum deposit amount is ₹10.' });
      }

      const user = users.find((u) => u.id === userId);
      const newDeposit: DepositRequest = {
        id: `dep_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        userId: userId || (user ? user.id : 'usr_anon'),
        userName: userName || (user ? user.name : 'Unknown User'),
        userPhone: userPhone || (user ? user.phone : ''),
        userEmail: userEmail || (user ? user.email : ''),
        amount: numAmount,
        paymentMethod: paymentMethod || 'UPI',
        utrNumber: utrNumber || `UPI${Date.now()}`,
        proofImageUrl: proofImageUrl || '',
        status: 'pending',
        requestDate: new Date().toISOString(),
        registrationBonus: registrationBonus !== undefined ? registrationBonus : (user && !user.hasDeposited && !user.firstDepositBonusClaimed ? 10 : 0),
        bonusRewardUnlock: Number(bonusRewardUnlock) || 0,
      };

      deposits.unshift(newDeposit);

      // Create a pending wallet transaction
      const pendingTxn: WalletTransaction = {
        id: `txn_${Date.now()}`,
        userId: newDeposit.userId,
        type: 'deposit',
        amount: numAmount,
        balanceAfter: user ? user.walletBalance : 0,
        description: `डिपॉजिट अनुरोध (UTR: ${newDeposit.utrNumber}) — एडमिन सत्यापन लंबित (Pending Verification)`,
        paymentMethod: newDeposit.paymentMethod,
        referenceId: newDeposit.utrNumber,
        utrNumber: newDeposit.utrNumber,
        proofImageUrl: newDeposit.proofImageUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
        status: 'pending',
      };
      transactions.unshift(pendingTxn);

      saveStateToDisk();

      res.json({
        success: true,
        deposit: newDeposit,
        transaction: pendingTxn,
        message: 'Deposit request submitted. Balance will be added once Admin verifies UTR.',
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/deposits/approve', (req: Request, res: Response) => {
    try {
      const { depositId, adminRemarks } = req.body;
      const deposit = deposits.find((d) => d.id === depositId);
      if (!deposit) {
        return res.status(404).json({ success: false, error: 'Deposit request not found.' });
      }

      deposit.status = 'approved';
      deposit.processedDate = new Date().toISOString();
      deposit.adminRemarks = adminRemarks || 'UTR Verified & Payment Received - Approved';

      const targetUser = users.find((u) => u.id === deposit.userId);
      if (targetUser) {
        const bonus1st = deposit.registrationBonus || (!targetUser.hasDeposited && !targetUser.firstDepositBonusClaimed ? 10 : 0);
        const rewardUnlock = deposit.bonusRewardUnlock || 0;
        const totalDepositCredit = deposit.amount + bonus1st + rewardUnlock;

        targetUser.depositBalance = (targetUser.depositBalance || 0) + totalDepositCredit;
        targetUser.bonusRewardBalance = Math.max(0, (targetUser.bonusRewardBalance || 0) - rewardUnlock);
        targetUser.hasDeposited = true;
        targetUser.firstDepositBonusClaimed = true;
        targetUser.walletBalance = (targetUser.depositBalance || 0) + (targetUser.winningBalance || 0) + (targetUser.referralBalance || 0);

        // Update transaction status
        const txn = transactions.find((t) => t.referenceId === deposit.utrNumber || t.utrNumber === deposit.utrNumber);
        if (txn) {
          txn.status = 'completed';
          txn.balanceAfter = targetUser.walletBalance;
          txn.description = `Deposit approved via ${deposit.paymentMethod} (UTR: ${deposit.utrNumber})`;
        } else {
          transactions.unshift({
            id: `txn_${Date.now()}`,
            userId: targetUser.id,
            type: 'deposit',
            amount: deposit.amount,
            balanceAfter: targetUser.walletBalance,
            description: `डिपॉजिट स्वीकृत (UTR: ${deposit.utrNumber})`,
            paymentMethod: deposit.paymentMethod,
            referenceId: deposit.utrNumber,
            utrNumber: deposit.utrNumber,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
            status: 'completed',
          });
        }

        // Add 1st Deposit Bonus transaction if applicable
        if (bonus1st > 0) {
          transactions.unshift({
            id: `txn_reg_${Date.now()}`,
            userId: targetUser.id,
            type: 'signup_bonus',
            amount: bonus1st,
            balanceAfter: targetUser.walletBalance,
            description: `🎁 प्रथम डिपॉजिट बोनस: ₹10 वेलकम बोनस टिकट वॉलेट में जमा किया गया`,
            paymentMethod: 'Registration Bonus',
            referenceId: `REG-DEP-BONUS-${deposit.utrNumber}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
            status: 'completed',
          });
        }
      }

      saveStateToDisk();

      res.json({
        success: true,
        deposit,
        user: targetUser,
        message: 'Deposit approved and wallet balance credited successfully.',
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/deposits/reject', (req: Request, res: Response) => {
    try {
      const { depositId, reason } = req.body;
      const deposit = deposits.find((d) => d.id === depositId);
      if (!deposit) {
        return res.status(404).json({ success: false, error: 'Deposit request not found.' });
      }

      deposit.status = 'rejected';
      deposit.processedDate = new Date().toISOString();
      deposit.adminRemarks = reason || 'अमान्य / फर्जी UTR — पेमेंट प्राप्त नहीं हुआ (Fake/Invalid UTR)';

      // User ID Block Requirement: "और अगर एडमिन ने रिजेक्ट किया तो id ब्लॉक होगा"
      const targetUser = users.find((u) => u.id === deposit.userId);
      if (targetUser) {
        targetUser.isBlocked = true;
        targetUser.status = 'blocked';

        // Update transaction status
        const txn = transactions.find((t) => t.referenceId === deposit.utrNumber || t.utrNumber === deposit.utrNumber);
        if (txn) {
          txn.status = 'failed';
          txn.description = `डिपॉजिट अस्वीकृत (फर्जी UTR पाए जाने पर खाता ब्लॉक कर दिया गया)`;
        }
      }

      saveStateToDisk();

      res.json({
        success: true,
        deposit,
        user: targetUser,
        message: 'डिपॉजिट रिजेक्ट कर दिया गया है और फर्जी UTR के कारण यूजर ID को तुरंत ब्लॉक (Block) कर दिया गया है।',
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin Delete / Remove Duplicate or Unwanted Deposit Slip
  app.post('/api/deposits/delete', (req: Request, res: Response) => {
    try {
      const { depositId } = req.body;
      if (!depositId) {
        return res.status(400).json({ success: false, error: 'Deposit ID is required.' });
      }

      const beforeLen = deposits.length;
      deposits = deposits.filter((d) => d.id !== depositId);
      saveStateToDisk();

      res.json({
        success: true,
        message: 'डिपॉजिट स्लिप को एडमिन द्वारा सफलतापूर्वक रिमूव (Delete) कर दिया गया है।',
        deletedId: depositId,
        countRemoved: beforeLen - deposits.length,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete('/api/deposits/:id', (req: Request, res: Response) => {
    try {
      const depositId = req.params.id;
      const beforeLen = deposits.length;
      deposits = deposits.filter((d) => d.id !== depositId);
      saveStateToDisk();

      res.json({
        success: true,
        message: 'डिपॉजिट स्लिप को एडमिन द्वारा सफलतापूर्वक रिमूव (Delete) कर दिया गया है।',
        deletedId: depositId,
        countRemoved: beforeLen - deposits.length,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Tickets List & Sync
  app.get('/api/tickets', (req: Request, res: Response) => {
    res.json(tickets);
  });

  app.post('/api/tickets/toggle', (req: Request, res: Response) => {
    const { ticketId, isActive } = req.body;
    const tkt = tickets.find((t) => t.id === ticketId || t.ticketId === ticketId);
    if (tkt) {
      tkt.isActive = isActive;
      tkt.status = isActive ? 'active' : 'disabled';
      if (!isActive) tkt.disabledReason = 'Disabled by Admin';
      else delete tkt.disabledReason;
    }
    res.json({ success: true, ticket: tkt, totalTickets: tickets.length });
  });

  app.post('/api/tickets/batch-toggle', (req: Request, res: Response) => {
    const { ticketIds = [], isActive } = req.body;
    const idSet = new Set(ticketIds);
    let updatedCount = 0;
    tickets.forEach((t) => {
      if (idSet.has(t.id) || idSet.has(t.ticketId)) {
        t.isActive = isActive;
        t.status = isActive ? 'active' : 'disabled';
        if (!isActive) t.disabledReason = 'Disabled by Admin';
        else delete t.disabledReason;
        updatedCount++;
      }
    });
    res.json({ success: true, updatedCount, totalTickets: tickets.length });
  });

  // 2. Games API
  app.get('/api/games', (req: Request, res: Response) => {
    res.json(games);
  });

  app.get('/api/games/:id', (req: Request, res: Response) => {
    const game = games.find((g) => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  });

  app.post('/api/games', (req: Request, res: Response) => {
    const { title, ticketPrice, maxPlayers, startTime, date, prizes, rules } = req.body;
    const newGame: TambolaGame = {
      id: `game_${Date.now()}`,
      title: title || 'New Tambola Match',
      gameCode: `TB-${Math.floor(100 + Math.random() * 900)}`,
      date: date || new Date().toISOString().split('T')[0],
      startTime: startTime || '20:00',
      ticketPrice: Number(ticketPrice) || 50,
      maxPlayers: Number(maxPlayers) || 200,
      registeredPlayers: 0,
      totalTicketsSold: 0,
      prizePool: prizes ? prizes.reduce((acc: number, p: { amount: number }) => acc + (p.amount || 0), 0) : 5000,
      status: 'upcoming',
      calledNumbers: [],
      currentNumber: null,
      previousNumbers: [],
      autoCalling: false,
      callIntervalSeconds: 6,
      prizes: prizes || [
        { id: `prz_${Date.now()}_1`, code: 'early5', name: 'Early Five', amount: 500, maxWinners: 1, claimedWinners: [], description: 'First 5 numbers' },
        { id: `prz_${Date.now()}_2`, code: 'top_line', name: 'Top Line', amount: 1000, maxWinners: 1, claimedWinners: [], description: 'Top row complete' },
        { id: `prz_${Date.now()}_3`, code: 'mid_line', name: 'Middle Line', amount: 1000, maxWinners: 1, claimedWinners: [], description: 'Middle row complete' },
        { id: `prz_${Date.now()}_4`, code: 'bot_line', name: 'Bottom Line', amount: 1000, maxWinners: 1, claimedWinners: [], description: 'Bottom row complete' },
        { id: `prz_${Date.now()}_5`, code: 'full_house', name: 'Full House', amount: 3500, maxWinners: 1, claimedWinners: [], description: 'All 15 numbers' },
      ],
      rules: rules || 'Standard 90-ball Tambola rules apply.',
      createdAt: new Date().toISOString(),
    };
    games.unshift(newGame);
    res.json(newGame);
  });

  // Admin Game Status & Control API
  app.post('/api/games/:id/status', (req: Request, res: Response) => {
    const { status } = req.body;
    const game = games.find((g) => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    game.status = status;
    if (status === 'live' && game.calledNumbers.length === 0) {
      game.autoCalling = true;
      // Trigger Game Start Live Alert Email to registered players / demo user
      const recipient = users[0];
      sendBrevoEmail('game_start', recipient.email || 'player@example.com', recipient.name, {
        gameTitle: game.title,
        gameCode: game.gameCode,
        prizePool: game.prizePool.toLocaleString('en-IN'),
        startTime: `${game.date} at ${game.startTime}`,
      }).catch((e) => console.warn('[Brevo Error]', e));
    }
    res.json(game);
  });

  // Admin Call Next Number (Manual)
  app.post('/api/games/:id/call-next', (req: Request, res: Response) => {
    const { number } = req.body; // optional force number
    const game = games.find((g) => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    let nextNum: number;
    if (number && typeof number === 'number' && number >= 1 && number <= 90) {
      if (game.calledNumbers.includes(number)) {
        return res.status(400).json({ error: `Number ${number} has already been called.` });
      }
      nextNum = number;
    } else {
      const uncalled = [];
      for (let i = 1; i <= 90; i++) {
        if (!game.calledNumbers.includes(i)) uncalled.push(i);
      }
      if (uncalled.length === 0) {
        game.status = 'completed';
        return res.status(400).json({ error: 'All 90 numbers have already been called.' });
      }
      nextNum = uncalled[Math.floor(Math.random() * uncalled.length)];
    }

    game.calledNumbers.push(nextNum);
    game.currentNumber = nextNum;
    game.previousNumbers = game.calledNumbers.slice(-6, -1).reverse();
    res.json({ game, calledNumber: nextNum });
  });

  // Toggle Auto-Calling
  app.post('/api/games/:id/toggle-auto', (req: Request, res: Response) => {
    const game = games.find((g) => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    game.autoCalling = !game.autoCalling;
    res.json(game);
  });

  // Reset Game Numbers
  app.post('/api/games/:id/reset', (req: Request, res: Response) => {
    const game = games.find((g) => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    game.calledNumbers = [];
    game.currentNumber = null;
    game.previousNumbers = [];
    game.status = 'live';
    game.prizes.forEach((p) => {
      p.claimedWinners = [];
    });
    res.json(game);
  });

  // 3. Ticket Purchase Engine & 5-Level Commission Engine
  app.post('/api/tickets/buy', (req: Request, res: Response) => {
    const { gameId, quantity = 1, userId } = req.body;
    const game = games.find((g) => g.id === gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const buyer = users.find((u) => u.id === (userId || users[0].id)) || users[0];
    const totalCost = game.ticketPrice * quantity;

    // Check balance
    if (buyer.walletBalance < totalCost) {
      return res.status(400).json({ error: `Insufficient balance (₹${buyer.walletBalance}). Required: ₹${totalCost}. Please add funds to wallet.` });
    }

    // Deduct from buyer wallet
    buyer.walletBalance -= totalCost;
    if (buyer.depositBalance >= totalCost) {
      buyer.depositBalance -= totalCost;
    } else {
      const remaining = totalCost - buyer.depositBalance;
      buyer.depositBalance = 0;
      buyer.winningBalance = Math.max(0, buyer.winningBalance - remaining);
    }

    // Generate Tickets
    const newTickets: TambolaTicket[] = [];
    for (let i = 0; i < quantity; i++) {
      const matrix = generateTambolaTicketMatrix();
      const ticketId = generateTicketId();
      const ticket: TambolaTicket = {
        id: `tkt_${Date.now()}_${i}`,
        gameId: game.id,
        gameTitle: game.title,
        userId: buyer.id,
        userName: buyer.name,
        ticketNumber: game.totalTicketsSold + i + 1,
        ticketId,
        numbers: matrix,
        markedNumbers: [],
        price: game.ticketPrice,
        purchaseDate: new Date().toISOString(),
        qrCodeData: `TAMBOLA-LIVE|${ticketId}|${game.gameCode}|${buyer.name}`,
      };
      newTickets.push(ticket);
      tickets.unshift(ticket);
    }

    game.totalTicketsSold += quantity;
    game.registeredPlayers = Math.min(game.maxPlayers, game.registeredPlayers + 1);

    // Record Wallet Transaction
    const txn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: buyer.id,
      type: 'ticket_purchase',
      amount: -totalCost,
      status: 'completed',
      description: `Purchased ${quantity} Ticket(s) for ${game.title}`,
      referenceId: game.gameCode,
      timestamp: new Date().toISOString(),
      balanceAfter: buyer.walletBalance,
    };
    transactions.unshift(txn);

    // 8-LEVEL REFERRAL COMMISSION ENGINE (Server-Side Calculation)
    if (siteSettings.referralSystemEnabled) {
      const levelPercentages = siteSettings.levelPercentages || [2.0, 1.0, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1];
      
      const findUplineParent = (childUser: User): User | null => {
        if (!childUser) return null;
        if (childUser.referredByUserId) {
          const directUser = users.find((u) => u.id === childUser.referredByUserId);
          if (directUser) return directUser;
        }
        if (childUser.referredBy) {
          const clean = childUser.referredBy.trim().toUpperCase();
          const cleanDigits = clean.replace(/\D/g, '');
          return users.find((u) => {
            if (u.id === childUser.id) return false;
            const uCode = (u.referralCode || '').trim().toUpperCase();
            const uId = (u.id || '').trim().toUpperCase();
            const uPhone = (u.phone || '').replace(/\D/g, '');
            if (uCode && (uCode === clean || clean.includes(uCode) || uCode.includes(clean))) return true;
            if (uId && (uId === clean || clean.includes(uId) || uId.includes(clean))) return true;
            if (cleanDigits.length >= 6 && uPhone && (uPhone === cleanDigits || uPhone.endsWith(cleanDigits) || cleanDigits.endsWith(uPhone))) return true;
            return false;
          }) || null;
        }
        return null;
      };

      let currentChild: User = buyer;
      for (let idx = 0; idx < levelPercentages.length; idx++) {
        const pct = levelPercentages[idx];
        const levelNum = idx + 1;
        const uplineParent = findUplineParent(currentChild);
        if (!uplineParent) break;

        const commAmount = Number(((totalCost * pct) / 100).toFixed(2));
        if (commAmount > 0) {
          uplineParent.walletBalance = Number(((uplineParent.walletBalance || 0) + commAmount).toFixed(2));
          uplineParent.referralBalance = Number(((uplineParent.referralBalance || 0) + commAmount).toFixed(2));

          const commRecord: ReferralCommission = {
            id: `comm_${Date.now()}_L${levelNum}_${Math.floor(100 + Math.random() * 900)}`,
            userId: uplineParent.id,
            userName: uplineParent.name,
            sourceUserId: buyer.id,
            sourceUserName: buyer.name,
            gameId: game.id,
            gameTitle: game.title,
            ticketId: newTickets[0]?.ticketId || 'TKT-BATCH',
            level: levelNum,
            percentage: pct,
            baseAmount: totalCost,
            commissionAmount: commAmount,
            transactionId: `TXN-REF-${Date.now()}-${levelNum}`,
            timestamp: new Date().toISOString(),
            status: 'approved',
          };
          commissions.unshift(commRecord);

          // Send Referral Commission Earned Email on Level 1
          if (levelNum === 1) {
            sendBrevoEmail('referral_commission', uplineParent.email || 'affiliate@example.com', uplineParent.name, {
              commissionAmount: commAmount.toFixed(2),
              level: 1,
              percentage: `${pct}%`,
              sourceUserName: buyer.name,
              gameTitle: game.title,
              newReferralBalance: uplineParent.referralBalance,
              date: new Date().toLocaleString(),
            }).catch((e) => console.warn('[Brevo Error]', e));
          }
        }

        currentChild = uplineParent;
      }
    }

    // Send Brevo Ticket Purchase Confirmation Transactional Email
    sendBrevoEmail('ticket_purchase', buyer.email || 'player@example.com', buyer.name, {
      gameTitle: game.title,
      gameCode: game.gameCode,
      ticketId: newTickets[0]?.ticketId || 'TKT-BATCH',
      ticketCount: quantity,
      totalPaid: totalCost,
      gameTime: `${game.date} at ${game.startTime}`,
      prizePool: game.prizePool.toLocaleString('en-IN'),
    }).catch((e) => console.warn('[Brevo Error]', e));

    res.json({
      success: true,
      message: `Successfully bought ${quantity} ticket(s)!`,
      tickets: newTickets,
      newBalance: buyer.walletBalance,
    });
  });

  // 4. Claim Prize Verification Engine
  app.post('/api/games/:id/claim', (req: Request, res: Response) => {
    const { ticketId, prizeCode, userId } = req.body;
    const game = games.find((g) => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const ticket = tickets.find((t) => t.id === ticketId || t.ticketId === ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    const prize = game.prizes.find((p) => p.code === prizeCode || p.id === prizeCode);
    if (!prize) return res.status(404).json({ error: 'Prize category not found.' });

    // Check if prize has already reached max winners
    if (prize.claimedWinners.length >= prize.maxWinners) {
      return res.status(400).json({ error: `Prize "${prize.name}" has already been claimed.` });
    }

    // Check if this ticket already claimed this prize
    const alreadyClaimed = prize.claimedWinners.some((w) => w.ticketId === ticket.ticketId);
    if (alreadyClaimed) {
      return res.status(400).json({ error: 'This ticket has already claimed this prize!' });
    }

    // Run Server-side Mathematical Verification
    const validation = verifyClaim(prize.code, ticket.numbers, game.calledNumbers, game.currentNumber);
    if (!validation.valid) {
      return res.status(400).json({
        error: `Claim Invalid: ${validation.reason}`,
        valid: false,
      });
    }

    // Claim is VALID! Award Prize
    const user = users.find((u) => u.id === (userId || ticket.userId)) || users[0];
    const claimRecord = {
      userId: user.id,
      userName: user.name,
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      winningNumber: game.currentNumber || game.calledNumbers[game.calledNumbers.length - 1] || 0,
      claimedAt: new Date().toLocaleTimeString(),
    };

    prize.claimedWinners.push(claimRecord);

    // Credit Winnings to User Wallet
    user.walletBalance += prize.amount;
    user.winningBalance += prize.amount;

    // Create Winner Record
    const winnerRecord: GameWinner = {
      id: `win_${Date.now()}`,
      gameId: game.id,
      gameTitle: game.title,
      prizeId: prize.id,
      prizeCode: prize.code,
      prizeName: prize.name,
      prizeAmount: prize.amount,
      userId: user.id,
      userName: user.name,
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      winningNumber: claimRecord.winningNumber,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    winners.unshift(winnerRecord);

    // Record Transaction
    const txn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: user.id,
      type: 'prize_won',
      amount: prize.amount,
      status: 'completed',
      description: `Prize Won: ${prize.name} in ${game.title}`,
      referenceId: game.gameCode,
      timestamp: new Date().toISOString(),
      balanceAfter: user.walletBalance,
    };
    transactions.unshift(txn);

    // Send Brevo Winner Transactional Email
    sendBrevoEmail('winning', user.email || 'winner@example.com', user.name, {
      prizeName: prize.name,
      winningAmount: prize.amount.toLocaleString('en-IN'),
      gameTitle: game.title,
      ticketId: ticket.ticketId,
      winningNumber: claimRecord.winningNumber,
      walletBalance: user.winningBalance.toLocaleString('en-IN'),
    }).catch((e) => console.warn('[Brevo Error]', e));

    res.json({
      success: true,
      message: `🎉 BINGO! Congratulations! You won ${prize.name} (₹${prize.amount})!`,
      prizeName: prize.name,
      prizeAmount: prize.amount,
      winnerRecord,
      newWalletBalance: user.walletBalance,
      newWinningBalance: user.winningBalance,
    });
  });

  // 5. Wallet & Payment Simulation APIs
  app.post('/api/wallet/deposit', (req: Request, res: Response) => {
    const { amount, paymentMethod, userId } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 10) {
      return res.status(400).json({ error: 'Minimum deposit amount is ₹10.' });
    }

    const user = users.find((u) => u.id === (userId || users[0].id)) || users[0];
    user.walletBalance += numAmount;
    user.depositBalance += numAmount;

    const txn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      amount: numAmount,
      status: 'completed',
      description: `Wallet Top-Up via ${paymentMethod || 'Instant UPI'}`,
      paymentMethod: paymentMethod || 'UPI',
      referenceId: `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      balanceAfter: user.walletBalance,
    };
    transactions.unshift(txn);

    // Send Brevo Wallet Deposit Transaction Email
    sendBrevoEmail('wallet_transaction', user.email || 'user@example.com', user.name, {
      txnType: 'Wallet Deposit Recharge',
      amount: numAmount.toLocaleString('en-IN'),
      referenceId: txn.referenceId,
      paymentMethod: paymentMethod || 'Instant UPI',
      balanceAfter: user.walletBalance.toLocaleString('en-IN'),
      date: new Date().toLocaleString(),
    }).catch((e) => console.warn('[Brevo Error]', e));

    res.json({
      success: true,
      message: `₹${numAmount} successfully added to your wallet!`,
      walletBalance: user.walletBalance,
      depositBalance: user.depositBalance,
    });
  });

  app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
    const { amount, paymentMethod, upiId, bankName, accountNumber, ifsc, accountHolder, userId } = req.body;
    const numAmount = Number(amount);
    const user = users.find((u) => u.id === (userId || users[0].id)) || users[0];

    if (!numAmount || numAmount < siteSettings.minWithdrawal) {
      return res.status(400).json({ error: `Minimum withdrawal amount is ₹${siteSettings.minWithdrawal}.` });
    }

    if (numAmount > user.winningBalance) {
      return res.status(400).json({ error: `Insufficient winning balance. You have ₹${user.winningBalance} available for withdrawal.` });
    }

    user.walletBalance -= numAmount;
    user.winningBalance -= numAmount;

    const wdr: WithdrawalRequest = {
      id: `wdr_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      amount: numAmount,
      paymentMethod: paymentMethod || 'upi',
      upiId,
      bankName,
      accountNumber,
      ifsc,
      accountHolder: accountHolder || user.name,
      status: 'pending',
      requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      note: 'User withdrawal request',
    };
    withdrawals.unshift(wdr);

    const txn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: user.id,
      type: 'withdrawal',
      amount: -numAmount,
      status: 'pending',
      description: `Withdrawal Request to ${paymentMethod === 'upi' ? upiId : bankName}`,
      paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'Bank IMPS',
      referenceId: wdr.id,
      timestamp: new Date().toISOString(),
      balanceAfter: user.walletBalance,
    };
    transactions.unshift(txn);

    // Send Brevo Withdrawal Request Confirmation Email
    sendBrevoEmail('withdrawal_request', user.email || user.email || 'user@example.com', user.name, {
      amount: numAmount.toLocaleString('en-IN'),
      paymentMethod: paymentMethod === 'upi' ? `Instant UPI (${upiId})` : `Bank IMPS (${bankName})`,
      upiIdOrBank: upiId || `${bankName} - A/C: ${accountNumber}`,
      referenceId: wdr.id,
      requestDate: wdr.requestDate,
    }).catch((e) => console.warn('[Brevo Error]', e));

    res.json({
      success: true,
      message: `Withdrawal request for ₹${numAmount} submitted successfully! Processing time: 5-15 minutes.`,
      withdrawal: wdr,
      walletBalance: user.walletBalance,
      winningBalance: user.winningBalance,
    });
  });

  // Admin Approve / Reject Withdrawal
  app.post('/api/admin/withdrawals/:id/action', (req: Request, res: Response) => {
    const { action, remarks } = req.body;
    const wdr = withdrawals.find((w) => w.id === req.params.id);
    if (!wdr) return res.status(404).json({ error: 'Withdrawal not found' });

    if (action === 'approve') {
      wdr.status = 'approved';
      wdr.processedDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
      wdr.adminRemarks = remarks || 'Approved and credited via automated IMPS';
      
      const txn = transactions.find((t) => t.referenceId === wdr.id);
      if (txn) txn.status = 'completed';
    } else if (action === 'reject') {
      wdr.status = 'rejected';
      wdr.processedDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
      wdr.adminRemarks = remarks || 'Rejected by Admin. Amount refunded to wallet.';

      const user = users.find((u) => u.id === wdr.userId);
      if (user) {
        user.walletBalance += wdr.amount;
        user.winningBalance += wdr.amount;
      }
      const txn = transactions.find((t) => t.referenceId === wdr.id);
      if (txn) txn.status = 'failed';
    }

    // Send Brevo Withdrawal Status Email (Approved or Rejected)
    sendBrevoEmail('withdrawal_status', wdr.userEmail || 'user@example.com', wdr.userName, {
      amount: wdr.amount.toLocaleString('en-IN'),
      status: action === 'approve' ? 'Approved' : 'Rejected',
      utrNumber: wdr.adminRemarks?.includes('UTR') ? wdr.adminRemarks : `IMPS-${Date.now()}`,
      remarks: wdr.adminRemarks,
      referenceId: wdr.id,
      processedDate: wdr.processedDate,
    }).catch((e) => console.warn('[Brevo Error]', e));

    res.json(wdr);
  });

  // 6. Admin Settings & Referral Settings
  app.post('/api/admin/settings', (req: Request, res: Response) => {
    siteSettings = { ...siteSettings, ...req.body };
    res.json(siteSettings);
  });

  // 7. Support Ticket Submission
  app.post('/api/support', (req: Request, res: Response) => {
    const { subject, category, message, priority, userId } = req.body;
    const user = users.find((u) => u.id === (userId || users[0].id)) || users[0];

    const newTicket: SupportTicket = {
      id: `sup_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      subject: subject || 'General Query',
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'user',
          senderName: user.name,
          text: message || '',
          time: new Date().toLocaleTimeString().slice(0, 5),
        },
      ],
    };
    supportTickets.unshift(newTicket);
    res.json(newTicket);
  });

  // Support Reply
  app.post('/api/support/:id/reply', (req: Request, res: Response) => {
    const { text, sender = 'user' } = req.body;
    const t = supportTickets.find((s) => s.id === req.params.id);
    if (!t) return res.status(404).json({ error: 'Support ticket not found' });

    t.messages.push({
      id: `msg_${Date.now()}`,
      sender: sender as 'user' | 'admin',
      senderName: sender === 'admin' ? 'Tambola Live Support' : t.userName,
      text,
      time: new Date().toLocaleTimeString().slice(0, 5),
    });
    if (sender === 'admin') t.status = 'in_progress';
    res.json(t);
  });

  // User Profile Update
  app.post('/api/user/profile', (req: Request, res: Response) => {
    const user = users[0];
    Object.assign(user, req.body);
    res.json(user);
  });

  // ==========================================
  // 8. 📧 BREVO TRANSACTIONAL EMAIL API ROUTES
  // ==========================================

  // Get Brevo Email Settings (API Key masked for security)
  app.get('/api/email/settings', (req: Request, res: Response) => {
    res.json(getMaskedSettings());
  });

  // Update Brevo Email Settings
  app.post('/api/email/settings', (req: Request, res: Response) => {
    const updates = req.body;
    if (updates.apiKey !== undefined && updates.apiKey.trim().length > 0 && !updates.apiKey.includes('***')) {
      brevoSettings.apiKey = updates.apiKey.trim();
      brevoSettings.isConfigured = true;
    }
    if (updates.senderName) brevoSettings.senderName = updates.senderName.trim();
    if (updates.senderEmail) brevoSettings.senderEmail = updates.senderEmail.trim();
    if (updates.smtpHost) brevoSettings.smtpHost = updates.smtpHost.trim();
    if (updates.smtpPort) brevoSettings.smtpPort = Number(updates.smtpPort);
    if (updates.smtpUser !== undefined) brevoSettings.smtpUser = updates.smtpUser.trim();
    if (updates.smtpPass !== undefined) brevoSettings.smtpPass = updates.smtpPass.trim();
    if (updates.eventToggles) {
      brevoSettings.eventToggles = { ...brevoSettings.eventToggles, ...updates.eventToggles };
    }
    if (updates.customSubjects) {
      brevoSettings.customSubjects = { ...brevoSettings.customSubjects, ...updates.customSubjects };
    }
    if (updates.footerText !== undefined) brevoSettings.footerText = updates.footerText;
    if (updates.supportPhone !== undefined) brevoSettings.supportPhone = updates.supportPhone;

    res.json(getMaskedSettings());
  });

  // General Send Transactional Email Endpoint
  app.post('/api/email/send', async (req: Request, res: Response) => {
    const { eventType, recipientEmail, recipientName, data } = req.body;
    if (!eventType || !recipientEmail) {
      return res.status(400).json({ error: 'Missing required fields: eventType and recipientEmail' });
    }

    const result = await sendBrevoEmail(
      eventType as EmailEventType,
      recipientEmail,
      recipientName || 'Valued Player',
      data || {},
      false
    );

    if (!result.success && !result.log) {
      return res.status(400).json({ error: result.error || 'Failed to dispatch email' });
    }

    res.json(result);
  });

  // Test Email Endpoint (forced send)
  app.post('/api/email/test', async (req: Request, res: Response) => {
    const { eventType, recipientEmail, data } = req.body;
    if (!eventType || !recipientEmail) {
      return res.status(400).json({ error: 'Missing eventType or recipientEmail' });
    }

    const result = await sendBrevoEmail(
      eventType as EmailEventType,
      recipientEmail,
      'Test Recipient',
      data || {},
      true // force send even if toggle is off
    );

    res.json(result);
  });

  // Get Email Logs (Sent & Failed)
  app.get('/api/email/logs', (req: Request, res: Response) => {
    res.json(emailLogs);
  });

  // Retry Failed Email
  app.post('/api/email/retry/:id', async (req: Request, res: Response) => {
    const log = emailLogs.find((l) => l.id === req.params.id);
    if (!log) return res.status(404).json({ error: 'Email log entry not found' });

    const result = await sendBrevoEmail(
      log.eventType,
      log.recipientEmail,
      log.recipientName,
      log.payloadData || {},
      true
    );

    res.json(result);
  });

  // Clear Email Logs
  app.delete('/api/email/logs', (req: Request, res: Response) => {
    emailLogs.length = 0;
    res.json({ success: true, message: 'All email logs cleared.' });
  });

  // Vite middleware for dev or static files for prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tambola Live Server running on port ${PORT}`);
  });
}

startServer();
