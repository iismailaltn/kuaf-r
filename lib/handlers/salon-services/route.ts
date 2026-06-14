import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { fetchStagesByServiceForBusiness } from "@/lib/business-service-stages-db"
import { extractRows, selectAllByToken } from "@/lib/services/locofabric-database"
import {
  getAllowedCategoriesForSection,
  matchesCategoryExact,
  normalizeCategoryKey,
} from "@/lib/salon-service-catalog"
import { groupSalonServicesByCategory, normalizeSalonServiceRows, type SalonServiceRow } from "@/lib/salon-services"
import { mergeMasterServiceWithBusinessData } from "@/lib/salon-service-settings"
import { getBusinessUserIdFromRequest } from "@/lib/business-scope"
import { apiJson } from "@/lib/api-response"

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)

    const token = appConfig.token.expertise_areas
    if (!token) {
      return apiJson({ ok: false, message: "expertise_areas token tanimli degil." }, 500)
    }

    const data = await selectAllByToken<unknown>(token, "expertise_areas")
    const rawRows = extractRows<SalonServiceRow>(data)
    const allMasterRows = normalizeSalonServiceRows(rawRows)
    const groups = groupSalonServicesByCategory(allMasterRows)

    const url = new URL(req.url)
    const category = url.searchParams.get("category")?.trim() ?? ""
    const catalogSection = url.searchParams.get("catalogSection")?.trim() ?? ""

    let masterRows = allMasterRows
    if (category) {
      masterRows = masterRows.filter(
        (row) => normalizeCategoryKey(row.category) === normalizeCategoryKey(category),
      )
    } else if (catalogSection) {
      const allowedCategories = getAllowedCategoriesForSection(catalogSection)
      masterRows = masterRows.filter((row) => matchesCategoryExact(row.category, allowedCategories))
    }

    if (!businessUserId) {
      return apiJson({ ok: true, rows: masterRows, total: masterRows.length, groups })
    }

    const settingsToken = appConfig.token.business_service_settings
    const stagesToken = appConfig.token.business_service_stages
    if (!settingsToken) {
      return apiJson({ ok: false, message: "business_service_settings token tanimli degil." }, 500)
    }
    if (!stagesToken) {
      return apiJson({ ok: false, message: "business_service_stages token tanimli degil." }, 500)
    }

    const [settingsData, stagesByServiceId] = await Promise.all([
      selectAllByToken<unknown>(settingsToken, "business_service_settings"),
      fetchStagesByServiceForBusiness(stagesToken, businessUserId),
    ])

    const settingsRows = extractRows<Record<string, unknown>>(settingsData)

    const settingsByServiceId = new Map<string, Record<string, unknown>>()
    for (const row of settingsRows) {
      const rowBusinessUserId = String(row.business_user_id ?? row.businessUserId ?? "").trim()
      const serviceId = String(row.service_id ?? row.serviceId ?? "").trim()
      if (rowBusinessUserId === businessUserId && serviceId) {
        settingsByServiceId.set(serviceId, row)
      }
    }

    const rows = masterRows.map((service) => {
      const merged = mergeMasterServiceWithBusinessData(
        service,
        settingsByServiceId.get(String(service.id)),
        stagesByServiceId,
      )
      return {
        ...service,
        ...merged,
        category: service.category,
      }
    })

    return apiJson({ ok: true, rows, total: rows.length, groups })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
      ok: false,
      message: "Salon hizmetleri getirilemedi.",
      error: axiosErr?.message ?? String(err),
      upstreamStatus: typeof status === "number" ? status : undefined,
      upstreamData: data,
    }, 502)
  }
}
