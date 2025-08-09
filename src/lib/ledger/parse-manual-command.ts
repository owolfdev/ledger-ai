// /lib/ledger/parse-manual-command.ts

import { ReceiptShape, ReceiptItem } from "./build-postings-from-receipt";

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayLocal(): string {
  return formatLocalDate(new Date());
}

export const PARSER_GRAMMAR = {
  date: {
    description:
      "Optional date, defaults to today. Supports relative dates and common formats.",
    examples: ["2025/08/10", "yesterday", "last Friday", "2 days ago"],
  },
  items: {
    description:
      "One or more <desc> $<amount> pairs, optionally with quantity, unit price, and category override.",
    examples: [
      "coffee $5",
      "2x coffee @ $5",
      "apples $10 Expenses:Personal:Groceries",
      "tax $2.78",
    ],
  },
  paymentMethods: {
    description: "Optional, defaults to cash. Maps aliases to account names.",
    map: {
      "credit card": "Liabilities:CreditCard",
      "bank card": "Assets:Bank:Checking",
      paypal: "Assets:PayPal",
      cash: "Assets:Cash",
    },
  },
  memo: {
    description: 'Optional memo stored in DB. Format: memo "<text>"',
    example: 'memo "weekly groceries"',
  },
  currency: {
    description:
      "Currency symbol or ISO code, defaults to config default (THB).",
    examples: ["$5", "5 USD", "฿100"],
  },
} as const;

type ParsedItem = ReceiptItem & {
  quantity?: number;
  category?: string;
};

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let buffer = "";
  let inQuotes = false;

  for (const char of input.trim()) {
    if (char === '"') {
      inQuotes = !inQuotes;
      buffer += char;
      continue;
    }
    if (char === "," && !inQuotes) {
      tokens.push(buffer.trim());
      buffer = "";
    } else {
      buffer += char;
    }
  }
  if (buffer) tokens.push(buffer.trim());
  return tokens.filter((t) => t.length > 0);
}

function parseDateToken(token: string): string | null {
  const lower = token.toLowerCase();

  if (lower === "today") {
    return formatLocalDate(new Date());
  }
  if (lower === "yesterday") {
    const d = new Date();
    d.setDate(d.getDate() - 1); // local subtraction
    return formatLocalDate(d);
  }

  // YYYY/MM/DD or YYYY-MM-DD
  const match = token.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function parseItemsAndMaybeInlineVendor(tokens: string[]): {
  items: ParsedItem[];
  stopIndex: number; // index in tokens after the last consumed item token
  vendorInline?: string; // vendor found within the last item token (no trailing comma case)
} {
  const items: ParsedItem[] = [];
  let stopIndex = tokens.length;
  let vendorInline: string | undefined;

  // full item regex (entire token is an item)
  const fullItemRe =
    /^(?:(\d+)x\s*)?(.+?)(?:\s+@\s*\$?(\d+(?:\.\d{1,2})?))?\s+\$?(\d+(?:\.\d{1,2})?)(?:\s+(Expenses:[\w:]+))?$/i;
  // item prefix with tail (captures inline vendor/payment tail)
  const prefixWithTailRe =
    /^(?:(\d+)x\s*)?(.+?)(?:\s+@\s*\$?(\d+(?:\.\d{1,2})?))?\s+\$?(\d+(?:\.\d{1,2})?)\b(?:\s+(.+))?$/i;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // Case 1: whole token is an item
    const mFull = t.match(fullItemRe);
    if (mFull) {
      const [, qtyStr, descRaw, _unitPriceStr, priceStr, categoryOverride] =
        mFull;
      const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;
      const description = descRaw.trim();
      const price = parseFloat(priceStr);
      let category = categoryOverride || undefined;

      if (description.toLowerCase() === "tax" && !category) {
        category = "Expenses:Taxes:Sales";
      }

      items.push({ description, price, quantity, category });
      continue; // keep parsing items
    }

    // Case 2: token starts like an item but has trailing words (inline vendor)
    const mPrefix = t.match(prefixWithTailRe);
    if (mPrefix) {
      const [, qtyStr, descRaw, _unitPriceStr, priceStr, tail] = mPrefix;
      const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;
      const description = descRaw.trim();
      const price = parseFloat(priceStr);
      let category: string | undefined;
      if (description.toLowerCase() === "tax") {
        category = "Expenses:Taxes:Sales";
      }
      items.push({ description, price, quantity, category });

      vendorInline = tail ? tail.trim() : undefined;
      stopIndex = i + 1; // we consumed this token
      break; // stop: the rest is vendor/payment/memo
    }

    // Case 3: not an item — stop here, next token is vendor
    stopIndex = i;
    break;
  }

  if (stopIndex === tokens.length) {
    // consumed all tokens as items; vendor will be missing, caller will default
  }

  return { items, stopIndex, vendorInline };
}

