// FILE: /lib/ledger/parse-receipt-ocr-invoice.ts
// Invoice-friendly parser: avoid treating dates/headers as items.
// - FIX: guard priceNearEnd() against date tokens like "11.02.2030"
// - FIX: skip common header labels (DATE, DUE DATE, INVOICE NO, ISSUED TO, etc.)

export type InvoiceReceiptItem = { description: string; price: number };
export type InvoiceReceiptData = {
  items: InvoiceReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  rawLines: string[];
  section?: {
    itemsStart: number;
    itemsEnd: number;
    summaryStart: number;
    summaryEnd: number;
  };
};

// IMPORTANT: matchAll requires /g
const MONEY_RE = /[\$฿€£]?\s*(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2,3})?[\$฿€£]?/;
const MONEY_G = new RegExp(MONEY_RE.source, "g");

const TRAIL_TOKEN = /(?:\s+(?:USD|THB|EUR|[A-Za-z0-9%§]{1,4})){0,2}/;
const END_PUNCT = /[)\]>»】）]*$/;

// Headers that should never be considered items on invoices
const NOT_ITEM_HEADERS =
  /\b(ISSUED\s+TO|BILL\s+TO|SHIP\s+TO|PAY\s+TO|INVOICE\s*NO\.?|INVOICE\s+#|PO\.?|P\.O\.|RECEIPT\s*(NO|#)?|DATE|DUE\s+DATE|ACCOUNT|BANK|DESCRIPTION\s*UNIT\s*PRICE|DESCRIPTION\b|UNIT\s*PRICE|QTY|AMOUNT|TERMS|CONDITIONS)\b/i;
// Date tokens like 11.02.2030 or 26/02/2019
const DMY_DOT = /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/;
const DMY_SLASH = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/;

function priceNearEnd(line: string): boolean {
  if (NOT_ITEM_HEADERS.test(line)) return false; // header/meta rows
  if (DMY_DOT.test(line) || DMY_SLASH.test(line)) return false; // rows dominated by dates

  const matches = Array.from(line.matchAll(MONEY_G));
  if (!matches.length) return false;
  const last = matches[matches.length - 1];

  // If the money token is part of a date glue like "11.02.2030", ignore
  const idx = last.index ?? 0;
  const token = last[0];
  const after = line.slice(idx + token.length);
  if (/^\s*\.\d{2,4}\b/.test(after)) return false; // looks like dd.mm.YYYY continuation

  if (/^\s*$/.test(after)) return true;
  if (
    new RegExp(`^${TRAIL_TOKEN.source}\s*${END_PUNCT.source}\s*$`, "i").test(
      after
    )
  )
    return true;
  return after.trim().length <= 20 && !MONEY_RE.test(after);
}

function parseMoney2(s: string): number {
  return Math.round(parseFloat(s.replace(/[\$฿€£,]/g, "")) * 100) / 100;
}

function lastMoney(line: string): string | null {
  const matches = Array.from(line.matchAll(MONEY_G));
  if (!matches.length) return null;
  return matches[matches.length - 1][0];
}

function isSaleTotalInvoice(line: string): boolean {
  const longForms =
    /(GRAND\s+TOTAL|INVOICE\s+TOTAL|TOTAL\s+DUE|AMOUNT\s+DUE|BALANCE\s+DUE|PAY\s+THIS\s+AMOUNT)/i;
  if (longForms.test(line)) return true;
  return /\bTOTAL\b(?!\s*TAX|\s*PURCHASE)/i.test(line);
}

function clean(text: string): string {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/\s+[A-Z0-9§%]{1,4}$/, "")
    .trim();
}

