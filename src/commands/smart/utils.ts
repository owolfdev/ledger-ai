// src/commands/smart/utils.ts
import type { User } from "@/types/user";

export type CommandContent =
  | string
  | ((
      arg?: string,
      context?: string,
      commandSet?: Record<string, CommandMeta>,
      user?: User | null
    ) => string | Promise<string>);

export type CommandMeta = {
  content: CommandContent;
  description?: string;
  usage?: string; // 👈 Add this line
};

/**
 * Returns a subset of the registry for the provided keys.
 */
export function getCommandSet(
  keys: string[],
  registry: Record<string, CommandMeta>
): Record<string, CommandMeta> {
  const set: Record<string, CommandMeta> = {};
  for (const k of keys) {
    if (registry[k]) set[k] = registry[k];
  }
  return set;
}
