"use client"

import { useState } from "react"
import { Bell, Check, Scissors, ShoppingBag, Star, Calendar, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/notifications"
import { formatRelativeTime, getNotificationIcon, getNotificationColor } from "@/lib/notifications"

interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onClearAll?: () => void
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false)

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "session":
        return <Scissors className="w-4 h-4" />
      case "product":
        return <ShoppingBag className="w-4 h-4" />
      case "review":
        return <Star className="w-4 h-4" />
      case "reservation":
        return <Calendar className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                unreadCount > 9 ? "bg-red-500" : "bg-primary"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirimler</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAllAsRead?.()
              }}
            >
              Tümünü okundu işaretle
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Bildirim yok</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-3 gap-1 cursor-pointer"
                  onClick={() => {
                    onMarkAsRead?.(notification.id)
                  }}
                >
                  <div className="flex items-start gap-2 w-full">
                    <div
                      className={cn(
                        "p-1.5 rounded-full text-white flex-shrink-0",
                        getNotificationColor(notification.type)
                      )}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{notification.title}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-sm text-muted-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onClearAll?.()
              }}
            >
              Tüm bildirimleri temizle
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
