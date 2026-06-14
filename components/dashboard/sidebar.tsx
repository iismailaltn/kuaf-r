"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Box,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  CalendarCheck2,
  BarChart3,
  Star,
  ClipboardList,
  ShoppingBag,
  Contact,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type UserRole = "admin" | "supervisor" | "user"
export type ViewType =
  | "dashboard"
  | "tables"
  | "products"
  | "inventory"
  | "users"
  | "reservations"
  | "my-reservations"
  | "performance"
  | "session-operations"
  | "product-sales"
  | "my-customers"
  | "customers"
  | "reviews"
  | "settings"

export const OPERATIONS_VIEW_IDS: ViewType[] = ["session-operations", "product-sales"]

const operationsMenuItems: Array<{ id: ViewType; icon: typeof ClipboardList; label: string }> = [
  { id: "session-operations", icon: ClipboardList, label: "Seans İşlemleri" },
  { id: "product-sales", icon: ShoppingBag, label: "Satılan Ürünler" },
]

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onLogout: () => void
  shopName?: string
  role?: UserRole
  hideNavigation?: boolean
}

const navItemsByRole: Record<UserRole, Array<{ id: ViewType; icon: typeof LayoutDashboard; label: string }>> = {
  admin: [
    { id: "dashboard", icon: LayoutDashboard, label: "Panel" },
    { id: "tables", icon: UtensilsCrossed, label: "Çalısma Alanları" },
    { id: "my-customers", icon: Contact, label: "Müşterilerim" },
    { id: "products", icon: Package, label: "Ürunler" },
    { id: "reviews", icon: Star, label: "Yorumlar" },
    { id: "users", icon: Users, label: "Kullanıcılar" },
    { id: "reservations", icon: CalendarCheck2, label: "Rezervasyonlar" },
    { id: "performance", icon: BarChart3, label: "Performans" },
    { id: "inventory", icon: Box, label: "Stok" },
    { id: "settings", icon: Settings, label: "Ayarlar" },
  ],
  supervisor: [
    { id: "dashboard", icon: LayoutDashboard, label: "Panel" },
    { id: "customers", icon: Users, label: "Tüm Müşteriler" },
    { id: "settings", icon: Settings, label: "Ayarlar" },
  ],
  user: [
    { id: "dashboard", icon: LayoutDashboard, label: "Panel" },
    { id: "my-reservations", icon: CalendarCheck2, label: "Randevularım" },
    { id: "tables", icon: UtensilsCrossed, label: "Çalışma Alanları" },
    { id: "my-customers", icon: Contact, label: "Müşterilerim" },
    { id: "products", icon: Package, label: "Ürünler" },
    { id: "settings", icon: Settings, label: "Ayarlar" },
  ],
}

function OperationsNavMenu({
  collapsed,
  activeView,
  onViewChange,
}: {
  collapsed: boolean
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}) {
  const isGroupActive = OPERATIONS_VIEW_IDS.includes(activeView)
  const [open, setOpen] = useState(isGroupActive)

  useEffect(() => {
    if (isGroupActive) {
      setOpen(true)
    }
  }, [isGroupActive])

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-center px-3 py-2.5 rounded-xl transition-all",
              isGroupActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48 rounded-xl">
          {operationsMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn("gap-2 rounded-lg cursor-pointer", activeView === item.id && "bg-muted")}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
          isGroupActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <ClipboardList className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium flex-1 text-left">İşlemler</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="ml-3 pl-3 border-l border-border space-y-1">
          {operationsMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NavButton({
  item,
  isActive,
  collapsed,
  onViewChange,
}: {
  item: { id: ViewType; icon: typeof LayoutDashboard; label: string }
  isActive: boolean
  collapsed: boolean
  onViewChange: (view: ViewType) => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={() => onViewChange(item.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
    </button>
  )
}

function renderNavList(
  items: Array<{ id: ViewType; icon: typeof LayoutDashboard; label: string }>,
  activeView: ViewType,
  collapsed: boolean,
  onViewChange: (view: ViewType) => void,
  insertOperationsBeforeId?: ViewType
) {
  const nodes: ReactNode[] = []

  items.forEach((item) => {
    if (insertOperationsBeforeId && item.id === insertOperationsBeforeId) {
      nodes.push(
        <OperationsNavMenu
          key="operations-menu"
          collapsed={collapsed}
          activeView={activeView}
          onViewChange={onViewChange}
        />
      )
    }
    nodes.push(
      <NavButton
        key={item.id}
        item={item}
        isActive={activeView === item.id}
        collapsed={collapsed}
        onViewChange={onViewChange}
      />
    )
  })

  return nodes
}

export function Sidebar({ activeView, onViewChange, onLogout, shopName = "Kuaför", role = "user", hideNavigation = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const navItems = navItemsByRole[role] ?? navItemsByRole.user
  const adminSectionIds: ViewType[] = ["users", "reservations", "performance", "inventory"]
  const mainNavItems = role === "admin" ? navItems.filter((item) => !adminSectionIds.includes(item.id)) : navItems
  const adminNavItems = role === "admin" ? navItems.filter((item) => adminSectionIds.includes(item.id)) : []

  const operationsInsertId: ViewType | undefined =
    role === "admin" ? "inventory" : role === "user" ? "products" : undefined

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
        {!hideNavigation && (
          <>
            {renderNavList(mainNavItems, activeView, collapsed, onViewChange, operationsInsertId)}
            {role === "admin" && !collapsed && (
              <div className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground/80">
                Admin
              </div>
            )}
            {renderNavList(adminNavItems, activeView, collapsed, onViewChange, operationsInsertId)}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Çıkış yap</span>}
        </button>
      </div>
    </aside>
  )
}
