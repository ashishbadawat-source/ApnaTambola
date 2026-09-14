import { TambolaGame, TambolaTicket, PrizeCode, GamePrize } from '../types';

/**
 * Extracts all non-zero numbers from a 3x9 Tambola ticket matrix.
 */
export function getFlatTicketNumbers(matrix: number[][]): number[] {
  if (!Array.isArray(matrix)) return [];
  const list: number[] = [];
  matrix.forEach((row) => {
    if (Array.isArray(row)) {
      row.forEach((cell) => {
        if (typeof cell === 'number' && cell > 0 && cell <= 90) {
          list.push(cell);
        }
      });
    }
  });
  return list;
}

/**
 * Returns the exact numbers required to win a specific prize code on a given ticket.
 */
export function getRequiredNumbersForPrize(prizeCode: PrizeCode, matrix: number[][]): number[] {
  if (!Array.isArray(matrix) || matrix.length < 3) return [];

  const row0 = (matrix[0] || []).filter((n) => typeof n === 'number' && n > 0);
  const row1 = (matrix[1] || []).filter((n) => typeof n === 'number' && n > 0);
  const row2 = (matrix[2] || []).filter((n) => typeof n === 'number' && n > 0);
  const all15 = [...row0, ...row1, ...row2];

  switch (prizeCode) {
    case 'top_line':
      return row0;
    case 'mid_line':
      return row1;
    case 'bot_line':
      return row2;
    case 'corners': {
      const tl = row0[0];
      const tr = row0[row0.length - 1];
      const bl = row2[0];
      const br = row2[row2.length - 1];
      return [tl, tr, bl, br].filter(Boolean);
    }
    case 'star': {
      // Center star or middle element of middle row
      const center = matrix[1]?.[4] || row1[Math.floor(row1.length / 2)] || row1[0];
      return center ? [center] : [];
    }
    case 'early5':
    case 'early_five':
      return all15;
    case 'full_house':
    case 'second_full_house':
    case 'third_full_house':
    default:
      return all15;
  }
}

/**
 * Calculates how many numbers are needed and remaining for a target ticket to win a prize.
 */
export function getPrizeTargetProgress(
  prizeCode: PrizeCode,
  matrix: number[][],
  calledNumbers: number[]
): {
  requiredTotal: number;
  markedCount: number;
  remainingCount: number;
  neededNumbers: number[];
  isComplete: boolean;
} {
  const calledSet = new Set(calledNumbers || []);
  const reqList = getRequiredNumbersForPrize(prizeCode, matrix);

  if (prizeCode === 'early5' || prizeCode === 'early_five') {
    const all15 = getFlatTicketNumbers(matrix);
    const marked = all15.filter((n) => calledSet.has(n));
    const uncalled = all15.filter((n) => !calledSet.has(n));
    const isComplete = marked.length >= 5;
    const remainingCount = isComplete ? 0 : Math.max(0, 5 - marked.length);
    return {
      requiredTotal: 5,
      markedCount: marked.length,
      remainingCount,
      neededNumbers: uncalled,
      isComplete,
    };
  }

  const marked = reqList.filter((n) => calledSet.has(n));
  const uncalled = reqList.filter((n) => !calledSet.has(n));
  const isComplete = uncalled.length === 0 && reqList.length > 0;

  return {
    requiredTotal: reqList.length,
    markedCount: marked.length,
    remainingCount: uncalled.length,
    neededNumbers: uncalled,
    isComplete,
  };
}

/**
 * PRIZE PRIORITY EVALUATION ORDER
 */
const PRIORITY_ORDER: PrizeCode[] = [
  'early5',
  'early_five',
  'star',
  'corners',
  'top_line',
  'mid_line',
  'bot_line',
  'full_house',
  'second_full_house',
  'third_full_house',
];

/**
 * Smart Pre-Set Winner Steerer:
 * Determines the optimal next number to call so that admin-assigned target tickets win
 * their specified prizes without accidental spoilers from other tickets.
 */
