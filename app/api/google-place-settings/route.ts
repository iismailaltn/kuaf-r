import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import { normalizeGooglePlaceSettingsRows, type GooglePlaceSettingsRow } from "@/lib/google-place-settings"

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

export async function GET() {
  try {
    const token = appConfig.token.google_place_settings
    if (!token) {
      return NextResponse.json({ ok: false, message: "google_place_settings token tanimli degil." }, { status: 500 })
    }

    const data = await selectByToken<unknown>(token)
    const rows = normalizeGooglePlaceSettingsRows(extractRows(data))
    const row = rows[0] ?? null

    return NextResponse.json({ ok: true, row })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Google Places ayarlari getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const token = appConfig.token.google_place_settings
    if (!token) {
      return NextResponse.json({ ok: false, message: "google_place_settings token tanimli degil." }, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as
      | {
          placesApiKey?: string
          apiKey?: string
          placeId?: string
        }
      | null

    const placesApiKey = sanitizeSqlString(String(body?.placesApiKey ?? body?.apiKey ?? "").trim())
    const placeId = sanitizeSqlString(String(body?.placeId ?? "").trim())
    if (!placesApiKey || !placeId) {
      return NextResponse.json({ ok: false, message: "API Key ve Place ID zorunlu." }, { status: 400 })
    }

    const data = await selectByToken<unknown>(token)
    const existingRows = normalizeGooglePlaceSettingsRows(extractRows(data))
    const existing = existingRows[0] ?? null

    if (existing) {
      const sql = `UPDATE google_place_settings SET places_api_key='${placesApiKey}', placeId='${placeId}', updatedAt=CURRENT_TIMESTAMP WHERE id=${existing.id}`
      await sqlToken(token, sql)
    } else {
      const sql = `INSERT INTO google_place_settings (places_api_key, placeId, createdAt, updatedAt) VALUES ('${placesApiKey}', '${placeId}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      await sqlToken(token, sql)
    }

    const refreshed = await selectByToken<unknown>(token)
    const row = normalizeGooglePlaceSettingsRows(extractRows(refreshed))[0] ?? null

    return NextResponse.json({ ok: true, row })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Google Places ayarlari kaydedilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}
