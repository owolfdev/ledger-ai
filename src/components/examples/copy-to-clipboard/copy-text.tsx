"use client";

import React from "react";

const CopyTextComponent = () => {
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        alert("Text copied to clipboard!");
      },
      (err) => {
        alert(`Failed to copy text. ${err}`);
      }
    );
  };

  const text = "Hello, world!";

  return (
    <div className="pb-6">
      <div className="px-6 py-6 bg-gray-900 flex flex-col gap-2 rounded">
        <p>Click the button to copy the text below:</p>
        <div className="text-xl">{text}</div>
        <div>
          <button
            className="border rounded px-2 py-1 bg-gray-800"
            type="button"
            onClick={() => handleCopyText(text)}
          >
            Copy Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyTextComponent;
