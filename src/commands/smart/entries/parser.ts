// ================================================
// FILE: src/commands/smart/entries/parser.ts
// SIMPLE VERSION - basic parsing only
// ================================================
import type { Dir, EntriesArgs, SortKey } from "./types";

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

// Date utility functions - timezone aware
function getTodayString(): string {
  const now = new Date();
  // Use user's local timezone instead of UTC
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return localDate;
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // Use user's local timezone instead of UTC
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(yesterday);
  return localDate;
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

export function parseDateAlias(alias: string): {
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
            // console.log(`Parsed year alias: ${alias}`);
    return { year: alias };
  }

  if (MONTH_NAMES[lower]) {
            // console.log(`Parsed month alias: ${alias} -> ${parseMonthAlias(alias)}`);
    return { month: parseMonthAlias(alias) };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(alias)) {
    return { day: alias };
  }
  if (/^\d{4}-\d{2}$/.test(alias)) {
    return { month: alias };
  }

          // console.log(`No date alias match for: ${alias}`);
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

export function parseArgs(raw?: string): EntriesArgs {
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
  let account: string | undefined;
  let currency: string | undefined; // NEW: Currency filter
  let range: { start: string; end: string } | undefined;

  if (!raw) return { sort, dir, limit, sum, count };

  const parts = raw.trim().split(/\s+/).filter(Boolean);
  let hasExplicitLimit = false;

  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].toLowerCase();

    // Basic parsing - keep only what works
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
    if (t === "--business" && i + 1 < parts.length) {
      business = parts[i + 1];
      i++;
      continue;
    }
    if (t === "--account" && i + 1 < parts.length) {
      account = parts[i + 1];
      i++;
      continue;
    }
    // NEW: Currency filter parsing
    if (t === "--currency" && i + 1 < parts.length) {
      currency = parts[i + 1].toUpperCase();
      i++;
      continue;
    }
    // NEW: Currency filter parsing
    if (t === "--currency" && i + 1 < parts.length) {
      currency = parts[i + 1].toUpperCase();
      i++;
      continue;
    }
    if (t === "go" && i + 1 < parts.length) {
      go = parts[i + 1];
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
    if (/^\d+$/.test(t)) {
      limit = Math.max(1, Math.min(200, parseInt(t, 10)));
      hasExplicitLimit = true;
      continue;
    }

    // NEW: Support currency codes as standalone arguments (USD, EUR, etc.)
    if (/^[A-Z]{3}$/.test(t.toUpperCase()) && !currency) {
      currency = t.toUpperCase();
      continue;
    }

    // NEW: Support currency codes as standalone arguments (USD, EUR, etc.)
    if (/^[A-Z]{3}$/.test(t.toUpperCase()) && !currency) {
      currency = t.toUpperCase();
      continue;
    }

    // Date parsing (keep existing logic)
    if (!day && !month && !year && !range) {
      try {
        const dateAlias = parseDateAlias(parts[i]);
        if (dateAlias.day || dateAlias.month || dateAlias.year) {
          day = dateAlias.day;
          month = dateAlias.month;
          year = dateAlias.year;
          continue;
        }
      } catch (error) {
        // Ignore parsing errors
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
    account,
    currency, // NEW: Include currency in return
    go,
    range,
  };
}
