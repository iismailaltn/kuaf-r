"use client"

import { useMemo, useState } from "react"
import { Bell, BellOff, CheckCheck, Scissors, ShoppingBag, Star, Calendar, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Notification, NotificationType } from "@/lib/notifications"
import {
  formatRelativeTime,
  getNotificationTone,
  getNotificationAccent,
  getNotificationTypeLabel,
} from "@/lib/notifications"

interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
  unreadIds?: Set<string>
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onClearAll?: () => void
}

type FilterValue = "all" | "unread"

const ICONS: Record<NotificationType, typeof Bell> = {
  session: Scissors,
  product: ShoppingBag,
  review: Star,
  reservation: Calendar,
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const Icon = ICONS[type] ?? Bell
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        getNotificationTone(type),
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  )
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  unreadIds,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<FilterValue>("all")

  const isUnread = (id: string) => unreadIds?.has(id) ?? false

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => isUnread(n.id))
    }
    return notifications
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, filter, unreadIds])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground ring-2 ring-card">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Bildirimler</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[360px] overflow-hidden rounded-2xl p-0 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Bildirimler</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {unreadCount} yeni
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAllAsRead?.()
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tümünü oku
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 pb-3">
          {(
            [
              { value: "all", label: "Tümü" },
              { value: "unread", label: "Okunmamış" },
            ] as { value: FilterValue; label: string }[]
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFilter(tab.value)
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === tab.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {tab.label}
              {tab.value === "unread" && unreadCount > 0 && (
                <span className="ml-1 opacity-70">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BellOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {filter === "unread" ? "Okunmamış bildirim yok" : "Bildirim yok"}
            </p>
            <p className="text-xs text-muted-foreground">
              Yeni etkinlikler burada görünecek.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[340px]">
            <div className="flex flex-col gap-0.5 px-2 pb-2">
              {visibleNotifications.map((notification) => {
                const unread = isUnread(notification.id)
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => onMarkAsRead?.(notification.id)}
                    className={cn(
                      "group relative flex w-full items-start gap-3 rounded-xl px-2.5 py-3 text-left transition-colors hover:bg-muted/60",
                      unread && "bg-primary/[0.04]",
                    )}
                  >
                    {/* Unread accent rail */}
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity",
                        getNotificationAccent(notification.type),
                        unread ? "opacity-100" : "opacity-0",
                      )}
                    />

                    <NotificationIcon type={notification.type} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <span className="mt-1.5 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                    </div>

                    {unread && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onClearAll?.()
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Tüm bildirimleri temizle
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
