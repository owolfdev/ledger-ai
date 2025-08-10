// FILE: src/components/terminal/terminal-image-upload.tsx
"use client";
import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { segmentReceiptOcr } from "@/lib/ledger/segment-ocr-with-llm";
import { parseReceiptOcr } from "@/lib/ledger/parse-receipt-ocr";
import { validateReceiptOcrMath } from "@/lib/ledger/validate-receipt-ocr";

/**
 * TerminalImageUpload
 * A small addon for the terminal input area that:
 * - Lets the user pick an image
 * - Runs OCR → segmentation → parse → validate
 * - Pipes the parsed JSON into the terminal's `onCommand` as a `new { ... }` command
 */
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
          if (
            m.status === "recognizing text" &&
            typeof m.progress === "number"
          ) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      })
        .then(async ({ data: { text } }) => {
          const seg = await segmentReceiptOcr(text);
          const parsed = seg.block ? parseReceiptOcr(seg.block) : null;
          if (!parsed || parsed.items.length === 0) {
            alert("No valid items found in OCR result");
            return;
          }

          // Optionally validate math (not blocking save)
          validateReceiptOcrMath(parsed);

          const jsonPayload = {
            items: parsed.items,
            subtotal: parsed.subtotal,
            tax: parsed.tax,
            total: parsed.total,
            rawLines: parsed.rawLines,
            section: parsed.section,
          };

          // Pipe directly into terminal as a `new { ... }` command
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

// PATCH: src/components/terminal/terminal.tsx
// Inside the <form> before the <Textarea>, render our upload button
// Assuming we add `onRunCommand` prop to Terminal to call onCommand directly.

/* Example integration:
<form ...>
  <span className="text-primary select-none">$</span>
  <TerminalImageUpload onRunCommand={(cmd) => onCommand?.(cmd, setHistory, history)} />
  <Textarea ... />
</form>
*/
