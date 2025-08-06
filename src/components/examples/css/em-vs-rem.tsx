"use client";
import React, { useState } from "react";

export default function EmRemDemo() {
  const [rootFontSize, setRootFontSize] = useState(8);
  const [parentFontSize, setParentFontSize] = useState(8);

  // Fake rem (local calculation)
  const emBoxWidthPx = parentFontSize * 15; // width: 8em
  const emBoxHeightPx = parentFontSize * 2; // height: 2em
  const remBoxWidthPx = rootFontSize * 15; // width: 8rem
  const remBoxHeightPx = rootFontSize * 2; // height: 2rem

  return (
    <div className="py-8">
      <h2 className="text-xl font-bold mb-4">
        em vs rem Demo (Local Calculation)
      </h2>
      <div className="mb-6 flex gap-6 items-center">
        <label>
          <span className="font-mono">html</span> (root) font-size:{" "}
          <input
            type="number"
            min={6}
            max={48}
            value={rootFontSize}
            onChange={(e) => setRootFontSize(Number(e.target.value))}
            className="border px-2 py-1 w-20"
          />{" "}
          px
        </label>
        <label>
          <span className="font-mono">.parent</span> font-size:{" "}
          <input
            type="number"
            min={6}
            max={48}
            value={parentFontSize}
            onChange={(e) => setParentFontSize(Number(e.target.value))}
            className="border px-2 py-1 w-20"
          />{" "}
          px
        </label>
      </div>

      <div
        style={{
          fontSize: `${parentFontSize}px`,
          border: "2px dashed #bbb",
          padding: 24,
          background: "#f8fafc",
          borderRadius: 10,
        }}
      >
        <div className="flex flex-wrap gap-10">
          {/* em example */}
          <div className="flex flex-col items-center">
            <div
              className="px-4 py-2"
              style={{
                width: emBoxWidthPx,
                height: emBoxHeightPx,
                fontSize: parentFontSize,
                background: "#3b82f6",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "2px solid #1d4ed8",
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: 1,
                transition: "all 0.2s",
              }}
            >
              <div className="flex items-center gap-2">
                <span>em box</span>
                <span style={{ fontSize: "0.85em", fontWeight: 400 }}>
                  8em × 2em
                </span>
              </div>
            </div>
            <div className="text-xs mb-1" style={{ color: "#3b82f6" }}>
              Scales with <b>parent</b>
            </div>
            <div className="text-xs text-gray-700">
              {emBoxWidthPx}px × {emBoxHeightPx}px, {parentFontSize}px text
            </div>
          </div>
          {/* rem example */}
          <div className="flex flex-col items-center">
            <div
              style={{
                width: remBoxWidthPx,
                height: remBoxHeightPx,
                fontSize: rootFontSize,
                background: "#fde047",
                color: "#222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "2px solid #eab308",
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: 1,
                transition: "all 0.2s",
              }}
            >
              <div className="flex items-center gap-2">
                rem box
                <br />
                <span style={{ fontSize: "0.85em", fontWeight: 400 }}>
                  8rem × 2rem
                </span>
              </div>
            </div>
            <div className="text-xs mb-1" style={{ color: "#eab308" }}>
              Scales with <b>root</b>
            </div>
            <div className="text-xs text-gray-700">
              {remBoxWidthPx}px × {remBoxHeightPx}px, {rootFontSize}px text
            </div>
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm">
        <b>Note:</b> This demo <b>simulates</b> em/rem math locally, but does
        not use real CSS <b>rem</b> units (which always depend on the root html
        font-size).
      </p>
    </div>
  );
}
