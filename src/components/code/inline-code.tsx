"use client";
import type React from "react";

interface InlineCodeProps {
  children: React.ReactNode;
}

const InlineCode: React.FC<InlineCodeProps> = ({ children }) => {
  return (
    <code
      className="
        font-mono text-[0.97em] px-1.5 py-0.5 rounded
        bg-[var(--inline-code-bg)] text-[var(--inline-code-text)]
        transition-colors
      "
      style={{
        maxWidth: "100%",
        overflowX: "auto",
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {children}
    </code>
  );
};

export default InlineCode;
