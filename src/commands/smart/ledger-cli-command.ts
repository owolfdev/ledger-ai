// ================================================
// FILE: src/commands/smart/ledger-cli-command.ts
// PURPOSE: Execute actual Ledger CLI commands against synced .ledger file
// SECURITY: Enhanced with command whitelisting and argument validation
// ================================================

import type { User } from "@/types/user";
import type { CommandMeta } from "./utils";

interface LedgerCommandArgs {
  command: string;
  args: string[];
  rawInput: string;
}

// Whitelist of safe Ledger CLI commands
const SAFE_LEDGER_COMMANDS = [
  // Balance commands
  "balance",
  "bal",
  "equity",
  "cleared",

  // Register/transaction commands
  "register",
  "reg",
  "print",
  "xact",

  // Account and metadata commands
  "accounts",
  "payees",
  "stats",
  "files",

  // Report commands
  "report",
  "budget",
  "activity",

  // Safe query commands
  "query",
  "calc",
] as const;

type SafeLedgerCommand = (typeof SAFE_LEDGER_COMMANDS)[number];

// Validate command arguments for safety
function validateArgs(args: string[]): boolean {
  const dangerousPatterns = [
    /[;&|`$]/g, // Shell command separators
    /\.\.\//g, // Directory traversal
    /--file\s+[^-\s]/g, // File path manipulation
    /--output\s+[^-\s]/g, // Output file manipulation
    /--sort\s+[^-\s]/g, // Sort field injection
  ];

  const argsString = args.join(" ");

  for (const pattern of dangerousPatterns) {
    if (pattern.test(argsString)) {
      return false;
    }
  }

  return true;
}

// Sanitize command arguments
function sanitizeArgs(args: string[]): string[] {
  return args.map((arg) => {
    // Remove any potentially dangerous characters
    return arg.replace(/[;&|`$]/g, "");
  });
}

function parseArgs(raw?: string): LedgerCommandArgs | null {
  if (!raw || !raw.trim()) {
    throw new Error(
      "Ledger command is required. Usage: ledger <command> [args...]"
    );
  }

  const parts = raw.trim().split(/\s+/).filter(Boolean);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Validate command is in whitelist
  if (!SAFE_LEDGER_COMMANDS.includes(command as SafeLedgerCommand)) {
    throw new Error(
      `Command '${command}' not allowed. Safe commands: ${SAFE_LEDGER_COMMANDS.join(
        ", "
      )}`
    );
  }

  // Validate and sanitize arguments
  if (!validateArgs(args)) {
    throw new Error("Command arguments contain potentially dangerous patterns");
  }

  const sanitizedArgs = sanitizeArgs(args);

  return {
    command,
    args: sanitizedArgs,
    rawInput: raw.trim(),
  };
}

async function executeLedgerCommand(
  command: string,
  args: string[]
): Promise<{ output: string; command: string; filePath: string }> {
  // Additional server-side validation
  const response = await fetch("/api/ledger-cli", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      command,
      args,
      timestamp: Date.now(), // Add timestamp for additional security
      userAgent: navigator.userAgent, // Add user agent for logging
    }),
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
    // Log command execution for security monitoring
    console.log(
      `[SECURITY] Ledger CLI executed by user ${user.id}: ${args.rawInput}`
    );

    // Execute via API route
    const result = await executeLedgerCommand(args.command, args.args);

    // Format with HTML pre block to preserve raw formatting without syntax highlighting
    return `✅ **Ledger CLI:** \`${args.rawInput}\`

🔒 **Security:** Command validated and sanitized

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
// USAGE EXAMPLES (All commands now validated):
// ledger balance
// ledger register coffee
// ledger bal Expenses
// ledger reg --monthly
// ledger accounts
// ledger payees
// ledger stats
// ================================================
