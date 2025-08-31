// /lib/ledger/parse-manual-command.ts

import { ReceiptShape, ReceiptItem } from "./build-postings-from-receipt";
import {
  getDefaultPaymentMethod,
  getPaymentMethodByAlias,
} from "./account-mappings";

function normalizeMultiLineCommand(input: string): string {
  let normalized = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");

  // Enhanced regex: insert comma between amount and any letter (supports $, ฿, and plain numbers)
  // This handles cases like: "coffee 100 croissant 110" -> "coffee 100, croissant 110"
  normalized = normalized.replace(
    /(\d+(?:\.\d{1,2})?)\s+([A-Za-z])/g,
    "$1, $2"
  );

  // Also handle currency symbols: $100 coffee -> $100, coffee
  normalized = normalized.replace(
    /([\$฿]\d+(?:\.\d{1,2})?)\s+([A-Za-z])/g,
    "$1, $2"
  );

  return normalized;
}

// function splitMultipleItems(token: string): string[] {
//   // Pattern to match item + price combinations
//   const itemPattern = /([^$฿]+)([\$฿]\d+(?:\.\d{2})?)/g;
//   const matches = [...token.matchAll(itemPattern)];

//   if (matches.length > 1) {
//     // Multiple items found, split them
//     return matches.map(match => `${match[1].trim()} ${match[2]}`);
//   }

