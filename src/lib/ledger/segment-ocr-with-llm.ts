// /lib/ledger/segment-ocr-with-llm.ts
// v4 — robust item detection + vendor/date metadata
// - Guards out invoice/table headers so they aren't misread as items
// - Avoids treating dates like "11.02.2030" as prices
// - Shares vendor/date with both LLM and fallback flows

import {
  KNOWN_VENDOR_WORDS,
  SLOGAN_VENDOR_MAP,
} from "@/lib/ledger/vendor-config";

// ---------- Types ----------
export type SegmentResult = {
  block: string;
  confidence: number;
  rationale?: string;
  usedFallback?: boolean;
  vendor?: string | null; // inferred vendor (from header)
  date?: string | null; // ISO YYYY-MM-DD
};

export interface LlmClient {
  complete(opts: {
    system: string;
    user: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;
}

// ---------- Prompts ----------
function buildSystemPrompt(): string {
  return [
    "You extract the core purchase section from raw OCR receipts.",
    "Return STRICT JSON with keys: block, confidence, rationale.",
    "The block must contain only: item lines (description + price) and the summary lines",
    "in order: items then SUBTOTAL, TAX (if present), then the FIRST TOTAL after SUBTOTAL.",
    "Exclude payment authorizations, card details, dates, rates, tax breakdowns (like 'S TAX 9.75% 89.99'),",
    "and any line where the word TOTAL is not the sale total (e.g., 'TOTAL TAX' or 'TOTAL PURCHASE').",
    "Preserve the original text for the kept lines.",
    "If nothing valid is found, return an empty block and confidence 0.",
  ].join(" ");
}

function buildUserPrompt(raw: string): string {
  const example =
    `RAW OCR RECEIPT:\n${raw}\n\n` +
    `Return JSON only, e.g.:\n{\n` +
    `  "block": "ITEM 1234 1.23 N\\nSUBTOTAL 1.23\\nTAX 0.10\\nTOTAL 1.33",\n` +
    `  "confidence": 0.92,\n` +
    `  "rationale": "Kept items; first TOTAL after SUBTOTAL; excluded payment block and TOTAL TAX."\n` +
    `}`;
  return example;
}

// ---------- JSON safe parse ----------
function safeParseJson<T>(
  s: string
): { ok: true; value: T } | { ok: false; error: Error } {
  try {
    const trimmed = s.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start)
      throw new Error("no JSON object");
    const json = trimmed.slice(start, end + 1);
    return { ok: true, value: JSON.parse(json) as T };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}

// ---------- Vendor / Date helpers ----------
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]?\d{2,4}[\s.-]?\d{3,4}/;
const STORE_META_RE = /\b(?:ST#|STORE|OP#|TE#|TR#|TILL|REG)\b/i;
const ADDRESS_LIKE_RE =
  /\b(?:AVE|AVENUE|ST|STREET|RD|ROAD|BLVD|DR|DRIVE|FL|FLOOR|SUITE|ZIP|CITY|STATE)\b/i;

// Rows we should never treat as items or vendor names (invoice/table headers, billing blocks, etc.)
const NOT_VENDOR_META =
  /\b(ISSUED\s+TO|INVOICE\s*NO|INVOICE\s*#|BILL\s+TO|SHIP\s+TO|PAY\s+TO|PO\s*#|P\.?O\.?|RECEIPT\s*(NO|#)|DATE|DUE\s+DATE|ACCOUNT\s+NO|ACCOUNT\s+NAME|DESCRIPTION\s+UNIT\s+PRICE|DESCRIPTION\s+PRICE|UNIT\s+PRICE|QTY|QUANTITY|AMOUNT|TOTAL\s+DUE|BALANCE\s+DUE|AMOUNT\s+DUE|TERMS|CONDITIONS|PAYMENT\s+DUE)\b/i;

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pickLikelyVendor(lines: string[], itemsStart: number): string | null {
  const headerEnd =
    itemsStart === -1 ? Math.min(lines.length, 25) : Math.min(itemsStart, 25);
  const header = lines.slice(0, headerEnd);

  // 1) Slogan → brand
  for (const line of header) {
    for (const [re, name] of SLOGAN_VENDOR_MAP) if (re.test(line)) return name;
  }

  // 2) Known vendor names anywhere in header
  for (const line of header) {
    const canon = line
      .replace(/[^A-Za-z0-9\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
    for (const w of KNOWN_VENDOR_WORDS) {
      if (canon.includes(w)) return toTitleCase(w);
    }
  }

  // 3) Heuristic: short, mostly-letters header lines
  for (const raw of header) {
    const line = raw.trim();
    if (!line) continue;
    if (PHONE_RE.test(line)) continue;
    if (STORE_META_RE.test(line)) continue;
    if (ADDRESS_LIKE_RE.test(line)) continue;
    if (NOT_VENDOR_META.test(line)) continue;
    if (
      /\b(MANAGER|ASSISTANT|CASHIER|CUSTOMER COPY|MERCHANT COPY)\b/i.test(line)
    )
      continue;

    const cleaned = line
      .replace(/[_<>*#|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = cleaned.split(/\s+/);
    const lettersRatio =
      cleaned.replace(/[^A-Za-z]/g, "").length / Math.max(cleaned.length, 1);
    if (words.length <= 5 && lettersRatio > 0.6) return toTitleCase(cleaned);
  }

  return null;
}

// Date formats → normalize to YYYY-MM-DD
const DATE_REGEXPS: RegExp[] = [
  /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, // MM/DD/YYYY
  /\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/, // MM/DD/YY or DD/MM/YY
  /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/, // YYYY-MM-DD or YYYY/MM/DD
  /\b(\d{1,2})[.](\d{1,2})[.](\d{4})\b/, // DD.MM.YYYY
];

function normalizeYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}
function toIsoDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const yyyy = String(y).padStart(4, "0");
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return null;
  return `${yyyy}-${mm}-${dd}`;
}
function disambiguateDMYorMDY(a: number, b: number, year: number) {
  if (a > 12 && b <= 12) return { y: normalizeYear(year), m: b, d: a };
  if (b > 12 && a <= 12) return { y: normalizeYear(year), m: a, d: b };
  return { y: normalizeYear(year), m: a, d: b }; // default US style
}
function extractDate(lines: string[]): string | null {
  for (const line of lines) {
    for (const re of DATE_REGEXPS) {
      const m = line.match(re);
      if (!m) continue;
      if (re === DATE_REGEXPS[0]) {
        const mm = +m[1],
          dd = +m[2],
          yyyy = +m[3];
        const iso = toIsoDate(yyyy, mm, dd);
        if (iso) return iso;
      } else if (re === DATE_REGEXPS[1]) {
        const a = +m[1],
          b = +m[2],
          y = +m[3];
        const p = disambiguateDMYorMDY(a, b, y);
        const iso = toIsoDate(p.y, p.m, p.d);
        if (iso) return iso;
      } else if (re === DATE_REGEXPS[2]) {
        const yyyy = +m[1],
          mm = +m[2],
          dd = +m[3];
        const iso = toIsoDate(yyyy, mm, dd);
        if (iso) return iso;
      } else if (re === DATE_REGEXPS[3]) {
        const dd = +m[1],
          mm = +m[2],
          yyyy = +m[3];
        const iso = toIsoDate(yyyy, mm, dd);
        if (iso) return iso;
      }
    }
  }
  return null;
}

// ---------- Item detection ----------
// Allow $500 or $500.00, with optional commas
const MONEY_RE = /\$?\s*(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2,3})?/;
// tokens after price (flags/currency/etc.)
const TRAIL_TOKEN = /(?:\s+[A-Za-z0-9%§]{1,4}){0,2}/;
const END_PUNCT = /[)\]>»】）]*$/;

const PRICED_END = new RegExp(
  `${MONEY_RE.source}${TRAIL_TOKEN.source}(?:${END_PUNCT.source})$`,
  "i"
);

// If a money-looking token is followed by something date-ish (e.g. "11.02.2030"),
// it's probably a date, not a price. Keep this guard.
const DATEISH_AFTER_MONEY = /\b\d{1,3}\.\d{1,2}[^0-9]{0,3}(?:19|20)\d{2}\b/;

const KEYWORD_LINE =
  /\b(SUB\s*-?\s*TOTAL|SUBTOTAL|TOTAL\s*TAX|TOTAL\s+PURCHASE|TAX|CHANGE|AMOUNT|APPROVED|AUTH|BALANCE DUE)\b/i;

function isKeyword(l: string): boolean {
  return KEYWORD_LINE.test(l);
}

function isItemCandidate(l: string): boolean {
  if (!PRICED_END.test(l)) return false;
  if (/\b(SUBTOTAL|TOTAL|TAX)\b/i.test(l)) return false;
  if (NOT_VENDOR_META.test(l)) return false;
  if (DATEISH_AFTER_MONEY.test(l)) return false;
  return true;
}

// ---------- Fallback segmentation ----------
export function fallbackSegment(raw: string): SegmentResult {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u2014\u2013]/g, "-").trim())
    .filter(Boolean);

  // 1) first item-like line
  let i0 = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isItemCandidate(lines[i])) {
      i0 = i;
      break;
    }
  }

  const vendor = pickLikelyVendor(lines, i0);
  const date = extractDate(lines);

  if (i0 === -1) {
    return {
      block: "",
      confidence: 0,
      rationale: "no item-like line",
      usedFallback: true,
      vendor,
      date,
    };
  }

  // 2) collect items until SUBTOTAL
  const items: string[] = [];
  let i = i0;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (/\b(SUB\s*-?\s*TOTAL|SUBTOTAL)\b/i.test(l)) break;
    if (isItemCandidate(l) && !isKeyword(l)) items.push(l);
  }
  if (i >= lines.length) {
    return {
      block: items.join("\n"),
      confidence: 0.45,
      rationale: "subtotal not found",
      usedFallback: true,
      vendor,
      date,
    };
  }

  // 3) summary: SUBTOTAL + any TAX lines + first valid TOTAL
  const summary: string[] = [lines[i]]; // SUBTOTAL
  i++;
  let totalLine: string | null = null;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (/\bTOTAL\b(?!\s*TAX|\s*PURCHASE)\s+/.test(l)) {
      totalLine = l;
      summary.push(l);
      break;
    }
    if (/\bTAX\b/.test(l)) summary.push(l);
  }
  if (!totalLine) {
    return {
      block: [...items, ...summary].join("\n"),
      confidence: 0.55,
      rationale: "total not found after subtotal",
      usedFallback: true,
      vendor,
      date,
    };
  }

  return {
    block: [...items, ...summary].join("\n"),
    confidence: 0.75,
    rationale: "regex fallback",
    usedFallback: true,
    vendor,
    date,
  };
}

