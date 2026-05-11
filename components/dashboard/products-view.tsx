"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { getProductCategoryId, getProductCategoryLabel } from "@/lib/product-categories"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  X,
  Package,
  ShoppingBag,
  User,
  Minus,
  Plus,
  CheckCircle,
  Sparkles,
  Droplets,
  Scissors,
  Heart,
} from "lucide-react"

const categoryVisuals = [
  { icon: Sparkles, bgColor: "bg-purple-500/10", textColor: "text-purple-600" },
  { icon: Droplets, bgColor: "bg-pink-500/10", textColor: "text-pink-600" },
  { icon: Scissors, bgColor: "bg-blue-500/10", textColor: "text-blue-600" },
  { icon: Heart, bgColor: "bg-rose-500/10", textColor: "text-rose-600" },
]

interface Product {
  id: string
  name: string
  description: string
  categoryId: number
  category: string
  price: string
  cost: string
  stock: number
  status: string
}

const statusColors: Record<string, string> = {
  "mevcut": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "stokta yok": "bg-red-500/10 text-red-600 border-red-200",
  "dusuk stok": "bg-amber-500/10 text-amber-600 border-amber-200",
}

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Satis modal state
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [saleProduct, setSaleProduct] = useState<Product | null>(null)
  const [saleForm, setSaleForm] = useState({
    customerName: "",
    customerSurname: "",
    quantity: 1,
  })

  const loadProducts = useCallback(async () => {
    const res = await fetch(`/api/products?ts=${Date.now()}`, { cache: "no-store" })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok || !Array.isArray(json?.rows)) {
      return false
    }

    const mapped = json.rows.map((row: any, index: number) => {
      const stock = Number(row.stock1 ?? row.stock ?? row.Stock ?? 0)
      const statusRaw = String(row.status ?? row.Status ?? "").trim().toLowerCase()
      const status = statusRaw || (stock <= 0 ? "stokta yok" : stock <= 10 ? "dusuk stok" : "mevcut")

      return {
        id: String(row.id ?? `PRD${String(index + 1).padStart(3, "0")}`),
        name: String(row.name ?? "Urun"),
        description: String(row.description ?? "-"),
        categoryId: getProductCategoryId(row),
        category: getProductCategoryLabel(row),
        price: String(row.price ?? "0"),
        cost: String(row.cost ?? row.Cost ?? "0"),
        stock,
        status,
      }
    })

    setProducts(mapped)
    return true
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const categoryCards = useMemo(() => {
    const counts = new Map<string, number>()

    products.forEach((product) => {
      const label = String(product.category ?? "").trim() || "-"
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })

    return Array.from(counts.entries()).map(([label, count], index) => {
      const visual = categoryVisuals[index % categoryVisuals.length]
      return {
        label,
        count,
        ...visual,
      }
    })
  }, [products])

  // Satis modalini ac
  const openSaleModal = (product: Product) => {
    if (product.stock <= 0) {
      alert("Bu urun stokta yok!")
      return
    }
    setSaleProduct(product)
    setSaleForm({
      customerName: "",
      customerSurname: "",
      quantity: 1,
    })
    setShowSaleModal(true)
  }

  // Satis modalini kapat
  const closeSaleModal = () => {
    setShowSaleModal(false)
    setSaleProduct(null)
    setSaleForm({
      customerName: "",
      customerSurname: "",
      quantity: 1,
    })
  }

  // Satisi tamamla
  const handleCompleteSale = async () => {
    if (!saleProduct) return
    if (!saleForm.customerName.trim() || !saleForm.customerSurname.trim()) {
      alert("Lutfen musteri adi ve soyadini girin.")
      return
    }
    if (saleForm.quantity <= 0 || saleForm.quantity > saleProduct.stock) {
      alert("Gecersiz adet secimi.")
      return
    }

    // Stoktan dus
    const newStock = saleProduct.stock - saleForm.quantity
    const res = await fetch(`/api/products/${saleProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saleProduct.name,
        description: saleProduct.description,
        price: Number(saleProduct.price),
        cost: Number(saleProduct.cost),
        stock: newStock,
        status: newStock <= 0 ? "stokta yok" : newStock <= 10 ? "dusuk stok" : "mevcut",
        categoryId: saleProduct.categoryId,
        isAvailable: newStock > 0,
      }),
    })

    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      // API basarisiz olsa bile local olarak guncelle
      setProducts((prev) =>
        prev.map((p) =>
          p.id === saleProduct.id
            ? {
                ...p,
                stock: newStock,
                status: newStock <= 0 ? "stokta yok" : newStock <= 10 ? "dusuk stok" : "mevcut",
              }
            : p
        )
      )
    } else {
      await loadProducts()
    }

    closeSaleModal()
  }

  // Filtrelenmis urunler
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Urunler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Satis yapilabilir urunleri goruntuleyin
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Urun eklemek veya duzenlemek icin{" "}
          <span className="text-primary font-medium">Stok</span> bolumunu kullanin
        </div>
      </div>

      {/* Sale Modal */}
      {showSaleModal && saleProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-5">
              <button
                onClick={closeSaleModal}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Urun Satisi</h2>
                  <p className="text-sm text-white/70">{saleProduct.name}</p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="px-6 pt-5">
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Urun Adi</span>
                  <span className="font-medium">{saleProduct.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Birim Fiyat</span>
                  <span className="font-semibold text-emerald-600">{saleProduct.price} TL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mevcut Stok</span>
                  <span className="font-medium">{saleProduct.stock} adet</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Musteri Bilgileri
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Ad *</label>
                    <Input
                      placeholder="Musteri adi"
                      value={saleForm.customerName}
                      onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Soyad *</label>
                    <Input
                      placeholder="Musteri soyadi"
                      value={saleForm.customerSurname}
                      onChange={(e) => setSaleForm({ ...saleForm, customerSurname: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Adet Secimi
                </h3>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSaleForm({ ...saleForm, quantity: Math.max(1, saleForm.quantity - 1) })}
                    className="w-12 h-12 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="w-20 h-14 rounded-xl bg-muted/50 border-2 border-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{saleForm.quantity}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSaleForm({ ...saleForm, quantity: Math.min(saleProduct.stock, saleForm.quantity + 1) })
                    }
                    className="w-12 h-12 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-700">Toplam Tutar</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {(Number(saleProduct.price) * saleForm.quantity).toFixed(2)} TL
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-lg shadow-emerald-600/25"
                onClick={handleCompleteSale}
              >
                <CheckCircle className="w-4 h-4" />
                Islemi Tamamla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryCards.map((card) => {
          const Icon = card.icon
          const isSelected = selectedCategory === card.label
          return (
            <button
              key={card.label}
              onClick={() => setSelectedCategory(isSelected ? null : card.label)}
              className={cn(
                "group p-5 bg-card rounded-2xl border transition-all duration-300 cursor-pointer text-left",
                isSelected
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/30 hover:shadow-lg"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.bgColor)}>
                  <Icon className={cn("w-5 h-5", card.textColor)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{card.count}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Product List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Urun ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-56 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredProducts.length} urun</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Sirala
            </Button>
          </div>
        </div>

        {selectedCategory && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className="gap-1 rounded-lg">
              {selectedCategory}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
            </Badge>
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedCategory(null)}
            >
              Temizle
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
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
                Stok
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Durum
              </TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-600" />
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
                <TableCell className="font-semibold text-foreground">{product.price} TL</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "font-medium",
                      product.stock <= 0
                        ? "text-red-600"
                        : product.stock <= 10
                        ? "text-amber-600"
                        : "text-foreground"
                    )}
                  >
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("rounded-lg font-normal", statusColors[product.status])}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    className={cn(
                      "rounded-xl gap-1.5 transition-all",
                      product.stock > 0
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    onClick={() => openSaleModal(product)}
                    disabled={product.stock <= 0}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Satis
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
