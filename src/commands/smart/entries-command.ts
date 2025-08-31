/* eslint-disable @typescript-eslint/no-explicit-any */
// ================================================
// FILE: src/commands/smart/entries-command.ts
// REFACTORED - Standardized flag system and improved UX
// ================================================
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/types/user";
import type { CommandMeta } from "./utils";
import { parseArgs } from "./entries/parser";
import { QueryBuilder } from "./entries/query-builder";
import { formatEntryLine, createEntryListHeader } from "./entries/formatting";
import {
  groupByCurrency,
  formatTotals,
  calculateAccountFilteredTotals,
  formatAccountFilteredTotals,
} from "./entries/currency";

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
        return `<custom-alert message="Invalid entry ID: ${entryId}. ID must be numeric." />`;
      }
      if (router) {
        router.push(`/ledger/entry/${entryId}`);
        return "";
      }
      return `**Entry ${entryId}**: [/ledger/entry/${entryId}](/ledger/entry/${entryId})`;
    }

    // Handle entry tags mode
    if (args.entry) {
      const entryId = args.entry;
      if (!/^\d+$/.test(entryId)) {
        return `<custom-alert message="Invalid entry ID: ${entryId}. ID must be numeric." />`;
      }

      try {
        const supabase = createClient();

        // Fetch the entry details
        const { data: entry, error: entryError } = await supabase
          .from("ledger_entries")
          .select("*")
          .eq("id", entryId)
          .eq("user_id", user?.id)
          .single();

        if (entryError || !entry) {
          return `Entry ${entryId} not found.`;
        }

        // Fetch postings for this entry
        const { data: postings } = await supabase
          .from("ledger_postings")
          .select("*")
          .eq("entry_id", entryId)
          .order("sort_order", { ascending: true });

        // Format the output
        const entryDate = new Date(entry.entry_date).toLocaleDateString(
          "en-CA"
        );

        let output = `**Entry ${entryId}**: ${entry.description} (${entryDate})\n\n`;
        output += `**Postings**:\n`;

        if (postings && postings.length > 0) {
          postings.forEach((posting) => {
            // Format the amount with proper sign and currency
            const amount = parseFloat(posting.amount);
            const sign = amount >= 0 ? "+" : "";
            const formattedAmount = `${sign}${amount.toFixed(2)}฿`;

            output += `- **${posting.id}**: ${posting.account} ${formattedAmount}\n`;
          });
        } else {
          output += `- (no postings found)\n`;
        }

        return output;
      } catch (error) {
        return `Failed to fetch entry ${entryId}: ${error}`;
      }
    }

    const supabase = createClient();
    const queryBuilder = new QueryBuilder(supabase);

    // Count mode
    if (args.count) {
      let count = 0;
      let filteredData: any[] = [];

      // Always fetch entries first for count mode to ensure we have data for totaling
      const query = queryBuilder.buildListQuery(args, user ?? null);
      const { data, error } = await query;

      if (error) {
        return `<custom-alert message="Failed to fetch entries: ${error.message}" />`;
      }

      if (!data || data.length === 0) {
        return "No entries found.";
      }

      // Use the data as is for account filtering
      filteredData = data;

      count = filteredData.length;

      let result =
        `**${count}** entries` +
        (args.vendor ? ` matching "${args.vendor}"` : "") +
        (args.business ? ` for business "${args.business}"` : "") +
        (args.account ? ` with account "${args.account}"` : "") +
        (args.currency ? ` in ${args.currency}` : "");

      // Add account summary when using --account without --sum
      if (args.account && !args.sum && count > 0) {
        const accountFilteredTotals = await calculateAccountFilteredTotals(
          filteredData.map((entry) => entry.id),
          args.account
        );

        if (accountFilteredTotals.length > 0) {
          const totalPostings = accountFilteredTotals.reduce(
            (sum, total) => sum + total.count,
            0
          );
          result += `\n\ntotal postings (${totalPostings} postings with the account "${args.account}") in entries`;
        }
      }

      // Add sum if requested
      if (args.sum && count && count > 0) {
        if (args.account) {
          // Calculate account-filtered totals for account-filtered entries
          const accountFilteredTotals = await calculateAccountFilteredTotals(
            filteredData.map((entry) => entry.id),
            args.account
          );
          result += formatAccountFilteredTotals(
            accountFilteredTotals,
            args.account
          );
        } else {
          // Use regular sum query
          const sumQuery = queryBuilder.buildSumQuery(args, user ?? null);
          const { data: sumData, error: sumError } = await sumQuery;
          if (!sumError && sumData) {
            const currencyTotals = groupByCurrency(sumData);
            result += formatTotals(currencyTotals);
          }
        }
      }

      return result;
    }

    // List mode
    const query = queryBuilder.buildListQuery(args, user ?? null);
    const { data, error } = await query;

    if (error) {
      return `<custom-alert message="Failed to fetch entries: ${error.message}" />`;
    }

    if (!data || data.length === 0) {
      return "No entries found.";
    }

    // Use data as is
    let filteredData = data;

    // Get total count of matching entries (without limit) for accurate header
    const countQuery = queryBuilder.buildCountQuery(args, user ?? null);
    const { count: totalCount } = await countQuery;

    // Build filter description
    const filterDesc =
      (args.business ? ` for ${args.business}` : "") +
      (args.vendor ? ` matching "${args.vendor}"` : "") +
      (args.account ? ` with account "${args.account}"` : "") +
      (args.currency ? ` in ${args.currency}` : "");

    // Create header with total count
    const header = createEntryListHeader(
      totalCount || filteredData.length,
      filterDesc,
      {
        sort: args.sort,
        dir: args.dir,
        limit: args.limit,
      }
    );

    // Format entries with proper component separation
    const formattedEntries = filteredData.map((entry) =>
      formatEntryLine(entry)
    );

    // Add account summary when using --account without --sum
    let accountSummary = "";
    if (args.account && !args.sum) {
      // Count postings that match the account filter
      const accountFilteredTotals = await calculateAccountFilteredTotals(
        filteredData.map((entry) => entry.id),
        args.account
      );

      if (accountFilteredTotals.length > 0) {
        const totalPostings = accountFilteredTotals.reduce(
          (sum, total) => sum + total.count,
          0
        );
        accountSummary = `\n\ntotal postings (${totalPostings} postings with the account "${args.account}") in entries`;
      }
    }

    // Calculate totals if requested
    let totalsBlock = "";
    if (args.sum) {
      if (args.account) {
        // Calculate account-filtered totals for account-filtered entries
        const accountFilteredTotals = await calculateAccountFilteredTotals(
          filteredData.map((entry) => entry.id),
          args.account
        );
        totalsBlock = formatAccountFilteredTotals(
          accountFilteredTotals,
          args.account
        );
      } else {
        // Calculate regular entry totals
        const currencyTotals = groupByCurrency(filteredData);
        totalsBlock = formatTotals(currencyTotals);
      }
    }

    // Combine all parts with proper spacing for MDX component separation
    const parts = [
      header,
      "", // Empty line after header
      ...formattedEntries,
      "<div class='h-4'></div>",
    ];

    return parts.join("\n\n") + accountSummary + totalsBlock; // Double newlines for component separation
  } catch (error) {
    return `<custom-alert message="Unexpected error: ${error}" />`;
  }
}
