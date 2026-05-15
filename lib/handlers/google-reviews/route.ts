import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { fetchGooglePlaceReviews } from "@/lib/google-reviews"
import { normalizeGooglePlaceSettingsRows, type GooglePlaceSettingsRow } from "@/lib/google-place-settings"
import { selectByToken } from "@/lib/services/locofabric-database"
import { getBusinessUserIdFromRequest, matchesBusinessUserId, requireBusinessUserId } from "@/lib/business-scope"
import { apiJson } from "@/lib/api-response"

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
    const settings = normalizeGooglePlaceSettingsRows(extractRows(data).filter((row) => matchesBusinessUserId(row, businessUserId)))[0] ?? null
    if (!settings) {
      return apiJson({ ok: false, message: "Google Places ayarlari bulunamadi." }, 404)
    }

    const reviews = await fetchGooglePlaceReviews(settings.placesApiKey, settings.placeId)

    return apiJson({ ok: true, reviews })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
        ok: false,
        message: err instanceof Error ? err.message : "Google yorumlari getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}
