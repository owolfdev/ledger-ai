// ================================================
// FILE: src/commands/smart/entries-command.ts
// SIMPLE ORCHESTRATOR - proven patterns only
// ================================================
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/types/user";
import type { CommandMeta } from "./utils";

import { parseArgs } from "./entries/parser";
import { QueryBuilder } from "./entries/query-builder";
import { formatEntryLine } from "./entries/formatting";

export async function entriesListCommand(
  arg?: string,
  _pageCtx?: string,
  _set?: Record<string, CommandMeta>,
  user?: User | null,
  router?: { push: (route: string) => void }
): Promise<string> {
  try {
    const args = parseArgs(arg);

    // Handle 'go' mode
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

    const supabase = createClient();
    const queryBuilder = new QueryBuilder(supabase);

    // Count mode
    if (args.count) {
      const countQuery = queryBuilder.buildCountQuery(args, user ?? null);
      const { count, error } = await countQuery;

      if (error) {
        return `<my-alert message="Failed to count entries: ${error.message}" />`;
      }

      let result =
        `**${count || 0}** entries` +
        (args.vendor ? ` matching "${args.vendor}"` : "") +
        (args.business ? ` for business "${args.business}"` : "") +
        (args.account ? ` with account "${args.account}"` : "");

      // Simple sum (single currency for now)
      if (args.sum && count && count > 0) {
        const sumQuery = queryBuilder.buildSumQuery(args, user ?? null);
        const { data: sumData, error: sumError } = await sumQuery;

        if (!sumError && sumData) {
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
    // List mode
    const query = queryBuilder.buildListQuery(args, user ?? null);
    const { data, error } = await query;

    if (error) {
      return `<my-alert message="Failed to fetch entries: ${error.message}" />`;
    }

    if (!data || data.length === 0) {
      return "No entries found.";
    }

    const lines = data.map((entry) => formatEntryLine(entry));

    // Simple totals
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
      (args.account ? ` with account "${args.account}"` : "");

    return (
      [
        `Showing **${data.length}** entries (sort: ${args.sort} ${args.dir}, limit: ${args.limit}${filterDesc})`,
        "",
        ...lines,
      ].join("\n") + totalsBlock
    );
  } catch (error) {
    return `<my-alert message="Unexpected error: ${error}" />`;
  }
}

// ================================================
// BENEFITS OF STARTING SIMPLE:
// ================================================
// 1. WORKING FOUNDATION: Based on proven, working code
// 2. MODULAR STRUCTURE: Easy to enhance individual pieces
// 3. TESTABLE: Each module can be tested independently
// 4. INCREMENTAL: Add multi-currency features ONE AT A TIME
// 5. DEBUGGABLE: Issues isolated to specific modules

// ================================================
// ENHANCEMENT PATH:
// ================================================
// Phase 1: Get this simple version working
// Phase 2: Add currency filtering to parser.ts and query-builder.ts
// Phase 3: Add multi-currency totals to currency.ts
// Phase 4: Add currency badges to formatting.ts
// Phase 5: Test each enhancement independently
