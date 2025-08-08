// src/lib/ledger/is-local-write-enabled.ts
export function isLocalLedgerWriteEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.LOCAL_LEDGER_WRITE === "true"
  );
}
