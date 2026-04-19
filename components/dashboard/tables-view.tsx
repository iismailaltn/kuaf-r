"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, Users, Clock, DollarSign } from "lucide-react"

interface Table {
  id: number
  name: string
  seats: number
  status: "available" | "occupied" | "reserved" | "cleaning"
  guests?: number
  order?: {
    items: number
    total: number
    duration: number
  }
}

const tables: Table[] = [
  { id: 1, name: "Table 1", seats: 4, status: "occupied", guests: 3, order: { items: 5, total: 78.50, duration: 45 } },
  { id: 2, name: "Table 2", seats: 2, status: "available" },
  { id: 3, name: "Table 3", seats: 6, status: "reserved" },
  { id: 4, name: "Table 4", seats: 4, status: "occupied", guests: 4, order: { items: 8, total: 125.00, duration: 30 } },
  { id: 5, name: "Table 5", seats: 8, status: "available" },
  { id: 6, name: "Table 6", seats: 4, status: "cleaning" },
  { id: 7, name: "Table 7", seats: 2, status: "occupied", guests: 2, order: { items: 3, total: 42.00, duration: 15 } },
  { id: 8, name: "Table 8", seats: 6, status: "reserved" },
  { id: 9, name: "Table 9", seats: 4, status: "available" },
  { id: 10, name: "Table 10", seats: 4, status: "occupied", guests: 2, order: { items: 4, total: 65.75, duration: 60 } },
  { id: 11, name: "VIP 1", seats: 10, status: "reserved" },
  { id: 12, name: "VIP 2", seats: 8, status: "available" },
]

const statusConfig = {
  available: { color: "bg-green-500", bgColor: "bg-green-50 border-green-200", label: "Musait" },
  occupied: { color: "bg-amber-500", bgColor: "bg-amber-50 border-amber-200", label: "Dolu" },
  reserved: { color: "bg-blue-500", bgColor: "bg-blue-50 border-blue-200", label: "Rezerve" },
  cleaning: { color: "bg-gray-400", bgColor: "bg-gray-50 border-gray-200", label: "Temizleniyor" },
}

const statusSummary = [
  { label: "Musait", count: tables.filter(t => t.status === "available").length, color: "bg-green-500" },
  { label: "Dolu", count: tables.filter(t => t.status === "occupied").length, color: "bg-amber-500" },
  { label: "Rezerve", count: tables.filter(t => t.status === "reserved").length, color: "bg-blue-500" },
  { label: "Temizleniyor", count: tables.filter(t => t.status === "cleaning").length, color: "bg-gray-400" },
]

export function TablesView() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Masa Yonetimi</h1>
        <Button className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" />
          Masa ekle
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusSummary.map((status) => (
          <div
            key={status.label}
            className="p-4 bg-card rounded-2xl border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("w-3 h-3 rounded-full", status.color)} />
              <span className="text-sm text-muted-foreground">{status.label}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{status.count}</span>
          </div>
        ))}
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const config = statusConfig[table.status]
          return (
            <div
              key={table.id}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md",
                config.bgColor
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{table.name}</h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    table.status === "available" && "bg-green-100 text-green-700 border-green-300",
                    table.status === "occupied" && "bg-amber-100 text-amber-700 border-amber-300",
                    table.status === "reserved" && "bg-blue-100 text-blue-700 border-blue-300",
                    table.status === "cleaning" && "bg-gray-100 text-gray-700 border-gray-300"
                  )}
                >
                  {config.label}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span>{table.guests || 0}/{table.seats} kisi</span>
              </div>

              {table.order && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{table.order.items} urun</span>
                    <span className="font-medium text-foreground">${table.order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{table.order.duration} min</span>
                  </div>
                </div>
              )}

              {table.status === "available" && (
                <Button size="sm" className="w-full mt-3 rounded-lg" variant="outline">
                  Musteri oturt
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
