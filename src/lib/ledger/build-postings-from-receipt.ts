// /lib/ledger/build-postings-from-receipt.ts
// Deterministically convert OCR-structured receipt data into balanced postings.

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

export type MapAccountFn = (desc: string, ctx?: MapAccountOptions) => string;

export type BuildOpts = {
  currency?: string; // default THB
  paymentAccount?: string; // default Assets:Cash
  mapAccount?: MapAccountFn; // category resolver (now accepts ctx)
  includeTaxLine?: boolean; // if true and tax present, split out SalesTax
  vendor?: string; // new: pass vendor context to mapper
};

const DEFAULT_PAYMENT = "Assets:Cash";

export type Posting = { account: string; amount: number; currency: string };

export function buildPostingsFromReceipt(
  receipt: ReceiptShape,
  opts: BuildOpts = {}
): Posting[] {
  const currency = opts.currency || "THB";
  const pay = opts.paymentAccount || DEFAULT_PAYMENT;
  const map = opts.mapAccount || defaultMapAccount; // use shared account map by default

  const positives: Posting[] = receipt.items.map((it) => ({
    account: map(it.description, { vendor: opts.vendor, price: it.price }),
    amount: +(+it.price).toFixed(2),
    currency,
  }));

  if (opts.includeTaxLine && receipt.tax && receipt.tax > 0) {
    positives.push({
      account: "Expenses:Personal:SalesTax",
      amount: +(+receipt.tax).toFixed(2),
      currency,
    });
  }

  const sumPos = +positives.reduce((s, p) => s + p.amount, 0).toFixed(2);
  const total = receipt.total ?? receipt.subtotal ?? sumPos;

  const negative: Posting = { account: pay, amount: -total, currency };

  const postings = [...positives, negative];
  const sum = +postings.reduce((s, p) => s + p.amount, 0).toFixed(2);
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
      positives.push({
        account: "Expenses:Personal:Misc",
        amount: +diff.toFixed(2),
        currency,
      });
    }
  }

  return [...positives, negative];
}
