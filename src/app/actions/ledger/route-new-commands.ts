// /app/actions/ledger/route-new-commands.ts (refactored)
"use server";

import { createLedgerFromStructured } from "@/app/actions/ledger/create-ledger-from-structured";
import {
  parseManualNewCommand,
  getLocalDateYYYYMMDD,
} from "@/lib/ledger/parse-manual-command";

// Configuration constants
const DEFAULT_CONFIG = {
  currency: "THB",
  paymentAccount: "Assets:Cash",
  payee: "Unknown",
} as const;

// Type definitions
interface ReceiptItem {
  description: string;
  price: number;
}

interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
}

interface StructuredInput {
  date?: string; // YYYY-MM-DD
  payee?: string;
  currency?: string;
  receipt?: ReceiptData;
  // Also accept root-level receipt fields for flexibility
  items?: ReceiptItem[];
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
}

export type NewCommandInput = string | StructuredInput;

interface ProcessedCommand {
  date: string;
  payee: string;
  currency: string;
  receipt: ReceiptData;
  paymentAccount: string;
}

// Type guard for structured input validation
function isValidStructuredInput(obj: unknown): obj is StructuredInput {
  if (!obj || typeof obj !== "object") return false;

  const input = obj as Record<string, unknown>;

  // Must have either receipt.items or root-level items
  const hasReceiptItems =
    input.receipt &&
    typeof input.receipt === "object" &&
    "items" in input.receipt &&
    Array.isArray(input.receipt.items);

  const hasRootItems = Array.isArray(input.items);

  return Boolean(hasReceiptItems || hasRootItems);
}

// Helper function to safely parse JSON string
function parseJsonInput(jsonString: string): StructuredInput {
  try {
    const parsed = JSON.parse(jsonString);

    if (!isValidStructuredInput(parsed)) {
      throw new Error("Invalid JSON structure: missing receipt items");
    }

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format");
    }
    throw error;
  }
}

// Helper function to normalize receipt data from various input formats
function normalizeReceiptData(input: StructuredInput): ReceiptData {
  // Prefer nested receipt structure
  if (input.receipt?.items) {
    if (
      !Array.isArray(input.receipt.items) ||
      input.receipt.items.length === 0
    ) {
      throw new Error("Receipt items must be a non-empty array");
    }
    return input.receipt;
  }

  // Fall back to root-level items
  if (Array.isArray(input.items) && input.items.length > 0) {
    return {
      items: input.items,
      subtotal: input.subtotal ?? null,
      tax: input.tax ?? null,
      total: input.total ?? null,
    };
  }

  throw new Error("Structured input missing receipt.items");
}

// Helper function to validate receipt items
function validateReceiptItems(items: ReceiptItem[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Receipt must contain at least one item");
  }

  for (const [index, item] of items.entries()) {
    if (!item.description || typeof item.description !== "string") {
      throw new Error(
        `Item ${index + 1}: description is required and must be a string`
      );
    }

    if (typeof item.price !== "number" || !Number.isFinite(item.price)) {
      throw new Error(`Item ${index + 1}: price must be a valid number`);
    }
  }
}

// Helper function to process structured input into standardized format
function processStructuredInput(input: StructuredInput): ProcessedCommand {
  const receipt = normalizeReceiptData(input);
  validateReceiptItems(receipt.items);

  return {
    date: input.date || getLocalDateYYYYMMDD(),
    payee: input.payee || DEFAULT_CONFIG.payee,
    currency: input.currency || DEFAULT_CONFIG.currency,
    receipt,
    paymentAccount: DEFAULT_CONFIG.paymentAccount,
  };
}

// Helper function to process manual text input
function processManualInput(textInput: string): ProcessedCommand {
  const parsed = parseManualNewCommand(textInput);

  return {
    date: parsed.date,
    payee: parsed.payee,
    currency: parsed.currency,
    receipt: parsed.receipt,
    paymentAccount: DEFAULT_CONFIG.paymentAccount,
  };
}

// Main handler function
export async function handleNewCommand(arg: NewCommandInput): Promise<void> {
  let processedCommand: ProcessedCommand;

  if (typeof arg === "string") {
    const trimmedInput = arg.trim();

    // Handle JSON string input: `new { ...json... }`
    if (trimmedInput.startsWith("{")) {
      const structuredInput = parseJsonInput(trimmedInput);
      processedCommand = processStructuredInput(structuredInput);
    } else {
      // Handle manual text input
      processedCommand = processManualInput(trimmedInput);
    }
  } else {
    // Handle structured object input
    if (!isValidStructuredInput(arg)) {
      throw new Error("Invalid structured input format");
    }
    processedCommand = processStructuredInput(arg);
  }
  // Create the ledger entry
  await createLedgerFromStructured({
    date: processedCommand.date,
    payee: processedCommand.payee,
    receipt: processedCommand.receipt,
    currency: processedCommand.currency,
    paymentAccount: processedCommand.paymentAccount,
  });
}
