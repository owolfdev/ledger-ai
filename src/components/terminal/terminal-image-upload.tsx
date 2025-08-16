// src/components/terminal/terminal-image-upload.tsx
// SIMPLIFIED: Image → OCR → AI → Command

"use client";
import React, { useRef, useState } from "react";
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
  onPopulateInput: (cmd: string) => void; // ✅ CHANGE FROM onRunCommand
}
export default function TerminalImageUpload({
  onPopulateInput, // ✅ CHANGE FROM onRunCommand
}: TerminalImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      // Try multiple OCR configurations and pick the best result
      const ocrConfigs = [
        {
          name: "Receipt-optimized",
          lang: "eng", // English-only for better number recognition
          options: {
            tessedit_pageseg_mode: 6, // Single uniform block of text
            tessedit_ocr_engine_mode: 1, // LSTM only (more accurate)
            tessedit_char_whitelist:
              "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz฿$€£.,/-:()% ",
            preserve_interword_spaces: 1,
          },
        },
        {
          name: "Thai+English hybrid",
          lang: "tha+eng", // Original bilingual
          options: {
            tessedit_pageseg_mode: 4, // Single column of text
            tessedit_ocr_engine_mode: 1, // LSTM only
            preserve_interword_spaces: 1,
          },
        },
        {
          name: "Auto-detect fallback",
          lang: "eng", // English fallback
          options: {
            tessedit_pageseg_mode: 3, // Fully automatic (default)
            tessedit_ocr_engine_mode: 2, // Hybrid (LSTM + Legacy)
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
                const adjustedProgress = Math.round(info.progress * 70); // OCR is 70% of total
                if (adjustedProgress > progress) {
                  setProgress(adjustedProgress);
                }
              }
            },
            ...config.options,
          });

          const text = result.data.text;
          const confidence = result.data.confidence || 0;

          console.log(`${config.name} results:`, {
            textLength: text.length,
            confidence: confidence.toFixed(1),
            hasNumbers: /\d/.test(text),
            hasPrices: /\d+\.\d{2}/.test(text),
            hasTotal: /total/i.test(text),
          });

          // Score this result (confidence + content quality)
          let qualityScore = confidence;

          // Bonus points for finding expected receipt content
          if (/\d+\.\d{2}/.test(text)) qualityScore += 10; // Has price format
          if (/total/i.test(text)) qualityScore += 10; // Has total
          if (text.length > 100) qualityScore += 5; // Reasonable length
          if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) qualityScore += 5; // Has date

          console.log(
            `${config.name} quality score: ${qualityScore.toFixed(1)}`
          );

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
      console.log(
        `\nBest OCR result: ${
          bestResult.configName
        } (score: ${bestResult.confidence.toFixed(1)})`
      );

      // Basic quality check
      if (text.length < 20) {
        throw new Error(
          "All OCR attempts produced very little text - image may be unclear"
        );
      }

      // // Detailed OCR quality analysis
      // console.log("=== OCR ANALYSIS ===");
      // console.log("Raw text length:", text.length);
      // console.log("Number of lines:", text.split(/\r?\n/).length);
      // console.log("Number of words:", text.split(/\s+/).filter(Boolean).length);
      // console.log("Contains numbers:", /\d/.test(text));
      // console.log("Contains currency symbols:", /[$฿€£]/.test(text));
      // console.log("Contains Thai characters:", /[\u0E00-\u0E7F]/.test(text));
      // console.log("Confidence indicators:", {
      //   hasTotal: /total/i.test(text),
      //   hasPrices: /\d+\.\d{2}/.test(text),
      //   hasDate: /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text),
      //   hasVendor: text
      //     .split(/\r?\n/)
      //     .slice(0, 5)
      //     .some(
      //       (line) =>
      //         line.trim().length > 3 &&
      //         line.trim().length < 40 &&
      //         /[A-Za-z]/.test(line)
      //     ),
      // });

      // console.log("\n=== RAW OCR TEXT ===");
      // console.log(text);
      // console.log("=== END RAW OCR ===");

      // Line-by-line analysis for debugging
      // console.log("\n=== LINE ANALYSIS ===");
      // text.split(/\r?\n/).forEach((line, index) => {
      //   if (line.trim()) {
      //     console.log(
      //       `Line ${index + 1}: "${line.trim()}" (${line.trim().length} chars)`
      //     );
      //   }
      // });
      // console.log("=== END LINE ANALYSIS ===\n");

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
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        className="px-3 py-2 border rounded-md bg-background hover:bg-accent transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            {status} {progress > 0 && `${progress}%`}
          </span>
        ) : (
          <span className="flex items-center gap-2">📷 Add Receipt</span>
        )}
      </button>
    </div>
  );
}
