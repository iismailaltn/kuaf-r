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
} from "lucide-react"
import { useState } from "react"

export type ViewType = "dashboard" | "orders" | "tables" | "products" | "inventory" | "settings"

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onLogout: () => void
  restaurantName?: string
}

const navItems = [
  { id: "dashboard" as const, icon: LayoutDashboard, label: "Panel" },
  { id: "orders" as const, icon: ShoppingCart, label: "Siparisler" },
  { id: "tables" as const, icon: UtensilsCrossed, label: "Masalar" },
  { id: "products" as const, icon: Package, label: "Urunler" },
  { id: "inventory" as const, icon: Box, label: "Stok" },
  { id: "settings" as const, icon: Settings, label: "Ayarlar" },
]

export function Sidebar({ activeView, onViewChange, onLogout, restaurantName = "Restoran" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

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
          <span className="font-semibold text-foreground truncate">{restaurantName}</span>
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
        {navItems.map((item) => {
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
