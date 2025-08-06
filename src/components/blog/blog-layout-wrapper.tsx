// components/blog/blog-layout-wrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { BookOpen, Book } from "lucide-react";

export default function BlogLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [readingMode, setReadingMode] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("reading-mode");
    setReadingMode(saved === null ? true : saved === "true");
  }, []);

  useEffect(() => {
    if (readingMode !== null) {
      localStorage.setItem("reading-mode", readingMode.toString());
    }
  }, [readingMode]);

  if (readingMode === null) return null;

  return (
    <div className="flex flex-col h-full w-full items-center overflow-hidden px-4">
      <div
        className={`relative flex-1 min-h-0 flex flex-col w-full overflow-auto ${
          readingMode ? "max-w-3xl" : ""
        }`}
      >
        <button
          onClick={() => setReadingMode((v) => !v)}
          className="absolute top-2 right-2 text-lg text-muted-foreground hover:text-foreground transition-colors hidden xl:block"
          title={readingMode ? "Full Width" : "Reading Mode"}
          aria-label={
            readingMode ? "Switch to Full Width" : "Switch to Reading Mode"
          }
        >
          {readingMode ? <BookOpen size={20} /> : <Book size={20} />}
        </button>

        {children}
      </div>
    </div>
  );
}
