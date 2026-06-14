import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { normalizeInstagramSettingsRows, type InstagramSettingsRow } from "@/lib/instagram-settings"
import { normalizeAccessToken, validateAccessToken } from "@/lib/instagram-token"
import { encodeAccessTokenForDb } from "@/lib/instagram-token-storage"
import {
  getBusinessUserIdFromBody,
  getBusinessUserIdFromRequest,
  matchesBusinessUserId,
  requireBusinessUserId,
} from "@/lib/business-scope"
import { extractRows, selectAllByToken, sqlToken } from "@/lib/services/locofabric-database"
import { apiJson } from "@/lib/api-response"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

function sqlNullableString(value: string) {
  const trimmed = value.trim()
  return trimmed ? `'${sanitizeSqlString(trimmed)}'` : "NULL"
}

function extractSettingsRows(data: unknown) {
  return extractRows<InstagramSettingsRow>(data)
}

async function loadRowsForBusiness(token: string, businessUserId: string) {
  try {
    const data = await sqlToken<unknown>(
      token,
      `SELECT * FROM instagram_settings WHERE business_user_id=${businessUserId}`,
    )
    const rows = extractSettingsRows(data)
    if (rows.length > 0) {
      return rows
    }
  } catch {
    // fallback
  }

  const data = await selectAllByToken<unknown>(token, "instagram_settings")
  return extractSettingsRows(data).filter((row) => matchesBusinessUserId(row, businessUserId))
}

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const token = appConfig.token.instagram_settings
    if (!token) {
      return apiJson({ ok: false, message: "instagram_settings token tanimli degil." }, 500)
    }

    const rows = normalizeInstagramSettingsRows(await loadRowsForBusiness(token, businessUserId))
    return apiJson({ ok: true, row: rows[0] ?? null })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson(
      {
        ok: false,
        message: "Instagram ayarlari getirilemedi.",
        error: axiosErr?.message ?? String(err),
      },
      502,
    )
  }
}

export async function PUT(req: Request) {
  try {
    const token = appConfig.token.instagram_settings
    if (!token) {
      return apiJson({ ok: false, message: "instagram_settings token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | {
          businessUserId?: string | number
          instagramUserId?: string
          instagramUsername?: string
          facebookPageId?: string
          accessToken?: string
          tokenExpiresAt?: string
          scopes?: string
          isActive?: boolean
          disconnect?: boolean
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const existingRows = normalizeInstagramSettingsRows(await loadRowsForBusiness(token, businessUserId))
    const existing = existingRows[0] ?? null

    if (body?.disconnect) {
      if (existing) {
        await sqlToken(
          token,
          `UPDATE instagram_settings SET access_token=NULL, instagram_user_id=NULL, instagram_username=NULL, facebook_page_id=NULL, token_expires_at=NULL, scopes=NULL, is_connected=0, is_active=0, updated_at=CURRENT_TIMESTAMP WHERE id=${existing.id} AND business_user_id=${businessUserId}`,
        )
      }

      const refreshed = normalizeInstagramSettingsRows(await loadRowsForBusiness(token, businessUserId))
      return apiJson({ ok: true, row: refreshed[0] ?? null })
    }

    const instagramUserId = String(body?.instagramUserId ?? "").trim()
    const instagramUsername = String(body?.instagramUsername ?? "").trim()
    const facebookPageId = String(body?.facebookPageId ?? "").trim()
    let accessToken = normalizeAccessToken(body?.accessToken)
    if (!accessToken && existing?.accessToken) {
      accessToken = normalizeAccessToken(existing.accessToken)
    }
    const tokenExpiresAt = String(body?.tokenExpiresAt ?? "").trim()
    const scopes = String(body?.scopes ?? "").trim()
    const isActive = body?.isActive === false ? 0 : 1

    if (!instagramUserId || !accessToken) {
      return apiJson(
        { ok: false, message: "Instagram User ID ve Access Token zorunlu." },
        400,
      )
    }

    const tokenCheck = validateAccessToken(accessToken)
    if (!tokenCheck.ok) {
      return apiJson({ ok: false, message: tokenCheck.message }, 400)
    }

    const storedToken = encodeAccessTokenForDb(tokenCheck.token)
    const isConnected = 1

    if (existing) {
      await sqlToken(
        token,
        `UPDATE instagram_settings SET instagram_user_id='${sanitizeSqlString(instagramUserId)}', instagram_username=${sqlNullableString(instagramUsername)}, facebook_page_id=${sqlNullableString(facebookPageId)}, access_token='${sanitizeSqlString(storedToken)}', token_expires_at=${sqlNullableString(tokenExpiresAt)}, scopes=${sqlNullableString(scopes)}, is_connected=${isConnected}, is_active=${isActive}, connected_at=COALESCE(connected_at, CURRENT_TIMESTAMP), last_sync_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=${existing.id} AND business_user_id=${businessUserId}`,
      )
    } else {
      await sqlToken(
        token,
        `INSERT INTO instagram_settings (business_user_id, instagram_user_id, instagram_username, facebook_page_id, access_token, token_expires_at, scopes, is_connected, is_active, connected_at, last_sync_at, created_at, updated_at) VALUES (${businessUserId}, '${sanitizeSqlString(instagramUserId)}', ${sqlNullableString(instagramUsername)}, ${sqlNullableString(facebookPageId)}, '${sanitizeSqlString(storedToken)}', ${sqlNullableString(tokenExpiresAt)}, ${sqlNullableString(scopes)}, ${isConnected}, ${isActive}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      )
    }

    const refreshed = normalizeInstagramSettingsRows(await loadRowsForBusiness(token, businessUserId))
    return apiJson({ ok: true, row: refreshed[0] ?? null })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson(
      {
        ok: false,
        message: "Instagram ayarlari kaydedilemedi.",
        error: axiosErr?.message ?? String(err),
      },
      502,
    )
  }
}
