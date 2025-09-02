// /lib/ledger/render-ledger.ts
// Render Ledger CLI text from header + postings (deterministic, balanced).

import { formatCurrencyWithSymbol } from "../utils/currency-format";

export type Posting = { account: string; amount: number; currency?: string };

export function renderLedger(
  date: string,
  payee: string,
  postings: Posting[],
  currency = "THB"
): string {
  const ymd = date.replace(/-/g, "/");

  const pad = (amount: number, curr: string) => {
    const formatted = formatCurrencyWithSymbol(amount, curr);
    return amount >= 0 ? ` ${formatted}` : `${formatted}`;
  };

  const lines = [
    `${ymd} ${payee}`,
    ...postings.map((p) => {
      // For income accounts with negative amounts, render without the amount (Ledger convention)
      if (p.account.startsWith("Income:") && p.amount < 0) {
        return `    ${p.account}`;
      }
      // For liability accounts with negative amounts, render without the amount (Ledger convention)
      if (p.account.startsWith("Liabilities:") && p.amount < 0) {
        return `    ${p.account}`;
      }
      // For equity accounts with negative amounts, render without the amount (Ledger convention)
      if (p.account.startsWith("Equity:") && p.amount < 0) {
        return `    ${p.account}`;
      }
      return `    ${p.account.padEnd(30)}${pad(
        p.amount,
        p.currency || currency
      )}`;
    }),
  ];
  return lines.join("\n");
}

export function sumAmounts(postings: Posting[]): number {
  return +postings.reduce((s, p) => s + p.amount, 0).toFixed(2);
}

export function assertBalanced(postings: Posting[]): void {
  const sum = sumAmounts(postings);
  if (Math.abs(sum) > 0.005) {
    throw new Error(`Postings not balanced (sum=${sum.toFixed(2)})`);
  }
}
