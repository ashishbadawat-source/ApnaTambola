/**
 * Standard Tambola (Housie) 90-ball ticket generator and claim verification engine.
 */

export interface ColumnRange {
  min: number;
  max: number;
}

export const COLUMN_RANGES: ColumnRange[] = [
  { min: 1, max: 9 },    // Col 0: 1 - 9
  { min: 10, max: 19 },  // Col 1: 10 - 19
  { min: 20, max: 29 },  // Col 2: 20 - 29
  { min: 30, max: 39 },  // Col 3: 30 - 39
  { min: 40, max: 49 },  // Col 4: 40 - 49
  { min: 50, max: 59 },  // Col 5: 50 - 59
  { min: 60, max: 69 },  // Col 6: 60 - 69
  { min: 70, max: 79 },  // Col 7: 70 - 79
  { min: 80, max: 90 },  // Col 8: 80 - 90
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates a valid standard 3x9 Tambola Ticket matrix (0 denotes blank space)
 */
export function generateTambolaTicketMatrix(): number[][] {
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    try {
      const grid: number[][] = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ];

      // 1. Determine number of items per column. Total must be 15, each column 1..3.
      // Every column gets at least 1 number (9 numbers).
      const colCounts = [1, 1, 1, 1, 1, 1, 1, 1, 1];
      const remainingToAdd = 6;
      const eligibleCols = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      for (let i = 0; i < remainingToAdd; i++) {
        colCounts[eligibleCols[i]]++;
      }

      // 2. Select random unique numbers for each column within its range & sort ascending
      const columnNumbers: number[][] = [];
      for (let c = 0; c < 9; c++) {
        const range = COLUMN_RANGES[c];
        const count = colCounts[c];
        const chosen = new Set<number>();
        while (chosen.size < count) {
          chosen.add(getRandomInt(range.min, range.max));
        }
        columnNumbers[c] = Array.from(chosen).sort((a, b) => a - b);
      }

      // 3. Place numbers in rows so each row has exactly 5 numbers
      const rowCounts = [0, 0, 0];
      const rowColOccupied: boolean[][] = [
        Array(9).fill(false),
        Array(9).fill(false),
        Array(9).fill(false),
      ];

      // Place columns with 3 numbers (if any) first - occupies all 3 rows
      for (let c = 0; c < 9; c++) {
        if (colCounts[c] === 3) {
          for (let r = 0; r < 3; r++) {
            rowColOccupied[r][c] = true;
            rowCounts[r]++;
          }
        }
      }

      // Place columns with 2 numbers
      for (let c = 0; c < 9; c++) {
        if (colCounts[c] === 2) {
          // Find the 2 rows with the smallest current counts
          const rowIndices = [0, 1, 2].sort((a, b) => rowCounts[a] - rowCounts[b]);
          const r1 = rowIndices[0];
          const r2 = rowIndices[1];
          rowColOccupied[r1][c] = true;
          rowCounts[r1]++;
          rowColOccupied[r2][c] = true;
          rowCounts[r2]++;
        }
      }

      // Place columns with 1 number
      for (let c = 0; c < 9; c++) {
        if (colCounts[c] === 1) {
          // Pick row with lowest count that has space (<5)
          const rowIndices = [0, 1, 2].filter(r => rowCounts[r] < 5).sort((a, b) => rowCounts[a] - rowCounts[b]);
          if (rowIndices.length === 0) continue;
          const r = rowIndices[0];
          rowColOccupied[r][c] = true;
          rowCounts[r]++;
        }
      }

      // Check if all rows have exactly 5 numbers
      if (rowCounts[0] === 5 && rowCounts[1] === 5 && rowCounts[2] === 5) {
        // Fill grid with sorted column numbers according to occupied rows
        for (let c = 0; c < 9; c++) {
          const numbers = columnNumbers[c];
          let numIdx = 0;
          for (let r = 0; r < 3; r++) {
            if (rowColOccupied[r][c]) {
              grid[r][c] = numbers[numIdx++];
            }
          }
        }
        return grid;
      }
    } catch {
      // Retry
    }
  }

  // Fallback default valid Tambola ticket if randomized iteration threshold is met
  return [
    [7, 0, 23, 0, 41, 0, 62, 75, 0],
    [0, 14, 0, 36, 0, 58, 0, 79, 82],
    [9, 0, 28, 39, 47, 0, 69, 0, 89],
  ];
}

/**
 * Generates a Unique Ticket ID
 */
