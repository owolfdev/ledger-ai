"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EntryEditor } from "@/components/entry-editor"
import {
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle,
  MoreHorizontal,
  FileText,
  Terminal,
  X,
  Paperclip,
} from "lucide-react"

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
  }>
}

const mockEntries: Entry[] = [
  {
    id: "1",
    date: "2024-01-15",
    description: "Coffee at Starbucks",
    amount: -5.5,
    currency: "USD",
    type: "expense",
    accounts: ["Expenses:Meals:Coffee", "Assets:Bank:Checking"],
    status: "cleared",
    attachments: 1,
    postings: [
      { account: "Expenses:Meals:Coffee", debit: 5.5, currency: "USD" },
      { account: "Assets:Bank:Checking", credit: 5.5, currency: "USD" },
    ],
  },
  {
    id: "2",
    date: "2024-01-14",
    description: "Consulting payment from Acme Corp",
    amount: 5000.0,
    currency: "USD",
    type: "income",
    accounts: ["Income:Consulting", "Assets:Bank:Checking"],
    status: "cleared",
    attachments: 0,
    postings: [
      { account: "Assets:Bank:Checking", debit: 5000.0, currency: "USD" },
      { account: "Income:Consulting", credit: 5000.0, currency: "USD" },
    ],
  },
  {
    id: "3",
    date: "2024-01-13",
    description: "MacBook Pro purchase",
    amount: -2499.0,
    currency: "USD",
    type: "asset",
    accounts: ["Assets:Equipment:Computers", "Liabilities:CreditCard:Visa"],
    status: "pending",
    attachments: 2,
    postings: [
      { account: "Assets:Equipment:Computers", debit: 2499.0, currency: "USD" },
      { account: "Liabilities:CreditCard:Visa", credit: 2499.0, currency: "USD" },
    ],
  },
]

const typeColors = {
  expense: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  income: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  asset: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  liability: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  transfer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
}

export function EntriesList() {
  const [entries, setEntries] = useState<Entry[]>(mockEntries)
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.accounts.some((account) => account.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === "all" || entry.type === typeFilter
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(filteredEntries.map((entry) => entry.id))
    } else {
      setSelectedEntries([])
    }
  }

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries((prev) => [...prev, entryId])
    } else {
      setSelectedEntries((prev) => prev.filter((id) => id !== entryId))
    }
  }

  const handleBulkDelete = () => {
    setEntries((prev) => prev.filter((entry) => !selectedEntries.includes(entry.id)))
    setSelectedEntries([])
    setShowDeleteDialog(false)
  }

  const handleBulkMarkCleared = () => {
    setEntries((prev) =>
      prev.map((entry) => (selectedEntries.includes(entry.id) ? { ...entry, status: "cleared" as const } : entry)),
    )
    setSelectedEntries([])
  }

  const clearFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
    setStatusFilter("all")
  }

  const hasActiveFilters = searchQuery || typeFilter !== "all" || statusFilter !== "all"

  if (filteredEntries.length === 0 && !hasActiveFilters) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Get started by creating your first entry using the Smart Terminal. Try a command like:
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <code className="font-mono text-sm">ex -i coffee 5.50 -v Starbucks</code>
          </div>
          <Button asChild>
            <a href="/terminal" className="flex items-center">
              <Terminal className="mr-2 h-4 w-4" />
              Open Terminal
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries, accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Type: {typeFilter === "all" ? "All" : typeFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTypeFilter("all")}>All Types</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("expense")}>Expenses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("income")}>Income</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("asset")}>Assets</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("liability")}>Liabilities</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("transfer")}>Transfers</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center bg-transparent">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cleared")}>Cleared</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedEntries.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{selectedEntries.length} entries selected</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-1 h-3 w-3" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkMarkCleared}>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Mark Cleared
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Accounts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedEntries.includes(entry.id)}
                      onCheckedChange={(checked) => handleSelectEntry(entry.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{entry.date}</TableCell>
                  <TableCell
                    className="font-medium cursor-pointer hover:text-primary"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {entry.description}
                  </TableCell>
                  <TableCell className="font-mono">
                    <span className={entry.amount >= 0 ? "text-green-600" : "text-red-600"}>
                      {entry.currency} {Math.abs(entry.amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entry.accounts.slice(0, 2).map((account, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {account.split(":").pop()}
                        </Badge>
                      ))}
                      {entry.accounts.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{entry.accounts.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "cleared" ? "default" : "secondary"}>{entry.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={typeColors[entry.type]}>{entry.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {entry.attachments > 0 && (
                      <div className="flex items-center text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span className="text-xs ml-1">{entry.attachments}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedEntry(entry)}>Edit Entry</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Entry Editor Dialog */}
      {selectedEntry && (
        <EntryEditor
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          onSave={(updatedEntry) => {
            setEntries((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)))
            setSelectedEntry(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entries</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedEntries.length} entries? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
