"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccountTree } from "@/components/account-tree"
import { RevenueChart } from "@/components/revenue-chart"
import type { DateRange } from "@/components/reports-view"

interface ProfitLossReportProps {
  dateRange: DateRange
}

const mockPLData = {
  revenue: {
    "Income:Consulting": 45000,
    "Income:Sales": 12000,
    "Income:Other": 3000,
  },
  expenses: {
    "Expenses:Office:Supplies": 2500,
    "Expenses:Travel:Meals": 1800,
    "Expenses:Utilities:Internet": 1200,
    "Expenses:Marketing:Advertising": 3500,
    "Expenses:Professional:Legal": 2000,
  },
}

export function ProfitLossReport({ dateRange }: ProfitLossReportProps) {
  const totalRevenue = Object.values(mockPLData.revenue).reduce((sum, value) => sum + value, 0)
  const totalExpenses = Object.values(mockPLData.expenses).reduce((sum, value) => sum + value, 0)
  const netIncome = totalRevenue - totalExpenses

  const revenueData = Object.entries(mockPLData.revenue).map(([account, amount]) => ({
    account: account.split(":").pop() || account,
    amount,
    fullAccount: account,
  }))

  const expenseData = Object.entries(mockPLData.expenses).map(([account, amount]) => ({
    account: account.split(":").pop() || account,
    amount,
    fullAccount: account,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${netIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={expenseData} />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Account Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountTree
              accounts={Object.entries(mockPLData.revenue).map(([account, amount]) => ({
                name: account,
                balance: amount,
                type: "income",
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountTree
              accounts={Object.entries(mockPLData.expenses).map(([account, amount]) => ({
                name: account,
                balance: amount,
                type: "expense",
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
