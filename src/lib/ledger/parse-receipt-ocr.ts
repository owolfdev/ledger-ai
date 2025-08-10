// FILE: /lib/ledger/parse-receipt-ocr.ts (restored v2 — stable)
// Original behavior for conventional receipts. Kept unchanged to avoid regressions.

export type ReceiptItem = { description: string; price: number };
export type ReceiptData = {
  items: ReceiptItem[];
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

const MONEY_TOKEN = /\$?(?:\d{1,3}(?:,\d{3})*|\d+)\.(?:\d{2,3})/;
const TRAIL_FLAG = /(?:\s+[A-Z0-9§%]{1,3})?/; // allow N, X, 0, etc.
const MONEY_AT_END = new RegExp(`${MONEY_TOKEN.source}$`);
const MONEY_AT_END_WITH_FLAG = new RegExp(
  `(${MONEY_TOKEN.source})${TRAIL_FLAG.source}$`,
  "i"
);

const IS_PRICE_LINE = (line: string) => MONEY_AT_END_WITH_FLAG.test(line);

const IS_KEYWORD = (line: string) =>
  /\b(SUB\s*-?\s*TOTAL|SUBTOTAL|TOTAL\s*TAX|TOTAL\s+PURCHASE|TOTAL|TAX|CHANGE|BALANCE|AMOUNT|AUTH|APPROVED)\b/i.test(
    line
  );

const ITEM_FORMAT_RE = new RegExp(
  [
    "^",
    "(?:[A-Z]\\s+)?",
    "(?:[0-9]{5,}\\s+)?",
    "(.+?)",
    "\\s+",
    `(${MONEY_TOKEN.source})`,
    `${TRAIL_FLAG.source}`,
    "$",
  ].join(""),
  "i"
);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function parseMoney(token: string): number {
  return round2(parseFloat(token.replace(/[$,]/g, "")));
}
function cleanDesc(desc: string): string {
  return desc
    .replace(/\s{2,}/g, " ")
    .replace(/\s+[A-Z0-9§%]{1,3}$/, "")
    .trim();
}

function findFirstItemsStart(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (IS_PRICE_LINE(line) && !/\b(SUBTOTAL|TOTAL|TAX)\b/i.test(line))
      return i;
  }
  return -1;
}

export function parseReceiptOcr(raw: string): ReceiptData {
  const rawLines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u2014\u2013]/g, "-").trim())
    .filter(Boolean);

  const items: ReceiptItem[] = [];
  let subtotal: number | null = null;
  let tax: number | null = null;
  let total: number | null = null;

  const itemsStart = findFirstItemsStart(rawLines);
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
      if (IS_PRICE_LINE(line) && !IS_KEYWORD(line)) {
        const m = ITEM_FORMAT_RE.exec(line);
        if (m) {
          items.push({ description: cleanDesc(m[1]), price: parseMoney(m[2]) });
        } else {
          const last = line.match(MONEY_AT_END_WITH_FLAG);
          if (last) {
            const price = parseMoney(last[1]);
            const desc = cleanDesc(line.replace(MONEY_AT_END_WITH_FLAG, ""));
            if (!IS_KEYWORD(desc)) items.push({ description: desc, price });
          }
        }
      }
    }
  }

  if (summaryStart !== -1) {
    for (let i = summaryStart; i < rawLines.length; i++) {
      const line = rawLines[i];
      const subM = line.match(
        new RegExp(
          `\\b(SUB\\s*-?\\s*TOTAL|SUBTOTAL)\\b\\s+(${MONEY_TOKEN.source})`,
          "i"
        )
      );
      if (subM) subtotal = parseMoney(subM[2]);

      if (/\bTAX\b/i.test(line)) {
        const tokens = line.match(new RegExp(MONEY_TOKEN, "g"));
        if (tokens && tokens.length)
          tax = parseMoney(tokens[tokens.length - 1]);
      }

      const totM = line.match(
        new RegExp(
          `\\bTOTAL\\b(?!\\s*TAX)\\s+(${MONEY_TOKEN.source})\\s*$`,
          "i"
        )
      );
      if (totM) {
        total = parseMoney(totM[1]);
        summaryEnd = i;
        break;
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
            `\\b(SUB\\s*-?\\s*TOTAL|SUBTOTAL)\\b\\s+(${MONEY_TOKEN.source})`,
            "i"
          )
        );
        if (m) subtotal = parseMoney(m[2]);
        continue;
      }
      if (!reachedSummary) {
        if (!started && IS_PRICE_LINE(line) && !IS_KEYWORD(line))
          started = true;
        if (started && IS_PRICE_LINE(line) && !IS_KEYWORD(line)) {
          const m = ITEM_FORMAT_RE.exec(line);
          if (m)
            items.push({
              description: cleanDesc(m[1]),
              price: parseMoney(m[2]),
            });
          else {
            const last = line.match(MONEY_AT_END_WITH_FLAG);
            if (last) {
              const price = parseMoney(last[1]);
              const desc = cleanDesc(line.replace(MONEY_AT_END_WITH_FLAG, ""));
              if (!IS_KEYWORD(desc)) items.push({ description: desc, price });
            }
          }
        }
      } else {
        if (/\bTAX\b/i.test(line)) {
          const tokens = line.match(new RegExp(MONEY_TOKEN, "g"));
          if (tokens && tokens.length)
            tax = parseMoney(tokens[tokens.length - 1]);
        }
        const totM = line.match(
          new RegExp(
            `\\bTOTAL\\b(?!\\s*TAX)\\s+(${MONEY_TOKEN.source})\\s*$`,
            "i"
          )
        );
        if (totM && total === null) total = parseMoney(totM[1]);
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
