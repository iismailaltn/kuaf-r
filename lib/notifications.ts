import type { SessionOperation } from "./session-operations"
import type { ProductSale } from "./product-sales"
import type { GoogleReview } from "./google-reviews"
import type { ReservationRecord } from "./reservations-store"

export type NotificationType = "session" | "product" | "review" | "reservation"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  data?: {
    session?: SessionOperation
    product?: ProductSale
    review?: GoogleReview
    reservation?: ReservationRecord
  }
}

export function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const time = new Date(timestamp).getTime()
  const diff = now - time

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Az önce"
  if (minutes < 60) return `${minutes} dakika önce`
  if (hours < 24) return `${hours} saat önce`
  if (days < 7) return `${days} gün önce`
  return new Date(timestamp).toLocaleDateString("tr-TR")
}

export function createSessionNotification(session: SessionOperation): Notification {
  const customerName = `${session.customerName} ${session.customerSurname}`
  const services = session.serviceItems.map((s) => s.name).join(", ")
  
  return {
    id: `session-${session.id}`,
    type: "session",
    title: "Seans Tamamlandı",
    message: `${customerName} - ${services}`,
    timestamp: session.endedAt || session.startedAt || session.createdAt || new Date().toISOString(),
    data: { session },
  }
}

export function createProductNotification(product: ProductSale): Notification {
  const customerName = product.customerName && product.customerSurname 
    ? `${product.customerName} ${product.customerSurname}`
    : product.customerName || "Müşteri"
  
  return {
    id: `product-${product.id}`,
    type: "product",
    title: "Ürün Satıldı",
    message: `${product.productName} (${product.quantity} adet) - ${customerName}`,
    timestamp: product.soldAt || new Date().toISOString(),
    data: { product },
  }
}

export function createReviewNotification(review: GoogleReview): Notification {
  return {
    id: `review-${review.id}`,
    type: "review",
    title: "Yeni Google Yorumu",
    message: `${review.author} - ${review.rating} yıldız`,
    timestamp: review.time || new Date().toISOString(),
    data: { review },
  }
}

export function createReservationNotification(reservation: ReservationRecord): Notification {
  const customerName = `${reservation.customerName} ${reservation.customerSurname}`
  const services = reservation.serviceNames.join(", ")
  
  return {
    id: `reservation-${reservation.id}`,
    type: "reservation",
    title: "Yeni Rezervasyon",
    message: `${customerName} - ${services}`,
    timestamp: `${reservation.date}T${reservation.startTime}`,
    data: { reservation },
  }
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "session":
      return "✂️"
    case "product":
      return "🛒"
    case "review":
      return "⭐"
    case "reservation":
      return "📅"
    default:
      return "🔔"
  }
}

export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "session":
      return "bg-blue-500"
    case "product":
      return "bg-green-500"
    case "review":
      return "bg-yellow-500"
    case "reservation":
      return "bg-purple-500"
    default:
      return "bg-primary"
  }
}
