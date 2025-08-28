// FILE: src/app/actions/ledger/route-new-commands.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import {
  buildPostingsFromReceipt,
  type ReceiptShape,
} from "@/lib/ledger/build-postings-from-receipt";
import { renderLedger } from "@/lib/ledger/render-ledger";
import { syncLedgerFileFromDB } from "@/app/actions/ledger/after-save-ledger-sync";
import { isLocalLedgerWriteEnabled } from "@/lib/ledger/is-local-write-enabled";
import { mapAccountWithHybridAI } from "@/lib/ledger/hybrid-account-mapper";

export type NewCommandPayload = {
  date: string; // YYYY-MM-DD (local)
  payee: string;
  currency: string; // e.g., USD/THB
  receipt: ReceiptShape;
  paymentAccount?: string; // e.g., Liabilities:CreditCard
  memo?: string | null;
  imageUrl?: string | null;
  business?: string; // NEW: business context
  postings?: Array<{ account: string; amount: number; currency: string }>; // NEW: pre-generated AI-enhanced postings
};

export type HandleNewResult =
  | { ok: true; entry_id: number; postings: number }
  | { ok: false; error: string };

const DBG = process.env.NEXT_PUBLIC_LEDGER_DEBUG === "true";
const EPS = 0.005;
const round2 = (n: number) => Math.round(n * 100) / 100;

type BuiltPosting = Awaited<
  ReturnType<typeof buildPostingsFromReceipt>
>[number];

type NormalizedPosting = {
  account: string;
  amount: number;
  currency: string;
};

function toNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normalizePostings(
  src: BuiltPosting[],
  defaultCurrency: string
): NormalizedPosting[] {
  const interim = src.map((p) => ({
    account: (p as { account: string }).account,
    amount: toNumberOrNull((p as { amount?: number }).amount),
    currency: (p as { currency?: string }).currency ?? defaultCurrency,
  }));

  let sum = 0;
  let lastUnknown = -1;
  for (let i = 0; i < interim.length; i++) {
    const a = interim[i].amount;
    if (a == null) lastUnknown = i;
    else sum += a;
  }
  sum = round2(sum);

  const out: NormalizedPosting[] = interim.map((p) => ({
    account: p.account,
    amount: p.amount ?? 0,
    currency: p.currency,
  }));

  if (lastUnknown !== -1) {
    out[lastUnknown].amount = round2(-sum);
  } else if (Math.abs(sum) > EPS && out.length > 0) {
    out[out.length - 1].amount = round2(out[out.length - 1].amount - sum);
  }

  return out;
}

