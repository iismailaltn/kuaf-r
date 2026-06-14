import type { ScheduledStage } from "@/lib/salon-service-stages"
import {
  enrichStaffBusyBlocksFromDb,
  enrichStagesFromDb,
  normalizeStoredStaffBlocks,
  normalizeStoredStages,
} from "@/lib/reservation-sql-payload"
import { parseTimeToMinutes, type StaffBusyBlockLabel } from "@/lib/reservation-scheduling"
import { parseStoredJson } from "@/lib/sql-sanitize"
import type { ReservationRecord, ReservationStatus } from "@/lib/reservations-store"

export type SalonReservationRow = {
  id?: number | string
  business_user_id?: number | string
  businessUserId?: number | string
  reservation_date?: string
  reservationDate?: string
  start_time?: string
  startTime?: string
  end_time?: string
  endTime?: string
  customer_name?: string
  customerName?: string
  customer_surname?: string
  customerSurname?: string
  phone?: string
  staff_id?: string
  staffId?: string
  staff_name?: string
  staffName?: string
  service_ids_json?: string
  serviceIdsJson?: string
  service_names_json?: string
  serviceNamesJson?: string
  notes?: string
  source?: string
  status?: string
  total_minutes?: number | string
  totalMinutes?: number | string
  stages_json?: string
  stagesJson?: string
  staff_busy_blocks_json?: string
  staffBusyBlocksJson?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

function getField(row: Record<string, unknown>, candidates: string[]) {
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const direct = row[candidate]
    if (direct !== undefined && direct !== null) {
      return direct
    }
    const normalized = candidate.toLowerCase().replace(/[^a-z0-9]/g, "")
    const found = entries.find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized)
    if (found && found[1] !== undefined && found[1] !== null) {
      return found[1]
    }
  }
  return undefined
}

function normalizeTimeField(raw: string) {
  const trimmed = raw.trim()
  const hm = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (hm) {
    return `${hm[1].padStart(2, "0")}:${hm[2]}`
  }
  const iso = /T(\d{1,2}):(\d{2})/.exec(trimmed)
  if (iso) {
    return `${iso[1].padStart(2, "0")}:${iso[2]}`
  }
  return trimmed
}

function normalizeReservationDate(raw: string) {
  const trimmed = raw.trim()
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed)
  if (iso) {
    return iso[1]
  }
  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }
  return trimmed
}

export function normalizeReservationRow(row: SalonReservationRow): ReservationRecord | null {
  const record = row as Record<string, unknown>
  const idNum = Number(getField(record, ["id", "ID"]))
  const date = normalizeReservationDate(
    String(getField(record, ["reservation_date", "reservationDate"]) ?? ""),
  )
  const startTime = normalizeTimeField(String(getField(record, ["start_time", "startTime"]) ?? ""))
  const endTime = normalizeTimeField(String(getField(record, ["end_time", "endTime"]) ?? ""))
  const customerName = String(getField(record, ["customer_name", "customerName"]) ?? "").trim()
  const customerSurname = String(getField(record, ["customer_surname", "customerSurname"]) ?? "").trim()

  if (!Number.isFinite(idNum) || !date || !startTime || !customerName) {
    return null
  }

  const serviceIds = parseStoredJson<unknown[]>(
    getField(record, ["service_ids_json", "serviceIdsJson"]),
    [],
  )
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  const serviceNames = parseStoredJson<unknown[]>(
    getField(record, ["service_names_json", "serviceNamesJson"]),
    [],
  ).map((value) => String(value))

  const stages = enrichStagesFromDb(
    normalizeStoredStages(
      parseStoredJson<unknown[]>(getField(record, ["stages_json", "stagesJson"]), []),
    ),
  )

  const staffBusyBlocks = enrichStaffBusyBlocksFromDb(
    normalizeStoredStaffBlocks(
      parseStoredJson<unknown[]>(getField(record, ["staff_busy_blocks_json", "staffBusyBlocksJson"]), []),
    ),
    startTime,
  )

  const statusRaw = String(getField(record, ["status"]) ?? "confirmed").trim().toLowerCase()
  const status: ReservationStatus =
    statusRaw === "pending" || statusRaw === "completed" || statusRaw === "cancelled"
      ? statusRaw
      : statusRaw === "confirmed"
        ? "confirmed"
        : "confirmed"

  const sourceRaw = String(getField(record, ["source"]) ?? "manual").trim().toLowerCase()
  const source: import("@/lib/reservations-store").ReservationRecord["source"] =
    sourceRaw === "website" ? "website" : sourceRaw === "whatsapp" ? "whatsapp" : "manual"

  return {
    id: String(idNum),
    date,
    startTime,
    endTime: endTime || startTime,
    customerName,
    customerSurname,
    phone: String(getField(record, ["phone"]) ?? "").trim(),
    serviceIds,
    serviceNames,
    staffId: String(getField(record, ["staff_id", "staffId"]) ?? "").trim(),
    staffName: String(getField(record, ["staff_name", "staffName"]) ?? "").trim(),
    notes: String(getField(record, ["notes"]) ?? "").trim(),
    source,
    status,
    totalMinutes: Number(getField(record, ["total_minutes", "totalMinutes"]) ?? 0) || 0,
    stages,
    staffBusyBlocks,
  }
}

export function reservationRowKey(
  row: Pick<ReservationRecord, "id" | "date" | "startTime"> & { time?: string } | { id: string; date: string; time: string; startTime?: string },
) {
  return `${row.id}|${row.date}|${("startTime" in row && row.startTime) ?? ("time" in row && row.time) ?? ""}`
}

export function dedupeReservationRows(rows: ReservationRecord[]) {
  const seen = new Map<string, ReservationRecord>()
  for (const row of rows) {
    const key = reservationRowKey(row)
    if (!seen.has(key)) {
      seen.set(key, row)
    }
  }
  return Array.from(seen.values())
}

export function normalizeReservationRows(rows: SalonReservationRow[]) {
  return dedupeReservationRows(
    rows
      .map((row) => normalizeReservationRow(row))
      .filter((row): row is ReservationRecord => row !== null),
  ).sort((a, b) => {
    const aKey = `${a.date}T${a.startTime}`
    const bKey = `${b.date}T${b.startTime}`
    return aKey.localeCompare(bKey)
  })
}

export function reservationToBusyBlocksForConflict(record: ReservationRecord) {
  const base = parseTimeToMinutes(record.startTime)
  if (!Number.isFinite(base)) {
    return []
  }
  return record.staffBusyBlocks.map((block) => {
    if (block.startMinutes >= base) {
      return { startMinutes: block.startMinutes, endMinutes: block.endMinutes }
    }
    return {
      startMinutes: base + block.startMinutes,
      endMinutes: base + block.endMinutes,
    }
  })
}
