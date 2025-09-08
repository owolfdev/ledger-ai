// /commands/smart/add-command-handler.ts (Client-side AI processing)
"use client";

import { TerminalOutputRendererProps } from "@/types/terminal";
import { handleNewCommand as serverHandleNewCommand } from "@/app/actions/ledger/route-new-commands";
import { renderLedger } from "@/lib/ledger/render-ledger";
import { parseManualNewCommand } from "@/lib/ledger/parse-manual-command";
import { mapAccountWithHybridAI } from "@/lib/ledger/hybrid-database-mapper";
import { mapAccount } from "@/lib/ledger/account-map";
import {
  validateNewCommandPayload,
  type NewCommandPayload,
} from "@/lib/ledger/schemas";
import type {
  ReceiptShape,
  ReceiptItem,
} from "@/lib/ledger/build-postings-from-receipt";

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
  payee?: string;
  vendor?: string;
  currency?: string;
  memo?: string | null;
  paymentAccount?: string;
  imageUrl?: string | null;
  business?: string;
  type?: string; // NEW: transaction type
  useAI?: boolean;
}

interface ProcessingResult {
  date: string;
  payee: string;
  currency: string;
  receipt: ReceiptShape;
  paymentAccount?: string;
  memo?: string | null;
  imageUrl?: string | null;
  business?: string;
  type?: string; // NEW: transaction type
  useAI?: boolean;
}

// Client-side posting generation (pre-resolved accounts)
type ClientPosting = { account: string; amount: number; currency: string };

/**
 * Map payment method to proper account structure
 */
function mapPaymentMethodToAccount(
  paymentMethod: string,
  business: string = "Personal"
): string {
  const payment = paymentMethod.toLowerCase();

  // Credit card patterns
  if (payment.includes("credit") || payment.includes("card")) {
    return `Liabilities:${business}:Debt:CreditCard`;
  }

  // Bank account patterns
  if (
    payment.includes("bank") ||
    payment.includes("kasikorn") ||
    payment.includes("kbank")
  ) {
    return `Assets:Bank:${
      payment.includes("kasikorn") || payment.includes("kbank")
        ? "Kasikorn"
        : "Bank"
    }:${business}`;
  }

  // Cash patterns
  if (payment.includes("cash") || payment.includes("money")) {
    return `Assets:Cash`;
  }

  // Default to cash
  return `Assets:Cash`;
}

function generateDefaultMemo(receipt: ReceiptShape): string | null {
  if (!receipt.items || receipt.items.length === 0) return null;

  if (receipt.items.length === 1) {
    // Just the single item description
    return receipt.items[0].description || null;
  }

  // Multiple items: join with commas and include count
  const itemNames = receipt.items.map((i) => i.description).filter(Boolean);
  if (itemNames.length === 0) return null;
  return `${itemNames.join(", ")} (${receipt.items.length} items)`;
}

