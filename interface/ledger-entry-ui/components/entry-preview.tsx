"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, AlertCircle } from "lucide-react"

interface Posting {
  account: string
  debit?: number
  credit?: number
  currency: string
}

interface ParsedEntry {
  date: string
  description: string
  postings: Posting[]
  isBalanced: boolean
  totalAmount: number
  currency: string
}

interface EntryPreviewProps {
  entry: ParsedEntry
  onAccept: () => void
  onReject: () => void
}

export function EntryPreview({ entry, onAccept, onReject }: EntryPreviewProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Entry Preview</CardTitle>
          <div className="flex items-center space-x-2">
            {entry.isBalanced ? (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entry Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Date:</span>
            <span className="ml-2 font-mono">{entry.date}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Amount:</span>
            <span className="ml-2 font-mono font-semibold">
              {entry.currency} {entry.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <span className="text-muted-foreground text-sm">Description:</span>
          <p className="mt-1 font-medium">{entry.description}</p>
        </div>

        {/* Postings Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h4 className="font-medium text-sm">Postings</h4>
          </div>
          <div className="divide-y">
            {entry.postings.map((posting, index) => (
              <div key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1">
                  <span className="font-mono text-sm">{posting.account}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm font-mono">
                  <div className="w-20 text-right">
                    {posting.debit ? `${posting.currency} ${posting.debit.toFixed(2)}` : "—"}
                  </div>
                  <div className="w-20 text-right">
                    {posting.credit ? `${posting.currency} ${posting.credit.toFixed(2)}` : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={onReject} className="flex items-center bg-transparent">
            <X className="mr-1 h-4 w-4" />
            Reject
          </Button>
          <Button onClick={onAccept} disabled={!entry.isBalanced} className="flex items-center">
            <Check className="mr-1 h-4 w-4" />
            Create Entry
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