// ---------- Main entry ----------
export async function segmentReceiptOcr(
  raw: string,
  llm?: LlmClient
): Promise<SegmentResult> {
  // Pre-compute metadata so both paths share it.
  const preLines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u2014\u2013]/g, "-").trim())
    .filter(Boolean);

  let guessStart = -1;
  for (let i = 0; i < preLines.length; i++) {
    if (isItemCandidate(preLines[i])) {
      guessStart = i;
      break;
    }
  }
  const metaVendor = pickLikelyVendor(preLines, guessStart);
  const metaDate = extractDate(preLines);

  // // 👈 LOG EXTRACTED METADATA
  // console.log("EXTRACTED METADATA:");
  // console.log("- Vendor:", metaVendor);
  // console.log("- Date:", metaDate);
  // console.log("- First item candidate line:", guessStart);

  if (llm) {
    try {
      const system = buildSystemPrompt();
      const user = buildUserPrompt(raw);
      const text = await llm.complete({
        system,
        user,
        temperature: 0,
        maxTokens: 600,
      });
      const parsed = safeParseJson<{
        block?: string;
        confidence?: number;
        rationale?: string;
      }>(text);

      if (
        parsed.ok &&
        parsed.value.block &&
        typeof parsed.value.block === "string"
      ) {
        const conf =
          typeof parsed.value.confidence === "number"
            ? Math.max(0, Math.min(1, parsed.value.confidence))
            : 0.5;
        return {
          block: parsed.value.block.trim(),
          confidence: conf,
          rationale: parsed.value.rationale,
          vendor: metaVendor ?? null,
          date: metaDate ?? null,
        };
      }
    } catch {
      // ignore and fall back
    }
  }

  const fb = fallbackSegment(raw);
  return {
    ...fb,
    vendor: fb.vendor ?? metaVendor ?? null,
    date: fb.date ?? metaDate ?? null,
  };
}

// ---------- OpenAI client ----------
export function createOpenAiClient(
  apiKey: string,
  model = "gpt-4o-mini"
): LlmClient {
  const base = "https://api.openai.com/v1/chat/completions";
  return {
    async complete({ system, user, temperature = 0, maxTokens = 600 }) {
      const res = await fetch(base, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}
