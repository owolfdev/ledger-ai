// src/components/terminal/TerminalOutputRenderer.tsx
import React from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeReact from "rehype-react";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import type { TerminalOutputRendererProps } from "@/types/terminal";
import { getMDXComponents } from "../../../mdx-components";
import rehypeHighlight from "rehype-highlight"; // 👈 already installed

export default function TerminalOutputRenderer({
  content,
  format = "plain",
  className = "",
}: TerminalOutputRendererProps) {
  if (format === "plain") {
    return <span className={className}>{content}</span>;
  }

  if (format === "markdown" || format === "mdx") {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeHighlight) // 👈 add here
      .use(rehypeReact, {
        Fragment,
        jsx,
        jsxs,
        components: getMDXComponents(),
      });

    const result = processor.processSync(content).result;

    return <div className={`terminal-markdown ${className}`}>{result}</div>;
  }

  return <span className={className}>{content}</span>;
}
