// src/app/actions/ledger/sync-ledger-file.ts
"use server";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@/utils/supabase/server";
import { isLocalLedgerWriteEnabled } from "@/lib/ledger/is-local-write-enabled";

const LEDGER_FILE_PATH = path.resolve(
  process.cwd(),
  "src/data/ledger/general.ledger"
);

export async function syncLedgerFile() {
  if (!isLocalLedgerWriteEnabled()) {
    // console.log("[syncLedgerFile] Skipped: not in dev or not allowed.");
    return { success: false, reason: "Not allowed in current environment" };
  }

  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("ledger_entries")
    .select(
      `
    *,
    ledger_postings(*)
  `
    )
    .order("entry_date", { ascending: true });

  if (error) throw error;

  function currencySymbol(currency?: string) {
    if (!currency || currency === "") return "฿"; // fallback for legacy
    if (currency === "THB") return "฿";
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    return currency; // fallback to whatever is stored
  }

  const content = entries
    .map((entry) => {
      const lines = [
        `${entry.entry_date.replace(/-/g, "/")} ${entry.description}`,
      ];

      // Add each posting as a separate line
      entry.ledger_postings
        .sort(
          (a: { sort_order: number }, b: { sort_order: number }) =>
            a.sort_order - b.sort_order
        )
        .forEach(
          (posting: {
            currency: string | undefined;
            amount: string;
            account: string;
          }) => {
            const symbol = currencySymbol(posting.currency);
            const amount = parseFloat(posting.amount).toFixed(2);
            lines.push(`    ${posting.account}    ${symbol}${amount}`);
          }
        );

      return lines.join("\n");
    })
    .join("\n\n");

  await fs.writeFile(LEDGER_FILE_PATH, content, "utf-8");
      // console.log("[syncLedgerFile] Wrote ledger to", LEDGER_FILE_PATH);

  return { success: true };
}
