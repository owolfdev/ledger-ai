// /src/app/actions/ledger/create-ledger-from-structured.ts
"use server";
import { createClient } from "@/utils/supabase/server";
import {
  buildPostingsFromReceipt,
  type ReceiptShape,
} from "@/lib/ledger/build-postings-from-receipt";
import { renderLedger, assertBalanced } from "@/lib/ledger/render-ledger";

export interface CreateLedgerFromStructuredInput {
  date: string; // YYYY-MM-DD
  payee: string; // merchant
  receipt: ReceiptShape; // structured items/subtotal/tax/total
  imageUrl?: string; // optional image URL
  currency?: string; // default THB
  paymentAccount?: string; // default Assets:Cash
}

export async function createLedgerFromStructured(
  input: CreateLedgerFromStructuredInput
) {
  console.log("CHECK HERE!: ");
  console.log("input!: ", input);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error("Not authenticated");

  const currency = input.currency || "THB";
  const postings = buildPostingsFromReceipt(input.receipt, {
    currency,
    paymentAccount: input.paymentAccount || "Assets:Cash",
    includeTaxLine: true,
  });

  assertBalanced(postings);

  // Render ledger text for convenience/preview
  const entry_text = renderLedger(input.date, input.payee, postings, currency);

  // Insert header
  const amountPaid = Math.abs(
    postings.filter((p) => p.amount < 0).reduce((s, p) => s + p.amount, 0)
  );
  const { data: headerRows, error: insErr } = await supabase
    .from("ledger_entries")
    .insert([
      {
        user_id: user.id,
        business_id: null, // set later via classification if needed
        entry_date: input.date,
        description: input.payee,
        entry_raw: JSON.stringify(input.receipt),
        amount: +amountPaid.toFixed(2),
        currency,
        entry_text,
        image_url: input.imageUrl,
      },
    ])
    .select("id")
    .limit(1);
  if (insErr) throw insErr;
  const entry_id = headerRows?.[0]?.id as number | undefined;
  if (!entry_id) throw new Error("Failed to create header entry");

  // Insert postings
  const rows = postings.map((p, i) => ({
    entry_id,
    account: p.account,
    amount: p.amount,
    currency: p.currency || currency,
    sort_order: i,
  }));
  const { error: postErr } = await supabase
    .from("ledger_postings")
    .insert(rows);
  if (postErr) {
    await supabase.from("ledger_entries").delete().eq("id", entry_id);
    throw postErr;
  }

  return { success: true, entry_id };
}
