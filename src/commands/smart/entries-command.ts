// ================================================
// FILE: src/commands/smart/entries-command.ts
// PURPOSE: List ledger entries with responsive formatting
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
  day?: string;
  year?: string;
  business?: string;
  go?: string;
  range?: { start: string; end: string };
}

// Month name mapping
const MONTH_NAMES: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

// Date utility functions
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

function parseMonthAlias(monthName: string): string {
  const currentYear = getCurrentYear();
  const monthNum = MONTH_NAMES[monthName.toLowerCase()];
  if (!monthNum) {
    throw new Error(`Invalid month name: ${monthName}`);
  }
  return `${currentYear}-${monthNum}`;
}

function parseDateAlias(alias: string): {
  day?: string;
  month?: string;
  year?: string;
} {
  const lower = alias.toLowerCase();

  if (lower === "today") {
    return { day: getTodayString() };
  }
  if (lower === "yesterday") {
    return { day: getYesterdayString() };
  }

  if (/^\d{4}$/.test(alias)) {
    console.log(`Parsed year alias: ${alias}`);
    return { year: alias };
  }

  if (MONTH_NAMES[lower]) {
    console.log(`Parsed month alias: ${alias} -> ${parseMonthAlias(alias)}`);
    return { month: parseMonthAlias(alias) };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(alias)) {
    return { day: alias };
  }
  if (/^\d{4}-\d{2}$/.test(alias)) {
    return { month: alias };
  }

  console.log(`No date alias match for: ${alias}`);
  return {};
}

function parseRangeArguments(args: string[]): { start: string; end: string } {
  if (args.length !== 2) {
    throw new Error("Range requires exactly 2 arguments: start and end");
  }

  const [startArg, endArg] = args;

  let startDate: string;
  if (startArg.toLowerCase() === "today") {
    startDate = getTodayString();
  } else if (startArg.toLowerCase() === "yesterday") {
    startDate = getYesterdayString();
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(startArg)) {
    startDate = startArg;
  } else if (/^\d{4}-\d{2}$/.test(startArg)) {
    startDate = `${startArg}-01`;
  } else {
    throw new Error(`Invalid start date format: ${startArg}`);
  }

  let endDate: string;
  if (endArg.toLowerCase() === "today") {
    endDate = getTodayString();
  } else if (endArg.toLowerCase() === "yesterday") {
    endDate = getYesterdayString();
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(endArg)) {
    endDate = endArg;
  } else if (/^\d{4}-\d{2}$/.test(endArg)) {
    const [yearStr, monthStr] = endArg.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const lastDay = new Date(year, month, 0);
    endDate = lastDay.toISOString().split("T")[0];
  } else {
    throw new Error(`Invalid end date format: ${endArg}`);
  }

  return { start: startDate, end: endDate };
}

