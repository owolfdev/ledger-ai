// src/lib/ledger/is-local-write-enabled.ts
export function isLocalLedgerWriteEnabled(): boolean {
  console.log(
    "[ENV] NODE_ENV:",
    process.env.NODE_ENV,
    "LOCAL_LEDGER_WRITE:",
    process.env.LOCAL_LEDGER_WRITE
  );
  const enabled =
    process.env.NODE_ENV === "development" &&
    process.env.LOCAL_LEDGER_WRITE === "true";
  if (!enabled) {
    console.log(
      "[isLocalLedgerWriteEnabled] Disabled: NODE_ENV=%s, LOCAL_LEDGER_WRITE=%s",
      process.env.NODE_ENV,
      process.env.LOCAL_LEDGER_WRITE
    );
  }
  return enabled;
}
