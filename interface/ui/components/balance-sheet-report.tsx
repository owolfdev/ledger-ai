"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccountTree } from "@/components/account-tree"
import type { DateRange } from "@/components/reports-view"

interface BalanceSheetReportProps {
  dateRange: DateRange
}

const mockBalanceSheetData = {
  assets: {
    current: {
      "Assets:Bank:Checking": 25000,
      "Assets:Bank:Savings": 50000,
      "Assets:Cash": 2000,
    },
    fixed: {
      "Assets:Equipment:Computers": 15000,
      "Assets:Equipment:Furniture": 8000,
    },
  },
  liabilities: {
    current: {
      "Liabilities:CreditCard:Visa": 3500,
      "Liabilities:AccountsPayable": 2000,
    },
    longTerm: {
      "Liabilities:Loan:Equipment": 10000,
    },
  },
  equity: {
    "Equity:RetainedEarnings": 75000,
    "Equity:CurrentEarnings": 9500,
  },
}

export function BalanceSheetReport({ dateRange }: BalanceSheetReportProps) {
  const totalCurrentAssets = Object.values(mockBalanceSheetData.assets.current).reduce((sum, value) => sum + value, 0)
  const totalFixedAssets = Object.values(mockBalanceSheetData.assets.fixed).reduce((sum, value) => sum + value, 0)
  const totalAssets = totalCurrentAssets + totalFixedAssets

  const totalCurrentLiabilities = Object.values(mockBalanceSheetData.liabilities.current).reduce(
    (sum, value) => sum + value,
    0,
  )
  const totalLongTermLiabilities = Object.values(mockBalanceSheetData.liabilities.longTerm).reduce(
    (sum, value) => sum + value,
    0,
  )
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities

  const totalEquity = Object.values(mockBalanceSheetData.equity).reduce((sum, value) => sum + value, 0)

  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01

  return (
    <div className="space-y-6">
      {/* Balance Check */}
      <Card className={isBalanced ? "border-green-200" : "border-red-200"}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Balance Sheet Equation</span>
            <div className="flex items-center space-x-4 text-sm font-mono">
              <span>Assets: ${totalAssets.toLocaleString()}</span>
              <span>=</span>
              <span>Liabilities: ${totalLiabilities.toLocaleString()}</span>
              <span>+</span>
              <span>Equity: ${totalEquity.toLocaleString()}</span>
              <span className={`ml-4 font-semibold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                {isBalanced ? "✓ Balanced" : "⚠ Unbalanced"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalAssets.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Current: ${totalCurrentAssets.toLocaleString()} | Fixed: ${totalFixedAssets.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalLiabilities.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Current: ${totalCurrentLiabilities.toLocaleString()} | Long-term: $
              {totalLongTermLiabilities.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalEquity.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Account Trees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Assets</h4>
              <AccountTree
                accounts={Object.entries(mockBalanceSheetData.assets.current).map(([account, amount]) => ({
                  name: account,
                  balance: amount,
                  type: "asset",
                }))}
              />
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Fixed Assets</h4>
              <AccountTree
                accounts={Object.entries(mockBalanceSheetData.assets.fixed).map(([account, amount]) => ({
                  name: account,
                  balance: amount,
                  type: "asset",
                }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Liabilities</h4>
              <AccountTree
                accounts={Object.entries(mockBalanceSheetData.liabilities.current).map(([account, amount]) => ({
                  name: account,
                  balance: amount,
                  type: "liability",
                }))}
              />
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Long-term Liabilities</h4>
              <AccountTree
                accounts={Object.entries(mockBalanceSheetData.liabilities.longTerm).map(([account, amount]) => ({
                  name: account,
                  balance: amount,
                  type: "liability",
                }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountTree
              accounts={Object.entries(mockBalanceSheetData.equity).map(([account, amount]) => ({
                name: account,
                balance: amount,
                type: "equity",
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
