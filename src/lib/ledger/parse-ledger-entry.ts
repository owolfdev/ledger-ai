// src/lib/ledger/parse-ledger-entry.ts

export interface ParsedLedgerEntry {
  date: string; // YYYY-MM-DD
  payee: string;
  amount: number;
  expense_account: string;
  asset_account: string;
  currency: string;
  business_name?: string; // e.g. 'Personal', 'Channel60'
}

function normalizeCurrency(input: string | undefined | null): string {
  if (!input || input === "") return "THB";
  const symbol = input.trim();
  if (symbol === "$" || symbol.toUpperCase() === "USD") return "USD";
  if (symbol === "฿" || symbol.toUpperCase() === "THB") return "THB";
  if (symbol === "€" || symbol.toUpperCase() === "EUR") return "EUR";
  // Add more as needed
  return symbol.replace(/[^A-Za-z]/g, "").toUpperCase();
}

export function parseLedgerEntry(entry: string): ParsedLedgerEntry {
  const lines = entry
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2)
    throw new Error(
      "Ledger entry must have header and at least one posting line."
    );

  // 1st line: date + payee
  const headerRegex = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})\s+(.+)$/;
  const headerMatch = lines[0].match(headerRegex);
  if (!headerMatch) throw new Error("Invalid header line (date and payee)");

  const date = `${headerMatch[1]}-${headerMatch[2]}-${headerMatch[3]}`;
  const payee = headerMatch[4];

  // Account line: Account:Sub1:Sub2   [currency]amount
  // Example: "Expenses:Personal:Food:Coffee    $5.00"
  const accountLineRegex =
    /^([A-Za-z0-9:\-]+)\s+(-?)(\$|฿|THB|USD|EUR)?\s*([\d,.]+)/i;

  let expense_account = "";
  let asset_account = "";
  let amount = 0;
  let currency = "THB"; // fallback default
  let business_name = "Personal"; // fallback

  for (const line of lines.slice(1)) {
    const match = line.match(accountLineRegex);
    if (!match) continue;

    const account = match[1];
    const sign = match[2];
    const currencyMatch = match[3];
    const amtRaw = match[4].replace(/,/g, "");

    // Prefer explicit, else fallback
    if (currencyMatch) {
      currency = normalizeCurrency(currencyMatch);
    } else {
      currency = "THB";
    }

    const amtValue = parseFloat(amtRaw);
    if (sign === "-") {
      asset_account = account;
    } else {
      expense_account = account;
      amount = amtValue;

      // Business: always 2nd segment in Expenses:Business:...
      const segs = account.split(":");
      if (segs.length > 1 && segs[0] === "Expenses") {
        business_name = segs[1];
      }
    }
  }

  if (!expense_account || !asset_account || !amount) {
    throw new Error("Could not parse accounts/amounts from entry");
  }

  return {
    date,
    payee,
    amount,
    expense_account,
    asset_account,
    currency,
    business_name,
  };
}
