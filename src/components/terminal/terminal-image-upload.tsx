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
      // console.log("Starting OCR with optimized Tesseract settings...");

      const ocrConfigs = [
        {
          name: "Receipt-optimized",
          lang: "eng",
          options: {
            tessedit_pageseg_mode: 6, // Uniform block of text
            tessedit_ocr_engine_mode: 1, // Neural nets LSTM engine
            tessedit_char_whitelist:
              "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz฿$€£.,/-:()% ",
            preserve_interword_spaces: 1,
            tessedit_do_invert: 0, // Don't invert colors
            textord_heavy_nr: 1, // Better noise removal
            textord_min_linesize: 2.5, // Better line detection
            textord_old_baselines: 0, // Use modern baseline detection
            textord_force_make_prop_words: 0, // Don't force proportional words
            textord_min_xheight: 10, // Minimum x-height for text
            textord_old_xheight: 0, // Use modern x-height detection
          },
        },
        {
          name: "Thai+English hybrid",
          lang: "tha+eng",
          options: {
            tessedit_pageseg_mode: 4, // Single column of text
            tessedit_ocr_engine_mode: 1, // Neural nets LSTM engine
            preserve_interword_spaces: 1,
            tessedit_do_invert: 0, // Don't invert colors
            textord_heavy_nr: 1, // Better noise removal
            textord_min_linesize: 2.5, // Better line detection
            textord_old_baselines: 0, // Use modern baseline detection
            textord_force_make_prop_words: 0, // Don't force proportional words
            textord_min_xheight: 10, // Minimum x-height for text
            textord_old_xheight: 0, // Use modern x-height detection
          },
        },
        {
          name: "Auto-detect fallback",
          lang: "eng",
          options: {
            tessedit_pageseg_mode: 3, // Fully automatic page segmentation
            tessedit_ocr_engine_mode: 2, // Legacy + LSTM engines
            tessedit_do_invert: 0, // Don't invert colors
            textord_heavy_nr: 1, // Better noise removal
            textord_min_linesize: 2.5, // Better line detection
            textord_old_baselines: 0, // Use modern baseline detection
            textord_force_make_prop_words: 0, // Don't force proportional words
            textord_min_xheight: 10, // Minimum x-height for text
            textord_old_xheight: 0, // Use modern x-height detection
          },
        },
      ];

      // PARALLEL OCR EXECUTION: Run all configs simultaneously for speed
      setStatus("Running OCR in parallel...");

      const ocrPromises = ocrConfigs.map(async (config) => {
        try {
          // console.log(`Starting OCR config: ${config.name}`);

          const result = await Tesseract.recognize(imageBlob, config.lang, {
            logger: (info) => {
              if (
                info.status === "recognizing text" &&
                typeof info.progress === "number"
              ) {
                // Distribute progress across all configs for better UX
                const adjustedProgress = Math.round(
                  (info.progress * 70) / ocrConfigs.length
                );
                setProgress((prev) => Math.min(prev + adjustedProgress, 70));
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

          return {
            text,
            confidence: qualityScore,
            configName: config.name,
            success: true,
          };
        } catch (error) {
          // console.log(`${config.name} failed:`, error);
          return {
            text: "",
            confidence: 0,
            configName: config.name,
            success: false,
            error,
          };
        }
      });

      // Wait for all OCR attempts to complete (much faster than sequential)
      const ocrResults = await Promise.allSettled(ocrPromises);

      // Find the best result from all successful OCR attempts
      let bestResult = { text: "", confidence: 0, configName: "" };

      ocrResults.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
          const ocrResult = result.value;
          if (ocrResult.confidence > bestResult.confidence) {
            bestResult = {
              text: ocrResult.text,
              confidence: ocrResult.confidence,
              configName: ocrResult.configName,
            };
          }
        }
      });

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
        // console.log("Using AI parser...");
        const aiParser = createOpenAiReceiptParser(openaiApiKey);
        command = await aiParser.parseReceiptText(text);
      } else {
        // console.log("No OpenAI API key - using fallback parser");
        const fallbackParser = createFallbackParser();
        command = await fallbackParser.parseReceiptText(text);
      }

      // 5. Add image URL to command if not already present
      if (!command.includes("--image") && imageUrl) {
        command += `\n--image "${imageUrl}"`; // Add newline before --image
      }

      setProgress(100);
      setStatus("Complete!");

      // console.log("Generated command:", command);

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
