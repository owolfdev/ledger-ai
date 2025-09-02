"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReceiptUploader } from "@/components/receipt-uploader"
import { Calendar, Check, AlertCircle, Plus, Trash2, Sparkles, X } from "lucide-react"

interface Entry {
  id: string
  date: string
  description: string
  amount: number
  currency: string
  type: "expense" | "income" | "asset" | "liability" | "transfer"
  accounts: string[]
  status: "cleared" | "pending"
  attachments: number
  postings: Array<{
    account: string
    debit?: number
    credit?: number
    currency: string
    notes?: string
  }>
  memo?: string
}

interface EntryEditorProps {
  entry: Entry
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (entry: Entry) => void
}

const currencies = ["USD", "EUR", "GBP", "THB", "JPY"]

const accountSuggestions = [
  "Assets:Bank:Checking",
  "Assets:Bank:Savings",
  "Assets:Cash",
  "Expenses:Office:Supplies",
  "Expenses:Travel:Meals",
  "Expenses:Utilities:Internet",
  "Income:Consulting",
  "Income:Sales",
  "Liabilities:CreditCard:Visa",
  "Liabilities:CreditCard:Mastercard",
]

const aiSuggestions = [
  { original: "starbucks", suggested: "Expenses:Meals:Coffee", confidence: 95 },
  { original: "office supplies", suggested: "Expenses:Office:Supplies", confidence: 90 },
  { original: "consulting", suggested: "Income:Consulting", confidence: 88 },
]

export function EntryEditor({ entry, open, onOpenChange, onSave }: EntryEditorProps) {
  const [editedEntry, setEditedEntry] = useState<Entry>(entry)
  const [activeTab, setActiveTab] = useState("basic")

  useEffect(() => {
    setEditedEntry(entry)
  }, [entry])

  const calculateBalance = () => {
    const totalDebits = editedEntry.postings.reduce((sum, posting) => sum + (posting.debit || 0), 0)
    const totalCredits = editedEntry.postings.reduce((sum, posting) => sum + (posting.credit || 0), 0)
    return Math.abs(totalDebits - totalCredits) < 0.01
  }

  const isBalanced = calculateBalance()

  const addPosting = () => {
    setEditedEntry((prev) => ({
      ...prev,
      postings: [...prev.postings, { account: "", debit: 0, currency: prev.currency }],
    }))
  }

  const updatePosting = (index: number, field: string, value: any) => {
    setEditedEntry((prev) => ({
      ...prev,
      postings: prev.postings.map((posting, i) => (i === index ? { ...posting, [field]: value } : posting)),
    }))
  }

  const removePosting = (index: number) => {
    setEditedEntry((prev) => ({
      ...prev,
      postings: prev.postings.filter((_, i) => i !== index),
    }))
  }

  const handleSave = () => {
    if (isBalanced) {
      onSave(editedEntry)
    }
  }

  const getSuggestionForAccount = (account: string) => {
    return aiSuggestions.find((s) => account.toLowerCase().includes(s.original.toLowerCase()))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
          <DialogDescription>
            Modify entry details and postings. Ensure the entry is balanced before saving.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={editedEntry.date}
                    onChange={(e) => setEditedEntry((prev) => ({ ...prev, date: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={editedEntry.currency}
                  onValueChange={(value) => setEditedEntry((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editedEntry.description}
                onChange={(e) => setEditedEntry((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter transaction description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">Memo (Optional)</Label>
              <Textarea
                id="memo"
                value={editedEntry.memo || ""}
                onChange={(e) => setEditedEntry((prev) => ({ ...prev, memo: e.target.value }))}
                placeholder="Additional notes about this transaction"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="cleared"
                checked={editedEntry.status === "cleared"}
                onCheckedChange={(checked) =>
                  setEditedEntry((prev) => ({
                    ...prev,
                    status: checked ? "cleared" : "pending",
                  }))
                }
              />
              <Label htmlFor="cleared">Mark as cleared</Label>
            </div>

            <div className="space-y-2">
              <Label>Receipt Gallery</Label>
              <ReceiptUploader
                onUpload={(files) => {
                  // Handle receipt upload
                  console.log("Uploaded files:", files)
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">Postings</h3>
                {isBalanced ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Balanced
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Unbalanced
                  </Badge>
                )}
              </div>
              <Button onClick={addPosting} size="sm">
                <Plus className="mr-1 h-3 w-3" />
                Add Posting
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editedEntry.postings.map((posting, index) => {
                    const suggestion = getSuggestionForAccount(posting.account)
                    return (
                      <TableRow key={index}>
                        <TableCell className="relative">
                          <Select
                            value={posting.account}
                            onValueChange={(value) => updatePosting(index, "account", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accountSuggestions.map((account) => (
                                <SelectItem key={account} value={account}>
                                  {account}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {suggestion && (
                            <div className="absolute -bottom-6 left-0 right-0">
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span>Suggested: {suggestion.suggested}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={() => updatePosting(index, "account", suggestion.suggested)}
                                >
                                  <Check className="h-2 w-2" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0"
                                  onClick={() => {
                                    /* Dismiss suggestion */
                                  }}
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={posting.debit || ""}
                            onChange={(e) =>
                              updatePosting(index, "debit", Number.parseFloat(e.target.value) || undefined)
                            }
                            placeholder="0.00"
                            className="font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={posting.credit || ""}
                            onChange={(e) =>
                              updatePosting(index, "credit", Number.parseFloat(e.target.value) || undefined)
                            }
                            placeholder="0.00"
                            className="font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={posting.currency}
                            onValueChange={(value) => updatePosting(index, "currency", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={posting.notes || ""}
                            onChange={(e) => updatePosting(index, "notes", e.target.value)}
                            placeholder="Optional notes"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePosting(index)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isBalanced}>
            Save Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
