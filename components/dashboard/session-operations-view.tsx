"use client"

import { appConfig } from "@/app.config"
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
  fetchSessionOperationsPage,
  type SessionOperationsPeriod,
} from "@/lib/session-operations-query"
import {
  formatDateTime,
  formatPrice,
  formatServiceItemsSummary,
  getDurationMinutes,
} from "@/components/dashboard/operations-display"
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
  Sparkles,
  Users,
  X,
} from "lucide-react"

const PAGE_SIZE = 20

const workspaceVisuals = [
  { icon: Sparkles, bgColor: "bg-purple-500/10", textColor: "text-purple-600" },
  { icon: MapPin, bgColor: "bg-pink-500/10", textColor: "text-pink-600" },
  { icon: Users, bgColor: "bg-blue-500/10", textColor: "text-blue-600" },
  { icon: Clock, bgColor: "bg-rose-500/10", textColor: "text-rose-600" },
]

const PERIOD_OPTIONS: { value: SessionOperationsPeriod; label: string }[] = [
  { value: "7d", label: "Son 7 gun" },
  { value: "30d", label: "Son 30 gun" },
  { value: "365d", label: "Son 1 yil" },
  { value: "all", label: "Tumu" },
]

interface WorkspaceStat {
  workspaceName: string
  count: number
}

interface SessionOperationsViewProps {
  businessUserId?: string
  currentUserId?: string
  currentAccountType?: string
}

export function SessionOperationsView({
  businessUserId,
  currentUserId,
  currentAccountType,
}: SessionOperationsViewProps) {
  const [operations, setOperations] = useState<SessionOperation[]>([])
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
  const [period, setPeriod] = useState<SessionOperationsPeriod>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadOperations = useCallback(async () => {
    if (!businessUserId) return
    const token = appConfig.token.session_operations
    if (!token) {
      setLoadError("Seans API token tanimli degil.")
      return
    }

    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await fetchSessionOperationsPage(token, {
        businessUserId,
        page,
        pageSize: PAGE_SIZE,
        period,
        staffId: currentAccountType === "bireysel" && currentUserId ? currentUserId : undefined,
        workspaceName: selectedWorkspace ?? undefined,
      })

      setOperations(result.rows)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      setWorkspaceStats(result.workspaceStats)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Seanslar yuklenemedi.")
    } finally {
      setIsLoading(false)
    }
  }, [businessUserId, currentAccountType, currentUserId, page, period, selectedWorkspace])

  useEffect(() => {
    void loadOperations()
  }, [loadOperations])

  const workspaceCards = useMemo(() => {
    return workspaceStats.map((stat, index) => {
      const visual = workspaceVisuals[index % workspaceVisuals.length]
      return {
        label: stat.workspaceName,
        count: stat.count,
        ...visual,
      }
    })
  }, [workspaceStats])

  const filteredOperations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return operations
    }

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

      return haystack.includes(query)
    })
  }, [operations, searchQuery])

  const handlePeriodChange = (next: SessionOperationsPeriod) => {
    setPeriod(next)
    setPage(1)
  }

  const handleWorkspaceSelect = (label: string) => {
    setSelectedWorkspace((current) => (current === label ? null : label))
    setPage(1)
  }

  const canGoPrev = page > 1
  const canGoNext = page < totalPages
  const showPagination = total > PAGE_SIZE || page > 1 || totalPages > 1

  const paginationBar = showPagination ? (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-border bg-muted/20 rounded-xl">
      <p className="text-sm text-muted-foreground">
        Toplam <span className="font-medium text-foreground">{total}</span> işlem · Sayfa{" "}
        <span className="font-medium text-foreground">{page}</span> / {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl gap-1"
          disabled={!canGoPrev || isLoading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
          Önceki
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl gap-1"
          disabled={!canGoNext || isLoading}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
        >
          Sonraki
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  ) : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Seans İşlemleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tamamlanan seans kayıtlarını görüntüleyin
          </p>
        </div>   
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={period === option.value ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => handlePeriodChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {workspaceCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {workspaceCards.map((card) => {
            const Icon = card.icon
            const isSelected = selectedWorkspace === card.label

            return (
              <button
                key={card.label}
                type="button"
                onClick={() => handleWorkspaceSelect(card.label)}
                className={cn(
                  "group p-5 bg-card rounded-2xl border transition-all duration-300 cursor-pointer text-left",
                  isSelected
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-primary/30 hover:shadow-lg",
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
      )}

      {loadError ? (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          {loadError}
        </p>
      ) : null}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {paginationBar ? <div className="p-4 border-b border-border">{paginationBar}</div> : null}

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Bu sayfada ara..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 w-56 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {total} İşlem
              {searchQuery.trim() ? ` · bu sayfada ${filteredOperations.length}` : ""}
            </span>
          </div>
        </div>

        {selectedWorkspace && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className="gap-1 rounded-lg">
              {selectedWorkspace}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  setSelectedWorkspace(null)
                  setPage(1)
                }}
              />
            </Badge>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedWorkspace(null)
                setPage(1)
              }}
            >
              Temizle
            </button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">İşlem</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Calisma Alani</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Personel</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Tarih / Saat</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Sure</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Fiyat</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Paylasim</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">Fotograf</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  Yukleniyor...
                </TableCell>
              </TableRow>
            ) : filteredOperations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  Kayıtlı seans işlemi bulunamadı.
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{customerName || "-"}</p>
                            {operation.isActive ? (
                              <Badge variant="outline" className="rounded-lg font-normal bg-blue-500/10 text-blue-600 border-blue-200">
                                Devam ediyor
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-lg font-normal bg-green-500/10 text-green-600 border-green-200">
                                Tamamlandı
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatServiceItemsSummary(operation)}</p>
                          {operation.notes ? (
                            <p className="text-xs text-muted-foreground mt-1">{operation.notes}</p>
                          ) : null}
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
                      <span className="font-medium text-foreground">
                        {operation.isActive
                          ? "—"
                          : durationMinutes > 0
                            ? `${durationMinutes} dk`
                            : "-"}
                      </span>
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
                      <div className="flex gap-1">
                        {operation.photo && (
                          <img
                            src={operation.photo}
                            alt={`${customerName} 1`}
                            className="w-10 h-10 rounded-xl object-cover border border-border"
                          />
                        )}
                        {operation.photo2 && (
                          <img
                            src={operation.photo2}
                            alt={`${customerName} 2`}
                            className="w-10 h-10 rounded-xl object-cover border border-border"
                          />
                        )}
                        {operation.photo3 && (
                          <img
                            src={operation.photo3}
                            alt={`${customerName} 3`}
                            className="w-10 h-10 rounded-xl object-cover border border-border"
                          />
                        )}
                        {!operation.photo && !operation.photo2 && !operation.photo3 && (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {paginationBar ? <div className="border-t border-border">{paginationBar}</div> : null}
      </div>
    </div>
  )
}
