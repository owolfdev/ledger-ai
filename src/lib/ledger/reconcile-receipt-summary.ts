// ================================================
// FILE: src/lib/ledger/reconcile-receipt-summary.ts
// PURPOSE: Robust, typed reconciliation of subtotal/tax/total from OCR
// ================================================
import type { ReceiptData } from "@/lib/ledger/parse-receipt-ocr";
import { reconcileThaiReceiptSummary } from "./thai-vat-detector";

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
 * - Smart Thai VAT detection: handles receipts where total already includes VAT
 */
export function reconcileReceiptSummary(parsed: ReceiptData): ReceiptData {
  // Use Thai VAT detection for better accuracy in Thailand
  return reconcileThaiReceiptSummary(parsed);
}
