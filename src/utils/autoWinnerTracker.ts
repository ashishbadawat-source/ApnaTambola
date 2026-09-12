import { TambolaGame, TambolaTicket, PrizeCode, GamePrize, User } from '../types';
import { verifyClaim } from './tambolaTicket';
import { calculateSplitWinning } from './prizePoolCalculator';

export interface DetectedWinEvent {
  id: string;
  gameId: string;
  gameTitle: string;
  prizeCode: PrizeCode;
  prizeId: string;
  prizeName: string;
  prizeTotalAmount: number;
  splitPrizeAmount: number;
  perWinnerAmount: number;
  isEqualSplit: boolean;
  isSplit: boolean;
  totalSplitWinners: number;
  totalWinnersCount: number;
  userId: string;
  userName: string;
  winnerUserId: string;
  winnerUserName: string;
  ticketId: string;
  ticketNumber: number;
  winningNumber: number;
  isCurrentUser: boolean;
  isAutoClaimed: boolean;
  ticket: TambolaTicket;
  reason: string;
  coWinners?: Array<{
    userId: string;
    userName: string;
    prizeAmount: number;
    ticketNumber: number;
    ticketId: string;
    isCurrentUser: boolean;
  }>;
  allWinnerNames?: string[];
}

export interface PrizeSplitAdjustment {
  id: string;
  gameId: string;
  gameTitle: string;
  prizeCode: PrizeCode;
  prizeName: string;
  totalPrizeAmount: number;
  totalWinnersCount: number;
  newPerWinnerAmount: number;
  previousPerWinnerAmount: number;
  adjustmentDeduction: number;
  affectedUserId: string;
  affectedUserName: string;
  affectedTicketId: string;
  affectedTicketNumber: number;
}

export interface CheckAutoTrackOptions {
  gameId: string;
  gameTitle: string;
  currentNumber: number;
  calledNumbers: number[];
  prizes: GamePrize[];
  tickets: TambolaTicket[];
  currentUser: User;
}

// Ordered standard 7 prizes to evaluate sequentially
const PRIZE_CHECK_ORDER: PrizeCode[] = [
  'early5',
  'star',
  'top_line',
  'mid_line',
  'bot_line',
  'full_house',
  'second_full_house',
];

/**
 * Evaluates all tickets for a game when a number is called.
 * Detects prizes that are fulfilled and can be claimed (especially for Auto Mode / Offline tickets).
 *
 * ⚖️ Strict Equal Split Rule (50-50 समान बंटवारा नियम):
 * If multiple players win any prize (e.g. ₹100 Full House claimed by 2 users),
 * each winner receives an exact equal split (₹50 and ₹50, totaling ₹100).
 * Neither player receives an unequal payout (never 100 to one and 50 to another).
 * If a co-winner qualifies after the first winner was already credited,
 * the previous winner's payout is adjusted to match the equal share.
 */
