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
  pendingUpgradeRequest: boolean
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
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)

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

  useEffect(() => {
    if (membership?.membershipPlan) {
      setSelectedPlan(membership.membershipPlan)
    }
  }, [membership?.membershipPlan, membership?.pendingUpgradeRequest])

  const handleUpgrade = async () => {
    if (!businessUserId) return

    try {
      setIsUpgrading(true)
      setUpgradeSuccess(false)
      const res = await apiFetch("/api/corporate-membership", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessUserId, plan: "professional", action: "request_upgrade" }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        alert(data?.message ?? "Paket yükseltme talebi gönderilemedi.")
        return
      }
      setMembership(data.membership ?? null)
      setUpgradeSuccess(true)
      alert("Paket yükseltme talebiniz supervisor onayına gönderildi.")
      setTimeout(() => setUpgradeSuccess(false), 5000)
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
  const pendingUpgradeRequest = membership?.pendingUpgradeRequest
  const subscriptionActive = Boolean(membership?.timeRemaining?.isActive && !membership?.timeRemaining?.isExpired)
  const progressPercent = membership?.timeRemaining?.elapsedPercent ?? 0
  const remainingDays = membership?.timeRemaining?.remainingDays ?? 0
  const plans = MEMBERSHIP_PLANS

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

      {pendingUpgradeRequest && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Clock3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Paket yükseltme talebiniz işleme alındı</p>
              <p className="text-sm text-muted-foreground mt-1">
                Talep edilen paket: <span className="font-medium text-foreground">{upgradePlan?.title ?? "—"}</span>.
                Supervisor onayından sonra paketiniz yükseltilecektir.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-12 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {plans.map((plan, tierIdx) => (
          <div
            key={plan.id}
            className={`
              relative rounded-3xl p-8 ring-1 ring-border sm:p-10 cursor-pointer
              ${selectedPlan === plan.id ? 'bg-primary text-primary-foreground shadow-2xl' : 'bg-card/60 sm:mx-8 lg:mx-0'}
              ${selectedPlan !== plan.id && tierIdx === 0 ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl' : ''}
              ${selectedPlan !== plan.id && tierIdx === 1 ? 'sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none' : ''}
            `}
          >
            {pendingUpgradeRequest && plan.id === 'professional' && (
              <Badge className="absolute top-4 right-4 bg-blue-500 text-white">
                Bekleniyor..
              </Badge>
            )}
            <h3 className={`text-base/7 font-semibold ${selectedPlan === plan.id ? 'text-primary-foreground' : 'text-primary'}`}>
              {plan.title}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span className={`text-5xl font-semibold tracking-tight ${selectedPlan === plan.id ? 'text-primary-foreground' : 'text-foreground'}`}>
                {plan.price}
              </span>
              <span className={`text-base ${selectedPlan === plan.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>/yıl</span>
            </p>
            <p className={`mt-6 text-base/7 ${selectedPlan === plan.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {plan.description}
            </p>
            <ul role="list" className={`mt-8 space-y-3 text-sm/6 sm:mt-10 ${selectedPlan === plan.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckCircle2
                    className={`h-6 w-5 flex-none ${selectedPlan === plan.id ? 'text-primary-foreground' : 'text-primary'}`}
                  />
                  {feature}
                </li>
              ))}
            </ul>
            {!(selectedPlan === 'professional' && plan.id === 'basic') && (
              <Button
                onClick={() => {
                  if (membership?.isApproved && selectedPlan !== plan.id) {
                    void handleUpgrade()
                  }
                }}
                className={`
                  mt-8 block w-full rounded-xl px-3.5 py-2.5 text-center text-sm font-semibold sm:mt-10
                  ${selectedPlan === plan.id
                    ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }
                `}
                disabled={!membership?.isApproved || selectedPlan === plan.id || isUpgrading || pendingUpgradeRequest}
              >
                {selectedPlan === plan.id
                  ? 'Seçildi'
                  : (!membership?.isApproved
                    ? 'Onay Bekliyor'
                    : (pendingUpgradeRequest
                      ? 'Talep İşleniyor'
                      : 'Bu Paketi Seç'))}
              </Button>
            )}
          </div>
        ))}
      </div>

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
