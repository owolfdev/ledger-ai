// src/app/ledger/entry/[id]/page.tsx
// Server component for /ledger/entry/:id — fetch a single entry and its postings by numeric id.

import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parseId(idParam: string): number | null {
  // why: URL params are strings; ensure valid positive integer id
  const n = Number(idParam);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export default async function LedgerEntryPage({ params }: PageProps) {
  const p = await params;
  const id = parseId(p.id);
  if (id == null) return notFound();

  const supabase = await createClient();

  // Header row
  const { data: entry, error: entryErr } = await supabase
    .from("ledger_entries")
    .select(
      "id, user_id, business_id, entry_date, description, memo, amount, currency, entry_text, image_url, is_cleared, is_deleted, created_at, updated_at"
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
    <div className="mx-auto max-w-3xl p-4 space-y-6 w-full">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Ledger Entry #{entry.id}</h1>
        <p className="text-sm text-neutral-500">
          {entry.entry_date} • {entry.currency}
        </p>
      </header>

      <section className="rounded-2xl border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-medium">{entry.description}</div>
            {entry.memo ? (
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {entry.memo}
              </div>
            ) : null}
          </div>
          <div className="text-right">
            <div className="font-mono">
              {Number(entry.amount).toFixed(2)} {entry.currency}
            </div>
            {entry.is_cleared ? (
              <span className="text-xs text-emerald-600">cleared</span>
            ) : (
              <span className="text-xs text-amber-600">pending</span>
            )}
          </div>
        </div>
      </section>

      {postings && postings.length > 0 ? (
        <section className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">Postings</h2>
          <ul className="space-y-2">
            {postings.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <div className="truncate pr-4 font-mono">{p.account}</div>
                <div className="font-mono tabular-nums">
                  {p.amount.toFixed(2)} {p.currency}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.entry_text ? (
        <section className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">Ledger Text</h2>
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {entry.entry_text}
          </pre>
        </section>
      ) : null}

      <section className="rounded-2xl border p-4">
        {entry.image_url ? (
          <figure className="mt-4">
            <div className="relative w-full overflow-hidden rounded-xl border bg-black/5">
              {/* use plain <img> to avoid Next/Image remote domain setup */}
              <Image
                src={entry.image_url}
                alt={`Receipt image for ${entry.description} on ${entry.entry_date}`}
                className="block max-h-[520px] w-full object-contain bg-white"
                loading="lazy"
                width={1000}
                height={1000}
              />
            </div>
            <figcaption className="mt-2 text-xs text-neutral-500">
              <a
                href={entry.image_url}
                target="_blank"
                rel="noreferrer"
                className="underline hover:no-underline"
              >
                Open full size
              </a>
            </figcaption>
          </figure>
        ) : null}

        {/*  */}
      </section>
    </div>
  );
}

// Optional: metadata for better titles
export async function generateMetadata({ params }: PageProps) {
  const p = await params;
  const id = parseId(p.id);
  return { title: id ? `Ledger Entry #${id}` : "Ledger Entry" };
}
