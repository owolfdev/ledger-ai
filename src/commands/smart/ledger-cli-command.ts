// ================================================
// FILE: src/commands/smart/ledger-cli-command.ts
// PURPOSE: Execute actual Ledger CLI commands against synced .ledger file
// ================================================

import type { User } from "@/types/user";
import type { CommandMeta } from "./utils";

interface LedgerCommandArgs {
  command: string;
  args: string[];
  rawInput: string;
}

function parseArgs(raw?: string): LedgerCommandArgs | null {
  if (!raw || !raw.trim()) {
    throw new Error(
      "Ledger command is required. Usage: ledger <command> [args...]"
    );
  }

  const parts = raw.trim().split(/\s+/).filter(Boolean);
  const command = parts[0];
  const args = parts.slice(1);

  return {
    command,
    args,
    rawInput: raw.trim(),
  };
}

async function executeLedgerCommand(
  command: string,
  args: string[]
): Promise<{ output: string; command: string; filePath: string }> {
  const response = await fetch("/api/ledger-cli", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command, args }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to execute Ledger command");
  }

  return data;
}

export async function ledgerCliCommand(
  arg?: string,
  _pageCtx?: string,
  _set?: Record<string, CommandMeta>,
  user?: User | null
): Promise<string> {
  // Check if user is logged in
  if (!user?.id) {
    return `<custom-alert message="You must be logged in to run Ledger CLI commands" />`;
  }

  let args: LedgerCommandArgs;
  try {
    const parsed = parseArgs(arg);
    if (!parsed) {
      return `<custom-alert message="Failed to parse Ledger command arguments" />`;
    }
    args = parsed;
  } catch (error) {
    return `<custom-alert message="${
      error instanceof Error ? error.message : error
    }" />`;
  }

  try {
    console.log(`Executing Ledger CLI: ${args.command} ${args.args.join(" ")}`);

    // Execute via API route
    const result = await executeLedgerCommand(args.command, args.args);

    // Format with HTML pre block to preserve raw formatting without syntax highlighting
    return `✅ **Ledger CLI:** \`${args.rawInput}\`



<pre class="font-mono text-sm whitespace-pre overflow-x-auto mb-6">${result.output}</pre>

*File: \`${result.filePath}\`*`;
  } catch (error) {
    console.error("Ledger CLI command error:", error);
    return `<custom-alert message="Failed to execute Ledger command: ${
      error instanceof Error ? error.message.replace(/"/g, "&quot;") : error
    }" />`;
  }
}
// ================================================
// USAGE EXAMPLES:
// ledger balance
// ledger register coffee
// ledger bal Expenses
// ledger reg --monthly
// ledger accounts
// ledger payees
// ledger stats
// ================================================
