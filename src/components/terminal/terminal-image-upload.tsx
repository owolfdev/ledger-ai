// FILE: /src/components/terminal/terminal-image-upload.tsx (add tax/subtotal inference)
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

// --- Helpers ---------------------------------------------------------------
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function sumItems(items: { price: number }[]) {
  return round2(
    items.reduce((s, i) => s + (Number.isFinite(i.price) ? i.price : 0), 0)
  );
}

/**
 * Coalesce missing subtotal/tax to satisfy validation rules:
 * - If subtotal & total exist but tax is null → tax = total - subtotal (>=0 within sane bounds)
 * - If total & tax exist but subtotal is null → subtotal = total - tax
 * - If only total exists → try subtotal = sum(items), tax = total - subtotal
 * Bounds: tax must be >= -0.01 and <= max(0.35*subtotal, subtotal) to avoid wild inference.
 */
function coalesceSummary(parsed: ReceiptData): ReceiptData {
  const out: ReceiptData = { ...parsed };
  const itemsSum = sumItems(out.items);
  const hasSub =
    typeof out.subtotal === "number" && Number.isFinite(out.subtotal);
  const hasTax = typeof out.tax === "number" && Number.isFinite(out.tax);
  const hasTot = typeof out.total === "number" && Number.isFinite(out.total);

  if (hasSub && hasTot && !hasTax) {
    const diff = round2((out.total as number) - (out.subtotal as number));
    const maxTax = Math.max(0.35 * (out.subtotal as number), 0); // allow up to 35% as a guard
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

export default function TerminalImageUpload({
  onRunCommand,
}: {
  onRunCommand: (cmd: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const resizeImage = (file: File, callback: (blob: Blob) => void) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) img.src = e.target.result as string;
    };
    img.onload = () => {
      const targetW = 1000;
      const scale = targetW / img.width;
      const targetH = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.filter = "grayscale(1) contrast(1.2)";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob && callback(blob), "image/jpeg", 0.85);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgress(0);

    resizeImage(file, (blob) => {
      Tesseract.recognize(blob, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && typeof m.progress === "number")
            setProgress(Math.round(m.progress * 100));
        },
      })
        .then(async ({ data: { text } }) => {
          const seg = await segmentReceiptOcr(text);

          const tryParsers = [
            () => (seg.block ? parseReceiptOcr(seg.block) : null),
            () => (seg.block ? parseReceiptOcrInvoice(seg.block) : null),
            () => parseReceiptOcr(text),
            () => parseReceiptOcrInvoice(text),
          ];

          let parsed: ReceiptData | null = null;
          for (const fn of tryParsers) {
            parsed = fn();
            if (parsed && parsed.items.length > 0) break;
          }

          if (!parsed || parsed.items.length === 0) {
            alert("No valid items found in OCR result");
            return;
          }

          // NEW: coalesce missing subtotal/tax so schema validation passes
          parsed = coalesceSummary(parsed);

          // Optional math check (non-blocking)
          validateReceiptOcrMath(parsed);

          const jsonPayload = {
            vendor: seg.vendor,
            date: seg.date,
            items: parsed.items,
            subtotal: parsed.subtotal,
            tax: parsed.tax,
            total: parsed.total,
            rawLines: parsed.rawLines,
            section: parsed.section,
          };

          onRunCommand(`new ${JSON.stringify(jsonPayload)}`);
        })
        .catch((err) => {
          console.error("OCR error", err);
          alert("OCR failed: " + (err?.message || err));
        })
        .finally(() => setLoading(false));
    });
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
