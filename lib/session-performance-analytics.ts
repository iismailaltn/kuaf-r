import { parseOperationTimestampMs, type SessionOperation } from "@/lib/session-operations"

function getDurationMinutes(operation: SessionOperation) {
  const start = parseOperationTimestampMs(operation.startedAt)
  const end = parseOperationTimestampMs(operation.endedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0
  }
  return Math.max(0, Math.floor((end - start) / 60000))
}

export type PerformancePeriod = "daily" | "monthly" | "yearly"

export const SESSION_OPERATIONS_UPDATED_EVENT = "session-operations-updated"

const MONTHS_SHORT = ["Oca", "Sub", "Mar", "Nis", "May", "Haz", "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara"]
const DAYS_SHORT = ["Paz", "Pzt", "Sal", "Car", "Per", "Cum", "Cmt"]

export function getCompletedSessionOperations(operations: SessionOperation[]) {
  return operations.filter((operation) => !operation.isActive)
}

function getOperationTimeMs(operation: SessionOperation) {
  const ended = parseOperationTimestampMs(operation.endedAt)
  if (Number.isFinite(ended)) {
    return ended
  }
  return parseOperationTimestampMs(operation.startedAt)
}

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function getRangeForAnchor(anchorDate: Date, period: PerformancePeriod) {
  if (period === "daily") {
    return { startMs: startOfDay(anchorDate).getTime(), endMs: endOfDay(anchorDate).getTime() }
  }

  if (period === "monthly") {
    const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
    const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0, 23, 59, 59, 999)
    return { startMs: start.getTime(), endMs: end.getTime() }
  }

  const start = new Date(anchorDate.getFullYear(), 0, 1)
  const end = new Date(anchorDate.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { startMs: start.getTime(), endMs: end.getTime() }
}

function filterOperationsInRange(
  operations: SessionOperation[],
  startMs: number,
  endMs: number,
) {
  return getCompletedSessionOperations(operations).filter((operation) => {
    const timeMs = getOperationTimeMs(operation)
    return Number.isFinite(timeMs) && timeMs >= startMs && timeMs <= endMs
  })
}

function customerKey(operation: SessionOperation) {
  return `${operation.customerName} ${operation.customerSurname}`.trim().toLowerCase()
}

function collectStaffNamesFromOperations(operations: SessionOperation[]) {
  const names = new Set<string>()

  operations.forEach((operation) => {
    const name = operation.staffName.trim()
    if (name) {
      names.add(name)
    }
  })

  return Array.from(names)
}

export function resolvePerformanceStaffNames(
  rosterNames: string[],
  operations: SessionOperation[],
) {
  const merged = new Set<string>()

  rosterNames.forEach((name) => {
    const trimmed = name.trim()
    if (trimmed) {
      merged.add(trimmed)
    }
  })

  collectStaffNamesFromOperations(operations).forEach((name) => merged.add(name))

  return Array.from(merged).sort((a, b) => a.localeCompare(b, "tr"))
}

export function buildEmployeeOperationChart(
  operations: SessionOperation[],
  anchorDate: Date,
  period: PerformancePeriod,
  palette: string[],
  staffNames: string[],
) {
  const { startMs, endMs } = getRangeForAnchor(anchorDate, period)
  const filtered = filterOperationsInRange(operations, startMs, endMs)
  const roster = resolvePerformanceStaffNames(staffNames, operations)
  const counts = new Map(roster.map((name) => [name, 0]))

  filtered.forEach((operation) => {
    const name = operation.staffName.trim()
    if (!name) {
      return
    }
    counts.set(name, (counts.get(name) ?? 0) + 1)
  })

  return roster.map((name, index) => ({
    name,
    islem: counts.get(name) ?? 0,
    renk: palette[index % palette.length],
  }))
}

export function buildEmployeeDurationChart(
  operations: SessionOperation[],
  anchorDate: Date,
  period: PerformancePeriod,
  staffNames: string[],
) {
  const { startMs, endMs } = getRangeForAnchor(anchorDate, period)
  const filtered = filterOperationsInRange(operations, startMs, endMs)
  const roster = resolvePerformanceStaffNames(staffNames, operations)
  const durations = new Map(roster.map((name) => [name, [] as number[]]))

  filtered.forEach((operation) => {
    const minutes = getDurationMinutes(operation)
    if (minutes <= 0) {
      return
    }

    const name = operation.staffName.trim()
    if (!name || !durations.has(name)) {
      return
    }

    durations.get(name)?.push(minutes)
  })

  const allMinutes = Array.from(durations.values()).flat()
  const salonAverage =
    allMinutes.length > 0
      ? Math.round(allMinutes.reduce((sum, value) => sum + value, 0) / allMinutes.length)
      : 0

  return roster.map((name) => {
    const values = durations.get(name) ?? []
    return {
      name,
      sure:
        values.length > 0
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : 0,
      hedef: salonAverage,
    }
  })
}

