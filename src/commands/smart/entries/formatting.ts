// ================================================
// FILE: src/commands/smart/entries/formatting.ts
// SIMPLE VERSION - proven to work
// ================================================
import type { LedgerEntryData } from "./types";
import { currencySymbol } from "./currency";

export function formatEntryLine(entry: LedgerEntryData): string {
  const amt = Number(entry.amount) || 0;
  const entryId = Number(entry.id) || 0;
  const sym = currencySymbol(entry.currency);
  const status = entry.is_cleared ? " ✅" : " ⏳";

  // Extract business from entry_text pattern "Expenses:BusinessName:"
  let businessName = "";
  const businessMatch = entry.entry_text?.match(/Expenses:([^:]+):/);
  if (businessMatch && businessMatch[1] !== "Taxes") {
    businessName = businessMatch[1];
  }

  // SIMPLE mobile card - no currency badges yet
  const mobileCard = `<div class="block sm:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between mb-3">
      <div class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 flex-1 pr-3 leading-tight">${
        entry.description
      }</div>
      <div class="text-xl flex-shrink-0">${status.trim()}</div>
    </div>
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">${
        entry.entry_date
      }</div>
      <div class="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">${sym}${amt.toFixed(
    2
  )}</div>
    </div>
    ${
      businessName
        ? `<div class="mb-4"><span class="inline-flex items-center text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">${businessName}</span></div>`
        : ""
    }
    <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800"><a href="/ledger/entry/${entryId}" class="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">View Entry #${entryId} <span class="ml-1">→</span></a></div>
  </div>`;

  // SIMPLE desktop item
  const businessTag = businessName ? ` \`${businessName}\`` : "";
  const desktopItem = `<div class="hidden sm:block markdown-content">

${entry.entry_date} • **${
    entry.description
  }**${businessTag} — **${sym}${amt.toFixed(
    2
  )}**${status} → [#${entryId}](/ledger/entry/${entryId})

</div>`;

  return mobileCard + "\n" + desktopItem;
}
