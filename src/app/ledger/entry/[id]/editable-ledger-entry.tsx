/* eslint-disable @next/next/no-img-element */
// src/app/ledger/entry/[id]/editable-ledger-entry.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  updateLedgerEntry,
  type UpdateEntryInput,
} from "@/app/actions/ledger/update-ledger-entry";
import { ImageUpload } from "./image-upload";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { clearAllTerminalHistories } from "@/lib/utils/clear-terminal-histories";
import { formatCurrencyWithSymbol } from "@/lib/utils/currency-format";

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

// Mobile-optimized EditablePostings component
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

    // Update sort_order to match array position
    newPostings.forEach((posting, idx) => {
      posting.sort_order = idx;
    });

    setEditPostings(newPostings);
    onUpdate(newPostings);
  };

  // Add this useEffect to EditablePostings component
  useEffect(() => {
    setEditPostings((prev) =>
      prev.map((posting) => ({
        ...posting,
        currency: currency, // Update all postings to use the new currency
      }))
    );
  }, [currency]);

  // Mobile-friendly reordering
  const movePosting = (fromIndex: number, direction: "up" | "down") => {
    const newPostings = [...editPostings];
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;

    if (toIndex < 0 || toIndex >= newPostings.length) return;

    [newPostings[fromIndex], newPostings[toIndex]] = [
      newPostings[toIndex],
      newPostings[fromIndex],
    ];

    newPostings.forEach((posting, idx) => {
      posting.sort_order = idx;
    });

    setEditPostings(newPostings);
    onUpdate(newPostings);
  };

  const addPosting = () => {
    const newPosting: EditablePosting = {
      account: "",
      amount: 0,
      currency, // This will use the updated currency from props
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

    newPostings.forEach((posting, idx) => {
      posting.sort_order = idx;
    });

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

    newPostings[lastIndex] = {
      ...newPostings[lastIndex],
      amount: -sumExceptLast,
    };

    setEditPostings(newPostings);
    onUpdate(newPostings);
  };

  return (
    <div className="space-y-4">
      {/* Header - Mobile Optimized */}
      <div className="space-y-3">
        <h3 className="font-semibold">Account Postings</h3>

        {/* Mobile: Stack buttons vertically */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={addPosting}
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full sm:w-auto"
          >
            + Add Posting
          </Button>
          {!isBalanced && (
            <Button
              onClick={balancePostings}
              variant="outline"
              size="sm"
              disabled={disabled}
              className="w-full sm:w-auto"
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

      {/* Mobile-Optimized Postings List */}
      <div className="space-y-4">
        {editPostings.map((posting, index) => (
          <div
            key={posting.id || `new-${index}`}
            className="border rounded-lg p-4 space-y-3 bg-white dark:bg-neutral-950"
          >
            {/* Mobile: Header row with order and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                  #{index + 1}
                </span>

                {/* Mobile-friendly reorder buttons */}
                <div className="flex gap-1">
                  <Button
                    onClick={() => movePosting(index, "up")}
                    variant="outline"
                    size="sm"
                    disabled={disabled || index === 0}
                    className="h-8 w-8 p-0"
                    title="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    onClick={() => movePosting(index, "down")}
                    variant="outline"
                    size="sm"
                    disabled={disabled || index === editPostings.length - 1}
                    className="h-8 w-8 p-0"
                    title="Move down"
                  >
                    ↓
                  </Button>
                </div>
              </div>

              {/* Delete button - larger for mobile */}
              {editPostings.length > 2 && (
                <Button
                  onClick={() => removePosting(index)}
                  variant="destructive"
                  size="sm"
                  disabled={disabled}
                  className="h-8 w-8 p-0"
                  title="Remove posting"
                >
                  ×
                </Button>
              )}
            </div>

            {/* Mobile: Stack account and amount vertically */}
            <div className="space-y-3">
              {/* Account input - full width on mobile */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Account
                </label>
                <Input
                  placeholder="e.g., Expenses:Personal:Food:Coffee"
                  value={posting.account}
                  onChange={(e) =>
                    updatePosting(index, "account", e.target.value)
                  }
                  disabled={disabled}
                  className="font-mono text-sm"
                />
              </div>

              {/* Amount and currency row */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Amount
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={posting.amount || ""}
                    onChange={(e) =>
                      updatePosting(index, "amount", e.target.value)
                    }
                    disabled={disabled}
                    className="font-mono text-right"
                  />
                </div>
                <div className="w-16 pb-2">
                  <div className="text-sm text-neutral-500 text-center">
                    {posting.currency}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Balance Summary - Mobile Optimized */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span className="text-sm font-medium">Total Balance:</span>
          <span
            className={`font-mono text-lg ${
              isBalanced ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {totalAmount.toFixed(2)} {currency}
            {isBalanced && " ✅"}
          </span>
        </div>
      </div>

      {/* Common Account Suggestions - Collapsible on mobile */}
      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          💡 Common Account Examples
        </summary>
        <div className="mt-3 space-y-3 text-xs text-neutral-600 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <div>
            <strong className="block mb-2">Expenses:</strong>
            <ul className="space-y-1 ml-2">
              <li>• Expenses:Personal:Food:Coffee</li>
              <li>• Expenses:Business:Supplies:Office</li>
              <li>• Expenses:Personal:Transportation:Gas</li>
            </ul>
          </div>
          <div>
            <strong className="block mb-2">Assets/Liabilities:</strong>
            <ul className="space-y-1 ml-2">
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

// Main component - Mobile Optimized
export default function EditableLedgerEntry({
  entry,
  postings,
}: EditableLedgerEntryProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<"basic" | "advanced">("basic");
  const [isPending, startTransition] = useTransition();
  const [editData, setEditData] = useState({
    description: entry.description,
    memo: entry.memo || "",
    entry_date: entry.entry_date,
    is_cleared: entry.is_cleared,
    image_url: entry.image_url,
    currency: entry.currency,
  });
  const [editPostings, setEditPostings] = useState<EditablePosting[]>(
    postings.map((p, index) => ({
      ...p,
      sort_order: index,
    }))
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Extract business from entry_text
  const businessMatch = entry.entry_text?.match(/Expenses:([^:]+):/);
  const businessName =
    businessMatch && businessMatch[1] !== "Taxes" ? businessMatch[1] : null;

  // Delete function
  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/ledger-entry/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ entryId: entry.id }),
        });

        const result = await response.json();

        if (result.success) {
          clearAllTerminalHistories(); // Clear all terminal histories
          router.push("/");
        } else {
          alert(`Failed to delete entry: ${result.error}`);
        }
      } catch (error) {
        console.error("Failed to delete entry:", error);
        alert("Failed to delete entry. Please try again.");
      } finally {
        setShowDeleteDialog(false);
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload: UpdateEntryInput = {
          id: entry.id,
          description: editData.description,
          memo: editData.memo || undefined,
          entry_date: editData.entry_date,
          is_cleared: editData.is_cleared,
          image_url: editData.image_url,
          currency: editData.currency,
        };

        // Always include postings when currency changes to ensure all postings get updated
        // This is necessary because currency changes affect all postings
        const hasCurrencyChanged = editData.currency !== entry.currency;

        if (editMode === "advanced" || hasCurrencyChanged) {
          payload.postings = editPostings.map((posting) => ({
            id: posting.id,
            account: posting.account,
            amount: posting.amount,
            currency: editData.currency,
            sort_order: posting.sort_order,
          }));
        }

        const result = await updateLedgerEntry(payload);

        if (result.success) {
          clearAllTerminalHistories(); // Clear all terminal histories
          setIsEditing(false);
          setEditMode("basic");
          window.location.reload();
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
      currency: entry.currency,
    });
    setEditPostings(postings.map((p, index) => ({ ...p, sort_order: index })));
    setIsEditing(false);
    setEditMode("basic");
  };

  const handleImageUploaded = (url: string) => {
    setEditData((prev) => ({ ...prev, image_url: url }));
  };

  const handleImageRemoved = () => {
    setEditData((prev) => ({ ...prev, image_url: null }));
  };

  const handlePostingsUpdate = (newPostings: EditablePosting[]) => {
    setEditPostings(newPostings);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    // Update the entry currency
    setEditData((prev) => ({ ...prev, currency: newCurrency }));

    // Update all postings to use the new currency
    const updatedPostings = editPostings.map((posting) => ({
      ...posting,
      currency: newCurrency,
    }));
    setEditPostings(updatedPostings);
  };

  const postingsTotal = editPostings.reduce((sum, p) => sum + p.amount, 0);
  const postingsBalanced = Math.abs(postingsTotal) < 0.01;
  const canSave =
    editMode === "basic" || (editMode === "advanced" && postingsBalanced);

  if (isEditing) {
    return (
      <div className="mx-auto max-w-4xl p-3 sm:p-4 space-y-4 sm:space-y-6 w-full">
        {/* Mobile-Optimized Edit Header */}
        <div className="space-y-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">
              Edit Entry #{entry.id}
            </h1>
            <p className="text-sm text-neutral-500">
              {editData.entry_date} • {editData.currency}
              {businessName && ` • ${businessName}`}
            </p>
          </div>

          {/* Mobile: Stack controls vertically */}
          <div className="space-y-3">
            {/* Edit Mode Toggle - Full width on mobile */}

            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 w-full sm:w-fit">
              <button
                onClick={() => setEditMode("basic")}
                className={`flex-1 sm:flex-none sm:px-4 py-2 text-sm rounded-md transition-colors ${
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
                className={`flex-1 sm:flex-none sm:px-4 py-2 text-sm rounded-md transition-colors ${
                  editMode === "advanced"
                    ? "bg-white dark:bg-neutral-700 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                disabled={isPending}
              >
                Advanced
              </button>
            </div>

            {/* Action buttons - Full width on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending || !canSave}
                className="w-full sm:w-auto sm:h-[32px] h-12 text-lg"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Entry Details */}
        <section className="rounded-2xl border p-3 sm:p-4 space-y-4">
          <h3 className="font-semibold">Entry Details</h3>

          <div>
            <label className="block text-sm font-medium mb-2">
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

          {/* Mobile: Stack date, currency, and cleared vertically */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={editData.entry_date}
                onChange={(e) =>
                  setEditData({ ...editData, entry_date: e.target.value })
                }
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <Input
                value={editData.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                placeholder="USD, EUR, THB, etc."
                disabled={isPending}
                className="font-mono"
              />
              <p className="text-xs text-neutral-500 mt-1">
                This will update the currency for the entire entry and all
                postings
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <input
                id="cleared-checkbox"
                type="checkbox"
                checked={editData.is_cleared}
                onChange={(e) =>
                  setEditData({ ...editData, is_cleared: e.target.checked })
                }
                className="w-5 h-5"
                disabled={isPending}
              />
              <label htmlFor="cleared-checkbox" className="text-sm font-medium">
                Mark as cleared
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Memo</label>
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
        <section className="rounded-2xl border p-3 sm:p-4">
          <ImageUpload
            currentImageUrl={editData.image_url}
            onImageUploaded={handleImageUploaded}
            onImageRemoved={handleImageRemoved}
            disabled={isPending}
          />
        </section>

        {/* Advanced Mode: Mobile-Optimized Editable Postings */}
        {editMode === "advanced" ? (
          <section className="rounded-2xl border p-3 sm:p-4">
            <EditablePostings
              postings={postings}
              currency={editData.currency}
              onUpdate={handlePostingsUpdate}
              disabled={isPending}
            />
          </section>
        ) : (
          /* Basic Mode: Mobile-Optimized Read-only Postings */
          <section className="rounded-2xl border p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-900">
            <h3 className="font-semibold mb-3 text-neutral-700 dark:text-neutral-300">
              Account Postings (read-only)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Switch to Advanced mode to edit individual postings
            </p>
            <div className="space-y-3">
              {postings.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 p-3 bg-white dark:bg-neutral-800 rounded-lg"
                >
                  <div className="font-mono text-sm text-neutral-600 dark:text-neutral-400 break-all">
                    {p.account}
                  </div>
                  <div className="font-mono tabular-nums text-neutral-600 dark:text-neutral-400 text-right">
                    {p.amount.toFixed(2)} {p.currency}
                  </div>
                </div>
              ))}
            </div>
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

  // Mobile-Optimized View Mode
  return (
    <div className="mx-auto max-w-3xl p-3 sm:p-4 space-y-4 sm:space-y-6 w-full">
      {/* Mobile-Optimized Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">
            Ledger Entry #{entry.id}
          </h1>
          <p className="text-sm text-neutral-500">
            {entry.entry_date} • {entry.currency}
            {businessName && ` • ${businessName}`}
          </p>
        </div>

        {/* Mobile: Stack buttons vertically */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto sm:h-[32px] h-12 text-lg"
          >
            Edit Entry
          </Button>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Entry #{entry.id}</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete this ledger entry?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                <div className="text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                    This will permanently remove:
                  </div>
                  <ul className="space-y-1 text-red-700 dark:text-red-300 text-xs">
                    <li>• The ledger entry and all postings</li>
                    <li>• Any associated receipt images</li>
                    <li>• The entry from your .ledger file</li>
                  </ul>
                </div>

                <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <strong>This action cannot be undone.</strong>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? "Deleting..." : "Delete Entry"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile-Optimized Entry Details */}
      <section className="rounded-2xl border p-3 sm:p-4">
        <div className="space-y-3">
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
            <div className="font-mono text-xl">
              {formatCurrencyWithSymbol(Number(entry.amount), entry.currency)}
            </div>
            {entry.is_cleared ? (
              <span className="text-sm text-emerald-600">✅ cleared</span>
            ) : (
              <span className="text-sm text-amber-600">⏳ pending</span>
            )}
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Postings */}
      {postings && postings.length > 0 && (
        <section className="rounded-2xl border p-3 sm:p-4">
          <h2 className="font-semibold mb-3">Account Postings</h2>
          <div className="space-y-3">
            {postings.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
              >
                <div className="font-mono text-sm break-all">{p.account}</div>
                <div className="font-mono tabular-nums text-right">
                  {formatCurrencyWithSymbol(p.amount, p.currency)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ledger Text */}
      {entry.entry_text && (
        <section className="rounded-2xl border p-3 sm:p-4">
          <h2 className="font-semibold mb-3">Ledger Text</h2>
          <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg overflow-x-auto">
            {entry.entry_text}
          </pre>
        </section>
      )}

      {/* Mobile-Optimized Receipt Image */}
      {entry.image_url && (
        <section className="rounded-2xl border p-3 sm:p-4">
          <h2 className="font-semibold mb-3">Receipt Image</h2>
          <figure>
            <div className="relative w-full overflow-hidden rounded-xl border bg-black/5">
              <img
                src={entry.image_url}
                alt={`Receipt image for ${entry.description} on ${entry.entry_date}`}
                className="block max-h-[400px] sm:max-h-[520px] w-full object-contain bg-white"
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
