"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CashFlowChart } from "@/components/cash-flow-chart"
import { AccountTree } from "@/components/account-tree"
import type { DateRange } from "@/components/reports-view"

interface CashFlowReportProps {
  dateRange: DateRange
}

const mockCashFlowData = {
  operating: {
    "Cash from Operations": 45000,
    "Cash from Customers": 60000,
    "Cash to Suppliers": -15000,
  },
  investing: {
    "Equipment Purchase": -23000,
    "Investment Income": 2000,
  },
  financing: {
    "Loan Proceeds": 10000,
    "Loan Payments": -5000,
    "Owner Contributions": 15000,
  },
}

export function CashFlowReport({ dateRange }: CashFlowReportProps) {
  const operatingCashFlow = Object.values(mockCashFlowData.operating).reduce((sum, value) => sum + value, 0)
  const investingCashFlow = Object.values(mockCashFlowData.investing).reduce((sum, value) => sum + value, 0)
  const financingCashFlow = Object.values(mockCashFlowData.financing).reduce((sum, value) => sum + value, 0)
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

  const chartData = [
    { name: "Operating", value: operatingCashFlow, color: "#10b981" },
    { name: "Investing", value: investingCashFlow, color: "#3b82f6" },
    { name: "Financing", value: financingCashFlow, color: "#8b5cf6" },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operating Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${operatingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${operatingCashFlow.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Investing Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${investingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${investingCashFlow.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Financing Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${financingCashFlow.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${netCashFlow.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={chartData} />
        </CardContent>
      </Card>

      {/* Detailed Cash Flow Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Operating Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountTree
              accounts={Object.entries(mockCashFlowData.operating).map(([account, amount]) => ({
                name: account,
                balance: amount,
                type: amount >= 0 ? "income" : "expense",
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountTree
              accounts={Object.entries(mockCashFlowData.investing).map(([account, amount]) => ({
                name: account,
                balance: amount,
                type: amount >= 0 ? "income" : "expense",
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountTree
              accounts={Object.entries(mockCashFlowData.financing).map(([account, amount]) => ({
                name: account,
                balance: amount,
                type: amount >= 0 ? "income" : "expense",
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