function parseArgs(raw?: string): EntriesArgs {
  let sort: SortKey = "date";
  let dir: Dir = "desc";
  let limit = 20;
  let sum = false;
  let count = false;
  let vendor: string | undefined;
  let month: string | undefined;
  let day: string | undefined;
  let year: string | undefined;
  let go: string | undefined;
  let business: string | undefined;
  let range: { start: string; end: string } | undefined;

  if (!raw) return { sort, dir, limit, sum, count };

  const parts = raw.trim().split(/\s+/).filter(Boolean);
  let hasExplicitLimit = false;

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
    if (t === "--day" && i + 1 < parts.length) {
      day = parts[i + 1];
      i++;
      continue;
    }
    if (t === "--year" && i + 1 < parts.length) {
      year = parts[i + 1];
      i++;
      continue;
    }
    if (t === "--range" && i + 2 < parts.length) {
      try {
        range = parseRangeArguments([parts[i + 1], parts[i + 2]]);
        i += 2;
        continue;
      } catch (error) {
        throw new Error(
          `Range parsing error: ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    }
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
      hasExplicitLimit = true;
      continue;
    }

    if (!day && !month && !year && !range) {
      try {
        const dateAlias = parseDateAlias(parts[i]);
        if (dateAlias.day || dateAlias.month || dateAlias.year) {
          console.log(`Applying date alias for "${parts[i]}":`, dateAlias);
          day = dateAlias.day;
          month = dateAlias.month;
          year = dateAlias.year;
          continue;
        }
      } catch (error) {
        console.log(`Date alias parsing failed for "${parts[i]}":`, error);
      }
    }
  }

  if (!hasExplicitLimit && year) {
    limit = 200;
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
    range,
  };
}

function buildDateFilter(args: EntriesArgs): {
  startDate?: string;
  endDate?: string;
  description: string;
} {
  if (args.range) {
    return {
      startDate: args.range.start,
      endDate: args.range.end,
      description: `from ${args.range.start} to ${args.range.end}`,
    };
  }

  if (args.day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.day)) {
      throw new Error("Day format must be YYYY-MM-DD (e.g., 2025-08-01)");
    }

    const today = getTodayString();
    const yesterday = getYesterdayString();
    let description = `on ${args.day}`;
    if (args.day === today) {
      description = "today";
    } else if (args.day === yesterday) {
      description = "yesterday";
    }

    return {
      startDate: args.day,
      endDate: args.day,
      description,
    };
  }

  if (args.month) {
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

    const monthName =
      Object.keys(MONTH_NAMES).find(
        (key) => MONTH_NAMES[key] === monthStr && key.length > 3
      ) || monthStr;

    return {
      startDate,
      endDate,
      description: `in ${monthName} ${year}`,
    };
  }

  if (args.year) {
    if (!/^\d{4}$/.test(args.year)) {
      throw new Error("Year format must be YYYY (e.g., 2025)");
    }
    const startDate = `${args.year}-01-01`;
    const endDate = `${args.year}-12-31`;

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

// Type for ledger entry from database
interface LedgerEntryData {
  id: number;
  entry_date: string;
  description: string;
  amount: string | number;
  currency: string;
  is_cleared: boolean;
  entry_text?: string | null;
}

// HTML for mobile, pure markdown for desktop
function formatEntryLine(entry: LedgerEntryData): string {
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

  // Mobile card (enhanced for better readability)
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

  // Desktop list item (pure markdown in a hidden div)
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

export async function entriesListCommand(
  arg?: string,
  _pageCtx?: string,
  _set?: Record<string, CommandMeta>,
  user?: User | null,
  router?: { push: (route: string) => void }
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

  // Handle 'go' mode - redirect to specific entry
  if (args.go) {
    const entryId = args.go;
    if (!/^\d+$/.test(entryId)) {
      return `<my-alert message="Invalid entry ID: ${entryId}. ID must be numeric." />`;
    }

    if (router) {
      router.push(`/ledger/entry/${entryId}`);
      return "";
    }

    return `**Entry ${entryId}**: [/ledger/entry/${entryId}](/ledger/entry/${entryId})`;
  }

  try {
    // Build query with all existing logic...
    console.log("Building base query...");
    let query = supabase
      .from("ledger_entries")
      .select(
        "id, entry_date, description, amount, currency, is_cleared, entry_text"
      );

    if (user?.id) {
      console.log("Adding user filter:", user.id);
      query = query.eq("user_id", user.id);
    }

    if (args.business) {
      console.log("Adding business filter via account pattern:", args.business);
      query = query.like("entry_text", `%Expenses:${args.business}:%`);
    }

    if (args.vendor) {
      console.log("Adding vendor filter:", args.vendor);
      query = query.ilike("description", `%${args.vendor}%`);
    }

    let dateDescription = "";
    try {
      const dateFilter = buildDateFilter(args);
      if (dateFilter.startDate && dateFilter.endDate) {
        console.log(
          `Adding date filter: ${dateFilter.startDate} to ${dateFilter.endDate}`
        );
        console.log(`Date description: ${dateFilter.description}`);
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

    // Count mode (existing logic)
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

      if (args.sum && count && count > 0) {
        console.log("Executing sum query for count mode...");
        let sumQuery = supabase.from("ledger_entries").select("amount");

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

    // Add ordering and limits for data query
    const orderCol = args.sort === "created" ? "created_at" : "entry_date";
    console.log("Adding order and limit...");

    query = query
      .order(orderCol, { ascending: args.dir === "asc" })
      .order("id", { ascending: args.dir === "asc" })
      .limit(args.limit);

    // Execute query
    console.log("Executing data query...");
    const { data, error } = await query;

    if (error) {
      console.error("Data query error:", error);
      return `<my-alert message="Failed to fetch entries: ${error.message}" />`;
    }

    if (!data || data.length === 0) {
      return "No entries found.";
    }

    // NEW: Responsive formatting with Tailwind
    const lines = data.map((entry) => formatEntryLine(entry));

    // Optional totals
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

    const formatInfo = ""; // Remove format indicator since both are present

    return (
      [
        `Showing **${data.length}** entries (sort: ${args.sort} ${args.dir}, limit: ${args.limit}${filterDesc})${formatInfo}`,
        "",
        ...lines,
      ].join("\n") + totalsBlock
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return `<my-alert message="Unexpected error: ${error}" />`;
  }
}
