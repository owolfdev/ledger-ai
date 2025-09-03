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

  private applyCreatedDateFilters(query: any, args: EntriesArgs) {
    // Created range has highest priority
    if (args.createdRange) {
      return query
        .gte("created_at", args.createdRange.start)
        .lte("created_at", args.createdRange.end);
    }

    // Created day filter (specific date)
    if (args.createdDay) {
      const startOfDay = `${args.createdDay}T00:00:00.000Z`;
      const endOfDay = `${args.createdDay}T23:59:59.999Z`;
      return query.gte("created_at", startOfDay).lte("created_at", endOfDay);
    }

    // Created month filter (YYYY-MM format)
    if (args.createdMonth) {
      const startOfMonth = `${args.createdMonth}-01T00:00:00.000Z`;
      // Calculate last day of month
      const [year, month] = args.createdMonth.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const endOfMonth = `${args.createdMonth}-${lastDay
        .toString()
        .padStart(2, "0")}T23:59:59.999Z`;
      return query
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth);
    }

    // Created year filter (YYYY format)
    if (args.createdYear) {
      const startOfYear = `${args.createdYear}-01-01T00:00:00.000Z`;
      const endOfYear = `${args.createdYear}-12-31T23:59:59.999Z`;
      return query.gte("created_at", startOfYear).lte("created_at", endOfYear);
    }

    return query;
  }

  private applyAmountFilters(query: any, args: EntriesArgs) {
    // Amount range has highest priority
    if (args.amountRange) {
      return query
        .gte("amount", args.amountRange.min)
        .lte("amount", args.amountRange.max);
    }

    // Exact amount filter
    if (args.amount !== undefined) {
      return query.eq("amount", args.amount);
    }

    // Min amount filter
    if (args.minAmount !== undefined) {
      query = query.gte("amount", args.minAmount);
    }

    // Max amount filter
    if (args.maxAmount !== undefined) {
      query = query.lte("amount", args.maxAmount);
    }

    return query;
  }

  private applyCommonFilters(query: any, args: EntriesArgs, user: User | null) {
    // User filter
    if (user?.id) {
      query = query.eq("user_id", user.id);
    }

    // Filter out deleted entries
    query = query.eq("is_deleted", false);

    // Business filter - Allow partial matching for better UX
    if (args.business) {
      query = query.ilike("entry_text", `%Expenses:%${args.business}%`);
    }

    // Account filter - FIXED: Now case-insensitive
    if (args.account) {
      query = query.ilike("entry_text", `%${args.account}%`);
    }

    // Currency filter
    if (args.currency) {
      query = query.ilike("currency", args.currency);
    }

    // Vendor filter
    if (args.vendor) {
      query = query.ilike("description", `%${args.vendor}%`);
    }

    // Apply date filters
    query = this.applyDateFilters(query, args);

    // Apply created date filters
    query = this.applyCreatedDateFilters(query, args);

    // Apply amount filters
    query = this.applyAmountFilters(query, args);

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
      .select("id", { count: "exact", head: true });

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