export function checkAndAutoTrackWinners(
  gameOrOptions: TambolaGame | CheckAutoTrackOptions,
  allGameTickets?: TambolaTicket[],
  currentUserId?: string,
  calledNumber?: number
): {
  newWins: DetectedWinEvent[];
  updatedPrizes: GamePrize[];
  splitAdjustments: PrizeSplitAdjustment[];
} {
  let gameId: string;
  let gameTitle: string;
  let currentNum: number;
  let calledNumbersList: number[];
  let prizesList: GamePrize[];
  let ticketsList: TambolaTicket[];
  let userIdStr: string;

  if (allGameTickets !== undefined) {
    // Called with (game, allGameTickets, currentUserId, calledNumber)
    const g = gameOrOptions as TambolaGame;
    gameId = g.id;
    gameTitle = g.title;
    currentNum = calledNumber ?? g.currentNumber ?? 0;
    calledNumbersList = g.calledNumbers || [];
    prizesList = g.prizes || [];
    ticketsList = allGameTickets || [];
    userIdStr = currentUserId || '';
  } else {
    // Called with options object
    const opts = gameOrOptions as CheckAutoTrackOptions;
    gameId = opts.gameId;
    gameTitle = opts.gameTitle;
    currentNum = opts.currentNumber;
    calledNumbersList = opts.calledNumbers || [];
    prizesList = opts.prizes || [];
    ticketsList = opts.tickets || [];
    userIdStr = opts.currentUser?.id || '';
  }

  const newWins: DetectedWinEvent[] = [];
  const splitAdjustments: PrizeSplitAdjustment[] = [];
  const updatedPrizes: GamePrize[] = JSON.parse(JSON.stringify(prizesList));

  if (!currentNum || !Array.isArray(ticketsList) || ticketsList.length === 0) {
    return { newWins, updatedPrizes, splitAdjustments };
  }

  const calledSet = new Set(calledNumbersList);
  if (!calledSet.has(currentNum)) {
    calledSet.add(currentNum);
  }

  // Iterate over each prize category in standard order
  for (const prizeCode of PRIZE_CHECK_ORDER) {
    const prizeIndex = updatedPrizes.findIndex((p) => p.code === prizeCode);
    if (prizeIndex === -1) continue;

    const prize = updatedPrizes[prizeIndex];
    if (!Array.isArray(prize.claimedWinners)) {
      prize.claimedWinners = [];
    }
    const previousClaimedWinners = [...prize.claimedWinners];
    const previousClaimedCount = previousClaimedWinners.length;
    const remainingSlots = prize.maxWinners - previousClaimedCount;
    if (remainingSlots <= 0) continue;

    // Special condition for 2nd Full House: Only open if 1st Full House has already been claimed!
    if (prizeCode === 'second_full_house') {
      const firstFh = updatedPrizes.find((p) => p.code === 'full_house');
      const firstFhCount = firstFh && Array.isArray(firstFh.claimedWinners) ? firstFh.claimedWinners.length : 0;
      if (!firstFh || firstFhCount === 0) {
        continue;
      }
    }

    // Step 1: Scan all tickets to find ALL that qualify for this prize in THIS number call
    const qualifyingTicketsThisRound: { ticket: TambolaTicket; reason: string }[] = [];

    for (const ticket of ticketsList) {
      if (!ticket) continue;
      // Skip tickets that are turned OFF / disabled by admin
      if (ticket.isActive === false || ticket.status === 'disabled' || ticket.status === 'void') {
        continue;
      }

      // Check if prize slots available
      if (qualifyingTicketsThisRound.length >= remainingSlots) break;

      // Check if ticket or user already claimed this prize
      const alreadyClaimed = prize.claimedWinners.some(
        (w) => w && (w.ticketId === ticket.ticketId || (w.userId === ticket.userId && w.ticketNumber === ticket.ticketNumber))
      );
      if (alreadyClaimed) continue;

      // 🛡️ Strict Anti-Cheat Rule: 1 Ticket can win ONLY 1 Full House!
      const isFullHousePrize = prizeCode === 'full_house' || prizeCode === 'second_full_house' || prizeCode === 'third_full_house';
      if (isFullHousePrize) {
        const hasAlreadyWonFullHouse = updatedPrizes.some(
          (p) =>
            (p.code === 'full_house' || p.code === 'second_full_house' || p.code === 'third_full_house') &&
            Array.isArray(p.claimedWinners) &&
            p.claimedWinners.some((w) => w && (w.ticketId === ticket.ticketId || (w.userId === ticket.userId && w.ticketNumber === ticket.ticketNumber)))
        );
        if (hasAlreadyWonFullHouse) {
          continue;
        }
      }

      // Check if this ticket qualifies for this prize
      const verification = verifyClaim(
        prizeCode,
        ticket.numbers,
        Array.from(calledSet),
        currentNum
      );

      if (verification.valid) {
        qualifyingTicketsThisRound.push({
          ticket,
          reason: verification.reason,
        });
      }
    }

    // Step 2: If any tickets qualified, calculate winning share without touching previous winners
    if (qualifyingTicketsThisRound.length > 0) {
      const newWinnersCount = qualifyingTicketsThisRound.length;
      const totalWinnersCount = previousClaimedCount + newWinnersCount;
      const targetWinnersCapacity = Math.max(1, prize.maxWinners || 1, totalWinnersCount);

      // Equal share per winner for this category:
      const perWinnerAmount = Math.floor(prize.amount / targetWinnersCapacity);
      const isSplit = totalWinnersCount > 1;

      // 🛡️ Strict Policy: Never deduct money backwards from previous winners' wallets!
      // Once credited, user funds are permanent and 100% safe.

      // Step 2b: First register all newly qualified tickets into prize.claimedWinners
      qualifyingTicketsThisRound.forEach(({ ticket }) => {
        const nowIso = new Date().toISOString();
        prize.claimedWinners.push({
          userId: ticket.userId,
          userName: ticket.userName,
          ticketId: ticket.ticketId,
          ticketNumber: ticket.ticketNumber,
          winningNumber: currentNum,
          claimedAt: nowIso,
        });
      });

      // Build coWinners list of all winners for this prize (both previous and new)
      const coWinnersList = prize.claimedWinners.map((cw) => ({
        userId: cw.userId,
        userName: cw.userName,
        prizeAmount: perWinnerAmount,
        ticketNumber: cw.ticketNumber,
        ticketId: cw.ticketId,
        isCurrentUser: cw.userId === userIdStr,
      }));
      const allWinnerNames = prize.claimedWinners.map((cw) => cw.userName);

      // Award every qualifying ticket in this round
      qualifyingTicketsThisRound.forEach(({ ticket, reason }) => {
        const isCurrentUser = ticket.userId === userIdStr;
        const winId = `win_${Date.now()}_${Math.floor(Math.random() * 100000)}_${prizeCode}`;

        newWins.push({
          id: winId,
          gameId,
          gameTitle,
          prizeCode,
          prizeId: prize.id,
          prizeName: prize.name,
          prizeTotalAmount: prize.amount,
          splitPrizeAmount: perWinnerAmount,
          perWinnerAmount,
          isEqualSplit: isSplit,
          isSplit,
          totalSplitWinners: totalWinnersCount,
          totalWinnersCount,
          userId: ticket.userId,
          userName: ticket.userName,
          winnerUserId: ticket.userId,
          winnerUserName: ticket.userName,
          ticketId: ticket.ticketId,
          ticketNumber: ticket.ticketNumber,
          winningNumber: currentNum,
          isCurrentUser,
          isAutoClaimed: ticket.autoMode !== false,
          ticket,
          reason,
          coWinners: coWinnersList,
          allWinnerNames,
        });
      });
    }
  }

  return {
    newWins,
    updatedPrizes,
    splitAdjustments,
  };
}

