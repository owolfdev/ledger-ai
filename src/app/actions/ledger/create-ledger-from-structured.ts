// /src/app/actions/ledger/create-ledger-from-structured.ts
"use server";
import { createClient } from "@/utils/supabase/server";
import { type ReceiptShape } from "@/lib/ledger/build-postings-from-receipt";
import { renderLedger, assertBalanced } from "@/lib/ledger/render-ledger";
import { mapAccountWithHybridAI } from "@/lib/ledger/hybrid-account-mapper";

export interface CreateLedgerFromStructuredInput {
  date: string;
  payee: string;
  receipt: ReceiptShape;
  imageUrl?: string;
  currency?: string;
  paymentAccount?: string;
  business?: string;
}

// ✅ AI-based postings generator (server side, async)
async function buildPostingsFromReceiptAI(
  receipt: ReceiptShape,
  opts: {
    currency: string;
    paymentAccount: string;
    business?: string;
    vendor?: string;
  }
) {
  const { currency, paymentAccount, business, vendor } = opts;

  // map each item
  const itemMappings = await Promise.all(
    receipt.items.map(async (item) => ({
      account: await mapAccountWithHybridAI(item.description, {
        vendor,
        business,
      }),
      amount: +(+item.price).toFixed(2),
      currency,
    }))
  );

  const postings = [...itemMappings];

  // add tax line
  if (receipt.tax && receipt.tax > 0) {
    postings.push({
      account: await mapAccountWithHybridAI("tax", { business }),
      amount: +(+receipt.tax).toFixed(2),
      currency,
    });
  }

  // add payment line
  const total =
    receipt.total ??
    receipt.subtotal ??
    postings.reduce((s, p) => s + p.amount, 0);

  postings.push({
    account: paymentAccount,
    amount: -total,
    currency,
  });

  return postings;
}

export async function createLedgerFromStructured(
  input: CreateLedgerFromStructuredInput
) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error("Not authenticated");

  const currency = input.currency || "THB";

  // 🔥 use AI mapping here
  const postings = await buildPostingsFromReceiptAI(input.receipt, {
    currency,
    paymentAccount: input.paymentAccount || "Assets:Cash",
    business: input.business || "Personal",
    vendor: input.payee,
  });

  assertBalanced(postings);

  // preview text
  const entry_text = renderLedger(input.date, input.payee, postings, currency);

  // insert entry
  const amountPaid = Math.abs(
    postings.filter((p) => p.amount < 0).reduce((s, p) => s + p.amount, 0)
  );

  const { data: headerRows, error: insErr } = await supabase
    .from("ledger_entries")
    .insert([
      {
        user_id: user.id,
        business_id: null,
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

  // insert postings
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
