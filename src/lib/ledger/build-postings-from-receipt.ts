// /lib/ledger/build-postings-from-receipt.ts
// Deterministically convert OCR-structured receipt data into balanced postings with AI support.

import {
  mapAccount as defaultMapAccount,
  type MapAccountOptions,
} from "./account-map";

export type ReceiptItem = { description: string; price: number };

export type ReceiptShape = {
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
};

export type MapAccountFn = (
  desc: string,
  ctx?: MapAccountOptions
) => string | Promise<string>;

export type BuildOpts = {
  currency?: string; // default THB
  paymentAccount?: string; // default Assets:Cash
  mapAccount?: MapAccountFn; // category resolver (now supports async)
  includeTaxLine?: boolean; // if true and tax present, split out SalesTax
  vendor?: string; // pass vendor context to mapper
  business?: string; // pass business context to mapper
  type?: string; // transaction type (expense, income, asset, liability, transfer)
};

const DEFAULT_PAYMENT = "Assets:Cash";

export type Posting = { account: string; amount: number; currency: string };

/**
 * Map payment method to proper account structure
 */
function mapPaymentMethodToAccount(
  paymentMethod: string,
  business: string = "Personal"
): string {
  const payment = paymentMethod.toLowerCase();

  // Credit card patterns (check first - more specific)
  if (payment.includes("credit") || payment.includes("card")) {
    return `Liabilities:${business}:Debt:CreditCard`;
  }

  // Bank account patterns (check after credit card)
  if (
    payment.includes("bank") ||
    payment.includes("kasikorn") ||
    payment.includes("kbank")
  ) {
    return `Assets:Bank:${
      payment.includes("kasikorn") || payment.includes("kbank")
        ? "Kasikorn"
        : "Bank"
    }:${business}`;
  }

  // Cash patterns
  if (payment.includes("cash") || payment.includes("money")) {
    return `Assets:Cash`;
  }

  // Default to cash
  return `Assets:Cash`;
}

/**
 * Build postings based on transaction type
 */
export async function buildPostingsByType(
  receipt: ReceiptShape,
  type: string,
  opts: BuildOpts = {}
): Promise<Posting[]> {
  const currency = opts.currency || "THB";
  const business = opts.business || "Personal";
  const map = opts.mapAccount || defaultMapAccount;

  // Check for opening balance patterns BEFORE any item processing
  const isOpeningBalance = receipt.items?.some(
    (item) =>
      item.description.toLowerCase().includes("opening") ||
      item.description.toLowerCase().includes("initial") ||
      item.description.toLowerCase().includes("starting") ||
      item.description.toLowerCase().includes("opening_balance") ||
      item.description.toLowerCase().includes("initial_balance")
  );

  console.log("🔍 Server-side early opening balance detection:", {
    isOpeningBalance,
    type,
    items: receipt.items?.map((i) => i.description),
    total: receipt.total ?? receipt.subtotal,
  });

  // Skip ALL item processing for opening balances - they only need payment account + equity
  if (
    isOpeningBalance &&
    (type === "asset" ||
      type === "opening_balance" ||
      type === "initial_balance")
  ) {
    const total = receipt.total ?? receipt.subtotal ?? 0;

    // Normalize business name for consistent account paths
    const { normalizeBusinessNameSync } = await import("./business-normalizer");
    const normalizedBusiness = normalizeBusinessNameSync(
      business || "Personal"
    );

    const postings: Posting[] = [
      {
        account: opts.paymentAccount
          ? mapPaymentMethodToAccount(
              opts.paymentAccount,
              normalizedBusiness.accountPrefix
            )
          : "Assets:Cash",
        amount: +total,
        currency,
      },
      {
        account: `Equity:${normalizedBusiness.accountPrefix}:Opening-Balances`,
        amount: -total,
        currency,
      },
    ];
    console.log("✅ Server-side created opening balance postings:", postings);
    return postings;
  }

  // Build context object for mapAccount calls
  const mapContext: MapAccountOptions = {
    vendor: opts.vendor,
    business,
    type,
  };

  // Map all items concurrently for better performance
  const mappingPromises = receipt.items.map(async (it) => ({
    account: await map(it.description, {
      ...mapContext,
      price: it.price,
    }),
    amount: +(+it.price).toFixed(2),
    currency,
  }));

  const positives: Posting[] = await Promise.all(mappingPromises);

  // Handle tax line if needed
  if (opts.includeTaxLine && receipt.tax && receipt.tax > 0) {
    const taxAccount = await map("tax", mapContext);
    positives.push({
      account: taxAccount,
      amount: +(+receipt.tax).toFixed(2),
      currency,
    });
  }

  const sumPos = +positives.reduce((s, p) => s + p.amount, 0).toFixed(2);
  const total = receipt.total ?? receipt.subtotal ?? sumPos;

  // Build postings based on transaction type
  switch (type) {
    case "income":
      return [
        {
          account: opts.paymentAccount
            ? mapPaymentMethodToAccount(opts.paymentAccount, business)
            : "Assets:Cash",
          amount: +total,
          currency,
        }, // Cash increase (debit)
        ...positives.map((p) => ({ ...p, amount: -p.amount })), // Income accounts (credits)
      ];

    case "asset":
      return [
        ...positives, // Asset accounts (positive amounts)
        {
          account: opts.paymentAccount
            ? mapPaymentMethodToAccount(opts.paymentAccount, business)
            : "Liabilities:Personal:Debt:CreditCard",
          amount: -total,
          currency,
        }, // Payment method decrease
      ];

    case "liability":
      return [
        ...positives, // Liability accounts (positive amounts for payments)
        {
          account: opts.paymentAccount
            ? mapPaymentMethodToAccount(opts.paymentAccount, business)
            : "Assets:Cash",
          amount: -total,
          currency,
        }, // Cash decrease
      ];

    case "transfer":
      // Transfers need special handling - for now treat as expense
      return [
        ...positives, // Expense accounts
        {
          account: opts.paymentAccount
            ? mapPaymentMethodToAccount(opts.paymentAccount, business)
            : "Assets:Cash",
          amount: -total,
          currency,
        },
      ];

    default: // expense
      return [
        ...positives, // Expense accounts
        {
          account: opts.paymentAccount
            ? mapPaymentMethodToAccount(opts.paymentAccount, business)
            : "Assets:Cash",
          amount: -total,
          currency,
        }, // Cash decrease
      ];
  }
}

export async function buildPostingsFromReceipt(
  receipt: ReceiptShape,
  opts: BuildOpts = {}
): Promise<Posting[]> {
  // Use the new type-based logic
  const type = opts.type || "expense";
  return buildPostingsByType(receipt, type, opts);
}