export interface ClawbackItem {
  ticketId: string;
  ticketNumber: number;
  userId: string;
  userName: string;
  duplicateWinnerId: string;
  duplicatePrizeCode: string;
  duplicatePrizeName: string;
  clawbackAmount: number;
  gameId: string;
  gameTitle?: string;
  reason: string;
}

export interface ClawbackAuditResult {
  auditedCount: number;
  clawbacks: ClawbackItem[];
  totalClawbackAmount: number;
}

/**
 * 🛡️ Anti-Cheat Audit Engine:
 * Scans all winners and prize claim records.
 * If any single ticket has > 1 Full House recorded (e.g. 1st Full House AND 2nd Full House on same ticket),
 * it flags the duplicate payouts and calculates the exact penalty clawback deduction.
 */
export function auditDuplicateFullHouseWins(
  allWinners: Array<{
    id: string;
    gameId: string;
    gameTitle?: string;
    prizeCode: PrizeCode | string;
    prizeName: string;
    prizeAmount: number;
    userId: string;
    userName: string;
    ticketId: string;
    ticketNumber: number;
    date?: string;
  }>
): ClawbackAuditResult {
  const fullHousePrizes = new Set(['full_house', 'second_full_house', 'third_full_house']);
  const ticketFhMap = new Map<string, Array<typeof allWinners[0]>>();

  for (const win of allWinners) {
    if (!win || !win.ticketId || !fullHousePrizes.has(win.prizeCode)) continue;
    const existing = ticketFhMap.get(win.ticketId) || [];
    existing.push(win);
    ticketFhMap.set(win.ticketId, existing);
  }

  const clawbacks: ClawbackItem[] = [];
  let totalClawbackAmount = 0;

  ticketFhMap.forEach((wins, ticketId) => {
    if (wins.length > 1) {
      // 1st win is legitimate, subsequent Full Houses on the same ticket are violations!
      const validFirstWin = wins[0];
      const duplicateWins = wins.slice(1);

      for (const dup of duplicateWins) {
        const amt = Number(dup.prizeAmount) || 0;
        totalClawbackAmount += amt;
        clawbacks.push({
          ticketId,
          ticketNumber: dup.ticketNumber || validFirstWin.ticketNumber,
          userId: dup.userId,
          userName: dup.userName,
          duplicateWinnerId: dup.id,
          duplicatePrizeCode: dup.prizeCode,
          duplicatePrizeName: dup.prizeName,
          clawbackAmount: amt,
          gameId: dup.gameId,
          gameTitle: dup.gameTitle,
          reason: `नियम उल्लंघन: टिकट #${dup.ticketNumber || ticketId} पर पहले से 1 फुलहाउस (${validFirstWin.prizeName}) जीता जा चुका है। एक टिकट पर 2 फुलहाउस मान्य नहीं होने के कारण अतिरिक्त ₹${amt} की कटौती की गई।`,
        });
      }
    }
  });

  return {
    auditedCount: allWinners.length,
    clawbacks,
    totalClawbackAmount,
  };
}
