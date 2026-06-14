"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api-fetch"
import { formatTurkishPhone, isValidTurkishPhone } from "@/lib/auth-field-validation"
import type { SalonCustomer } from "@/lib/salon-customers"
import type { SessionOperation } from "@/lib/session-operations"
import {
  formatDateTime,
  formatPrice,
  formatServiceItemsSummary,
  getDurationMinutes,
} from "@/components/dashboard/operations-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  Coins,
  Grid3X3,
  LayoutList,
  Phone,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react"

type ViewMode = "grid" | "list"

interface MyCustomersViewProps {
  businessUserId?: string
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function customerTotalSpent(customer: SalonCustomer) {
  return customer.sessions.reduce((sum, session) => {
    const price = Number(session.totalPrice)
    return sum + (Number.isFinite(price) ? price : 0)
  }, 0)
}

function SessionPhotos({ operation, alt }: { operation: SessionOperation; alt: string }) {
  const photos = [operation.photo, operation.photo2, operation.photo3].filter(Boolean) as string[]
  if (photos.length === 0) {
    return <span className="text-xs text-muted-foreground">Fotograf yok</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((src, index) => (
        <a
          key={`${operation.id}-${index}`}
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={src || "/placeholder.svg"}
            alt={`${alt} ${index + 1}`}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-border hover:opacity-90 transition-opacity"
          />
        </a>
      ))}
    </div>
  )
}

