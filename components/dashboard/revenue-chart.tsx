"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ArrowUpRight } from "lucide-react"

const data = [
  { date: "1 AUG", revenue: 8000 },
  { date: "2 AUG", revenue: 12000 },
  { date: "3 AUG", revenue: 9000 },
  { date: "4 AUG", revenue: 14867, highlighted: true },
  { date: "5 AUG", revenue: 11000 },
  { date: "6 AUG", revenue: 18000 },
  { date: "7 AUG", revenue: 22000 },
  { date: "8 AUG", revenue: 15000 },
]

const chartConfig = {
  revenue: {
    label: "Ciro",
    color: "hsl(var(--chart-1))",
  },
}

export function RevenueChart() {
  return (
    <div className="p-5 bg-card rounded-2xl border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Ciro</h3>
          <p className="text-xs text-muted-foreground">Bu ay gecen aya gore</p>
        </div>
        <button className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <ChartContainer config={chartConfig} className="h-[180px] w-full">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [`$${Number(value).toLocaleString()}`, "Ciro"]}
              />
            }
          />
          <Bar
            dataKey="revenue"
            fill="hsl(var(--chart-1))"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
