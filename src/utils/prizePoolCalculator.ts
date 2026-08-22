import { GamePrize, PrizeCode } from '../types';

/**
 * Standard 7-Prize Distribution Rule for Tambola (अपना तंबोला)
 *
 * Exact Formula requested by user:
 * - Admin Margin: 30% of total ticket sales collection
 * - Total Prize Pool: 70% of total ticket sales collection
 *
 * On ₹1,000 Ticket Sales Collection (₹700 Total Prize Pool):
 * 1. जल्दी 5 (Early 5 / Jaldi 5)       = ₹25   (2.5% of collection / 3.5714% of pool)
 * 2. स्टार (Star - 4 Corners + Center) = ₹25   (2.5% of collection / 3.5714% of pool)
 * 3. पहली लाइन (Top Line / 1st Line)   = ₹25   (2.5% of collection / 3.5714% of pool)
 * 4. दूसरी लाइन (Middle Line / 2nd Line)= ₹25  (2.5% of collection / 3.5714% of pool)
 * 5. तीसरी लाइन (Bottom Line / 3rd Line)= ₹25  (2.5% of collection / 3.5714% of pool)
 * 6. पहला फुलहाउस (1st Full House)     = ₹400  (40.0% of collection / 57.1428% of pool)
 * 7. दूसरा फुलहाउस (2nd Full House)    = ₹175  (17.5% of collection / 25.0% of pool)
 * ---------------------------------------------------------------------------------
 * Total Prize Pool                    = ₹700  (70.0% of collection)
 * Admin Commission                    = ₹300  (30.0% of collection)
 *
 * Multi-winner Rule (समान बंटवारा):
 * If 2 or more players claim the same prize (e.g. 2 winners for 1st Full House of ₹400),
 * each winner gets an equal share (₹200 and ₹200).
 */

export interface PrizeDistributionConfig {
  code: PrizeCode;
  orderNumber: number;
  name: string;
  hindiName: string;
  collectionPercentage: number; // Percentage of total ticket sales (0.025 = 2.5%)
  poolPercentage: number;       // Percentage of the 70% prize pool
  description: string;
  hindiDescription: string;
  maxWinners: number;
}

export const ADMIN_COMMISSION_RATE = 0.30; // 30% to Admin
export const PRIZE_POOL_RATE = 0.70;        // 70% to Players Prize Pool

export const STANDARD_7_PRIZE_CONFIGS: PrizeDistributionConfig[] = [
  {
    orderNumber: 1,
    code: 'early5',
    name: '1. Early 5 (Jaldi 5)',
    hindiName: '1. जल्दी 5 (Jaldi 5)',
    collectionPercentage: 0.025, // 2.5% -> ₹25 on ₹1,000
    poolPercentage: 25 / 700,
    description: 'First ticket with any 5 numbers marked (जिस टिकट में सबसे पहले 5 नंबर आते हैं)',
    hindiDescription: 'जिस टिकट में सबसे पहले कोई भी 5 नंबर आते हैं',
    maxWinners: 2,
  },
  {
    orderNumber: 2,
    code: 'star',
    name: '2. Star (4 Corners + Center)',
    hindiName: '2. स्टार (4 कोने + 1 बीच वाला)',
    collectionPercentage: 0.025, // 2.5% -> ₹25 on ₹1,000
    poolPercentage: 25 / 700,
    description: '4 extreme corner numbers + 1 middle center number (चार कोने के 4 और एक बीच वाला नंबर)',
    hindiDescription: 'चार कोने के 4 नंबर और बीच की लाइन का 1 मध्य नंबर (कुल 5 नंबर)',
    maxWinners: 2,
  },
  {
    orderNumber: 3,
    code: 'top_line',
    name: '3. Top Line (1st Line)',
    hindiName: '3. पहली लाइन (Top Line)',
    collectionPercentage: 0.025, // 2.5% -> ₹25 on ₹1,000
    poolPercentage: 25 / 700,
    description: 'All 5 numbers in the top row (पहली लाइन के पूरे 5 नंबर)',
    hindiDescription: 'पहली लाइन (Row 1) के सभी 5 नंबर कटने पर',
    maxWinners: 2,
  },
  {
    orderNumber: 4,
    code: 'mid_line',
    name: '4. Middle Line (2nd Line)',
    hindiName: '4. दूसरी लाइन (Middle Line)',
    collectionPercentage: 0.025, // 2.5% -> ₹25 on ₹1,000
    poolPercentage: 25 / 700,
    description: 'All 5 numbers in the middle row (दूसरी लाइन के पूरे 5 नंबर)',
    hindiDescription: 'दूसरी लाइन (Row 2) के सभी 5 नंबर कटने पर',
    maxWinners: 2,
  },
  {
    orderNumber: 5,
    code: 'bot_line',
    name: '5. Bottom Line (3rd Line)',
    hindiName: '5. तीसरी लाइन (Bottom Line)',
    collectionPercentage: 0.025, // 2.5% -> ₹25 on ₹1,000
    poolPercentage: 25 / 700,
    description: 'All 5 numbers in the bottom row (तीसरी लाइन के पूरे 5 नंबर)',
    hindiDescription: 'तीसरी लाइन (Row 3) के सभी 5 नंबर कटने पर',
    maxWinners: 2,
  },
  {
    orderNumber: 6,
    code: 'full_house',
    name: '6. 1st Full House (Bumper)',
    hindiName: '6. पहला फुलहाउस (1st Full House)',
    collectionPercentage: 0.40, // 40.0% -> ₹400 on ₹1,000
    poolPercentage: 400 / 700,
    description: 'All 15 numbers completed first (पूरे 15 नंबर सबसे पहले कटने पर)',
    hindiDescription: 'टिकट के सभी 15 नंबर सबसे पहले कटने पर',
    maxWinners: 2,
  },
  {
    orderNumber: 7,
    code: 'second_full_house',
    name: '7. 2nd Full House',
    hindiName: '7. दूसरा फुलहाउस (2nd Full House)',
    collectionPercentage: 0.175, // 17.5% -> ₹175 on ₹1,000
    poolPercentage: 175 / 700,
    description: 'All 15 numbers completed second (पूरे 15 नंबर दूसरे नंबर पर कटने पर)',
    hindiDescription: 'टिकट के सभी 15 नंबर दूसरे स्थान पर कटने पर',
    maxWinners: 2,
  },
];

