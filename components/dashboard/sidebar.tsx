"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Box,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarCheck2,
  BarChart3,
  Star,
} from "lucide-react"
import { useState } from "react"

export type UserRole = "admin" | "supervisor" | "user"
export type ViewType =
  | "dashboard"
  | "orders"
  | "tables"
  | "products"
  | "inventory"
  | "users"
  | "reservations"
  | "my-reservations"
  | "performance"
  | "customers"
  | "reviews"
  | "settings"

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onLogout: () => void
  shopName?: string
  role?: UserRole
}

const navItemsByRole: Record<UserRole, Array<{ id: ViewType; icon: any; label: string }>> = {
  admin: [
    { id: "dashboard", icon: LayoutDashboard, label: "Panel" },
    { id: "orders", icon: ShoppingCart, label: "Siparisler" },
    { id: "tables", icon: UtensilsCrossed, label: "Çalısma Alanları" },
    { id: "products", icon: Package, label: "Urunler" },
    { id: "reviews", icon: Star, label: "Yorumlar" },
    { id: "users", icon: Users, label: "Kullanicilar" },
    { id: "reservations", icon: CalendarCheck2, label: "Rezervasyonlar" },
    { id: "performance", icon: BarChart3, label: "Performans" },
    { id: "inventory", icon: Box, label: "Stok" },
    { id: "settings", icon: Settings, label: "Ayarlar" },
  ],
  supervisor: [
    { id: "dashboard", icon: LayoutDashboard, label: "Panel" },
    { id: "customers", icon: Users, label: "Tum Musteriler" },
    { id: "settings", icon: Settings, label: "Ayarlar" },
  ],
  user: [
    { id: "dashboard", icon: LayoutDashboard, label: "Panel" },
    { id: "my-reservations", icon: CalendarCheck2, label: "Randevularim" },
    { id: "tables", icon: UtensilsCrossed, label: "Calisma Alanlari" },
    { id: "products", icon: Package, label: "Urunler" },
    { id: "settings", icon: Settings, label: "Ayarlar" },
  ],
}

export function Sidebar({ activeView, onViewChange, onLogout, shopName = "Kuaför", role = "user" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const navItems = navItemsByRole[role] ?? navItemsByRole.user
  const adminSectionIds: ViewType[] = ["users", "reservations", "performance", "inventory"]
  const mainNavItems = role === "admin" ? navItems.filter((item) => !adminSectionIds.includes(item.id)) : navItems
  const adminNavItems = role === "admin" ? navItems.filter((item) => adminSectionIds.includes(item.id)) : []

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={cn("flex items-center gap-2", collapsed && "hidden")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground truncate">{shopName}</span>
        </div>
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-md hover:bg-muted transition-colors",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 mx-auto mt-2 rounded-md hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <nav className="flex-1 p-3 space-y-1">
        {mainNavItems.map((item) => {
          const isActive = item.id === activeView
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
        {role === "admin" && !collapsed && (
          <div className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground/80">
            Admin
          </div>
        )}
        {adminNavItems.map((item) => {
          const isActive = item.id === activeView
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Cikis yap</span>}
        </button>
      </div>
    </aside>
  )
}
