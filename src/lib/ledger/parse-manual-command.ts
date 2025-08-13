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
      "One or more <desc> <amount> pairs, optionally with quantity and unit price.",
    examples: ["coffee $5", "2x coffee @ $5", "coffee $6, pastry $4"],
  },
  vendor: {
    description: "Vendor/merchant using @ symbol (like email addresses).",
    examples: ["@ Starbucks", "@ HomeDepot", '@ "Coffee Shop"'],
  },
  business: {
    description: "Business context using prefix or --business flag.",
    examples: [
      "MyBrick: items...",
      "--business MyOnlineBusiness",
      "--business Personal",
    ],
  },
  payment: {
    description: "Payment method using --payment flag.",
    examples: ["--payment cash", '--payment "credit card"', "--payment paypal"],
    map: {
      cash: "Assets:Cash",
      "credit card": "Liabilities:CreditCard",
      "bank card": "Assets:Bank:Checking",
      paypal: "Assets:PayPal",
    },
  },
  memo: {
    description: "Optional memo using --memo flag.",
    examples: ['--memo "client meeting"', '--memo "weekly supplies"'],
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

  // First split by commas (for multiple items)
  const commaSeparated = [];
  for (const char of input.trim()) {
    if (char === '"') {
      inQuotes = !inQuotes;
      buffer += char;
      continue;
    }
    if (char === "," && !inQuotes) {
      commaSeparated.push(buffer.trim());
      buffer = "";
    } else {
      buffer += char;
    }
  }
  if (buffer) commaSeparated.push(buffer.trim());

  // Then split each comma-separated part by spaces (for flags)
  for (const part of commaSeparated.filter((p) => p.length > 0)) {
    const spaceSeparated = [];
    buffer = "";
    inQuotes = false;

    for (const char of part) {
      if (char === '"') {
        inQuotes = !inQuotes;
        buffer += char;
        continue;
      }
      if (char === " " && !inQuotes) {
        if (buffer.trim()) spaceSeparated.push(buffer.trim());
        buffer = "";
      } else {
        buffer += char;
      }
    }
    if (buffer.trim()) spaceSeparated.push(buffer.trim());

    // Now reconstruct meaningful tokens
    // Keep item parts together, but separate flags
    let currentToken = "";
    let i = 0;

    while (i < spaceSeparated.length) {
      const token = spaceSeparated[i];

      // If we hit a flag, save current token and start flag processing
      if (token.startsWith("--")) {
        if (currentToken.trim()) {
          tokens.push(currentToken.trim());
          currentToken = "";
        }
        tokens.push(token);
        // Add the flag value if it exists
        if (
          i + 1 < spaceSeparated.length &&
          !spaceSeparated[i + 1].startsWith("--")
        ) {
          i++;
          tokens.push(spaceSeparated[i]);
        }
      } else {
        // Add to current token
        currentToken += (currentToken ? " " : "") + token;
      }
      i++;
    }

    // Don't forget the last token
    if (currentToken.trim()) {
      tokens.push(currentToken.trim());
    }
  }

  return tokens.filter((t) => t.length > 0);
}
function parseDateToken(token: string): string | null {
  const lower = token.toLowerCase();

  if (lower === "today") {
    return formatLocalDate(new Date());
  }
  if (lower === "yesterday") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
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

function extractBusinessFromInput(input: string): {
  business?: string;
  cleanInput: string;
} {
  // Pattern: BusinessName: (prefix syntax)
  const prefixMatch = input.match(/^(\w+):\s*(.+)/i);
  if (prefixMatch) {
    return {
      business: prefixMatch[1],
      cleanInput: prefixMatch[2],
    };
  }

  // Continue with original input for flag-based parsing
  return { cleanInput: input };
}

function extractFlags(tokens: string[]): {
  business?: string;
  payment?: string;
  memo?: string;
  date?: string;
  tokens: string[];
} {
  const updatedTokens: string[] = [];
  let business: string | undefined;
  let payment: string | undefined;
  let memo: string | undefined;
  let date: string | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // --business flag
    if (token === "--business" && i + 1 < tokens.length) {
      business = tokens[i + 1];
      i++; // Skip the value token
      continue;
    }

    // --payment flag
    if (token === "--payment" && i + 1 < tokens.length) {
      payment = tokens[i + 1];
      i++; // Skip the value token
      continue;
    }

    // --memo flag
    if (token === "--memo" && i + 1 < tokens.length) {
      const memoValue = tokens[i + 1];
      // Remove quotes if present
      memo = memoValue.replace(/^"(.*)"$/, "$1");
      i++; // Skip the value token
      continue;
    }

    // --date flag
    if (token === "--date" && i + 1 < tokens.length) {
      const dateValue = tokens[i + 1];
      const parsedDate = parseDateToken(dateValue);
      if (parsedDate) {
        date = parsedDate;
      }
      i++; // Skip the value token
      continue;
    }

    // Keep non-flag tokens
    updatedTokens.push(token);
  }

  return { business, payment, memo, date, tokens: updatedTokens };
}

