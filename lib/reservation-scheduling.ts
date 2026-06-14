import type { ScheduledStage } from "@/lib/salon-service-stages"

export type TimeRangeMinutes = { startMinutes: number; endMinutes: number }

export function parseTimeToMinutes(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) {
    return NaN
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return NaN
  }
  return hours * 60 + minutes
}

export function formatMinutesToTime(totalMinutes: number) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function rangesOverlap(a: TimeRangeMinutes, b: TimeRangeMinutes) {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes
}

export function staffBlocksOverlap(
  candidate: TimeRangeMinutes[],
  existing: TimeRangeMinutes[],
) {
  return candidate.some((block) => existing.some((other) => rangesOverlap(block, other)))
}

export interface StaffBusyBlockLabel {
  start: string
  end: string
  startMinutes: number
  endMinutes: number
}

export function toStaffBusyBlockLabels(
  blocks: TimeRangeMinutes[],
  dayOffsetMinutes = 0,
): StaffBusyBlockLabel[] {
  return blocks.map((block) => ({
    start: formatMinutesToTime(dayOffsetMinutes + block.startMinutes),
    end: formatMinutesToTime(dayOffsetMinutes + block.endMinutes),
    startMinutes: block.startMinutes,
    endMinutes: block.endMinutes,
  }))
}

export function buildReservationTimeline(
  startTime: string,
  stages: ScheduledStage[],
  staffBusyBlocks: TimeRangeMinutes[],
) {
  const startMinutes = parseTimeToMinutes(startTime)
  if (!Number.isFinite(startMinutes)) {
    return null
  }

  // stage.startMinutes / staffBusyBlocks are 0-based from appointment start (see buildMultiServicePlan)
  const normalizedStages = stages.map((stage) => ({
    ...stage,
    offsetMinutes: stage.startMinutes,
    startMinutes: stage.startMinutes,
    endMinutes: stage.endMinutes,
  }))

  const endFromTimeline = Math.max(
    staffBusyBlocks.reduce((max, block) => Math.max(max, block.endMinutes), 0),
    normalizedStages.reduce((max, stage) => Math.max(max, stage.endMinutes), 0),
  )

  return {
    startMinutes,
    endMinutes: startMinutes + endFromTimeline,
    endTime: formatMinutesToTime(startMinutes + endFromTimeline),
    stages: normalizedStages,
    staffBusyBlocks: toStaffBusyBlockLabels(staffBusyBlocks, startMinutes),
  }
}

export type StaffReservationConflictInput = {
  date: string
  staffId: string
  staffBusyBlocks: Array<{ startMinutes: number; endMinutes: number }>
  status: string
}

function sameStaffId(a: string, b: string) {
  return String(a).trim() === String(b).trim()
}

/** Bu personel bu saat diliminde (aktif asama) mesgul mu? */
export function isStaffBusyAtClockTime(
  staffId: string,
  date: string,
  clockTime: string,
  reservations: StaffReservationConflictInput[],
) {
  const minute = parseTimeToMinutes(clockTime)
  if (!Number.isFinite(minute)) {
    return false
  }

  const blocks = reservations
    .filter(
      (reservation) =>
        reservation.date === date &&
        sameStaffId(reservation.staffId, staffId) &&
        reservation.status !== "cancelled",
    )
    .flatMap((reservation) => reservation.staffBusyBlocks)

  return blocks.some((block) => minute >= block.startMinutes && minute < block.endMinutes)
}

/** Yeni randevu baslangici: yalnizca ayni personelin mevcut bloklariyla cakisir mi? */
export function canStaffTakeBooking(
  date: string,
  staffId: string,
  startTime: string,
  staffBusyBlocks: TimeRangeMinutes[],
  reservations: StaffReservationConflictInput[],
) {
  const startMinutes = parseTimeToMinutes(startTime)
  if (!Number.isFinite(startMinutes)) {
    return false
  }

  const shiftedCandidate = staffBusyBlocks.map((block) => ({
    startMinutes: startMinutes + block.startMinutes,
    endMinutes: startMinutes + block.endMinutes,
  }))

  const existingBlocks = reservations
    .filter(
      (reservation) =>
        reservation.date === date &&
        sameStaffId(reservation.staffId, staffId) &&
        reservation.status !== "cancelled",
    )
    .flatMap((reservation) => reservation.staffBusyBlocks)

  return !staffBlocksOverlap(shiftedCandidate, existingBlocks)
}

export const DEFAULT_WORKING_HOURS = [
  "09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45", "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45", "18:00", "18:15", "18:30", "18:45",
  "19:00", "19:15", "19:30", "19:45", "20:00",
]
