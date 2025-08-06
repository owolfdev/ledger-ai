// src/components/terminal/terminal-with-routing.tsx
"use client";

import { useRouter } from "next/navigation";
import Terminal from "./terminal";
import type { TerminalProps } from "./terminal";
import { createHandleCommand } from "@/commands/_archive/handle-command";
import type { CommandMeta } from "@/commands/utils";
// import { blogCommands as rawBlogCommands } from "@/commands/blog-commands";

function safeLikeCommands(
  commands: Record<string, CommandMeta>
): Record<string, CommandMeta> {
  const wrap = (fn: CommandMeta["content"]): CommandMeta["content"] => {
    return async (arg?: string, context?: { currentSlug?: string }) => {
      if (typeof window === "undefined")
        return "<my-alert message='Client-only command not available in SSR.' />";
      const finalArg = arg?.trim() || context?.currentSlug;
      return typeof fn === "function" ? await fn(finalArg) : fn;
    };
  };
  const output: Record<string, CommandMeta> = {};
  for (const [key, meta] of Object.entries(commands)) {
    output[key] = {
      ...meta,
      content:
        typeof meta.content === "function" ? wrap(meta.content) : meta.content,
    };
  }
  return output;
}

function wrapCommandWithHistory(
  handler: TerminalProps["onCommand"]
): TerminalProps["onCommand"] {
  return async (cmd, setHistory, history) => {
    // Only record output (not command input)
    const result = await handler?.(cmd, setHistory, history);
    if (typeof result === "string") {
      setHistory((prev) => [
        ...prev,
        { type: "output", content: result, format: "markdown" },
      ]);
    }
    return result;
  };
}

type PageEntry = { title: string; slug: string; route: string };

type TerminalWithRoutingProps = Omit<TerminalProps, "onCommand"> & {
  commands?: Record<string, CommandMeta>;
  routes?: Record<string, string>;
  pageContext?: string;
  pagesList?: PageEntry[];
  currentSlug?: string;
};

function cleanMdxForAi(input: string): string {
  return input
    .replace(/import .*? from .*?;?/g, "")
    .replace(/export const metadata = [\s\S]*?};?/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

export default function TerminalWithRouting({
  commands = {},
  routes = {},
  pageContext,
  pagesList = [],
  currentSlug,
  ...rest
}: TerminalWithRoutingProps) {
  const router = useRouter();

  const cleanedContext = pageContext ? cleanMdxForAi(pageContext) : undefined;

  const fullCommands = {
    ...commands,
    // ...safeLikeCommands(rawBlogCommands),
  };

  const rawHandleCommand = createHandleCommand(
    fullCommands,
    routes,
    cleanedContext,
    pagesList,
    currentSlug
  );

  return (
    <Terminal
      {...rest}
      commands={fullCommands}
      onCommand={wrapCommandWithHistory((cmd, setHistory, history) =>
        rawHandleCommand(cmd, setHistory, router, currentSlug, history)
      )}
    />
  );
}
