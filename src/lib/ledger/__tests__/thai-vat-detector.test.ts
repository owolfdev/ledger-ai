// ================================================
// FILE: src/lib/ledger/__tests__/thai-vat-detector.test.ts
// PURPOSE: Test Thai VAT detection logic
// ================================================

import {
  detectThaiVATInclusion,
  reconcileThaiReceiptSummary,
} from "../thai-vat-detector";
import type { ReceiptData } from "../parse-receipt-ocr";

describe("Thai VAT Detection", () => {
  test("detects VAT included in total for SEE FAH receipt", () => {
    const receiptText = `
      SEE FAH
      Jasmine Cuisine
      Thonglor Branch
      
      ก๋วยเตี๋ยวราดหน้า วีแกน    145.00
      (ห่อ)อีหมี               175.00
      ชาอู่หลง                  70.00
      
      ITEMS :3                 390.00
      Service charge 10%        21.00
      Total.                  411.00
      
      Before VAT              384.11
      VAT 7%                  26.89
      Amount Net              411.00
    `;

    const result = detectThaiVATInclusion(receiptText, 411.0, 26.89);

    expect(result.isVATIncluded).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.reasoning).toContain("total pattern");
  });

  test("reconciles Thai receipt correctly", () => {
    const receiptData: ReceiptData = {
      items: [
        { description: "ก๋วยเตี๋ยวราดหน้า วีแกน", price: 145.0 },
        { description: "(ห่อ)อีหมี", price: 175.0 },
        { description: "ชาอู่หลง", price: 70.0 },
      ],
      subtotal: null,
      tax: 26.89,
      total: 411.0,
      rawLines: [
        "Total.                  411.00",
        "Before VAT              384.11",
        "VAT 7%                  26.89",
        "Amount Net              411.00",
      ],
    };

    const result = reconcileThaiReceiptSummary(receiptData);

    // Should recognize that total includes VAT
    expect(result.total).toBe(411.0);
    expect(result.subtotal).toBe(384.11); // 411.00 - 26.89
    expect(result.tax).toBe(26.89);
  });

  test("handles Western receipt pattern", () => {
    const receiptData: ReceiptData = {
      items: [
        { description: "Coffee", price: 5.0 },
        { description: "Sandwich", price: 10.0 },
      ],
      subtotal: 15.0,
      tax: 1.2,
      total: null,
      rawLines: [
        "Subtotal                15.00",
        "Tax 8%                   1.20",
        "Total                   16.20",
      ],
    };

    const result = reconcileThaiReceiptSummary(receiptData);

    // Should use standard reconciliation
    expect(result.subtotal).toBe(15.0);
    expect(result.tax).toBe(1.2);
    expect(result.total).toBe(16.2);
  });
});
