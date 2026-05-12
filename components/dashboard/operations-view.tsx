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
import type { SessionOperation } from "@/lib/session-operations"
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Filter,
  Globe,
  Instagram,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react"

const workspaceVisuals = [
  { icon: Sparkles, bgColor: "bg-purple-500/10", textColor: "text-purple-600" },
  { icon: MapPin, bgColor: "bg-pink-500/10", textColor: "text-pink-600" },
  { icon: Users, bgColor: "bg-blue-500/10", textColor: "text-blue-600" },
  { icon: Clock, bgColor: "bg-rose-500/10", textColor: "text-rose-600" },
]

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDurationMinutes(operation: SessionOperation) {
  const start = Date.parse(operation.startedAt ?? "")
  const end = Date.parse(operation.endedAt ?? "")
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0
  }

  return Math.max(0, Math.floor((end - start) / 60000))
}

function formatPrice(value: number) {
  return `${value.toFixed(2)} TL`
}

function formatServiceItemsSummary(operation: SessionOperation) {
  if (operation.serviceItems.length === 0) {
    return operation.services.join(", ") || "-"
  }

  return operation.serviceItems.map((item) => `${item.name} (${formatPrice(item.price)})`).join(", ")
}

export function OperationsView() {
  const [operations, setOperations] = useState<SessionOperation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)

  const loadOperations = useCallback(async () => {
    const res = await fetch(`/api/session-operations?ts=${Date.now()}`, { cache: "no-store" })
    const json = (await res.json().catch(() => null)) as { ok?: boolean; rows?: SessionOperation[] } | null
    if (!res.ok || !json?.ok || !Array.isArray(json.rows)) {
      return
    }

    setOperations(json.rows)
  }, [])

  useEffect(() => {
    void loadOperations()
  }, [loadOperations])

  const workspaceCards = useMemo(() => {
    const counts = new Map<string, number>()

    operations.forEach((operation) => {
      const label = String(operation.workspaceName ?? "").trim() || "-"
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })

    return Array.from(counts.entries()).map(([label, count], index) => {
      const visual = workspaceVisuals[index % workspaceVisuals.length]
      return {
        label,
        count,
        ...visual,
      }
    })
  }, [operations])

  const filteredOperations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return operations.filter((operation) => {
      const haystack = [
        operation.workspaceName,
        operation.customerName,
        operation.customerSurname,
        operation.staffName,
        operation.services.join(" "),
        operation.serviceItems.map((item) => `${item.name} ${item.price}`).join(" "),
        operation.notes,
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = !query || haystack.includes(query)
      const matchesWorkspace = !selectedWorkspace || operation.workspaceName === selectedWorkspace
      return matchesSearch && matchesWorkspace
    })
  }, [operations, searchQuery, selectedWorkspace])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Islemler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tamamlanan seans kayitlarini goruntuleyin
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Yeni islem kaydi{" "}
          <span className="text-primary font-medium">Calisma Alanlari</span> bolumunden olusur
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {workspaceCards.map((card) => {
          const Icon = card.icon
          const isSelected = selectedWorkspace === card.label

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setSelectedWorkspace(isSelected ? null : card.label)}
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

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Islem ara..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 w-56 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredOperations.length} islem</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Sirala
            </Button>
          </div>
        </div>

        {selectedWorkspace && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className="gap-1 rounded-lg">
              {selectedWorkspace}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedWorkspace(null)} />
            </Badge>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedWorkspace(null)}
            >
              Temizle
            </button>
            <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
              <span>1 / 1</span>
              <button type="button" className="p-1 hover:bg-muted rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" className="p-1 hover:bg-muted rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Islem
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Calisma Alani
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Personel
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Tarih / Saat
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Sure
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Fiyat
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Paylasim
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Fotograf
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOperations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  Kayitli islem bulunamadi.
                </TableCell>
              </TableRow>
            ) : (
              filteredOperations.map((operation) => {
                const durationMinutes = getDurationMinutes(operation)
                const customerName = `${operation.customerName} ${operation.customerSurname}`.trim()

                return (
                  <TableRow key={operation.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customerName || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatServiceItemsSummary(operation)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-lg font-normal">
                        {operation.workspaceName || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>{operation.staffName || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{formatDateTime(operation.endedAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          Baslangic: {formatDateTime(operation.startedAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{durationMinutes} dk</span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {formatPrice(operation.totalPrice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {operation.shareOnInstagram && (
                          <Badge variant="outline" className="rounded-lg font-normal bg-pink-500/10 text-pink-600 border-pink-200">
                            <Instagram className="w-3 h-3 mr-1" />
                            Instagram
                          </Badge>
                        )}
                        {operation.shareOnWebsite && (
                          <Badge variant="outline" className="rounded-lg font-normal bg-blue-500/10 text-blue-600 border-blue-200">
                            <Globe className="w-3 h-3 mr-1" />
                            Web
                          </Badge>
                        )}
                        {!operation.shareOnInstagram && !operation.shareOnWebsite && (
                          <Badge variant="outline" className="rounded-lg font-normal">
                            Yok
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {operation.photo ? (
                        <img
                          src={operation.photo}
                          alt={customerName}
                          className="w-10 h-10 rounded-xl object-cover border border-border"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
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
