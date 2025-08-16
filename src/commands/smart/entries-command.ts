// ================================================
// FILE: src/commands/smart/entries-command.ts
// PURPOSE: List ledger entries with business filtering + day/year support
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
  day?: string; // NEW: Single day filtering
  year?: string; // NEW: Year filtering
  business?: string;
  go?: string; // NEW: Navigate to specific entry by ID
}

function parseArgs(raw?: string): EntriesArgs {
  let sort: SortKey = "date";
  let dir: Dir = "desc";
  let limit = 20;
  let sum = false;
  let count = false;
  let vendor: string | undefined;
  let month: string | undefined;
  let day: string | undefined; // NEW
  let year: string | undefined; // NEW
  let go: string | undefined; // NEW
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
    // NEW: Day filtering
    if (t === "--day" && i + 1 < parts.length) {
      day = parts[i + 1];
      i++;
      continue;
    }
    // NEW: Year filtering
    if (t === "--year" && i + 1 < parts.length) {
      year = parts[i + 1];
      i++;
      continue;
    }
    // NEW: Go to specific entry
    if (t === "go" && i + 1 < parts.length) {
      go = parts[i + 1];
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

  return {
    sort,
    dir,
    limit,
    sum,
    count,
    vendor,
    month,
    day,
    year,
    business,
    go,
  };
}

// NEW: Helper function to build date filters
function buildDateFilter(args: EntriesArgs): {
  startDate?: string;
  endDate?: string;
  description: string;
} {
  // Priority: day > month > year (most specific wins)

  if (args.day) {
    // Single day: YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.day)) {
      throw new Error("Day format must be YYYY-MM-DD (e.g., 2025-08-01)");
    }
    return {
      startDate: args.day,
      endDate: args.day,
      description: `on ${args.day}`,
    };
  }

  if (args.month) {
    // Month range: YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(args.month)) {
      throw new Error("Month format must be YYYY-MM (e.g., 2025-08)");
    }
    const [yearStr, monthStr] = args.month.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = firstDay.toISOString().split("T")[0];
    const endDate = lastDay.toISOString().split("T")[0];

    return {
      startDate,
      endDate,
      description: `in ${args.month}`,
    };
  }

  if (args.year) {
    // Year range: YYYY
    if (!/^\d{4}$/.test(args.year)) {
      throw new Error("Year format must be YYYY (e.g., 2025)");
    }
    const year = parseInt(args.year);
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return {
      startDate,
      endDate,
      description: `in ${args.year}`,
    };
  }

  return { description: "" };
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
  user?: User | null,
  router?: { push: (route: string) => void } // NEW: Add router parameter
): Promise<string> {
  let args: EntriesArgs;

  try {
    args = parseArgs(arg);
  } catch (error) {
    return `<my-alert message="Invalid arguments: ${
      error instanceof Error ? error.message : error
    }" />`;
  }

  const supabase = createClient();

  // NEW: Handle 'go' mode - redirect to specific entry
  if (args.go) {
    const entryId = args.go;
    // Validate that it's a reasonable ID format (just numbers)
    if (!/^\d+$/.test(entryId)) {
      return `<my-alert message="Invalid entry ID: ${entryId}. ID must be numeric." />`;
    }

    // If router is available, perform actual navigation
    if (router) {
      router.push(`/ledger/entry/${entryId}`);
      return ""; // Return empty string since we're navigating away
    }

    // Fallback: return a link if no router available
    return `**Entry ${entryId}**: [/ledger/entry/${entryId}](/ledger/entry/${entryId})`;
  }

  try {
    // Step 1: Start with basic query
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
      query = query.like("entry_text", `%Expenses:${args.business}:%`);
    }

    // Step 4: Add vendor filter
    if (args.vendor) {
      console.log("Adding vendor filter:", args.vendor);
      query = query.ilike("description", `%${args.vendor}%`);
    }

    // Step 5: Add date filters (NEW: unified date handling)
    let dateDescription = "";
    try {
      const dateFilter = buildDateFilter(args);
      if (dateFilter.startDate && dateFilter.endDate) {
        console.log(
          `Adding date filter: ${dateFilter.startDate} to ${dateFilter.endDate}`
        );
        query = query
          .gte("entry_date", dateFilter.startDate)
          .lte("entry_date", dateFilter.endDate);
        dateDescription = dateFilter.description;
      }
    } catch (error) {
      return `<my-alert message="${
        error instanceof Error ? error.message : error
      }" />`;
    }

    // Step 6: Count mode (with optional sum)
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

      // Apply same date filter to count query
      try {
        const dateFilter = buildDateFilter(args);
        if (dateFilter.startDate && dateFilter.endDate) {
          countQuery = countQuery
            .gte("entry_date", dateFilter.startDate)
            .lte("entry_date", dateFilter.endDate);
        }
      } catch (error) {
        return `<my-alert message="${
          error instanceof Error ? error.message : error
        }" />`;
      }

      const { count, error } = await countQuery;

      if (error) {
        console.error("Count query error:", error);
        return `<my-alert message="Failed to count entries: ${error.message}" />`;
      }

      let result =
        `**${count || 0}** entries` +
        (args.vendor ? ` matching "${args.vendor}"` : "") +
        (args.business ? ` for business "${args.business}"` : "") +
        (dateDescription ? ` ${dateDescription}` : "");

      // NEW: Add sum to count mode if requested
      if (args.sum && count && count > 0) {
        console.log("Executing sum query for count mode...");
        let sumQuery = supabase.from("ledger_entries").select("amount");

        // Apply same filters as count query
        if (user?.id) {
          sumQuery = sumQuery.eq("user_id", user.id);
        }
        if (args.business) {
          sumQuery = sumQuery.like(
            "entry_text",
            `%Expenses:${args.business}:%`
          );
        }
        if (args.vendor) {
          sumQuery = sumQuery.ilike("description", `%${args.vendor}%`);
        }

        try {
          const dateFilter = buildDateFilter(args);
          if (dateFilter.startDate && dateFilter.endDate) {
            sumQuery = sumQuery
              .gte("entry_date", dateFilter.startDate)
              .lte("entry_date", dateFilter.endDate);
          }
        } catch (error) {
          return `<my-alert message="${
            error instanceof Error ? error.message : error
          }" />`;
        }

        const { data: sumData, error: sumError } = await sumQuery;

        if (sumError) {
          console.error("Sum query error:", sumError);
          result += ` (sum calculation failed: ${sumError.message})`;
        } else if (sumData) {
          const total = sumData.reduce(
            (sum: number, r: { amount?: number | null }) =>
              sum + Number(r.amount || 0),
            0
          );
          result += `\n\n**Total:** ฿${total.toFixed(2)}`;
        }
      }

      return result;
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

    // Step 9: Format results with business extracted from entry_text
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
      (dateDescription ? ` ${dateDescription}` : "");

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
