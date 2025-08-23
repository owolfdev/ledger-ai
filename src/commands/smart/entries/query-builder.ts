/* eslint-disable @typescript-eslint/no-explicit-any */
// ================================================
// FILE: src/commands/smart/entries/query-builder.ts
// FIXED VERSION - Case-insensitive account filtering
// ================================================
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@/types/user";
import type { EntriesArgs } from "./types";

export class QueryBuilder {
  constructor(private supabase: SupabaseClient) {}

  private applyDateFilters(query: any, args: EntriesArgs) {
    // Range has highest priority
    if (args.range) {
      return query
        .gte("entry_date", args.range.start)
        .lte("entry_date", args.range.end);
    }

    // Day filter (specific date)
    if (args.day) {
      return query.eq("entry_date", args.day);
    }

    // Month filter (YYYY-MM format)
    if (args.month) {
      const startOfMonth = `${args.month}-01`;
      // Calculate last day of month
      const [year, month] = args.month.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const endOfMonth = `${args.month}-${lastDay.toString().padStart(2, "0")}`;
      return query
        .gte("entry_date", startOfMonth)
        .lte("entry_date", endOfMonth);
    }

    // Year filter (YYYY format)
    if (args.year) {
      const startOfYear = `${args.year}-01-01`;
      const endOfYear = `${args.year}-12-31`;
      return query.gte("entry_date", startOfYear).lte("entry_date", endOfYear);
    }

    return query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyCommonFilters(query: any, args: EntriesArgs, user: User | null) {
    // User filter
    if (user?.id) {
      query = query.eq("user_id", user.id);
    }

    // Business filter
    if (args.business) {
      query = query.like("entry_text", `%Expenses:${args.business}:%`);
    }

    // Account filter - FIXED: Now case-insensitive
    if (args.account) {
      query = query.ilike("entry_text", `%${args.account}%`);
    }

    // Currency filter
    if (args.currency) {
      query = query.eq("currency", args.currency);
    }

    // Vendor filter
    if (args.vendor) {
      query = query.ilike("description", `%${args.vendor}%`);
    }

    // Apply date filters
    query = this.applyDateFilters(query, args);

    return query;
  }

  buildListQuery(args: EntriesArgs, user: User | null) {
    let query = this.supabase
      .from("ledger_entries")
      .select(
        "id, entry_date, description, amount, currency, is_cleared, entry_text"
      );

    // Apply all filters
    query = this.applyCommonFilters(query, args, user);

    // Add ordering and limit
    const orderCol = args.sort === "created" ? "created_at" : "entry_date";
    query = query
      .order(orderCol, { ascending: args.dir === "asc" })
      .order("id", { ascending: args.dir === "asc" })
      .limit(args.limit);

    return query;
  }

  buildCountQuery(args: EntriesArgs, user: User | null) {
    let query = this.supabase
      .from("ledger_entries")
      .select("*", { count: "exact", head: true });

    // Apply all filters
    query = this.applyCommonFilters(query, args, user);

    return query;
  }

  buildSumQuery(args: EntriesArgs, user: User | null) {
    let query = this.supabase.from("ledger_entries").select("amount, currency");

    // Apply all filters
    query = this.applyCommonFilters(query, args, user);

    return query;
  }
}
