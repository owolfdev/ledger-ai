/* eslint-disable @next/next/no-img-element */
// src/app/ledger/entry/[id]/editable-ledger-entry.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  updateLedgerEntry,
  type UpdateEntryInput,
} from "@/app/actions/ledger/update-ledger-entry";
import { ImageUpload } from "./image-upload";

type LedgerEntry = {
  id: number;
  entry_date: string;
  description: string;
  memo?: string | null;
  amount: string;
  currency: string;
  entry_text?: string | null;
  image_url?: string | null;
  is_cleared: boolean;
  created_at: string;
  updated_at: string;
};

type LedgerPosting = {
  id: number;
  account: string;
  amount: number;
  currency: string;
  sort_order: number;
};

type EditablePosting = {
  id?: number;
  account: string;
  amount: number;
  currency: string;
  sort_order: number;
  isNew?: boolean;
};

interface EditablePostingsProps {
  postings: LedgerPosting[];
  currency: string;
  onUpdate: (postings: EditablePosting[]) => void;
  disabled?: boolean;
}

// Add the EditablePostings component
function EditablePostings({
  postings,
  currency,
  onUpdate,
  disabled,
}: EditablePostingsProps) {
  const [editPostings, setEditPostings] = useState<EditablePosting[]>(
    postings.map((p, index) => ({
      ...p,
      sort_order: index,
    }))
  );

  // Calculate balance
  const totalAmount = editPostings.reduce((sum, p) => sum + p.amount, 0);
  const isBalanced = Math.abs(totalAmount) < 0.01;

  const updatePosting = (
    index: number,
    field: keyof EditablePosting,
    value: string | number
  ) => {
    const newPostings = [...editPostings];
    if (field === "amount") {
      newPostings[index] = {
        ...newPostings[index],
        [field]: parseFloat(value as string) || 0,
      };
    } else {
      newPostings[index] = { ...newPostings[index], [field]: value };
    }
    setEditPostings(newPostings);
    onUpdate(newPostings);
  };

  const addPosting = () => {
    const newPosting: EditablePosting = {
      account: "",
      amount: 0,
      currency,
      sort_order: editPostings.length,
      isNew: true,
    };
    const newPostings = [...editPostings, newPosting];
    setEditPostings(newPostings);
    onUpdate(newPostings);
  };

  const removePosting = (index: number) => {
    if (editPostings.length <= 2) {
      alert("Must have at least 2 postings for double-entry bookkeeping");
      return;
    }
    const newPostings = editPostings.filter((_, i) => i !== index);
    setEditPostings(newPostings);
    onUpdate(newPostings);
  };

  const balancePostings = () => {
    if (editPostings.length < 2) return;

    const newPostings = [...editPostings];
    const lastIndex = newPostings.length - 1;
    const sumExceptLast = newPostings
      .slice(0, -1)
      .reduce((sum, p) => sum + p.amount, 0);

    // Set the last posting to balance the transaction
    newPostings[lastIndex] = {
      ...newPostings[lastIndex],
      amount: -sumExceptLast,
    };

    setEditPostings(newPostings);
    onUpdate(newPostings);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Account Postings</h3>
        <div className="flex space-x-2">
          <Button
            onClick={addPosting}
            variant="outline"
            size="sm"
            disabled={disabled}
          >
            + Add Posting
          </Button>
          {!isBalanced && (
            <Button
              onClick={balancePostings}
              variant="outline"
              size="sm"
              disabled={disabled}
            >
              Auto Balance
            </Button>
          )}
        </div>
      </div>

      {/* Balance Warning */}
      {!isBalanced && (
        <Alert variant="destructive">
          <AlertDescription>
            ⚠️ Postings must balance! Current total: {totalAmount.toFixed(2)}{" "}
            {currency}
          </AlertDescription>
        </Alert>
      )}

      {/* Postings List */}
      <div className="space-y-3">
        {editPostings.map((posting, index) => (
          <div
            key={posting.id || `new-${index}`}
            className="flex items-center space-x-2 p-3 border rounded-lg"
          >
            <div className="flex-1">
              <Input
                placeholder="Account (e.g., Expenses:Personal:Food:Coffee)"
                value={posting.account}
                onChange={(e) =>
                  updatePosting(index, "account", e.target.value)
                }
                disabled={disabled}
                className="font-mono text-sm"
              />
            </div>
            <div className="w-32">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={posting.amount || ""}
                onChange={(e) => updatePosting(index, "amount", e.target.value)}
                disabled={disabled}
                className="font-mono text-right"
              />
            </div>
            <div className="w-16 text-sm text-neutral-500">
              {posting.currency}
            </div>
            {editPostings.length > 2 && (
              <Button
                onClick={() => removePosting(index)}
                variant="destructive"
                size="sm"
                disabled={disabled}
              >
                ×
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Balance Summary */}
      <div className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
        <span className="text-sm font-medium">Total Balance:</span>
        <span
          className={`font-mono ${
            isBalanced ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {totalAmount.toFixed(2)} {currency}
          {isBalanced && " ✅"}
        </span>
      </div>

      {/* Common Account Suggestions */}
      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700">
          💡 Common Account Examples
        </summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-600">
          <div>
            <strong>Expenses:</strong>
            <ul className="ml-2">
              <li>• Expenses:Personal:Food:Coffee</li>
              <li>• Expenses:Business:Supplies:Office</li>
              <li>• Expenses:Personal:Transportation:Gas</li>
            </ul>
          </div>
          <div>
            <strong>Assets/Liabilities:</strong>
            <ul className="ml-2">
              <li>• Assets:Cash</li>
              <li>• Assets:Bank:Checking</li>
              <li>• Liabilities:CreditCard</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

interface EditableLedgerEntryProps {
  entry: LedgerEntry;
  postings: LedgerPosting[];
}

// Main component
// Fix 2: Create a wrapper function to handle the type conversion
export default function EditableLedgerEntry({
  entry,
  postings,
}: EditableLedgerEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<"basic" | "advanced">("basic");
  const [isPending, startTransition] = useTransition();
  const [editData, setEditData] = useState({
    description: entry.description,
    memo: entry.memo || "",
    entry_date: entry.entry_date,
    is_cleared: entry.is_cleared,
    image_url: entry.image_url,
  });
  const [editPostings, setEditPostings] = useState<EditablePosting[]>(
    postings.map((p, index) => ({
      ...p,
      sort_order: index,
    }))
  );

  // Extract business from entry_text
  const businessMatch = entry.entry_text?.match(/Expenses:([^:]+):/);
  const businessName =
    businessMatch && businessMatch[1] !== "Taxes" ? businessMatch[1] : null;

  // Fix 3: Properly type the handleSave function payload
  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload: UpdateEntryInput = {
          id: entry.id,
          description: editData.description,
          memo: editData.memo || undefined,
          entry_date: editData.entry_date,
          is_cleared: editData.is_cleared,
          image_url: editData.image_url || undefined,
        };

        // Include postings if in advanced mode
        if (editMode === "advanced") {
          payload.postings = editPostings.map((p, index) => ({
            id: p.id,
            account: p.account,
            amount: p.amount,
            currency: p.currency,
            sort_order: index,
          }));
        }

        const result = await updateLedgerEntry(payload);

        if (result.success) {
          setIsEditing(false);
          setEditMode("basic");
        } else {
          alert(`Failed to save: ${result.error}`);
        }
      } catch (error) {
        console.error("Failed to save:", error);
        alert("Failed to save changes. Please try again.");
      }
    });
  };

  const handleCancel = () => {
    setEditData({
      description: entry.description,
      memo: entry.memo || "",
      entry_date: entry.entry_date,
      is_cleared: entry.is_cleared,
      image_url: entry.image_url,
    });
    // Reset editPostings to original postings
    setEditPostings(postings.map((p, index) => ({ ...p, sort_order: index })));
    setIsEditing(false);
    setEditMode("basic");
  };

  // Image upload handlers
  const handleImageUploaded = (url: string) => {
    setEditData((prev) => ({ ...prev, image_url: url }));
  };

  const handleImageRemoved = () => {
    setEditData((prev) => ({ ...prev, image_url: null }));
  };

  // Fix 4: Create a wrapper function for the EditablePostings onUpdate
  const handlePostingsUpdate = (newPostings: EditablePosting[]) => {
    setEditPostings(newPostings);
  };

  // Calculate if postings are balanced (for advanced mode)
  const postingsTotal = editPostings.reduce((sum, p) => sum + p.amount, 0);
  const postingsBalanced = Math.abs(postingsTotal) < 0.01;
  const canSave =
    editMode === "basic" || (editMode === "advanced" && postingsBalanced);

  if (isEditing) {
    return (
      <div className="mx-auto max-w-4xl p-4 space-y-6 w-full">
        {/* Edit Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Edit Entry #{entry.id}</h1>
            <p className="text-sm text-neutral-500">
              {editData.entry_date} • {entry.currency}
              {businessName && ` • ${businessName}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Edit Mode Toggle */}
            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setEditMode("basic")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  editMode === "basic"
                    ? "bg-white dark:bg-neutral-700 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                disabled={isPending}
              >
                Basic
              </button>
              <button
                onClick={() => setEditMode("advanced")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  editMode === "advanced"
                    ? "bg-white dark:bg-neutral-700 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                disabled={isPending}
              >
                Advanced
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !canSave}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Basic Edit Form */}
        <section className="rounded-2xl border p-4 space-y-4">
          <h3 className="font-semibold">Entry Details</h3>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description / Payee
            </label>
            <Input
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              placeholder="Enter description or payee name"
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={editData.entry_date}
                onChange={(e) =>
                  setEditData({ ...editData, entry_date: e.target.value })
                }
                disabled={isPending}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                id="cleared-checkbox"
                type="checkbox"
                checked={editData.is_cleared}
                onChange={(e) =>
                  setEditData({ ...editData, is_cleared: e.target.checked })
                }
                className="w-4 h-4"
                disabled={isPending}
              />
              <label htmlFor="cleared-checkbox" className="text-sm font-medium">
                Mark as cleared
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Memo</label>
            <Textarea
              value={editData.memo}
              onChange={(e) =>
                setEditData({ ...editData, memo: e.target.value })
              }
              placeholder="Optional memo or notes..."
              rows={3}
              disabled={isPending}
            />
          </div>
        </section>

        {/* Image Upload Section */}
        <section className="rounded-2xl border p-4">
          <ImageUpload
            currentImageUrl={editData.image_url}
            onImageUploaded={handleImageUploaded}
            onImageRemoved={handleImageRemoved}
            disabled={isPending}
          />
        </section>

        {/* Advanced Mode: Editable Postings */}
        {editMode === "advanced" ? (
          <section className="rounded-2xl border p-4">
            <EditablePostings
              postings={postings}
              currency={entry.currency}
              onUpdate={handlePostingsUpdate}
              disabled={isPending}
            />
          </section>
        ) : (
          /* Basic Mode: Read-only Postings */
          <section className="rounded-2xl border p-4 bg-neutral-50 dark:bg-neutral-900">
            <h3 className="font-semibold mb-3 text-neutral-700 dark:text-neutral-300">
              Account Postings (read-only)
            </h3>
            <p className="text-xs text-neutral-500 mb-3">
              Switch to Advanced mode to edit individual postings
            </p>
            <ul className="space-y-2">
              {postings.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="truncate pr-4 font-mono text-neutral-600 dark:text-neutral-400">
                    {p.account}
                  </div>
                  <div className="font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                    {p.amount.toFixed(2)} {p.currency}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Warning for Advanced Mode */}
        {editMode === "advanced" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-4">
            <div className="flex items-start space-x-2">
              <span className="text-amber-600 dark:text-amber-400 text-sm">
                ⚠️
              </span>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Advanced Mode:</strong> Editing postings directly
                affects your accounting structure. Ensure accounts follow your
                business hierarchy and postings remain balanced.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View Mode (unchanged)
  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6 w-full">
      {/* Header with Edit Button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ledger Entry #{entry.id}</h1>
          <p className="text-sm text-neutral-500">
            {entry.entry_date} • {entry.currency}
            {businessName && ` • ${businessName}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit Entry
        </Button>
      </div>

      {/* Main Entry Details */}
      <section className="rounded-2xl border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-medium">{entry.description}</div>
            {businessName && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Business: {businessName}
              </div>
            )}
            {entry.memo && (
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                {entry.memo}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-mono text-lg">
              {Number(entry.amount).toFixed(2)} {entry.currency}
            </div>
            {entry.is_cleared ? (
              <span className="text-xs text-emerald-600">✅ cleared</span>
            ) : (
              <span className="text-xs text-amber-600">⏳ pending</span>
            )}
          </div>
        </div>
      </section>

      {/* Postings */}
      {postings && postings.length > 0 && (
        <section className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">Account Postings</h2>
          <ul className="space-y-2">
            {postings.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <div className="truncate pr-4 font-mono text-sm">
                  {p.account}
                </div>
                <div className="font-mono tabular-nums">
                  {p.amount.toFixed(2)} {p.currency}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ledger Text */}
      {entry.entry_text && (
        <section className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">Ledger Text</h2>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg">
            {entry.entry_text}
          </pre>
        </section>
      )}

      {/* Receipt Image */}
      {entry.image_url && (
        <section className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">Receipt Image</h2>
          <figure>
            <div className="relative w-full overflow-hidden rounded-xl border bg-black/5">
              <img
                src={entry.image_url}
                alt={`Receipt image for ${entry.description} on ${entry.entry_date}`}
                className="block max-h-[520px] w-full object-contain bg-white"
                loading="lazy"
              />
            </div>
            <figcaption className="mt-2 text-xs text-neutral-500">
              <a
                href={entry.image_url}
                target="_blank"
                rel="noreferrer"
                className="underline hover:no-underline"
              >
                Open full size →
              </a>
            </figcaption>
          </figure>
        </section>
      )}
    </div>
  );
}
