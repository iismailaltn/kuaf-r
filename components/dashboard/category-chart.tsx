"use client"

import { ChartContainer } from "@/components/ui/chart"
import { Cell, Pie, PieChart } from "recharts"
import { ArrowUpRight } from "lucide-react"

const data = [
  { name: "Apple MacBook Air M2", value: 25, color: "#6366f1" },
  { name: "Apple Watch Series 9", value: 20, color: "#3b82f6" },
  { name: "Acoustics JBL Charge 5", value: 18, color: "#f59e0b" },
  { name: "Acoustics Divoom SongBird-HQ", value: 22, color: "#ef4444" },
  { name: "Apple AirPods Pro 2", value: 15, color: "#22c55e" },
]

const chartConfig = {
  value: { label: "Satis" },
}

export function CategoryChart() {
  return (
    <div className="p-5 bg-card rounded-2xl border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Kategoriye Gore Satis</h3>
          <p className="text-xs text-muted-foreground">Bu ay gecen aya gore</p>
        </div>
        <button className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <ChartContainer config={chartConfig} className="h-[140px] w-[140px]">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
