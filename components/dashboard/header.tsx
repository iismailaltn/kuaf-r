"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { useNotifications } from "@/hooks/use-notifications"
import type { SessionOperation } from "@/lib/session-operations"
import type { ProductSale } from "@/lib/product-sales"
import type { GoogleReview } from "@/lib/google-reviews"
import type { ReservationRecord } from "@/lib/reservations-store"

interface HeaderProps {
  sessions?: SessionOperation[]
  products?: ProductSale[]
  reviews?: GoogleReview[]
  reservations?: ReservationRecord[]
}

export function Header({
  sessions = [],
  products = [],
  reviews = [],
  reservations = [],
}: HeaderProps) {
  const today = new Date()
  const formattedDate = today.toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications({
    sessions,
    products,
    reviews,
    reservations,
    enabled: true,
  })

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="px-4 py-1.5 bg-muted/50 rounded-full text-sm text-muted-foreground">
        Bugun, {formattedDate}
      </div>

      <div className="flex items-center gap-3">
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearAll}
        />
        <Avatar className="w-9 h-9">
          <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" />
          <AvatarFallback>BA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
