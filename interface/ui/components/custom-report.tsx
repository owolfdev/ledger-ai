"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AccountTree } from "@/components/account-tree"
import { Plus, Play, Save } from "lucide-react"
import type { DateRange } from "@/components/reports-view"

interface CustomReportProps {
  dateRange: DateRange
}

interface ReportFilter {
  id: string
  field: string
  operator: string
  value: string
}

const availableAccounts = [
  "Assets:Bank:Checking",
  "Assets:Bank:Savings",
  "Assets:Cash",
  "Expenses:Office:Supplies",
  "Expenses:Travel:Meals",
  "Income:Consulting",
  "Income:Sales",
  "Liabilities:CreditCard:Visa",
]

export function CustomReport({ dateRange }: CustomReportProps) {
  const [reportName, setReportName] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [filters, setFilters] = useState<ReportFilter[]>([])
  const [reportData, setReportData] = useState<any[]>([])
  const [hasRunReport, setHasRunReport] = useState(false)

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: Math.random().toString(36).substr(2, 9),
      field: "amount",
      operator: "greater_than",
      value: "",
    }
    setFilters([...filters, newFilter])
  }

  const updateFilter = (id: string, field: keyof ReportFilter, value: string) => {
    setFilters(filters.map((filter) => (filter.id === id ? { ...filter, [field]: value } : filter)))
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter((filter) => filter.id !== id))
  }

  const toggleAccount = (account: string) => {
    setSelectedAccounts((prev) => (prev.includes(account) ? prev.filter((a) => a !== account) : [...prev, account]))
  }

  const runReport = () => {
    // Simulate running custom report
    const mockData = selectedAccounts.map((account) => ({
      name: account,
      balance: Math.floor(Math.random() * 10000) + 1000,
      type: account.startsWith("Assets") ? "asset" : account.startsWith("Income") ? "income" : "expense",
    }))

    setReportData(mockData)
    setHasRunReport(true)
  }

  const saveReport = () => {
    // Simulate saving report configuration
    console.log("Saving report:", { reportName, selectedAccounts, filters })
  }

  return (
    <div className="space-y-6">
      {/* Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Name */}
          <div className="space-y-2">
            <Label htmlFor="report-name">Report Name</Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
            />
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <Label>Select Accounts</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-4">
              {availableAccounts.map((account) => (
                <div key={account} className="flex items-center space-x-2">
                  <Checkbox
                    id={account}
                    checked={selectedAccounts.includes(account)}
                    onCheckedChange={() => toggleAccount(account)}
                  />
                  <Label htmlFor={account} className="text-sm font-mono">
                    {account}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Filters</Label>
              <Button onClick={addFilter} size="sm" variant="outline">
                <Plus className="mr-1 h-3 w-3" />
                Add Filter
              </Button>
            </div>

            {filters.length > 0 && (
              <div className="space-y-2">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Select value={filter.field} onValueChange={(value) => updateFilter(filter.id, "field", value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateFilter(filter.id, "operator", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="greater_than">Greater than</SelectItem>
                        <SelectItem value="less_than">Less than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                    />

                    <Button
                      onClick={() => removeFilter(filter.id)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button onClick={runReport} disabled={selectedAccounts.length === 0}>
              <Play className="mr-1 h-3 w-3" />
              Run Report
            </Button>
            <Button onClick={saveReport} variant="outline" disabled={!reportName}>
              <Save className="mr-1 h-3 w-3" />
              Save Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {hasRunReport && reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{reportName || "Custom Report"} Results</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountTree accounts={reportData} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
