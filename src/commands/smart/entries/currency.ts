// ================================================
// FILE: src/commands/smart/entries/currency.ts
// Enhanced with multi-currency totals
// ================================================
import type { LedgerEntryData } from "./types";
import {
  formatCurrencyWithSymbol,
  getCurrencySymbol,
} from "@/lib/utils/currency-format";
import { createClient } from "@/utils/supabase/client";

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

// NEW: Calculate account-specific totals for account-filtered entries
export async function calculateAccountFilteredTotals(
  entryIds: number[],
  accountFilter: string
): Promise<CurrencyTotal[]> {
  const supabase = createClient();
  const groups = new Map<string, CurrencyTotal>();

  try {
    // Get all postings for the filtered entries
    const { data: postings, error } = await supabase
      .from("ledger_postings")
      .select("id, entry_id, amount, currency, account")
      .in("entry_id", entryIds);

    if (error || !postings) {
      console.error("Error fetching postings for account totals:", error);
      return [];
    }

    // Calculate totals for each posting that matches the account filter
    postings.forEach((posting) => {
      // Only include postings that match the account filter (case-insensitive)
      if (posting.account.toLowerCase().includes(accountFilter.toLowerCase())) {
        const currency = posting.currency || "THB";
        const amount = Math.abs(Number(posting.amount)) || 0; // Use absolute value for expenses

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
      }
    });
  } catch (error) {
    console.error("Error calculating account-filtered totals:", error);
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
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

// NEW: Format account-filtered totals
export function formatAccountFilteredTotals(
  currencyTotals: CurrencyTotal[],
  accountFilter: string
): string {
  if (currencyTotals.length === 0) return "";

  if (currencyTotals.length === 1) {
    const total = currencyTotals[0];
    return `\n\n**Total in ${accountFilter} accounts:** ${formatCurrencyWithSymbol(
      total.amount,
      total.currency
    )} (${total.count} postings with the account "${accountFilter}")`;
  }

  // Multiple currencies - show breakdown
  const lines = currencyTotals.map((total) => {
    return `  - ${formatCurrencyWithSymbol(total.amount, total.currency)} ${
      total.currency
    } (${total.count} postings with the account "${accountFilter}")`;
  });

  return `\n\n**Total in ${accountFilter} accounts by Currency:**\n${lines.join(
    "\n"
  )}`;
}
