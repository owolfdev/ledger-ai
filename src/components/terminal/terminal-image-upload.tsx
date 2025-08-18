// src/components/terminal/terminal-image-upload.tsx
// SIMPLE APPROACH: Minimal React, maximum native behavior

"use client";
import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import {
  createOpenAiReceiptParser,
  createFallbackParser,
} from "@/lib/ledger/ai-receipt-parser";

// Upload and preprocess image
async function preprocessAndUpload(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/receipt-preprocess", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData?.error) message = errorData.error;
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }

  return (await response.json()) as {
    ok: true;
    url: string;
    mime: string;
    width: number;
  };
}

interface TerminalImageUploadProps {
  onPopulateInput: (cmd: string) => void;
}

export default function TerminalImageUpload({
  onPopulateInput,
}: TerminalImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle button click - direct file input trigger
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    // Reset the input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      // Direct click on the actual input element for better mobile compatibility
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loading) return;

    // Prevent any event propagation that might interfere
    e.stopPropagation();

    setLoading(true);
    setProgress(0);
    setStatus("Uploading...");

    try {
      // 1. Upload and preprocess image
      const processed = await preprocessAndUpload(file);
      const imageUrl = processed.url;

      setStatus("Processing with OCR...");

      // 2. OCR the processed image
      const ocrResponse = await fetch(imageUrl, { cache: "no-store" });
      if (!ocrResponse.ok) {
        throw new Error(
          `Failed to fetch processed image (${ocrResponse.status})`
        );
      }

      const imageBlob = await ocrResponse.blob();

      // 3. Extract text with optimized Tesseract settings
      console.log("Starting OCR with optimized Tesseract settings...");

      const ocrConfigs = [
        {
          name: "Receipt-optimized",
          lang: "eng",
          options: {
            tessedit_pageseg_mode: 6,
            tessedit_ocr_engine_mode: 1,
            tessedit_char_whitelist:
              "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz฿$€£.,/-:()% ",
            preserve_interword_spaces: 1,
          },
        },
        {
          name: "Thai+English hybrid",
          lang: "tha+eng",
          options: {
            tessedit_pageseg_mode: 4,
            tessedit_ocr_engine_mode: 1,
            preserve_interword_spaces: 1,
          },
        },
        {
          name: "Auto-detect fallback",
          lang: "eng",
          options: {
            tessedit_pageseg_mode: 3,
            tessedit_ocr_engine_mode: 2,
          },
        },
      ];

      let bestResult = { text: "", confidence: 0, configName: "" };

      for (const config of ocrConfigs) {
        try {
          console.log(`Trying OCR config: ${config.name}`);

          const result = await Tesseract.recognize(imageBlob, config.lang, {
            logger: (info) => {
              if (
                info.status === "recognizing text" &&
                typeof info.progress === "number"
              ) {
                const adjustedProgress = Math.round(info.progress * 70);
                if (adjustedProgress > progress) {
                  setProgress(adjustedProgress);
                }
              }
            },
            ...config.options,
          });

          const text = result.data.text;
          const confidence = result.data.confidence || 0;

          let qualityScore = confidence;
          if (/\d+\.\d{2}/.test(text)) qualityScore += 10;
          if (/total/i.test(text)) qualityScore += 10;
          if (text.length > 100) qualityScore += 5;
          if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) qualityScore += 5;

          if (qualityScore > bestResult.confidence) {
            bestResult = {
              text: text,
              confidence: qualityScore,
              configName: config.name,
            };
          }
        } catch (error) {
          console.log(`${config.name} failed:`, error);
        }
      }

      const text = bestResult.text;

      if (text.length < 20) {
        throw new Error(
          "All OCR attempts produced very little text - image may be unclear"
        );
      }

      setStatus("Generating command with AI...");
      setProgress(75);

      // 4. Convert OCR text to command using AI
      let command: string;
      const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (openaiApiKey) {
        console.log("Using AI parser...");
        const aiParser = createOpenAiReceiptParser(openaiApiKey);
        command = await aiParser.parseReceiptText(text);
      } else {
        console.log("No OpenAI API key - using fallback parser");
        const fallbackParser = createFallbackParser();
        command = await fallbackParser.parseReceiptText(text);
      }

      // 5. Add image URL to command if not already present
      if (!command.includes("--image") && imageUrl) {
        command += ` --image "${imageUrl}"`;
      }

      setProgress(100);
      setStatus("Complete!");

      console.log("Generated command:", command);

      // 6. Send command to terminal
      onPopulateInput(command);
    } catch (error: unknown) {
      console.error("Image processing failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Image processing failed";
      alert(errorMessage);
    } finally {
      setLoading(false);
      setProgress(0);
      setStatus("");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hidden file input - no label wrapper */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
        // Prevent any event bubbling that might interfere with terminal
        onClick={(e) => e.stopPropagation()}
      />

      {/* Button that triggers file input directly */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 border rounded-md bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        // Prevent terminal from interfering
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>
              {status} {progress > 0 && `${progress}%`}
            </span>
          </>
        ) : (
          <>
            <span>📷</span>
            <span>Add Receipt</span>
          </>
        )}
      </button>
    </div>
  );
}
