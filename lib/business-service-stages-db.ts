import { extractRows, selectAllByToken, sqlToken } from "@/lib/services/locofabric-database"
import {
  createStageId,
  defaultStagesForService,
  type SalonServiceStage,
} from "@/lib/salon-service-stages"
import { sanitizeSqlString } from "@/lib/sql-sanitize"

export const BUSINESS_SERVICE_STAGES_TABLE = "business_service_stages"

export function extractStageRows(data: unknown): Record<string, unknown>[] {
  return extractRows<Record<string, unknown>>(data)
}

function getField(row: Record<string, unknown>, candidates: string[]) {
  for (const candidate of candidates) {
    const value = row[candidate]
    if (value !== undefined && value !== null) {
      return value
    }
  }
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const norm = candidate.toLowerCase().replace(/[^a-z0-9]/g, "")
    const found = entries.find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === norm)
    if (found && found[1] !== undefined && found[1] !== null) {
      return found[1]
    }
  }
  return undefined
}

export function rowToSalonServiceStage(row: Record<string, unknown>): SalonServiceStage | null {
  const name = String(getField(row, ["name", "stage_name", "stageName"]) ?? "").trim()
  const durationMinutes = Number(getField(row, ["duration_minutes", "durationMinutes"]))
  if (!name || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return null
  }
  const id = String(getField(row, ["id", "ID", "stage_id"]) ?? createStageId()).trim() || createStageId()
  const requiresStaff = getField(row, ["requires_staff", "requiresStaff"])
  const requiresWorkspace = getField(row, ["requires_workspace", "requiresWorkspace"])
  return {
    id,
    name,
    durationMinutes: Math.round(durationMinutes),
    requiresStaff: requiresStaff !== false && requiresStaff !== 0 && requiresStaff !== "0",
    requiresWorkspace: requiresWorkspace !== false && requiresWorkspace !== 0 && requiresWorkspace !== "0",
  }
}

/** Isletme icin tum asamalari service_id -> stages[] olarak yukler. */
export async function fetchStagesByServiceForBusiness(
  stagesToken: string,
  businessUserId: string,
): Promise<Map<string, SalonServiceStage[]>> {
  const data = await selectAllByToken<unknown>(stagesToken, BUSINESS_SERVICE_STAGES_TABLE)
  const rows = extractStageRows(data).filter((row) => {
    const rowBusinessUserId = String(getField(row, ["business_user_id", "businessUserId"]) ?? "").trim()
    return rowBusinessUserId === businessUserId
  })

  rows.sort((a, b) => {
    const serviceA = String(getField(a, ["service_id", "serviceId"]) ?? "")
    const serviceB = String(getField(b, ["service_id", "serviceId"]) ?? "")
    if (serviceA !== serviceB) {
      return serviceA.localeCompare(serviceB)
    }
    const orderA = Number(getField(a, ["stage_order", "stageOrder"]) ?? 0)
    const orderB = Number(getField(b, ["stage_order", "stageOrder"]) ?? 0)
    return orderA - orderB
  })

  const map = new Map<string, SalonServiceStage[]>()
  for (const row of rows) {
    const serviceId = String(getField(row, ["service_id", "serviceId"]) ?? "").trim()
    if (!serviceId) {
      continue
    }
    const stage = rowToSalonServiceStage(row)
    if (!stage) {
      continue
    }
    const list = map.get(serviceId) ?? []
    list.push(stage)
    map.set(serviceId, list)
  }
  return map
}

export function businessDurationFromStageList(stages: SalonServiceStage[], fallbackMinutes: number) {
  if (stages.length === 0) {
    return Math.max(15, fallbackMinutes || 30)
  }
  return Math.max(15, stages[0].durationMinutes || fallbackMinutes || 30)
}

/** Hizmet asamalarini tabloda tamamen yeniler (DELETE + satir satir INSERT). */
export async function replaceStagesForService(
  stagesToken: string,
  businessUserId: string,
  serviceId: number,
  stages: SalonServiceStage[],
) {
  await sqlToken(
    stagesToken,
    `DELETE FROM ${BUSINESS_SERVICE_STAGES_TABLE} WHERE business_user_id=${businessUserId} AND service_id=${serviceId}`,
  )

  for (let index = 0; index < stages.length; index++) {
    const stage = stages[index]
    const name = sanitizeSqlString(stage.name)
    const order = index + 1
    const duration = Math.round(stage.durationMinutes)
    const requiresStaff = stage.requiresStaff === false ? 0 : 1
    const requiresWorkspace = stage.requiresWorkspace === false ? 0 : 1
    await sqlToken(
      stagesToken,
      `INSERT INTO ${BUSINESS_SERVICE_STAGES_TABLE} (business_user_id, service_id, stage_order, name, duration_minutes, requires_staff, requires_workspace, created_at, updated_at) VALUES (${businessUserId}, ${serviceId}, ${order}, '${name}', ${duration}, ${requiresStaff}, ${requiresWorkspace}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
  }
}

export function resolveStagesForService(
  stagesByServiceId: Map<string, SalonServiceStage[]>,
  serviceId: number,
  serviceName: string,
  fallbackDurationMinutes: number,
): SalonServiceStage[] {
  const stored = stagesByServiceId.get(String(serviceId))
  if (stored?.length) {
    return stored
  }
  return defaultStagesForService(serviceName, fallbackDurationMinutes)
}
