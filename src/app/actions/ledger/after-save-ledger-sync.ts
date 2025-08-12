// ================================================
// FILE: src/app/actions/ledger/after-save-ledger-sync.ts
// PURPOSE: Dev-only sync of local .ledger from DB (source of truth)
// NOTES:
//  - Rewrites the file from *database rows* (not in-memory state)
//  - Scales to large tables by streaming & chunked DB reads (no huge arrays)
//  - Deterministic order: by `entry_date` ASC, then `id` ASC (keyset pagination)
//  - Keep legacy append util for rare debug; prefer full sync after each save
// ================================================
"use server";

import fs from "fs/promises";
import fscore from "fs";
import path from "path";
import { isLocalLedgerWriteEnabled } from "@/lib/ledger/is-local-write-enabled";
import { createClient } from "@/utils/supabase/server";

const LEDGER_FILE_PATH = path.resolve(
  process.cwd(),
  "src/data/ledger/general.ledger"
);
const TMP_FILE_PATH = LEDGER_FILE_PATH + ".tmp";

// ---------- small helpers ----------
async function ensureDirFor(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function ensureDoubleNewline(s: string): string {
  const t = s.trimEnd();
  return t.length ? t + "\n\n" : "";
}

// Simple in-memory mutex to avoid overlapping writes in dev
let lock: Promise<void> | null = null;
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  while (lock) await lock.catch(() => {});
  let release!: () => void;
  lock = new Promise<void>((res) => (release = res));
  try {
    const out = await fn();
    release();
    lock = null;
    return out;
  } catch (e) {
    release();
    lock = null;
    throw e;
  }
}

// ---------- PUBLIC: Full rewrite from DB (CHUNKED) ----------
/**
 * Stream a fresh ledger file built from DB rows (for the current user).
 * Designed to handle large datasets (50k+ entries) without high memory use.
 */
export async function syncLedgerFileFromDB(options?: {
  chunkSize?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLocalLedgerWriteEnabled())
    return { ok: false, error: "LOCAL_LEDGER_WRITE disabled" } as const;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { ok: false, error: "Not authenticated" } as const;

  const chunkSize = Math.max(100, Math.min(2000, options?.chunkSize ?? 1000));

  return withLock(async () => {
    await ensureDirFor(LEDGER_FILE_PATH);

    // Prepare temp stream; atomic rename on success
    const stream = fscore.createWriteStream(TMP_FILE_PATH, {
      flags: "w",
      encoding: "utf-8",
    });

    type Row = {
      id: number;
      entry_date: string;
      entry_text: string | null;
      is_deleted: boolean | null;
    };

    let lastDate: string | null = null;
    let lastId = 0;
    let total = 0;

    for (;;) {
      let q = supabase
        .from("ledger_entries")
        .select("id, entry_date, entry_text, is_deleted")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("entry_date", { ascending: true })
        .order("id", { ascending: true })
        .limit(chunkSize);

      // Keyset pagination to keep the same sort order without OFFSET
      if (lastDate !== null) {
        // (entry_date > lastDate) OR (entry_date = lastDate AND id > lastId)
        // Supabase `.or()` groups must be string encoded
        q = q.or(
          `entry_date.gt.${lastDate},and(entry_date.eq.${lastDate},id.gt.${lastId})`
        );
      }

      const { data, error } = await q.returns<Row[]>();
      if (error) {
        stream.destroy();
        await fs.rm(TMP_FILE_PATH).catch(() => {});
        return { ok: false, error: error.message } as const;
      }

      const rows = data ?? [];
      if (rows.length === 0) break;

      // Write this chunk
      for (const r of rows) {
        if (!r.entry_text) continue; // skip invalid rows
        stream.write(ensureDoubleNewline(r.entry_text));
      }

      total += rows.length;
      const last = rows[rows.length - 1];
      lastDate = last.entry_date;
      lastId = last.id;

      if (rows.length < chunkSize) break; // done
    }

    // Finalize stream and atomically swap
    await new Promise<void>((resolve, reject) => {
      stream.end(() => resolve());
      stream.on("error", reject);
    });

    await fs.rename(TMP_FILE_PATH, LEDGER_FILE_PATH);
    return { ok: true } as const;
  });
}

// ---------- LEGACY: Simple append (kept for debugging) ----------
/**
 * Append the just-rendered entry to local ledger file (legacy). Prefer `syncLedgerFileFromDB()`
 * for deterministic contents and to avoid duplication.
 */
export async function appendLedgerEntryText(
  entry_text: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLocalLedgerWriteEnabled())
    return { ok: false, error: "LOCAL_LEDGER_WRITE disabled" } as const;
  const payload = ensureDoubleNewline(entry_text || "");
  return withLock(async () => {
    await ensureDirFor(LEDGER_FILE_PATH);
    await fs.appendFile(LEDGER_FILE_PATH, payload, "utf-8");
    return { ok: true } as const;
  });
}

// ---------- Convenience: selective rewrite orders (date or created) ----------
/**
 * Optional alternative that orders by created_at, useful for debugging.
 */
export async function syncLedgerFileFromDBByCreated(options?: {
  chunkSize?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLocalLedgerWriteEnabled())
    return { ok: false, error: "LOCAL_LEDGER_WRITE disabled" } as const;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { ok: false, error: "Not authenticated" } as const;

  const chunkSize = Math.max(100, Math.min(2000, options?.chunkSize ?? 1000));

  return withLock(async () => {
    await ensureDirFor(LEDGER_FILE_PATH);
    const stream = fscore.createWriteStream(TMP_FILE_PATH, {
      flags: "w",
      encoding: "utf-8",
    });

    type Row = { id: number; created_at: string; entry_text: string | null };

    let lastCreated: string | null = null;
    let lastId = 0;

    for (;;) {
      let q = supabase
        .from("ledger_entries")
        .select("id, created_at, entry_text")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(chunkSize);

      if (lastCreated !== null) {
        q = q.or(
          `created_at.gt.${lastCreated},and(created_at.eq.${lastCreated},id.gt.${lastId})`
        );
      }

      const { data, error } = await q.returns<Row[]>();
      if (error) {
        stream.destroy();
        await fs.rm(TMP_FILE_PATH).catch(() => {});
        return { ok: false, error: error.message } as const;
      }

      const rows = data ?? [];
      if (rows.length === 0) break;
      for (const r of rows) {
        if (!r.entry_text) continue;
        stream.write(ensureDoubleNewline(r.entry_text));
      }
      const last = rows[rows.length - 1];
      lastCreated = last.created_at;
      lastId = last.id;
      if (rows.length < chunkSize) break;
    }

    await new Promise<void>((resolve, reject) => {
      stream.end(() => resolve());
      stream.on("error", reject);
    });

    await fs.rename(TMP_FILE_PATH, LEDGER_FILE_PATH);
    return { ok: true } as const;
  });
}
