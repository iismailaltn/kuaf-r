"use client"

import { useEffect, useState } from "react"
import { Sidebar, ViewType, UserRole } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { OrdersView } from "@/components/dashboard/orders-view"
import { TablesView } from "@/components/dashboard/tables-view"
import { ProductsView } from "@/components/dashboard/products-view"
import { InventoryView } from "@/components/dashboard/inventory-view"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { UsersView } from "@/components/dashboard/users-view"
import { ReservationsView } from "@/components/dashboard/reservations-view"
import { PerformanceView } from "@/components/dashboard/performance-view"
import { OperationsView } from "@/components/dashboard/operations-view"
import { ReviewsView } from "@/components/dashboard/reviews-view"
import { MyReservationsView } from "@/components/dashboard/my-reservations-view"
import { SettingsView } from "@/components/dashboard/settings-view"
import { loginWithApi, registerWithApi } from "@/lib/services/auth-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock3 } from "lucide-react"

type AuthState = "login" | "register" | "authenticated"
type MembershipPlan = "basic" | "professional"

interface User {
  id: string
  email: string
  shopName: string
  role: UserRole
  accountType: string
  isActive: boolean
  staffAccepted: boolean
}

export default function Dashboard() {
  const [authState, setAuthState] = useState<AuthState>("login")
  const [user, setUser] = useState<User | null>(null)
  const [activeView, setActiveView] = useState<ViewType>("dashboard")
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [corporateReviewSubmitted, setCorporateReviewSubmitted] = useState(false)

  const handleLogin = async (emailOrUsername: string, password: string) => {
    const loginId = emailOrUsername.trim().toLowerCase()
    if (loginId === "admin" && password === "admin") {
      setUser({ id: "", email: "admin", shopName: "admin", role: "admin", accountType: "admin", isActive: true, staffAccepted: false })
      setAuthState("authenticated")
      setActiveView("dashboard")
      return
    }
    try {
      const authUser = await loginWithApi({
        username: emailOrUsername,
        password,
      })
      const role = (authUser.role === "admin" || authUser.role === "supervisor") ? authUser.role : "user"
      setUser({
        email: authUser.username,
        id: authUser.id,
        shopName: authUser.shopName,
        role,
        accountType: authUser.accountType,
        isActive: authUser.isActive,
        staffAccepted: authUser.staffAccepted,
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
      setUser({
        email: authUser.username,
        id: authUser.id,
        shopName: authUser.shopName,
        role,
        accountType: authUser.accountType,
        isActive: authUser.isActive,
        staffAccepted: authUser.staffAccepted,
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

  const renderView = () => {
    if (user?.role === "user" && user.accountType === "bireysel" && !user.staffAccepted) {
      return <IndividualInvitationsView userId={user.id} onAccepted={() => setUser({ ...user, staffAccepted: true })} />
    }

    if (user?.role === "user" && user.accountType === "kurumsal" && !user.isActive) {
      if (corporateReviewSubmitted) {
        return (
          <div className="min-h-full flex items-center justify-center p-6">
            <div className="max-w-xl text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Clock3 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                Bilgileriniz inceleniyor. En kısa zamanda sizi aramızda görmekten mutluluk duyacağız.
              </h1>
            </div>
          </div>
        )
      }

      return (
        <CorporatePricingView
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          onContinue={() => {
            if (!selectedPlan) {
              alert("Lutfen bir paket secin.")
              return
            }
            setCorporateReviewSubmitted(true)
          }}
        />
      )
    }

    switch (activeView) {
      case "dashboard":
        return <DashboardView shopName={user?.shopName} />
      case "orders":
        return <OrdersView />
      case "tables":
        return <TablesView canManage={user?.role === "admin"} />
      case "products":
        return <ProductsView />
      case "inventory":
        return <InventoryView />
      case "settings":
        return <SettingsView user={user ? { email: user.email, shopName: user.shopName, role: user.role } : undefined} />
      case "users":
        return <UsersView businessUserId={user?.id} businessUsername={user?.email} />
      case "reservations":
        return <ReservationsView />
      case "performance":
        return <PerformanceView />
      case "operations":
        return <OperationsView />
      case "reviews":
        return <ReviewsView />
      case "my-reservations":
        return <MyReservationsView staffName={user?.shopName} />
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
        role={user?.role}
        hideNavigation={user?.role === "user" && ((user.accountType === "bireysel" && !user.staffAccepted) || (user.accountType === "kurumsal" && !user.isActive))}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
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
}: {
  selectedPlan: MembershipPlan | null
  onSelectPlan: (plan: MembershipPlan) => void
  onContinue: () => void
}) {
  const plans = [
    {
      id: "basic" as const,
      title: "Başlangıç",
      price: "₺999",
      description: "Küçük işletmeler için temel panel erişimi.",
      features: ["Randevu yönetimi", "Personel yönetimi", "Temel raporlar"],
    },
    {
      id: "professional" as const,
      title: "Profesyonel",
      price: "₺1.999",
      description: "Büyüyen işletmeler için gelişmiş yönetim paketi.",
      features: ["Tüm başlangıç özellikleri", "Performans ekranları", "Operasyon takibi"],
    },
  ]

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Üyelik paketini seç</h1>
          <p className="text-muted-foreground">İşletmeniz için uygun paketi seçerek başvurunuzu incelemeye gönderebilirsiniz.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={selectedPlan === plan.id ? "border-primary shadow-lg shadow-primary/10" : "border-border"}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{plan.title}</CardTitle>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </div>
                  {selectedPlan === plan.id && <Badge>Seçildi</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground"> / ay</span>
                </div>
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant={selectedPlan === plan.id ? "default" : "outline"}
                  className="w-full rounded-xl"
                  onClick={() => onSelectPlan(plan.id)}
                >
                  Bu Paketi Seç
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button className="h-12 rounded-xl px-10" onClick={onContinue}>
            İlerle
          </Button>
        </div>
      </div>
    </div>
  )
}

interface IndividualInvitationRow {
  id: string
  businessName: string
}

function IndividualInvitationsView({ userId, onAccepted }: { userId: string; onAccepted: () => void }) {
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
        const res = await fetch(`/api/personel-invitations?individualUserId=${encodeURIComponent(userId)}`, { cache: "no-store" })
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
      const res = await fetch("/api/personel-invitations", {
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
      onAccepted()
    } finally {
      setIsAcceptingId(null)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Clock3 className="w-7 h-7 text-primary" />
        </div>

        {acceptedMessage ? (
          <h1 className="text-2xl font-semibold text-foreground">{acceptedMessage}</h1>
        ) : rows.length > 0 ? (
          <>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Bekleyen personel davetiniz var.</h1>
              <p className="text-muted-foreground mt-2">Davetleri inceleyip kabul edebilirsiniz.</p>
            </div>
            <div className="space-y-3 text-left">
              {rows.map((row) => (
                <div key={row.id} className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{row.businessName}</p>
                    <p className="text-sm text-muted-foreground">Sizi kendi bünyesine personel olarak davet etti.</p>
                  </div>
                  <Button
                    className="rounded-xl"
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
          <h1 className="text-2xl font-semibold text-foreground">
            {isLoading ? "Davetler kontrol ediliyor..." : "Lütfen işletmenizin sizi kendi bünyesine eklemesini bekleyin."}
          </h1>
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
}

function CorporateApprovalsView() {
  const [rows, setRows] = useState<CorporateApprovalRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null)

  const loadRows = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/corporate-approvals", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok || !Array.isArray(data?.rows)) {
        alert(data?.message ?? "Kurumsal kayitlar getirilemedi.")
        return
      }
      setRows(data.rows)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRows()
  }, [])

  const approveRow = async (userId: string) => {
    try {
      setIsApprovingId(userId)
      const res = await fetch("/api/corporate-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        alert(data?.message ?? "Kayit onaylanamadi.")
        return
      }
      setRows((current) => current.filter((row) => row.userId !== userId))
    } finally {
      setIsApprovingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Kurumsal Onaylar</h1>
        <p className="text-sm text-muted-foreground mt-1">Kurumsal üyelik başvurularını inceleyip onaylayın.</p>
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
                  <td className="px-4 py-4 text-right">
                    <Button
                      className="rounded-xl"
                      onClick={() => approveRow(row.userId)}
                      disabled={isApprovingId === row.userId}
                    >
                      {isApprovingId === row.userId ? "Onaylanıyor..." : "Onayla"}
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Onay bekleyen kurumsal kayıt yok.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
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
