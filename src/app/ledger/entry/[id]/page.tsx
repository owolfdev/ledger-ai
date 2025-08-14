// src/app/ledger/entry/[id]/page.tsx
// Updated to use the editable component

import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EditableLedgerEntry from "./editable-ledger-entry"; // Import the component

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parseId(idParam: string): number | null {
  const n = Number(idParam);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export default async function LedgerEntryPage({ params }: PageProps) {
  const p = await params;
  const id = parseId(p.id);
  if (id == null) return notFound();

  const supabase = await createClient();

  // Header row (without business_id)
  const { data: entry, error: entryErr } = await supabase
    .from("ledger_entries")
    .select(
      "id, user_id, entry_date, description, memo, amount, currency, entry_text, image_url, is_cleared, is_deleted, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (entryErr || !entry) return notFound();

  // Postings (ordered)
  const { data: postings } = await supabase
    .from("ledger_postings")
    .select(
      "id, entry_id, account, amount, currency, memo, sort_order, created_at, updated_at"
    )
    .eq("entry_id", id)
    .order("sort_order", { ascending: true });

  return <EditableLedgerEntry entry={entry} postings={postings || []} />;
}

// Optional: metadata for better titles
export async function generateMetadata({ params }: PageProps) {
  const p = await params;
  const id = parseId(p.id);
  return { title: id ? `Ledger Entry #${id}` : "Ledger Entry" };
}
