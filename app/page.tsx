"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useEffect, useRef, useState } from "react"
import { Sidebar, ViewType, UserRole } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { TablesView } from "@/components/dashboard/tables-view"
import { ProductsView } from "@/components/dashboard/products-view"
import { InventoryView } from "@/components/dashboard/inventory-view"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ExpertiseOnboarding } from "@/components/auth/expertise-onboarding"
import { UsersView } from "@/components/dashboard/users-view"
import { ReservationsView } from "@/components/dashboard/reservations-view"
import { PerformanceView } from "@/components/dashboard/performance-view"
import { SessionOperationsView } from "@/components/dashboard/session-operations-view"
import { ProductSalesView } from "@/components/dashboard/product-sales-view"
import { ReviewsView } from "@/components/dashboard/reviews-view"
import { MyReservationsView } from "@/components/dashboard/my-reservations-view"
import { MyCustomersView } from "@/components/dashboard/my-customers-view"
import { SettingsView } from "@/components/dashboard/settings-view"
import { loginWithApi, registerWithApi } from "@/lib/services/auth-service"
import { isIndividualAccountType } from "@/lib/individual-expertise"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock3 } from "lucide-react"
import { MEMBERSHIP_PLANS, type MembershipPlan } from "@/lib/corporate-membership"
import type { SessionOperation } from "@/lib/session-operations"
import type { ProductSale } from "@/lib/product-sales"
import type { GoogleReview } from "@/lib/google-reviews"
import type { ReservationRecord } from "@/lib/reservations-store"

type AuthState = "login" | "register" | "authenticated"

interface User {
  id: string
  email: string
  shopName: string
  role: UserRole
  accountType: string
  isActive: boolean
  staffAccepted: boolean
  businessUserId: string
  /** null = kontrol ediliyor, false = uzmanlik secimi gerekli, true = tamamlandi */
  expertiseSetupDone: boolean | null
}