export async function handleNewCommand(
  payload: NewCommandPayload
): Promise<HandleNewResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, error: "Not authenticated." };

  // Helper function to cleanup orphaned image if entry creation fails
  // TEMPORARILY DISABLED to debug image persistence issues
  const cleanupOrphanedImage = async (imageUrl: string | null | undefined) => {
    if (!imageUrl) return;

    // TEMPORARILY DISABLED - just log instead of deleting
    console.log("Image cleanup would have run for:", imageUrl);
    console.log("But cleanup is temporarily disabled for debugging");

    // Original cleanup code commented out:
    /*
    try {
      // Extract file path from URL for cleanup
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split("/");
      const receiptsIndex = pathParts.findIndex((part) => part === "receipts");

      if (receiptsIndex > -1 && receiptsIndex < pathParts.length - 1) {
        const filePath = pathParts.slice(receiptsIndex + 1).join("/");

        // Only cleanup if the file belongs to the current user
        if (filePath.startsWith(user.id + "/")) {
          await supabase.storage.from("receipts").remove([filePath]);
          console.log("Cleaned up orphaned image:", filePath);
        }
      }
    } catch (error) {
      console.error("Failed to cleanup orphaned image:", error);
    }
    */
  };

  // Use pre-generated postings if provided, otherwise generate from receipt
  let postings: NormalizedPosting[];
  if (payload.postings && payload.postings.length > 0) {
    // Use client-generated AI-enhanced postings
    postings = payload.postings.map((p, i) => ({
      account: p.account,
      amount: p.amount,
      currency: p.currency,
    }));
  } else {
    // Fallback to server-side generation
    const built = buildPostingsFromReceipt(payload.receipt, {
      currency: payload.currency,
      paymentAccount: payload.paymentAccount || "Assets:Cash",
      includeTaxLine: true,
      vendor: payload.payee,
      business: payload.business, // NEW: pass business context
      mapAccount: mapAccountWithHybridAI, // NEW: use AI-enhanced account mapping
    });

    postings = normalizePostings(await built, payload.currency);
  }

  const entry_text = renderLedger(
    payload.date,
    payload.payee,
    postings as unknown as BuiltPosting[],
    payload.currency
  );
  const amountHeader = payload.receipt.total ?? payload.receipt.subtotal ?? 0;

  // Add logging for image URL being saved
  if (payload.imageUrl) {
    console.log("=== ENTRY CREATION DEBUG ===");
    console.log("Saving image URL:", payload.imageUrl);
    console.log("User ID:", user.id);
    console.log("Entry date:", payload.date);
    console.log("===========================");
  }

  const { data: headerRow, error: insHeaderErr } = await supabase
    .from("ledger_entries")
    .insert({
      user_id: user.id,
      entry_date: payload.date,
      description: payload.payee,
      entry_raw: JSON.stringify(payload.receipt),
      amount: amountHeader,
      currency: payload.currency,
      entry_text,
      memo: payload.memo ?? null,
      image_url: payload.imageUrl ?? null,
    })
    .select("id")
    .single();

  if (insHeaderErr || !headerRow) {
    // Cleanup orphaned image if entry creation fails
    await cleanupOrphanedImage(payload.imageUrl);
    return {
      ok: false,
      error: insHeaderErr?.message || "insert ledger_entries failed",
    };
  }
  const entry_id = headerRow.id as number;

  const rows = postings.map((p, i) => ({
    entry_id,
    account: p.account,
    amount: p.amount,
    currency: p.currency,
    sort_order: i,
  }));

  const zeroSum = round2(rows.reduce((s, r) => s + r.amount, 0));
  if (Math.abs(zeroSum) > EPS) {
    await supabase.from("ledger_entries").delete().eq("id", entry_id);
    // Don't cleanup image when postings are unbalanced - the image is already associated with a valid entry
    return {
      ok: false,
      error: `postings not balanced (sum=${zeroSum.toFixed(2)})`,
    };
  }

  const { error: insPostsErr } = await supabase
    .from("ledger_postings")
    .insert(rows);
  if (insPostsErr) {
    await supabase.from("ledger_entries").delete().eq("id", entry_id);
    // Don't cleanup image when posting insertion fails - the image is already associated with a valid entry
    return {
      ok: false,
      error: `insert ledger_postings failed: ${insPostsErr.message}`,
    };
  }

  // ---- AUTO-TAGGING SYSTEM ----
  try {
    // Get the created postings with their IDs for auto-tagging
    const { data: createdPostings, error: fetchErr } = await supabase
      .from("ledger_postings")
      .select("id, account, amount, currency")
      .eq("entry_id", entry_id)
      .order("sort_order", { ascending: true });

    if (!fetchErr && createdPostings) {
      // Import auto-tagging functions
      const { autoTagEntry, applyAutoTags } = await import(
        "@/lib/ledger/auto-tagger"
      );

      // Auto-tag the entry
      const autoTagResult = await autoTagEntry({
        description: payload.payee,
        memo: payload.memo,
        business: payload.business,
        postings: createdPostings,
      });

      // Apply the auto-tags to the database
      await applyAutoTags(entry_id, autoTagResult);

      // Log auto-tagging results for debugging (only in development)
      if (
        process.env.NODE_ENV === "development" &&
        (autoTagResult.entryTags.length > 0 ||
          autoTagResult.postingTags.size > 0)
      ) {
        console.log("=== AUTO-TAGGING RESULTS ===");
        console.log(
          "Entry tags:",
          autoTagResult.entryTags.map((t) => t.name)
        );
        console.log(
          "Posting tags:",
          Array.from(autoTagResult.postingTags.entries()).map(
            ([id, tags]) =>
              `Posting ${id}: ${tags.map((t) => t.name).join(", ")}`
          )
        );
        console.log("===========================");
      }
    }
  } catch (autoTagError) {
    // Log auto-tagging errors but don't fail the entry creation
    console.warn("Auto-tagging failed:", autoTagError);
  }

  // ---- DEV FILE SYNC (rewrite from DB; no append to avoid duplicates) ----
  if (isLocalLedgerWriteEnabled()) {
    try {
      const res = await syncLedgerFileFromDB();
      if (!res.ok) console.warn("[ledger-sync] failed:", res.error);
      // else console.log("[ledger-sync] OK");
    } catch (e) {
      console.warn("[ledger-sync] exception:", e);
    }
  }

  return { ok: true, entry_id, postings: rows.length };
}
