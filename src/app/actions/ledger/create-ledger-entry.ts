// /src/app/actions/ledger/create-ledger-entry.ts (fixed types)
"use server";
import { createClient } from "@/utils/supabase/server";
import {
  parseLedgerEntry,
  type ParsedLedgerEntry,
} from "@/lib/ledger/parse-ledger-entry";

export async function createLedgerEntry(data: {
  entry_text: string;
  entry_raw: string;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error("Not authenticated");

  const parsed: ParsedLedgerEntry = parseLedgerEntry(data.entry_text);

  // Resolve business_id (simple: 'personal' fallback)
  const { data: businesses, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id);
  if (bizErr) throw bizErr;
  if (!businesses?.length) throw new Error("No businesses found");

  const target = (parsed.business_name || "personal").toLowerCase();
  const biz =
    businesses.find((b) => b.name.toLowerCase() === target) ||
    businesses.find((b) => b.name.toLowerCase() === "personal");
  const business_id = biz?.id ?? null;

  // Insert header
  const { data: headerRows, error: insErr } = await supabase
    .from("ledger_entries")
    .insert([
      {
        user_id: user.id,
        business_id,
        entry_date: parsed.date,
        description: parsed.payee,
        entry_raw: data.entry_raw,
        amount: parsed.amount,
        currency: parsed.currency,
        entry_text: data.entry_text,
      },
    ])
    .select("id")
    .limit(1);
  if (insErr) throw insErr;
  const entry_id = headerRows?.[0]?.id as number | undefined;
  if (!entry_id) throw new Error("Failed to create header entry");

  // Insert postings
  const postings = parsed.postings.map((p, i) => ({
    entry_id,
    account: p.account,
    amount: p.amount,
    currency: p.currency || parsed.currency,
    sort_order: i,
  }));

  const { error: postErr } = await supabase
    .from("ledger_postings")
    .insert(postings);
  if (postErr) {
    await supabase.from("ledger_entries").delete().eq("id", entry_id);
    throw postErr;
  }

  return { success: true, entry_id, business_id };
}
