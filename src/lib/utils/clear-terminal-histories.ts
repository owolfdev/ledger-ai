// lib/utils/clear-terminal-histories.ts
export function clearAllTerminalHistories(): void {
  if (typeof window !== "undefined") {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("ledger_ai_terminal_key_"))
      .forEach((k) => localStorage.removeItem(k));
  }
}
