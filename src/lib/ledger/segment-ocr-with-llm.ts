// /lib/ledger/segment-ocr-with-llm.ts (v3 tolerant trailing tokens)
// Broaden trailing handling: allow up to TWO trailing flag tokens (letters/digits/%/§),
// and tolerate stray closing punctuation at the very end. Fixes missed lines like "... 4.98 0" or "... 1.88 0)".

export type SegmentResult = {
  block: string;
  confidence: number;
  rationale?: string;
  usedFallback?: boolean;
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

// Heuristic fallback (more tolerant)
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
  if (i0 === -1)
    return {
      block: "",
      confidence: 0,
      rationale: "no item-like line",
      usedFallback: true,
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
    };

  return {
    block: [...items, ...summary].join("\n"),
    confidence: 0.75,
    rationale: "regex fallback",
    usedFallback: true,
  };
}

export async function segmentReceiptOcr(
  raw: string,
  llm?: LlmClient
): Promise<SegmentResult> {
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
        };
      }
    } catch {}
  }
  return fallbackSegment(raw);
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