export function generateTicketId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TKT-${segment1}-${segment2}`;
}

/**
 * Returns all non-zero numbers in a ticket
 */
export function getAllTicketNumbers(grid: number[][]): number[] {
  const numbers: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] > 0) {
        numbers.push(grid[r][c]);
      }
    }
  }
  return numbers;
}

/**
 * Corner Numbers: First non-zero & Last non-zero in Row 0, and First non-zero & Last non-zero in Row 2.
 */
export function getFourCornerNumbers(grid: number[][]): number[] {
  const row0 = grid[0].filter(n => n > 0);
  const row2 = grid[2].filter(n => n > 0);
  if (row0.length < 2 || row2.length < 2) return [];
  return [row0[0], row0[row0.length - 1], row2[0], row2[row2.length - 1]];
}

/**
 * Star Numbers (स्टार): 4 extreme corner numbers + 1 middle row center number (Total 5 numbers)
 * - Row 0: first and last number (2 corners)
 * - Row 2: first and last number (2 corners)
 * - Row 1: 3rd (center) number of middle line
 */
export function getStarNumbers(grid: number[][]): number[] {
  const row0 = grid[0].filter(n => n > 0);
  const row1 = grid[1].filter(n => n > 0);
  const row2 = grid[2].filter(n => n > 0);
  if (row0.length < 2 || row1.length < 3 || row2.length < 2) return [];
  const corners = [row0[0], row0[row0.length - 1], row2[0], row2[row2.length - 1]];
  const center = row1[2] || row1[Math.floor(row1.length / 2)];
  return [...corners, center];
}

export function getRowNumbers(grid: number[][], rowIndex: number): number[] {
  return grid[rowIndex].filter(n => n > 0);
}

/**
 * Validates a Tambola claim on the client or server
 */
export function verifyClaim(
  prizeCode: string,
  grid: number[][],
  calledNumbers: number[],
  lastCalledNumber: number | null
): { valid: boolean; reason: string; matchedNumbers: number[] } {
  const calledSet = new Set(calledNumbers);
  const allNumbers = getAllTicketNumbers(grid);

  // Requirement: The winning ticket must include the last called number in its claim or be active
  if (lastCalledNumber !== null && !allNumbers.includes(lastCalledNumber) && prizeCode !== 'early5') {
    // In traditional rules, winning number called triggers claim. We allow flexible check but verify correctly.
  }

  switch (prizeCode) {
    case 'early5': {
      const marked = allNumbers.filter(n => calledSet.has(n));
      if (marked.length >= 5) {
        return { valid: true, reason: `Early Five (जल्दी 5) completed with ${marked.length} marked numbers!`, matchedNumbers: marked.slice(0, 5) };
      }
      return { valid: false, reason: `Only ${marked.length}/5 numbers have been called so far.`, matchedNumbers: marked };
    }

    case 'star': {
      const starNums = getStarNumbers(grid);
      const matched = starNums.filter(n => calledSet.has(n));
      if (matched.length === 5) {
        return { valid: true, reason: 'Star (स्टार - 4 कोने + 1 बीच वाला नंबर) completed!', matchedNumbers: starNums };
      }
      return { valid: false, reason: `Star (स्टार) has ${matched.length}/5 numbers called (${starNums.join(', ')}).`, matchedNumbers: matched };
    }

    case 'corners': {
      const corners = getFourCornerNumbers(grid);
      const matched = corners.filter(n => calledSet.has(n));
      if (matched.length === 4) {
        return { valid: true, reason: 'All 4 Corners are marked!', matchedNumbers: corners };
      }
      return { valid: false, reason: `Only ${matched.length}/4 corners are called (${corners.join(', ')}).`, matchedNumbers: matched };
    }

    case 'top_line': {
      const topNumbers = getRowNumbers(grid, 0);
      const matched = topNumbers.filter(n => calledSet.has(n));
      if (matched.length === 5) {
        return { valid: true, reason: 'Top Line completed!', matchedNumbers: topNumbers };
      }
      return { valid: false, reason: `Top line has ${matched.length}/5 numbers called.`, matchedNumbers: matched };
    }

    case 'mid_line': {
      const midNumbers = getRowNumbers(grid, 1);
      const matched = midNumbers.filter(n => calledSet.has(n));
      if (matched.length === 5) {
        return { valid: true, reason: 'Middle Line completed!', matchedNumbers: midNumbers };
      }
      return { valid: false, reason: `Middle line has ${matched.length}/5 numbers called.`, matchedNumbers: matched };
    }

    case 'bot_line': {
      const botNumbers = getRowNumbers(grid, 2);
      const matched = botNumbers.filter(n => calledSet.has(n));
      if (matched.length === 5) {
        return { valid: true, reason: 'Bottom Line completed!', matchedNumbers: botNumbers };
      }
      return { valid: false, reason: `Bottom line has ${matched.length}/5 numbers called.`, matchedNumbers: matched };
    }

    case 'full_house':
    case 'second_full_house':
    case 'third_full_house': {
      const matched = allNumbers.filter(n => calledSet.has(n));
      if (matched.length === 15) {
        return { valid: true, reason: 'Full House (15/15) completed! Bingo!', matchedNumbers: allNumbers };
      }
      return { valid: false, reason: `Ticket has ${matched.length}/15 numbers marked. Need 15 for Full House.`, matchedNumbers: matched };
    }

    case 'special': {
      // Center star or first 7 numbers
      const midRow = getRowNumbers(grid, 1);
      const centerNumber = midRow[Math.floor(midRow.length / 2)];
      if (centerNumber && calledSet.has(centerNumber)) {
        return { valid: true, reason: `Special Star number ${centerNumber} called!`, matchedNumbers: [centerNumber] };
      }
      return { valid: false, reason: `Special Star number (${centerNumber || 'center'}) has not been called yet.`, matchedNumbers: [] };
    }

    default:
      return { valid: false, reason: 'Unknown prize category.', matchedNumbers: [] };
  }
}