function mapPaymentMethod(token: string): string {
  const lower = token.toLowerCase();
  for (const [alias, account] of Object.entries(
    PARSER_GRAMMAR.paymentMethods.map
  )) {
    if (lower === alias) return account;
  }
  return PARSER_GRAMMAR.paymentMethods.map.cash;
}

function extractMemo(tokens: string[]): { memo?: string; tokens: string[] } {
  const updatedTokens: string[] = [];
  let memo: string | undefined;

  for (const t of tokens) {
    if (t.toLowerCase().startsWith("memo ")) {
      const match = t.match(/^memo\s+"(.+)"$/i);
      if (match) {
        memo = match[1];
        continue; // drop memo token
      }
    }
    updatedTokens.push(t);
  }
  return { memo, tokens: updatedTokens };
}

// Example (variables <>; optional []):
// new <item> $<price>[, <item> $<price>]... [,<vendor>] [,<payment method>] [, memo "<text>"] [<date>]
// ex1: new apples $10, butter $5, Safeway, credit card, memo "weekly groceries"
// ex2: new 2025/08/09 coffee $5 Starbucks
export function parseManualNewCommand(input: string): {
  date: string;
  payee: string;
  currency: string;
  receipt: ReceiptShape;
  memo?: string;
  paymentAccount: string;
} {
  let tokens = tokenize(input);

  // 1) optional date (first token only)
  let date = formatLocalDate(new Date());
  let dateTokenIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    const maybeDate = parseDateToken(tokens[i]);
    if (maybeDate) {
      date = maybeDate;
      dateTokenIndex = i;
      break; // stop after finding the first valid date
    }
  }

  if (dateTokenIndex >= 0) {
    tokens.splice(dateTokenIndex, 1); // remove the date token so it doesn't interfere with vendor/items
  }

  // 2) memo extraction (removes memo tokens)
  const memoResult = extractMemo(tokens);
  tokens = memoResult.tokens;

  // 3) parse items, allow inline vendor on last item token
  const {
    items: parsedItems,
    stopIndex,
    vendorInline,
  } = parseItemsAndMaybeInlineVendor(tokens);
  if (parsedItems.length === 0) {
    throw new Error("No valid items found in input.");
  }

  // Normalize to ReceiptItem[] for ReceiptShape
  const normalizedItems: ReceiptItem[] = parsedItems.map((it) => ({
    description: it.description,
    price: it.price,
  }));

  // 4) vendor
  const vendorToken = vendorInline ?? tokens[stopIndex] ?? "Unknown Vendor";
  const payee = vendorToken;

  // 5) payment method (next token, if present and not memo)
  let paymentAccount: string = PARSER_GRAMMAR.paymentMethods.map.cash;

  const pmCandidateIndex = vendorInline ? stopIndex : stopIndex + 1;
  if (tokens[pmCandidateIndex]) {
    paymentAccount = mapPaymentMethod(tokens[pmCandidateIndex]); // now works for all mapped values
  }
  // 6) receipt totals
  const subtotal = normalizedItems.reduce((sum, i) => sum + i.price, 0);
  const taxAmount =
    parsedItems
      .filter((i) => i.category === "Expenses:Taxes:Sales")
      .reduce((sum, i) => sum + i.price, 0) || null;

  const receipt: ReceiptShape = {
    items: normalizedItems,
    subtotal,
    tax: taxAmount,
    total: subtotal,
  };

  // 7) currency detection (symbol-based, minimal)
  let currency = "THB";
  if (/\$/.test(input)) currency = "USD";
  if (/฿/.test(input)) currency = "THB";

  return {
    date,
    payee,
    currency,
    receipt,
    memo: memoResult.memo,
    paymentAccount,
  };
}
