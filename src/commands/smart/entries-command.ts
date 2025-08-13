// ================================================
// FILE: src/commands/smart/entries-command.ts
// PURPOSE: List ledger entries from Supabase with links to /ledger/entry/:id
// Supports sort flags: `date` (default) or `created`, plus optional `asc|desc`, `[limit]`, `--sum`, and `--count`
// Examples:
//   ent                  -> date desc, limit 20
//   ent 50               -> date desc, limit 50
//   ent created          -> created_at desc, limit 20
//   ent created asc      -> created_at asc, limit 20
//   ent date 10 asc      -> date asc, limit 10
//   ent --sum            -> shows totals of listed rows
//   ent --count          -> shows only the total count (no entries listed)
//   ent created desc 50 --sum
//   ent count            -> alias for --count
// ================================================
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/types/user";
import type { CommandMeta } from "./utils";

export type SortKey = "date" | "created";
export type Dir = "asc" | "desc";

export interface EntriesArgs {
  sort: SortKey;
  dir: Dir;
  limit: number;
  sum: boolean;
  count: boolean; // NEW: count-only mode
}

function parseArgs(raw?: string): EntriesArgs {
  // defaults: newest first by transaction date
  let sort: SortKey = "date";
  let dir: Dir = "desc";
  let limit = 20;
  let sum = false;
  let count = false;

  if (!raw) return { sort, dir, limit, sum, count };

  const parts = raw.trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].toLowerCase();
    if (t === "date" || t === "created") {
      sort = t as SortKey;
      continue;
    }
    if (t === "asc" || t === "--asc") {
      dir = "asc";
      continue;
    }
    if (t === "desc" || t === "--desc") {
      dir = "desc";
      continue;
    }
    if (t === "sum" || t === "--sum") {
      sum = true;
      continue;
    }
    if (t === "count" || t === "--count") {
      count = true;
      continue;
    }
    if (/^\d+$/.test(t)) {
      limit = Math.max(1, Math.min(200, parseInt(t, 10)));
      continue;
    }
  }
  return { sort, dir, limit, sum, count };
}

function currencySymbol(currency?: string | null) {
  if (!currency || currency === "") return "฿"; // legacy fallback
  if (currency === "THB") return "฿";
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return currency; // fallback to code
}

// Match CommandMeta.content signature (all params optional)
export async function entriesListCommand(
  arg?: string,
  _pageCtx?: string,
  _set?: Record<string, CommandMeta>,
  user?: User | null
): Promise<string> {
  const { sort, dir, limit, sum, count } = parseArgs(arg);
  const supabase = createClient();

  // NEW: Count-only mode
  if (count) {
    let countQuery = supabase
      .from("ledger_entries")
      .select("*", { count: "exact", head: true });

    if (user?.id) countQuery = countQuery.eq("user_id", user.id);

    const { count: totalCount, error } = await countQuery;
    if (error)
      return `<my-alert message="Failed to count entries: ${error.message}" />`;

    return `**${totalCount || 0}** total entries`;
  }

  type Row = {
    id: number;
    entry_date: string;
    description: string;
    amount: number;
    currency: string | null;
    is_cleared: boolean | null;
  };

  const orderCol = sort === "created" ? "created_at" : "entry_date";

  let q = supabase
    .from("ledger_entries")
    .select("id, entry_date, description, amount, currency, is_cleared")
    .order(orderCol, { ascending: dir === "asc" })
    .order("id", { ascending: dir === "asc" }) // deterministic tiebreaker
    .limit(limit);

  if (user?.id) q = q.eq("user_id", user.id);

  const { data, error } = await q.returns<Row[]>();
  if (error)
    return `<my-alert message="Failed to fetch entries: ${error.message}" />`;
  if (!data || data.length === 0) return "No entries found.";

  const lines = data.map((e) => {
    const amt = Number(e.amount);
    const sym = currencySymbol(e.currency);
    const cleared = e.is_cleared ? " ✅" : "";
    return `- ${e.entry_date} • ${e.description} — ${sym}${amt.toFixed(
      2
    )}${cleared} → [/ledger/entry/${e.id}](/ledger/entry/${e.id})`;
  });

  // Optional totals
  let totalsBlock = "";
  if (sum) {
    const byCcy = new Map<string, number>();
    for (const r of data) {
      const ccy = (r.currency || "THB").toUpperCase();
      byCcy.set(ccy, (byCcy.get(ccy) || 0) + Number(r.amount || 0));
    }
    const entries = Array.from(byCcy.entries());
    if (entries.length === 1) {
      const [ccy, total] = entries[0];
      totalsBlock = `\n\n**Total:** ${currencySymbol(ccy)}${total.toFixed(
        2
      )} (${ccy})`;
    } else if (entries.length > 1) {
      const lines = entries
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(
          ([ccy, total]) =>
            `- ${ccy}: ${currencySymbol(ccy)}${total.toFixed(2)}`
        )
        .join("\n");
      totalsBlock = `\n\n**Totals by currency:**\n${lines}`;
    }
  }

  return (
    [
      `Showing **${data.length}** entr${
        data.length === 1 ? "y" : "ies"
      } (sort: ${sort} ${dir}, limit: ${limit})`,
      "",
      ...lines,
    ].join("\n") + totalsBlock
  );
}
