// src/app/actions/ledger/read-ledger-file.ts
"use server";
import fs from "fs/promises";
import path from "path";
import { isLocalLedgerWriteEnabled } from "@/lib/ledger/is-local-write-enabled";

const LEDGER_FILE_PATH = path.resolve(
  process.cwd(),
  "src/data/ledger/general.ledger"
);

export async function readLedgerFile() {
  if (!isLocalLedgerWriteEnabled()) {
    throw new Error(
      "Not allowed to read local ledger file in this environment."
    );
  }
  return await fs.readFile(LEDGER_FILE_PATH, "utf-8");
}
