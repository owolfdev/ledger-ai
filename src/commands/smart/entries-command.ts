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
    // Step 1: Resolve business name to ID if provided
    let businessId: string | null = null;
    if (args.business) {
      console.log("Looking up business:", args.business);
      let businessQuery = supabase
        .from("businesses")
        .select("id")
        .eq("name", args.business);

      if (user?.id) {
        businessQuery = businessQuery.eq("user_id", user.id);
      }

      const { data: businessData, error: businessError } =
        await businessQuery.single();

      if (businessError || !businessData) {
        return `No business found with name: "${args.business}"`;
      }

      businessId = businessData.id;
      console.log("Found business ID:", businessId);
    }

    // Step 2: Start with basic query
    console.log("Building base query...");
    let query = supabase
      .from("ledger_entries")
      .select(
        "id, entry_date, description, amount, currency, is_cleared, businesses(name)"
      );

    // Step 3: Add user filter if exists
    if (user?.id) {
      console.log("Adding user filter:", user.id);
      query = query.eq("user_id", user.id);
    }

    // Step 4: Add business filter if provided
    if (businessId) {
      console.log("Adding business filter:", businessId);
      query = query.eq("business_id", businessId); // ← ADD the = query assignment
    }

    // Step 5: Add other filters
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

    // Step 6: Count mode
    if (args.count) {
      console.log("Executing count query...");
      let countQuery = supabase
        .from("ledger_entries")
        .select("*", { count: "exact", head: true });

      if (user?.id) {
        countQuery = countQuery.eq("user_id", user.id); // ADD = countQuery
      }
      if (businessId) {
        countQuery = countQuery.eq("business_id", businessId);
      }
      if (args.vendor) {
        countQuery = countQuery.ilike("description", `%${args.vendor}%`); // ADD = countQuery
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
          .lte("entry_date", endDate); // ADD = countQuery
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

    // Step 7: Add ordering and limits for data query
    const orderCol = args.sort === "created" ? "created_at" : "entry_date";
    console.log("Adding order and limit...");

    query = query
      .order(orderCol, { ascending: args.dir === "asc" })
      .order("id", { ascending: args.dir === "asc" })
      .limit(args.limit);

    // Step 8: Execute query
    console.log("Executing data query...");
    const { data, error } = await query;

    if (error) {
      console.error("Data query error:", error);
      return `<my-alert message="Failed to fetch entries: ${error.message}" />`;
    }

    if (!data || data.length === 0) {
      return "No entries found.";
    }

    // Step 9: Format results
    // Step 9: Format results (data is now properly typed)
    const lines = data.map((e) => {
      const amt = Number(e.amount);
      const sym = currencySymbol(e.currency);
      const cleared = e.is_cleared ? " ✅" : "";
      // Get first business from array (should only be one)
      const businessName = e.businesses?.[0]?.name
        ? ` [${e.businesses[0].name}]`
        : "";

      return `- ${e.entry_date} • ${
        e.description
      }${businessName} — ${sym}${amt.toFixed(2)}${cleared} → [/ledger/entry/${
        e.id
      }](/ledger/entry/${e.id})`;
    });
    // Step 10: Optional totals
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
