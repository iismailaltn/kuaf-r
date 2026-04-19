"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"

const statusCards = [
  {
    label: "Yeni Siparis",
    value: 8,
    change: "12%",
    changeType: "positive" as const,
    color: "bg-blue-500",
  },
  {
    label: "Hazirlaniyor",
    value: 12,
    change: "5%",
    changeType: "positive" as const,
    color: "bg-amber-500",
  },
  {
    label: "Servise Hazir",
    value: 4,
    change: "2%",
    changeType: "negative" as const,
    color: "bg-green-500",
  },
  {
    label: "Tamamlandi",
    value: 23,
    change: "18%",
    changeType: "positive" as const,
    color: "bg-gray-500",
  },
]

const orders = [
  {
    id: "#ORD-001",
    table: "Table 4",
    items: "Grilled Salmon, Caesar Salad, Tiramisu",
    itemCount: 3,
    total: "58.97",
    time: "12:45 PM",
    waiter: "Maria S.",
    status: "hazirlaniyor",
  },
  {
    id: "#ORD-002",
    table: "Table 7",
    items: "Ribeye Steak, Wine",
    itemCount: 2,
    total: "72.50",
    time: "12:38 PM",
    waiter: "John D.",
    status: "hazir",
  },
  {
    id: "#ORD-003",
    table: "Table 1",
    items: "Pasta Carbonara x2, Bruschetta",
    itemCount: 3,
    total: "45.97",
    time: "12:30 PM",
    waiter: "Maria S.",
    status: "yeni",
  },
  {
    id: "#ORD-004",
    table: "Table 10",
    items: "Chicken Parmesan, Lemonade x2",
    itemCount: 3,
    total: "32.97",
    time: "12:25 PM",
    waiter: "Alex K.",
    status: "hazirlaniyor",
  },
  {
    id: "#ORD-005",
    table: "VIP 1",
    items: "Chef's Special, Wine Pairing",
    itemCount: 2,
    total: "125.00",
    time: "12:15 PM",
    waiter: "John D.",
    status: "tamamlandi",
  },
  {
    id: "#ORD-006",
    table: "Table 2",
    items: "Margherita Pizza, Tiramisu",
    itemCount: 2,
    total: "28.98",
    time: "12:10 PM",
    waiter: "Alex K.",
    status: "tamamlandi",
  },
  {
    id: "#ORD-007",
    table: "Table 5",
    items: "Seafood Platter, Champagne",
    itemCount: 2,
    total: "89.99",
    time: "12:00 PM",
    waiter: "Maria S.",
    status: "hazir",
  },
]

const statusColors: Record<string, string> = {
  "yeni": "bg-blue-100 text-blue-700 border-blue-200",
  "hazirlaniyor": "bg-amber-100 text-amber-700 border-amber-200",
  "hazir": "bg-green-100 text-green-700 border-green-200",
  "tamamlandi": "bg-gray-100 text-gray-700 border-gray-200",
}

export function OrdersView() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Mutfak Siparisleri</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card) => (
          <div
            key={card.label}
            className="p-4 bg-card rounded-2xl border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("w-1 h-8 rounded-full", card.color)} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {card.value}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium",
                  card.changeType === "positive"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {card.changeType === "positive" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {card.change}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">son saate gore</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Siparis ara"
                className="pl-9 w-48 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{orders.length} siparis</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-primary">
              <Download className="w-4 h-4 mr-1" />
              Disa aktar
            </Button>
            <Button variant="ghost" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-1" />
              Siralama: <span className="text-muted-foreground ml-1">en yeni</span>
            </Button>
            <Button className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" />
              Yeni siparis
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Badge variant="secondary" className="gap-1 rounded-lg">
            Aktif
            <X className="w-3 h-3 cursor-pointer" />
          </Badge>
          <Badge variant="secondary" className="gap-1 rounded-lg">
            Salonda
            <X className="w-3 h-3 cursor-pointer" />
          </Badge>
          <button className="text-sm text-muted-foreground hover:text-foreground">
            Tumunu temizle (2)
          </button>
          <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
            <span>1 / 3</span>
            <button className="p-1 hover:bg-muted rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-muted rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox />
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Siparis No
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Masa
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Urunler
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Toplam
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Saat
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Garson
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Durum
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell className="font-medium">{order.table}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm truncate max-w-48">{order.items}</p>
                    <p className="text-xs text-muted-foreground">{order.itemCount} urun</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">${order.total}</TableCell>
                <TableCell>{order.time}</TableCell>
                <TableCell>{order.waiter}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-lg font-normal capitalize",
                      statusColors[order.status]
                    )}
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button className="p-1 hover:bg-muted rounded">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
