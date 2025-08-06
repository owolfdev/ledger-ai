// utils/commands-serialize.ts
import type { CommandMeta } from "@/commands/utils";

export function serializeCommands(commands: Record<string, CommandMeta>) {
  const safe: Record<string, { description: string }> = {};
  Object.entries(commands).forEach(([name, val]) => {
    safe[name] = { description: val.description || "" };
  });
  return safe;
}
