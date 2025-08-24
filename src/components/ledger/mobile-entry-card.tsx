import React from "react";
import Link from "next/link";

interface MobileEntryCardProps {
  entryId?: number | string;
  description?: string;
  symbol?: string;
  amount?: number | string;
}

export const MobileEntryCard: React.FC<MobileEntryCardProps> = ({
  entryId,
  description = "",
  symbol = "$",
  amount,
}) => {
  // Convert entryId string to number
  const numEntryId = entryId ? parseInt(entryId.toString()) || 0 : 0;

  // Convert amount string to number (remove any curly braces first)
  let numAmount: number = 0;
  if (amount !== undefined && amount !== null) {
    const cleanAmount = amount.toString().replace(/[{}]/g, ""); // Remove curly braces
    const parsed = parseFloat(cleanAmount);
    numAmount = isNaN(parsed) ? 0 : parsed;
  }

  return (
    <Link
      href={`/ledger/entry/${numEntryId}`}
      className="block p-0 m-0"
      style={{ textDecoration: "none" }}
    >
      <div className="block sm:hidden border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium text-base flex-1 pr-2 text-foreground">
            {description}
          </div>
          <div className="text-lg font-mono font-semibold text-accent">
            {symbol}
            {numAmount.toFixed(2)}
          </div>
        </div>
      </div>
    </Link>
  );
};
