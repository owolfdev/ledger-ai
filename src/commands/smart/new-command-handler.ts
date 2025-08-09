// /commands/smart/new-command-handler.ts
"use client";

import { TerminalOutputRendererProps } from "@/types/terminal";
// Suppress TS error for importing Server Action into client file.
// Next.js runs it over the network at runtime.
import { handleNewCommand as serverHandleNewCommand } from "@/app/actions/ledger/route-new-commands";
import {
  buildPostingsFromReceipt,
  type ReceiptShape,
} from "@/lib/ledger/build-postings-from-receipt";
import { renderLedger } from "@/lib/ledger/render-ledger";
import { parseManualNewCommand } from "@/lib/ledger/parse-manual-command";

export type SetHistory = React.Dispatch<
  React.SetStateAction<TerminalOutputRendererProps[]>
>;

// Configuration constants
const DEFAULT_CONFIG = {
  currency: "THB",
  paymentAccount: "Assets:Cash",
  includeTaxLine: true,
} as const;

// Type definitions for structured input
interface StructuredInput {
  receipt?: ReceiptShape;
  items?: ReceiptShape["items"];
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  date?: string;
  payee?: string;
  currency?: string;
}

interface ProcessingResult {
  date: string;
  payee: string;
  currency: string;
  receipt: ReceiptShape;
}

// Type guard for structured input validation
function isValidStructuredInput(obj: unknown): obj is StructuredInput {
  if (!obj || typeof obj !== "object") return false;
  const input = obj as Record<string, unknown>;

  // Must have either a receipt object or items array
  const hasReceipt = input.receipt && typeof input.receipt === "object";
  const hasItems = Array.isArray(input.items);

  return Boolean(hasReceipt || hasItems);
}

// Helper function to safely parse JSON input
function tryParseJSONInput(input: string): StructuredInput | null {
  try {
    const raw = input.trim().startsWith("{")
      ? input.trim()
      : input.trim().replace(/^new\s+/i, "");

    if (!raw.startsWith("{")) return null;

    const obj = JSON.parse(raw);
    return isValidStructuredInput(obj) ? obj : null;
  } catch {
    return null;
  }
}

// Helper function to normalize receipt data from structured input
function normalizeReceiptData(structured: StructuredInput): ReceiptShape {
  // Prefer structured.receipt if it has items
  if (structured.receipt?.items) {
    return structured.receipt;
  }

  // Otherwise build from root-level properties
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

// Helper function to process structured input into standardized format
function processStructuredInput(structured: StructuredInput): ProcessingResult {
  const receipt = normalizeReceiptData(structured);

  return {
    date: structured.date || new Date().toISOString().slice(0, 10),
    payee: structured.payee || "Unknown",
    currency: structured.currency || DEFAULT_CONFIG.currency,
    receipt,
  };
}

// Helper function to update history with ledger preview
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

// Helper function to update history with success message
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

// Helper function to update history with error message
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

// Helper function to process and save entry
async function processAndSaveEntry(
  result: ProcessingResult,
  setHistory: SetHistory
): Promise<void> {
  const posts = buildPostingsFromReceipt(result.receipt, {
    currency: result.currency,
    paymentAccount: DEFAULT_CONFIG.paymentAccount,
    includeTaxLine: DEFAULT_CONFIG.includeTaxLine,
  });

  const ledgerPreview = renderLedger(
    result.date,
    result.payee,
    posts,
    result.currency
  );

  updateHistoryWithLedger(setHistory, ledgerPreview);

  try {
    await serverHandleNewCommand({
      date: result.date,
      payee: result.payee,
      currency: result.currency,
      receipt: result.receipt,
    });
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
  // Initialize history with input and loading state
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
    // Try structured JSON input first
    const structuredInput = tryParseJSONInput(arg);

    if (structuredInput) {
      const result = processStructuredInput(structuredInput);
      await processAndSaveEntry(result, setHistory);
      return true;
    }

    // Fall back to manual text parsing
    const parsed = parseManualNewCommand(arg);
    const result: ProcessingResult = {
      date: parsed.date,
      payee: parsed.payee,
      currency: parsed.currency,
      receipt: parsed.receipt,
    };

    await processAndSaveEntry(result, setHistory);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    updateHistoryWithError(setHistory, message);
    return true;
  }
}