async function generateClientPostings(
  receipt: ReceiptShape,
  opts: {
    currency: string;
    paymentAccount: string;
    business?: string;
    vendor?: string;
    type?: string; // NEW: transaction type
    useAI: boolean;
  }
): Promise<ClientPosting[]> {
  const { currency, paymentAccount, business, vendor, useAI } = opts;
  const type = opts.type || "expense";

  // Check for opening balance patterns BEFORE any item processing
  const isOpeningBalance = receipt.items?.some(
    (item) =>
      item.description.toLowerCase().includes("opening") ||
      item.description.toLowerCase().includes("initial") ||
      item.description.toLowerCase().includes("starting") ||
      item.description.toLowerCase().includes("opening_balance") ||
      item.description.toLowerCase().includes("initial_balance")
  );

  console.log("🔍 Early opening balance detection:", {
    isOpeningBalance,
    type,
    items: receipt.items?.map((i) => i.description),
    total: receipt.total ?? receipt.subtotal,
  });

  // Skip ALL item processing for opening balances - they only need payment account + equity
  if (isOpeningBalance && type === "asset") {
    const total = receipt.total ?? receipt.subtotal ?? 0;

    // Normalize business name for consistent account paths
    const { normalizeBusinessNameSync } = await import(
      "@/lib/ledger/business-normalizer"
    );
    const normalizedBusiness = normalizeBusinessNameSync(
      business || "Personal"
    );

    const postings: ClientPosting[] = [
      {
        account: mapPaymentMethodToAccount(
          paymentAccount,
          normalizedBusiness.accountPrefix
        ),
        amount: +total,
        currency,
      },
      {
        account: `Equity:${normalizedBusiness.accountPrefix}:Opening-Balances`,
        amount: -total,
        currency,
      },
    ];
    console.log("✅ Created opening balance postings:", postings);
    return postings;
  }

  // Map all items to accounts (with AI if enabled)
  const itemMappings = await Promise.all(
    receipt.items.map(async (item) => {
      let account: string;
      let mappingSource = "static";

      if (useAI) {
        // Use database-driven mapping with feedback
        const result = await mapAccountWithHybridAI(item.description, {
          vendor,
          business,
          type: opts.type || "expense",
        });
        account = result;

        // Try to get mapping source from the database mapper
        try {
          const { hybridDatabaseMapper } = await import(
            "@/lib/ledger/hybrid-database-mapper"
          );
          const mappingResult = await hybridDatabaseMapper.mapAccount(
            item.description,
            vendor,
            business,
            undefined, // userId
            opts.type || "expense" // type parameter
          );
          mappingSource = mappingResult.source;
        } catch (error) {
          // Fallback to static if we can't get the source
          mappingSource = "static_fallback";
        }
      } else {
        account = mapAccount(item.description, {
          vendor,
          business,
          type: opts.type || "expense",
        });
        mappingSource = "static";
      }

      // Log mapping feedback
      console.log(
        `🗂️  Mapped "${item.description}" → ${account} (${mappingSource})`
      );

      return {
        account,
        amount: +(+item.price).toFixed(2),
        currency,
      };
    })
  );

  // Handle tax if present
  const postings: ClientPosting[] = [...itemMappings];
  if (receipt.tax && receipt.tax > 0) {
    let taxAccount: string;
    let taxMappingSource = "static";

    if (useAI) {
      // Use database-driven mapping with feedback
      const result = await mapAccountWithHybridAI("tax", { business });
      taxAccount = result;

      // Try to get mapping source from the database mapper
      try {
        const { hybridDatabaseMapper } = await import(
          "@/lib/ledger/hybrid-database-mapper"
        );
        const mappingResult = await hybridDatabaseMapper.mapAccount(
          "tax",
          undefined,
          business
        );
        taxMappingSource = mappingResult.source;
      } catch (error) {
        taxMappingSource = "static_fallback";
      }
    } else {
      taxAccount = mapAccount("tax", { business });
      taxMappingSource = "static";
    }

    // Log tax mapping feedback
    console.log(`🗂️  Mapped "tax" → ${taxAccount} (${taxMappingSource})`);

    postings.push({
      account: taxAccount,
      amount: +(+receipt.tax).toFixed(2),
      currency,
    });
  }

  // Add payment account based on transaction type
  const total =
    receipt.total ??
    receipt.subtotal ??
    postings.reduce((sum, p) => sum + p.amount, 0);

  if (type === "income") {
    // For income: cash increases (positive), income accounts are credited (negative)
    postings.push({
      account: mapPaymentMethodToAccount(paymentAccount, business),
      amount: +total,
      currency,
    });
    // Flip the signs of the income accounts to make them credits
    for (let i = 0; i < postings.length - 1; i++) {
      postings[i].amount = -postings[i].amount;
    }
  } else {
    // For expenses/assets/liabilities: payment account decreases (negative)
    postings.push({
      account: mapPaymentMethodToAccount(paymentAccount, business),
      amount: -total,
      currency,
    });
  }

  // Balance check and adjustment
  const sum = +postings.reduce((s, p) => s + p.amount, 0).toFixed(2);
  if (Math.abs(sum) > 0.005) {
    const diff = -sum;
    // Find smallest positive posting to adjust
    let idx = -1;
    let min = Number.POSITIVE_INFINITY;
    for (let i = 0; i < postings.length - 1; i++) {
      // Exclude payment account
      if (postings[i].amount > 0 && postings[i].amount < min) {
        min = postings[i].amount;
        idx = i;
      }
    }

    if (idx >= 0) {
      postings[idx] = {
        ...postings[idx],
        amount: +(postings[idx].amount + diff).toFixed(2),
      };
    }
  }

  return postings;
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
  const payee = structured.payee || structured.vendor || "Unknown";
  const date = structured.date || todayISO();
  return {
    date,
    payee,
    currency: structured.currency || DEFAULT_CONFIG.currency,
    receipt,
    paymentAccount: structured.paymentAccount ?? undefined,
    memo: structured.memo ?? null,
    imageUrl: structured.imageUrl ?? null,
    business: structured.business,
    type: structured.type || "expense", // NEW: default to expense
    useAI: structured.useAI ?? true,
  };
}

