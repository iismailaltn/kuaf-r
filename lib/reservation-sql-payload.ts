import type { ScheduledStage } from "@/lib/salon-service-stages"
import { formatMinutesToTime, parseTimeToMinutes, type StaffBusyBlockLabel } from "@/lib/reservation-scheduling"

/** VARCHAR(255) icin: [sure, offset] dizileri (base64 ile ~30-80 karakter). */
export function compactStagesForSql(stages: unknown[]) {
  return stages
    .map((item) => {
      const row = item as Record<string, unknown>
      const durationMinutes = Number(row.durationMinutes ?? 0)
      const offsetMinutes = Number(row.offsetMinutes ?? row.startMinutes ?? 0)
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return null
      }
      return [
        Math.round(durationMinutes),
        Math.round(Number.isFinite(offsetMinutes) ? offsetMinutes : 0),
      ] as [number, number]
    })
    .filter((row): row is [number, number] => row !== null)
}

export function normalizeStoredStages(raw: unknown): ScheduledStage[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((item, index) => {
      if (Array.isArray(item) && item.length >= 2) {
        const durationMinutes = Number(item[0] ?? 0)
        const offsetMinutes = Number(item[1] ?? 0)
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
          return null
        }
        return {
          id: `stg_${index}`,
          name: "Asama",
          durationMinutes,
          offsetMinutes,
          requiresStaff: true,
          requiresWorkspace: true,
          startMinutes: offsetMinutes,
          endMinutes: offsetMinutes + durationMinutes,
        } satisfies ScheduledStage
      }
      const row = item as Record<string, unknown>
      const id = String(row.id ?? `stg_${index}`).trim()
      const name = String(row.name ?? "Asama").trim()
      const durationMinutes = Number(row.durationMinutes ?? 0)
      const offsetMinutes = Number(row.offsetMinutes ?? row.startMinutes ?? 0)
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return null
      }
      return {
        id,
        name,
        durationMinutes: Math.round(durationMinutes),
        offsetMinutes: Math.round(Number.isFinite(offsetMinutes) ? offsetMinutes : 0),
        requiresStaff: row.requiresStaff !== false && row.requires_staff !== false,
        requiresWorkspace: row.requiresWorkspace !== false && row.requires_workspace !== false,
        startMinutes: Math.round(Number.isFinite(offsetMinutes) ? offsetMinutes : 0),
        endMinutes:
          Math.round(Number.isFinite(offsetMinutes) ? offsetMinutes : 0) + Math.round(durationMinutes),
      } satisfies ScheduledStage
    })
    .filter((stage): stage is ScheduledStage => stage !== null)
}

export function enrichStagesFromDb(stages: ScheduledStage[]): ScheduledStage[] {
  return normalizeStoredStages(stages)
}

/** [baslangic, bitis] dakika (randevu basina gore 0 tabanli). */
export function compactStaffBusyBlocksForSql(blocks: unknown[]) {
  return blocks
    .map((item) => {
      const row = item as Record<string, unknown>
      if (Array.isArray(item) && item.length >= 2) {
        const startMinutes = Number(item[0] ?? 0)
        const endMinutes = Number(item[1] ?? 0)
        if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
          return null
        }
        return [Math.round(startMinutes), Math.round(endMinutes)] as [number, number]
      }
      const startMinutes = Number(row.startMinutes ?? 0)
      const endMinutes = Number(row.endMinutes ?? 0)
      if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
        return null
      }
      return [Math.round(startMinutes), Math.round(endMinutes)] as [number, number]
    })
    .filter((row): row is [number, number] => row !== null)
}

export function normalizeStoredStaffBlocks(
  raw: unknown,
): Array<{ startMinutes: number; endMinutes: number }> {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((item) => {
      if (Array.isArray(item) && item.length >= 2) {
        return { startMinutes: Number(item[0]), endMinutes: Number(item[1]) }
      }
      const row = item as Record<string, unknown>
      return {
        startMinutes: Number(row.startMinutes ?? 0),
        endMinutes: Number(row.endMinutes ?? 0),
      }
    })
    .filter((b) => Number.isFinite(b.startMinutes) && Number.isFinite(b.endMinutes) && b.endMinutes > b.startMinutes)
}

export function enrichStaffBusyBlocksFromDb(
  blocks: Array<{ startMinutes: number; endMinutes: number; start?: string; end?: string }>,
  startTime: string,
): StaffBusyBlockLabel[] {
  const base = parseTimeToMinutes(startTime)
  const dayOffset = Number.isFinite(base) ? base : 0
  return blocks.map((block) => {
    const startAbs =
      block.startMinutes >= dayOffset ? block.startMinutes : dayOffset + block.startMinutes
    const endAbs = block.endMinutes >= dayOffset ? block.endMinutes : dayOffset + block.endMinutes
    return {
      start: block.start ?? formatMinutesToTime(startAbs),
      end: block.end ?? formatMinutesToTime(endAbs),
      startMinutes: block.startMinutes,
      endMinutes: block.endMinutes,
    }
  })
}
