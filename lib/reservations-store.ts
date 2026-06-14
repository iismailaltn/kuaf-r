import type { ScheduledStage } from "@/lib/salon-service-stages"
import type { StaffBusyBlockLabel } from "@/lib/reservation-scheduling"

export type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled"

export interface ReservationRecord {
  id: string
  date: string
  startTime: string
  endTime: string
  customerName: string
  customerSurname: string
  phone: string
  serviceIds: number[]
  serviceNames: string[]
  staffId: string
  staffName: string
  notes: string
  source: "website" | "manual" | "whatsapp"
  status: ReservationStatus
  totalMinutes: number
  stages: ScheduledStage[]
  staffBusyBlocks: StaffBusyBlockLabel[]
}

const STORAGE_VERSION = 1

function getStorageKey(businessUserId: string) {
  return `kuafor-reservations:v${STORAGE_VERSION}:${businessUserId}`
}

export function readReservations(businessUserId: string): ReservationRecord[] {
  if (typeof window === "undefined" || !businessUserId) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(businessUserId))
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as ReservationRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeReservations(businessUserId: string, rows: ReservationRecord[]) {
  if (typeof window === "undefined" || !businessUserId) {
    return
  }
  window.localStorage.setItem(getStorageKey(businessUserId), JSON.stringify(rows))
}
