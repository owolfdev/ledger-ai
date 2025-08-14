// src/app/actions/ledger/update-ledger-entry.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  image_url: z
    .union([z.string().url(), z.string().length(0), z.null(), z.undefined()])
    .optional(), // More flexible image URL validation
  postings: z
    .array(PostingSchema)
    .min(2, "Must have at least 2 postings")
    .optional(),
});

//
export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;

export async function updateLedgerEntry(input: UpdateEntryInput) {
  try {
    // Validate input
    const validatedData = UpdateEntrySchema.parse(input);

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
    // Prepare update object
    const updateData = {
      description: validatedData.description,
      entry_date: validatedData.entry_date,
      memo: validatedData.memo || null,
      is_cleared: validatedData.is_cleared,
      amount: newAmount,
      updated_at: new Date().toISOString(),
      image_url: validatedData.image_url,
    };

    // Fix: Handle image URL update properly
    if (validatedData.hasOwnProperty("image_url")) {
      // Handle all cases: string URL, empty string, null, undefined
      if (
        validatedData.image_url === null ||
        validatedData.image_url === "" ||
        validatedData.image_url === undefined
      ) {
        updateData.image_url = null; // Explicitly set to null for removal
      } else if (
        typeof validatedData.image_url === "string" &&
        validatedData.image_url.length > 0
      ) {
        updateData.image_url = validatedData.image_url; // Valid URL
      } else {
        updateData.image_url = null; // Default to null for any other case
      }
    }

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
      return {
        success: false,
        error: "Validation failed",
        details: error.errors,
      };
    }
    return { success: false, error: "Internal server error" };
  }
}
