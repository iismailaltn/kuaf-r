"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ProductSale } from "@/lib/product-sales"
import { formatDateTime, formatPrice } from "@/components/dashboard/operations-display"
import { Package, Search, ShoppingBag } from "lucide-react"

interface ProductSalesViewProps {
  businessUserId?: string
  currentUserId?: string
  currentAccountType?: string
}

export function ProductSalesView({ businessUserId, currentUserId, currentAccountType }: ProductSalesViewProps) {
  const [productSales, setProductSales] = useState<ProductSale[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const loadProductSales = useCallback(async () => {
    if (!businessUserId) return
    const params = new URLSearchParams({
      businessUserId,
      ts: String(Date.now()),
    })
    if (currentAccountType === "bireysel" && currentUserId) {
      params.set("userId", currentUserId)
    }
    const res = await apiFetch(`/api/product-sales?${params.toString()}`, { cache: "no-store" })
    const json = (await res.json().catch(() => null)) as { ok?: boolean; rows?: ProductSale[] } | null
    if (!res.ok || !json?.ok || !Array.isArray(json.rows)) {
      return
    }

    setProductSales(json.rows)
  }, [businessUserId, currentAccountType, currentUserId])

  useEffect(() => {
    void loadProductSales()
  }, [loadProductSales])

  const filteredProductSales = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return productSales.filter((sale) => {
      const haystack = [
        sale.productName,
        sale.category,
        sale.customerName,
        sale.customerSurname,
        sale.staffName,
      ]
        .join(" ")
        .toLowerCase()

      return !query || haystack.includes(query)
    })
  }, [productSales, searchQuery])

  const productSalesTotal = useMemo(
    () => filteredProductSales.reduce((sum, sale) => sum + sale.totalPrice, 0),
    [filteredProductSales]
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Satilan Urunler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tamamlanan urun satislarini goruntuleyin
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Yeni satis{" "}
          <span className="text-primary font-medium">Urunler</span> sayfasindan olusur
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{filteredProductSales.length}</p>
              <p className="text-sm text-muted-foreground">Toplam satis</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatPrice(productSalesTotal)}</p>
              <p className="text-sm text-muted-foreground">Toplam ciro</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Urun, musteri veya personel ara..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 w-56 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredProductSales.length} satis</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Urun</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Musteri</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Personel</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Kategori</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Adet</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Birim Fiyat</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Toplam</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProductSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  Kayitli urun satisi bulunamadi.
                </TableCell>
              </TableRow>
            ) : (
              filteredProductSales.map((sale) => {
                const customerName = `${sale.customerName} ${sale.customerSurname}`.trim()

                return (
                  <TableRow key={`${sale.id}-${sale.productId}-${sale.soldAt}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{sale.productName}</p>
                          {sale.productId && (
                            <p className="text-xs text-muted-foreground">#{sale.productId}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{customerName || "-"}</TableCell>
                    <TableCell className="text-foreground">{sale.staffName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-lg font-normal">
                        {sale.category || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{formatPrice(sale.unitPrice)}</TableCell>
                    <TableCell className="font-semibold text-foreground">{formatPrice(sale.totalPrice)}</TableCell>
                    <TableCell>{formatDateTime(sale.soldAt)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
