// ================================================
// FILE: src/commands/smart/entries/query-builder.ts
// SIMPLE VERSION - basic queries only
// ================================================
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@/types/user";
import type { EntriesArgs } from "./types";

export class QueryBuilder {
  constructor(private supabase: SupabaseClient) {}

  buildListQuery(args: EntriesArgs, user: User | null) {
    let query = this.supabase
      .from("ledger_entries")
      .select(
        "id, entry_date, description, amount, currency, is_cleared, entry_text"
      );

    // Simple filters only
    if (user?.id) {
      query = query.eq("user_id", user.id);
    }
    if (args.business) {
      query = query.like("entry_text", `%Expenses:${args.business}:%`);
    }
    if (args.account) {
      query = query.like("entry_text", `%${args.account}%`);
    }
    if (args.vendor) {
      query = query.ilike("description", `%${args.vendor}%`);
    }

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

    // Same simple filters
    if (user?.id) {
      query = query.eq("user_id", user.id);
    }
    if (args.business) {
      query = query.like("entry_text", `%Expenses:${args.business}:%`);
    }
    if (args.account) {
      query = query.like("entry_text", `%${args.account}%`);
    }
    if (args.vendor) {
      query = query.ilike("description", `%${args.vendor}%`);
    }

    return query;
  }

  buildSumQuery(args: EntriesArgs, user: User | null) {
    let query = this.supabase.from("ledger_entries").select("amount"); // Simple sum, no currency grouping yet

    // Same simple filters
    if (user?.id) {
      query = query.eq("user_id", user.id);
    }
    if (args.business) {
      query = query.like("entry_text", `%Expenses:${args.business}:%`);
    }
    if (args.account) {
      query = query.like("entry_text", `%${args.account}%`);
    }
    if (args.vendor) {
      query = query.ilike("description", `%${args.vendor}%`);
    }

    return query;
  }
}
