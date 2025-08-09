// /lib/ledger/parse-manual-command.ts
// Parse a simple natural-language "new" command into a structured receipt shape.
// Examples:
//   "new coffee starbucks $4"
//   "new 2025/08/09 lunch @ mcdonalds 150 thb"
//   "new taxi 320"

export type NLParseResult = {
  date: string; // YYYY-MM-DD
  payee: string; // merchant/payee
  note?: string; // free text remainder
  currency: string; // ISO-ish ('THB', 'USD')
  receipt: {
    items: { description: string; price: number }[];
    subtotal: number | null;
    tax: number | null;
    total: number | null;
  };
};

// Normalize supported currency tokens → code
function normCurrency(tok?: string | null): string {
  if (!tok) return "THB";
  const t = tok.trim().toUpperCase();
  if (t === "$" || t === "USD") return "USD";
  if (t === "฿" || t === "THB") return "THB";
  if (t === "EUR" || t === "€") return "EUR";
  if (/^[A-Z]{3}$/.test(t)) return t;
  return "THB";
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function getLocalDateYYYYMMDD(d = new Date()): string {
  // Use local timezone
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Very small parser that looks for:
 * - optional date at start: YYYY/MM/DD or YYYY-MM-DD
 * - amount at end, with optional currency token before/after
 * - a payee token (after '@' or last capitalized token), fallback to first word after date
 * - the rest is treated as an item description
 */
export function parseManualNewCommand(raw: string): NLParseResult {
  const s = raw.trim().replace(/^new\s+/i, "");
  if (!s) throw new Error("Empty command");

  // 1) date (optional) at the beginning
  let rest = s;
  let date = getLocalDateYYYYMMDD();
  const mDate = rest.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})\b\s*/);
  if (mDate) {
    date = `${mDate[1]}-${mDate[2]}-${mDate[3]}`;
    rest = rest.slice(mDate[0].length);
  }

  // 2) amount (required) at the end; allow "150", "$4.00", "4 usd", "150 thb"
  const mAmt =
    rest.match(/\s([\$฿]|USD|THB|EUR)?\s*(-?\d+(?:\.\d{1,2})?)\s*$/i) ||
    rest.match(/\s(-?\d+(?:\.\d{1,2})?)\s*([\$฿]|USD|THB|EUR)\s*$/i);
  if (!mAmt) throw new Error("Amount not found");

  let cur: string;
  let amtStr: string;
  if (mAmt.length === 3 && /^(?:[\$฿]|USD|THB|EUR)$/i.test(mAmt[1] || "")) {
    cur = normCurrency(mAmt[1]);
    amtStr = mAmt[2];
  } else {
    cur = normCurrency(mAmt[2]);
    amtStr = mAmt[1];
  }
  const amount = Math.abs(parseFloat(amtStr));
  rest = rest.slice(0, rest.length - mAmt[0].length).trim();

  // 3) try to find payee after an '@' marker, else last token in rest, else fallback
  let payee = "Unknown";
  let desc = rest;
  const at = rest.match(/^(.*)\s@\s*(.+)$/);
  if (at) {
    desc = at[1].trim();
    payee = at[2].trim();
  } else {
    // heuristic: if multiple words, take last word as payee if capitalized, else first as desc
    const parts = rest.split(/\s+/);
    if (parts.length >= 2) {
      payee = parts[parts.length - 1];
      desc = parts.slice(0, -1).join(" ");
    } else {
      // single token: treat as desc, use 'Personal'
      payee = "Personal";
      desc = rest;
    }
  }

  const item = { description: desc || "Item", price: +amount.toFixed(2) };
  const receipt = {
    items: [item],
    subtotal: +amount.toFixed(2),
    tax: null,
    total: +amount.toFixed(2),
  } as NLParseResult["receipt"];

  return { date, payee, note: undefined, currency: cur, receipt };
}
