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
};

const DEFAULT_PAYMENT = "Assets:Cash";

export type Posting = { account: string; amount: number; currency: string };

export async function buildPostingsFromReceipt(
  receipt: ReceiptShape,
  opts: BuildOpts = {}
): Promise<Posting[]> {
  const currency = opts.currency || "THB";
  const pay = opts.paymentAccount || DEFAULT_PAYMENT;
  const map = opts.mapAccount || defaultMapAccount;

  // Build context object for mapAccount calls
  const mapContext: MapAccountOptions = {
    vendor: opts.vendor,
    business: opts.business,
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
    // Tax account doesn't use business context (always goes to Expenses:Taxes:Sales)
    const taxAccount = await map("tax", mapContext);
    positives.push({
      account: taxAccount,
      amount: +(+receipt.tax).toFixed(2),
      currency,
    });
  }

  const sumPos = +positives.reduce((s, p) => s + p.amount, 0).toFixed(2);
  const total = receipt.total ?? receipt.subtotal ?? sumPos;
  const negative: Posting = { account: pay, amount: -total, currency };

  const postings = [...positives, negative];
  const sum = +postings.reduce((s, p) => s + p.amount, 0).toFixed(2);

  // Balance adjustment if needed
  if (Math.abs(sum) > 0.005) {
    const diff = -sum;
    let idx = -1;
    let min = Number.POSITIVE_INFINITY;

    for (let i = 0; i < positives.length; i++) {
      if (positives[i].amount < min) {
        min = positives[i].amount;
        idx = i;
      }
    }

    if (idx >= 0) {
      positives[idx] = {
        ...positives[idx],
        amount: +(positives[idx].amount + diff).toFixed(2),
      };
    } else {
      // Use business context for fallback account too
      const fallbackAccount = opts.business
        ? `Expenses:${opts.business}:Misc`
        : "Expenses:Personal:Misc";
      positives.push({
        account: fallbackAccount,
        amount: +diff.toFixed(2),
        currency,
      });
    }
  }

  return [...positives, negative];
}
