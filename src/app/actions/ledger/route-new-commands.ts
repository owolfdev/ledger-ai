// FILE: src/app/actions/ledger/route-new-commands.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import {
  buildPostingsFromReceipt,
  type ReceiptShape,
} from "@/lib/ledger/build-postings-from-receipt";
import { renderLedger } from "@/lib/ledger/render-ledger";
import { appendLedgerEntryText } from "@/app/actions/ledger/after-save-ledger-sync";

export type NewCommandPayload = {
  date: string; // YYYY-MM-DD (local)
  payee: string;
  currency: string; // e.g., USD/THB
  receipt: ReceiptShape;
  paymentAccount?: string; // e.g., Liabilities:CreditCard
  memo?: string | null;
};

export type HandleNewResult =
  | { ok: true; entry_id: number; postings: number }
  | { ok: false; error: string };

const DBG = process.env.NEXT_PUBLIC_LEDGER_DEBUG === "true";
const EPS = 0.005;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Infer the posting shape produced by the builder
type BuiltPosting = ReturnType<typeof buildPostingsFromReceipt>[number];

// Render/DB friendly, fully-typed posting
type NormalizedPosting = {
  account: string;
  amount: number; // always concrete
  currency: string; // concrete; defaulted to payload currency
};

function toNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normalizePostings(
  src: BuiltPosting[],
  defaultCurrency: string
): NormalizedPosting[] {
  // 1) Read amounts (some may be missing/undefined)
  const interim = src.map((p) => ({
    account: (p as { account: string }).account,
    amount: toNumberOrNull((p as { amount?: number }).amount),
    currency: (p as { currency?: string }).currency ?? defaultCurrency,
  }));

  // 2) Compute sum of known amounts and locate last unknown (usually payment)
  let sum = 0;
  let lastUnknown = -1;
  for (let i = 0; i < interim.length; i++) {
    const a = interim[i].amount;
    if (a == null) lastUnknown = i;
    else sum += a;
  }
  sum = round2(sum);

  // 3) If we have unknown → make it balancing; else if slightly off → fix last posting
  const out: NormalizedPosting[] = interim.map((p) => ({
    account: p.account,
    amount: p.amount ?? 0,
    currency: p.currency,
  }));

  if (lastUnknown !== -1) {
    out[lastUnknown].amount = round2(-sum);
  } else if (Math.abs(sum) > EPS && out.length > 0) {
    // Fix rounding drift on the last posting
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

  const built = buildPostingsFromReceipt(payload.receipt, {
    currency: payload.currency,
    paymentAccount: payload.paymentAccount || "Assets:Cash",
    includeTaxLine: true,
    vendor: payload.payee,
  });

  const postings = normalizePostings(built, payload.currency);
  const entry_text = renderLedger(
    payload.date,
    payload.payee,
    postings,
    payload.currency
  );
  const amountHeader = payload.receipt.total ?? payload.receipt.subtotal ?? 0;

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
    })
    .select("id")
    .single();

  if (insHeaderErr || !headerRow) {
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
    return {
      ok: false,
      error: `insert ledger_postings failed: ${insPostsErr.message}`,
    };
  }

  // --- DEV ONLY APPEND SYNC ---
  // Non-blocking: do not fail the request if local write fails
  try {
    await appendLedgerEntryText(entry_text);
  } catch (_) {
    // swallow in production builds; logs are enough during dev
  }

  return { ok: true, entry_id, postings: rows.length };
}