function toPayload(
  result: ProcessingResult,
  postings?: ClientPosting[]
): NewCommandPayload {
  return {
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
    imageUrl: result.imageUrl ?? null,
    business: result.business,
    type: result.type, // NEW: include transaction type
    postings: postings, // NEW: include the generated postings
  };
}

function formatZodErrorForAlert(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (Array.isArray(parsed)) {
        return parsed
          .map((err: { message: string }) => `• ${err.message}`)
          .join("\n");
      }
    } catch {
      return error.message;
    }
  }
  return String(error);
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

function updateHistoryWithSuccess(
  setHistory: SetHistory,
  entryId?: string
): void {
  let successMessage: string;

  if (entryId) {
    successMessage = `✅ Entry saved to your ledger - <a href="/ledger/entry/${entryId}">View Entry #${entryId}</a>`;
  } else {
    successMessage = "_✅ Entry saved to your ledger (Supabase)_";
  }

  setHistory((h) => [
    ...h,
    {
      type: "output",
      content: successMessage,
      format: "markdown",
    },
  ]);
}

function updateHistoryWithError(setHistory: SetHistory, message: string): void {
  const formattedMessage = formatZodErrorForAlert(message);

  setHistory((h) => [
    ...h.slice(0, -1),
    {
      type: "output",
      content: `<custom-alert message="❌ ${formattedMessage}" />`,
      format: "markdown",
    },
  ]);
}

function updateHistoryWithAIStatus(
  setHistory: SetHistory,
  status: "using" | "failed" | "disabled"
): void {
  let message: string;

  switch (status) {
    case "using":
      message = "_🤖 Using AI for smart categorization..._";
      break;
    case "failed":
      message = "_⚠️ AI categorization failed, using rule-based fallback_";
      break;
    case "disabled":
      message = "_📋 Using rule-based categorization_";
      break;
  }

  setHistory((h) => [
    ...h.slice(0, -1),
    {
      type: "output",
      content: message,
      format: "markdown",
    },
  ]);
}