export function buildOperationsTrendChart(
  operations: SessionOperation[],
  anchorDate: Date,
  period: PerformancePeriod,
) {
  const completed = getCompletedSessionOperations(operations)

  if (period === "daily") {
    const result: Array<{ gun: string; islem: number; musteri: number }> = []
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(anchorDate)
      day.setDate(day.getDate() - offset)
      const startMs = startOfDay(day).getTime()
      const endMs = endOfDay(day).getTime()
      const dayOps = filterOperationsInRange(completed, startMs, endMs)
      const customers = new Set(dayOps.map(customerKey))

      result.push({
        gun: `${day.getDate()} ${DAYS_SHORT[day.getDay()]}`,
        islem: dayOps.length,
        musteri: customers.size,
      })
    }
    return { data: result, xKey: "gun" as const }
  }

  if (period === "monthly") {
    const year = anchorDate.getFullYear()
    const data = MONTHS_SHORT.map((ay, monthIndex) => {
      const start = new Date(year, monthIndex, 1).getTime()
      const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime()
      const monthOps = filterOperationsInRange(completed, start, end)
      const customers = new Set(monthOps.map(customerKey))
      return { ay, islem: monthOps.length, musteri: customers.size }
    })
    return { data, xKey: "ay" as const }
  }

  const year = anchorDate.getFullYear()
  const data = []
  for (let offset = 4; offset >= 0; offset -= 1) {
    const currentYear = year - offset
    const start = new Date(currentYear, 0, 1).getTime()
    const end = new Date(currentYear, 11, 31, 23, 59, 59, 999).getTime()
    const yearOps = filterOperationsInRange(completed, start, end)
    const customers = new Set(yearOps.map(customerKey))
    data.push({
      yil: String(currentYear),
      islem: yearOps.length,
      musteri: customers.size,
    })
  }
  return { data, xKey: "yil" as const }
}

export function buildRevenueByServiceChart(
  operations: SessionOperation[],
  anchorDate: Date,
  period: PerformancePeriod,
  palette: string[],
  serviceNames: string[] = [],
) {
  const { startMs, endMs } = getRangeForAnchor(anchorDate, period)
  const filtered = filterOperationsInRange(operations, startMs, endMs)
  const revenue = new Map<string, number>()

  serviceNames.forEach((name) => {
    const trimmed = name.trim()
    if (trimmed) {
      revenue.set(trimmed, 0)
    }
  })

  filtered.forEach((operation) => {
    operation.serviceItems.forEach((item) => {
      const name = item.name.trim()
      if (!name) {
        return
      }
      revenue.set(name, (revenue.get(name) ?? 0) + item.price)
    })
  })

  const entries = Array.from(revenue.entries())
  if (entries.length === 0) {
    return [{ name: "Veri yok", kazanc: 0, renk: palette[0] }]
  }

  return entries
    .map(([name, kazanc], index) => ({
      name,
      kazanc: Math.round(kazanc),
      renk: palette[index % palette.length],
    }))
    .sort((a, b) => b.kazanc - a.kazanc)
}

export function buildPeakHoursChart(operations: SessionOperation[], anchorDate: Date) {
  const startMs = startOfDay(anchorDate).getTime()
  const endMs = endOfDay(anchorDate).getTime()
  const filtered = filterOperationsInRange(operations, startMs, endMs)
  const hours = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ]
  const counts = new Map(hours.map((hour) => [hour, 0]))

  filtered.forEach((operation) => {
    const timeMs = parseOperationTimestampMs(operation.startedAt ?? operation.endedAt)
    if (!Number.isFinite(timeMs)) {
      return
    }

    const hour = new Date(timeMs).getHours()
    if (hour < 9 || hour > 20) {
      return
    }

    const label = `${String(hour).padStart(2, "0")}:00`
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  return hours.map((saat) => ({
    saat,
    musteri: counts.get(saat) ?? 0,
  }))
}

export function buildPeakDaysChart(operations: SessionOperation[], anchorDate: Date) {
  const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1).getTime()
  const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
  const filtered = filterOperationsInRange(operations, start, end)
  const counts = new Map(DAYS_SHORT.map((gun, index) => [gun, 0]))

  filtered.forEach((operation) => {
    const timeMs = getOperationTimeMs(operation)
    if (!Number.isFinite(timeMs)) {
      return
    }
    const dayIndex = new Date(timeMs).getDay()
    const label = DAYS_SHORT[dayIndex]
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  return DAYS_SHORT.map((gun) => ({
    gun,
    musteri: counts.get(gun) ?? 0,
  }))
}

export function countCompletedInRange(
  operations: SessionOperation[],
  anchorDate: Date,
  period: PerformancePeriod,
) {
  const { startMs, endMs } = getRangeForAnchor(anchorDate, period)
  return filterOperationsInRange(operations, startMs, endMs).length
}
