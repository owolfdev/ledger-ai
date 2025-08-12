// MODIFIED FILE: src/components/terminal/terminal-image-upload.tsx
// Changes: Replace manual parser selection with confidence-based selection

"use client";
import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { segmentReceiptOcr } from "@/lib/ledger/segment-ocr-with-llm";
import { validateReceiptOcrMath } from "@/lib/ledger/validate-receipt-ocr";

// ---- NEW IMPORTS ----
import {
  parseReceiptWithConfidence,
  enhancedCoalesceSummary,
  assessOcrQuality,
  type ParseResult,
} from "@/lib/ledger/enhanced-ocr-pipeline";

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

      // ---- QUALITY CHECK (NEW) ----
      const ocrQuality = assessOcrQuality(text);
      console.log("OCR Quality Assessment:", ocrQuality);

      if (ocrQuality.confidence < 0.2) {
        throw new Error(
          `OCR quality too low (${ocrQuality.confidence.toFixed(
            2
          )}): ${ocrQuality.issues.join(", ")}`
        );
      }

      // 3) Segment + parse with ENHANCED PIPELINE
      const seg = await segmentReceiptOcr(text);

      // ---- REPLACE OLD PARSER LOGIC ----
      // OLD CODE (remove this):
      /*
      const tryParsers = [
        () => (seg.block ? parseReceiptOcr(seg.block) : null),
        () => seg.block ? (parseReceiptOcrInvoice(seg.block) as unknown as ReceiptData) : null,
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
      */

      // NEW CODE (replace with this):
      const parseResult: ParseResult | null = await parseReceiptWithConfidence(
        text,
        seg.block
      );

      if (!parseResult) {
        throw new Error(
          "All parsers failed to extract valid items from receipt"
        );
      }

      // Check confidence threshold for AI fallback
      if (parseResult.confidence < 0.4) {
        console.warn(
          `Low confidence parse (${parseResult.confidence.toFixed(
            2
          )}), consider AI fallback`
        );
        // TODO: This is where you'd trigger AI image analysis fallback (questions 3&4)
      }

      if (!parseResult.mathValid && parseResult.confidence < 0.6) {
        console.warn(
          "Math validation failed and low confidence - may need manual review"
        );
        // TODO: This could trigger user correction interface (question 4)
      }

      // 4) Enhanced coalescing
      const processedData = enhancedCoalesceSummary(parseResult.data);

      // 5) Final validation (non-blocking)
      const finalValidation = validateReceiptOcrMath(processedData);
      if (!finalValidation.isValid) {
        console.warn("Final math validation failed:", finalValidation.errors);
      }

      // 6) Send to terminal as `new { ... }`, now with enhanced metadata
      const jsonPayload = {
        vendor: seg.vendor,
        date: seg.date,
        items: processedData.items,
        subtotal: processedData.subtotal,
        tax: processedData.tax,
        total: processedData.total,
        rawLines: processedData.rawLines,
        section: processedData.section,
        imageUrl,
        // ---- ENHANCED METADATA (NEW) ----
        _meta: {
          ocrQuality: ocrQuality.confidence,
          parseConfidence: parseResult.confidence,
          parser: parseResult.parser,
          mathValid: parseResult.mathValid,
          finalMathValid: finalValidation.isValid,
          processingErrors: [
            ...ocrQuality.issues,
            ...parseResult.errors,
            ...finalValidation.errors,
          ],
        },
      };

      console.log("Final payload metadata:", jsonPayload._meta);
      onRunCommand(`new ${JSON.stringify(jsonPayload)}`);
    } catch (err: unknown) {
      console.error("Enhanced OCR processing failed:", err);
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
