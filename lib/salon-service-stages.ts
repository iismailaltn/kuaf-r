export type SalonServiceStage = {
  id: string
  name: string
  durationMinutes: number
  requiresStaff: boolean
  requiresWorkspace: boolean
}

export type ScheduledStage = SalonServiceStage & {
  offsetMinutes: number
  startMinutes: number
  endMinutes: number
}

export type ServiceStagePlan = {
  serviceId: number
  serviceName: string
  totalMinutes: number
  stages: ScheduledStage[]
  staffBusyBlocks: Array<{ startMinutes: number; endMinutes: number }>
  workspaceBusyBlocks: Array<{ startMinutes: number; endMinutes: number }>
}

const STAGE_STORAGE_VERSION = 1

export function createStageId() {
  return `stg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function defaultStagesForService(serviceName: string, durationMinutes: number): SalonServiceStage[] {
  const normalized = serviceName.toLowerCase()
  if (normalized.includes("boya")) {
    return [
      {
        id: createStageId(),
        name: "Boya uygulama",
        durationMinutes: 20,
        requiresStaff: true,
        requiresWorkspace: true,
      },
      {
        id: createStageId(),
        name: "Bekleme / islem",
        durationMinutes: 40,
        requiresStaff: false,
        requiresWorkspace: true,
      },
      {
        id: createStageId(),
        name: "Yikama / fon",
        durationMinutes: 20,
        requiresStaff: true,
        requiresWorkspace: true,
      },
    ]
  }

  const duration = Math.max(15, durationMinutes || 30)
  return [
    {
      id: createStageId(),
      name: serviceName.trim() || "Islem",
      durationMinutes: duration,
      requiresStaff: true,
      requiresWorkspace: true,
    },
  ]
}

/** Asama 1 = isletmenin kendi hizmet adi + suresi. */
export function ensureServiceFirstStage(
  stages: SalonServiceStage[],
  serviceName: string,
  durationMinutes: number,
): SalonServiceStage[] {
  const duration = Math.max(15, durationMinutes || 30)
  const label = serviceName.trim() || "Islem"

  if (stages.length === 0) {
    return defaultStagesForService(serviceName, duration)
  }

  const [first, ...rest] = stages
  return [
    {
      ...first,
      name: label,
      durationMinutes: first.durationMinutes > 0 ? first.durationMinutes : duration,
      requiresStaff: first.requiresStaff !== false,
      requiresWorkspace: first.requiresWorkspace !== false,
    },
    ...rest,
  ]
}

export function normalizeSalonServiceStages(
  raw: unknown,
  serviceName: string,
  durationMinutes: number,
): SalonServiceStage[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultStagesForService(serviceName, durationMinutes)
  }

  const stages = raw
    .map((item, index) => {
      const row = item as Record<string, unknown>
      const name = String(row.name ?? row.stageName ?? "").trim() || `Asama ${index + 1}`
      const duration = Number(row.durationMinutes ?? row.duration ?? 0)
      if (!Number.isFinite(duration) || duration <= 0) {
        return null
      }
      return {
        id: String(row.id ?? createStageId()),
        name,
        durationMinutes: Math.round(duration),
        requiresStaff: row.requiresStaff !== false && row.requires_staff !== false,
        requiresWorkspace: row.requiresWorkspace !== false && row.requires_workspace !== false,
      } satisfies SalonServiceStage
    })
    .filter((stage): stage is SalonServiceStage => stage !== null)

  return stages.length > 0 ? stages : defaultStagesForService(serviceName, durationMinutes)
}

export function getStagesStorageKey(businessUserId: string) {
  return `kuafor-service-stages:v${STAGE_STORAGE_VERSION}:${businessUserId}`
}

export function readStagesMapFromStorage(businessUserId: string): Record<string, SalonServiceStage[]> {
  if (typeof window === "undefined" || !businessUserId) {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(getStagesStorageKey(businessUserId))
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as Record<string, SalonServiceStage[]>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function writeStagesMapToStorage(businessUserId: string, map: Record<string, SalonServiceStage[]>) {
  if (typeof window === "undefined" || !businessUserId) {
    return
  }
  window.localStorage.setItem(getStagesStorageKey(businessUserId), JSON.stringify(map))
}

export function scheduleStages(
  stages: SalonServiceStage[],
  startOffsetMinutes = 0,
): {
  stages: ScheduledStage[]
  totalMinutes: number
  staffBusyBlocks: Array<{ startMinutes: number; endMinutes: number }>
  workspaceBusyBlocks: Array<{ startMinutes: number; endMinutes: number }>
} {
  let cursor = startOffsetMinutes
  const scheduled: ScheduledStage[] = []
  const staffBusyBlocks: Array<{ startMinutes: number; endMinutes: number }> = []
  const workspaceBusyBlocks: Array<{ startMinutes: number; endMinutes: number }> = []

  stages.forEach((stage) => {
    const startMinutes = cursor
    const endMinutes = cursor + stage.durationMinutes
    scheduled.push({
      ...stage,
      offsetMinutes: startMinutes - startOffsetMinutes,
      startMinutes,
      endMinutes,
    })

    if (stage.requiresStaff) {
      staffBusyBlocks.push({ startMinutes, endMinutes })
    }
    if (stage.requiresWorkspace) {
      workspaceBusyBlocks.push({ startMinutes, endMinutes })
    }

    cursor = endMinutes
  })

  return {
    stages: scheduled,
    totalMinutes: cursor - startOffsetMinutes,
    staffBusyBlocks,
    workspaceBusyBlocks,
  }
}

export function buildServiceStagePlan(
  serviceId: number,
  serviceName: string,
  stages: SalonServiceStage[],
  startOffsetMinutes = 0,
): ServiceStagePlan {
  const scheduled = scheduleStages(stages, startOffsetMinutes)
  return {
    serviceId,
    serviceName,
    totalMinutes: scheduled.totalMinutes,
    stages: scheduled.stages,
    staffBusyBlocks: scheduled.staffBusyBlocks,
    workspaceBusyBlocks: scheduled.workspaceBusyBlocks,
  }
}

export function buildMultiServicePlan(
  items: Array<{ serviceId: number; serviceName: string; stages: SalonServiceStage[] }>,
) {
  let offset = 0
  const plans: ServiceStagePlan[] = []

  items.forEach((item) => {
    const plan = buildServiceStagePlan(item.serviceId, item.serviceName, item.stages, offset)
    plans.push(plan)
    offset += plan.totalMinutes
  })

  const allStages = plans.flatMap((plan) => plan.stages)
  const staffBusyBlocks = plans.flatMap((plan) => plan.staffBusyBlocks)
  const workspaceBusyBlocks = plans.flatMap((plan) => plan.workspaceBusyBlocks)

  return {
    plans,
    totalMinutes: offset,
    stages: allStages,
    staffBusyBlocks,
    workspaceBusyBlocks,
  }
}
