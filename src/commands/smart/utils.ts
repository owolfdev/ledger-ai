// src/commands/smart/utils.ts - Enhanced version

import type { User } from "@/types/user";

export type CommandContent =
  | string
  | ((
      arg?: string,
      pageCtx?: string,
      cmds?: Record<string, CommandMeta>,
      user?: User | null
    ) => string | Promise<string>);

// Enhanced CommandMeta type with natural language support
export type CommandMeta = {
  content: CommandContent;
  description?: string;
  usage?: string;

  // NEW: Natural language processing fields
  intent?: "action" | "query" | "navigation" | "utility";
  naturalLanguage?: string[]; // Common natural language patterns
  examples?: Array<{
    input: string; // Natural language input
    output: string; // Expected command output
    description?: string; // Optional explanation
  }>;

  // NEW: Command generation hints
  priority?: number; // Priority when multiple commands match (higher = more likely)
  aliases?: string[]; // Alternative command names for matching
  categories?: string[]; // Categories for better AI context
};

// Helper function to get command set (existing function, unchanged)
export function getCommandSet(
  allowedKeys: string[],
  registry: Record<string, CommandMeta>
): Record<string, CommandMeta> {
  const result: Record<string, CommandMeta> = {};
  for (const key of allowedKeys) {
    if (registry[key]) {
      result[key] = registry[key];
    }
  }
  return result;
}

// NEW: Helper function to get natural language enabled commands
export function getNaturalLanguageCommands(
  registry: Record<string, CommandMeta>
): Record<string, CommandMeta> {
  const result: Record<string, CommandMeta> = {};

  for (const [key, meta] of Object.entries(registry)) {
    if (meta.naturalLanguage && meta.naturalLanguage.length > 0) {
      result[key] = meta;
    }
  }

  return result;
}

// NEW: Helper function to extract command syntax from usage
export function extractCommandSyntax(usage?: string): string {
  if (!usage) return "";

  // Extract first line which usually contains the basic syntax
  const firstLine = usage.split("\n")[0].trim();
  return firstLine;
}

// NEW: Helper function to get command context for AI
export function getCommandContext(
  commandKey: string,
  meta: CommandMeta
): string {
  const syntax = extractCommandSyntax(meta.usage);
  const examples =
    meta.examples?.map((ex) => `"${ex.input}" → ${ex.output}`).join(", ") || "";

  return [
    `Command: ${commandKey}`,
    `Description: ${meta.description || "No description"}`,
    `Syntax: ${syntax}`,
    `Natural Language Patterns: ${meta.naturalLanguage?.join(", ") || "None"}`,
    examples ? `Examples: ${examples}` : "",
    `Categories: ${meta.categories?.join(", ") || "General"}`,
  ]
    .filter(Boolean)
    .join("\n");
}
