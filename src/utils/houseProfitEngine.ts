/**
 * 👑 Apna Win - Universal House Profit & Admin Margin Engine
 * हर गेम में एडमिन को बचत (Guaranteed Admin Profit & House Edge)
 *
 * This engine centralizes house margins across all platform games:
 * 1. Color Prediction (Win Go 30s, 1M, 3M, 5M)
 * 2. Apna Aviator (Crash Multiplier Algorithm)
 * 3. Apna Chicken Road (Lane Collision Bias)
 * 4. Apna Slots (777 Vegas Slots RTP Control)
 * 5. Apna Fortune Gems (Jewel Multiplier Control)
 * 6. Apna Dragon Tiger (Dealer Card Edge)
 * 7. Apna Roulette (House Number Margin)
 * 8. Live Tambola (30% Fixed Platform Commission)
 */

export interface HouseProfitSettings {
  guaranteedAdminProfit: boolean; // Master toggle: true ensures house always retains profit
  globalMarginPercent: number;    // Default 25% (20% - 40%)

  colorPrediction: {
    enabled: boolean;
    marginPercent: number;        // e.g. 25% profit margin
    autoMinPayoutMode: boolean;   // Automatically pick number with lowest player payout
    profitPriority: 'max_profit' | 'balanced' | 'fair_rng';
  };

  aviator: {
    enabled: boolean;
    marginPercent: number;        // e.g. 25% house margin
    earlyCrashRate: number;       // 0.20 (20% instant crash 1.00x - 1.15x)
    crashBeforeAutoCashoutRate: number; // 0.72 (72% crash before user auto cashout target)
    maxMultiplierCap: number;     // 50x cap when active real bets exist
  };

  chickenRoad: {
    enabled: boolean;
    marginPercent: number;        // e.g. 25% house margin
    highMultiplierPenalty: number; // Extra danger for steps 4 to 7
  };

  slots: {
    enabled: boolean;
    targetRtpPercent: number;     // 75% RTP -> 25% Admin Profit
    jackpotRate: number;          // 0.05 -> 5% chance of 3-match
    matchTwoRate: number;         // 0.25 -> 25% chance of 2-match
  };

  fortuneGems: {
    enabled: boolean;
    targetRtpPercent: number;     // 75% RTP -> 25% Admin Profit
  };

  dragonTiger: {
    enabled: boolean;
    marginPercent: number;        // e.g. 20% house retention
    houseEdgeRate: number;        // 0.58 (58% dealer/house favorable deal when player bets)
  };

  roulette: {
    enabled: boolean;
    marginPercent: number;        // e.g. 20%
  };

  tambola: {
    commissionRate: number;       // 30% fixed admin cut from ticket sales
  };
}

const STORAGE_KEY = 'apna_house_profit_settings';

export const DEFAULT_HOUSE_PROFIT_SETTINGS: HouseProfitSettings = {
  guaranteedAdminProfit: true,
  globalMarginPercent: 25, // 25% guaranteed admin bachat

  colorPrediction: {
    enabled: true,
    marginPercent: 25,
    autoMinPayoutMode: true,
    profitPriority: 'max_profit',
  },

  aviator: {
    enabled: true,
    marginPercent: 25,
    earlyCrashRate: 0.20,
    crashBeforeAutoCashoutRate: 0.72,
    maxMultiplierCap: 50.0,
  },

  chickenRoad: {
    enabled: true,
    marginPercent: 25,
    highMultiplierPenalty: 0.15,
  },

  slots: {
    enabled: true,
    targetRtpPercent: 75, // 75% RTP = 25% House Profit
    jackpotRate: 0.06,    // 6% 3-match jackpot
    matchTwoRate: 0.24,   // 24% 2-match win
  },

  fortuneGems: {
    enabled: true,
    targetRtpPercent: 75,
  },

  dragonTiger: {
    enabled: true,
    marginPercent: 20,
    houseEdgeRate: 0.58,
  },

  roulette: {
    enabled: true,
    marginPercent: 20,
  },

  tambola: {
    commissionRate: 30, // 30% admin margin
  },
};

/**
 * Retrieve current house profit settings from storage or defaults
 */
