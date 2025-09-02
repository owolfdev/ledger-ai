"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfitLossReport } from "@/components/profit-loss-report"
import { BalanceSheetReport } from "@/components/balance-sheet-report"
import { CashFlowReport } from "@/components/cash-flow-report"
import { CustomReport } from "@/components/custom-report"
import { PeriodSelector } from "@/components/period-selector"
import { Button } from "@/components/ui/button"
import { Download, FileText, TrendingUp, DollarSign, BarChart3 } from "lucide-react"

export interface DateRange {
  from: Date
  to: Date
  period: "monthly" | "quarterly" | "yearly" | "custom"
}

export function ReportsView() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    to: new Date(), // Today
    period: "yearly",
  })

  const handleExport = (format: "csv" | "pdf") => {
    // Simulate export functionality
    console.log(`Exporting report as ${format.toUpperCase()}`)
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Report Period</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                <Download className="mr-1 h-3 w-3" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                <FileText className="mr-1 h-3 w-3" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PeriodSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="profit-loss" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profit-loss" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>P&L</span>
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Balance Sheet</span>
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Cash Flow</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Custom</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss" className="mt-6">
          <ProfitLossReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="balance-sheet" className="mt-6">
          <BalanceSheetReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="cash-flow" className="mt-6">
          <CashFlowReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <CustomReport dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
