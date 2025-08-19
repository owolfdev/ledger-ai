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
  currency?: string; // NEW: Currency filter
  go?: string;
  range?: { start: string; end: string };
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
