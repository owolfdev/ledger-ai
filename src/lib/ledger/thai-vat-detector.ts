// ================================================
// FILE: src/lib/ledger/thai-vat-detector.ts
// PURPOSE: Smart VAT detection for Thai receipts
// ================================================

import type { ReceiptData } from "@/lib/ledger/parse-receipt-ocr";

const round2 = (n: number) => Math.round(n * 100) / 100;
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * Thai receipt patterns that indicate VAT is already included in total
 */
const THAI_VAT_INCLUDED_PATTERNS = [
  // English patterns
  /Total.*?(\d+\.?\d*)/i,
  /Amount.*?Net.*?(\d+\.?\d*)/i,
  /Final.*?Total.*?(\d+\.?\d*)/i,
  /Grand.*?Total.*?(\d+\.?\d*)/i,

  // Thai patterns
  /รวม.*?(\d+\.?\d*)/i, // "รวม" (total)
  /ยอดรวม.*?(\d+\.?\d*)/i, // "ยอดรวม" (total amount)
  /รวมทั้งสิ้น.*?(\d+\.?\d*)/i, // "รวมทั้งสิ้น" (total all)
  /จำนวนเงิน.*?(\d+\.?\d*)/i, // "จำนวนเงิน" (amount of money)
  /ชำระ.*?(\d+\.?\d*)/i, // "ชำระ" (pay)

  // Service charge patterns (often included in total)
  /Service.*?charge.*?(\d+\.?\d*)/i,
  /Service.*?fee.*?(\d+\.?\d*)/i,
  /ค่าบริการ.*?(\d+\.?\d*)/i, // "ค่าบริการ" (service charge)
];

/**
 * Patterns that indicate VAT breakdown (for accounting, not customer payment)
 */
const THAI_VAT_BREAKDOWN_PATTERNS = [
  /Before.*?VAT.*?(\d+\.?\d*)/i,
  /VAT.*?7%.*?(\d+\.?\d*)/i,
  /ภาษี.*?มูลค่าเพิ่ม.*?(\d+\.?\d*)/i, // "ภาษีมูลค่าเพิ่ม" (VAT)
  /VAT.*?(\d+\.?\d*)/i,
  /ภาษี.*?(\d+\.?\d*)/i, // "ภาษี" (tax)
];

/**
 * Detect if a receipt follows Thai VAT-included pattern
 */
export function detectThaiVATInclusion(
  receiptText: string,
  totalAmount: number,
  vatAmount: number | null
): {
  isVATIncluded: boolean;
  confidence: "high" | "medium" | "low";
  reasoning: string;
} {
  const text = receiptText.toLowerCase();

  // High confidence: Clear "Total" or "Amount Net" patterns
  const totalMatches = THAI_VAT_INCLUDED_PATTERNS.filter((pattern) => {
    const match = text.match(pattern);
    return match && Math.abs(parseFloat(match[1]) - totalAmount) < 0.01;
  });

  if (totalMatches.length > 0) {
    return {
      isVATIncluded: true,
      confidence: "high",
      reasoning: `Found clear total pattern: ${totalMatches[0].source}`,
    };
  }

  // Medium confidence: VAT breakdown present but total is reasonable
  const vatBreakdownMatches = THAI_VAT_BREAKDOWN_PATTERNS.filter((pattern) =>
    pattern.test(text)
  );

  if (vatBreakdownMatches.length > 0 && isNum(vatAmount)) {
    const expectedTotal = totalAmount + vatAmount;
    const vatRate = vatAmount / (totalAmount - vatAmount);

    // If VAT rate is around 7% (Thai standard) and total seems reasonable
    if (vatRate > 0.06 && vatRate < 0.08) {
      return {
        isVATIncluded: true,
        confidence: "medium",
        reasoning: `VAT breakdown present with ~7% rate, total likely includes VAT`,
      };
    }
  }

  // Low confidence: Service charge patterns (often included in total)
  const serviceChargeMatches = text.match(/service.*?charge.*?(\d+\.?\d*)/i);
  if (serviceChargeMatches) {
    return {
      isVATIncluded: true,
      confidence: "low",
      reasoning: `Service charge detected, total likely includes all charges`,
    };
  }

  return {
    isVATIncluded: false,
    confidence: "low",
    reasoning: "No clear Thai VAT patterns detected",
  };
}

