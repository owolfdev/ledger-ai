"use client";
import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { segmentReceiptOcr } from "@/lib/ledger/segment-ocr-with-llm";
import {
  parseReceiptOcr,
  type ReceiptData,
} from "@/lib/ledger/parse-receipt-ocr";
import { parseReceiptOcrInvoice } from "@/lib/ledger/parse-receipt-ocr-invoice";
import { validateReceiptOcrMath } from "@/lib/ledger/validate-receipt-ocr";

// ---- helpers ----
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function sumItems(items: { price: number }[]) {
  return round2(
    items.reduce((s, i) => s + (Number.isFinite(i.price) ? i.price : 0), 0)
  );
}
function coalesceSummary(parsed: ReceiptData): ReceiptData {
  const out: ReceiptData = { ...parsed };
  const itemsSum = sumItems(out.items);
  const hasSub =
    typeof out.subtotal === "number" && Number.isFinite(out.subtotal);
  const hasTax = typeof out.tax === "number" && Number.isFinite(out.tax);
  const hasTot = typeof out.total === "number" && Number.isFinite(out.total);

  if (hasSub && hasTot && !hasTax) {
    const diff = round2((out.total as number) - (out.subtotal as number));
    const maxTax = Math.max(0.35 * (out.subtotal as number), 0);
    if (diff >= -0.01 && diff <= maxTax + 0.01) out.tax = diff < 0 ? 0 : diff;
  }
  if (hasTot && hasTax && !hasSub) {
    const sub = round2((out.total as number) - (out.tax as number));
    if (sub >= 0) out.subtotal = sub;
  }
  if (hasTot && !hasSub && !hasTax) {
    const inferredTax = round2((out.total as number) - itemsSum);
    if (inferredTax >= -0.01) {
      out.subtotal = itemsSum;
      out.tax = inferredTax < 0 ? 0 : inferredTax;
    }
  }
  return out;
}

// Upload to server for sharp preprocess + Supabase upload
async function preprocessAndUpload(file: File) {
  const fd = new FormData();
  fd.append("file", file); // must be "file"

  const res = await fetch("/api/receipt-preprocess", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    let msg = `Preprocess failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg);
  }

  return (await res.json()) as {
    ok: true;
    url: string; // public (or signed) URL of processed image
    mime: string; // image/jpeg
    width: number; // 1500
  };
}

export default function TerminalImageUpload({
  onRunCommand,
}: {
  onRunCommand: (cmd: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      // 1) sharp on server + upload to Supabase
      const processed = await preprocessAndUpload(file);
      const imageUrl = processed.url;

      // 2) OCR on the *processed* image (fetch → Blob)
      const resp = await fetch(imageUrl, { cache: "no-store" });
      if (!resp.ok)
        throw new Error(`Failed to fetch processed image (${resp.status})`);
      const ocrBlob = await resp.blob();

      const {
        data: { text },
      } = await Tesseract.recognize(ocrBlob, "eng", {
        logger: (m) => {
          if (
            m.status === "recognizing text" &&
            typeof m.progress === "number"
          ) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // 3) Segment + parse (receipt-first, then invoice)
      const seg = await segmentReceiptOcr(text);
      const tryParsers = [
        () => (seg.block ? parseReceiptOcr(seg.block) : null),
        () =>
          seg.block
            ? (parseReceiptOcrInvoice(seg.block) as unknown as ReceiptData)
            : null,
        () => parseReceiptOcr(text),
        () => parseReceiptOcrInvoice(text) as unknown as ReceiptData,
      ];

      let parsed: ReceiptData | null = null;
      for (const fn of tryParsers) {
        const out = fn();
        if (out && out.items?.length) {
          parsed = out;
          break;
        }
      }

      if (!parsed || parsed.items.length === 0) {
        alert("No valid items found in OCR result");
        return;
      }

      parsed = coalesceSummary(parsed);
      validateReceiptOcrMath(parsed); // non-blocking

      // 4) Send to terminal as `new { ... }`, now with imageUrl
      const jsonPayload = {
        vendor: seg.vendor,
        date: seg.date,
        items: parsed.items,
        subtotal: parsed.subtotal,
        tax: parsed.tax,
        total: parsed.total,
        rawLines: parsed.rawLines,
        section: parsed.section,
        imageUrl, // NEW
      };
      onRunCommand(`new ${JSON.stringify(jsonPayload)}`);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Image processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="px-2 py-1 border rounded"
        disabled={loading}
      >
        {loading ? `Processing… ${progress}%` : "📷 Add from Image"}
      </button>
    </div>
  );
}
