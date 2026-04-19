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
  X,
} from "lucide-react"

const categoryCards = [
  { label: "Ana Yemekler", count: 24, color: "bg-blue-500" },
  { label: "Baslangiclar", count: 18, color: "bg-amber-500" },
  { label: "Tatlilar", count: 12, color: "bg-pink-500" },
  { label: "Icecekler", count: 32, color: "bg-green-500" },
]

const products = [
  {
    id: "PRD001",
    name: "Grilled Salmon",
    description: "Fresh Atlantic salmon with herbs",
    category: "Main Courses",
    price: "24.99",
    cost: "8.50",
    stock: 45,
    status: "mevcut",
  },
  {
    id: "PRD002",
    name: "Caesar Salad",
    description: "Classic Caesar with croutons",
    category: "Appetizers",
    price: "12.99",
    cost: "3.20",
    stock: 0,
    status: "stokta yok",
  },
  {
    id: "PRD003",
    name: "Tiramisu",
    description: "Italian coffee-flavored dessert",
    category: "Desserts",
    price: "8.99",
    cost: "2.50",
    stock: 20,
    status: "mevcut",
  },
  {
    id: "PRD004",
    name: "Ribeye Steak",
    description: "12oz prime ribeye, aged 28 days",
    category: "Main Courses",
    price: "38.99",
    cost: "15.00",
    stock: 12,
    status: "dusuk stok",
  },
  {
    id: "PRD005",
    name: "Fresh Lemonade",
    description: "House-made with fresh lemons",
    category: "Beverages",
    price: "4.99",
    cost: "0.80",
    stock: 100,
    status: "mevcut",
  },
  {
    id: "PRD006",
    name: "Bruschetta",
    description: "Toasted bread with tomato basil",
    category: "Appetizers",
    price: "9.99",
    cost: "2.00",
    stock: 30,
    status: "mevcut",
  },
  {
    id: "PRD007",
    name: "Chocolate Lava Cake",
    description: "Warm cake with molten center",
    category: "Desserts",
    price: "10.99",
    cost: "3.00",
    stock: 8,
    status: "dusuk stok",
  },
]

const statusColors: Record<string, string> = {
  "mevcut": "bg-green-100 text-green-700 border-green-200",
  "stokta yok": "bg-red-100 text-red-700 border-red-200",
  "dusuk stok": "bg-amber-100 text-amber-700 border-amber-200",
}

export function ProductsView() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Menu Urunleri</h1>
        <Button className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" />
          Urun ekle
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryCards.map((card) => (
          <div
            key={card.label}
            className="p-4 bg-card rounded-2xl border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("w-1 h-8 rounded-full", card.color)} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{card.count}</span>
            <span className="text-sm text-muted-foreground ml-1">urun</span>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Urun ara"
                className="pl-9 w-48 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{products.length} urun</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-primary">
              <Download className="w-4 h-4 mr-1" />
              Disa aktar
            </Button>
            <Button variant="ghost" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-1" />
              Sirala
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Badge variant="secondary" className="gap-1 rounded-lg">
            Ana Yemekler
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
                Urun
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Kategori
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Fiyat
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Maliyet
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Stok
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Durum
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.description}</p>
                  </div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="font-medium">${product.price}</TableCell>
                <TableCell className="text-muted-foreground">${product.cost}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-lg font-normal",
                      statusColors[product.status]
                    )}
                  >
                    {product.status}
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
