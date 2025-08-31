// ================================================
// FILE: src/commands/smart/edit-entry-command.ts
// PURPOSE: Edit or delete a single ledger entry - business, vendor, date, memo, or delete
// ================================================
import { createClient } from "@/utils/supabase/client";
import type { User } from "@/types/user";
import type { CommandMeta } from "./utils";
import { syncLedgerFile } from "@/app/actions/ledger/sync-ledger-file";
import { clearAllTerminalHistories } from "@/lib/utils/clear-terminal-histories";

export interface EditEntryArgs {
  entryId: string;
  business?: string;
  vendor?: string;
  description?: string;
  date?: string;
  memo?: string;
  delete?: boolean; // ✅ NEW: Delete flag
}

function parseArgs(raw?: string): EditEntryArgs | null {
  if (!raw || !raw.trim()) {
    throw new Error("Entry ID is required. Usage: edit-entry <id> [options]");
  }

  // Parse arguments with proper quoted string handling
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      continue;
    }

    if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = "";
      continue;
    }

    if (char === " " && !inQuotes) {
      if (current.trim()) {
        parts.push(current.trim());
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    // Strip quotes from the beginning and end if they exist
    let cleanValue = current.trim();
    if (
      (cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
      (cleanValue.startsWith("'") && cleanValue.endsWith("'"))
    ) {
      cleanValue = cleanValue.slice(1, -1);
    }
    parts.push(cleanValue);
  }

  // Filter out empty parts
  const filteredParts = parts.filter(Boolean);

  // First part must be the entry ID
  const entryId = filteredParts[0];
  if (!/^\d+$/.test(entryId)) {
    throw new Error("Entry ID must be numeric");
  }

  let business: string | undefined;
  let vendor: string | undefined;
  let description: string | undefined;
  let date: string | undefined;
  let memo: string | undefined;
  let deleteFlag = false; // ✅ NEW: Delete flag

  // Parse flags
  for (let i = 1; i < filteredParts.length; i++) {
    const flag = filteredParts[i].toLowerCase();

    if (
      (flag === "--business" || flag === "-b") &&
      i + 1 < filteredParts.length
    ) {
      business = filteredParts[i + 1];
      i++;
      continue;
    }
    if (
      (flag === "--vendor" ||
        flag === "-v" ||
        flag === "--description" ||
        flag === "-d") &&
      i + 1 < filteredParts.length
    ) {
      vendor = filteredParts[i + 1];
      description = filteredParts[i + 1]; // vendor and description are the same field
      i++;
      continue;
    }
    if ((flag === "--date" || flag === "-D") && i + 1 < filteredParts.length) {
      date = filteredParts[i + 1];
      i++;
      continue;
    }
    if ((flag === "--memo" || flag === "-m") && i + 1 < filteredParts.length) {
      memo = filteredParts[i + 1];
      i++;
      continue;
    }
    // ✅ NEW: Delete flag parsing
    if (flag === "--delete" || flag === "-d") {
      deleteFlag = true;
      i++;
      continue;
    }
  }

  // ✅ UPDATED: Delete flag is valid on its own
  if (!deleteFlag && !business && !vendor && !description && !date && !memo) {
    throw new Error(
      "At least one field must be specified to edit (--business, --vendor, --date, --memo) or use --delete/-d to remove entry"
    );
  }

  return {
    entryId,
    business,
    vendor: vendor || description,
    description: vendor || description,
    date,
    memo,
    delete: deleteFlag, // ✅ NEW: Return delete flag
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

// ✅ NEW: Delete entry function with image cleanup
async function deleteEntry(entryId: string, userId: string): Promise<void> {
  const supabase = createClient();

  // First, get the entry to check for associated images
  const { data: entry, error: fetchError } = await supabase
    .from("ledger_entries")
    .select("image_url")
    .eq("id", entryId)
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    throw new Error(
      `Failed to fetch entry for deletion: ${fetchError.message}`
    );
  }

  // Delete associated image from storage if it exists
  if (entry?.image_url) {
    try {
      // Extract the file path from the full URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/receipts/[file-path]
      const url = new URL(entry.image_url);
      const pathParts = url.pathname.split("/");

      // Find the index after "receipts" in the path
      const receiptsIndex = pathParts.findIndex((part) => part === "receipts");

      if (receiptsIndex > -1 && receiptsIndex < pathParts.length - 1) {
        // Get everything after "/receipts/" as the file path
        const filePath = pathParts.slice(receiptsIndex + 1).join("/");

        // console.log(`Deleting image from receipts bucket: ${filePath}`);

        const { error: storageError } = await supabase.storage
          .from("receipts")
          .remove([filePath]);

        if (storageError) {
          console.error("Failed to delete image from storage:", storageError);
          // Don't fail the whole operation, just log the error
        } else {
          // console.log("Successfully deleted image from receipts bucket");
        }
      } else {
        console.error(
          "Could not parse file path from image URL:",
          entry.image_url
        );
      }
    } catch (imageError) {
      console.error("Error processing image deletion:", imageError);
      // Don't fail the whole operation, just log the error
    }
  }

  // Delete in correct order due to foreign key constraints
  // 1. Delete postings first
  const { error: postingsError } = await supabase
    .from("ledger_postings")
    .delete()
    .eq("entry_id", entryId);

  if (postingsError) {
    throw new Error(`Failed to delete postings: ${postingsError.message}`);
  }

  // 2. Delete main entry
  const { error: entryError } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (entryError) {
    throw new Error(`Failed to delete entry: ${entryError.message}`);
  }

  // 3. Sync ledger file
  try {
    await syncLedgerFile();
  } catch (syncError) {
    console.error("Failed to sync ledger file after deletion:", syncError);
    // Don't fail the operation, just log the error
  }
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
    // console.log("Fetching entry:", args.entryId);
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

    // ✅ NEW: Handle delete operation
    if (args.delete) {
      try {
        await deleteEntry(args.entryId, user.id);
        clearAllTerminalHistories(); // Clear all terminal histories
        return `✅ **Entry ${args.entryId} deleted successfully**

The entry, all its postings, and any associated receipt images have been removed from your ledger.`;
      } catch (error) {
        console.error("Delete error:", error);
        return `<my-alert message="Failed to delete entry: ${
          error instanceof Error ? error.message : error
        }" />`;
      }
    }

    // Step 2: Build the update object (existing edit logic)
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
    // console.log("Updating entry with:", updates);
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
    // console.log("Updating postings...");

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
      // console.log("Syncing ledger file...");
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
