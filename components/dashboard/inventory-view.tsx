"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getProductCategoryId, getProductCategoryLabel, productCategoryOptions } from "@/lib/product-categories"
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
  Edit3,
  Trash2,
  DollarSign,
  Tag,
  Boxes,
  ImageIcon,
  Sparkles,
} from "lucide-react"

const summaryCards = [
  { label: "Toplam Urun", value: 86, icon: Package, color: "text-purple-500" },
  { label: "Dusuk Stok", value: 12, icon: AlertTriangle, color: "text-amber-500" },
  { label: "Stokta Yok", value: 5, icon: AlertTriangle, color: "text-red-500" },
  { label: "Kategori", value: 4, icon: Boxes, color: "text-blue-500" },
]

// Kuafor salonu stok urunleri
const initialInventory = [
  {
    id: "PRD001",
    name: "Loreal Professionnel Sampuan",
    description: "Yipranmis saclar icin onarici sampuan 500ml",
    category: "Sac Bakim",
    price: "450.00",
    cost: "280.00",
    stock: 25,
    minStock: 10,
    status: "mevcut",
  },
  {
    id: "PRD002",
    name: "Wella Koleston Boya",
    description: "Kalici sac boyasi - tum tonlar",
    category: "Sac Boyasi",
    price: "320.00",
    cost: "180.00",
    stock: 0,
    minStock: 15,
    status: "stokta yok",
  },
  {
    id: "PRD003",
    name: "Moroccan Oil Bakim Yagi",
    description: "Argan yagli sac bakim serumu 100ml",
    category: "Sac Bakim",
    price: "680.00",
    cost: "420.00",
    stock: 12,
    minStock: 5,
    status: "mevcut",
  },
  {
    id: "PRD004",
    name: "Schwarzkopf Sac Spreyi",
    description: "Guclu tutucu sac spreyi 300ml",
    category: "Styling",
    price: "280.00",
    cost: "150.00",
    stock: 8,
    minStock: 10,
    status: "dusuk stok",
  },
  {
    id: "PRD005",
    name: "Kerastase Sac Maskesi",
    description: "Yogun nemlendirici maske 200ml",
    category: "Sac Bakim",
    price: "890.00",
    cost: "550.00",
    stock: 18,
    minStock: 8,
    status: "mevcut",
  },
  {
    id: "PRD006",
    name: "MAC Fondoten",
    description: "Studio Fix Fluid SPF15 30ml",
    category: "Cilt & Makyaj",
    price: "1250.00",
    cost: "780.00",
    stock: 5,
    minStock: 8,
    status: "dusuk stok",
  },
  {
    id: "PRD007",
    name: "Redken Sac Jeli",
    description: "Islak etkili sac sekillendirici 150ml",
    category: "Styling",
    price: "380.00",
    cost: "220.00",
    stock: 30,
    minStock: 10,
    status: "mevcut",
  },
]

const statusColors: Record<string, string> = {
  "mevcut": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "dusuk stok": "bg-amber-100 text-amber-700 border-amber-200",
  "stokta yok": "bg-red-100 text-red-700 border-red-200",
}

const categoryOptions = productCategoryOptions

interface InventoryViewProps {
  businessUserId?: string
}

