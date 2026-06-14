import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import {
  businessDurationFromStageList,
  replaceStagesForService,
} from "@/lib/business-service-stages-db"
import { extractRows, selectAllByToken, sqlToken } from "@/lib/services/locofabric-database"
import { normalizeSalonServiceStages } from "@/lib/salon-service-stages"
import { getBusinessUserIdFromBody, requireBusinessUserId } from "@/lib/business-scope"
import { sanitizeSqlString } from "@/lib/sql-sanitize"
import { apiJson } from "@/lib/api-response"

async function ensureBusinessServiceSettingsRow(
  settingsToken: string,
  businessUserId: string,
  serviceId: number,
  serviceName: string,
  durationMinutes: number,
) {
  const settingsData = await selectAllByToken<unknown>(settingsToken, "business_service_settings")
  const existing = extractRows(settingsData).find((row) => {
    const rowBusinessUserId = String(row.business_user_id ?? row.businessUserId ?? "").trim()
    const rowServiceId = String(row.service_id ?? row.serviceId ?? "").trim()
    return rowBusinessUserId === businessUserId && rowServiceId === String(serviceId)
  })

  if (existing?.id ?? existing?.ID) {
    const existingId = Number(existing.id ?? existing.ID)
    await sqlToken(
      settingsToken,
      `UPDATE business_service_settings SET duration_minutes=${Math.round(durationMinutes)} WHERE id=${existingId}`,
    )
    await sqlToken(
      settingsToken,
      `UPDATE business_service_settings SET updated_at=CURRENT_TIMESTAMP WHERE id=${existingId}`,
    )
    return existingId
  }

  const insertResult = await sqlToken<unknown>(
    settingsToken,
    `INSERT INTO business_service_settings (business_user_id, service_id, service_name, price, is_active, duration_minutes, created_at, updated_at) VALUES (${businessUserId}, ${serviceId}, '${sanitizeSqlString(serviceName)}', 0, 1, ${Math.round(durationMinutes)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  )
  return Number(
    (insertResult as { newId?: number })?.newId ??
      extractRows(insertResult)[0]?.id ??
      extractRows(insertResult)[0]?.ID ??
      0,
  )
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const idNum = Number(id)
    if (!Number.isFinite(idNum)) {
      return apiJson({ ok: false, message: "Gecersiz hizmet id." }, 400)
    }

    const stagesToken = appConfig.token.business_service_stages
    const settingsToken = appConfig.token.business_service_settings
    const masterToken = appConfig.token.expertise_areas
    if (!stagesToken) {
      return apiJson({ ok: false, message: "business_service_stages token tanimli degil." }, 500)
    }
    if (!settingsToken) {
      return apiJson({ ok: false, message: "business_service_settings token tanimli degil." }, 500)
    }
    if (!masterToken) {
      return apiJson({ ok: false, message: "expertise_areas token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | {
          businessUserId?: string | number
          stages?: unknown
          serviceName?: string
          durationMinutes?: number
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const masterData = await selectAllByToken<unknown>(masterToken, "expertise_areas")
    const masterService = extractRows(masterData).find(
      (row) => String(row.id ?? row.ID ?? "").trim() === String(idNum),
    )
    const serviceName = sanitizeSqlString(
      String(masterService?.name ?? body?.serviceName ?? "").trim(),
    )
    if (!serviceName) {
      return apiJson({ ok: false, message: "Hizmet bulunamadi." }, 404)
    }

    const masterDuration = Number(
      masterService?.duration_minutes ?? masterService?.durationMinutes ?? body?.durationMinutes ?? 30,
    )
    const stages = normalizeSalonServiceStages(body?.stages, serviceName, masterDuration)
    const businessDuration = businessDurationFromStageList(stages, masterDuration)

    await replaceStagesForService(stagesToken, businessUserId, idNum, stages)
    await ensureBusinessServiceSettingsRow(
      settingsToken,
      businessUserId,
      idNum,
      serviceName,
      businessDuration,
    )

    return apiJson({ ok: true, stages, durationMinutes: businessDuration })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
      ok: false,
      message: "Hizmet asamalari kaydedilemedi.",
      error: axiosErr?.message ?? String(err),
      upstreamStatus: typeof status === "number" ? status : undefined,
      upstreamData: data,
    }, 502)
  }
}
