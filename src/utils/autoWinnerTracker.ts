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
 */
export function checkAndAutoTrackWinners(
  gameOrOptions: TambolaGame | CheckAutoTrackOptions,
  allGameTickets?: TambolaTicket[],
  currentUserId?: string,
  calledNumber?: number
): {
  newWins: DetectedWinEvent[];
  updatedPrizes: GamePrize[];
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
  const updatedPrizes: GamePrize[] = JSON.parse(JSON.stringify(prizesList));

  if (!currentNum || !Array.isArray(ticketsList) || ticketsList.length === 0) {
    return { newWins, updatedPrizes };
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
    const claimedCount = Array.isArray(prize.claimedWinners) ? prize.claimedWinners.length : 0;
    const remainingSlots = prize.maxWinners - claimedCount;
    if (remainingSlots <= 0) continue;

    // Special condition for 2nd Full House: Only open if 1st Full House has already been claimed!
    if (prizeCode === 'second_full_house') {
      const firstFh = updatedPrizes.find((p) => p.code === 'full_house');
      const firstFhCount = firstFh && Array.isArray(firstFh.claimedWinners) ? firstFh.claimedWinners.length : 0;
      if (!firstFh || firstFhCount === 0) {
        continue;
      }
    }

    // Check all tickets for this game
    for (const ticket of ticketsList) {
      if (!ticket) continue;
      // Skip tickets that are turned OFF / disabled by admin
      if (ticket.isActive === false || ticket.status === 'disabled' || ticket.status === 'void') {
        continue;
      }

      // Check if prize slots are still available in this iteration
      const currentClaimedCount = Array.isArray(prize.claimedWinners) ? prize.claimedWinners.length : 0;
      if (currentClaimedCount >= prize.maxWinners) break;

      // Check if ticket or user already claimed this prize
      const alreadyClaimed = Array.isArray(prize.claimedWinners) && prize.claimedWinners.some(
        (w) => w && (w.ticketId === ticket.ticketId || (w.userId === ticket.userId && w.ticketNumber === ticket.ticketNumber))
      );
      if (alreadyClaimed) continue;

      // Check if this ticket qualifies for this prize
      const verification = verifyClaim(
        prizeCode,
        ticket.numbers,
        Array.from(calledSet),
        currentNum
      );

      if (verification.valid) {
        // Winning detected!
        if (!Array.isArray(prize.claimedWinners)) {
          prize.claimedWinners = [];
        }
        const existingCount = prize.claimedWinners.length;
        const totalWinnersCount = existingCount + 1;
        const splitInfo = calculateSplitWinning(prize.amount, totalWinnersCount);

        const isCurrentUser = ticket.userId === userIdStr;
        const nowIso = new Date().toISOString();
        const winId = `win_${Date.now()}_${Math.floor(Math.random() * 100000)}_${prizeCode}`;

        // Record winner inside prize
        prize.claimedWinners.push({
          userId: ticket.userId,
          userName: ticket.userName,
          ticketId: ticket.ticketId,
          ticketNumber: ticket.ticketNumber,
          winningNumber: currentNum,
          claimedAt: nowIso,
        });

        newWins.push({
          id: winId,
          gameId,
          gameTitle,
          prizeCode,
          prizeId: prize.id,
          prizeName: prize.name,
          prizeTotalAmount: prize.amount,
          splitPrizeAmount: splitInfo.perWinnerAmount,
          perWinnerAmount: splitInfo.perWinnerAmount,
          isEqualSplit: splitInfo.isSplit,
          isSplit: splitInfo.isSplit,
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
          isAutoClaimed: ticket.autoMode !== false, // Defaults to auto-claim tracking
          ticket,
          reason: verification.reason,
        });
      }
    }
  }

  return {
    newWins,
    updatedPrizes,
  };
}
