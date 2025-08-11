// ================================================
// FILE: src/app/actions/ledger/after-save-ledger-sync.ts
// PURPOSE: Dev-only append of freshly-rendered entry_text to local .ledger
// ================================================
"use server";

import fs from "fs/promises";
import path from "path";
import { isLocalLedgerWriteEnabled } from "@/lib/ledger/is-local-write-enabled";

const LEDGER_FILE_PATH = path.resolve(
  process.cwd(),
  "src/data/ledger/general.ledger"
);

// Simple in-memory mutex to avoid overlapping appends in dev
let lock: Promise<void> | null = null;

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  while (lock) {
    await lock.catch(() => {});
  }
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

function ensureTrailingNewlines(s: string): string {
  return s.endsWith("\n\n") ? s : s.endsWith("\n") ? s + "\n" : s + "\n\n";
}

/**
 * Append the just-rendered entry to local ledger file.
 * Runs only when `isLocalLedgerWriteEnabled()` is true.
 */
export async function appendLedgerEntryText(
  entry_text: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLocalLedgerWriteEnabled()) {
    return { ok: false, error: "LOCAL_LEDGER_WRITE disabled" } as const;
  }

  const payload = ensureTrailingNewlines(entry_text.trim());

  try {
    await withLock(async () => {
      // Ensure directory exists
      await fs.mkdir(path.dirname(LEDGER_FILE_PATH), { recursive: true });

      // Ensure file exists (touch) so append doesn't fail on first run
      try {
        await fs.access(LEDGER_FILE_PATH);
      } catch {
        await fs.writeFile(LEDGER_FILE_PATH, "", "utf-8");
      }

      await fs.appendFile(LEDGER_FILE_PATH, payload, "utf-8");
    });
    return { ok: true } as const;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg } as const;
  }
}

// Optional: full rewrite utility for manual resyncs
export async function rewriteLedgerFileFromTexts(
  entryTexts: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLocalLedgerWriteEnabled()) {
    return { ok: false, error: "LOCAL_LEDGER_WRITE disabled" } as const;
  }
  const content =
    entryTexts
      .map((t) => t.trim())
      .filter(Boolean)
      .join("\n\n") + "\n";
  try {
    await fs.mkdir(path.dirname(LEDGER_FILE_PATH), { recursive: true });
    await fs.writeFile(LEDGER_FILE_PATH, content, "utf-8");
    return { ok: true } as const;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg } as const;
  }
}
