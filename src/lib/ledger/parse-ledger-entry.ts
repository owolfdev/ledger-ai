// /lib/ledger/parse-ledger-entry.ts (fixed types, multi-posting)
// Parse a Ledger CLI entry with 1..N postings.

export type LedgerPosting = {
  account: string;
  amount: number; // signed; negative for assets/cash outflow
  currency: string; // normalized (e.g., 'THB', 'USD')
  memo?: string;
};

export interface ParsedLedgerEntry {
  raw: string;
  date: string; // YYYY-MM-DD (Postgres DATE-friendly)
  payee: string;
  postings: LedgerPosting[];
  amount: number; // absolute of total negatives
  currency: string; // primary currency (first seen; default THB)
  business_name?: string | null;
}

function normalizeCurrency(input?: string | null): string {
  if (!input) return "THB";
  const s = input.trim();
  if (s === "$" || s.toUpperCase() === "USD") return "USD";
  if (s === "฿" || s.toUpperCase() === "THB") return "THB";
  if (s === "€" || s.toUpperCase() === "EUR") return "EUR";
  return s.replace(/[^A-Za-z]/g, "").toUpperCase() || "THB";
}

export function parseLedgerEntry(text: string): ParsedLedgerEntry {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00A0/g, " ").trimEnd())
    .filter(Boolean);

  if (lines.length < 2)
    throw new Error(
      "Ledger entry must include a header and at least one posting."
    );

  // Header: YYYY/MM/DD or YYYY-MM-DD + payee
  const h = lines[0].match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})\s+(.+)$/);
  if (!h) throw new Error("Invalid header line (expected 'YYYY/MM/DD Payee').");
  const date = `${h[1]}-${h[2]}-${h[3]}`; // normalize to YYYY-MM-DD
  const payee = h[4];

  // Posting: 'Account:Sub   $12.34' (may be negative)
  const postingRe = new RegExp(
    String.raw`^\s*([A-Za-z][A-Za-z0-9:+\- ]*)\s+(-?)(\$|฿|USD|THB|EUR)?\s*(\d+\.\d{2})\s*$`,
    "i"
  );

  const postings: LedgerPosting[] = [];
  let primaryCurrency: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(";")) continue; // skip comments
    const m = line.match(postingRe);
    if (!m) continue; // ignore non-posting lines
    const account = m[1].replace(/\s+/g, " ").trim();
    const sign = m[2] === "-" ? -1 : 1;
    const cur = normalizeCurrency(m[3]);
    const amt = parseFloat(m[4]) * sign;
    primaryCurrency ||= cur;
    postings.push({ account, amount: +amt.toFixed(2), currency: cur });
  }

  if (postings.length === 0) throw new Error("No postings parsed from entry.");

  const sum = +postings.reduce((s, p) => s + p.amount, 0).toFixed(2);
  if (Math.abs(sum) > 0.005)
    throw new Error(`Entry not balanced (sum=${sum.toFixed(2)})`);

  const negatives = postings
    .filter((p) => p.amount < 0)
    .reduce((s, p) => s + p.amount, 0);
  const amount = Math.abs(+negatives.toFixed(2));

  const exp = postings.find((p) => /^Expenses:/i.test(p.account));
  let business_name: string | null = null;
  if (exp) {
    const segs = exp.account.split(":");
    if (segs.length > 1) business_name = segs[1];
  }

  return {
    raw: text,
    date,
    payee,
    postings,
    amount,
    currency: primaryCurrency || "THB",
    business_name,
  };
}
