// /lib/ledger/validate-receipt-ocr.ts (v2)
// Validate math using structured ReceiptData; fallback to scanning items only if fields missing.

import type { ReceiptData, ReceiptItem } from "./parse-receipt-ocr";

export type ReceiptMathValidation = {
  isValid: boolean;
  errors: string[];
  summary: {
    subtotal?: number | null;
    tax?: number | null;
    total?: number | null;
    itemsSum: number;
    expectedTotal?: number;
    difference?: number;
    threshold: number;
  };
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function coalesceSummaryFromItems(items: ReceiptItem[]) {
  const up = (s: string) => s.toUpperCase();
  const find = (kw: string) =>
    items.find((i) => up(i.description).includes(kw))?.price;
  return {
    subtotal: find("SUBTOTAL"),
    tax: find("TAX"),
    total: find("TOTAL"),
  } as const;
}

/**
 * Validates a parsed receipt for math consistency:
 * - Do item lines sum to the subtotal?
 * - Does subtotal + tax equal total?
 */
export function validateReceiptOcrMath(
  parsed: ReceiptData,
  threshold = 0.05
): ReceiptMathValidation {
  const cleaned = parsed.items.filter((i) => {
    const d = i.description.toUpperCase();
    return !(
      d.includes("SUBTOTAL") ||
      d.includes("TAX") ||
      d.includes("TOTAL") ||
      d.includes("DEBIT TEND") ||
      d.includes("CHANGE DUE")
    );
  });

  const itemsSum = round2(
    cleaned.reduce(
      (sum, i) => sum + (Number.isFinite(i.price) ? i.price : 0),
      0
    )
  );

  // Prefer structured fields; fallback to items-scan
  const fallback = coalesceSummaryFromItems(parsed.items);
  const subtotal = parsed.subtotal ?? fallback.subtotal;
  const tax = parsed.tax ?? fallback.tax ?? 0;
  const total = parsed.total ?? fallback.total;

  let isValid = true;
  const errors: string[] = [];
  let expectedTotal: number | undefined;
  let difference: number | undefined;

  if (subtotal != null && Math.abs(itemsSum - subtotal) > threshold) {
    isValid = false;
    errors.push(
      `Item sum ($${itemsSum.toFixed(2)}) ≠ subtotal ($${subtotal.toFixed(2)})`
    );
  }

  if (subtotal != null && total != null) {
    expectedTotal = round2((subtotal ?? 0) + (tax ?? 0));
    if (Math.abs(expectedTotal - total) > threshold) {
      isValid = false;
      difference = round2(expectedTotal - total);
      errors.push(
        `Subtotal + tax ($${expectedTotal.toFixed(
          2
        )}) ≠ total ($${total.toFixed(2)})`
      );
    }
  }

  return {
    isValid,
    errors,
    summary: {
      subtotal,
      tax,
      total,
      itemsSum,
      expectedTotal,
      difference,
      threshold,
    },
  };
}