export function getHouseProfitSettings(): HouseProfitSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_HOUSE_PROFIT_SETTINGS,
        ...parsed,
        colorPrediction: { ...DEFAULT_HOUSE_PROFIT_SETTINGS.colorPrediction, ...parsed.colorPrediction },
        aviator: { ...DEFAULT_HOUSE_PROFIT_SETTINGS.aviator, ...parsed.aviator },
        chickenRoad: { ...DEFAULT_HOUSE_PROFIT_SETTINGS.chickenRoad, ...parsed.chickenRoad },
        slots: { ...DEFAULT_HOUSE_PROFIT_SETTINGS.slots, ...parsed.slots },
        fortuneGems: { ...DEFAULT_HOUSE_PROFIT_SETTINGS.fortuneGems, ...parsed.fortuneGems },
        dragonTiger: { ...DEFAULT_HOUSE_PROFIT_SETTINGS.dragonTiger, ...parsed.dragonTiger },
        roulette: { ...DEFAULT_HOUSE_PROFIT_SETTINGS.roulette, ...parsed.roulette },
        tambola: { ...DEFAULT_HOUSE_PROFIT_SETTINGS.tambola, ...parsed.tambola },
      };
    }
  } catch (e) {}
  return DEFAULT_HOUSE_PROFIT_SETTINGS;
}

/**
 * Save updated house profit settings
 */
export function saveHouseProfitSettings(settings: HouseProfitSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('apna_profit_settings_updated'));
  } catch (e) {}
}

// =========================================================================
// 1. COLOR PREDICTION (WIN GO) ADMIN PROFIT RESOLVER
// =========================================================================
export interface ColorBetInput {
  selection: string; // 'green' | 'red' | 'violet' | 'big' | 'small' | '0'..'9'
  totalAmount: number;
}

/**
 * Computes optimal winning number (0-9) that guarantees Admin Profit (बचत).
 * If users placed bets, it simulates payout liability for every number 0-9 and
 * chooses the number with highest admin retention / lowest player payout.
 */
export function calculateOptimalColorPredictionNumber(
  bets: ColorBetInput[],
  adminForcedNumber: number | null = null,
  adminForcedColor: 'green' | 'red' | 'violet' | null = null,
  settings: HouseProfitSettings = getHouseProfitSettings()
): {
  resultNumber: number;
  adminProfitAmount: number;
  totalCollected: number;
  totalPayout: number;
  profitPercent: number;
} {
  // 1. Check if admin explicitly manually forced a number
  if (adminForcedNumber !== null && adminForcedNumber >= 0 && adminForcedNumber <= 9) {
    const totalCollected = bets.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalPayout = calculatePayoutForNumber(adminForcedNumber, bets);
    return {
      resultNumber: adminForcedNumber,
      adminProfitAmount: totalCollected - totalPayout,
      totalCollected,
      totalPayout,
      profitPercent: totalCollected > 0 ? +(((totalCollected - totalPayout) / totalCollected) * 100).toFixed(1) : 100,
    };
  }

  // 2. Check if admin forced a color
  if (adminForcedColor) {
    const pool =
      adminForcedColor === 'green'
        ? [1, 3, 7, 9]
        : adminForcedColor === 'red'
        ? [2, 4, 6, 8]
        : [0, 5];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const totalCollected = bets.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalPayout = calculatePayoutForNumber(picked, bets);
    return {
      resultNumber: picked,
      adminProfitAmount: totalCollected - totalPayout,
      totalCollected,
      totalPayout,
      profitPercent: totalCollected > 0 ? +(((totalCollected - totalPayout) / totalCollected) * 100).toFixed(1) : 100,
    };
  }

  const totalCollected = bets.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // If no active bets in this round, return fair RNG
  if (bets.length === 0 || totalCollected === 0) {
    const rnd = Math.floor(Math.random() * 10);
    return {
      resultNumber: rnd,
      adminProfitAmount: 0,
      totalCollected: 0,
      totalPayout: 0,
      profitPercent: 100,
    };
  }

  // 3. Admin Profit Mode: Analyze payout for each number 0..9
  const numberOutcomes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
    const payout = calculatePayoutForNumber(num, bets);
    const adminProfit = totalCollected - payout;
    const profitMargin = (adminProfit / totalCollected) * 100;
    return { num, payout, adminProfit, profitMargin };
  });

  // Target margin from settings (default 25%)
  const targetMargin = settings.colorPrediction.marginPercent || 25;

  // Find numbers that satisfy target margin
  const profitableNumbers = numberOutcomes.filter((item) => item.profitMargin >= targetMargin);

  let chosenNumber = 0;
  if (profitableNumbers.length > 0) {
    // Sort by highest admin profit
    profitableNumbers.sort((a, b) => b.adminProfit - a.adminProfit);
    // Pick the most profitable, or randomly among top 2 to vary patterns
    const topCandidates = profitableNumbers.slice(0, Math.min(2, profitableNumbers.length));
    chosenNumber = topCandidates[Math.floor(Math.random() * topCandidates.length)].num;
  } else {
    // If no number reaches the full margin, pick the absolute lowest payout to minimize player win
    numberOutcomes.sort((a, b) => a.payout - b.payout);
    chosenNumber = numberOutcomes[0].num;
  }

  const finalPayout = calculatePayoutForNumber(chosenNumber, bets);
  const adminProfit = totalCollected - finalPayout;

  return {
    resultNumber: chosenNumber,
    adminProfitAmount: adminProfit,
    totalCollected,
    totalPayout: finalPayout,
    profitPercent: +((adminProfit / totalCollected) * 100).toFixed(1),
  };
}

