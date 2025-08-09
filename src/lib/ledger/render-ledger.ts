// /lib/ledger/render-ledger.ts
// Render Ledger CLI text from header + postings (deterministic, balanced).

export type Posting = { account: string; amount: number; currency?: string };

export function renderLedger(
  date: string, // YYYY-MM-DD
  payee: string,
  postings: Posting[],
  currency = "THB"
): string {
  const ymd = date.replace(/-/g, "/"); // Ledger header prefers slashes
  const pad = (n: number) =>
    n >= 0 ? ` $${n.toFixed(2)}` : `$${n.toFixed(2)}`;
  const lines = [
    `${ymd} ${payee}`,
    ...postings.map((p) => `    ${p.account.padEnd(30)}${pad(p.amount)}`),
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
