// ================================================
// FILE: src/commands/smart/entries-command.ts
// PURPOSE: List ledger entries with business filtering
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
  count: boolean;
  vendor?: string;
  month?: string;
  business?: string;
}

function parseArgs(raw?: string): EntriesArgs {
  let sort: SortKey = "date";
  let dir: Dir = "desc";
  let limit = 20;
  let sum = false;
  let count = false;
  let vendor: string | undefined;
  let month: string | undefined;
  let business: string | undefined;

  if (!raw) return { sort, dir, limit, sum, count };

  const parts = raw.trim().split(/\s+/).filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].toLowerCase();

    if (t === "date" || t === "created") {
      sort = t as SortKey;
      continue;
    }
    if (t === "asc") {
      dir = "asc";
      continue;
    }
    if (t === "desc") {
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
    if (t === "--vendor" && i + 1 < parts.length) {
      vendor = parts[i + 1];
      i++;
      continue;
    }
    if (t === "--month" && i + 1 < parts.length) {
      month = parts[i + 1];
      i++;
      continue;
    }
    if (t === "--business" && i + 1 < parts.length) {
      business = parts[i + 1];
      i++;
      continue;
    }
    if (/^\d+$/.test(t)) {
      limit = Math.max(1, Math.min(200, parseInt(t, 10)));
      continue;
    }
  }

  return { sort, dir, limit, sum, count, vendor, month, business };
}

function currencySymbol(currency?: string | null) {
  if (!currency || currency === "") return "฿";
  if (currency === "THB") return "฿";
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return currency;
}

export async function entriesListCommand(
  arg?: string,
  _pageCtx?: string,
  _set?: Record<string, CommandMeta>,
  user?: User | null
): Promise<string> {
  const args = parseArgs(arg);
  const supabase = createClient();

  try {
    // Step 1: Start with basic query (no business_id lookup needed)
    console.log("Building base query...");
    let query = supabase
      .from("ledger_entries")
      .select(
        "id, entry_date, description, amount, currency, is_cleared, entry_text"
      );

    // Step 2: Add user filter if exists
    if (user?.id) {
      console.log("Adding user filter:", user.id);
      query = query.eq("user_id", user.id);
    }

    // Step 3: Add business filter using account name pattern
    if (args.business) {
      console.log("Adding business filter via account pattern:", args.business);
      // Filter by entries that contain "Expenses:{BusinessName}:" in entry_text
      query = query.like("entry_text", `%Expenses:${args.business}:%`);
    }

    // Step 4: Add other filters
    if (args.vendor) {
      console.log("Adding vendor filter:", args.vendor);
      query = query.ilike("description", `%${args.vendor}%`);
    }

    if (args.month) {
      console.log("Adding month filter:", args.month);
      const [yearStr, monthStr] = args.month.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];
      console.log(`Month filter: ${startDate} to ${endDate}`);
      query = query.gte("entry_date", startDate).lte("entry_date", endDate);
    }

    // Step 5: Count mode
    if (args.count) {
      console.log("Executing count query...");
      let countQuery = supabase
        .from("ledger_entries")
        .select("*", { count: "exact", head: true });

      if (user?.id) {
        countQuery = countQuery.eq("user_id", user.id);
      }
      if (args.business) {
        countQuery = countQuery.like(
          "entry_text",
          `%Expenses:${args.business}:%`
        );
      }
      if (args.vendor) {
        countQuery = countQuery.ilike("description", `%${args.vendor}%`);
      }
      if (args.month) {
        const [yearStr, monthStr] = args.month.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startDate = firstDay.toISOString().split("T")[0];
        const endDate = lastDay.toISOString().split("T")[0];
        countQuery = countQuery
          .gte("entry_date", startDate)
          .lte("entry_date", endDate);
      }

      const { count, error } = await countQuery;

      if (error) {
        console.error("Count query error:", error);
        return `<my-alert message="Failed to count entries: ${error.message}" />`;
      }

      return (
        `**${count || 0}** entries` +
        (args.vendor ? ` matching "${args.vendor}"` : "") +
        (args.business ? ` for business "${args.business}"` : "") +
        (args.month ? ` in ${args.month}` : "")
      );
    }

    // Step 6: Add ordering and limits for data query
    const orderCol = args.sort === "created" ? "created_at" : "entry_date";
    console.log("Adding order and limit...");

    query = query
      .order(orderCol, { ascending: args.dir === "asc" })
      .order("id", { ascending: args.dir === "asc" })
      .limit(args.limit);

    // Step 7: Execute query
    console.log("Executing data query...");
    const { data, error } = await query;

    if (error) {
      console.error("Data query error:", error);
      return `<my-alert message="Failed to fetch entries: ${error.message}" />`;
    }

    if (!data || data.length === 0) {
      return "No entries found.";
    }

    // Step 8: Format results with business extracted from entry_text
    const lines = data.map((e) => {
      const amt = Number(e.amount);
      const sym = currencySymbol(e.currency);
      const cleared = e.is_cleared ? " ✅" : "";

      // Extract business from entry_text pattern "Expenses:BusinessName:"
      let businessName = "";
      const businessMatch = e.entry_text?.match(/Expenses:([^:]+):/);
      if (businessMatch && businessMatch[1] !== "Taxes") {
        businessName = ` [${businessMatch[1]}]`;
      }

      return `- ${e.entry_date} • ${
        e.description
      }${businessName} — ${sym}${amt.toFixed(2)}${cleared} → [/ledger/entry/${
        e.id
      }](/ledger/entry/${e.id})`;
    });

    // Step 9: Optional totals
    let totalsBlock = "";
    if (args.sum) {
      const total = data.reduce(
        (sum: number, r: { amount?: number | null }) =>
          sum + Number(r.amount || 0),
        0
      );
      totalsBlock = `\n\n**Total:** ฿${total.toFixed(2)}`;
    }

    const filterDesc =
      (args.business ? ` for ${args.business}` : "") +
      (args.vendor ? ` matching "${args.vendor}"` : "") +
      (args.month ? ` in ${args.month}` : "");

    return (
      [
        `Showing **${data.length}** entries (sort: ${args.sort} ${args.dir}, limit: ${args.limit}${filterDesc})`,
        "",
        ...lines,
      ].join("\n") + totalsBlock
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return `<my-alert message="Unexpected error: ${error}" />`;
  }
}
