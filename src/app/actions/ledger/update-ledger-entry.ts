// src/app/actions/ledger/update-ledger-entry.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { syncLedgerFile } from "./sync-ledger-file";
import { isLocalLedgerWriteEnabled } from "@/lib/ledger/is-local-write-enabled";
import { renderLedger } from "@/lib/ledger/render-ledger";

// Posting schema
const PostingSchema = z.object({
  id: z.number().optional(), // Optional for new postings
  account: z.string().min(1, "Account is required"),
  amount: z.number(),
  currency: z.string().length(3),
  sort_order: z.number(),
});

// Entry update schema
const UpdateEntrySchema = z.object({
  id: z.number().positive(),
  description: z.string().min(1, "Description is required").max(200),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  memo: z.string().max(1000).optional(),
  is_cleared: z.boolean(),
  image_url: z.union([z.string().url(), z.null()]).optional(),
  currency: z.string().length(3).optional(), // Add currency field
  postings: z
    .array(PostingSchema)
    .min(2, "Must have at least 2 postings")
    .optional(),
});

export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;

// Define the proper type for the update data
type LedgerEntryUpdate = {
  description: string;
  entry_date: string;
  memo: string | null;
  is_cleared: boolean;
  amount: number | string;
  currency?: string; // Add currency field
  updated_at: string;
  image_url?: string | null;
  entry_text?: string; // Add entry_text for regeneration
};

