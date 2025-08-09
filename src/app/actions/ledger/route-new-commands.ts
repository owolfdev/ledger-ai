// /app/actions/ledger/route-new-commands.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import {
  buildPostingsFromReceipt,
  type ReceiptShape,
} from "@/lib/ledger/build-postings-from-receipt";
import { renderLedger } from "@/lib/ledger/render-ledger";

export type NewCommandPayload = {
  date: string; // YYYY-MM-DD (local)
  payee: string;
  currency: string; // e.g., USD/THB
  receipt: ReceiptShape;
  paymentAccount?: string; // e.g., Liabilities:CreditCard
  memo?: string | null;
};

export async function handleNewCommand(
  payload: NewCommandPayload
): Promise<void> {
  const supabase = await createClient();

  // Require auth — DB has user_id NOT NULL
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new Error("Not authenticated.");
  }

  // Build postings with the same payment account used in client preview
  const postings = buildPostingsFromReceipt(payload.receipt, {
    currency: payload.currency,
    paymentAccount: payload.paymentAccount || "Assets:Cash",
    includeTaxLine: true,
    vendor: payload.payee,
  });

  const entry_text = renderLedger(
    payload.date,
    payload.payee,
    postings,
    payload.currency
  );

  const amount = payload.receipt.total ?? payload.receipt.subtotal ?? 0;

  const { error } = await supabase.from("ledger_entries").insert({
    user_id: user.id,
    entry_date: payload.date,
    description: payload.payee,
    entry_raw: JSON.stringify(payload.receipt),
    amount,
    currency: payload.currency,
    entry_text,
    memo: payload.memo ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}