/**
 * Calculates dynamic prize amounts based on total tickets sold and ticket price.
 * Ensures the exact 70% prize pool and 30% admin share breakdown.
 */
export function calculateTambolaDynamicPrizes(
  ticketsSold: number,
  ticketPrice: number,
  existingPrizes?: GamePrize[],
  minBaseTickets: number = 20
): {
  totalCollection: number;
  adminShare: number;
  prizePool: number;
  prizes: GamePrize[];
} {
  // Use effective tickets sold (or fallback to minBaseTickets for preview when 0 sold)
  const effectiveTickets = Math.max(ticketsSold, minBaseTickets);
  const totalCollection = effectiveTickets * ticketPrice;
  const adminShare = Math.round(totalCollection * ADMIN_COMMISSION_RATE);
  const prizePool = Math.round(totalCollection * PRIZE_POOL_RATE);

  const prizes: GamePrize[] = STANDARD_7_PRIZE_CONFIGS.map((config, idx) => {
    const existing = existingPrizes?.find(
      (p) => p.code === config.code || (config.code === 'star' && p.code === 'corners')
    );

    // Calculate dynamic prize amount based on exact user percentage formula
    const rawAmount = totalCollection * config.collectionPercentage;
    const amount = Math.max(10, Math.round(rawAmount));

    return {
      id: existing?.id || `prz_std_${config.code}_${idx + 1}`,
      code: config.code,
      name: config.hindiName,
      amount,
      maxWinners: config.maxWinners,
      claimedWinners: existing?.claimedWinners || [],
      description: config.hindiDescription,
    };
  });

  return {
    totalCollection,
    adminShare,
    prizePool,
    prizes,
  };
}

/**
 * Calculates equal split amount when a prize has multiple simultaneous winners
 * (e.g. ₹400 1st Full House / 2 winners = ₹200 each)
 */
export function calculateSplitWinning(
  totalPrizeAmount: number,
  totalWinnersCount: number
): {
  perWinnerAmount: number;
  isSplit: boolean;
  explanation: string;
} {
  const count = Math.max(1, totalWinnersCount);
  const perWinnerAmount = Math.round(totalPrizeAmount / count);
  const isSplit = count > 1;

  return {
    perWinnerAmount,
    isSplit,
    explanation: isSplit
      ? `कुल ₹${totalPrizeAmount} का ईनाम ${count} विजेताओं में बराबर (₹${perWinnerAmount} प्रत्येक) बंटा है।`
      : `पूरा ईनाम ₹${totalPrizeAmount} एक विजेता को मिला है।`,
  };
}
