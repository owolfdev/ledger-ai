// /lib/ledger/segment-ocr-with-llm.ts (v3 tolerant trailing tokens + vendor/date)
// Broaden trailing handling: allow up to TWO trailing flag tokens (letters/digits/%/§),
// and tolerate stray closing punctuation at the very end. Fixes missed lines like "... 4.98 0" or "... 1.88 0)".
// Additionally, extract vendor and date metadata from the FULL raw OCR (kept outside the block),
// so downstream code can use them without relaxing the block filtering policy.

// top of file
import {
  KNOWN_VENDOR_WORDS,
  SLOGAN_VENDOR_MAP,
} from "@/lib/ledger/vendor-config";

export type SegmentResult = {
  block: string;
  confidence: number;
  rationale?: string;
  usedFallback?: boolean;
  vendor?: string | null; // NEW: inferred vendor (from header/footer)
  date?: string | null; // NEW: ISO date YYYY-MM-DD (best-effort)
};

export interface LlmClient {
  complete(opts: {
    system: string;
    user: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;
}

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
  const example = `RAW OCR RECEIPT:\n${raw}\n\nReturn JSON only, e.g.:\n{\n  "block": "ITEM 1234 1.23 N\nSUBTOTAL 1.23\nTAX 0.10\nTOTAL 1.33",\n  "confidence": 0.92,\n  "rationale": "Kept items; first TOTAL after SUBTOTAL; excluded payment block and TOTAL TAX."\n}`;
  return example;
}

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

// ---------------- Vendor / Date extraction (kept separate from 'block') ----------------
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]?\d{2,4}[\s.-]?\d{3,4}/;
const STORE_META_RE = /\b(?:ST#|STORE|OP#|TE#|TR#|TILL|REG)\b/i;
const ADDRESS_LIKE_RE =
  /\b(?:AVE|AVENUE|ST|STREET|RD|ROAD|BLVD|DR|DRIVE|FL|FLOOR|SUITE|ZIP|CITY|STATE)\b/i;

// const SLOGAN_VENDOR_MAP: Array<[RegExp, string]> = [
//   [/\bSave money\. Live better\.?\b/i, "Walmart"],
//   [/\bJust Do It\b/i, "Nike"],
//   [/\bI\'m Lovin'? It\b/i, "McDonald's"],
//   [/\bHave It Your Way\b/i, "Burger King"],
// ];

// const KNOWN_VENDOR_WORDS = [
//   "WALMART",
//   "TARGET",
//   "COSTCO",
//   "STARBUCKS",
//   "AMAZON",
//   "TESCO",
//   "7-ELEVEN",
//   "SEVEN ELEVEN",
//   "HOME DEPOT",
//   "LOWE'S",
// ];

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

  for (const line of header) {
    for (const [re, name] of SLOGAN_VENDOR_MAP) if (re.test(line)) return name;
  }

  for (const line of header) {
    const canon = line
      .replace(/[^A-Za-z0-9\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
    for (const w of KNOWN_VENDOR_WORDS)
      if (canon.includes(w)) return toTitleCase(w);
  }

  for (const raw of header) {
    const line = raw.trim();
    if (!line) continue;
    if (PHONE_RE.test(line)) continue;
    if (STORE_META_RE.test(line)) continue;
    if (ADDRESS_LIKE_RE.test(line)) continue;
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
  const yyyy = y.toString().padStart(4, "0");
  const mm = m.toString().padStart(2, "0");
  const dd = d.toString().padStart(2, "0");
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

// ---------------- Core segmentation ----------------
export function fallbackSegment(raw: string): SegmentResult {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u2014\u2013]/g, "-").trim())
    .filter(Boolean);

  const money = /\$?(?:\d{1,3}(?:,\d{3})*|\d+)\.(?:\d{2,3})/;
  // up to two trailing tokens like " N", " 0", " X", " %"; allow a final )]> etc.
  const TRAIL = /(?:\s+[A-Za-z0-9%§]{1,4}){0,2}/;
  const END_PUNCT = /[)\]>»】）]*$/; // tolerate stray closers
  const pricedEnd = new RegExp(
    `${money.source}${TRAIL.source}(?:${END_PUNCT.source})$`,
    "i"
  );

  const isKeyword = (l: string) =>
    /\b(SUB\s*-?\s*TOTAL|SUBTOTAL|TOTAL\s*TAX|TOTAL\s+PURCHASE|TAX|CHANGE|AMOUNT|APPROVED|AUTH|BALANCE DUE)\b/i.test(
      l
    );

  // 1) find first item-like line
  let i0 = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (pricedEnd.test(l) && !/\b(SUBTOTAL|TOTAL|TAX)\b/i.test(l)) {
      i0 = i;
      break;
    }
  }

  const vendor = pickLikelyVendor(lines, i0);
  const date = extractDate(lines);

  if (i0 === -1)
    return {
      block: "",
      confidence: 0,
      rationale: "no item-like line",
      usedFallback: true,
      vendor,
      date,
    };

  // 2) collect items until SUBTOTAL
  const items: string[] = [];
  let i = i0;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (/\b(SUB\s*-?\s*TOTAL|SUBTOTAL)\b/i.test(l)) break;
    if (pricedEnd.test(l) && !isKeyword(l)) items.push(l);
  }
  if (i >= lines.length)
    return {
      block: items.join("\n"),
      confidence: 0.45,
      rationale: "subtotal not found",
      usedFallback: true,
      vendor,
      date,
    };

  // 3) summary: keep SUBTOTAL, any TAX lines, then the FIRST line with TOTAL <amount> (but not TOTAL TAX/PURCHASE)
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
  if (!totalLine)
    return {
      block: [...items, ...summary].join("\n"),
      confidence: 0.55,
      rationale: "total not found after subtotal",
      usedFallback: true,
      vendor,
      date,
    };

  return {
    block: [...items, ...summary].join("\n"),
    confidence: 0.75,
    rationale: "regex fallback",
    usedFallback: true,
    vendor,
    date,
  };
}

export async function segmentReceiptOcr(
  raw: string,
  llm?: LlmClient
): Promise<SegmentResult> {
  console.log("RAW from segmentReceiptOcr: ", raw);
  // Compute metadata (vendor/date) from raw up-front so both LLM and fallback share it.
  const preLines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u2014\u2013]/g, "-").trim())
    .filter(Boolean);
  // Tentative itemsStart guess for vendor heuristic: first item-like line using the same pricedEnd rule
  const money = /\$?(?:\d{1,3}(?:,\d{3})*|\d+)\.(?:\d{2,3})/;
  const TRAIL = /(?:\s+[A-Za-z0-9%§]{1,4}){0,2}/;
  const END_PUNCT = /[)\]>»】）]*$/;
  const pricedEnd = new RegExp(
    `${money.source}${TRAIL.source}(?:${END_PUNCT.source})$`,
    "i"
  );
  let guessStart = -1;
  for (let i = 0; i < preLines.length; i++) {
    const l = preLines[i];
    if (pricedEnd.test(l) && !/\b(SUBTOTAL|TOTAL|TAX)\b/i.test(l)) {
      guessStart = i;
      break;
    }
  }
  const metaVendor = pickLikelyVendor(preLines, guessStart);
  const metaDate = extractDate(preLines);

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
    } catch {}
  }
  const fb = fallbackSegment(raw);
  // Ensure metadata is included even when fallback is used
  return {
    ...fb,
    vendor: fb.vendor ?? metaVendor ?? null,
    date: fb.date ?? metaDate ?? null,
  };
}

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
