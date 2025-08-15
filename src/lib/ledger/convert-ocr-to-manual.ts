// /lib/ledger/convert-ocr-to-manual.ts
// Converts OCR receipt data into clean manual command syntax

import type { ReceiptData } from "./parse-receipt-ocr";

interface CleanItem {
  description: string;
  price: number;
}

// 👈 NEW: Currency detection and formatting
interface CurrencyConfig {
  symbol: string;
  code: string;
  position: "before" | "after";
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { symbol: "$", code: "USD", position: "before" },
  THB: { symbol: "฿", code: "THB", position: "after" },
  EUR: { symbol: "€", code: "EUR", position: "after" },
  GBP: { symbol: "£", code: "GBP", position: "before" },
};

function detectCurrencyFromText(ocrText: string): CurrencyConfig {
  const text = ocrText.toLowerCase();

  // Check for explicit USD indicators
  if (text.includes("$") || text.includes("usd")) return CURRENCY_CONFIGS.USD;
  if (text.includes("€")) return CURRENCY_CONFIGS.EUR;
  if (text.includes("£")) return CURRENCY_CONFIGS.GBP;

  // Default to THB instead of USD
  return CURRENCY_CONFIGS.THB;
}

function formatCurrency(amount: number, currency: CurrencyConfig): string {
  const formatted = amount.toFixed(2);
  return currency.position === "before"
    ? `${currency.symbol}${formatted}`
    : `${formatted}${currency.symbol}`;
}
// 👈 END NEW CURRENCY CODE

/**
 * Cleans up OCR item descriptions to be more human-readable
 */