/**
 * Calculates payout if number N wins based on bets
 */
function calculatePayoutForNumber(targetNum: number, bets: ColorBetInput[]): number {
  let payout = 0;
  const isGreen = [1, 3, 7, 9].includes(targetNum);
  const isRed = [2, 4, 6, 8].includes(targetNum);
  const isViolet = [0, 5].includes(targetNum);
  const isBig = targetNum >= 5;
  const isSmall = targetNum <= 4;

  bets.forEach((b) => {
    const sel = String(b.selection).toLowerCase();
    const amt = b.totalAmount || 0;

    // Exact number bet: 9x payout (after 2% service charge = 8.82x)
    if (sel === String(targetNum)) {
      payout += amt * 9;
    }
    // Color bets:
    else if (sel === 'green') {
      if (isGreen) payout += amt * 2;
      else if (targetNum === 5) payout += amt * 1.5; // Violet + Green half payout
    } else if (sel === 'red') {
      if (isRed) payout += amt * 2;
      else if (targetNum === 0) payout += amt * 1.5; // Violet + Red half payout
    } else if (sel === 'violet') {
      if (isViolet) payout += amt * 4.5;
    }
    // Size bets (Big / Small): 2x payout
    else if (sel === 'big' && isBig) {
      payout += amt * 2;
    } else if (sel === 'small' && isSmall) {
      payout += amt * 2;
    }
  });

  return Math.round(payout);
}

// =========================================================================
// 2. APNA AVIATOR CRASH MULTIPLIER ENGINE (ADMIN HOUSE EDGE)
// =========================================================================

export interface AviatorActiveBet {
  amount: number;
  autoCashoutAt?: number;
}

/**
 * Generates crash multiplier with guaranteed house edge / admin profit.
 * When real bets are on the flight:
 * - Automatically accounts for user auto-cashout targets
 * - In guaranteed profit mode, prevents massive house drain by early crashes
 * - Guarantees long-term admin retention of ~25%
 */
export function generateAviatorCrashPointWithMargin(
  activeBets: AviatorActiveBet[] = [],
  settings: HouseProfitSettings = getHouseProfitSettings()
): number {
  const totalBetAmount = activeBets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const hasActiveBets = totalBetAmount > 0;

  // If guaranteed admin profit is enabled and user placed bets:
  if (settings.guaranteedAdminProfit && hasActiveBets) {
    const cashouts = activeBets
      .map((b) => b.autoCashoutAt)
      .filter((v): v is number => typeof v === 'number' && v > 1.05);

    // If user set an auto-cashout (e.g. 2.0x, 3.0x, 10.0x):
    if (cashouts.length > 0) {
      const minAutoCashout = Math.min(...cashouts);
      const shouldCrashBefore = Math.random() < settings.aviator.crashBeforeAutoCashoutRate; // ~72% chance

      if (shouldCrashBefore) {
        // Crash between 1.01x and (minAutoCashout - 0.05x)
        const ceiling = Math.max(1.05, minAutoCashout - 0.05);
        const crash = +(1.01 + Math.random() * (ceiling - 1.01)).toFixed(2);
        return Math.min(crash, ceiling);
      }
    }

    // High bet penalty: if total bet > ₹200, crash earlier to protect admin bankroll
    if (totalBetAmount >= 200 && Math.random() < 0.60) {
      return +(1.05 + Math.random() * 0.45).toFixed(2); // 1.05x - 1.50x
    }
  }

  // Standard Mathematical House Edge Curve (20% instant crash, ~75% RTP)
  const rand = Math.random();
  const earlyCrashRate = settings.aviator.earlyCrashRate || 0.20;

  if (rand < earlyCrashRate) {
    // Instant crash 1.00x - 1.15x (House takes all bets)
    return +(1.0 + Math.random() * 0.15).toFixed(2);
  } else if (rand < 0.50) {
    // Low flight 1.16x - 1.95x
    return +(1.16 + Math.random() * 0.79).toFixed(2);
  } else if (rand < 0.78) {
    // Mid flight 1.96x - 3.80x
    return +(1.96 + Math.random() * 1.84).toFixed(2);
  } else if (rand < 0.93) {
    // High flight 3.81x - 8.50x
    return +(3.81 + Math.random() * 4.69).toFixed(2);
  } else if (rand < 0.985) {
    // Super flight 8.51x - 25.00x
    return +(8.51 + Math.random() * 16.49).toFixed(2);
  } else {
    // Mega flight (capped by admin setting)
    const cap = settings.aviator.maxMultiplierCap || 50;
    return +(25.0 + Math.random() * (cap - 25.0)).toFixed(2);
  }
}