async function processAndSaveEntry(
  result: ProcessingResult,
  setHistory: SetHistory,
  isDryRun: boolean = false
): Promise<void> {
  if (!result.memo || result.memo.trim() === "") {
    const autoMemo = generateDefaultMemo(result.receipt);
    if (autoMemo) result.memo = autoMemo;
  }

  let payload: NewCommandPayload;
  try {
    // Generate postings with AI on client side
    const postings = await generateClientPostings(result.receipt, {
      currency: result.currency,
      paymentAccount: result.paymentAccount || DEFAULT_CONFIG.paymentAccount,
      business: result.business,
      vendor: result.payee,
      type: result.type || "expense",
      useAI: result.useAI !== false,
    });

    payload = toPayload(result, postings);
  } catch (err) {
    let formattedError: string;

    if (err instanceof Error) {
      if (err.message.trim().startsWith("[")) {
        try {
          const zodErrors = JSON.parse(err.message);
          formattedError = Array.isArray(zodErrors)
            ? zodErrors
                .map((e: { message: string }) => `• ${e.message}`)
                .join("\n")
            : err.message;
        } catch {
          formattedError = err.message;
        }
      } else {
        formattedError = err.message;
      }
    } else {
      formattedError = "Invalid data. Please check input.";
    }

    updateHistoryWithError(setHistory, formattedError);
    return;
  }

  // Show AI status
  if (result.useAI !== false) {
    updateHistoryWithAIStatus(setHistory, "using");
  } else {
    updateHistoryWithAIStatus(setHistory, "disabled");
  }

  try {
    const ledgerPreview = renderLedger(
      payload.date,
      payload.payee,
      payload.postings || [],
      payload.currency
    );

    updateHistoryWithLedger(setHistory, ledgerPreview);

    if (isDryRun) {
      // Dry-run mode: show preview without saving
      setHistory((h) => [
        ...h.slice(0, -1), // Remove the last "Creating..." message
        {
          type: "output",
          content: `**Preview (--dry-run):**\n\n\`\`\`\n${ledgerPreview}\n\`\`\`\n\nRun with \`--commit\` to actually save this entry.`,
          format: "markdown",
        },
      ]);
      return;
    }

    const serverResult = await serverHandleNewCommand(payload);

    if (serverResult.ok) {
      updateHistoryWithSuccess(setHistory, serverResult.entry_id?.toString());
    } else {
      updateHistoryWithError(setHistory, serverResult.error);
    }
  } catch (e) {
    // If AI mapping failed, show warning and retry with rules
    if (result.useAI !== false && e instanceof Error) {
      updateHistoryWithAIStatus(setHistory, "failed");

      try {
        // Retry with rule-based mapping
        const postings = await generateClientPostings(result.receipt, {
          currency: result.currency,
          paymentAccount:
            result.paymentAccount || DEFAULT_CONFIG.paymentAccount,
          business: result.business,
          vendor: result.payee,
          type: result.type || "expense",
          useAI: false, // Force rule-based
        });

        const ledgerPreview = renderLedger(
          payload.date,
          payload.payee,
          postings,
          payload.currency
        );

        updateHistoryWithLedger(setHistory, ledgerPreview);

        if (isDryRun) {
          // Dry-run mode: show preview without saving
          setHistory((h) => [
            ...h.slice(0, -1), // Remove the last "Creating..." message
            {
              type: "output",
              content: `**Preview (--dry-run, rule-based):**\n\n\`\`\`\n${ledgerPreview}\n\`\`\`\n\nRun with \`--commit\` to actually save this entry.`,
              format: "markdown",
            },
          ]);
          return;
        }

        // Create new payload with rule-based postings
        const retryPayload = toPayload(result, postings);
        const serverResult = await serverHandleNewCommand(retryPayload);

        if (serverResult.ok) {
          updateHistoryWithSuccess(
            setHistory,
            serverResult.entry_id?.toString()
          );
        } else {
          updateHistoryWithError(setHistory, serverResult.error);
        }
      } catch (retryError) {
        updateHistoryWithError(
          setHistory,
          retryError instanceof Error ? retryError.message : String(retryError)
        );
      }
    } else {
      updateHistoryWithError(
        setHistory,
        e instanceof Error ? e.message : String(e)
      );
    }
  }
}

