// src/components/terminal/ledger-entry-components.tsx
"use client";
import React from "react";
import Link from "next/link";

interface EntryCardProps {
  id: number | string;
  date: string;
  description: string;
  amount: number | string;
  currency: string;
  business?: string;
  isCleared: boolean | string;
}

type EntryListItemProps = EntryCardProps;

function currencySymbol(currency: string): string {
  if (currency === "THB") return "฿";
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return currency;
}

// Mobile Card Component
export function EntryCard({
  id,
  date,
  description,
  amount,
  currency,
  business,
  isCleared,
}: EntryCardProps) {
  const symbol = currencySymbol(currency);

  // Convert props to proper types (MDX passes everything as strings)
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  const booleanCleared =
    typeof isCleared === "string" ? isCleared === "true" : isCleared;
  const numericId = typeof id === "string" ? parseInt(id) : id;

  return (
    <div className="block sm:hidden bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-base flex-1 pr-2">{description}</div>
        <div className="text-lg">{booleanCleared ? "✅" : "⏳"}</div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {date}
        </div>
        <div className="text-lg font-mono font-semibold">
          {symbol}
          {numericAmount.toFixed(2)}
        </div>
      </div>

      {business && business !== "" && (
        <div className="mb-3">
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
            {business}
          </span>
        </div>
      )}

      <div>
        <Link
          href={`/ledger/entry/${numericId}`}
          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
        >
          View Entry #{numericId} →
        </Link>
      </div>
    </div>
  );
}

// Desktop List Item Component
export function EntryListItem({
  id,
  date,
  description,
  amount,
  currency,
  business,
  isCleared,
}: EntryListItemProps) {
  const symbol = currencySymbol(currency);

  // Convert props to proper types (MDX passes everything as strings)
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  const booleanCleared =
    typeof isCleared === "string" ? isCleared === "true" : isCleared;
  const numericId = typeof id === "string" ? parseInt(id) : id;

  const businessTag = business && business !== "" ? ` \`${business}\`` : "";
  const status = booleanCleared ? " ✅" : " ⏳";

  return (
    <div className="hidden sm:block">
      - {date} • <strong>{description}</strong>
      {businessTag} —{" "}
      <strong>
        {symbol}
        {numericAmount.toFixed(2)}
      </strong>
      {status} →{" "}
      <Link
        href={`/ledger/entry/${numericId}`}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        #{numericId}
      </Link>
    </div>
  );
}

// Wrapper component that outputs both mobile and desktop versions
export function ResponsiveEntryItem({
  id,
  date,
  description,
  amount,
  currency,
  business,
  isCleared,
}: EntryCardProps) {
  return (
    <>
      <EntryCard
        id={id}
        date={date}
        description={description}
        amount={amount}
        currency={currency}
        business={business}
        isCleared={isCleared}
      />
      <EntryListItem
        id={id}
        date={date}
        description={description}
        amount={amount}
        currency={currency}
        business={business}
        isCleared={isCleared}
      />
    </>
  );
}
