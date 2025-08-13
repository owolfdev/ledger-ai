// /lib/ledger/render-ledger.ts
// Render Ledger CLI text from header + postings (deterministic, balanced).

export type Posting = { account: string; amount: number; currency?: string };

export function renderLedger(
  date: string,
  payee: string,
  postings: Posting[],
  currency = "THB"
): string {
  const ymd = date.replace(/-/g, "/");

  // Currency symbol mapping
  const currencySymbol = (curr: string) => {
    if (curr === "THB") return "฿";
    if (curr === "USD") return "$";
    if (curr === "EUR") return "€";
    return curr; // fallback
  };

  const pad = (amount: number, curr: string) => {
    const symbol = currencySymbol(curr);
    return amount >= 0
      ? ` ${symbol}${amount.toFixed(2)}`
      : `${symbol}${amount.toFixed(2)}`;
  };

  const lines = [
    `${ymd} ${payee}`,
    ...postings.map(
      (p) =>
        `    ${p.account.padEnd(30)}${pad(p.amount, p.currency || currency)}`
    ),
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