//   return [token]; // Single item or no matches
// }

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeBusiness(businessName?: string): string | undefined {
  if (!businessName) return undefined;

  // Map common variations to exact database names
  const businessMap: Record<string, string> = {
    personal: "Personal",
    channel60: "Channel60",
    myonlinebusiness: "MyOnlineBusiness",
    myonline: "MyOnlineBusiness", // Allow shorthand
  };

  const normalized = businessMap[businessName.toLowerCase()];
  return normalized || businessName; // Return normalized or original if not found
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
      "Use -i flag for clear item/price pairs: -i <item1> <price1> <item2> <price2>...",
    examples: [
      "-i coffee 100 pastry 150",
      "-i coffee $5 pastry ฿150",
      "-i 'coffee mug' 200",
    ],
  },
  vendor: {
    description: "Vendor/merchant using --vendor flag.",
    examples: [
      "--vendor Starbucks",
      "--vendor HomeDepot",
      '--vendor "Coffee Shop"',
    ],
  },
  business: {
    description: "Business context using --business flag.",
    examples: [
      "--business MyOnlineBusiness",
      "--business Personal",
      "--business MyBrick",
    ],
  },
  payment: {
    description:
      "Payment method using --payment flag. Loaded from account-mappings.json",
    examples: [
      "--payment kasikorn",
      '--payment "credit card"',
      "--payment cash",
    ],
  },
  memo: {
    description: "Optional memo/note using --memo flag.",
    examples: [
      '--memo "team lunch"',
      "--memo meeting",
      "--memo office supplies",
    ],
  },
  image: {
    description: "Optional image URL using --image flag.",
    examples: ["--image https://example.com/receipt.jpg"],
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

  // Use a more robust approach to handle quoted strings
  let i = 0;
  let currentToken = "";
  let inQuotes = false;

  while (i < input.length) {
    const char = input[i];

    if (char === '"') {
      if (inQuotes) {
        // End of quoted string
        inQuotes = false;
        currentToken += char;
        if (currentToken.trim()) {
          // Clean up the quoted string (remove outer quotes)
          const cleanToken = currentToken.replace(/^"(.*)"$/, "$1");
          tokens.push(cleanToken);
        }
        currentToken = "";
      } else {
        // Start of quoted string
        inQuotes = true;
        currentToken = char;
      }
    } else if (char === " " || char === "\t") {
      if (!inQuotes) {
        // End of regular token
        if (currentToken.trim()) {
          tokens.push(currentToken.trim());
        }
        currentToken = "";
      } else {
        // Space inside quotes - preserve it
        currentToken += char;
      }
    } else {
      // Regular character
      currentToken += char;
    }

    i++;
  }

  // Don't forget the last token
  if (currentToken.trim()) {
    if (inQuotes) {
      // Clean up quoted string
      const cleanToken = currentToken.replace(/^"(.*)"$/, "$1");
      tokens.push(cleanToken);
    } else {
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
  // No more prefix syntax - all business context comes from --business flag
  return { cleanInput: input };
}

// Updated extractFlags function in /lib/ledger/parse-manual-command.ts

function extractFlags(tokens: string[]): {
  business?: string;
  vendor?: string;
  payment?: string;
  memo?: string;
  date?: string;
  imageUrl?: string;
  items?: string[];
  tokens: string[];
} {
  const updatedTokens: string[] = [];
  let business: string | undefined;
  let vendor: string | undefined;
  let payment: string | undefined;
  let memo: string | undefined;
  let date: string | undefined;
  let imageUrl: string | undefined;
  let items: string[] | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check if this is a flag
    if (
      token.startsWith("--") ||
      (token.startsWith("-") && token.length === 2)
    ) {
      const flagName = token.startsWith("--") ? token.slice(2) : token.slice(1);

      // Find the end of this flag's value (next flag or end of tokens)
      // eslint-disable-next-line prefer-const
      let flagValue: string[] = [];
      let j = i + 1;

      while (j < tokens.length && !tokens[j].startsWith("-")) {
        flagValue.push(tokens[j]);
        j++;
      }

      // Process the flag based on its name
      if (flagName === "business" || flagName === "b") {
        business = flagValue.join(" ");
      } else if (flagName === "vendor" || flagName === "v") {
        vendor = flagValue.join(" ");
      } else if (flagName === "payment" || flagName === "p") {
        payment = flagValue.join(" ");
      } else if (flagName === "memo" || flagName === "m") {
        // For memo, we still support quotes but they're optional
        const memoValue = flagValue.join(" ");
        memo = memoValue.replace(/^"(.*)"$/, "$1");
      } else if (flagName === "date" || flagName === "d") {
        const dateValue = flagValue.join(" ");
        const parsedDate = parseDateToken(dateValue);
        if (parsedDate) {
          date = parsedDate;
        }
      } else if (flagName === "image" || flagName === "I") {
        const imageValue = flagValue.join(" ");
        imageUrl = imageValue.replace(/^"(.*)"$/, "$1");
      } else if (flagName === "items" || flagName === "i") {
        // Items flag: collect all values as item/price pairs
        items = flagValue;
      }

      // Skip all the value tokens we just processed
      i = j - 1;
      continue;
    }

    // Keep non-flag tokens
    updatedTokens.push(token);
  }

  return {
    business,
    vendor,
    payment,
    memo,
    date,
    imageUrl,
    items,
    tokens: updatedTokens,
  };
}

function parseItemsFromFlag(items: string[]): ParsedItem[] {
  const parsedItems: ParsedItem[] = [];

  // Debug: Log what we're processing
  console.log("parseItemsFromFlag input:", items);

  // Process items in pairs: [item1, price1, item2, price2, ...]
  for (let i = 0; i < items.length; i += 2) {
    if (i + 1 < items.length) {
      const description = items[i];
      const priceStr = items[i + 1];

      console.log(
        `Processing pair ${i}: description="${description}", priceStr="${priceStr}"`
      );

      // Remove currency symbols for price parsing
      const cleanPriceStr = priceStr.replace(/[\$฿]/g, "");
      const price = parseFloat(cleanPriceStr);

      console.log(`Clean price: "${cleanPriceStr}", parsed price: ${price}`);

      if (!isNaN(price)) {
        parsedItems.push({
          description: description.trim(),
          price,
          quantity: 1,
        });
        console.log(`Added item: ${description.trim()} at ${price}`);
      } else {
        console.log(`Invalid price: ${priceStr}`);
      }
    } else {
      console.log(`Odd number of items, skipping last item: ${items[i]}`);
    }
  }

  console.log("Final parsed items:", parsedItems);

  return parsedItems;
}

function parseItemsAndVendor(tokens: string[]): {
  items: ParsedItem[];
} {
  const items: ParsedItem[] = [];

  // Process each token to find items (vendor is now handled by flags)
  for (const token of tokens) {
    const parsedItem = parseItemToken(token);
    if (parsedItem) items.push(parsedItem);
  }

  return { items };
}

function parseItemToken(token: string): ParsedItem | null {
  // Enhanced item regex: [quantity x] description amount (with or without currency symbol)
  // This handles: "coffee 100", "coffee $100", "coffee ฿100", "2x coffee 100"
  const itemRegex = /^(?:(\d+)x\s*)?(.+?)\s+([\$฿]?\d+(?:\.\d{1,2})?)$/i;
  const match = token.match(itemRegex);

  if (!match) return null;

  const [, qtyStr, description, priceStr] = match;
  const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;

  // Remove currency symbols for price parsing
  const cleanPriceStr = priceStr.replace(/[\$฿]/g, "");
  const price = parseFloat(cleanPriceStr);

  if (isNaN(price)) return null;

  return {
    description: description.trim(),
    price,
    quantity,
  };
}

function mapPaymentMethod(method: string): string {
  const lower = method.toLowerCase().replace(/['"]/g, ""); // Remove quotes

  const accountPath = getPaymentMethodByAlias(lower);
  return accountPath || getDefaultPaymentMethod();
}

// Enhanced grammar:
// new -i <item1> <price1> <item2> <price2>... [--flags]
//
// Examples:
// new -i coffee $6 pastry $4 --vendor Starbucks
// new -i supplies $50 --vendor HomeDepot --payment kasikorn --business MyBrick
// new -i coffee $6 --vendor Starbucks --business Personal --memo "meeting"
// Updated parseManualNewCommand function in /lib/ledger/parse-manual-command.ts

export function parseManualNewCommand(input: string): {
  date: string;
  payee: string;
  currency: string;
  receipt: ReceiptShape;
  memo?: string;
  paymentAccount: string;
  business?: string;
  vendor?: string;
  imageUrl?: string;
} {
  const normalizedInput = normalizeMultiLineCommand(input);

  // 1) Tokenize the input
  const tokens = tokenize(normalizedInput);
  console.log("Tokenized input:", tokens);

  // 2) Extract flags (--business, --vendor, --payment, --memo, --date, --image, --items)
  const {
    business,
    vendor,
    payment,
    memo,
    date: flagDate,
    imageUrl,
    items: itemsFlag,
    tokens: remainingTokens,
  } = extractFlags(tokens);

  console.log("Extracted flags:", {
    business,
    vendor,
    payment,
    memo,
    date: flagDate,
    imageUrl,
    itemsFlag,
    remainingTokens,
  });

  // 3) Use flag date if provided, otherwise default to today
  const finalDate = flagDate || formatLocalDate(new Date());

  // 4) Parse items - prioritize items flag over legacy token parsing
  let parsedItems: ParsedItem[] = [];
  if (itemsFlag && itemsFlag.length > 0) {
    // Use the new structured items flag
    parsedItems = parseItemsFromFlag(itemsFlag);
  } else {
    // Fallback to legacy token parsing
    const { items: legacyItems } = parseItemsAndVendor(remainingTokens);
    parsedItems = legacyItems;
  }

  if (parsedItems.length === 0) {
    throw new Error("No valid items found in input.");
  }

  // 7) Normalize to ReceiptItem[] for ReceiptShape
  const normalizedItems: ReceiptItem[] = parsedItems.map((item) => ({
    description: item.description,
    price: item.price,
  }));

  // 5) Set vendor/payee (now from flags)
  const payee = vendor || "Unknown Vendor";

  // 9) Map payment method
  const paymentAccount = payment
    ? mapPaymentMethod(payment)
    : getDefaultPaymentMethod();

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
  if (/\$/.test(normalizedInput)) currency = "USD";
  if (/฿/.test(normalizedInput)) currency = "THB";

  return {
    date: finalDate,
    payee,
    currency,
    receipt,
    memo: memo || undefined,
    paymentAccount,
    business: normalizeBusiness(business),
    imageUrl: imageUrl || undefined, // 👈 ADD THIS TO RETURN
  };
}
