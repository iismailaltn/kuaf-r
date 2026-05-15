"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useCallback, useEffect, useState } from "react"
import {
  MEMBERSHIP_PLANS,
  formatMembershipDate,
  getPlanById,
  type MembershipPlan,
} from "@/lib/corporate-membership"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

interface MembershipPayload {
  membershipPlan: MembershipPlan | null
  subscriptionStartsAt: string | null
  subscriptionEndsAt: string | null
  isApproved: boolean
  hasSelectedPlan: boolean
  timeRemaining: {
    remainingDays: number
    elapsedPercent: number
    isExpired: boolean
    isActive: boolean
  } | null
}

interface CorporateBillingTabProps {
  businessUserId?: string
}

export function CorporateBillingTab({ businessUserId }: CorporateBillingTabProps) {
  const [membership, setMembership] = useState<MembershipPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  const loadMembership = useCallback(async () => {
    if (!businessUserId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const res = await apiFetch(
        `/api/corporate-membership?businessUserId=${encodeURIComponent(businessUserId)}`,
        { cache: "no-store" },
      )
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setMembership(null)
        return
      }
      setMembership(data.membership ?? null)
    } finally {
      setIsLoading(false)
    }
  }, [businessUserId])

  useEffect(() => {
    void loadMembership()
  }, [loadMembership])

  const handleUpgrade = async () => {
    if (!businessUserId) return

    try {
      setIsUpgrading(true)
      setUpgradeSuccess(false)
      const res = await apiFetch("/api/corporate-membership", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessUserId, plan: "professional", action: "upgrade" }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        alert(data?.message ?? "Paket yukseltilemedi.")
        return
      }
      setMembership(data.membership ?? null)
      setUpgradeSuccess(true)
      setTimeout(() => setUpgradeSuccess(false), 3000)
    } finally {
      setIsUpgrading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Üyelik bilgileri yükleniyor...
      </div>
    )
  }

  const currentPlan = getPlanById(membership?.membershipPlan)
  const upgradePlan = getPlanById("professional")
  const showUpgrade = membership?.membershipPlan === "basic" && membership?.isApproved
  const pendingApproval = membership?.hasSelectedPlan && !membership?.isApproved
  const subscriptionActive = Boolean(membership?.timeRemaining?.isActive && !membership?.timeRemaining?.isExpired)
  const progressPercent = membership?.timeRemaining?.elapsedPercent ?? 0
  const remainingDays = membership?.timeRemaining?.remainingDays ?? 0

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Ödeme ve Hesap Yönetimi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Yıllık üyelik paketinizi görüntüleyin, kalan süreyi takip edin ve paketinizi yönetin.
            </p>
          </div>
        </div>
      </div>

      {pendingApproval && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Başvurunuz inceleniyor</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seçilen paket: <span className="font-medium text-foreground">{currentPlan?.title ?? "—"}</span>.
                Supervisor onayından sonra yıllık üyelik süresi başlayacaktır.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className={cn("xl:col-span-2", currentPlan && "border-primary/30")}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Aktif Paketiniz</CardTitle>
                <CardDescription className="mt-1">Yıllık üyelik planı</CardDescription>
              </div>
              <Badge variant={membership?.isApproved ? "default" : "secondary"}>
                {membership?.isApproved ? "Onaylandı" : "Onay bekliyor"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentPlan ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{currentPlan.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{currentPlan.description}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-bold text-foreground">{currentPlan.price}</p>
                    <p className="text-sm text-muted-foreground">/ yıl</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentPlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Henüz bir paket seçilmedi.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Üyelik Süresi</CardTitle>
            <CardDescription>
              {subscriptionActive
                ? "Yıllık abonelik aktif"
                : membership?.isApproved
                  ? "Süre bilgisi yükleniyor"
                  : "Onay sonrası başlar"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {membership?.subscriptionStartsAt && membership?.subscriptionEndsAt ? (
              <>
                <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Başlangıç</span>
                    <span className="ml-auto font-medium text-foreground">
                      {formatMembershipDate(membership.subscriptionStartsAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Bitiş</span>
                    <span className="ml-auto font-medium text-foreground">
                      {formatMembershipDate(membership.subscriptionEndsAt)}
                    </span>
                  </div>
                </div>

                {membership.timeRemaining && (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Kalan süre</span>
                        <span className="font-semibold text-foreground">
                          {membership.timeRemaining.isExpired ? "Süresi doldu" : `${remainingDays} gün`}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            membership.timeRemaining.isExpired ? "bg-destructive w-full" : "bg-primary",
                          )}
                          style={{ width: `${membership.timeRemaining.isExpired ? 100 : progressPercent}%` }}
                        />
                      </div>
                    </div>
                    {!membership.timeRemaining.isExpired && (
                      <p className="text-xs text-muted-foreground">
                        Yıllık üyeliğinizin %{Math.round(progressPercent)} tamamlandı.
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Supervisor kurumsal başvurunuzu onayladığında 1 yıllık süre otomatik olarak başlayacaktır.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showUpgrade && upgradePlan && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Profesyonel Pakete Geçmek İster misiniz?</CardTitle>
            </div>
            <CardDescription>
              Başlangıç paketinden profesyonel pakete geçerek gelişmiş özelliklere erişebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{upgradePlan.price}</span>
                  <span className="text-muted-foreground">/ yıl</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {upgradePlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="rounded-xl h-11 px-6 shrink-0"
                onClick={() => void handleUpgrade()}
                disabled={isUpgrading}
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guncelleniyor...
                  </>
                ) : upgradeSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Paket guncellendi
                  </>
                ) : (
                  <>
                    Profesyonel Pakete Geç
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {membership?.membershipPlan === "professional" && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 pt-6 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-muted-foreground">
              En üst pakette tüm gelişmiş özellikler hesabınızda aktif.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paketler yıllık olarak ücretlendirilir. Üyelik süresi, supervisor tarafından kurumsal başvurunuz
          onaylandıktan sonra başlar. Mevcut paketler: {MEMBERSHIP_PLANS.map((plan) => plan.title).join(" ve ")}.
        </p>
      </div>
    </div>
  )
}
