// ================================================
// FILE: src/app/api/ledger-entry/delete/route.ts
// PURPOSE: API route to delete ledger entries with complete cleanup
// ================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { syncLedgerFile } from "@/app/actions/ledger/sync-ledger-file";

interface DeleteRequest {
  entryId: number;
}

async function deleteEntryWithCleanup(
  entryId: number,
  userId: string
): Promise<void> {
  const supabase = await createClient();

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
      const url = new URL(entry.image_url);
      const pathParts = url.pathname.split("/");

      // Find the index after "receipts" in the path
      const receiptsIndex = pathParts.findIndex((part) => part === "receipts");

      if (receiptsIndex > -1 && receiptsIndex < pathParts.length - 1) {
        // Get everything after "/receipts/" as the file path
        const filePath = pathParts.slice(receiptsIndex + 1).join("/");

        console.log(`Deleting image from receipts bucket: ${filePath}`);

        const { error: storageError } = await supabase.storage
          .from("receipts")
          .remove([filePath]);

        if (storageError) {
          console.error("Failed to delete image from storage:", storageError);
          // Don't fail the whole operation, just log the error
        } else {
          console.log("Successfully deleted image from receipts bucket");
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

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: DeleteRequest = await request.json();
    const { entryId } = body;

    if (!entryId || !Number.isInteger(entryId) || entryId <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid entry ID is required" },
        { status: 400 }
      );
    }

    console.log(`API: Deleting entry ${entryId} for user ${user.id}`);

    // Delete the entry with full cleanup
    await deleteEntryWithCleanup(entryId, user.id);

    return NextResponse.json({
      success: true,
      message: `Entry ${entryId} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete entry",
      },
      { status: 500 }
    );
  }
}
