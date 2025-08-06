"use client";
import type React from "react";
import { useRef, useState } from "react";

interface CodeProps {
  className?: string;
  children: React.ReactNode;
}

const Code = ({ className = "", children }: CodeProps) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const matches = className.match(/language-(.*)/);
  const language = matches?.[1] || "";

  const handleCopy = () => {
    if (codeRef.current) {
      const codeText = codeRef.current.innerText;
      navigator.clipboard.writeText(codeText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // If children is a single string, render it as HTML for syntax highlighting
  const codeContent =
    typeof children === "string"
      ? { __html: children }
      : Array.isArray(children) && typeof children[0] === "string"
      ? { __html: children[0] }
      : undefined;

  return (
    <div
      className="rounded-lg w-full max-w-full overflow-hidden border my-8"
      style={{
        borderColor: "var(--code-border)",
        background: "var(--code-bg)",
      }}
    >
      <div
        className="flex justify-between items-center py-2 px-4 rounded-t-lg"
        style={{
          background: "var(--code-header-bg)",
          borderBottom: `1px solid var(--code-border)`,
        }}
      >
        <span
          className="uppercase text-xs tracking-widest"
          style={{
            color: "var(--code-language)",
            letterSpacing: "0.05em",
          }}
        >
          {language}
        </span>
        <button
          type="button"
          className="text-sm font-mono px-2 py-1 rounded border transition-colors"
          style={{
            color: copied ? "var(--code-copied)" : "var(--code-copy)",
            borderColor: "transparent",
            background: "transparent",
            cursor: "pointer",
          }}
          onClick={handleCopy}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = copied
              ? "var(--code-copied)"
              : "var(--code-copy-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = copied
              ? "var(--code-copied)"
              : "var(--code-copy)")
          }
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        className="p-4 rounded-b-lg overflow-auto w-full block max-w-full"
        style={{
          background: "var(--code-bg)",
          color: "var(--code-text)",
          margin: 0,
          fontFamily:
            'Geist Mono, Fira Mono, Menlo, Monaco, "Liberation Mono", monospace',
        }}
      >
        <code
          ref={codeRef}
          className={`${className} block w-full lan`}
          style={{
            background: "none",
            color: "inherit",
            fontSize: "0.97em",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: 1.6,
          }}
        >
          {children}
        </code>
      </pre>
    </div>
  );
};

export default Code;
