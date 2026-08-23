import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  DEFAULT_USER,
  ADMIN_USER,
  INITIAL_GAMES,
  INITIAL_USER_TICKETS,
  INITIAL_WINNERS,
  INITIAL_REFERRAL_MEMBERS,
  INITIAL_COMMISSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_WITHDRAWALS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_SITE_SETTINGS,
} from './src/data/mockData';
import {
  generateTambolaTicketMatrix,
  generateTicketId,
  verifyClaim,
} from './src/utils/tambolaTicket';
import {
  User,
  TambolaGame,
  TambolaTicket,
  GameWinner,
  ReferralCommission,
  ReferralMember,
  WalletTransaction,
  WithdrawalRequest,
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

// In-Memory Durable Server State
let users: User[] = [DEFAULT_USER, ADMIN_USER];
let games: TambolaGame[] = [...INITIAL_GAMES];
let tickets: TambolaTicket[] = [...INITIAL_USER_TICKETS];
let winners: GameWinner[] = [...INITIAL_WINNERS];
let referralMembers: ReferralMember[] = [...INITIAL_REFERRAL_MEMBERS];
let commissions: ReferralCommission[] = [...INITIAL_COMMISSIONS];
let transactions: WalletTransaction[] = [...INITIAL_TRANSACTIONS];
let withdrawals: WithdrawalRequest[] = [...INITIAL_WITHDRAWALS];
let supportTickets: SupportTicket[] = [...INITIAL_SUPPORT_TICKETS];
let siteSettings: SiteSettings = { ...INITIAL_SITE_SETTINGS };

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

  // 1b. Users API - Cross-device sync, Registration & Referral linking
  app.get('/api/users', (req: Request, res: Response) => {
    res.json(users);
  });

  app.post('/api/users/register', (req: Request, res: Response) => {
    try {
      const { name, phone, email, password, referralCodeInput, selectedAvatar } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ success: false, error: 'Name and phone are required.' });
      }

      const phoneDigits = String(phone).replace(/\D/g, '');
      const existingUser = users.find((u) => u.phone && u.phone.replace(/\D/g, '').endsWith(phoneDigits));
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: `Mobile number ${phone} is already registered (${existingUser.name}).`,
          existingUser,
        });
      }

      // Resolve referrer
      const cleanRef = referralCodeInput ? String(referralCodeInput).trim().toUpperCase() : '';
      let referrer: User | null = null;

      if (cleanRef) {
        referrer =
          users.find((u) => {
            const uCode = (u.referralCode || '').trim().toUpperCase();
            const uId = (u.id || '').trim().toUpperCase();
            const uPhone = (u.phone || '').replace(/\D/g, '');
            const uName = (u.name || '').trim().toUpperCase();
            const cleanDigits = cleanRef.replace(/\D/g, '');

            if (uCode && (uCode === cleanRef || cleanRef.includes(uCode) || uCode.includes(cleanRef))) return true;
            if (uId && (uId === cleanRef || cleanRef.includes(uId) || uId.includes(cleanRef))) return true;
            if (cleanDigits.length >= 6 && uPhone && (uPhone === cleanDigits || uPhone.endsWith(cleanDigits) || cleanDigits.endsWith(uPhone))) return true;
            if (uName && cleanRef === uName) return true;
            return false;
          }) || null;
      }

      const resolvedReferralCode = `REF-${name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PLY'}${Math.floor(100 + Math.random() * 900)}`;
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        name: String(name).trim(),
        email: email ? String(email).trim() : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${phoneDigits.slice(-4)}@tambolalive.com`,
        phone: `+91 ${phoneDigits}`,
        password: password || '123456',
        role: 'user',
        status: 'active',
        isBlocked: false,
        walletBalance: 10,
        depositBalance: 0,
        winningBalance: 10,
        referralBalance: 0,
        bonusRewardBalance: 0,
        referralCode: resolvedReferralCode,
        referredBy: referrer ? (referrer.referralCode || referrer.id || cleanRef) : cleanRef,
        referredByUserId: referrer ? referrer.id : '',
        kycStatus: 'verified',
        avatar: selectedAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        createdAt: new Date().toISOString(),
        bankDetails: {
          accountName: String(name).trim(),
          accountNumber: 'XXXXXX' + Math.floor(1000 + Math.random() * 9000),
          ifsc: 'SBIN0001234',
          bankName: 'State Bank of India',
          upiId: `${phoneDigits}@upi`,
        },
      };

      users.unshift(newUser);

      // Award referrer bonus & commission record
      let joinComm: ReferralCommission | null = null;
      if (referrer) {
        referrer.walletBalance = (referrer.walletBalance || 0) + 10;
        referrer.referralBalance = (referrer.referralBalance || 0) + 10;

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
          timestamp: new Date().toISOString(),
          status: 'approved',
        };
        commissions.unshift(joinComm);
      }

      res.json({
        success: true,
        user: newUser,
        referrer,
        commission: joinComm,
        message: 'User registered successfully!',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/users/sync', (req: Request, res: Response) => {
    const incomingUsers: User[] = req.body.users || [];
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    incomingUsers.forEach((u) => {
      if (u && u.id) {
        map.set(u.id, { ...(map.get(u.id) || {}), ...u });
      }
    });
    users = Array.from(map.values());
    res.json({ success: true, totalUsers: users.length, users });
  });

  app.get('/api/commissions', (req: Request, res: Response) => {
    res.json(commissions);
  });

  app.post('/api/commissions', (req: Request, res: Response) => {
    const comm = req.body;
    if (comm && comm.id) {
      const idx = commissions.findIndex((c) => c.id === comm.id);
      if (idx >= 0) commissions[idx] = comm;
      else commissions.unshift(comm);
    }
    res.json({ success: true, commissions });
  });

  // Comprehensive Real-Time Sync endpoint for cross-device sync
  app.get('/api/sync/all', (req: Request, res: Response) => {
    res.json({
      users,
      commissions,
      games,
      winners,
      transactions,
      withdrawals,
      supportTickets,
      siteSettings,
      serverTime: new Date().toISOString(),
    });
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

    // 5-LEVEL REFERRAL COMMISSION ENGINE (Server-Side Calculation)
    if (siteSettings.referralSystemEnabled) {
      const levelPercentages = siteSettings.levelPercentages || [4.0, 2.0, 1.0, 0.5, 0.3];
      
      // Calculate 5-level upstream commissions
      // In production, we traverse the user referral tree. Here we credit the user's upline network
      levelPercentages.forEach((pct, idx) => {
        const levelNum = idx + 1;
        const commAmount = (totalCost * pct) / 100;
        
        // Find or assign upline member for Ashish/Buyer
        const commRecord: ReferralCommission = {
          id: `comm_${Date.now()}_L${levelNum}`,
          userId: buyer.id, // In demo, shows up on user's referral earnings dashboard
          userName: buyer.name,
          sourceUserId: `u_downline_${levelNum}`,
          sourceUserName: `Team Member (L${levelNum})`,
          gameId: game.id,
          gameTitle: game.title,
          ticketId: newTickets[0]?.ticketId || 'TKT-BATCH',
          level: levelNum,
          percentage: pct,
          baseAmount: totalCost,
          commissionAmount: Number(commAmount.toFixed(2)),
          transactionId: `TXN-REF-${Date.now()}-${levelNum}`,
          timestamp: new Date().toISOString(),
          status: 'approved',
        };
        commissions.unshift(commRecord);

        // Send Referral Commission Earned Email on Level 1
        if (idx === 0) {
          sendBrevoEmail('referral_commission', buyer.email || 'affiliate@example.com', buyer.name, {
            commissionAmount: commAmount.toFixed(2),
            level: 1,
            percentage: `${pct}%`,
            sourceUserName: buyer.name,
            gameTitle: game.title,
            newReferralBalance: buyer.referralBalance || 1840,
            date: new Date().toLocaleString(),
          }).catch((e) => console.warn('[Brevo Error]', e));
        }
      });
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
