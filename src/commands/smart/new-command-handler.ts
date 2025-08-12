// /commands/smart/new-command-handler.ts (patched)
"use client";

import { TerminalOutputRendererProps } from "@/types/terminal";
import { handleNewCommand as serverHandleNewCommand } from "@/app/actions/ledger/route-new-commands";
import {
  buildPostingsFromReceipt,
  type ReceiptShape,
} from "@/lib/ledger/build-postings-from-receipt";
import { renderLedger } from "@/lib/ledger/render-ledger";
import { parseManualNewCommand } from "@/lib/ledger/parse-manual-command";
import { mapAccount as accountMap } from "@/lib/ledger/account-map";
import {
  validateNewCommandPayload,
  type NewCommandPayload,
} from "@/lib/ledger/schemas";

export type SetHistory = React.Dispatch<
  React.SetStateAction<TerminalOutputRendererProps[]>
>;

const DEFAULT_CONFIG = {
  currency: "THB",
  paymentAccount: "Assets:Cash",
  includeTaxLine: true,
} as const;

interface StructuredInput {
  receipt?: ReceiptShape;
  items?: ReceiptShape["items"];
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  date?: string;
  payee?: string; // canonical
  vendor?: string; // alias from OCR UI
  currency?: string;
  memo?: string | null;
  paymentAccount?: string;
  imageUrl?: string | null; // 👈 NEW
}

interface ProcessingResult {
  date: string;
  payee: string;
  currency: string;
  receipt: ReceiptShape;
  paymentAccount?: string;
  memo?: string | null;
  imageUrl?: string | null; // 👈 NEW
}

function isValidStructuredInput(obj: unknown): obj is StructuredInput {
  if (!obj || typeof obj !== "object") return false;
  const input = obj as Record<string, unknown>;
  const hasReceipt = input.receipt && typeof input.receipt === "object";
  const hasItems = Array.isArray(input.items);
  return Boolean(hasReceipt || hasItems);
}

function tryParseJSONInput(input: string): StructuredInput | null {
  try {
    const raw = input.trim().startsWith("{")
      ? input.trim()
      : input.trim().replace(/^new\s+/i, "");
    if (!raw.startsWith("{")) return null;
    const obj = JSON.parse(raw);
    return isValidStructuredInput(obj) ? (obj as StructuredInput) : null;
  } catch {
    return null;
  }
}

function normalizeReceiptData(structured: StructuredInput): ReceiptShape {
  if (structured.receipt?.items) return structured.receipt;
  if (Array.isArray(structured.items)) {
    return {
      items: structured.items,
      subtotal: structured.subtotal ?? null,
      tax: structured.tax ?? null,
      total: structured.total ?? null,
    };
  }
  throw new Error("Invalid structured JSON: missing items[]");
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function processStructuredInput(structured: StructuredInput): ProcessingResult {
  const receipt = normalizeReceiptData(structured);
  const payee = structured.payee || structured.vendor || "Unknown"; // map vendor→payee
  const date = structured.date || todayISO();
  return {
    date,
    payee,
    currency: structured.currency || DEFAULT_CONFIG.currency,
    receipt,
    paymentAccount: structured.paymentAccount ?? undefined,
    memo: structured.memo ?? null,
    imageUrl: structured.imageUrl ?? null, // 👈 NEW
  };
}

function toPayload(result: ProcessingResult): NewCommandPayload {
  return validateNewCommandPayload({
    date: result.date,
    payee: result.payee,
    currency: result.currency,
    receipt: {
      items: result.receipt.items,
      subtotal: result.receipt.subtotal ?? null,
      tax: result.receipt.tax ?? null,
      total: result.receipt.total ?? null,
    },
    paymentAccount: result.paymentAccount,
    memo: result.memo ?? null,
    imageUrl: result.imageUrl ?? null, // 👈 NEW
  });
}

function updateHistoryWithLedger(
  setHistory: SetHistory,
  ledgerPreview: string
): void {
  setHistory((h) => [
    ...h.slice(0, -1),
    {
      type: "output",
      content: "```ledger\n" + ledgerPreview + "\n```",
      format: "markdown",
    },
  ]);
}

function updateHistoryWithSuccess(setHistory: SetHistory): void {
  setHistory((h) => [
    ...h,
    {
      type: "output",
      content: "_✅ Entry saved to your ledger (Supabase)_",
      format: "markdown",
    },
  ]);
}

function updateHistoryWithError(setHistory: SetHistory, message: string): void {
  setHistory((h) => [
    ...h.slice(0, -1),
    {
      type: "output",
      content: `<my-alert message="❌ ${message}" />`,
      format: "markdown",
    },
  ]);
}

async function processAndSaveEntry(
  result: ProcessingResult,
  setHistory: SetHistory
): Promise<void> {
  // Validate payload strictly before render/save
  let payload: NewCommandPayload;
  try {
    payload = toPayload(result);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Invalid data. Please check input.";
    updateHistoryWithError(setHistory, msg);
    return;
  }

  const posts = buildPostingsFromReceipt(payload.receipt, {
    currency: payload.currency,
    paymentAccount: payload.paymentAccount || DEFAULT_CONFIG.paymentAccount,
    includeTaxLine: DEFAULT_CONFIG.includeTaxLine,
    mapAccount: accountMap,
    vendor: payload.payee, // used by mappers that rely on payee
  });

  const ledgerPreview = renderLedger(
    payload.date,
    payload.payee,
    posts,
    payload.currency
  );

  updateHistoryWithLedger(setHistory, ledgerPreview);

  try {
    await serverHandleNewCommand(payload);
  } catch (e) {
    updateHistoryWithError(
      setHistory,
      e instanceof Error ? e.message : String(e)
    );
    return;
  }

  updateHistoryWithSuccess(setHistory);
}

export async function handleNew(
  setHistory: SetHistory,
  cmd: string,
  arg: string
): Promise<boolean> {
  setHistory((h) => [
    ...(h ?? []),
    { type: "input", content: cmd },
    {
      type: "output",
      content: "_Creating Ledger entry..._",
      format: "markdown",
    },
  ]);

  try {
    // 1) Structured JSON path
    const structuredInput = tryParseJSONInput(arg);
    if (structuredInput) {
      const result = processStructuredInput(structuredInput);
      await processAndSaveEntry(result, setHistory);
      return true;
    }

    // 2) Manual grammar path
    const parsed = parseManualNewCommand(arg);
    const result: ProcessingResult = {
      date: parsed.date,
      payee: parsed.payee,
      currency: parsed.currency,
      receipt: parsed.receipt,
      paymentAccount: parsed.paymentAccount,
      memo: parsed.memo ?? null,
    };

    await processAndSaveEntry(result, setHistory);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    updateHistoryWithError(setHistory, message);
    return true;
  }
}
