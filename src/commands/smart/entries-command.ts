// ================================================
// FILE: src/commands/smart/entries-command.ts
// PURPOSE: List ledger entries from Supabase with links to /ledger/entry/:id
// ================================================
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/types/user";

export type EntriesArgs = {
  limit?: number; // default 20
  sort?: "date" | "created" | "amount";
  dir?: "asc" | "desc";
};

function parseArgs(raw: string): EntriesArgs {
  const out: EntriesArgs = { limit: 20, sort: "date", dir: "desc" };
  if (!raw) return out;
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].toLowerCase();
    if (/^\d+$/.test(t)) {
      out.limit = Math.max(1, Math.min(200, parseInt(t, 10)));
      continue;
    }
    if (t === "--asc" || t === "asc") {
      out.dir = "asc";
      continue;
    }
    if (t === "--desc" || t === "desc") {
      out.dir = "desc";
      continue;
    }
    if (t.startsWith("--sort=")) {
      const v = t.split("=")[1] as EntriesArgs["sort"];
      if (v) out.sort = v;
      continue;
    }
    if (t === "--sort" && parts[i + 1]) {
      const v = parts[++i].toLowerCase();
      if (v === "date" || v === "created" || v === "amount") {
        out.sort = v as "date" | "created" | "amount";
        continue;
      }
    }
  }
  return out;
}

function currencySymbol(currency?: string) {
  if (!currency || currency === "") return "฿"; // legacy fallback
  if (currency === "THB") return "฿";
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return currency; // show code for other currencies
}

export async function entriesListCommand(
  arg: string,
  _pageCtx?: string,
  _commands?: unknown,
  user?: User | null
): Promise<string> {
  const { limit = 20, sort = "date", dir = "desc" } = parseArgs(arg);
  const supabase = createClient();

  // Build query
  let query = supabase
    .from("ledger_entries")
    .select("id, entry_date, description, amount, currency, is_cleared")
    .order(
      sort === "created"
        ? "created_at"
        : sort === "amount"
        ? "amount"
        : "entry_date",
      { ascending: dir === "asc" }
    )
    .limit(limit);

  if (user?.id) query = query.eq("user_id", user.id);

  const { data, error } = await query;
  if (error) {
    return `<my-alert message="Failed to fetch entries: ${error.message}" />`;
  }
  if (!data || data.length === 0) return "No entries found.";

  const lines = data.map((e) => {
    const amt = Number(e.amount);
    const sym = currencySymbol(e.currency);
    const cleared = e.is_cleared ? " ✅" : "";
    return `- ${e.entry_date} • ${e.description} — ${sym}${amt.toFixed(
      2
    )}${cleared} → [/ledger/entry/${e.id}](/ledger/entry/${e.id})`;
  });

  return [
    `Showing **${data.length}** entr${
      data.length === 1 ? "y" : "ies"
    } (sort: ${sort} ${dir}, limit: ${limit})`,
    "",
    ...lines,
  ].join("\n");
}
