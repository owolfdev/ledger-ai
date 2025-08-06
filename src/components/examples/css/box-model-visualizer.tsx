"use client";

import React, { useState } from "react";

export default function BoxModelVisualizer() {
  const [margin, setMargin] = useState(20);
  const [border, setBorder] = useState(10);
  const [padding, setPadding] = useState(20);
  const [contentSize, setContentSize] = useState(100);
  const [boxSizing, setBoxSizing] = useState<"content-box" | "border-box">(
    "border-box"
  );

  const totalSize =
    boxSizing === "border-box"
      ? contentSize
      : contentSize + padding * 2 + border * 2;

  const backgroundImage =
    "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-5 5l10-10M0 20l20-20M15 25l10-10' stroke='%23d1d5db' stroke-opacity='0.5' stroke-width='2'/%3E%3C/svg%3E\")";

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto text-sm">
      <h2 className="text-xl font-bold">CSS Box Model Visualizer</h2>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="flex flex-col items-center">
          <span className="mb-1 font-medium text-pink-500">Content Size</span>
          <input
            type="range"
            min={100}
            max={300}
            value={contentSize}
            onChange={(e) => setContentSize(Number(e.target.value))}
          />
          <span>{contentSize}px</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="mb-1 font-medium text-yellow-500">Padding</span>
          <input
            type="range"
            min={0}
            max={50}
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
          />
          <span>{padding}px</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="mb-1 font-medium text-indigo-500">Border</span>
          <input
            type="range"
            min={0}
            max={20}
            value={border}
            onChange={(e) => setBorder(Number(e.target.value))}
          />
          <span>{border}px</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="mb-1 font-medium text-gray-500">Margin</span>
          <input
            type="range"
            min={0}
            max={100}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
          />
          <span>{margin}px</span>
        </div>

        <label className="col-span-2 flex items-center justify-center gap-2">
          <input
            type="checkbox"
            checked={boxSizing === "border-box"}
            onChange={(e) =>
              setBoxSizing(e.target.checked ? "border-box" : "content-box")
            }
          />
          <span>
            Use <code>box-sizing: border-box</code>
          </span>
        </label>
      </div>

      <div
        id="container"
        className="border-2 border-gray-300 bg-[length:20px_20px]"
        style={{ backgroundImage }}
      >
        {/* Visual Box */}
        <div
          className="flex items-center justify-center"
          style={{
            margin: `${margin}px`,
            border: `${border}px solid #6366f1`,
            padding: `${padding}px`,
            backgroundColor: "#facc15",
          }}
        >
          <div
            className="bg-pink-500 text-white font-bold flex items-center justify-center p-4 text-center"
            style={{
              width: `${contentSize}px`,
              height: `${contentSize}px`,
              boxSizing: boxSizing,
            }}
          >
            Lorem ipsum dolor sit amet.
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="rounded p-3 text-xs">
        <p>
          <strong>Total Rendered Size:</strong>{" "}
          {totalSize + padding * 2 + border * 2 + margin * 2}px
        </p>
        <p>
          <strong>box-sizing:</strong> {boxSizing}
        </p>
        <p>
          <strong>Margin:</strong> {margin}px
        </p>
        <p>
          <strong>Border:</strong> {border}px
        </p>
        <p>
          <strong>Padding:</strong> {padding}px
        </p>
        <p>
          <strong>Content Size:</strong> {contentSize}px
        </p>
      </div>
    </div>
  );
}
