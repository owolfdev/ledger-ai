"use client";

import { useState } from "react";

const positions = [
  "static",
  "relative",
  "absolute",
  "fixed",
  "sticky",
] as const;
type PositionType = (typeof positions)[number];

export default function PositionVisualizer() {
  const [position, setPosition] = useState<PositionType>("static");
  const [offsets, setOffsets] = useState({ top: 0, left: 0 });
  const [code, setCode] = useState("");

  function updateCode(newPosition: PositionType, newOffsets = offsets) {
    const offsetLines =
      newPosition === "static"
        ? ""
        : `  top: ${newOffsets.top}px;\n  left: ${newOffsets.left}px;\n`;
    const code = `position: ${newPosition};\n${offsetLines}`;
    setCode(code.trim());
  }

  function handlePositionChange(pos: PositionType) {
    setPosition(pos);
    updateCode(pos);
  }

  function handleOffsetChange(key: "top" | "left", value: number) {
    const newOffsets = { ...offsets, [key]: value };
    setOffsets(newOffsets);
    updateCode(position, newOffsets);
  }

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-900 text-black dark:text-white rounded shadow">
      {/* Position Buttons */}
      <div className="flex space-x-2">
        {positions.map((pos) => (
          <button
            key={pos}
            onClick={() => handlePositionChange(pos)}
            className={`px-3 py-1 border rounded transition ${
              position === pos
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Offset Inputs */}
      {position !== "static" && (
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">Top</label>
            <input
              type="number"
              value={offsets.top}
              onChange={(e) =>
                handleOffsetChange("top", parseInt(e.target.value))
              }
              className="border p-1 w-24 rounded bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Left</label>
            <input
              type="number"
              value={offsets.left}
              onChange={(e) =>
                handleOffsetChange("left", parseInt(e.target.value))
              }
              className="border p-1 w-24 rounded bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      )}

      {/* Visual Box Preview */}
      <div className="relative h-96 overflow-y-scroll border bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded">
        {/* Scroll content for sticky demo */}
        <div className=" relative bg-gradient-to-b from-gray-50 to-gray-300 dark:from-gray-800 dark:to-gray-700">
          {/* Positioned parent container */}
          <div className="relative h-96 border-2 border-dashed border-yellow-400 m-4">
            <div className="absolute top-1 right-1 text-xs bg-yellow-300 text-black px-1 rounded">
              Positioned Parent (relative)
            </div>

            {/* Main box */}
            <div
              className="w-24 h-24 bg-blue-600 text-white flex items-center justify-center shadow-lg"
              style={{
                position,
                top: position !== "static" ? offsets.top : undefined,
                left: position !== "static" ? offsets.left : undefined,
                zIndex: position === "fixed" ? 50 : "auto",
              }}
            >
              Box
            </div>

            {/* Comparison box */}
            <div className="w-24 h-24 bg-red-400 text-white flex items-center justify-center mt-2">
              Sibling
            </div>
          </div>

          {/* Spacer to scroll and test fixed/sticky */}
          <div className="h-[400px]"></div>
        </div>
      </div>

      {/* Generated Code Display */}
      <div>
        <label className="block text-sm font-medium mb-1">Generated CSS:</label>
        <textarea
          className="w-full border rounded p-2 font-mono text-sm bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-gray-600"
          rows={4}
          value={code}
          onChange={(e) => {
            const newCode = e.target.value;
            setCode(newCode);

            // Simple CSS parsing logic (not exhaustive)
            const newPositionMatch = newCode.match(/position:\s*(\w+);?/);
            const topMatch = newCode.match(/top:\s*(-?\d+)px;?/);
            const leftMatch = newCode.match(/left:\s*(-?\d+)px;?/);
            const zMatch = newCode.match(/z-index:\s*(\d+);?/);

            const newPosition = (newPositionMatch?.[1] ??
              "static") as PositionType;
            const newTop = topMatch ? parseInt(topMatch[1]) : 0;
            const newLeft = leftMatch ? parseInt(leftMatch[1]) : 0;

            setPosition(newPosition);
            setOffsets({ top: newTop, left: newLeft });
            // Optional: handle z-index separately if needed
          }}
        />
      </div>
    </div>
  );
}
