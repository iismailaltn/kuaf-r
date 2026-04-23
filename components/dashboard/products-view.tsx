"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  Package,
  Edit3,
  Trash2,
  DollarSign,
  Tag,
  Boxes,
  ImageIcon,
} from "lucide-react"

const categoryCards = [
  { label: "Ana Yemekler", count: 24, color: "bg-blue-500", bgColor: "bg-blue-500/10", textColor: "text-blue-600" },
  { label: "Baslangiclar", count: 18, color: "bg-amber-500", bgColor: "bg-amber-500/10", textColor: "text-amber-600" },
  { label: "Tatlilar", count: 12, color: "bg-pink-500", bgColor: "bg-pink-500/10", textColor: "text-pink-600" },
  { label: "Icecekler", count: 32, color: "bg-emerald-500", bgColor: "bg-emerald-500/10", textColor: "text-emerald-600" },
]

const initialProducts = [
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
  "mevcut": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "stokta yok": "bg-red-500/10 text-red-600 border-red-200",
  "dusuk stok": "bg-amber-500/10 text-amber-600 border-amber-200",
}

export function ProductsView() {
  const [products, setProducts] = useState(initialProducts)
  const [showAddCard, setShowAddCard] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    cost: "",
    stock: "0",
  })
  const [editProduct, setEditProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    cost: "",
    stock: "0",
  })
  const editingProductName =
    editingProductId
      ? products.find((p) => String(p.id) === String(editingProductId))?.name ?? ""
      : ""

  const loadProducts = async () => {
    const res = await fetch(`/api/products?ts=${Date.now()}`, { cache: "no-store" })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok || !Array.isArray(json?.rows)) return false

    const mapped = json.rows.map((row: any, index: number) => {
      const stock = Number(row.stock1 ?? row.stock ?? row.Stock ?? 0)
      const statusRaw = String(row.status ?? row.Status ?? "").trim().toLowerCase()
      const status = statusRaw || (stock <= 0 ? "stokta yok" : stock <= 10 ? "dusuk stok" : "mevcut")

      return {
        id: String(row.id ?? `PRD${String(index + 1).padStart(3, "0")}`),
        name: String(row.name ?? "Urun"),
        description: String(row.description ?? "-"),
        category: String(row.category ?? row.category_name ?? row.categoryName ?? row.categoryId ?? "-"),
        price: String(row.price ?? "0"),
        cost: String(row.cost ?? row.Cost ?? "0"),
        stock,
        status,
      }
    })

    setProducts(mapped)
    return true
  }

  const handleCreateProduct = async () => {
    const name = newProduct.name.trim()
    const category = newProduct.category.trim()
    const description = newProduct.description.trim()
    const price = newProduct.price.trim()
    const cost = newProduct.cost.trim()
    const stock = Number(newProduct.stock)

    if (!name || !category || !price || !cost || Number.isNaN(stock)) {
      alert("Lutfen zorunlu alanlari doldurun.")
      return
    }

    const categoryId = Number(category)
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price: Number(price),
        cost: Number(cost),
        stock,
        status: stock <= 0 ? "stokta yok" : stock <= 10 ? "dusuk stok" : "mevcut",
        categoryId: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 1,
        isAvailable: true,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Urun eklenemedi.")
      return
    }

    const loaded = await loadProducts()
    if (!loaded) {
      alert("Urun eklendi ama liste yenilenemedi. Sayfayi yenileyin.")
      return
    }

    setNewProduct({
      name: "",
      description: "",
      category: "",
      price: "",
      cost: "",
      stock: "0",
    })
    setShowAddCard(false)
  }

  const openEditProductCard = (productId: string) => {
    const current = products.find((p) => String(p.id) === String(productId))
    if (!current) return
    setEditingProductId(String(productId))
    setEditProduct({
      name: String(current.name ?? ""),
      description: String(current.description ?? ""),
      category: String(current.category ?? ""),
      price: String(current.price ?? ""),
      cost: String(current.cost ?? ""),
      stock: String(current.stock ?? "0"),
    })
    setOpenMenuId(null)
  }

  const handleUpdateProduct = async () => {
    if (!editingProductId) return
    const name = editProduct.name.trim()
    const description = editProduct.description.trim()
    const price = Number(editProduct.price)
    const cost = Number(editProduct.cost)
    const stock = Number(editProduct.stock)
    const categoryId = Number(editProduct.category)
    if (!name || Number.isNaN(price) || Number.isNaN(cost) || Number.isNaN(stock)) {
      alert("Lutfen zorunlu alanlari doldurun.")
      return
    }
    const res = await fetch(`/api/products/${editingProductId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price,
        cost,
        stock,
        status: stock <= 0 ? "stokta yok" : stock <= 10 ? "dusuk stok" : "mevcut",
        categoryId: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 1,
        isAvailable: true,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Urun guncellenemedi.")
      return
    }
    await loadProducts()
    setEditingProductId(null)
  }

  const handleRemoveProduct = async (productId: string) => {
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Urun silinemedi.")
      return
    }
    setOpenMenuId(null)
    await loadProducts()
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const loaded = await loadProducts()
      if (cancelled || !loaded) return
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Menu Urunleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tum menu urunlerini yonetin ve duzenleyin
          </p>
        </div>
        <Button className="rounded-xl gap-2" onClick={() => setShowAddCard(true)}>
          <Plus className="w-4 h-4" />
          Urun Ekle
        </Button>
      </div>

      {/* Add Product Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Yeni Urun Ekle</h2>
                    <p className="text-sm text-muted-foreground">Menuye yeni urun ekleyin</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddCard(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-6 space-y-5">
              {/* Image Upload Placeholder */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-border bg-muted/30">
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Urun Gorseli</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG - max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    Urun Adi *
                  </label>
                  <Input
                    placeholder="Ornek: Grilled Salmon"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Boxes className="w-4 h-4 text-muted-foreground" />
                    Kategori *
                  </label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct((p) => ({ ...p, category: value }))}
                  >
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Kategori secin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Ana Yemekler</SelectItem>
                      <SelectItem value="2">Baslangiclar</SelectItem>
                      <SelectItem value="3">Tatlilar</SelectItem>
                      <SelectItem value="4">Icecekler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Fiyat *
                  </label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Maliyet *
                  </label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct((p) => ({ ...p, cost: e.target.value }))}
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Stok *
                  </label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Aciklama</label>
                <Textarea
                  placeholder="Urun hakkinda kisa aciklama yazin..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => setShowAddCard(false)}
              >
                Vazgec
              </Button>
              <Button
                className="rounded-xl px-6"
                onClick={handleCreateProduct}
              >
                Urun Ekle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProductId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-amber-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Urun Duzenle</h2>
                    <p className="text-sm text-muted-foreground">{editingProductName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProductId(null)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-6 space-y-5">
              {/* Image Upload Placeholder */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-border bg-muted/30">
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Urun Gorseli</p>
                  <p className="text-sm text-muted-foreground">Gorseli degistirmek icin tiklayin</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    Urun Adi *
                  </label>
                  <Input
                    placeholder="Urun adi"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct((p) => ({ ...p, name: e.target.value }))}
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Boxes className="w-4 h-4 text-muted-foreground" />
                    Kategori *
                  </label>
                  <Select
                    value={editProduct.category}
                    onValueChange={(value) => setEditProduct((p) => ({ ...p, category: value }))}
                  >
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Kategori secin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Ana Yemekler</SelectItem>
                      <SelectItem value="2">Baslangiclar</SelectItem>
                      <SelectItem value="3">Tatlilar</SelectItem>
                      <SelectItem value="4">Icecekler</SelectItem>
                      <SelectItem value="Main Courses">Main Courses</SelectItem>
                      <SelectItem value="Appetizers">Appetizers</SelectItem>
                      <SelectItem value="Desserts">Desserts</SelectItem>
                      <SelectItem value="Beverages">Beverages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Fiyat *
                  </label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct((p) => ({ ...p, price: e.target.value }))}
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Maliyet *
                  </label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={editProduct.cost}
                    onChange={(e) => setEditProduct((p) => ({ ...p, cost: e.target.value }))}
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Stok *
                  </label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={editProduct.stock}
                    onChange={(e) => setEditProduct((p) => ({ ...p, stock: e.target.value }))}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Aciklama</label>
                <Textarea
                  placeholder="Urun hakkinda kisa aciklama yazin..."
                  value={editProduct.description}
                  onChange={(e) => setEditProduct((p) => ({ ...p, description: e.target.value }))}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <Button
                variant="ghost"
                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (editingProductId) handleRemoveProduct(editingProductId)
                  setEditingProductId(null)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Urunu Sil
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl px-6"
                  onClick={() => setEditingProductId(null)}
                >
                  Vazgec
                </Button>
                <Button
                  className="rounded-xl px-6"
                  onClick={handleUpdateProduct}
                >
                  Degisiklikleri Kaydet
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryCards.map((card) => (
          <div
            key={card.label}
            className="group p-5 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.bgColor)}>
                <Package className={cn("w-5 h-5", card.textColor)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.count}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Urun ara..."
                className="pl-10 w-56 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{products.length} urun</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <Download className="w-4 h-4" />
              Disa Aktar
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Sirala
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
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
            <button className="p-1 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-muted rounded-lg">
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
              <TableRow key={product.id} className="group">
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-lg font-normal">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-foreground">${product.price}</TableCell>
                <TableCell className="text-muted-foreground">${product.cost}</TableCell>
                <TableCell>
                  <span className={cn(
                    "font-medium",
                    product.stock <= 0 ? "text-red-600" : product.stock <= 10 ? "text-amber-600" : "text-foreground"
                  )}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("rounded-lg font-normal", statusColors[product.status])}
                  >
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="relative overflow-visible">
                  <div className="relative flex justify-end" ref={openMenuId === String(product.id) ? menuRef : null}>
                    <button
                      className="p-1.5 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                        const nextId = String(product.id)
                        setOpenMenuId((prev) => (prev === nextId ? null : nextId))
                        setMenuPosition({ top: rect.bottom + 6, left: rect.right - 144 })
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dropdown Menu */}
      {openMenuId && menuPosition && (
        <div
          ref={menuRef}
          className="fixed w-36 rounded-xl border border-border bg-popover shadow-xl z-[100] p-1.5 animate-in fade-in-0 zoom-in-95"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            onClick={() => openEditProductCard(openMenuId)}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Duzenle
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => handleRemoveProduct(openMenuId)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kaldir
          </button>
        </div>
      )}
    </div>
  )
}
