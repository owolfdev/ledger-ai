// src/app/actions/ledger/create-ledger-entry.ts
"use server";
import { createClient } from "@/utils/supabase/server";
import {
  parseLedgerEntry,
  ParsedLedgerEntry,
} from "@/lib/ledger/parse-ledger-entry";

export async function createLedgerEntry(data: {
  entry_text: string;
  entry_raw: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Parse ledger entry for details and business_name
  const parsed: ParsedLedgerEntry = parseLedgerEntry(data.entry_text);

  // 2. Look up business by name for this user
  const { data: businesses, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id);

  if (bizErr) throw bizErr;
  if (!businesses || businesses.length === 0)
    throw new Error("No businesses found");

  // 3. Find matching business (case-insensitive)
  let business_id: string | null = null;
  const business = businesses.find(
    (b: { name: string; id: string }) =>
      b.name.toLowerCase() ===
      (parsed.business_name || "personal").toLowerCase()
  );
  if (business) {
    business_id = business.id;
  } else {
    // Fallback to "Personal" if exists
    const personalBiz = businesses.find(
      (b: { name: string; id: string }) => b.name.toLowerCase() === "personal"
    );
    business_id = personalBiz ? personalBiz.id : null;
  }

  // 4. Insert into ledger_entries
  const { error } = await supabase.from("ledger_entries").insert([
    {
      user_id: user.id,
      business_id,
      entry_date: parsed.date,
      description: parsed.payee,
      entry_raw: data.entry_raw,
      amount: parsed.amount,
      currency: parsed.currency,
      expense_account: parsed.expense_account,
      asset_account: parsed.asset_account,
      entry_text: data.entry_text,
    },
  ]);
  if (error) throw error;

  return { success: true, business_id };
}
