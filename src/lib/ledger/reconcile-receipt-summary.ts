// ================================================
// FILE: src/lib/ledger/reconcile-receipt-summary.ts
// PURPOSE: Robust, typed reconciliation of subtotal/tax/total from OCR
// ================================================
import type { ReceiptData } from "@/lib/ledger/parse-receipt-ocr";

const round2 = (n: number) => Math.round(n * 100) / 100;
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

function sumItems(items: { price: number }[]) {
  return round2(items.reduce((s, i) => s + (isNum(i.price) ? i.price : 0), 0));
}

/**
 * Reconcile inconsistent OCR summaries. Prefers plausible relationships:
 * - If TOTAL and TAX exist → SUBTOTAL := TOTAL - TAX
 * - If TOTAL ≈ sum(items) → SUBTOTAL := sum(items); TAX := TOTAL - SUBTOTAL
 * - Fix common digit-join (e.g., 6.90 → 65.90) by comparing to items sum
 */
export function reconcileReceiptSummary(parsed: ReceiptData): ReceiptData {
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

  // 5) Plausibility repair: joined digits → subtotal far larger than items sum
  if (flags().hasSub && itemsSum > 0 && (subtotal as number) / itemsSum > 4) {
    // If total is small and near items sum, clamp subtotal
    if (flags().hasTot && Math.abs((total as number) - itemsSum) <= 0.05) {
      subtotal = itemsSum;
      tax = round2((total as number) - subtotal);
      if ((tax as number) < 0) tax = 0;
    } else if (Math.abs((subtotal as number) - itemsSum) > 0.5) {
      subtotal = itemsSum;
    }
  }

  // 6) Clamp tiny negatives and round
  if (isNum(tax) && tax < 0 && tax > -0.05) tax = 0;
  if (isNum(subtotal) && subtotal < 0) subtotal = 0;
  if (isNum(total) && total < 0) total = 0;

  out.subtotal = isNum(subtotal) ? round2(subtotal) : null;
  out.tax = isNum(tax) ? round2(tax) : null;
  out.total = isNum(total) ? round2(total) : null;
  return out;
}
