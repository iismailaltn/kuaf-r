import {
  buildReservationTimeline,
  canStaffTakeBooking,
  DEFAULT_WORKING_HOURS,
  formatMinutesToTime,
  parseTimeToMinutes,
  type StaffReservationConflictInput,
} from "@/lib/reservation-scheduling"
import { reservationToBusyBlocksForConflict } from "@/lib/reservations-db"
import type { ReservationRecord } from "@/lib/reservations-store"
import { buildBookingPlan } from "@/lib/whatsapp-bot/salon-data"
import type { StaffOption } from "@/lib/whatsapp-bot/types"

function toConflictInputs(reservations: ReservationRecord[]): StaffReservationConflictInput[] {
  return reservations.map((r) => ({
    date: r.date,
    staffId: r.staffId,
    staffBusyBlocks: reservationToBusyBlocksForConflict(r),
    status: r.status,
  }))
}

export type AvailableSlotResult =
  | {
      available: true
      staffId: string
      staffName: string
      startTime: string
      endTime: string
      totalMinutes: number
      stages: import("@/lib/salon-service-stages").ScheduledStage[]
      staffBusyBlocks: Array<{ startMinutes: number; endMinutes: number }>
    }
  | { available: false; sampleSlots: string }

export async function findAvailableSlot(options: {
  businessUserId: string
  date: string
  preferredTime: string
  serviceIds: number[]
  serviceNames: string[]
  staffList: StaffOption[]
  reservations: ReservationRecord[]
}): Promise<AvailableSlotResult> {
  const plan = await buildBookingPlan(options.businessUserId, options.serviceIds, options.serviceNames)
  const conflicts = toConflictInputs(options.reservations)
  const preferredMinutes = parseTimeToMinutes(options.preferredTime)

  const candidateTimes = Number.isFinite(preferredMinutes)
    ? [
        options.preferredTime,
        ...DEFAULT_WORKING_HOURS.filter((slot) => slot !== options.preferredTime),
      ]
    : DEFAULT_WORKING_HOURS

  for (const staff of options.staffList) {
    for (const startTime of candidateTimes) {
      if (
        !canStaffTakeBooking(
          options.date,
          staff.id,
          startTime,
          plan.staffBusyBlocks,
          conflicts,
        )
      ) {
        continue
      }

      const timeline = buildReservationTimeline(startTime, plan.stages, plan.staffBusyBlocks)
      if (!timeline) {
        continue
      }

      return {
        available: true,
        staffId: staff.id,
        staffName: staff.name,
        startTime,
        endTime: timeline.endTime,
        totalMinutes: plan.totalMinutes,
        stages: plan.stages,
        staffBusyBlocks: plan.staffBusyBlocks,
      }
    }
  }

  const sampleSlots = DEFAULT_WORKING_HOURS.filter((slot) => {
    const minutes = parseTimeToMinutes(slot)
    return Number.isFinite(minutes) && minutes >= 9 * 60 && minutes <= 18 * 60
  })
    .slice(0, 5)
    .join(", ")

  return { available: false, sampleSlots }
}

export function formatEndTime(startTime: string, totalMinutes: number) {
  const start = parseTimeToMinutes(startTime)
  if (!Number.isFinite(start)) {
    return startTime
  }
  return formatMinutesToTime(start + totalMinutes)
}
