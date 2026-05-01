"use client"

import { useState } from "react"
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
import { ReviewsView } from "@/components/dashboard/reviews-view"
import { MyReservationsView } from "@/components/dashboard/my-reservations-view"
import { SettingsView } from "@/components/dashboard/settings-view"
import { loginWithApi } from "@/lib/services/auth-service"

type AuthState = "login" | "register" | "authenticated"

interface User {
  email: string
  shopName: string
  role: UserRole
}

export default function Dashboard() {
  const [authState, setAuthState] = useState<AuthState>("login")
  const [user, setUser] = useState<User | null>(null)
  const [activeView, setActiveView] = useState<ViewType>("dashboard")

  const handleLogin = async (emailOrUsername: string, password: string) => {
    const loginId = emailOrUsername.trim().toLowerCase()
    if (loginId === "admin" && password === "admin") {
      setUser({ email: "admin", shopName: "admin", role: "admin" })
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
      setUser({ email: authUser.username, shopName: authUser.shopName, role })
      setAuthState("authenticated")
      setActiveView("dashboard")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Giris basarisiz.")
    }
  }

  const handleRegister = (data: {
    shopName: string
    ownerName: string
    email: string
    phone: string
    password: string
  }) => {
    const emailNormalized = data.email.trim().toLowerCase()
    const shopNormalized = data.shopName.trim().toLowerCase()
    const ownerNormalized = data.ownerName.trim().toLowerCase()

    if (
      emailNormalized === "admin" &&
      shopNormalized === "admin" &&
      ownerNormalized === "admin" &&
      data.password === "admin"
    ) {
      setUser({ email: data.email, shopName: data.shopName, role: "admin" })
      setAuthState("authenticated")
      return
    }

    alert("Kayit basarisiz. Dogru alanlar: hepsi admin, sifre admin")
  }

  const handleLogout = () => {
    setUser(null)
    setAuthState("login")
    setActiveView("dashboard")
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
        return <UsersView />
      case "reservations":
        return <ReservationsView />
      case "performance":
        return <PerformanceView />
      case "reviews":
        return <ReviewsView />
      case "my-reservations":
        return <MyReservationsView staffName={user?.shopName} />
      case "customers":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold text-foreground">Tum Musteriler</h1>
            <p className="text-muted-foreground mt-2">Supervisor tum musteri kayitlarini burada gorur.</p>
          </div>
        )
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