/**
 * Smart reconciliation for Thai receipts
 * Handles the case where total already includes VAT
 */
export function reconcileThaiReceiptSummary(parsed: ReceiptData): ReceiptData {
  const out: ReceiptData = { ...parsed };
  const itemsSum = sumItems(out.items || []);

  let subtotal = isNum(out.subtotal) ? round2(out.subtotal) : undefined;
  let tax = isNum(out.tax) ? round2(out.tax) : undefined;
  let total = isNum(out.total) ? round2(out.total) : undefined;

  // Detect if this is a Thai VAT-included receipt
  const vatDetection = detectThaiVATInclusion(
    out.rawLines?.join("\n") || "",
    total || 0,
    tax || null
  );

  if (vatDetection.isVATIncluded && isNum(total)) {
    // Thai pattern: Total already includes VAT
    // Calculate subtotal by removing VAT from total
    if (isNum(tax)) {
      // If we have both total and tax, subtotal = total - tax
      subtotal = Math.max(0, round2(total - tax));
    } else {
      // If we only have total, estimate subtotal (assume ~7% VAT)
      const estimatedSubtotal = round2(total / 1.07);
      subtotal = estimatedSubtotal;
      tax = round2(total - estimatedSubtotal);
    }

    // Ensure items sum aligns with our calculated subtotal
    if (itemsSum > 0 && Math.abs(subtotal - itemsSum) > 0.5) {
      // If items sum is close to total, use items sum as subtotal
      if (Math.abs(total - itemsSum) <= 0.05) {
        subtotal = itemsSum;
        tax = round2(total - subtotal);
      }
    }
  } else {
    // Western pattern: Apply standard reconciliation
    return reconcileStandardReceiptSummary(out);
  }

  // Clamp negatives and round
  if (isNum(tax) && tax < 0) tax = 0;
  if (isNum(subtotal) && subtotal < 0) subtotal = 0;
  if (isNum(total) && total < 0) total = 0;

  out.subtotal = isNum(subtotal) ? round2(subtotal) : null;
  out.tax = isNum(tax) ? round2(tax) : null;
  out.total = isNum(total) ? round2(total) : null;

  return out;
}

/**
 * Standard reconciliation (original logic)
 */
function reconcileStandardReceiptSummary(parsed: ReceiptData): ReceiptData {
  const out: ReceiptData = { ...parsed };
  const itemsSum = sumItems(out.items || []);

  let subtotal = isNum(out.subtotal) ? round2(out.subtotal) : undefined;
  let tax = isNum(out.tax) ? round2(out.tax) : undefined;
  let total = isNum(out.total) ? round2(out.total) : undefined;

  const flags = () => ({
    hasSub: isNum(subtotal),
    hasTax: isNum(tax),
    hasTot: isNum(total),
  });

  // 1) Prefer TOTAL & TAX pair when present
  if (flags().hasTot && flags().hasTax) {
    const subFromTot = round2((total as number) - (tax as number));
    if (!flags().hasSub || Math.abs((subtotal as number) - subFromTot) > 0.5) {
      subtotal = Math.max(0, subFromTot);
    }
  }

  // 2) If TOTAL aligns with items sum, prefer items sum as SUBTOTAL
  if (flags().hasTot && Math.abs((total as number) - itemsSum) <= 0.05) {
    subtotal = itemsSum;
    tax = round2((total as number) - subtotal);
    if (tax < 0) tax = 0;
  }

  // 3) If only TOTAL is present, infer from items sum
  if (flags().hasTot && !flags().hasSub && !flags().hasTax) {
    const inferredTax = round2((total as number) - itemsSum);
    subtotal = itemsSum;
    tax = inferredTax < 0 ? 0 : inferredTax;
  }

  // 4) If SUBTOTAL & TAX exist but TOTAL missing, compute TOTAL
  if (!flags().hasTot && flags().hasSub && flags().hasTax) {
    total = round2((subtotal as number) + (tax as number));
  }

  out.subtotal = isNum(subtotal) ? round2(subtotal) : null;
  out.tax = isNum(tax) ? round2(tax) : null;
  out.total = isNum(total) ? round2(total) : null;

  return out;
}

function sumItems(items: { price: number }[]) {
  return round2(items.reduce((s, i) => s + (isNum(i.price) ? i.price : 0), 0));
}
