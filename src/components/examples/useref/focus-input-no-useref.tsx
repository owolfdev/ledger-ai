"use client";
import { useState } from "react";

function InputWithoutRef() {
  const [inputValue, setInputValue] = useState("");

  const focusInput = () => {
    // Issue: No way to programmatically focus the input
    console.log("Cannot focus the input without a reference!");
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="border border-gray-300 rounded-md p-2"
      />
      <button type="button" onClick={focusInput}>
        Focus Input
      </button>
    </div>
  );
}

export default InputWithoutRef;