export default function Dashboard() {
  const [authState, setAuthState] = useState<AuthState>("login")
  const [user, setUser] = useState<User | null>(null)
  const [activeView, setActiveView] = useState<ViewType>("dashboard")
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [corporateReviewSubmitted, setCorporateReviewSubmitted] = useState(false)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const forceExpertiseSetupRef = useRef(false)
  
  // Notification data
  const [notificationSessions, setNotificationSessions] = useState<SessionOperation[]>([])
  const [notificationProducts, setNotificationProducts] = useState<ProductSale[]>([])
  const [notificationReviews, setNotificationReviews] = useState<GoogleReview[]>([])
  const [notificationReservations, setNotificationReservations] = useState<ReservationRecord[]>([])

  useEffect(() => {
    if (authState !== "authenticated" || !user) {
      return
    }

    if (!isIndividualAccountType(user.accountType)) {
      if (user.expertiseSetupDone !== true) {
        setUser((current) => (current ? { ...current, expertiseSetupDone: true } : current))
      }
      return
    }

    if (forceExpertiseSetupRef.current) {
      return
    }

    if (user.expertiseSetupDone !== null) {
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await apiFetch(
          `/api/user-profile?userId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" },
        )
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean
          profile?: { expertiseOnboardingComplete?: boolean }
        } | null

        if (cancelled) return

        const complete = !res.ok || !data?.ok
          ? false
          : Boolean(data.profile?.expertiseOnboardingComplete)

        setUser((current) =>
          current ? { ...current, expertiseSetupDone: complete } : current,
        )
      } catch {
        if (!cancelled) {
          setUser((current) =>
            current ? { ...current, expertiseSetupDone: false } : current,
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authState, user?.id, user?.accountType, user?.expertiseSetupDone])

  // Fetch notification data
  useEffect(() => {
    if (authState !== "authenticated" || !user) {
      return
    }

    const businessUserId =
      user?.businessUserId ||
      (user?.accountType === "kurumsal" && user.isActive ? user.id : "") ||
      (user?.role === "admin" && user.id ? user.id : "")

    if (!businessUserId) {
      return
    }

    const fetchNotificationData = async () => {
      try {
        // Fetch completed sessions
        const sessionRes = await apiFetch(
          `/api/session-operations?businessUserId=${encodeURIComponent(businessUserId)}&period=7d`,
          { cache: "no-store" }
        )
        const sessionData = await sessionRes.json().catch(() => null) as { ok?: boolean; rows?: SessionOperation[] } | null
        if (sessionData?.ok && Array.isArray(sessionData.rows)) {
          setNotificationSessions(sessionData.rows.filter((s: SessionOperation) => !s.isActive && s.endedAt).slice(0, 10))
        }

        // Fetch recent product sales
        const productRes = await apiFetch(
          `/api/product-sales?businessUserId=${encodeURIComponent(businessUserId)}`,
          { cache: "no-store" }
        )
        const productData = await productRes.json().catch(() => null) as { ok?: boolean; rows?: ProductSale[] } | null
        if (productData?.ok && Array.isArray(productData.rows)) {
          setNotificationProducts(productData.rows.slice(0, 10))
        }

        // Fetch Google reviews
        const reviewRes = await apiFetch(
          `/api/google-reviews?businessUserId=${encodeURIComponent(businessUserId)}`,
          { cache: "no-store" }
        )
        const reviewData = await reviewRes.json().catch(() => null) as { ok?: boolean; reviews?: GoogleReview[] } | null
        if (reviewData?.ok && Array.isArray(reviewData.reviews)) {
          setNotificationReviews(reviewData.reviews.slice(0, 10))
        }

        // Fetch reservations
        const reservationRes = await apiFetch(
          `/api/reservations?businessUserId=${encodeURIComponent(businessUserId)}`,
          { cache: "no-store" }
        )
        const reservationData = await reservationRes.json().catch(() => null) as { ok?: boolean; rows?: ReservationRecord[] } | null
        if (reservationData?.ok && Array.isArray(reservationData.rows)) {
          setNotificationReservations(reservationData.rows.slice(0, 10))
        }
      } catch (error) {
        console.error("Error fetching notification data:", error)
      }
    }

    void fetchNotificationData()
  }, [authState, user])

  const handleLogin = async (emailOrUsername: string, password: string) => {
    const loginId = emailOrUsername.trim().toLowerCase()
    if (loginId === "admin" && password === "admin") {
      const demoBusinessUserId = (process.env.NEXT_PUBLIC_DEMO_BUSINESS_USER_ID ?? "").trim()
      if (!demoBusinessUserId) {
        alert("Demo giris icin gercek kurumsal hesap kullanin veya build sirasinda NEXT_PUBLIC_DEMO_BUSINESS_USER_ID tanimlayin.")
        return
      }
      setUser({
        id: demoBusinessUserId,
        email: "admin",
        shopName: "admin",
        role: "admin",
        accountType: "admin",
        isActive: true,
        staffAccepted: false,
        businessUserId: demoBusinessUserId,
        expertiseSetupDone: true,
      })
      setAuthState("authenticated")
      setActiveView("dashboard")
      return
    }
    try {
      const authUser = await loginWithApi({
        username: emailOrUsername,
        password,
      })
      forceExpertiseSetupRef.current = false
      const role = (authUser.role === "admin" || authUser.role === "supervisor") ? authUser.role : "user"
      setUser({
        email: authUser.username,
        id: authUser.id,
        shopName: authUser.shopName,
        role,
        accountType: authUser.accountType,
        isActive: authUser.isActive,
        staffAccepted: authUser.staffAccepted,
        businessUserId: authUser.businessUserId,
        expertiseSetupDone: isIndividualAccountType(authUser.accountType) ? null : true,
      })
      setAuthState("authenticated")
      setActiveView("dashboard")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Giris basarisiz.")
    }
  }

  const handleRegister = async (data: {
    accountType: "personel" | "customer"
    shopName: string
    ownerName: string
    firstName?: string
    lastName?: string
    taxOffice?: string
    taxNumber?: string
    email: string
    phone: string
    password: string
    specialty?: string[]
    workingHours?: string
    startDate?: string
    status?: "aktif" | "pasif"
    experience?: string
    notes?: string
  }) => {
    try {
      const authUser = await registerWithApi(data)
      const role = (authUser.role === "admin" || authUser.role === "supervisor") ? authUser.role : "user"
      const isPersonelRegistration = data.accountType === "personel"
      forceExpertiseSetupRef.current = isPersonelRegistration
      setUser({
        email: authUser.username,
        id: authUser.id,
        shopName: authUser.shopName,
        role,
        accountType: authUser.accountType || (isPersonelRegistration ? "bireysel" : "kurumsal"),
        isActive: authUser.isActive,
        staffAccepted: authUser.staffAccepted,
        businessUserId: authUser.businessUserId,
        expertiseSetupDone: isPersonelRegistration ? false : true,
      })
      setAuthState("authenticated")
      setActiveView("dashboard")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Kayit basarisiz.")
    }
  }

  const handleLogout = () => {
    setUser(null)
    setAuthState("login")
    setActiveView("dashboard")
    setSelectedPlan(null)
    setCorporateReviewSubmitted(false)
    forceExpertiseSetupRef.current = false
  }

  if (authState === "login") {
    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthState("register")}
      />
    )
  }

  if (authState === "register") {
    return (
      <RegisterForm
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthState("login")}
      />
    )
  }

  const requiresExpertiseSetup =
    user &&
    user.expertiseSetupDone !== true &&
    (user.expertiseSetupDone === false || isIndividualAccountType(user.accountType))

  const scopedBusinessUserId =
    user?.businessUserId ||
    (user?.accountType === "kurumsal" && user.isActive ? user.id : "") ||
    (user?.role === "admin" && user.id ? user.id : "")

  const canManageSalon =
    user?.role === "admin" ||
    user?.role === "supervisor" ||
    (user?.accountType === "kurumsal" && user.isActive)

  const sidebarRole: UserRole =
    user?.accountType === "kurumsal" && user.isActive && user.role === "user" ? "admin" : (user?.role ?? "user")

  const renderView = () => {
    if (requiresExpertiseSetup) {
      if (user?.expertiseSetupDone === null) {
        return (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            Profil yukleniyor...
          </div>
        )
      }

      return (
        <ExpertiseOnboarding
          userId={user!.id}
          shopName={user?.shopName}
          onComplete={() => {
            forceExpertiseSetupRef.current = false
            setUser((current) => (current ? { ...current, expertiseSetupDone: true } : current))
          }}
        />
      )
    }

    if (
      user?.role === "user" &&
      isIndividualAccountType(user.accountType) &&
      user.expertiseSetupDone === true &&
      !user.staffAccepted
    ) {
      return <IndividualInvitationsView userId={user.id} onAccepted={(businessUserId) => setUser({ ...user, staffAccepted: true, businessUserId })} />
    }

    if (user?.role === "user" && user.accountType === "kurumsal" && !user.isActive) {
      if (corporateReviewSubmitted) {
        return (
          <div className="relative isolate h-screen bg-background px-6 py-8 lg:px-8 flex items-center justify-center">
            <div className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl opacity-30">
              <div
                className="mx-auto aspect-1155/678 w-288.75 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]"
                style={{
                  clipPath:
                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                }}
              />
            </div>
            <div className="mx-auto max-w-2xl text-center w-full">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Başvurunuz Alındı
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Bilgileriniz inceleniyor. En kısa zamanda sizi aramızda görmekten mutluluk duyacağız.
              </p>
              <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-2">Sıradaki Adımlar</h3>
                <ul className="space-y-1.5 text-left text-xs text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Başvurunuz supervisor tarafından incelenecek</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Onaylandıktan sonra e-posta ile bilgilendirileceksiniz</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Üyeliğiniz aktif olduğunda panele giriş yapabileceksiniz</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Sorularınız için destek@hstplanet.com adresine e-posta gönderebilirsiniz.
              </div>
            </div>
          </div>
        )
      }

      return (
        <CorporatePricingView
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          isSubmitting={isSavingPlan}
          onContinue={async () => {
            if (!selectedPlan) {
              alert("Lutfen bir paket secin.")
              return
            }
            try {
              setIsSavingPlan(true)
              const res = await apiFetch("/api/corporate-membership", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessUserId: user.id, plan: selectedPlan, action: "select" }),
              })
              const data = await res.json().catch(() => null)
              if (!res.ok || !data?.ok) {
                alert(data?.message ?? "Paket kaydedilemedi.")
                return
              }
              setCorporateReviewSubmitted(true)
            } catch {
              alert("Paket kaydedilemedi.")
            } finally {
              setIsSavingPlan(false)
            }
          }}
        />
      )
    }

    switch (activeView) {
      case "dashboard":
        return <DashboardView shopName={user?.shopName} />
      case "tables":
        return (
          <TablesView
            canManage={canManageSalon}
            businessUserId={scopedBusinessUserId}
            currentUserId={user?.id}
            currentAccountType={user?.accountType}
          />
        )
      case "products":
        return (
          <ProductsView
            businessUserId={scopedBusinessUserId}
            currentUserId={user?.id}
            currentAccountType={user?.accountType}
          />
        )
      case "inventory":
        return <InventoryView businessUserId={scopedBusinessUserId} />
      case "settings":
        return (
          <SettingsView
            user={
              user
                ? {
                    id: user.id,
                    email: user.email,
                    shopName: user.shopName,
                    role: user.role,
                    businessUserId: scopedBusinessUserId,
                    accountType: user.accountType,
                  }
                : undefined
            }
          />
        )
      case "users":
        return <UsersView businessUserId={scopedBusinessUserId} businessUsername={user?.email} />
      case "reservations":
        return <ReservationsView businessUserId={scopedBusinessUserId} />
      case "performance":
        return (
          <PerformanceView
            businessUserId={scopedBusinessUserId}
            shopName={user?.shopName}
          />
        )
      case "session-operations":
        return (
          <SessionOperationsView
            businessUserId={scopedBusinessUserId}
            currentUserId={user?.id}
            currentAccountType={user?.accountType}
          />
        )
      case "my-customers":
        return <MyCustomersView businessUserId={scopedBusinessUserId} />
      case "product-sales":
        return (
          <ProductSalesView
            businessUserId={scopedBusinessUserId}
            currentUserId={user?.id}
            currentAccountType={user?.accountType}
          />
        )
      case "reviews":
        return <ReviewsView businessUserId={scopedBusinessUserId} />
      case "my-reservations":
        return (
          <MyReservationsView
            businessUserId={scopedBusinessUserId}
            individualUserId={user?.id}
            staffName={user?.shopName}
          />
        )
      case "customers":
        return <CorporateApprovalsView />
      default:
        return <DashboardView shopName={user?.shopName} />
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
        shopName={user?.shopName}
        role={sidebarRole}
        hideNavigation={
          user?.role === "user" &&
          ((isIndividualAccountType(user.accountType) && user.expertiseSetupDone === true && !user.staffAccepted) ||
            (user.accountType === "kurumsal" && !user.isActive))
        }
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          sessions={notificationSessions}
          products={notificationProducts}
          reviews={notificationReviews}
          reservations={notificationReservations}
        />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  )
}

function CorporatePricingView({
  selectedPlan,
  onSelectPlan,
  onContinue,
  isSubmitting = false,
}: {
  selectedPlan: MembershipPlan | null
  onSelectPlan: (plan: MembershipPlan) => void
  onContinue: () => void | Promise<void>
  isSubmitting?: boolean
}) {
  const plans = MEMBERSHIP_PLANS

  return (
    <div className="relative isolate min-h-screen bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl opacity-30">
        <div
          className="mx-auto aspect-1155/678 w-288.75 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base/7 font-semibold text-primary">Fiyatlandırma</h2>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl">
          Size uygun paketi seçin
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
        İşletmeniz için uygun paketi seçerek başvurunuzu incelemeye gönderebilirsiniz. Müşteri sadakati oluşturmak ve satışları artırmak için en iyi özelliklerle dolu uygun bir plan seçin.
      </p>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {plans.map((plan, tierIdx) => (
          <div
            key={plan.id}
            className={`
              relative rounded-3xl p-8 ring-1 ring-border sm:p-10
              ${selectedPlan === plan.id ? 'bg-primary text-primary-foreground shadow-2xl' : 'bg-card/60 sm:mx-8 lg:mx-0'}
              ${selectedPlan !== plan.id && tierIdx === 0 ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl' : ''}
              ${selectedPlan !== plan.id && tierIdx === 1 ? 'sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none' : ''}
            `}
          >
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
            <Button
              onClick={() => onSelectPlan(plan.id)}
              className={`
                mt-8 block w-full rounded-xl px-3.5 py-2.5 text-center text-sm font-semibold sm:mt-10
                ${selectedPlan === plan.id
                  ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }
              `}
            >
              {selectedPlan === plan.id ? 'Seçildi' : 'Bu Paketi Seç'}
            </Button>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <Button
          className="h-12 rounded-xl px-10"
          onClick={() => void onContinue()}
          disabled={isSubmitting || !selectedPlan}
        >
          {isSubmitting ? "Kaydediliyor..." : "İlerle"}
        </Button>
      </div>
    </div>
  )
}

interface IndividualInvitationRow {
  id: string
  businessName: string
}

function IndividualInvitationsView({ userId, onAccepted }: { userId: string; onAccepted: (businessUserId: string) => void }) {
  const [rows, setRows] = useState<IndividualInvitationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null)
  const [acceptedMessage, setAcceptedMessage] = useState("")

  useEffect(() => {
    const loadRows = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const res = await apiFetch(`/api/personel-invitations?individualUserId=${encodeURIComponent(userId)}`, { cache: "no-store" })
        const data = await res.json().catch(() => null)
        if (res.ok && data?.ok && Array.isArray(data?.rows)) {
          setRows(data.rows)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadRows()
  }, [userId])

  const acceptInvitation = async (invitationId: string) => {
    try {
      setIsAcceptingId(invitationId)
      const res = await apiFetch("/api/personel-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", invitationId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        alert(data?.message ?? "Davet kabul edilemedi.")
        return
      }

      setRows((current) => current.filter((row) => row.id !== invitationId))
      setAcceptedMessage("Davet kabul edildi. Artık işletmenin personel listesine eklendiniz.")
      onAccepted(String(data.businessUserId ?? ""))
    } finally {
      setIsAcceptingId(null)
    }
  }

  return (
    <div className="relative isolate h-screen bg-background px-6 py-8 lg:px-8 flex items-center justify-center">
      <div className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl opacity-30">
        <div
          className="mx-auto aspect-1155/678 w-288.75 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
      <div className="mx-auto max-w-2xl text-center w-full">
        {acceptedMessage ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Davet Kabul Edildi
            </h2>
            <p className="mt-3 text-base text-muted-foreground">{acceptedMessage}</p>
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Artık panele giriş yapabilir ve işletmenizin personel listesinde yer alabilirsiniz.
              </p>
            </div>
          </>
        ) : rows.length > 0 ? (
          <>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Bekleyen Personel Daveti
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              İşletmeniz sizi personel olarak davet etti. Daveti inceleyip kabul edebilirsiniz.
            </p>
            <div className="mt-8 space-y-4 text-left">
              {rows.map((row) => (
                <div key={row.id} className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg">{row.businessName}</p>
                      <p className="text-sm text-muted-foreground">Sizi personel olarak davet etti</p>
                    </div>
                  </div>
                  <Button
                    className="rounded-xl px-6"
                    onClick={() => acceptInvitation(row.id)}
                    disabled={isAcceptingId === row.id}
                  >
                    {isAcceptingId === row.id ? "Kabul ediliyor..." : "Kabul Et"}
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Clock3 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {isLoading ? "Davetler Kontrol Ediliyor..." : "Davet Bekleniyor"}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Lütfen işletmenizin sizi kendi bünyesine eklemesini bekleyin.
            </p>
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Sıradaki Adımlar</h3>
              <ul className="space-y-3 text-left text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <span>İşletmeniz sizi personel olarak davet edecek</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <span>Daveti buradan kabul edebilirsiniz</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <span>Kabul ettikten sonra panele giriş yapabileceksiniz</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              Sorularınız için destek@hstplanet.com adresine e-posta gönderebilirsiniz.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface CorporateApprovalRow {
  userId: string
  username: string
  phone: string
  businessName: string
  ownerFirstName: string
  ownerLastName: string
  taxOffice: string
  taxNumber: string
  membershipPlanTitle: string
  requestType: string
  pendingUpgradeRequest: boolean
  isActive: boolean
}

function CorporateApprovalsView() {
  const [rows, setRows] = useState<CorporateApprovalRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null)

  const loadRows = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setIsLoading(true)
      const res = await apiFetch("/api/corporate-approvals", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok || !Array.isArray(data?.rows)) {
        alert(data?.message ?? "Kurumsal kayitlar getirilemedi.")
        return
      }
      setRows(data.rows)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRows()
  }, [])

  const approveRow = async (userId: string, requestType: string) => {
    try {
      setIsApprovingId(userId)
      const res = await apiFetch("/api/corporate-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, requestType }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        alert(data?.message ?? "Kayit onaylanamadi.")
        return
      }
      await loadRows({ silent: true })
    } finally {
      setIsApprovingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tüm Müşteriler</h1>
        <p className="text-sm text-muted-foreground mt-1">Kurumsal müşterileri görüntüleyin, başvuruları ve paket yükseltme taleplerini onaylayın.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">İşletme</th>
                <th className="px-4 py-3 text-left font-medium">Yetkili</th>
                <th className="px-4 py-3 text-left font-medium">İletişim</th>
                <th className="px-4 py-3 text-left font-medium">Vergi Bilgileri</th>
                <th className="px-4 py-3 text-left font-medium">Paket</th>
                <th className="px-4 py-3 text-left font-medium">Durum</th>
                <th className="px-4 py-3 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-t border-border">
                  <td className="px-4 py-4 font-medium text-foreground">{row.businessName}</td>
                  <td className="px-4 py-4 text-muted-foreground">{row.ownerFirstName} {row.ownerLastName}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    <div>{row.username}</div>
                    <div>{row.phone}</div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    <div>{row.taxOffice}</div>
                    <div>{row.taxNumber}</div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{row.membershipPlanTitle}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {!row.isActive && <Badge variant="destructive">Onay Bekliyor</Badge>}
                    {row.isActive && row.pendingUpgradeRequest && <Badge variant="default" className="bg-blue-500">Yükseltme Bekliyor</Badge>}
                    {row.isActive && !row.pendingUpgradeRequest && <Badge variant="default" className="bg-emerald-500">Onaylandı</Badge>}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {(!row.isActive || row.pendingUpgradeRequest) && (
                      <Button
                        className="rounded-xl"
                        onClick={() => approveRow(row.userId, row.requestType)}
                        disabled={isApprovingId === row.userId}
                      >
                        {isApprovingId === row.userId ? "Onaylanıyor..." : (row.requestType === "upgrade" ? "Yükseltmeyi Onayla" : "Onayla")}
                      </Button>
                    )}
                    {row.isActive && !row.pendingUpgradeRequest && (
                      <span className="text-muted-foreground text-sm">Zaten onaylandı</span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Kurumsal müşteri yok.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Kayıtlar yükleniyor...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
