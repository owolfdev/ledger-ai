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
import { groupByCurrency, formatTotals } from "./entries/currency"; // NEW: Import currency functions

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
        (args.account ? ` with account "${args.account}"` : "") +
        (args.currency ? ` in ${args.currency}` : ""); // NEW: Currency description

      // Simple sum (single currency for now)
      if (args.sum && count && count > 0) {
        const sumQuery = queryBuilder.buildSumQuery(args, user ?? null);
        const { data: sumData, error: sumError } = await sumQuery;

        if (!sumError && sumData) {
          // NEW: Multi-currency sum calculation
          const currencyTotals = groupByCurrency(sumData);
          result += formatTotals(currencyTotals);
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

    // NEW: Multi-currency totals
    let totalsBlock = "";
    if (args.sum) {
      const currencyTotals = groupByCurrency(data);
      totalsBlock = formatTotals(currencyTotals);
    }

    const filterDesc =
      (args.business ? ` for ${args.business}` : "") +
      (args.vendor ? ` matching "${args.vendor}"` : "") +
      (args.account ? ` with account "${args.account}"` : "") +
      (args.currency ? ` in ${args.currency}` : ""); // NEW: Currency description

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
