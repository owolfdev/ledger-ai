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
import rehypeHighlight from "rehype-highlight";
import { EditableReceiptError } from "@/components/alerts/editable-receipt-error";

export default function TerminalOutputRenderer({
  content,
  format = "plain",
  className = "",
  component,
  props,
}: TerminalOutputRendererProps) {
  // Handle component-based rendering
  if (format === "component" && component) {
    switch (component) {
      case "editable-receipt-error":
        const componentProps = props || {};

        // Type-safe prop extraction with proper fallbacks
        const errors = Array.isArray(componentProps.errors)
          ? componentProps.errors
          : [];
        const rawData =
          typeof componentProps.rawData === "string"
            ? componentProps.rawData
            : "";
        const onRetry =
          typeof componentProps.onRetry === "function"
            ? (componentProps.onRetry as (
                correctedData: string
              ) => Promise<void>)
            : async () => {
                /* no-op fallback */
              };

        return (
          <div className={`terminal-component ${className}`}>
            <EditableReceiptError
              errors={errors}
              rawData={rawData}
              onRetry={onRetry}
            />
          </div>
        );
      default:
        return (
          <div className={`terminal-error ${className}`}>
            Unknown component: {component}
          </div>
        );
    }
  }

  if (format === "plain") {
    return <span className={className}>{content}</span>;
  }

  if (format === "markdown" || format === "mdx") {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeHighlight)
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
