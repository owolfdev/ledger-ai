"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "@/components/reports-view"

interface PeriodSelectorProps {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

export function PeriodSelector({ dateRange, onDateRangeChange }: PeriodSelectorProps) {
  const handlePeriodChange = (period: DateRange["period"]) => {
    const now = new Date()
    let from: Date
    let to: Date = now

    switch (period) {
      case "monthly":
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3)
        from = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case "yearly":
        from = new Date(now.getFullYear(), 0, 1)
        break
      case "custom":
        from = dateRange.from
        to = dateRange.to
        break
    }

    onDateRangeChange({ from, to, period })
  }

  const handleCustomDateChange = (field: "from" | "to", date: Date | undefined) => {
    if (date) {
      onDateRangeChange({
        ...dateRange,
        [field]: date,
        period: "custom",
      })
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Period:</span>
        <Select value={dateRange.period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">From:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-40 justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.from, "MMM dd, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => handleCustomDateChange("from", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">To:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-40 justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.to, "MMM dd, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(date) => handleCustomDateChange("to", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
