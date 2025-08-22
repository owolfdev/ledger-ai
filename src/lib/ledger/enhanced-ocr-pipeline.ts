// FILE: src/lib/ledger/enhanced-ocr-pipeline.ts
// New utility file for enhanced OCR processing with confidence scoring

import type { ReceiptData } from "./parse-receipt-ocr";
import type { ReceiptMathValidation } from "./validate-receipt-ocr";

export interface ParseResult {
  data: ReceiptData;
  confidence: number;
  parser: "receipt" | "invoice";
  mathValid: boolean;
  qualityScore: number;
  errors: string[];
}

export interface OCRQuality {
  confidence: number;
  textLength: number;
  hasStructure: boolean;
  moneyTokenCount: number;
  lineCount: number;
  issues: string[];
}

/**
 * Assess OCR text quality to catch obviously bad results early
 */
export function assessOcrQuality(text: string): OCRQuality {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const moneyMatches = text.match(/\$?\d+\.?\d*/g) || [];
  const issues: string[] = [];

  // Look for receipt-like structure
  const hasReceiptKeywords = /\b(TOTAL|TAX|SUBTOTAL|RECEIPT|INVOICE)\b/i.test(
    text
  );
  const hasDatePattern = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text);
  const hasBusinessInfo = /\b(LLC|INC|LTD|CORP|CO\.?)\b/i.test(text);

  const structure = hasReceiptKeywords || hasDatePattern || hasBusinessInfo;

  // Identify quality issues
  if (text.length < 50) issues.push("Text too short");
  if (lines.length < 3) issues.push("Too few lines");
  if (moneyMatches.length === 0) issues.push("No money amounts found");
  if (!structure) issues.push("No receipt structure detected");

  // Basic quality scoring
  let confidence = 0.1; // baseline
  if (text.length > 50) confidence += 0.2;
  if (text.length > 200) confidence += 0.1;
  if (lines.length > 5) confidence += 0.2;
  if (lines.length > 10) confidence += 0.1;
  if (moneyMatches.length > 0) confidence += 0.2;
  if (moneyMatches.length > 3) confidence += 0.1;
  if (structure) confidence += 0.3;

  return {
    confidence: Math.min(confidence, 1.0),
    textLength: text.length,
    hasStructure: structure,
    moneyTokenCount: moneyMatches.length,
    lineCount: lines.length,
    issues,
  };
}

/**
 * Score parser results based on multiple factors
 */
export function scoreParseResult(
  data: ReceiptData,
  mathValidation: ReceiptMathValidation
): number {
  let score = 0;

  // Item quality (40% of score)
  // More items = better, but with diminishing returns
  const itemScore = Math.min(data.items.length / 5, 1) * 0.4;
  score += itemScore;

  // Math consistency (30% of score)
  const mathScore = mathValidation.isValid ? 0.3 : 0;
  score += mathScore;

  // Completeness (20% of score)
  let completenessScore = 0;
  if (data.subtotal !== null) completenessScore += 0.07;
  if (data.tax !== null) completenessScore += 0.07;
  if (data.total !== null) completenessScore += 0.06;
  score += completenessScore;

  // Item description quality (10% of score)
  if (data.items.length > 0) {
    const avgDescLength =
      data.items.reduce((sum, item) => sum + item.description.length, 0) /
      data.items.length;

    // Penalize very short or very long descriptions
    const idealLength = 15;
    const lengthScore = Math.max(
      0,
      1 - Math.abs(avgDescLength - idealLength) / idealLength
    );
    const descScore = lengthScore * 0.1;
    score += descScore;
  }

  return Math.min(score, 1.0);
}

/**
 * Enhanced parsing with confidence scoring and smart fallbacks
 */
