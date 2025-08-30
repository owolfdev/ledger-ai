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

// NEW: Calculate item-specific totals for tagged items
export async function calculateTaggedItemTotals(
  entryIds: number[],
  tagNames: string[]
): Promise<CurrencyTotal[]> {
  const supabase = createClient();
  const groups = new Map<string, CurrencyTotal>();

  try {
    // Get all postings for the filtered entries
    const { data: postings, error } = await supabase
      .from("ledger_postings")
      .select("id, entry_id, amount, currency")
      .in("entry_id", entryIds);

    if (error || !postings) {
      console.error("Error fetching postings for item totals:", error);
      return [];
    }

    // Get tag IDs for the specified tag names
    const { data: tags, error: tagError } = await supabase
      .from("tags")
      .select("id, name")
      .in("name", tagNames);

    if (tagError || !tags) {
      console.error("Error fetching tags for item totals:", tagError);
      return [];
    }

    const tagIds = tags.map((tag) => tag.id);
    const tagNamesMap = new Map(tags.map((tag) => [tag.id, tag.name]));

    // Get postings that have the specified tags
    const { data: taggedPostings, error: postingTagError } = await supabase
      .from("posting_tags")
      .select("posting_id, tag_id")
      .in("tag_id", tagIds);

    if (postingTagError || !taggedPostings) {
      console.error(
        "Error fetching posting tags for item totals:",
        postingTagError
      );
      return [];
    }

    // Create a map of posting_id -> tag_names for quick lookup
    const postingTagsMap = new Map<string, string[]>();
    taggedPostings.forEach((pt) => {
      const postingId = pt.posting_id.toString();
      const tagName = tagNamesMap.get(pt.tag_id);
      if (tagName) {
        if (!postingTagsMap.has(postingId)) {
          postingTagsMap.set(postingId, []);
        }
        postingTagsMap.get(postingId)!.push(tagName);
      }
    });

    // Calculate totals for each tagged posting
    postings.forEach((posting) => {
      const postingId = posting.id.toString();
      const postingTags = postingTagsMap.get(postingId) || [];

      // Only include postings that have the requested tags
      if (postingTags.some((tagName) => tagNames.includes(tagName))) {
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
    console.error("Error calculating tagged item totals:", error);
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
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

// NEW: Format tagged item totals with item breakdown
export function formatTaggedItemTotals(
  currencyTotals: CurrencyTotal[],
  tagNames: string[]
): string {
  if (currencyTotals.length === 0) return "";

  const tagList = tagNames.join(", ");

  if (currencyTotals.length === 1) {
    const total = currencyTotals[0];
    return `\n\n**Total spent on ${tagList}:** ${formatCurrencyWithSymbol(
      total.amount,
      total.currency
    )} (${total.count} items)`;
  }

  // Multiple currencies - show breakdown
  const lines = currencyTotals.map((total) => {
    return `  - ${formatCurrencyWithSymbol(total.amount, total.currency)} ${
      total.currency
    } (${total.count} items)`;
  });

  return `\n\n**Total spent on ${tagList} by Currency:**\n${lines.join("\n")}`;
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
    )} (${total.count} postings)`;
  }

  // Multiple currencies - show breakdown
  const lines = currencyTotals.map((total) => {
    return `  - ${formatCurrencyWithSymbol(total.amount, total.currency)} ${
      total.currency
    } (${total.count} postings)`;
  });

  return `\n\n**Total in ${accountFilter} accounts by Currency:**\n${lines.join(
    "\n"
  )}`;
}
