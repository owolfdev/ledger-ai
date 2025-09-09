"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"

interface Account {
  name: string
  balance: number
  type: "asset" | "liability" | "equity" | "income" | "expense"
  children?: Account[]
}

interface AccountTreeProps {
  accounts: Account[]
}

export function AccountTree({ accounts }: AccountTreeProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())

  const toggleExpanded = (accountName: string) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(accountName)) {
      newExpanded.delete(accountName)
    } else {
      newExpanded.add(accountName)
    }
    setExpandedAccounts(newExpanded)
  }

  const getAccountColor = (type: Account["type"], balance: number) => {
    if (balance === 0) return "text-muted-foreground"

    switch (type) {
      case "asset":
        return balance >= 0 ? "text-blue-600" : "text-red-600"
      case "liability":
        return balance >= 0 ? "text-orange-600" : "text-green-600"
      case "equity":
        return balance >= 0 ? "text-purple-600" : "text-red-600"
      case "income":
        return balance >= 0 ? "text-green-600" : "text-red-600"
      case "expense":
        return balance >= 0 ? "text-red-600" : "text-green-600"
      default:
        return "text-foreground"
    }
  }

  const formatBalance = (balance: number) => {
    return `$${Math.abs(balance).toLocaleString()}`
  }

  const renderAccount = (account: Account, level = 0) => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedAccounts.has(account.name)
    const paddingLeft = level * 20

    return (
      <div key={account.name}>
        <div
          className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors"
          style={{ paddingLeft: paddingLeft + 12 }}
        >
          <div className="flex items-center space-x-2">
            {hasChildren ? (
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => toggleExpanded(account.name)}>
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            ) : (
              <div className="w-4" />
            )}
            <span className="font-mono text-sm">{account.name.split(":").pop()}</span>
          </div>
          <span className={`font-mono text-sm font-medium ${getAccountColor(account.type, account.balance)}`}>
            {formatBalance(account.balance)}
          </span>
        </div>

        {hasChildren && isExpanded && <div>{account.children!.map((child) => renderAccount(child, level + 1))}</div>}
      </div>
    )
  }

  // Group accounts by hierarchy
  const groupedAccounts = accounts.reduce(
    (acc, account) => {
      const parts = account.name.split(":")
      const rootCategory = parts[0]

      if (!acc[rootCategory]) {
        acc[rootCategory] = []
      }
      acc[rootCategory].push(account)
      return acc
    },
    {} as Record<string, Account[]>,
  )

  return (
    <div className="space-y-1">
      {Object.entries(groupedAccounts).map(([category, categoryAccounts]) => (
        <div key={category}>
          <div className="font-semibold text-sm text-muted-foreground mb-2 px-3">{category}</div>
          {categoryAccounts.map((account) => renderAccount(account))}
        </div>
      ))}
    </div>
  )
}