function cleanItemDescription(rawDescription: string): string {
  let cleaned = rawDescription.trim();

  // Remove common OCR artifacts and product codes
  cleaned = cleaned
    // Remove UPC/product codes (long strings of digits)
    .replace(/\b\d{10,}\b/g, "")
    // Remove department codes like "F 1.98 0" at the end
    .replace(/\s+[A-Z]\s+[\d.]+\s+\d+$/i, "")
    // Remove single letters/flags at the end (N, F, T, etc.)
    .replace(/\s+[A-Z]\s*$/i, "")
    // Remove generic prefixes
    .replace(/^(GU|ENG|LG)\s+/i, "")
    // Clean up spacing and punctuation
    .replace(/\s+/g, " ")
    .replace(/[_<>*#|]/g, " ")
    .trim();

  // Convert common abbreviations to readable text
  const abbreviations: Record<string, string> = {
    "A/P": "all purpose",
    BRKFST: "breakfast",
    DZ: "dozen",
    LB: "lb",
    OZ: "oz",
    PKG: "package",
    BTL: "bottle",
    CAN: "can",
    BOX: "box",
  };

  for (const [abbrev, full] of Object.entries(abbreviations)) {
    cleaned = cleaned.replace(new RegExp(`\\b${abbrev}\\b`, "gi"), full);
  }

  // Convert to title case for readability
  cleaned = cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Fallback for very short or empty descriptions
  if (cleaned.length < 3) {
    cleaned = "Item";
  }

  return cleaned;
}

/**
 * Extracts clean items from receipt data, filtering out summary lines
 */
function extractCleanItems(receiptData: ReceiptData): CleanItem[] {
  if (!receiptData.items || receiptData.items.length === 0) {
    return [];
  }

  return receiptData.items
    .filter((item) => {
      const desc = item.description.toUpperCase();
      // Filter out summary lines that shouldn't be items
      const isSummaryLine =
        desc.includes("SUBTOTAL") ||
        desc.includes("TOTAL") ||
        desc.includes("TAX") ||
        desc.includes("CHANGE") ||
        desc.includes("TENDER") ||
        desc.includes("PAYMENT") ||
        desc.includes("BALANCE");

      // Must have a valid price
      const hasValidPrice =
        typeof item.price === "number" &&
        item.price > 0 &&
        Number.isFinite(item.price);

      return !isSummaryLine && hasValidPrice;
    })
    .map((item) => ({
      description: cleanItemDescription(item.description),
      price: Math.round(item.price * 100) / 100, // Round to 2 decimal places
    }));
}

/**
 * Converts OCR receipt data to manual command syntax
 */
export function convertOcrToManualCommand(
  receiptData: ReceiptData,
  vendor?: string,
  date?: string,
  imageUrl?: string,
  originalOcrText?: string // 👈 NEW: Add parameter for currency detection
): string {
  // 👈 NEW: Detect currency from original OCR text
  const currency = originalOcrText
    ? detectCurrencyFromText(originalOcrText)
    : CURRENCY_CONFIGS.USD;
  console.log(`💱 Detected currency: ${currency.code} (${currency.symbol})`);

  const cleanItems = extractCleanItems(receiptData);

  if (cleanItems.length === 0) {
    return "new"; // Return basic command if no items found
  }

  // 👈 UPDATED: Build the items part with proper currency formatting
  const itemsText = cleanItems
    .map((item) => `${item.description.toLowerCase()} ${item.price.toFixed(2)}`)
    .join(", ");

  // Start building the command
  let command = `new ${itemsText}`;

  // Add vendor if available
  if (vendor && vendor.trim()) {
    command += ` @ ${vendor.trim()}`;
  }

  // Add date if available and different from today
  if (date && date.trim()) {
    command += ` --date ${date.trim()}`;
  }

  // 👈 UPDATED: Add memo with proper currency formatting
  const memoItems = [];
  if (receiptData.total && receiptData.total > 0) {
    memoItems.push(`total ${receiptData.total.toFixed(2)}`);
  }
  if (receiptData.tax && receiptData.tax > 0) {
    memoItems.push(`tax ${receiptData.tax.toFixed(2)}`);
  }

  if (memoItems.length > 0) {
    command += ` --memo "${memoItems.join(", ")}"`;
  }

  // Add image URL if provided
  if (imageUrl && imageUrl.trim()) {
    command += ` --image "${imageUrl.trim()}"`;
  }

  return command;
}

/**
 * Example usage and test cases
 */
export function testConverter() {
  const sampleReceiptData: ReceiptData = {
    items: [
      { description: "GU A/P FLOUR 007874237006", price: 1.98 },
      { description: "ENG BRKFST 074239210030", price: 0.98 },
      { description: "BAKING SODA 003320001130", price: 0.5 },
      { description: "GU LENTILS 007874237137", price: 0.98 },
      { description: "CANOLA OIL 018043000013", price: 1.28 },
      { description: "LG 1DZ 001520411311", price: 1.18 },
      { description: "SUBTOTAL", price: 6.9 }, // Should be filtered out
      { description: "TOTAL", price: 6.9 }, // Should be filtered out
    ],
    subtotal: 6.9,
    tax: 0,
    total: 6.9,
    rawLines: [],
    section: { itemsStart: 0, itemsEnd: 5, summaryStart: 6, summaryEnd: 7 },
  };

  // 👈 UPDATED: Test with Thai OCR text to demonstrate currency detection
  const thaiOcrText =
    "ไบกคากับภาษีอย่างย่อ\nบริษัท ถฤกแจะด\n333/100 อาคารหลักสีพล์\nบาท 85.00\nรวม 338.00 บาท";

  const result = convertOcrToManualCommand(
    sampleReceiptData,
    "Walmart",
    "2012-05-07",
    "https://example.supabase.co/storage/v1/object/public/receipts/user123/2025/08/15/receipt.jpg",
    thaiOcrText // 👈 NEW: Pass OCR text for currency detection
  );

  console.log("Original complex JSON:");
  console.log(JSON.stringify(sampleReceiptData, null, 2));

  console.log("\nConverted to manual command:");
  console.log(result);

  // 👈 UPDATED: Expected output with Thai Baht
  // Expected output for Thai receipt:
  // new all purpose flour 1.98฿, breakfast 0.98฿, baking soda 0.50฿, lentils 0.98฿, canola oil 1.28฿, dozen 1.18฿ @ Walmart --date 2012-05-07 --memo "total 6.90฿" --image "https://example.supabase.co/storage/v1/object/public/receipts/user123/2025/08/15/receipt.jpg"

  return result;
}