export function parseReceiptOcrInvoice(raw: string): InvoiceReceiptData {
  const rawLines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u2014\u2013]/g, "-").trim())
    .filter(Boolean);

  const items: InvoiceReceiptItem[] = [];
  let subtotal: number | null = null;
  let tax: number | null = null;
  let total: number | null = null;

  let itemsStart = -1;
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i];
    if (priceNearEnd(l) && !/\b(SUBTOTAL|TOTAL|TAX|VAT|GST)\b/i.test(l)) {
      itemsStart = i;
      break;
    }
  }

  let itemsEnd = -1;
  let summaryStart = -1;
  let summaryEnd = -1;

  if (itemsStart !== -1) {
    for (let i = itemsStart; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (/\b(SUB\s*-?\s*TOTAL|SUBTOTAL)\b/i.test(line)) {
        itemsEnd = i - 1;
        summaryStart = i;
        break;
      }
      if (
        priceNearEnd(line) &&
        !/\b(SUBTOTAL|TOTAL|TAX|VAT|GST)\b/i.test(line)
      ) {
        const m = lastMoney(line);
        if (m)
          items.push({
            description: clean(line.replace(m, "")),
            price: parseMoney2(m),
          });
      }
    }
  }

  if (summaryStart !== -1) {
    for (let i = summaryStart; i < rawLines.length; i++) {
      const line = rawLines[i];
      const subM = line.match(
        new RegExp(
          `\\b(SUB\\s*-?\\s*TOTAL|SUBTOTAL)\\b\\s+(${MONEY_RE.source})`,
          "i"
        )
      );
      if (subM) subtotal = parseMoney2(subM[2]);

      if (/\b(TAX|VAT|GST|SALES\s+TAX)\b/i.test(line)) {
        const tokens = line.match(MONEY_G);
        if (tokens && tokens.length)
          tax = parseMoney2(tokens[tokens.length - 1]);
      }

      if (isSaleTotalInvoice(line)) {
        const m = lastMoney(line);
        if (m) {
          total = parseMoney2(m);
          summaryEnd = i;
          break;
        }
      }
    }
  }

  if (items.length === 0) {
    let started = false;
    let reachedSummary = false;
    for (const line of rawLines) {
      if (/\b(SUB\s*-?\s*TOTAL|SUBTOTAL)\b/i.test(line)) {
        reachedSummary = true;
        const m = line.match(
          new RegExp(
            `\\b(SUB\\s*-?\\s*TOTAL|SUBTOTAL)\\b\\s+(${MONEY_RE.source})`,
            "i"
          )
        );
        if (m) subtotal = parseMoney2(m[2]);
        continue;
      }
      if (!reachedSummary) {
        if (
          !started &&
          priceNearEnd(line) &&
          !/\b(SUBTOTAL|TOTAL|TAX|VAT|GST)\b/i.test(line)
        )
          started = true;
        if (
          started &&
          priceNearEnd(line) &&
          !/\b(SUBTOTAL|TOTAL|TAX|VAT|GST)\b/i.test(line)
        ) {
          const m = lastMoney(line);
          if (m)
            items.push({
              description: clean(line.replace(m, "")),
              price: parseMoney2(m),
            });
        }
      } else {
        if (/\b(TAX|VAT|GST|SALES\s+TAX)\b/i.test(line)) {
          const tokens = line.match(MONEY_G);
          if (tokens && tokens.length)
            tax = parseMoney2(tokens[tokens.length - 1]);
        }
        if (isSaleTotalInvoice(line) && total === null) {
          const m = lastMoney(line);
          if (m) total = parseMoney2(m);
        }
      }
    }
  }

  return {
    items,
    subtotal: subtotal ?? null,
    tax: tax ?? null,
    total: total ?? null,
    rawLines,
    section:
      itemsStart !== -1
        ? {
            itemsStart,
            itemsEnd: itemsEnd === -1 ? itemsStart : itemsEnd,
            summaryStart: summaryStart === -1 ? itemsStart : summaryStart,
            summaryEnd: summaryEnd === -1 ? summaryStart : summaryEnd,
          }
        : undefined,
  };
}

// FILE: /lib/ledger/segment-ocr-with-llm.ts (vendor heuristic tweak)
// Extend NOT vendor meta to avoid choosing header label rows as vendor.
// In pickLikelyVendor(), add these guards:
/*
const NOT_VENDOR_META = /(ISSUED\s+TO|INVOICE\s*(NO|#)?|DATE|DUE\s+DATE|PAY\s+TO|ACCOUNT|DESCRIPTION|UNIT\s*PRICE|QTY|AMOUNT)/i;
...
if (NOT_VENDOR_META.test(line)) continue;
*/
