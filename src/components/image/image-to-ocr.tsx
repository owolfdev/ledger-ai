// /src/components/image/image-to-ocr.tsx
"use client";
import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import {
  segmentReceiptOcr,
  createOpenAiClient,
  type SegmentResult,
} from "@/lib/ledger/segment-ocr-with-llm";
import {
  parseReceiptOcr,
  type ReceiptData,
} from "@/lib/ledger/parse-receipt-ocr";
import {
  validateReceiptOcrMath,
  type ReceiptMathValidation,
} from "@/lib/ledger/validate-receipt-ocr";

/**
 * Full flow UI: OCR → segment (LLM or fallback) → parse → validate.
 * Keep it simple and inspectable; no persistence.
 */
export default function ReceiptOcrSegPreview() {
  const [ocrText, setOcrText] = useState("");
  const [seg, setSeg] = useState<SegmentResult | null>(null);
  const [parsed, setParsed] = useState<ReceiptData | null>(null);
  const [validation, setValidation] = useState<ReceiptMathValidation | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [lang, setLang] = useState<string>("eng");
  const [error, setError] = useState<string | null>(null);

  const [useLlm, setUseLlm] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4o-mini");
  const [threshold, setThreshold] = useState<number>(0.05);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Light image pre-processing
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

  const runSegmentationAndParse = async (text: string) => {
    try {
      const llm =
        useLlm && apiKey ? createOpenAiClient(apiKey, model) : undefined;
      const r = await segmentReceiptOcr(text, llm);
      setSeg(r);
      if (r.block && r.block.trim()) {
        const p = parseReceiptOcr(r.block);
        setParsed(p);
        setValidation(validateReceiptOcrMath(p, threshold));
      } else {
        setParsed(null);
        setValidation(null);
      }
    } catch (e: unknown) {
      setSeg({
        block: "",
        confidence: 0,
        rationale: e instanceof Error ? e.message : "segmentation error",
        usedFallback: true,
      });
      setParsed(null);
      setValidation(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setOcrText("");
    setSeg(null);
    setParsed(null);
    setValidation(null);
    setError(null);

    resizeImage(file, (blob) => {
      Tesseract.recognize(blob, lang, {
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
          setOcrText(text);
          await runSegmentationAndParse(text);
        })
        .catch((err) => {
          setError(err?.message ?? "OCR failed");
          setOcrText("OCR failed.");
          setSeg(null);
          setParsed(null);
          setValidation(null);
        })
        .finally(() => setLoading(false));
    });
  };

  const clearAll = () => {
    setOcrText("");
    setSeg(null);
    setParsed(null);
    setValidation(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rerunWithThreshold = () => {
    if (parsed) setValidation(validateReceiptOcrMath(parsed, threshold));
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">
        Receipt OCR — Segment · Parse · Validate
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block"
        />
        <select
          className="border rounded px-2 py-1"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          title="OCR language"
        >
          <option value="eng">English (eng)</option>
          <option value="eng+tha">English+Thai (eng+tha)</option>
        </select>
        <button onClick={clearAll} className="px-2 py-1 border rounded">
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-2 border rounded p-2">
        <label className="font-semibold flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-black"
            checked={useLlm}
            onChange={(e) => setUseLlm(e.target.checked)}
          />
          Use LLM segmentation (client)
        </label>
        {useLlm && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="password"
              className="border rounded px-2 py-1 flex-1"
              placeholder="OpenAI API key (sk-...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <input
              className="border rounded px-2 py-1 w-full sm:w-48"
              placeholder="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <button
              className="px-2 py-1 border rounded"
              disabled={!ocrText}
              onClick={() => runSegmentationAndParse(ocrText)}
              title="Re-run segmentation on current OCR"
            >
              Segment again
            </button>
          </div>
        )}
        {!useLlm && (
          <div className="text-xs text-gray-600">
            LLM disabled → using heuristic fallback segmentation.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <label className="font-semibold" htmlFor="thr">
          Validation threshold
        </label>
        <input
          id="thr"
          type="number"
          className="border rounded px-2 py-1 w-24"
          step="0.01"
          min="0"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value) || 0)}
          onBlur={rerunWithThreshold}
          title="Allowed absolute difference"
        />
        <span>USD</span>
      </div>

      {loading && (
        <div className="text-blue-600">
          Processing… {progress > 0 ? `${progress}%` : null}
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}

      {ocrText && (
        <div>
          <label className="font-semibold">Extracted OCR Text:</label>
          <pre className="p-2 rounded mt-1 whitespace-pre-wrap border">
            {ocrText}
          </pre>
        </div>
      )}

      {seg && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Segmentation Result</span>
            <span className="px-2 py-0.5 border rounded text-xs">
              confidence: {Math.round((seg.confidence ?? 0) * 100)}%
            </span>
            {seg.usedFallback ? (
              <span className="px-2 py-0.5 border rounded text-xs">
                fallback
              </span>
            ) : (
              <span className="px-2 py-0.5 border rounded text-xs">llm</span>
            )}
          </div>
          {seg.rationale && (
            <div className="text-xs text-gray-700">{seg.rationale}</div>
          )}
          <pre className="p-2 rounded whitespace-pre-wrap border min-h-[4rem]">
            {seg.block || "(empty)"}
          </pre>
        </div>
      )}

      {parsed && parsed.items.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Parsed Preview</h3>
          <table className="min-w-full text-xs border">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {parsed.items.map((item, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            {(parsed.subtotal ?? parsed.tax ?? parsed.total) != null && (
              <tfoot>
                {parsed.subtotal != null && (
                  <tr>
                    <td className="p-2 font-semibold text-right">Subtotal</td>
                    <td className="p-2 text-right">
                      {parsed.subtotal.toFixed(2)}
                    </td>
                  </tr>
                )}
                {parsed.tax != null && (
                  <tr>
                    <td className="p-2 font-semibold text-right">Tax</td>
                    <td className="p-2 text-right">{parsed.tax.toFixed(2)}</td>
                  </tr>
                )}
                {parsed.total != null && (
                  <tr>
                    <td className="p-2 font-semibold text-right">Total</td>
                    <td className="p-2 text-right">
                      {parsed.total.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tfoot>
            )}
          </table>

          <details className="text-xs">
            <summary className="cursor-pointer select-none">
              Raw parsed JSON
            </summary>
            <pre className="p-2 rounded whitespace-pre-wrap border">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </details>

          {validation && (
            <div className="mt-2">
              <label className="font-semibold">Receipt Math Check:</label>
              {!validation.isValid ? (
                <div className="text-red-600">
                  <ul className="list-disc pl-5">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                  <pre className="text-xs text-gray-700 mt-2 bg-red-50 rounded p-2 border">
                    {JSON.stringify(validation.summary, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-green-600">
                  ✅ Receipt math checks out!
                  <pre className="text-xs text-gray-700 mt-2 bg-green-50 rounded p-2 border">
                    {JSON.stringify(validation.summary, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
