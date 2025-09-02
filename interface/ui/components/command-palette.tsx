"use client"

import { useState, useEffect } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Terminal, FileText, Receipt, BarChart3, Settings, CreditCard, Calculator } from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommandSelect: (command: string) => void
}

const quickCommands = [
  { id: "ex", label: "Record Expense", command: "ex -i ", icon: Terminal },
  { id: "in", label: "Record Income", command: "in -i ", icon: Terminal },
  { id: "as", label: "Record Asset Purchase", command: "as -i ", icon: Terminal },
  { id: "li", label: "Record Liability", command: "li -i ", icon: Terminal },
  { id: "tr", label: "Transfer Funds", command: "tr -f ", icon: Terminal },
]

const navigation = [
  { id: "terminal", label: "Go to Terminal", href: "/terminal", icon: Terminal },
  { id: "entries", label: "Go to Entries", href: "/entries", icon: FileText },
  { id: "receipts", label: "Go to Receipts", href: "/receipts", icon: Receipt },
  { id: "reports", label: "Go to Reports", href: "/reports", icon: BarChart3 },
  { id: "accounts", label: "Go to Accounts", href: "/accounts", icon: CreditCard },
  { id: "settings", label: "Go to Settings", href: "/settings", icon: Settings },
]

const accounts = [
  "Assets:Bank:Checking",
  "Assets:Bank:Savings",
  "Assets:Cash",
  "Expenses:Office:Supplies",
  "Expenses:Travel:Meals",
  "Expenses:Utilities:Internet",
  "Income:Consulting",
  "Income:Sales",
  "Liabilities:CreditCard:Visa",
]

export function CommandPalette({ open, onOpenChange, onCommandSelect }: CommandPaletteProps) {
  const [search, setSearch] = useState("")

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Commands">
          {quickCommands.map((cmd) => {
            const Icon = cmd.icon
            return (
              <CommandItem
                key={cmd.id}
                onSelect={() => {
                  onCommandSelect(cmd.command)
                  onOpenChange(false)
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {cmd.label}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem key={item.id}>
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Accounts">
          {accounts
            .filter((account) => account.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 5)
            .map((account) => (
              <CommandItem
                key={account}
                onSelect={() => {
                  onCommandSelect(account)
                  onOpenChange(false)
                }}
              >
                <Calculator className="mr-2 h-4 w-4" />
                {account}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
