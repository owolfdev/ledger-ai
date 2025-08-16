// ================================================
// FILE: src/commands/smart/edit-entry-command.ts
// PURPOSE: Edit a single ledger entry - business, vendor, date, memo
// ================================================
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/types/user";
import type { CommandMeta } from "./utils";
import { syncLedgerFile } from "@/app/actions/ledger/sync-ledger-file";

export interface EditEntryArgs {
  entryId: string;
  business?: string;
  vendor?: string;
  description?: string;
  date?: string;
  memo?: string;
}

function parseArgs(raw?: string): EditEntryArgs | null {
  if (!raw || !raw.trim()) {
    throw new Error("Entry ID is required. Usage: edit-entry <id> [options]");
  }

  const parts = raw.trim().split(/\s+/).filter(Boolean);

  // First part must be the entry ID
  const entryId = parts[0];
  if (!/^\d+$/.test(entryId)) {
    throw new Error("Entry ID must be numeric");
  }

  let business: string | undefined;
  let vendor: string | undefined;
  let description: string | undefined;
  let date: string | undefined;
  let memo: string | undefined;

  // Parse flags
  for (let i = 1; i < parts.length; i++) {
    const flag = parts[i].toLowerCase();

    if (flag === "--business" && i + 1 < parts.length) {
      business = parts[i + 1];
      i++;
      continue;
    }
    if (
      (flag === "--vendor" || flag === "--description") &&
      i + 1 < parts.length
    ) {
      vendor = parts[i + 1];
      description = parts[i + 1]; // vendor and description are the same field
      i++;
      continue;
    }
    if (flag === "--date" && i + 1 < parts.length) {
      date = parts[i + 1];
      i++;
      continue;
    }
    if (flag === "--memo" && i + 1 < parts.length) {
      memo = parts[i + 1];
      i++;
      continue;
    }
  }

  // Must have at least one field to edit
  if (!business && !vendor && !description && !date && !memo) {
    throw new Error(
      "At least one field must be specified to edit (--business, --vendor, --date, --memo)"
    );
  }

  return {
    entryId,
    business,
    vendor: vendor || description,
    description: vendor || description,
    date,
    memo,
  };
}

function validateDate(dateStr: string): boolean {
  // Accept YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

function updateAccountsForBusiness(
  entryText: string,
  newBusiness: string
): string {
  // Replace business in account names
  // Pattern: Expenses:OldBusiness: -> Expenses:NewBusiness:
  // Also handle: Income:OldBusiness: -> Income:NewBusiness:
  return entryText.replace(/(Expenses|Income):([^:]+):/g, `$1:${newBusiness}:`);
}

export async function editEntryCommand(
  arg?: string,
  _pageCtx?: string,
  _set?: Record<string, CommandMeta>,
  user?: User | null
): Promise<string> {
  let args: EditEntryArgs;

  try {
    const parsed = parseArgs(arg);
    if (!parsed) {
      return `<my-alert message="Failed to parse arguments" />`;
    }
    args = parsed;
  } catch (error) {
    return `<my-alert message="${
      error instanceof Error ? error.message : error
    }" />`;
  }

  if (!user?.id) {
    return `<my-alert message="You must be logged in to edit entries" />`;
  }

  // Validate date if provided
  if (args.date && !validateDate(args.date)) {
    return `<my-alert message="Date must be in YYYY-MM-DD format (e.g., 2025-08-17)" />`;
  }

  const supabase = createClient();

  try {
    // Step 1: Fetch the existing entry to verify ownership and get current data
    console.log("Fetching entry:", args.entryId);
    const { data: entry, error: fetchError } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("id", args.entryId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return `<my-alert message="Failed to fetch entry: ${fetchError.message}" />`;
    }

    if (!entry) {
      return `<my-alert message="Entry ${args.entryId} not found or access denied" />`;
    }
    // Step 2: Build the update object
    const updates: Record<string, unknown> = {};
    const changes: string[] = [];

    if (args.description !== undefined) {
      updates.description = args.description;
      changes.push(`description → "${args.description}"`);
    }

    if (args.date !== undefined) {
      updates.entry_date = args.date;
      changes.push(`date → ${args.date}`);
    }

    if (args.memo !== undefined) {
      updates.memo = args.memo;
      changes.push(`memo → "${args.memo}"`);
    }

    // Handle business change (most complex - updates entry_text)
    if (args.business !== undefined) {
      const updatedEntryText = updateAccountsForBusiness(
        entry.entry_text || "",
        args.business
      );
      updates.entry_text = updatedEntryText;
      changes.push(`business → ${args.business}`);
    }

    // Step 3: Update the main entry
    console.log("Updating entry with:", updates);
    const { error: updateError } = await supabase
      .from("ledger_entries")
      .update(updates)
      .eq("id", args.entryId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return `<my-alert message="Failed to update entry: ${updateError.message}" />`;
    }

    // Step 4: Update individual postings as needed
    console.log("Updating postings...");

    // Fetch all postings for this entry
    const { data: postings, error: postingsError } = await supabase
      .from("ledger_postings")
      .select("*")
      .eq("entry_id", args.entryId);

    if (postingsError) {
      console.error("Failed to fetch postings:", postingsError);
      // Don't fail the whole operation, just warn
    } else if (postings) {
      // Update each posting
      for (const posting of postings) {
        const postingUpdates: Record<string, unknown> = {};

        // Update account names if business changed
        if (args.business !== undefined) {
          const updatedAccount = posting.account?.replace(
            /(Expenses|Income):([^:]+):/,
            `$1:${args.business}:`
          );
          if (updatedAccount && updatedAccount !== posting.account) {
            postingUpdates.account = updatedAccount;
          }
        }

        // Update memo if changed (applies to all postings)
        if (args.memo !== undefined) {
          postingUpdates.memo = args.memo;
        }

        // Only update if there are changes
        if (Object.keys(postingUpdates).length > 0) {
          const { error: postingUpdateError } = await supabase
            .from("ledger_postings")
            .update(postingUpdates)
            .eq("id", posting.id);

          if (postingUpdateError) {
            console.error(
              `Failed to update posting ${posting.id}:`,
              postingUpdateError
            );
            // Continue with other postings
          }
        }
      }
    }

    // Step 5: Sync the ledger file if in development
    try {
      console.log("Syncing ledger file...");
      await syncLedgerFile();
    } catch (syncError) {
      console.error("Failed to sync ledger file:", syncError);
      // Don't fail the operation, just log the error
    }

    // Step 6: Return success message
    const changesText = changes.join(", ");
    return `✅ **Entry ${args.entryId} updated**

**Changes:** ${changesText}

[View Updated Entry](/ledger/entry/${args.entryId})`;
  } catch (error) {
    console.error("Unexpected error:", error);
    return `<my-alert message="Unexpected error: ${error}" />`;
  }
}
