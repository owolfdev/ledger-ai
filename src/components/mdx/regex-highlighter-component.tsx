"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

// Helper to extract regex pattern and flags from input string
function parseRegexInput(input: string): { pattern: string; flags: string } {
  const match = input.match(/^\/(.*?)\/([gimsuy]*)$/);
  const pattern = match ? match[1] : input;
  let flags = match ? match[2] : "";
  if (!flags.includes("g")) flags += "g";
  return { pattern, flags };
}

export default function RegexHighlighter() {
  const [regexInput, setRegexInput] = useState("");
  const [testString, setTestString] = useState("");
  const [error, setError] = useState("");
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function highlightMatches() {
    const { pattern, flags } = parseRegexInput(regexInput);
    try {
      const regex = new RegExp(pattern, flags);
      const highlighted = testString.replace(regex, (m) => `<mark>${m}</mark>`);
      if (backdropRef.current) {
        backdropRef.current.innerHTML = highlighted.replace(/\n$/g, "\n\n");
      }
      setError("");
    } catch {
      setError("Invalid regex");
      if (backdropRef.current) backdropRef.current.innerHTML = testString;
    }
  }

  function syncScroll() {
    if (!backdropRef.current || !textareaRef.current) return;
    backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
  }

  useEffect(() => {
    highlightMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regexInput, testString]);

  return (
    <div className="w-[340px] sm:w-[800px] h-[320px] mx-auto p-4 border my-8 border-gray-300 rounded-md">
      <h1 className="text-2xl font-bold pb-4">Regex Tester</h1>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="enter regex here e.g., /\\b(apple|banana)\\b/"
          value={regexInput}
          onChange={(e) => setRegexInput(e.target.value)}
        />
      </div>
      <div className="relative mb-4">
        <div
          ref={backdropRef}
          className="absolute top-0 left-0 w-full h-full whitespace-pre-wrap break-words overflow-hidden z-10 pointer-events-none rounded-md bg-gray-100 text-transparent p-2"
        />
        <textarea
          ref={textareaRef}
          placeholder="Enter the string to test here..."
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          onScroll={syncScroll}
          className="relative w-full h-[180px] whitespace-pre-wrap break-words bg-transparent z-20 font-mono text-black caret-auto p-2 rounded-md focus:outline-none"
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <style jsx>{`
        mark {
          background-color: orange;
        }
      `}</style>
    </div>
  );
}
