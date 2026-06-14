import type { SalonService } from "@/lib/salon-services"
import {
  businessDurationFromStageList,
  resolveStagesForService,
} from "@/lib/business-service-stages-db"
import { ensureServiceFirstStage, type SalonServiceStage } from "@/lib/salon-service-stages"

function getField(row: Record<string, unknown>, candidates: string[]) {
  for (const candidate of candidates) {
    const direct = row[candidate]
    if (direct !== undefined && direct !== null) {
      return direct
    }
  }
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase().replace(/[^a-z0-9]/g, "")
    const found = entries.find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized)
    if (found && found[1] !== undefined && found[1] !== null) {
      return found[1]
    }
  }
  return undefined
}

/** Master hizmet + business_service_settings + business_service_stages birlestirme. */
export function mergeMasterServiceWithBusinessData(
  master: SalonService,
  setting: Record<string, unknown> | null | undefined,
  stagesByServiceId: Map<string, SalonServiceStage[]>,
) {
  const rawStages = resolveStagesForService(
    stagesByServiceId,
    master.id,
    master.name,
    master.durationMinutes,
  )
  const durationFromStages = businessDurationFromStageList(rawStages, master.durationMinutes)
  const stages = ensureServiceFirstStage(rawStages, master.name, durationFromStages)

  if (!setting) {
    return {
      price: 0,
      isActive: false,
      durationMinutes: durationFromStages,
      stages,
    }
  }

  const price = Number(setting.price ?? 0)
  const isActiveValue = setting.is_active ?? setting.isActive
  const settingsDuration = Number(getField(setting, ["duration_minutes", "durationMinutes"]))

  return {
    price: Number.isFinite(price) ? price : 0,
    isActive:
      isActiveValue === true ||
      isActiveValue === 1 ||
      isActiveValue === "1" ||
      isActiveValue === "true",
    durationMinutes:
      Number.isFinite(settingsDuration) && settingsDuration > 0
        ? Math.round(settingsDuration)
        : durationFromStages,
    stages,
  }
}
