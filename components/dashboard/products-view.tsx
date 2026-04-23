"use client"

import { useEffect, useRef, useState } from "react"
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
  "mevcut": "bg-green-100 text-green-700 border-green-200",
  "stokta yok": "bg-red-100 text-red-700 border-red-200",
  "dusuk stok": "bg-amber-100 text-amber-700 border-amber-200",
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
        <h1 className="text-2xl font-semibold text-foreground">Menu Urunleri</h1>
        <Button className="rounded-xl" onClick={() => setShowAddCard(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Urun ekle
        </Button>
      </div>

      {showAddCard && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border/70 bg-card/95 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border/70">
              <h2 className="text-xl font-semibold text-foreground">Yeni Urun Ekle</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Urun bilgilerini girerek listeye yeni urun ekleyin.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Urun adi</p>
                  <Input
                    placeholder="Orn: Sac Bakim Seti"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Kategori</p>
                  <Input
                    placeholder="Orn: Bakim"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Fiyat</p>
                  <Input
                    placeholder="Orn: 24.99"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Maliyet</p>
                  <Input
                    placeholder="Orn: 8.50"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct((p) => ({ ...p, cost: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Stok</p>
                  <Input
                    placeholder="Orn: 10"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Aciklama</p>
                  <Input
                    placeholder="Kisa urun aciklamasi"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/70 bg-muted/20">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white"
                  onClick={handleCreateProduct}
                >
                  Kaydet
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white"
                  onClick={() => setShowAddCard(false)}
                >
                  Vazgec
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProductId && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border/70 bg-card/95 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border/70">
              <h2 className="text-xl font-semibold text-foreground">
                Urun Duzenle{editingProductName ? `: ${editingProductName}` : ""}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Urun adi</p>
                  <Input placeholder="Urun adi" value={editProduct.name} onChange={(e) => setEditProduct((p) => ({ ...p, name: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Kategori (id)</p>
                  <Input placeholder="Kategori (id)" value={editProduct.category} onChange={(e) => setEditProduct((p) => ({ ...p, category: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Fiyat</p>
                  <Input placeholder="Fiyat" value={editProduct.price} onChange={(e) => setEditProduct((p) => ({ ...p, price: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Maliyet</p>
                  <Input placeholder="Maliyet" value={editProduct.cost} onChange={(e) => setEditProduct((p) => ({ ...p, cost: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Stok</p>
                  <Input placeholder="Stok" type="number" value={editProduct.stock} onChange={(e) => setEditProduct((p) => ({ ...p, stock: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Aciklama</p>
                  <Input placeholder="Aciklama" value={editProduct.description} onChange={(e) => setEditProduct((p) => ({ ...p, description: e.target.value }))} className="rounded-xl" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/70 bg-muted/20 grid grid-cols-2 gap-3">
              <Button className="rounded-xl bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white" variant="outline" onClick={handleUpdateProduct}>Kaydet</Button>
              <Button className="rounded-xl bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white" variant="outline" onClick={() => setEditingProductId(null)}>Vazgec</Button>
            </div>
          </div>
        </div>
      )}

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
                <TableCell className="relative overflow-visible">
                  <div className="relative flex justify-end" ref={openMenuId === String(product.id) ? menuRef : null}>
                    <button
                      className="p-1.5 hover:bg-muted rounded-md"
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                        const nextId = String(product.id)
                        setOpenMenuId((prev) => (prev === nextId ? null : nextId))
                        setMenuPosition({ top: rect.bottom + 6, left: rect.right - 128 })
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

      {openMenuId && menuPosition && (
        <div
          ref={menuRef}
          className="fixed w-32 rounded-xl border border-border bg-popover shadow-lg z-[100] p-1"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted"
            onClick={() => openEditProductCard(openMenuId)}
          >
            Duzenle
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50"
            onClick={() => handleRemoveProduct(openMenuId)}
          >
            Kaldir
          </button>
        </div>
      )}
    </div>
  )
}
