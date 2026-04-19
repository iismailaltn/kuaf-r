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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

const summaryCards = [
  { label: "Toplam Kalem", value: 156, icon: Package, color: "text-blue-500" },
  { label: "Dusuk Stok", value: 12, icon: AlertTriangle, color: "text-amber-500" },
  { label: "Stokta Yok", value: 5, icon: AlertTriangle, color: "text-red-500" },
  { label: "Kategori", value: 8, icon: Package, color: "text-green-500" },
]

const inventoryItems = [
  {
    id: "INV001",
    name: "Fresh Salmon",
    category: "Seafood",
    quantity: 25,
    unit: "kg",
    minStock: 10,
    supplier: "Ocean Fresh Co.",
    lastOrdered: "2024-01-15",
    status: "yeterli",
  },
  {
    id: "INV002",
    name: "Olive Oil",
    category: "Oils",
    quantity: 8,
    unit: "L",
    minStock: 15,
    supplier: "Mediterranean Imports",
    lastOrdered: "2024-01-10",
    status: "dusuk stok",
  },
  {
    id: "INV003",
    name: "Chicken Breast",
    category: "Poultry",
    quantity: 0,
    unit: "kg",
    minStock: 20,
    supplier: "Farm Direct",
    lastOrdered: "2024-01-18",
    status: "stokta yok",
  },
  {
    id: "INV004",
    name: "Parmesan Cheese",
    category: "Dairy",
    quantity: 12,
    unit: "kg",
    minStock: 5,
    supplier: "Italian Delights",
    lastOrdered: "2024-01-12",
    status: "yeterli",
  },
  {
    id: "INV005",
    name: "Fresh Basil",
    category: "Herbs",
    quantity: 3,
    unit: "bunches",
    minStock: 10,
    supplier: "Local Farm",
    lastOrdered: "2024-01-19",
    status: "dusuk stok",
  },
  {
    id: "INV006",
    name: "Flour (All Purpose)",
    category: "Dry Goods",
    quantity: 50,
    unit: "kg",
    minStock: 25,
    supplier: "Mill Supply",
    lastOrdered: "2024-01-08",
    status: "yeterli",
  },
  {
    id: "INV007",
    name: "Heavy Cream",
    category: "Dairy",
    quantity: 0,
    unit: "L",
    minStock: 10,
    supplier: "Dairy Fresh",
    lastOrdered: "2024-01-17",
    status: "stokta yok",
  },
]

const statusColors: Record<string, string> = {
  "yeterli": "bg-green-100 text-green-700 border-green-200",
  "dusuk stok": "bg-amber-100 text-amber-700 border-amber-200",
  "stokta yok": "bg-red-100 text-red-700 border-red-200",
}

export function InventoryView() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Stok Yonetimi</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">
            <Download className="w-4 h-4 mr-1" />
            Disa aktar
          </Button>
          <Button className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" />
            Kalem ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="p-4 bg-card rounded-2xl border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-5 h-5", card.color)} />
                <span className="text-sm text-muted-foreground">{card.label}</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{card.value}</span>
            </div>
          )
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Stokta ara"
                className="pl-9 w-48 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{inventoryItems.length} kalem</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-1" />
              Sirala
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Badge variant="secondary" className="gap-1 rounded-lg">
            Dusuk Stok
            <X className="w-3 h-3 cursor-pointer" />
          </Badge>
          <button className="text-sm text-muted-foreground hover:text-foreground">
            Tumunu temizle (1)
          </button>
          <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
            <span>1 / 1</span>
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
                Kalem
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Kategori
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Miktar
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Min Stok
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Tedarikci
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Durum
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {item.id}</p>
                  </div>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="font-medium">
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.minStock} {item.unit}
                </TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-lg font-normal",
                      statusColors[item.status]
                    )}
                  >
                    {item.status}
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