export function InventoryView({ businessUserId }: InventoryViewProps) {
  const [inventory, setInventory] = useState(initialInventory)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    cost: "",
    stock: "0",
    minStock: "10",
  })

  const [editProduct, setEditProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    cost: "",
    stock: "0",
    minStock: "10",
  })

  const loadProducts = async () => {
    if (!businessUserId) return false
    const res = await apiFetch(`/api/products?businessUserId=${encodeURIComponent(businessUserId)}&ts=${Date.now()}`, { cache: "no-store" })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok || !Array.isArray(json?.rows)) return false

    const mapped = json.rows.map((row: any, index: number) => {
      const stock = Number(row.stock1 ?? row.stock ?? row.Stock ?? 0)
      const minStock = Number(row.minStock ?? row.min_stock ?? 10)
      const statusRaw = String(row.status ?? row.Status ?? "").trim().toLowerCase()
      const status = statusRaw || (stock <= 0 ? "stokta yok" : stock <= minStock ? "dusuk stok" : "mevcut")

      const categoryId = getProductCategoryId(row)

      return {
        id: String(row.id ?? `PRD${String(index + 1).padStart(3, "0")}`),
        name: String(row.name ?? "Urun"),
        description: String(row.description ?? "-"),
        categoryId,
        category: getProductCategoryLabel(row),
        price: String(row.price ?? "0"),
        cost: String(row.cost ?? row.Cost ?? "0"),
        stock,
        minStock,
        status,
      }
    })

    setInventory(mapped)
    return true
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

  const handleCreateProduct = async () => {
    const name = newProduct.name.trim()
    const category = newProduct.category
    const description = newProduct.description.trim()
    const price = newProduct.price.trim()
    const cost = newProduct.cost.trim()
    const stock = Number(newProduct.stock)
    const minStock = Number(newProduct.minStock)

    if (!name || !category || !price || !cost || Number.isNaN(stock)) {
      alert("Lutfen zorunlu alanlari doldurun.")
      return
    }

    const categoryLabel = categoryOptions.find((c) => c.value === category)?.label ?? "Sac Bakim"
    const res = await apiFetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price: Number(price),
        cost: Number(cost),
        stock,
        status: stock <= 0 ? "stokta yok" : stock <= minStock ? "dusuk stok" : "mevcut",
        categoryId: Number(category),
        isAvailable: true,
        businessUserId,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? json?.error ?? "Urun eklenemedi.")
      return
    }
    await loadProducts()

    setNewProduct({
      name: "",
      description: "",
      category: "",
      price: "",
      cost: "",
      stock: "0",
      minStock: "10",
    })
    setShowAddModal(false)
  }

  const openEditModal = (productId: string) => {
    const current = inventory.find((p) => String(p.id) === String(productId))
    if (!current) return
    setEditingProductId(String(productId))
    setEditProduct({
      name: String(current.name ?? ""),
      description: String(current.description ?? ""),
      category: categoryOptions.find((c) => c.label === current.category || c.value === String(current.categoryId ?? current.category))?.value ?? "1",
      price: String(current.price ?? ""),
      cost: String(current.cost ?? ""),
      stock: String(current.stock ?? "0"),
      minStock: String(current.minStock ?? "10"),
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
    const minStock = Number(editProduct.minStock)
    const categoryId = Number(editProduct.category)

    if (!name || Number.isNaN(price) || Number.isNaN(cost) || Number.isNaN(stock)) {
      alert("Lutfen zorunlu alanlari doldurun.")
      return
    }

    const categoryLabel = categoryOptions.find((c) => c.value === editProduct.category)?.label ?? "Sac Bakim"
    const res = await apiFetch(`/api/products/${editingProductId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price,
        cost,
        stock,
        status: stock <= 0 ? "stokta yok" : stock <= minStock ? "dusuk stok" : "mevcut",
        categoryId: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 1,
        isAvailable: stock > 0,
        businessUserId,
      }),
    })

    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      // API basarisiz olsa bile local olarak guncelle
      setInventory((prev) =>
        prev.map((p) =>
          String(p.id) === editingProductId
            ? {
                ...p,
                name,
                description,
                category: categoryLabel,
                price: String(price),
                cost: String(cost),
                stock,
                minStock,
                status: stock <= 0 ? "stokta yok" : stock <= minStock ? "dusuk stok" : "mevcut",
              }
            : p
        )
      )
    } else {
      await loadProducts()
    }

    setEditingProductId(null)
  }

  const handleRemoveProduct = async (productId: string) => {
    const res = await apiFetch(`/api/products/${productId}?businessUserId=${encodeURIComponent(businessUserId ?? "")}`, { method: "DELETE" })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      // API basarisiz olsa bile local olarak sil
      setInventory((prev) => prev.filter((p) => String(p.id) !== productId))
    } else {
      await loadProducts()
    }
    setOpenMenuId(null)
  }

  const editingProductName = editingProductId
    ? inventory.find((p) => String(p.id) === String(editingProductId))?.name ?? ""
    : ""

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Summary hesaplama
  const totalProducts = inventory.length
  const lowStockCount = inventory.filter((p) => p.status === "dusuk stok").length
  const outOfStockCount = inventory.filter((p) => p.status === "stokta yok").length
  const categories = [...new Set(inventory.map((p) => p.category))].length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stok Yonetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Urunleri ekleyin, duzenleyin ve stok takibi yapin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2">
            <Download className="w-4 h-4" />
            Disa Aktar
          </Button>
          <Button className="rounded-xl gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Urun Ekle
          </Button>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-5 border-b border-border bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Yeni Urun Ekle</h2>
                    <p className="text-sm text-muted-foreground">Stoga yeni urun ekleyin</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
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
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-purple-400" />
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
                    placeholder="Ornek: Loreal Sampuan"
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
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Fiyat (TL) *
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
                    Maliyet (TL) *
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
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    Min Stok
                  </label>
                  <Input
                    placeholder="10"
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, minStock: e.target.value }))}
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
              <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowAddModal(false)}>
                Vazgec
              </Button>
              <Button className="rounded-xl px-6" onClick={handleCreateProduct}>
                Urun Ekle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProductId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-5 border-b border-border bg-gradient-to-r from-amber-500/10 to-transparent">
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
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400" />
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
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Fiyat (TL) *
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
                    Maliyet (TL) *
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
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    Min Stok
                  </label>
                  <Input
                    placeholder="10"
                    type="number"
                    value={editProduct.minStock}
                    onChange={(e) => setEditProduct((p) => ({ ...p, minStock: e.target.value }))}
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
                <Button variant="outline" className="rounded-xl px-6" onClick={() => setEditingProductId(null)}>
                  Vazgec
                </Button>
                <Button className="rounded-xl px-6" onClick={handleUpdateProduct}>
                  Degisiklikleri Kaydet
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Urun", value: totalProducts, icon: Package, color: "text-purple-500" },
          { label: "Dusuk Stok", value: lowStockCount, icon: AlertTriangle, color: "text-amber-500" },
          { label: "Stokta Yok", value: outOfStockCount, icon: AlertTriangle, color: "text-red-500" },
          { label: "Kategori", value: categories, icon: Boxes, color: "text-blue-500" },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="p-4 bg-card rounded-2xl border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-5 h-5", card.color)} />
                <span className="text-sm text-muted-foreground">{card.label}</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{card.value}</span>
            </div>
          )
        })}
      </div>

      {/* Inventory Table */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Stokta ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredInventory.length} urun</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="rounded-xl gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Sirala
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox />
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Urun</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Kategori</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Fiyat</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Maliyet</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Stok</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Durum</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item.id} className="group">
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-lg font-normal">
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-foreground">{item.price} TL</TableCell>
                <TableCell className="text-muted-foreground">{item.cost} TL</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "font-medium",
                      item.stock <= 0
                        ? "text-red-600"
                        : item.stock <= item.minStock
                        ? "text-amber-600"
                        : "text-foreground"
                    )}
                  >
                    {item.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("rounded-lg font-normal", statusColors[item.status])}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="relative overflow-visible">
                  <div className="relative flex justify-end" ref={openMenuId === String(item.id) ? menuRef : null}>
                    <button
                      className="p-1.5 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                        const nextId = String(item.id)
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
            onClick={() => openEditModal(openMenuId)}
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
