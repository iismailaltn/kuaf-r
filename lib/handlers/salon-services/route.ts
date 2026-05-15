import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken } from "@/lib/services/locofabric-database"
import { normalizeSalonServiceRows, type SalonServiceRow } from "@/lib/salon-services"
import { getBusinessUserIdFromRequest } from "@/lib/business-scope"
import { apiJson } from "@/lib/api-response"

function extractRows(data: unknown) {
  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: SalonServiceRow[] }).data
  }
  if (Array.isArray((data as { Data?: unknown })?.Data)) {
    return (data as { Data: SalonServiceRow[] }).Data
  }
  if (Array.isArray(data)) {
    return data as SalonServiceRow[]
  }
  return []
}

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)

    const token = appConfig.token.salonservis
    if (!token) {
      return apiJson({ ok: false, message: "salonservis token tanimli degil." }, 500)
    }

    const data = await selectByToken<unknown>(token)
    const rawRows = extractRows(data)
    const masterRows = normalizeSalonServiceRows(rawRows)

    if (!businessUserId) {
      return apiJson({ ok: true, rows: masterRows })
    }

    const settingsToken = appConfig.token.business_service_settings
    if (!settingsToken) {
      return apiJson({ ok: false, message: "business_service_settings token tanimli degil." }, 500)
    }

    const settingsData = await selectByToken<any>(settingsToken)
    const settingsRows =
      Array.isArray((settingsData as any)?.data) ? (settingsData as any).data :
      Array.isArray((settingsData as any)?.Data) ? (settingsData as any).Data :
      Array.isArray(settingsData) ? settingsData :
      []

    const settingsByServiceId = new Map<string, any>()
    for (const row of settingsRows) {
      const rowBusinessUserId = String(row.business_user_id ?? row.businessUserId ?? "").trim()
      const serviceId = String(row.service_id ?? row.serviceId ?? "").trim()
      if (rowBusinessUserId === businessUserId && serviceId) {
        settingsByServiceId.set(serviceId, row)
      }
    }

    const rows = masterRows.map((service) => {
      const setting = settingsByServiceId.get(String(service.id))
      if (!setting) {
        return {
          ...service,
          price: 0,
          isActive: false,
        }
      }

      const price = Number(setting.price ?? 0)
      const isActiveValue = setting.is_active ?? setting.isActive
      return {
        ...service,
        price: Number.isFinite(price) ? price : 0,
        isActive: isActiveValue === true || isActiveValue === 1 || isActiveValue === "1" || isActiveValue === "true",
      }
    })

    return apiJson({ ok: true, rows })
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