export async function updateLedgerEntry(input: UpdateEntryInput) {
  try {
    // console.log("=== SERVER ACTION DEBUG ===");
    // console.log("Raw input:", input);

    // Validate input
    const validatedData = UpdateEntrySchema.parse(input);
    // console.log("Validated data:", validatedData);

    // Validate balance if postings are included
    if (validatedData.postings) {
      const total = validatedData.postings.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      if (Math.abs(total) > 0.01) {
        return {
          success: false,
          error: `Postings must balance! Current total: ${total.toFixed(2)}`,
        };
      }
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify user owns this entry
    const { data: existingEntry, error: fetchError } = await supabase
      .from("ledger_entries")
      .select("id, user_id, amount, image_url")
      .eq("id", validatedData.id)
      .single();
    if (fetchError || !existingEntry) {
      return { success: false, error: "Entry not found" };
    }
    if (existingEntry.user_id !== user.id) {
      return { success: false, error: "Not authorized to edit this entry" };
    }

    // Calculate new total amount if postings are provided
    let newAmount = existingEntry.amount;
    if (validatedData.postings) {
      // Sum positive amounts (expenses)
      newAmount = validatedData.postings
        .filter((p) => p.amount > 0)
        .reduce((sum, p) => sum + p.amount, 0);
    }

    // Prepare update object with proper typing
    const updateData: LedgerEntryUpdate = {
      description: validatedData.description,
      entry_date: validatedData.entry_date,
      memo: validatedData.memo || null,
      is_cleared: validatedData.is_cleared,
      amount: newAmount,
      updated_at: new Date().toISOString(),
    };

    // Add currency if provided
    if (validatedData.currency) {
      updateData.currency = validatedData.currency;
    }

    // Handle image URL update properly
    // console.log(
    //   "Has image_url property:",
    //   validatedData.hasOwnProperty("image_url")
    // );
    // console.log("image_url value:", validatedData.image_url);
    // console.log("image_url type:", typeof validatedData.image_url);

    if (validatedData.hasOwnProperty("image_url")) {
      if (
        validatedData.image_url === null ||
        validatedData.image_url === "" ||
        validatedData.image_url === undefined
      ) {
        updateData.image_url = null;
        // console.log("Setting image_url to null for removal");
      } else if (
        typeof validatedData.image_url === "string" &&
        validatedData.image_url.length > 0
      ) {
        updateData.image_url = validatedData.image_url;
        // console.log("Setting image_url to:", validatedData.image_url);
      } else {
        updateData.image_url = null;
        // console.log("Default: Setting image_url to null");
      }
    }

    // console.log("Final updateData:", updateData);

    // Update the entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from("ledger_entries")
      .update(updateData)
      .eq("id", validatedData.id)
      .select()
      .single();

    if (updateError) {
      console.error("Entry update error:", updateError);
      return { success: false, error: "Failed to update entry" };
    }

    // console.log("Database update successful:", updatedEntry);

    // Update postings if provided
    if (validatedData.postings) {
      // Delete existing postings
      const { error: deleteError } = await supabase
        .from("ledger_postings")
        .delete()
        .eq("entry_id", validatedData.id);
      if (deleteError) {
        console.error("Postings delete error:", deleteError);
        return { success: false, error: "Failed to update postings" };
      }

      // Insert new postings
      const newPostings = validatedData.postings.map((posting, index) => ({
        entry_id: validatedData.id,
        account: posting.account,
        amount: posting.amount,
        currency: posting.currency,
        sort_order: index,
      }));

      const { error: insertError } = await supabase
        .from("ledger_postings")
        .insert(newPostings);
      if (insertError) {
        console.error("Postings insert error:", insertError);
        return { success: false, error: "Failed to create new postings" };
      }

      // Regenerate entry_text after postings update
      const { data: updatedPostings, error: fetchPostingsError } =
        await supabase
          .from("ledger_postings")
          .select("account, amount, currency")
          .eq("entry_id", validatedData.id)
          .order("sort_order", { ascending: true });

      if (!fetchPostingsError && updatedPostings) {
        // Regenerate the entry_text with updated data
        const newEntryText = renderLedger(
          validatedData.entry_date,
          validatedData.description, // Use the updated description
          updatedPostings.map((p) => ({
            account: p.account,
            amount: p.amount,
            currency: p.currency,
          })),
          validatedData.currency || updatedPostings[0]?.currency || "USD"
        );

        // Update the entry with new entry_text
        const { error: entryTextUpdateError } = await supabase
          .from("ledger_entries")
          .update({ entry_text: newEntryText })
          .eq("id", validatedData.id);

        if (entryTextUpdateError) {
          console.warn("Failed to update entry_text:", entryTextUpdateError);
          // Don't fail the operation, just log the warning
        } else {
          // console.log("✅ Regenerated entry_text with updated postings");
        }
      }
    } else {
      // Also regenerate for basic updates (description changes)
      // If only basic fields changed (like description), still update entry_text

      // Fetch current postings
      const { data: currentPostings, error: fetchCurrentError } = await supabase
        .from("ledger_postings")
        .select("account, amount, currency")
        .eq("entry_id", validatedData.id)
        .order("sort_order", { ascending: true });

      if (!fetchCurrentError && currentPostings) {
        // Regenerate entry_text with updated description
        const newEntryText = renderLedger(
          validatedData.entry_date,
          validatedData.description, // Updated description
          currentPostings.map((p) => ({
            account: p.account,
            amount: p.amount,
            currency: p.currency,
          })),
          validatedData.currency || currentPostings[0]?.currency || "USD"
        );

        // Update the entry with new entry_text
        const { error: entryTextUpdateError } = await supabase
          .from("ledger_entries")
          .update({ entry_text: newEntryText })
          .eq("id", validatedData.id);

        if (entryTextUpdateError) {
          console.warn("Failed to update entry_text:", entryTextUpdateError);
        } else {
          // console.log("✅ Regenerated entry_text with updated description");
        }
      }
    }

    // Auto-sync after successful database update
    if (isLocalLedgerWriteEnabled()) {
      try {
        const syncResult = await syncLedgerFile();
        if (syncResult.success) {
          // console.log("✅ Auto-synced ledger file after entry update");
        } else {
          console.warn("⚠️ Sync skipped:", syncResult.reason);
        }
      } catch (syncError) {
        console.error("❌ Failed to auto-sync ledger file:", syncError);
        // Don't fail the update operation if sync fails - just log it
      }
    }

    // Revalidate the entry page
    revalidatePath(`/ledger/entry/${validatedData.id}`);

    return {
      success: true,
      data: updatedEntry,
      message: "Entry updated successfully",
    };
  } catch (error) {
    console.error("Server action error:", error);
    if (error instanceof z.ZodError) {
      // console.log("Zod validation errors:", error.errors);
      return {
        success: false,
        error: "Validation failed",
        details: error.errors,
      };
    }
    return { success: false, error: "Internal server error" };
  }
}
