// /lib/ledger/vendor-config.ts
// Tiny loader that converts human-editable JSON -> arrays used by parsers.
// Keep parsing logic where it is; just import the prepared constants from here.

import raw from "@/config/vendors.json" assert { type: "json" };

export type VendorConfigFile = {
  knownNames: string[]; // uppercase preferred
  slogans: { pattern: string; vendor: string }[];
};

function escapeRegex(s: string): string {
  // Why: treat patterns as literals (no regex syntax) so non-devs can edit safely
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function loadVendorHints() {
  const cfg = raw as VendorConfigFile;
  const KNOWN_VENDOR_WORDS: string[] = (cfg.knownNames || []).map((s) =>
    s.trim().toUpperCase()
  );
  const SLOGAN_VENDOR_MAP: Array<[RegExp, string]> = (cfg.slogans || []).map(
    ({ pattern, vendor }) => [
      new RegExp(`\\b${escapeRegex(pattern)}\\b`, "i"),
      vendor,
    ]
  );
  return { KNOWN_VENDOR_WORDS, SLOGAN_VENDOR_MAP } as const;
}

// Optional: hot-reload friendly accessors
export const VENDOR_HINTS = loadVendorHints();
export const KNOWN_VENDOR_WORDS = VENDOR_HINTS.KNOWN_VENDOR_WORDS;
export const SLOGAN_VENDOR_MAP = VENDOR_HINTS.SLOGAN_VENDOR_MAP;
