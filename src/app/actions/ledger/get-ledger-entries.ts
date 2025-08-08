// src/app/actions/ledger/get-ledger-entries.ts
"use server";
import { createClient } from "@/utils/supabase/server";

export async function getLedgerEntries() {
  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("ledger_entries")
    .select("*")
    .order("entry_date", { ascending: true });

  if (error) throw error;
  return entries;
}
