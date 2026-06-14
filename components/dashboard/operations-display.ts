import type { SessionOperation } from "@/lib/session-operations"
import { parseOperationTimestampMs } from "@/lib/session-operations"

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getDurationMinutes(operation: SessionOperation) {
  const start = parseOperationTimestampMs(operation.startedAt)
  const end = parseOperationTimestampMs(operation.endedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0
  }

  return Math.max(0, Math.floor((end - start) / 60000))
}

export function formatPrice(value: number) {
  return `${value.toFixed(2)} TL`
}

export function formatServiceItemsSummary(operation: SessionOperation) {
  if (operation.serviceItems.length === 0) {
    return operation.services.join(", ") || "-"
  }

  return operation.serviceItems.map((item) => `${item.name} (${formatPrice(item.price)})`).join(", ")
}
