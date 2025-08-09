// /lib/ledger/build-postings-from-receipt.ts
// Deterministically convert OCR-structured receipt data into balanced postings.

export type ReceiptItem = { description: string; price: number };
export type ReceiptShape = {
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
};

export type BuildOpts = {
  currency?: string; // default THB
  paymentAccount?: string; // default Assets:Cash
  mapAccount?: (desc: string) => string; // category resolver
  includeTaxLine?: boolean; // if true and tax present, split out SalesTax
};

const DEFAULT_PAYMENT = "Assets:Cash";

function defaultMap(desc: string): string {
  const d = desc.toLowerCase();
  if (/(chicken|beef|pork|meat)/.test(d)) return "Expenses:Personal:Food:Meat";
  if (/(oat|grain|rice|bread|cereal)/.test(d))
    return "Expenses:Personal:Food:Grains";
  if (/(olive|oil|vinegar|sauce|ketchup|condiment)/.test(d))
    return "Expenses:Personal:Food:Condiments";
  if (/(bean|onion|garlic|veg|vegetable|lettuce|tomato|pepper)/.test(d))
    return "Expenses:Personal:Food:Vegetables";
  if (/(lemon|apple|banana|grape|fruit)/.test(d))
    return "Expenses:Personal:Food:Fruit";
  if (/(peanut\s*butter|jam|jelly)/.test(d))
    return "Expenses:Personal:Food:Pantry";
  return "Expenses:Personal:Misc";
}

export type Posting = { account: string; amount: number; currency: string };

export function buildPostingsFromReceipt(
  receipt: ReceiptShape,
  opts: BuildOpts = {}
): Posting[] {
  const currency = opts.currency || "THB";
  const pay = opts.paymentAccount || DEFAULT_PAYMENT;
  const map = opts.mapAccount || defaultMap;

  const positives: Posting[] = receipt.items.map((it) => ({
    account: map(it.description),
    amount: +(+it.price).toFixed(2),
    currency,
  }));

  // Optional split tax as its own expense account
  if (opts.includeTaxLine && receipt.tax && receipt.tax > 0) {
    positives.push({
      account: "Expenses:Personal:SalesTax",
      amount: +(+receipt.tax).toFixed(2),
      currency,
    });
  }

  const sumPos = +positives.reduce((s, p) => s + p.amount, 0).toFixed(2);
  const total = receipt.total ?? receipt.subtotal ?? sumPos;

  // Negative balancing line
  const negative: Posting = { account: pay, amount: -total, currency };

  // If we didn't include tax line but receipt had tax, ensure negatives match POS sum by using total
  // If rounding mismatch, adjust smallest positive
  const postings = [...positives, negative];
  const sum = +postings.reduce((s, p) => s + p.amount, 0).toFixed(2);
  if (Math.abs(sum) > 0.005) {
    // find smallest positive and adjust by diff
    const diff = -sum; // amount needed to reach 0
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
      // fallback: push misc adjustment
      positives.push({
        account: "Expenses:Personal:Misc",
        amount: +diff.toFixed(2),
        currency,
      });
    }
  }

  return [...positives, negative];
}
