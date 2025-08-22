// ================================================
// FILE: src/app/api/ledger-cli/route.ts
// PURPOSE: Server-side API route to execute Ledger CLI commands
// ================================================

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { createClient } from "@/utils/supabase/server";
import { isLocalLedgerWriteEnabled } from "@/lib/ledger/is-local-write-enabled";
import { syncLedgerFile } from "@/app/actions/ledger/sync-ledger-file";

const execAsync = promisify(exec);

interface LedgerRequest {
  command: string;
  args: string[];
}

async function executeLedgerCommand(
  command: string,
  args: string[],
  ledgerFilePath: string
): Promise<{ stdout: string; stderr: string }> {
  // Sanitize command and args to prevent injection
  const allowedCommands = [
    "balance",
    "bal",
    "register",
    "reg",
    "accounts",
    "payees",
    "stats",
    "print",
    "equity",
    "prices",
    "commodities",
  ];

  if (!allowedCommands.includes(command)) {
    throw new Error(`Command '${command}' is not allowed`);
  }

  // Construct the full ledger command with proper escaping
  const ledgerCmd = [
    "ledger",
    "-f",
    `"${ledgerFilePath}"`, // Quote the file path
    command,
    ...args.map((arg) => `"${arg}"`), // Quote each argument
  ].join(" ");

  try {
    const { stdout, stderr } = await execAsync(ledgerCmd, {
      timeout: 30000, // 30 second timeout
      cwd: process.cwd(),
      env: { ...process.env, LC_ALL: "C" }, // Ensure consistent output format
    });

    return { stdout, stderr };
  } catch (error: unknown) {
    // Handle execution errors
    if (error instanceof Error) {
      throw new Error(`Ledger command failed: ${error.message}`);
    }
    throw new Error("Ledger command failed with unknown error");
  }
}

// function formatLedgerOutput(
//   stdout: string,
//   stderr: string,
//   command: string
// ): string {
//   let output = "";

//   if (stderr && stderr.trim()) {
//     output += `⚠️ **Warning/Error:**\n\`\`\`\n${stderr.trim()}\n\`\`\`\n\n`;
//   }

//   if (stdout && stdout.trim()) {
//     // Format different command types
//     if (command === "balance" || command === "bal") {
//       output += `💰 **Balance Report:**\n\`\`\`\n${stdout.trim()}\n\`\`\``;
//     } else if (command === "register" || command === "reg") {
//       output += `📋 **Register Report:**\n\`\`\`\n${stdout.trim()}\n\`\`\``;
//     } else if (command === "accounts") {
//       output += `📁 **Accounts List:**\n\`\`\`\n${stdout.trim()}\n\`\`\``;
//     } else if (command === "payees") {
//       output += `🏪 **Payees List:**\n\`\`\`\n${stdout.trim()}\n\`\`\``;
//     } else if (command === "stats") {
//       output += `📊 **Statistics:**\n\`\`\`\n${stdout.trim()}\n\`\`\``;
//     } else {
//       output += `**Ledger Output:**\n\`\`\`\n${stdout.trim()}\n\`\`\``;
//     }
//   } else {
//     output += `_No output from ledger command._`;
//   }

//   return output;
// }

function formatLedgerOutput(
  stdout: string,
  stderr: string,
  command: string
): string {
  if (stderr && stderr.trim()) {
    return `⚠️ Warning: ${stderr.trim()}\n\n${stdout.trim()}`;
  }
  return stdout.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Check if we're in development mode (local write enabled)
    if (!isLocalLedgerWriteEnabled()) {
      return NextResponse.json(
        { error: "Ledger CLI commands are only available in development mode" },
        { status: 403 }
      );
    }

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: LedgerRequest = await request.json();
    const { command, args } = body;

    if (!command) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    // console.log(`Ledger CLI request: ${command} ${args.join(" ")}`);

    // Sync the ledger file first
    // console.log("Syncing ledger file before executing command...");
    await syncLedgerFile();

    // Path to the synced ledger file
    const ledgerFilePath = path.join(
      process.cwd(),
      "src/data/ledger/general.ledger"
    );

    // Execute the ledger command
    const { stdout, stderr } = await executeLedgerCommand(
      command,
      args,
      ledgerFilePath
    );

    // Format the output
    const formattedOutput = formatLedgerOutput(stdout, stderr, command);

    return NextResponse.json({
      success: true,
      output: formattedOutput,
      command: `${command} ${args.join(" ")}`,
      filePath: "src/data/ledger/general.ledger",
    });
  } catch (error) {
    console.error("Ledger CLI API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  }
}
