// src/components/terminal/terminal-image-upload-vision.tsx
// VISION-FIRST APPROACH: Direct OpenAI Vision analysis (bypasses OCR)

"use client";
import React, { useState, useRef } from "react";

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

// Helper function removed - no cleanup needed

interface TerminalImageUploadProps {
  onPopulateInput: (command: string) => void;
}

export default function TerminalImageUpload({
  onPopulateInput,
}: TerminalImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // No cleanup needed - images are managed by the entry creation process

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loading) return;

    setLoading(true);
    setProgress(0);
    setStatus("Starting...");

    try {
      // 1. Upload and preprocess image
      setStatus("Uploading and preprocessing image...");
      setProgress(20);

      const { url: imageUrl } = await preprocessAndUpload(file);
      setUploadedImageUrl(imageUrl);

      // 2. Use OpenAI Vision for direct image analysis
      setStatus("Analyzing receipt with AI Vision...");
      setProgress(50);

      // Send image directly to OpenAI Vision API
      const formData = new FormData();
      formData.append("image", file);

      const visionResponse = await fetch("/api/receipt-vision-analyze", {
        method: "POST",
        body: formData,
      });

      if (!visionResponse.ok) {
        const errorData = await visionResponse.json();
        throw new Error(
          `Vision analysis failed: ${errorData.error || "Unknown error"}`
        );
      }

      const visionResult = await visionResponse.json();

      if (!visionResult.success) {
        throw new Error(
          `Vision analysis failed: ${
            visionResult.error || "No command generated"
          }`
        );
      }

      let command = visionResult.command;

      // 3. Add image URL to command if not already present
      if (!command.includes("--image") && imageUrl) {
        command += `\n--image "${imageUrl}"`;
      }

      setProgress(100);
      setStatus("Complete!");

      // 4. Send command to terminal
      onPopulateInput(command);

      // 5. Clear the uploaded image tracking since it's now part of the command
      setUploadedImageUrl(null);
    } catch (error: unknown) {
      console.error("Image processing failed:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setProgress(0);
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {uploadedImageUrl && !loading && (
        <div className="text-sm text-green-600">
          ✅ Image uploaded successfully
        </div>
      )}
    </div>
  );
}
