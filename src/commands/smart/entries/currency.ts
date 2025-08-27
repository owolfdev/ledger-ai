// ================================================
// FILE: src/commands/smart/entries/currency.ts
// Enhanced with multi-currency totals
// ================================================
import type { LedgerEntryData } from "./types";
import {
  formatCurrencyWithSymbol,
  getCurrencySymbol,
} from "@/lib/utils/currency-format";

export function currencySymbol(currency?: string | null) {
  return getCurrencySymbol(currency || "");
}

// NEW: Currency grouping for totals
export interface CurrencyTotal {
  currency: string;
  amount: number;
  count: number;
}

export function groupByCurrency(
  entries: { amount: number | string; currency?: string | null }[]
): CurrencyTotal[] {
  const groups = new Map<string, CurrencyTotal>();

  entries.forEach((entry) => {
    const currency = entry.currency || "USD";
    const amount = Number(entry.amount) || 0;

    if (groups.has(currency)) {
      const existing = groups.get(currency)!;
      existing.amount += amount;
      existing.count += 1;
    } else {
      groups.set(currency, {
        currency,
        amount,
        count: 1,
      });
    }
  });

  return Array.from(groups.values()).sort(
    (a, b) => b.count - a.count // Sort by frequency (most common currency first)
  );
}

// NEW: Format multi-currency totals
export function formatTotals(currencyTotals: CurrencyTotal[]): string {
  if (currencyTotals.length === 0) return "";

  if (currencyTotals.length === 1) {
    const total = currencyTotals[0];
    return `\n\n**Total:** ${formatCurrencyWithSymbol(
      total.amount,
      total.currency
    )}`;
  }

  // Multiple currencies - show breakdown
  const lines = currencyTotals.map((total) => {
    return `  - ${formatCurrencyWithSymbol(total.amount, total.currency)} ${
      total.currency
    } (${total.count} entries)`;
  });

  return `\n\n**Totals by Currency:**\n${lines.join("\n")}`;
}
