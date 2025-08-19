// ================================================
// FILE: src/commands/smart/entries/currency.ts
// SIMPLE VERSION - only what works
// ================================================
export function currencySymbol(currency?: string | null) {
  if (!currency || currency === "") return "฿";
  if (currency === "THB") return "฿";
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return currency;
}
