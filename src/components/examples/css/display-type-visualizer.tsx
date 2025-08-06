"use client";

import React, { useState } from "react";

const displayOptions = [
  "block",
  "inline",
  "inline-block",
  "flex",
  "grid",
  "none",
] as const;

type DisplayType = (typeof displayOptions)[number];

export default function DisplayTypeVisualizer() {
  const [displayType, setDisplayType] = useState<DisplayType>("block");

  const sampleStyle =
    displayType === "none"
      ? { display: "none" }
      : {
          display: displayType,
          gap:
            displayType === "flex" || displayType === "grid"
              ? "1rem"
              : undefined,
          gridTemplateColumns:
            displayType === "grid" ? "1fr 1fr 1fr" : undefined,
        };

  return (
    <div className="p-4 space-y-4">
      <label className="block font-medium">Display Type:</label>
      <select
        className="border rounded px-2 py-1"
        value={displayType}
        onChange={(e) => setDisplayType(e.target.value as DisplayType)}
      >
        {displayOptions.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <div className="border p-4 min-h-[120px] bg-gray-50">
        <div
          style={sampleStyle as React.CSSProperties}
          className="w-full border border-dashed p-2 min-h-[80px]"
        >
          {["Box 1", "Box 2", "Box 3", "Box 4", "Box 5", "Box 6"].map(
            (label, index) => (
              <div
                key={index}
                className="bg-blue-300 text-white px-2 py-1 m-1"
                style={{
                  width:
                    displayType === "inline"
                      ? "auto"
                      : displayType === "grid"
                        ? "100%"
                        : "80px",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>

      <pre className="bg-black text-green-300 p-2 rounded text-sm whitespace-pre-wrap">
        {`display: ${displayType};
${displayType === "flex" || displayType === "grid" ? "gap: 1rem;\n" : ""}${
          displayType === "grid" ? "grid-template-columns: 1fr 1fr 1fr;" : ""
        }`}
      </pre>
    </div>
  );
}
