"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface RevenueChartProps {
  data: Array<{
    account: string
    amount: number
    fullAccount: string
  }>
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"]

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.account,
    value: Math.abs(item.amount),
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
