// FIXED FILE: src/components/terminal/terminal-image-upload.tsx
// Now actually uses AI for segmentation instead of just regex fallback

"use client";
import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import {
  segmentReceiptOcr,
  createOpenAiClient,
} from "@/lib/ledger/segment-ocr-with-llm";
import { convertOcrToManualCommand } from "@/lib/ledger/convert-ocr-to-manual";

// Upload to server for sharp preprocess + Supabase upload
async function preprocessAndUpload(file: File) {
  const fd = new FormData();
  fd.append("file", file);

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
    url: string;
    mime: string;
    width: number;
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
      // 1) Preprocess and upload image
      const processed = await preprocessAndUpload(file);
      const imageUrl = processed.url;

      // 2) OCR the processed image
      const resp = await fetch(imageUrl, { cache: "no-store" });
      if (!resp.ok)
        throw new Error(`Failed to fetch processed image (${resp.status})`);
      const ocrBlob = await resp.blob();

      const {
        data: { text },
      } = await Tesseract.recognize(ocrBlob, "tha+eng", {
        logger: (m) => {
          if (
            m.status === "recognizing text" &&
            typeof m.progress === "number"
          ) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // 3) Basic quality check
      if (text.length < 50) {
        throw new Error("OCR produced very little text - image may be unclear");
      }

      console.log("=== RAW OCR TEXT ===");
      console.log(text);
      console.log("=== END RAW OCR ===");

      // 4) CREATE AI CLIENT AND SEGMENT WITH AI
      let seg;
      const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (openaiApiKey) {
        console.log("Using AI segmentation...");
        const llmClient = createOpenAiClient(openaiApiKey);
        seg = await segmentReceiptOcr(text, llmClient);
      } else {
        console.log("No OpenAI API key - using regex fallback only");
        seg = await segmentReceiptOcr(text);
      }

      console.log("Segmentation result:", {
        confidence: seg.confidence,
        usedFallback: seg.usedFallback,
        vendor: seg.vendor,
        date: seg.date,
        blockLength: seg.block.length,
      });

      if (!seg.block || seg.block.trim().length === 0) {
        throw new Error("Could not identify purchase items in receipt");
      }

      console.log("Segmented receipt block:", seg.block);

      // 5) Parse the segmented block with our existing parser
      const { parseReceiptOcr } = await import(
        "@/lib/ledger/parse-receipt-ocr"
      );
      const parsed = parseReceiptOcr(seg.block);

      if (!parsed.items || parsed.items.length === 0) {
        throw new Error("No purchase items found in receipt");
      }

      // 6) Convert to clean manual command syntax
      const manualCommand = convertOcrToManualCommand(
        parsed,
        seg.vendor || undefined,
        seg.date || undefined,
        imageUrl
      );

      console.log("Generated manual command:", manualCommand);

      // 7) Send the clean manual command to terminal
      onRunCommand(manualCommand);
    } catch (err: unknown) {
      console.error("OCR processing failed:", err);
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