function parseItemsAndVendor(tokens: string[]): {
  items: ParsedItem[];
  vendor?: string;
} {
  const items: ParsedItem[] = [];
  let vendor: string | undefined;

  // Process each token to find items and vendor
  for (const token of tokens) {
    // Check if token contains @ vendor syntax
    const atIndex = token.indexOf(" @ ");
    if (atIndex !== -1) {
      // Split token at @ symbol
      const itemPart = token.substring(0, atIndex).trim();
      vendor = token.substring(atIndex + 3).trim(); // +3 for ' @ '

      // Parse the item part if it exists
      if (itemPart) {
        const parsedItem = parseItemToken(itemPart);
        if (parsedItem) items.push(parsedItem);
      }
    } else if (token.startsWith("@ ")) {
      // Standalone vendor token: @ Starbucks
      vendor = token.substring(2).trim();
    } else {
      // Regular item token
      const parsedItem = parseItemToken(token);
      if (parsedItem) items.push(parsedItem);
    }
  }

  return { items, vendor };
}

function parseItemToken(token: string): ParsedItem | null {
  // Item regex: [quantity x] description amount
  const itemRegex = /^(?:(\d+)x\s*)?(.+?)\s+[\$฿]?(\d+(?:\.\d{1,2})?)$/i;
  const match = token.match(itemRegex);

  if (!match) return null;

  const [, qtyStr, description, priceStr] = match;
  const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;
  const price = parseFloat(priceStr);

  return {
    description: description.trim(),
    price,
    quantity,
  };
}

function mapPaymentMethod(method: string): string {
  const lower = method.toLowerCase().replace(/['"]/g, ""); // Remove quotes

  const paymentMap = PARSER_GRAMMAR.payment.map;
  return paymentMap[lower as keyof typeof paymentMap] || paymentMap.cash;
}

// Enhanced grammar:
// new [BusinessName:]<items> [@ vendor] [--flags]
//
// Examples:
// new coffee $6, pastry $4 @ Starbucks
// new MyBrick: supplies $50 @ HomeDepot --payment cash
// new coffee $6 @ Starbucks --business Personal --memo "meeting"
export function parseManualNewCommand(input: string): {
  date: string;
  payee: string;
  currency: string;
  receipt: ReceiptShape;
  memo?: string;
  paymentAccount: string;
  business?: string;
} {
  // 1) Check for prefix business syntax (BusinessName:)
  const { business: prefixBusiness, cleanInput } =
    extractBusinessFromInput(input);

  // 2) Tokenize the cleaned input
  const tokens = tokenize(cleanInput);

  // 3) Extract flags (--business, --payment, --memo, --date)
  const {
    business: flagBusiness,
    payment,
    memo,
    date: flagDate,
    tokens: remainingTokens,
  } = extractFlags(tokens);

  // 4) Use prefix business if found, otherwise flag business
  const business = prefixBusiness || flagBusiness;

  // 5) Use flag date if provided, otherwise default to today
  // const date = flagDate || formatLocalDate(new Date());
  const finalDate = flagDate || formatLocalDate(new Date());

  // 6) Parse items and vendor from remaining tokens
  const { items: parsedItems, vendor } = parseItemsAndVendor(remainingTokens);

  if (parsedItems.length === 0) {
    throw new Error("No valid items found in input.");
  }

  // 7) Normalize to ReceiptItem[] for ReceiptShape
  const normalizedItems: ReceiptItem[] = parsedItems.map((item) => ({
    description: item.description,
    price: item.price,
  }));

  // 8) Set vendor/payee
  const payee = vendor || "Unknown Vendor";

  // 9) Map payment method
  const paymentAccount = payment
    ? mapPaymentMethod(payment)
    : PARSER_GRAMMAR.payment.map.cash;

  // 10) Build receipt totals
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price, 0);
  const receipt: ReceiptShape = {
    items: normalizedItems,
    subtotal,
    tax: null,
    total: subtotal,
  };

  // 11) Currency detection (symbol-based)
  let currency = "THB";
  if (/\$/.test(input)) currency = "USD";
  if (/฿/.test(input)) currency = "THB";

  return {
    date: finalDate,
    payee,
    currency,
    receipt,
    memo: memo || undefined,
    paymentAccount,
    business,
  };
}
