//src/lib/ledger-date.ts
import { LEDGER_TIMEZONE } from "./ledger-config";

/**
 * Returns YYYY/MM/DD string in the configured timezone.
 * Uses Intl.DateTimeFormat for reliable tz formatting.
 */
export function getLedgerDate(offsetDays = 0): string {
  const now = new Date();
  if (offsetDays) now.setDate(now.getDate() + offsetDays);
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: LEDGER_TIMEZONE,
  };
  const formatted = new Intl.DateTimeFormat("en-CA", opts).format(now);
  return formatted.replace(/-/g, "/");
}