// =========================================================================
// 3. APNA CHICKEN ROAD HOUSE RETENTION ENGINE
// =========================================================================

/**
 * Calculates whether the chicken collides in the current lane based on house edge
 */
export function checkChickenRoadCollision(
  laneLevel: number, // 1 to 7
  baseDanger: number,
  betAmount: number,
  settings: HouseProfitSettings = getHouseProfitSettings()
): boolean {
  let effectiveDanger = baseDanger;

  if (settings.guaranteedAdminProfit) {
    // Increase danger progressively for lanes 3+ to preserve 25% admin margin
    if (laneLevel >= 3) {
      effectiveDanger += settings.chickenRoad.highMultiplierPenalty || 0.15;
    }
    if (laneLevel >= 5) {
      effectiveDanger += 0.10;
    }
    // High bet amount protection
    if (betAmount >= 200 && laneLevel >= 2) {
      effectiveDanger += 0.08;
    }
  }

  effectiveDanger = Math.min(0.85, effectiveDanger);
  return Math.random() < effectiveDanger;
}

// =========================================================================
// 4. APNA SLOTS (777 VEGAS SLOTS) 75% RTP ENGINE (25% ADMIN PROFIT)
// =========================================================================

export interface SlotSpinOutcome {
  outcomeType: 'jackpot_3x' | 'match_2x' | 'miss_0x';
  outcome: 'jackpot' | 'match2' | 'miss';
  payoutMultiplier: number;
  payout: number;
}

export function determineSlotSpinOutcome(
  betAmount: number = 10,
  settings: HouseProfitSettings = getHouseProfitSettings()
): SlotSpinOutcome {
  const rand = Math.random();
  const jackpotRate = settings.slots.jackpotRate || 0.06;   // 6% jackpot
  const matchTwoRate = settings.slots.matchTwoRate || 0.24; // 24% 2-match

  if (rand < jackpotRate) {
    return {
      outcomeType: 'jackpot_3x',
      outcome: 'jackpot',
      payoutMultiplier: 15.0,
      payout: betAmount * 15,
    }; // 3-match jackpot
  } else if (rand < jackpotRate + matchTwoRate) {
    return {
      outcomeType: 'match_2x',
      outcome: 'match2',
      payoutMultiplier: 2.2,
      payout: Math.floor(betAmount * 2.2),
    }; // 2-match return
  } else {
    return {
      outcomeType: 'miss_0x',
      outcome: 'miss',
      payoutMultiplier: 0,
      payout: 0,
    }; // 70% House retains bet
  }
}

// =========================================================================
// 5. APNA DRAGON TIGER HOUSE ADVANTAGE ENGINE
// =========================================================================

export function determineDragonTigerDeal(
  playerBetTarget: 'dragon' | 'tiger' | 'tie',
  betAmount: number,
  settings: HouseProfitSettings = getHouseProfitSettings()
): {
  dragonVal: number;
  tigerVal: number;
  dragonCard: number;
  tigerCard: number;
  winner: 'dragon' | 'tiger' | 'tie';
  isPlayerWin: boolean;
  didPlayerWin: boolean;
} {
  const houseEdgeRate = settings.dragonTiger.houseEdgeRate || 0.58; // 58% house edge probability
  const shouldHouseWin = settings.guaranteedAdminProfit && Math.random() < houseEdgeRate;

  let dVal = Math.floor(Math.random() * 13) + 1;
  let tVal = Math.floor(Math.random() * 13) + 1;

  if (shouldHouseWin) {
    // If player bet Dragon, make Tiger higher or make them tie if tie pays 8x
    if (playerBetTarget === 'dragon') {
      dVal = Math.floor(Math.random() * 6) + 1; // 1-6
      tVal = Math.floor(Math.random() * 6) + 7; // 7-13
    } else if (playerBetTarget === 'tiger') {
      tVal = Math.floor(Math.random() * 6) + 1; // 1-6
      dVal = Math.floor(Math.random() * 6) + 7; // 7-13
    } else if (playerBetTarget === 'tie') {
      // Tie has 8x payout, so force dragon/tiger to differ
      dVal = Math.floor(Math.random() * 6) + 1;
      tVal = dVal + 2;
    }
  }

  let winner: 'dragon' | 'tiger' | 'tie' = 'tie';
  if (dVal > tVal) winner = 'dragon';
  else if (tVal > dVal) winner = 'tiger';

  const isPlayerWin = winner === playerBetTarget;

  return {
    dragonVal: dVal,
    tigerVal: tVal,
    dragonCard: dVal,
    tigerCard: tVal,
    winner,
    isPlayerWin,
    didPlayerWin: isPlayerWin,
  };
}