function SessionTimelineItem({ operation }: { operation: SessionOperation }) {
  const customerName = `${operation.customerName} ${operation.customerSurname}`.trim()
  const durationMinutes = getDurationMinutes(operation)

  return (
    <div className="relative pl-6 pb-6 last:pb-0 border-l border-border ml-2">
      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">{formatDateTime(operation.endedAt ?? operation.startedAt)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {operation.workspaceName || "Çalışma alanı"} · {operation.staffName || "Personel"}
            </p>
          </div>
          {operation.isActive ? (
            <Badge variant="outline" className="rounded-lg bg-blue-500/10 text-blue-600 border-blue-200">
              Devam ediyor
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-lg bg-green-500/10 text-green-600 border-green-200">
              Tamamlandı
            </Badge>
          )}
        </div>

        <p className="text-sm text-foreground">{formatServiceItemsSummary(operation)}</p>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {durationMinutes > 0 ? <span>{durationMinutes} dk</span> : null}
          <span className="font-medium text-foreground">{formatPrice(operation.totalPrice)}</span>
        </div>

        {operation.notes ? (
          <p className="text-sm text-muted-foreground border-t border-border pt-2">{operation.notes}</p>
        ) : null}

        <SessionPhotos operation={operation} alt={customerName || "Seans"} />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "primary" | "blue" | "emerald" | "amber"
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  }
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", tones[tone])}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold text-foreground truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function MyCustomersView({ businessUserId }: MyCustomersViewProps) {
  const [customers, setCustomers] = useState<SalonCustomer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadCustomers = useCallback(async () => {
    if (!businessUserId) {
      return
    }

    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await apiFetch(
        `/api/salon-customers?businessUserId=${encodeURIComponent(businessUserId)}`,
        { cache: "no-store" },
      )
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        customers?: SalonCustomer[]
        message?: string
      } | null

      if (!res.ok || !json?.ok || !Array.isArray(json.customers)) {
        setLoadError(json?.message ?? "Müşteriler yüklenemedi.")
        setCustomers([])
        return
      }

      setCustomers(json.customers)
    } catch {
      setLoadError("Müşteriler yüklenemedi.")
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }, [businessUserId])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return customers
    }

    const phoneDigits = query.replace(/\D/g, "")
    return customers.filter((customer) => {
      const haystack = [
        customer.fullName,
        customer.phone,
        customer.sessions.map((s) => `${s.services.join(" ")} ${s.workspaceName} ${s.staffName}`).join(" "),
      ]
        .join(" ")
        .toLowerCase()

      if (haystack.includes(query)) {
        return true
      }
      if (phoneDigits.length >= 3 && customer.phone.replace(/\D/g, "").includes(phoneDigits)) {
        return true
      }
      return false
    })
  }, [customers, searchQuery])

  const stats = useMemo(() => {
    const totalSessions = customers.reduce((sum, c) => sum + c.sessionCount, 0)
    const totalRevenue = customers.reduce((sum, c) => sum + customerTotalSpent(c), 0)
    const activeSessions = customers.reduce(
      (sum, c) => sum + c.sessions.filter((s) => s.isActive).length,
      0,
    )
    return { totalSessions, totalRevenue, activeSessions }
  }, [customers])

  const selectedCustomer = useMemo(
    () => filteredCustomers.find((c) => c.id === selectedId) ?? null,
    [filteredCustomers, selectedId],
  )

  const selectedTotalSpent = useMemo(
    () => (selectedCustomer ? customerTotalSpent(selectedCustomer) : 0),
    [selectedCustomer],
  )

  useEffect(() => {
    if (selectedId && !filteredCustomers.some((c) => c.id === selectedId)) {
      setSelectedId(null)
    }
  }, [filteredCustomers, selectedId])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight text-balance">Müşterilerim</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Çalışma alanlarından kayıt edilen müşteriler ve seans geçmişi (telefon ile benzersiz).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Kart
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="w-4 h-4 mr-1" />
            Liste
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Toplam müşteri"
          value={customers.length.toString()}
          tone="primary"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Toplam seans"
          value={stats.totalSessions.toString()}
          tone="blue"
        />
        <StatCard
          icon={<Coins className="w-5 h-5" />}
          label="Toplam ciro"
          value={formatPrice(stats.totalRevenue)}
          tone="emerald"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Devam eden seans"
          value={stats.activeSessions.toString()}
          tone="amber"
        />
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ad, soyad veya telefon ile ara..."
          className="pl-10 rounded-xl h-11"
        />
      </div>

      {loadError ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3 min-h-[320px]">
          {isLoading ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center text-muted-foreground">Yükleniyor...</CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center text-muted-foreground">
                {searchQuery.trim() ? "Arama sonucu bulunamadı." : "Henüz kayıtlı müşteri yok. Seans başlatarak müşteri ekleyin."}
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredCustomers.map((customer) => {
                const isSelected = customer.id === selectedId
                const spent = customerTotalSpent(customer)
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setSelectedId(customer.id)}
                    className={cn(
                      "text-left rounded-2xl border p-4 transition-all hover:shadow-md",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                        {getInitials(customer.fullName)}
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground", isSelected && "text-primary")} />
                    </div>
                    <p className="font-semibold text-foreground mt-3 truncate">{customer.fullName}</p>
                    {customer.phone && isValidTurkishPhone(customer.phone) ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {formatTurkishPhone(customer.phone)}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-1">Telefon kayıtlı değil</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className="rounded-lg">
                        {customer.sessionCount} seans
                      </Badge>
                      {spent > 0 ? (
                        <Badge variant="outline" className="rounded-lg font-medium text-emerald-600 border-emerald-200 bg-emerald-500/5">
                          {formatPrice(spent)}
                        </Badge>
                      ) : null}
                      {customer.lastVisitAt ? (
                        <Badge variant="outline" className="rounded-lg font-normal">
                          Son: {formatDateTime(customer.lastVisitAt).split(" ")[0]}
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <Card className="rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {filteredCustomers.map((customer) => {
                  const isSelected = customer.id === selectedId
                  const spent = customerTotalSpent(customer)
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setSelectedId(customer.id)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                        {getInitials(customer.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{customer.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.phone ? formatTurkishPhone(customer.phone) : "Telefon yok"} · {customer.sessionCount} seans
                        </p>
                      </div>
                      {spent > 0 ? (
                        <span className="text-sm font-medium text-emerald-600 shrink-0 hidden sm:inline">
                          {formatPrice(spent)}
                        </span>
                      ) : null}
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        <Card className="rounded-2xl min-h-[400px] lg:sticky lg:top-4 lg:self-start">
          {!selectedCustomer ? (
            <CardContent className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ClipboardList className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Müşteri seçin</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Soldan bir müşteri seçerek tüm seans geçmişini ve fotoğrafları tarihe göre görüntüleyin.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold">
                      {getInitials(selectedCustomer.fullName)}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-xl truncate">{selectedCustomer.fullName}</CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                        {selectedCustomer.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {formatTurkishPhone(selectedCustomer.phone)}
                          </span>
                        ) : (
                          <span>Telefon kaydı yok</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-xl shrink-0"
                    onClick={() => setSelectedId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4">
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{selectedCustomer.sessionCount}</p>
                    <p className="text-xs text-muted-foreground">Seans</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-lg font-bold text-emerald-600">{formatPrice(selectedTotalSpent)}</p>
                    <p className="text-xs text-muted-foreground">Toplam</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-sm font-bold text-foreground">
                      {selectedCustomer.lastVisitAt ? formatDateTime(selectedCustomer.lastVisitAt).split(" ")[0] : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Son ziyaret</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 max-h-[calc(100vh-220px)] overflow-y-auto">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                  <Calendar className="w-4 h-4 text-primary" />
                  Seans geçmişi (yeniden eskiye)
                </div>
                {selectedCustomer.sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bu müşteri için seans kaydı yok.</p>
                ) : (
                  <div>
                    {selectedCustomer.sessions.map((session) => (
                      <SessionTimelineItem key={session.id} operation={session} />
                    ))}
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 break-words">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          Seanslar çalışma alanından otomatik kaydedilir
        </span>
      </div>
    </div>
  )
}
