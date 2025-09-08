// src/commands/smart/ledger-entry-generator.ts
"use client";

import type { User } from "@/types/user";
import type { TerminalOutputRendererProps } from "@/types/terminal";

export async function generateLedgerEntry(
  input: string,
  user: User | null,
  onPopulateInput?: (cmd: string) => void
): Promise<string | null> {
  console.log("generateLedgerEntry called with:", {
    input,
    hasUser: !!user,
    hasOnPopulateInput: !!onPopulateInput,
  });

  if (!user) {
    console.log("No user - returning null");
    return null;
  }

  try {
    console.log("Calling AI API to generate ledger entry...");
    // Call the AI to generate a ledger entry
    const response = await fetch("/api/openai-ledger-entry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        userId: user.id,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate ledger entry");
    }

    const data = await response.json();
    let ledgerEntry = data.ledgerEntry;

    // Strip markdown code blocks if present
    if (ledgerEntry && typeof ledgerEntry === "string") {
      ledgerEntry = ledgerEntry
        .replace(/^```[\s\S]*?\n/, "")
        .replace(/\n```$/, "")
        .trim();
    }

    console.log("AI API response:", { ledgerEntry });

    if (ledgerEntry && onPopulateInput) {
      console.log("Populating terminal input with:", ledgerEntry);
      console.log("onPopulateInput function:", onPopulateInput);
      // Populate the terminal input with the generated ledger entry
      // Use a timeout to ensure the input is populated after any clearing
      setTimeout(() => {
        console.log("Calling onPopulateInput with:", ledgerEntry);
        onPopulateInput(ledgerEntry);
        console.log("onPopulateInput called successfully");
      }, 200);
      return ledgerEntry;
    }

    return ledgerEntry;
  } catch (error) {
    console.error("Error generating ledger entry:", error);
    return null;
  }
}

// Helper function to detect if input should generate a ledger entry
export function shouldGenerateLedgerEntry(input: string): boolean {
  const trimmed = input.trim().toLowerCase();

  // Check if it's a natural language description of a transaction
  const transactionPatterns = [
    /^(i\s+)?(bought|purchased|spent|paid|had|got|received|earned)/i,
    /^(coffee|lunch|dinner|gas|groceries|shopping|office|supplies)/i,
    /^(at\s+starbucks|at\s+mcdonalds|at\s+restaurant)/i,
    /^(for\s+work|for\s+business|expense|cost|price|amount)/i,
    /(\d+)\s*(baht|dollars?|dollar|thb|usd|euro|euros|yen|pound|pounds)/i,
  ];

  // Check if it matches any transaction patterns
  const isTransaction = transactionPatterns.some((pattern) =>
    pattern.test(trimmed)
  );

  // Check if it's NOT a command (doesn't start with known command prefixes)
  const commandPrefixes = [
    "add",
    "list",
    "edit",
    "show",
    "delete",
    "go",
    "help",
    "clear",
    "back",
    "forward",
  ];
  const isCommand = commandPrefixes.some((prefix) =>
    trimmed.startsWith(prefix)
  );

  const result = isTransaction && !isCommand;

  console.log("shouldGenerateLedgerEntry debug:", {
    input: trimmed,
    isTransaction,
    isCommand,
    result,
  });

  return result;
}

// Helper function to detect if input is a ledger entry
export function isLedgerEntry(input: string): boolean {
  const trimmed = input.trim();

  // Check if it starts with a date pattern (YYYY/MM/DD)
  const datePattern = /^\d{4}\/\d{2}\/\d{2}/;

  // Check if it has account lines (starts with spaces)
  const hasAccountLines =
    trimmed.includes("\n") &&
    trimmed.split("\n").some((line) => line.startsWith("    "));

  return datePattern.test(trimmed) && hasAccountLines;
}

// Helper function to handle ledger entry submission
export async function handleLedgerEntry(
  ledgerEntry: string,
  setHistory: React.Dispatch<
    React.SetStateAction<TerminalOutputRendererProps[]>
  >,
  user: User | null,
  history: TerminalOutputRendererProps[]
): Promise<boolean> {
  if (!user) {
    setHistory([
      ...(history ?? []),
      { type: "input", content: ledgerEntry },
      {
        type: "output",
        content: "❌ You must be logged in to save ledger entries.",
        format: "markdown",
      },
    ]);
    return true;
  }

  try {
    // Parse the ledger entry and save it
    const response = await fetch(
      `${window.location.origin}/api/ledger/parse-and-save`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ledgerEntry,
          userId: user.id,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save ledger entry");
    }

    const data = await response.json();

    setHistory([
      ...(history ?? []),
      { type: "input", content: ledgerEntry },
      {
        type: "output",
        content: `✅ Entry saved to your ledger - [View Entry #${data.entryId}](/ledger/entry/${data.entryId})`,
        format: "markdown",
      },
    ]);

    return true;
  } catch (error) {
    console.error("Error saving ledger entry:", error);
    setHistory([
      ...(history ?? []),
      { type: "input", content: ledgerEntry },
      {
        type: "output",
        content:
          "❌ Failed to save ledger entry. Please check the format and try again.",
        format: "markdown",
      },
    ]);
    return true;
  }
}
