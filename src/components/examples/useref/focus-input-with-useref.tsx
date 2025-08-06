"use client";
import { useRef } from "react";

function InputWithRef() {
  const inputRef = useRef(null); // Create a ref for the input element

  const focusInput = () => {
    // Use the ref to focus the input
    if (inputRef.current) {
      (inputRef.current as HTMLInputElement).focus();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <input
        type="text"
        ref={inputRef}
        className="border border-gray-300 rounded-md p-2"
      />
      <button type="button" onClick={focusInput}>
        Focus Input
      </button>
    </div>
  );
}

export default InputWithRef;
