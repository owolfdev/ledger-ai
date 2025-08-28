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
  calculateTaggedItemTotals,
  formatTaggedItemTotals,
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

    const supabase = createClient();
    const queryBuilder = new QueryBuilder(supabase);

    // Count mode
    if (args.count) {
      let count = 0;
      let filteredData: any[] = [];

      if (args.tags && args.tags.length > 0) {
        // For tag filtering, we need to fetch entries first, then filter and count
        const query = queryBuilder.buildListQuery(args, user ?? null);
        const { data, error } = await query;

        if (error) {
          return `<custom-alert message="Failed to fetch entries: ${error.message}" />`;
        }

        if (!data || data.length === 0) {
          return "No entries found.";
        }

        // Apply tag filtering (same logic as list mode)
        try {
          const supabase = createClient();

          // First get the tag IDs
          const { data: tagData, error: tagError } = await supabase
            .from("tags")
            .select("id")
            .in("name", args.tags);

          if (tagError || !tagData || tagData.length === 0) {
            console.error("Error fetching tags:", tagError);
            filteredData = [];
          } else {
            const tagIds = tagData.map((tag) => tag.id);

            // Get entry IDs from entry_tags table
            const entryTagsResult = await supabase
              .from("entry_tags")
              .select("entry_id")
              .in("tag_id", tagIds);

            // Get posting IDs from posting_tags table, then get their entry IDs
            const postingTagsResult = await supabase
              .from("posting_tags")
              .select("posting_id")
              .in("tag_id", tagIds);

            // Get entry IDs from postings
            let postingEntryIds: number[] = [];
            if (postingTagsResult.data && postingTagsResult.data.length > 0) {
              const postingIds = postingTagsResult.data.map(
                (row) => row.posting_id
              );
              const { data: postingEntries } = await supabase
                .from("ledger_postings")
                .select("entry_id")
                .in("id", postingIds);

              if (postingEntries) {
                postingEntryIds = postingEntries.map((row) => row.entry_id);
              }
            }

            if (entryTagsResult.error) {
              console.error(
                "Error fetching entry tags:",
                entryTagsResult.error
              );
            }
            if (postingTagsResult.error) {
              console.error(
                "Error fetching posting tags:",
                postingTagsResult.error
              );
            }

            // Combine entry IDs from both sources
            const taggedEntryIds = new Set<number>();

            if (entryTagsResult.data) {
              entryTagsResult.data.forEach((row: { entry_id: number }) =>
                taggedEntryIds.add(row.entry_id)
              );
            }

            // Add entry IDs from posting tags
            postingEntryIds.forEach((entryId) => taggedEntryIds.add(entryId));

            if (taggedEntryIds.size > 0) {
              const taggedEntryIdsArray = Array.from(taggedEntryIds);
              filteredData = data.filter((entry) =>
                taggedEntryIdsArray.includes(entry.id)
              );
            } else {
              filteredData = [];
            }
          }
        } catch (filterError) {
          console.error("Error in tag filtering for count:", filterError);
          filteredData = [];
        }

        count = filteredData.length;
      } else {
        // No tags - use regular count query
        const countQuery = queryBuilder.buildCountQuery(args, user ?? null);
        const { count: countResult, error } = await countQuery;

        if (error) {
          return `<custom-alert message="Failed to count entries: ${error.message}" />`;
        }

        count = countResult || 0;
      }

      let result =
        `**${count}** entries` +
        (args.vendor ? ` matching "${args.vendor}"` : "") +
        (args.business ? ` for business "${args.business}"` : "") +
        (args.account ? ` with account "${args.account}"` : "") +
        (args.currency ? ` in ${args.currency}` : "") +
        (args.tags ? ` with tags: ${args.tags.join(", ")}` : "");

      // Add sum if requested
      if (args.sum && count && count > 0) {
        if (args.tags && args.tags.length > 0) {
          // Calculate item-specific totals for tagged items
          const taggedItemTotals = await calculateTaggedItemTotals(
            filteredData.map((entry) => entry.id),
            args.tags
          );
          result += formatTaggedItemTotals(taggedItemTotals, args.tags);
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

    // NEW: Apply tag filtering after query execution
    let filteredData = data;
    if (args.tags && args.tags.length > 0) {
      console.log("Applying post-query tag filtering for:", args.tags);

      try {
        // Get entries that have the specified tags
        const supabase = createClient();

        // First get the tag IDs
        const { data: tagData, error: tagError } = await supabase
          .from("tags")
          .select("id")
          .in("name", args.tags);

        if (tagError || !tagData || tagData.length === 0) {
          console.error("Error fetching tags:", tagError);
          filteredData = [];
        } else {
          const tagIds = tagData.map((tag) => tag.id);

          // Get entry IDs from entry_tags table
          const entryTagsResult = await supabase
            .from("entry_tags")
            .select("entry_id")
            .in("tag_id", tagIds);

          // Get posting IDs from posting_tags table, then get their entry IDs
          const postingTagsResult = await supabase
            .from("posting_tags")
            .select("posting_id")
            .in("tag_id", tagIds);

          // Get entry IDs from postings
          let postingEntryIds: number[] = [];
          if (postingTagsResult.data && postingTagsResult.data.length > 0) {
            const postingIds = postingTagsResult.data.map(
              (row) => row.posting_id
            );
            const { data: postingEntries } = await supabase
              .from("ledger_postings")
              .select("entry_id")
              .in("id", postingIds);

            if (postingEntries) {
              postingEntryIds = postingEntries.map((row) => row.entry_id);
            }
          }

          if (entryTagsResult.error) {
            console.error("Error fetching entry tags:", entryTagsResult.error);
          }
          if (postingTagsResult.error) {
            console.error(
              "Error fetching posting tags:",
              postingTagsResult.error
            );
          }

          // Combine entry IDs from both sources
          const taggedEntryIds = new Set<number>();

          if (entryTagsResult.data) {
            entryTagsResult.data.forEach((row: { entry_id: number }) =>
              taggedEntryIds.add(row.entry_id)
            );
          }

          // Add entry IDs from posting tags
          postingEntryIds.forEach((entryId) => taggedEntryIds.add(entryId));

          if (taggedEntryIds.size > 0) {
            const taggedEntryIdsArray = Array.from(taggedEntryIds);
            filteredData = data.filter((entry) =>
              taggedEntryIdsArray.includes(entry.id)
            );
            console.log(
              `Filtered ${data.length} entries down to ${filteredData.length} tagged entries (from both entry and posting tags)`
            );
          } else {
            console.log("No entries found with the specified tags");
            filteredData = [];
          }
        }
      } catch (filterError) {
        console.error("Error in tag filtering:", filterError);
        // Keep original data if filtering fails
      }
    }

    // Build filter description
    const filterDesc =
      (args.business ? ` for ${args.business}` : "") +
      (args.vendor ? ` matching "${args.vendor}"` : "") +
      (args.account ? ` with account "${args.account}"` : "") +
      (args.currency ? ` in ${args.currency}` : "") +
      (args.tags ? ` with tags: ${args.tags.join(", ")}` : "");

    // Create header
    const header = createEntryListHeader(filteredData.length, filterDesc, {
      sort: args.sort,
      dir: args.dir,
      limit: args.limit,
    });

    // Format entries with proper component separation
    const formattedEntries = filteredData.map((entry) =>
      formatEntryLine(entry)
    );

    // Calculate totals if requested
    let totalsBlock = "";
    if (args.sum) {
      if (args.tags && args.tags.length > 0) {
        // Calculate item-specific totals for tagged items
        const taggedItemTotals = await calculateTaggedItemTotals(
          filteredData.map((entry) => entry.id),
          args.tags
        );
        totalsBlock = formatTaggedItemTotals(taggedItemTotals, args.tags);
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

    return parts.join("\n\n") + totalsBlock; // Double newlines for component separation
  } catch (error) {
    return `<custom-alert message="Unexpected error: ${error}" />`;
  }
}