export async function parseReceiptWithConfidence(
  rawText: string,
  segmentedBlock?: string
): Promise<ParseResult | null> {
  // 1. Assess OCR quality first
  const quality = assessOcrQuality(rawText);

  if (quality.confidence < 0.3) {
    console.warn("OCR quality low:", quality.issues);
  }

  // 2. Try all parsers and score results
  const parseAttempts: Array<{
    parser: "receipt" | "invoice";
    text: string;
    label: string;
  }> = [];

  // Try segmented text first if available
  if (segmentedBlock) {
    parseAttempts.push(
      { parser: "receipt", text: segmentedBlock, label: "receipt-segmented" },
      { parser: "invoice", text: segmentedBlock, label: "invoice-segmented" }
    );
  }

  // Then try raw text
  parseAttempts.push(
    { parser: "receipt", text: rawText, label: "receipt-raw" },
    { parser: "invoice", text: rawText, label: "invoice-raw" }
  );

  const results: ParseResult[] = [];

  for (const attempt of parseAttempts) {
    try {
      let data: ReceiptData;

      if (attempt.parser === "receipt") {
        const { parseReceiptOcr } = await import("./parse-receipt-ocr");
        data = parseReceiptOcr(attempt.text);
      } else {
        const { parseReceiptOcrInvoice } = await import(
          "./parse-receipt-ocr-invoice"
        );
        data = parseReceiptOcrInvoice(attempt.text) as unknown as ReceiptData;
      }

      // Skip if no items found
      if (!data.items?.length) {
        // console.log(`${attempt.label}: No items found`);
        continue;
      }

      // Validate math
      const { validateReceiptOcrMath } = await import("./validate-receipt-ocr");
      const mathValidation = validateReceiptOcrMath(data);

      // Score this result
      const confidence = scoreParseResult(data, mathValidation);

      results.push({
        data,
        confidence,
        parser: attempt.parser,
        mathValid: mathValidation.isValid,
        qualityScore: quality.confidence,
        errors: mathValidation.errors,
      });

      // console.log(
      //   `${attempt.label}: confidence=${confidence.toFixed(2)}, mathValid=${
      //     mathValidation.isValid
      //   }, items=${data.items.length}`
      // );
    } catch (error) {
      console.warn(
        `Parser ${attempt.parser} failed on ${attempt.label}:`,
        error
      );
    }
  }

  // 3. Select best result
  if (results.length === 0) {
    console.error("All parsers failed to extract items");
    return null;
  }

  // Sort by: math validity first, then confidence
  results.sort((a, b) => {
    if (a.mathValid !== b.mathValid) return a.mathValid ? -1 : 1;
    return b.confidence - a.confidence;
  });

  const best = results[0];

  // 4. Log selection reasoning
  // console.log(
  //   `Selected: ${best.parser} parser, confidence=${best.confidence.toFixed(
  //     2
  //   )}, mathValid=${best.mathValid}`
  // );

  return best;
}

/**
 * Enhanced summary coalescing with better validation
 */
export function enhancedCoalesceSummary(data: ReceiptData): ReceiptData {
  const out: ReceiptData = { ...data };

  function round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  function sumItems(items: { price: number }[]) {
    return round2(
      items.reduce((s, i) => s + (Number.isFinite(i.price) ? i.price : 0), 0)
    );
  }

  const itemsSum = sumItems(out.items);
  const hasSub =
    typeof out.subtotal === "number" && Number.isFinite(out.subtotal);
  const hasTax = typeof out.tax === "number" && Number.isFinite(out.tax);
  const hasTot = typeof out.total === "number" && Number.isFinite(out.total);

  // Enhanced tax inference with realistic bounds
  if (hasSub && hasTot && !hasTax) {
    const diff = round2((out.total as number) - (out.subtotal as number));
    const maxTax = 0.35 * (out.subtotal as number); // 35% max tax rate
    const minTax = 0.01; // minimum $0.01 tax

    if (diff >= -0.01 && diff <= maxTax + 0.01 && diff >= minTax - 0.01) {
      out.tax = diff < 0 ? 0 : diff;
      // console.log(`Inferred tax: ${out.tax} from total-subtotal difference`);
    }
  }

  // Subtotal inference with validation
  if (hasTot && hasTax && !hasSub) {
    const sub = round2((out.total as number) - (out.tax as number));
    if (sub >= 0 && sub >= itemsSum * 0.8) {
      // subtotal should be close to items sum
      out.subtotal = sub;
      // console.log(`Inferred subtotal: ${out.subtotal} from total-tax`);
    }
  }

  // Total inference with better validation
  if (!hasTot && hasSub && hasTax) {
    out.total = round2((out.subtotal as number) + (out.tax as number));
    // console.log(`Inferred total: ${out.total} from subtotal+tax`);
  }

  return out;
}