export function getNextSmartSteeredNumber(
  game: TambolaGame,
  allTickets: TambolaTicket[]
): {
  number: number;
  isTargetDriven: boolean;
  targetPrizeName?: string;
  targetTicketNumber?: number;
  targetUserName?: string;
} | null {
  const calledList = Array.isArray(game.calledNumbers) ? game.calledNumbers : [];
  const calledSet = new Set(calledList);
  const available = Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => !calledSet.has(n));

  if (available.length === 0) return null;

  const gameTickets = (allTickets || []).filter(
    (t) => t && (t.gameId === game.id || !t.gameId) && t.isActive !== false && t.status !== 'disabled'
  );

  const prizes = Array.isArray(game.prizes) ? game.prizes : [];

  // 1. Find all active prizes that have an admin pre-set target and are not yet fully claimed
  const targetedPrizes = prizes.filter((p) => {
    const isTargeted = !!(p.isPreTargeted || p.targetTicketId || p.targetUserId);
    const claimedCount = Array.isArray(p.claimedWinners) ? p.claimedWinners.length : 0;
    const isUnclaimed = claimedCount < (p.maxWinners || 1);
    return isTargeted && isUnclaimed;
  });

  if (targetedPrizes.length === 0) {
    // No target active, return random available number
    const randomPick = available[Math.floor(Math.random() * available.length)];
    return { number: randomPick, isTargetDriven: false };
  }

  // Sort targeted prizes by priority order
  targetedPrizes.sort((a, b) => {
    const idxA = PRIORITY_ORDER.indexOf(a.code);
    const idxB = PRIORITY_ORDER.indexOf(b.code);
    return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
  });

  // Check 2nd full house constraint: only steer after 1st full house is done
  const activeTargetPrize = targetedPrizes.find((p) => {
    if (p.code === 'second_full_house') {
      const firstFh = prizes.find((pr) => pr.code === 'full_house');
      const firstFhDone = firstFh && Array.isArray(firstFh.claimedWinners) && firstFh.claimedWinners.length > 0;
      return firstFhDone;
    }
    return true;
  });

  if (!activeTargetPrize) {
    const randomPick = available[Math.floor(Math.random() * available.length)];
    return { number: randomPick, isTargetDriven: false };
  }

  // Find target ticket
  const targetTicket = gameTickets.find((t) => {
    if (activeTargetPrize.targetTicketId) {
      if (t.ticketId === activeTargetPrize.targetTicketId || t.id === activeTargetPrize.targetTicketId) return true;
    }
    if (activeTargetPrize.targetTicketNumber && t.ticketNumber === activeTargetPrize.targetTicketNumber) return true;
    if (activeTargetPrize.targetUserId && t.userId === activeTargetPrize.targetUserId) return true;
    return false;
  });

  if (!targetTicket) {
    // Target ticket not in tickets list, fallback to random
    const randomPick = available[Math.floor(Math.random() * available.length)];
    return { number: randomPick, isTargetDriven: false };
  }

  // Get remaining numbers needed for this target ticket
  const progress = getPrizeTargetProgress(activeTargetPrize.code, targetTicket.numbers, calledList);

  if (progress.neededNumbers.length === 0 || progress.isComplete) {
    // Already completed or ready, pick from available
    const randomPick = available[Math.floor(Math.random() * available.length)];
    return { number: randomPick, isTargetDriven: false };
  }

  // 2. Identify potential spoiler numbers from rival (non-targeted) tickets for this same prize
  const spoilerNumbers = new Set<number>();
  for (const rivalTicket of gameTickets) {
    if (rivalTicket.id === targetTicket.id || rivalTicket.ticketId === targetTicket.ticketId) continue;
    const rivalProgress = getPrizeTargetProgress(activeTargetPrize.code, rivalTicket.numbers, calledList);
    // If rival is 1 number away from completing, mark their missing numbers as spoiler
    if (rivalProgress.remainingCount <= 1) {
      rivalProgress.neededNumbers.forEach((n) => spoilerNumbers.add(n));
    }
  }

  // Filter target's needed numbers to pick
  const targetCandidateNumbers = progress.neededNumbers.filter((n) => available.includes(n));

  // If target is 1 number away or 80% of the time, pick a target number!
  const shouldCallTargetNumber = progress.remainingCount === 1 || Math.random() < 0.78 || calledList.length > 25;

  if (shouldCallTargetNumber && targetCandidateNumbers.length > 0) {
    // Prefer target number that doesn't immediately cause a rival collision if possible
    const safeTargetCandidates = targetCandidateNumbers.filter((n) => !spoilerNumbers.has(n));
    const chosenNumber = safeTargetCandidates.length > 0
      ? safeTargetCandidates[Math.floor(Math.random() * safeTargetCandidates.length)]
      : targetCandidateNumbers[Math.floor(Math.random() * targetCandidateNumbers.length)];

    return {
      number: chosenNumber,
      isTargetDriven: true,
      targetPrizeName: activeTargetPrize.name,
      targetTicketNumber: targetTicket.ticketNumber,
      targetUserName: targetTicket.userName,
    };
  }

  // Otherwise, pick a safe neutral number from available (avoiding spoiler numbers)
  const safeNeutral = available.filter((n) => !spoilerNumbers.has(n));
  const finalNeutral = safeNeutral.length > 0 ? safeNeutral : available;
  const picked = finalNeutral[Math.floor(Math.random() * finalNeutral.length)];

  return {
    number: picked,
    isTargetDriven: false,
    targetPrizeName: activeTargetPrize.name,
    targetTicketNumber: targetTicket.ticketNumber,
    targetUserName: targetTicket.userName,
  };
}
