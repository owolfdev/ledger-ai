// src/lib/ledger-date-parse.ts
import * as chrono from "chrono-node";
import { getLedgerDate } from "./ledger-date";

// Returns: { date: string, text: string }
export function extractLedgerDateAndText(input: string): {
  date: string;
  text: string;
} {
  // Parse date
  const parsed = chrono.parse(input);
  let dateStr = getLedgerDate();
  let cleanedText = input;

  if (parsed.length) {
    const dateObj = parsed[0].start.date();
    // Ledger expects YYYY/MM/DD
    dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, "/");

    // Remove parsed date text from input
    const { index, text: matchText } = parsed[0];
    if (typeof index === "number" && matchText) {
      cleanedText = (
        input.slice(0, index) + input.slice(index + matchText.length)
      )
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  return { date: dateStr, text: cleanedText };
}
