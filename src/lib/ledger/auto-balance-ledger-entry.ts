// src/lib/ledger/auto-balance-ledger-entry.ts

export interface LedgerLine {
  account: string;
  amount: number;
}

/**
 * Auto-balances ledger entry lines. Adjusts smallest expense line if sum is off by ≤ threshold.
 * @param lines Array of ledger lines (at least one with Assets:Cash)
 * @param threshold Allowed difference (default 0.02)
 * @returns New array of balanced ledger lines
 */
export function autoBalanceLedgerEntry(
  lines: LedgerLine[],
  threshold: number = 0.02
): LedgerLine[] {
  const cashIdx = lines.findIndex((l) =>
    l.account.toLowerCase().includes("assets:cash")
  );
  if (cashIdx === -1) throw new Error("No Assets:Cash line found.");
  const cashLine = lines[cashIdx];
  const expenseLines = lines.filter((_, i) => i !== cashIdx);

  const sumExpenses = expenseLines.reduce((acc, l) => acc + l.amount, 0);
  const cashAbs = Math.abs(cashLine.amount);
  const difference = +(sumExpenses - cashAbs).toFixed(2);

  if (Math.abs(difference) === 0) return lines;

  if (Math.abs(difference) <= threshold) {
    // Adjust the smallest (absolute value) expense line
    const idx = expenseLines.reduce(
      (minIdx, line, i, arr) =>
        Math.abs(line.amount) < Math.abs(arr[minIdx].amount) ? i : minIdx,
      0
    );
    expenseLines[idx] = {
      ...expenseLines[idx],
      amount: +(expenseLines[idx].amount - difference).toFixed(2),
    };
    return [...expenseLines, cashLine];
  }

  throw new Error(
    `Entry out of balance by $${Math.abs(difference).toFixed(
      2
    )} (exceeds threshold)`
  );
}
