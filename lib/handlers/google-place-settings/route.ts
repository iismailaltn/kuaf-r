import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import { normalizeGooglePlaceSettingsRows, type GooglePlaceSettingsRow } from "@/lib/google-place-settings"
import { getBusinessUserIdFromBody, getBusinessUserIdFromRequest, matchesBusinessUserId, requireBusinessUserId } from "@/lib/business-scope"
import { apiJson } from "@/lib/api-response"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

function extractRows(data: unknown) {
  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: GooglePlaceSettingsRow[] }).data
  }
  if (Array.isArray((data as { Data?: unknown })?.Data)) {
    return (data as { Data: GooglePlaceSettingsRow[] }).Data
  }
  if (Array.isArray(data)) {
    return data as GooglePlaceSettingsRow[]
  }
  return []
}

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }
    const token = appConfig.token.google_place_settings
    if (!token) {
      return apiJson({ ok: false, message: "google_place_settings token tanimli degil." }, 500)
    }

    const data = await selectByToken<unknown>(token)
    const rows = normalizeGooglePlaceSettingsRows(extractRows(data).filter((row) => matchesBusinessUserId(row, businessUserId)))
    const row = rows[0] ?? null

    return apiJson({ ok: true, row })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
        ok: false,
        message: "Google Places ayarlari getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}

export async function PUT(req: Request) {
  try {
    const token = appConfig.token.google_place_settings
    if (!token) {
      return apiJson({ ok: false, message: "google_place_settings token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | {
          placesApiKey?: string
          apiKey?: string
          placeId?: string
          businessUserId?: string | number
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const placesApiKey = sanitizeSqlString(String(body?.placesApiKey ?? body?.apiKey ?? "").trim())
    const placeId = sanitizeSqlString(String(body?.placeId ?? "").trim())
    if (!placesApiKey || !placeId) {
      return apiJson({ ok: false, message: "API Key ve Place ID zorunlu." }, 400)
    }

    const data = await selectByToken<unknown>(token)
    const existingRows = normalizeGooglePlaceSettingsRows(extractRows(data).filter((row) => matchesBusinessUserId(row, businessUserId)))
    const existing = existingRows[0] ?? null

    if (existing) {
      const sql = `UPDATE google_place_settings SET places_api_key='${placesApiKey}', placeId='${placeId}', updatedAt=CURRENT_TIMESTAMP WHERE id=${existing.id} AND business_user_id=${businessUserId}`
      await sqlToken(token, sql)
    } else {
      const sql = `INSERT INTO google_place_settings (business_user_id, places_api_key, placeId, createdAt, updatedAt) VALUES (${businessUserId}, '${placesApiKey}', '${placeId}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      await sqlToken(token, sql)
    }

    const refreshed = await selectByToken<unknown>(token)
    const row = normalizeGooglePlaceSettingsRows(extractRows(refreshed).filter((item) => matchesBusinessUserId(item, businessUserId)))[0] ?? null

    return apiJson({ ok: true, row })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
        ok: false,
        message: "Google Places ayarlari kaydedilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}
