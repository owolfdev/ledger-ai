// src/app/ledger/entry/[id]/page.tsx
// Updated to use the editable component

import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EditableLedgerEntry from "./editable-ledger-entry"; // Import the component
// import SmartTerminal from "@/components/terminal/smart-terminal";

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

  return (
    <div>
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0 flex flex-col">
          <EditableLedgerEntry entry={entry} postings={postings || []} />
        </div>
      </div>
      {/* <div className="mx-auto max-w-4xl p-4 space-y-6 w-full">
        <SmartTerminal
          commandSet="ledger"
          contextKey="entry"
          currentSlug={entry.description}
        />
      </div> */}
    </div>
  );
}

// Optional: metadata for better titles
export async function generateMetadata({ params }: PageProps) {
  const p = await params;
  const id = parseId(p.id);
  return { title: id ? `Ledger Entry #${id}` : "Ledger Entry" };
}
