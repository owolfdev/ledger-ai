// ================================================
// FILE: src/commands/smart/entries/formatting.ts
// REFACTORED - Pure HTML with business logic separation
// ================================================
import type { LedgerEntryData } from "./types";
import { formatCurrencyWithSymbol } from "@/lib/utils/currency-format";

/**
 * Extracts business name from ledger entry_text using account hierarchy pattern
 * @param entryText - The full ledger entry text containing account information
 * @returns Business name or empty string if none found
 */
function extractBusinessName(entryText?: string | null): string {
  if (!entryText) return "";

  const businessMatch = entryText.match(/Expenses:([^:]+):/);
  if (businessMatch && businessMatch[1] !== "Taxes") {
    return businessMatch[1];
  }

  return "";
}

/**
 * Sanitizes string for safe use in HTML attributes
 * @param str - String to sanitize
 * @returns Sanitized string with quotes escaped
 */
function sanitizeForAttribute(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Converts ledger entry data to normalized component props
 * @param entry - Raw ledger entry from database
 * @returns Normalized props object for entry components
 */
function normalizeEntryProps(entry: LedgerEntryData) {
  const amount = Number(entry.amount) || 0;
  const entryId = Number(entry.id) || 0;
  const businessName = extractBusinessName(entry.entry_text);

  return {
    id: entryId,
    date: entry.entry_date,
    description: sanitizeForAttribute(entry.description),
    amount,
    currency: entry.currency || "USD",
    business: businessName,
    isCleared: entry.is_cleared,
  };
}

/**
 * Formats a single ledger entry for terminal display using pure HTML
 * @param entry - Ledger entry data from database
 * @returns HTML string for terminal rendering without markdown conflicts
 */
export function formatEntryLine(entry: LedgerEntryData): string {
  const amt = Number(entry.amount) || 0;
  const entryId = Number(entry.id) || 0;
  const status = entry.is_cleared ? " ✅" : " ⏳";
  const businessName = extractBusinessName(entry.entry_text);

  // Mobile card component
  const mobileCard = `<div class="block sm:hidden mb-2">
    <div class="flex items-start justify-between mb-1">
      <div class="font-medium text-base flex-1 pr-2"> <a href="/ledger/entry/${entryId}">${sanitizeForAttribute(
    entry.description
  )}</a></div>
      <div class="font-semibold text-base text-accent">${formatCurrencyWithSymbol(
        amt,
        entry.currency || "USD"
      )}</div>
    </div>
    <div class="text-sm text-muted-foreground flex items-center gap-2">
      <span>${entry.entry_date}</span>
      <span>•</span>
      <span>#${entryId}</span>
      ${businessName ? `<span>•</span><span>${businessName}</span>` : ""}
    </div>
  </div>`;

  // Desktop list item with pure HTML styling
  const businessTag = businessName
    ? ` <span class="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded font-mono">${businessName}</span>`
    : "";

  const desktopItem = `<div class="hidden sm:block mb-1">
    <span class="text-foreground">${entry.entry_date} • </span>
    <strong class="font-bold text-accent">${sanitizeForAttribute(
      entry.description
    )}</strong>
    ${businessTag}
    <span class="text-foreground"> — </span>
    <strong class="font-bold text-accent">${formatCurrencyWithSymbol(
      amt,
      entry.currency || "USD"
    )}</strong>
    <span class="text-foreground">${status} → </span>
    <a href="/ledger/entry/${entryId}" class="text-blue-600 dark:text-blue-400 hover:underline">#${entryId}</a>
  </div>`;

  return mobileCard + "\n" + desktopItem;
}

/**
 * Formats multiple entries with optional header
 * @param entries - Array of ledger entries
 * @param header - Optional header text for the entry list
 * @returns Formatted string with header and all entries
 */
export function formatEntryList(
  entries: LedgerEntryData[],
  header?: string
): string {
  const formattedEntries = entries.map(formatEntryLine);

  if (header) {
    return [header, "", ...formattedEntries].join("\n");
  }

  return formattedEntries.join("\n");
}

/**
 * Creates a summary header for entry lists
 * @param count - Number of entries
 * @param filterDescription - Description of applied filters
 * @param sortInfo - Sorting information
 * @returns Formatted header string
 */
export function createEntryListHeader(
  count: number,
  filterDescription: string = "",
  sortInfo: { sort: string; dir: string; limit: number }
): string {
  return `Showing **${count}** entries (sort: ${sortInfo.sort} ${sortInfo.dir}, limit: ${sortInfo.limit}${filterDescription})`;
}
