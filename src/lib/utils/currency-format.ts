/**
 * Utility functions for currency formatting
 */

/**
 * Formats a number with comma separators at thousands and millions places
 * @param amount - The amount to format
 * @returns Formatted string with comma separators
 */
export function formatCurrencyAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a currency amount with symbol and comma separators
 * @param amount - The amount to format
 * @param currency - The currency code (THB, USD, EUR, etc.)
 * @returns Formatted string with currency symbol and comma separators
 */
export function formatCurrencyWithSymbol(
  amount: number,
  currency: string
): string {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = formatCurrencyAmount(amount);

  // For THB, symbol goes after the amount; for others, before
  if (currency === "THB") {
    return `${formattedAmount}${symbol}`;
  }
  return `${symbol}${formattedAmount}`;
}

/**
 * Gets the currency symbol for a given currency code
 * @param currency - The currency code
 * @returns The currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  switch (currency?.toUpperCase()) {
    case "THB":
      return "฿";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return currency || "฿"; // fallback to THB
  }
}
