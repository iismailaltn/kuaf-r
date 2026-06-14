"use client"

import { useState, useEffect } from "react"
import type { SessionOperation } from "@/lib/session-operations"
import type { ProductSale } from "@/lib/product-sales"
import type { GoogleReview } from "@/lib/google-reviews"
import type { ReservationRecord } from "@/lib/reservations-store"
import type { Notification } from "@/lib/notifications"
import {
  createSessionNotification,
  createProductNotification,
  createReviewNotification,
  createReservationNotification,
} from "@/lib/notifications"

interface UseNotificationsProps {
  sessions?: SessionOperation[]
  products?: ProductSale[]
  reviews?: GoogleReview[]
  reservations?: ReservationRecord[]
  enabled?: boolean
}

export function useNotifications({
  sessions = [],
  products = [],
  reviews = [],
  reservations = [],
  enabled = true,
}: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled) return

    const newNotifications: Notification[] = []

    // Add session notifications (completed sessions)
    sessions
      .filter((session) => !session.isActive && session.endedAt)
      .slice(0, 10)
      .forEach((session) => {
        newNotifications.push(createSessionNotification(session))
      })

    // Add product notifications (recent sales)
    products
      .slice(0, 10)
      .forEach((product) => {
        newNotifications.push(createProductNotification(product))
      })

    // Add review notifications (new reviews)
    reviews
      .slice(0, 10)
      .forEach((review) => {
        newNotifications.push(createReviewNotification(review))
      })

    // Add reservation notifications (new reservations)
    reservations
      .slice(0, 10)
      .forEach((reservation) => {
        newNotifications.push(createReservationNotification(reservation))
      })

    // Sort by timestamp (newest first)
    newNotifications.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      return timeB - timeA
    })

    setNotifications(newNotifications)
    
    // Mark all as unread initially
    setUnreadIds(new Set(newNotifications.map((n) => n.id)))
  }, [sessions, products, reviews, reservations, enabled])

  const unreadCount = unreadIds.size

  const markAsRead = (id: string) => {
    setUnreadIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const markAllAsRead = () => {
    setUnreadIds(new Set())
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadIds(new Set())
  }

  return {
    notifications,
    unreadCount,
    unreadIds,
    markAsRead,
    markAllAsRead,
    clearAll,
  }
}