function parseManualCommandWithAI(arg: string): {
  parsed: ReturnType<typeof parseManualNewCommand>;
  useAI: boolean;
} {
  // Check for AI flags in the command (support both long and short flags)
  const useAIFlag = /--use-ai\b|-u\b/.test(arg);
  const noAIFlag = /--no-ai\b|-n\b/.test(arg);

  // Remove AI flags before parsing (both long and short versions)
  const cleanedArg = arg
    .replace(/--use-ai\b/g, "")
    .replace(/--no-ai\b/g, "")
    .replace(/-u\b/g, "")
    .replace(/-n\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const parsed = parseManualNewCommand(cleanedArg);

  // Determine AI usage: explicit flags override default
  let useAI = true; // Default to AI enabled
  if (noAIFlag) useAI = false;
  if (useAIFlag) useAI = true;

  return { parsed, useAI };
}

// Convert new 'add' syntax to old 'new -i' syntax for compatibility
function convertAddToNewSyntax(arg: string): string {
  // Parse the arguments to extract items and flags
  const parts = arg.trim().split(/\s+/);
  const items: string[] = [];
  const flags: string[] = [];

  let i = 0;
  while (i < parts.length) {
    const part = parts[i];

    // If it's a flag, add it to flags
    if (part.startsWith("-")) {
      flags.push(part);
      // If it has a value, add that too
      if (i + 1 < parts.length && !parts[i + 1].startsWith("-")) {
        flags.push(parts[i + 1]);
        i += 2;
      } else {
        i++;
      }
    } else {
      // It's an item or amount
      items.push(part);
      i++;
    }
  }

  // Convert to new -i syntax
  if (items.length >= 2) {
    // First item is description, second is amount
    const description = items[0];
    const amount = items[1];
    const remainingItems = items.slice(2);

    // Build the new command
    let newCmd = `-i ${description} ${amount}`;

    // Add remaining items as additional items
    for (let j = 0; j < remainingItems.length; j += 2) {
      if (j + 1 < remainingItems.length) {
        newCmd += ` ${remainingItems[j]} ${remainingItems[j + 1]}`;
      }
    }

    // Add flags
    if (flags.length > 0) {
      newCmd += ` ${flags.join(" ")}`;
    }

    return newCmd;
  }

  // If we can't parse it properly, return the original arg
  return arg;
}

export async function handleNew(
  setHistory: SetHistory,
  cmd: string,
  arg: string
): Promise<boolean> {
  // Check for --dry-run flag
  const isDryRun = /--dry-run\b/.test(arg);
  const isCommit = /--commit\b/.test(arg);

  // Remove dry-run and commit flags from arg for processing
  let cleanedArg = arg
    .replace(/--dry-run\b/g, "")
    .replace(/--commit\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Convert 'add' syntax to 'new -i' syntax for compatibility
  if (cmd.startsWith("add ")) {
    cleanedArg = convertAddToNewSyntax(cleanedArg);
  }

  setHistory((h) => [
    ...(h ?? []),
    { type: "input", content: cmd },
    {
      type: "output",
      content: isDryRun
        ? "_Previewing Ledger entry..._"
        : "_Creating Ledger entry..._",
      format: "markdown",
    },
  ]);

  try {
    // 1) Structured JSON path
    const structuredInput = tryParseJSONInput(cleanedArg);
    if (structuredInput) {
      const result = processStructuredInput(structuredInput);
      await processAndSaveEntry(result, setHistory, isDryRun);
      return true;
    }

    // 2) Manual grammar path with AI detection
    const { parsed, useAI } = parseManualCommandWithAI(cleanedArg);
    const result: ProcessingResult = {
      date: parsed.date,
      payee: parsed.payee,
      currency: parsed.currency,
      receipt: parsed.receipt,
      paymentAccount: parsed.paymentAccount,
      memo: parsed.memo ?? null,
      imageUrl: parsed.imageUrl ?? null,
      business: parsed.business,
      type: parsed.type, // NEW: include transaction type
      useAI,
    };

    await processAndSaveEntry(result, setHistory, isDryRun);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    updateHistoryWithError(setHistory, message);
    return true;
  }
}
