import { appConfig } from "@/app.config"
import { fetchStagesByServiceForBusiness } from "@/lib/business-service-stages-db"
import { canonicalStaffIdFromPersonelRow, fetchPersonelRowsForBusiness } from "@/lib/personel-directory"
import { normalizeReservationRows, type SalonReservationRow } from "@/lib/reservations-db"
import { normalizeSalonServiceRows, type SalonServiceRow } from "@/lib/salon-services"
import { buildMultiServicePlan } from "@/lib/salon-service-stages"
import { defaultStagesForService } from "@/lib/salon-service-stages"
import type { SalonServiceOption, StaffOption } from "@/lib/whatsapp-bot/types"
import { extractRows, selectByToken, sqlToken } from "@/lib/whatsapp-bot/locofabric-server"

export async function loadActiveServices(businessUserId: string): Promise<SalonServiceOption[]> {
  const token = appConfig.token.expertise_areas
  if (!token) {
    return []
  }

  try {
    const data = await selectByToken<unknown>(token)
    const rows = normalizeSalonServiceRows(extractRows<SalonServiceRow>(data))
    return rows
      .filter((service) => service.isActive)
      .map((service) => ({ id: service.id, name: service.name }))
  } catch {
    return []
  }
}

export async function loadStaffList(businessUserId: string): Promise<StaffOption[]> {
  const rows = await fetchPersonelRowsForBusiness(businessUserId)
  return rows
    .map((row) => {
      const id = canonicalStaffIdFromPersonelRow(row as Record<string, unknown>)
      const firstName = String(row.first_name ?? row.firstName ?? "").trim()
      const lastName = String(row.last_name ?? row.lastName ?? "").trim()
      const fullName = String(row.full_name ?? row.fullName ?? `${firstName} ${lastName}`).trim()
      if (!id || !fullName) {
        return null
      }
      return { id, name: fullName }
    })
    .filter((item): item is StaffOption => item !== null)
}

export async function loadReservations(businessUserId: string) {
  const token = appConfig.token.salon_reservations
  if (!token) {
    return []
  }

  try {
    const data = await sqlToken<unknown>(
      token,
      `SELECT * FROM salon_reservations WHERE business_user_id=${businessUserId}`,
    )
    return normalizeReservationRows(extractRows<SalonReservationRow>(data))
  } catch {
    try {
      const data = await selectByToken<unknown>(token)
      return normalizeReservationRows(extractRows<SalonReservationRow>(data)).filter(
        (row) => String(row.id) && row.date,
      )
    } catch {
      return []
    }
  }
}

export async function buildBookingPlan(businessUserId: string, serviceIds: number[], serviceNames: string[]) {
  const stagesToken = appConfig.token.business_service_stages
  const stagesByService = stagesToken
    ? await fetchStagesByServiceForBusiness(stagesToken, businessUserId)
    : new Map<string, import("@/lib/salon-service-stages").SalonServiceStage[]>()

  const items = serviceIds.map((serviceId, index) => {
    const serviceName = serviceNames[index] ?? `Hizmet ${serviceId}`
    const stages =
      stagesByService.get(String(serviceId)) ??
      defaultStagesForService(serviceName, 45)
    return { serviceId, serviceName, stages }
  })

  return buildMultiServicePlan(items)
}
