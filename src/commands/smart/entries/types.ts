// ================================================
// SIMPLE MODULAR ARCHITECTURE
// Based on the ORIGINAL WORKING version, split into focused modules
// ================================================

// ================================================
// FILE: src/commands/smart/entries/types.ts
// ================================================
export type SortKey = "date" | "created";
export type Dir = "asc" | "desc";

export interface EntriesArgs {
  sort: SortKey;
  dir: Dir;
  limit: number;
  sum: boolean;
  count: boolean;
  vendor?: string;
  month?: string;
  day?: string;
  year?: string;
  business?: string;
  account?: string;
  go?: string;
  range?: { start: string; end: string };
  // NO currency field yet - start simple
}

export interface LedgerEntryData {
  id: number;
  entry_date: string;
  description: string;
  amount: string | number;
  currency: string;
  is_cleared: boolean;
  entry_text?: string | null;
}
