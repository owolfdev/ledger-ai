// /lib/ledger/schemas.ts
// Zod schemas shared by parser, client UI, and server actions.

import { z } from "zod";

// YYYY-MM-DD (local date)
export const DateYMD = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Expected YYYY-MM-DD");

// Ledger account path like Assets:Cash or Expenses:Personal:Food:Coffee
export const AccountPath = z
  .string()
  .regex(/^[A-Z][A-Za-z]*(?::[A-Z][A-Za-z]*)*$/u, "Invalid account path");

// ISO currency code (3 letters)
export const CurrencyISO = z
  .string()
  .length(3, "ISO currency code must be 3 letters")
  .transform((s) => s.toUpperCase());

// Money (finite, 2dp max). Store as number; rounding handled elsewhere.
export const Money = z
  .number({ message: "Amount must be a number" })
  .finite()
  .refine((n) => Number.isFinite(n), "Amount must be finite");

export const ReceiptItemSchema = z.object({
  description: z.string().min(1),
  price: Money, // non-negative validation below at receipt level (allows returns if needed)
});
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

export const ReceiptShapeSchema = z
  .object({
    items: z.array(ReceiptItemSchema).min(1, "At least one item"),
    subtotal: Money.nullable(),
    tax: Money.nullable(),
    total: Money.nullable(),
  })
  .superRefine((val, ctx) => {
    // Ensure all prices are >= 0 (allow negative only if explicitly desired)
    for (const [i, it] of val.items.entries()) {
      if (it.price < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Item #${i + 1} price cannot be negative`,
          path: ["items", i, "price"],
        });
      }
    }

    // If subtotal provided, check it matches the sum of item prices (within 1 cent)
    const sum = Number(val.items.reduce((s, it) => s + it.price, 0).toFixed(2));

    if (val.subtotal !== null && Math.abs(sum - val.subtotal) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Subtotal ${val.subtotal} does not equal items sum ${sum}`,
        path: ["subtotal"],
      });
    }

    // If total provided, check it roughly equals subtotal + tax (when both present)
    if (val.total !== null) {
      const sub = val.subtotal ?? sum;
      const tax = val.tax ?? 0;
      const expected = Number((sub + tax).toFixed(2));
      if (Math.abs(expected - val.total) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total ${val.total} does not equal subtotal+tax (${expected})`,
          path: ["total"],
        });
      }
    }
  });
export type ReceiptShape = z.infer<typeof ReceiptShapeSchema>;

export const NewCommandPayloadSchema = z.object({
  date: DateYMD,
  payee: z.string().min(1),
  currency: CurrencyISO,
  receipt: ReceiptShapeSchema,
  paymentAccount: AccountPath.optional(),
  memo: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(), // <--- NEW
});
export type NewCommandPayload = z.infer<typeof NewCommandPayloadSchema>;

// Helper: validate and return typed payload
export function validateNewCommandPayload(input: unknown): NewCommandPayload {
  return NewCommandPayloadSchema.parse(input);
}
