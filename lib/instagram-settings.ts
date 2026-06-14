import { normalizeAccessToken } from "@/lib/instagram-token"
import { decodeAccessTokenFromDb } from "@/lib/instagram-token-storage"

export type InstagramSettingsRow = {
  id?: number | string
  business_user_id?: number | string
  businessUserId?: number | string
  instagram_user_id?: string
  instagramUserId?: string
  instagram_username?: string
  instagramUsername?: string
  facebook_page_id?: string
  facebookPageId?: string
  access_token?: string
  accessToken?: string
  token_expires_at?: string | null
  tokenExpiresAt?: string | null
  scopes?: string | null
  is_connected?: boolean | number | string
  isConnected?: boolean | number | string
  is_active?: boolean | number | string
  isActive?: boolean | number | string
  connected_at?: string | null
  connectedAt?: string | null
  last_sync_at?: string | null
  lastSyncAt?: string | null
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

export type InstagramSettings = {
  id: number
  businessUserId: string
  instagramUserId: string
  instagramUsername: string
  facebookPageId: string
  accessToken: string
  tokenExpiresAt: string | null
  scopes: string
  isConnected: boolean
  isActive: boolean
  connectedAt: string | null
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toStringValue(value: unknown) {
  return String(value ?? "").trim()
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

export function normalizeInstagramSettingsRow(row: InstagramSettingsRow): InstagramSettings | null {
  const id = toNumber(row.id, NaN)
  if (!Number.isFinite(id)) {
    return null
  }

  const businessUserId = toStringValue(row.business_user_id ?? row.businessUserId)
  const instagramUserId = toStringValue(row.instagram_user_id ?? row.instagramUserId)
  const accessToken = decodeAccessTokenFromDb(row.access_token ?? row.accessToken)

  return {
    id,
    businessUserId,
    instagramUserId,
    instagramUsername: toStringValue(row.instagram_username ?? row.instagramUsername),
    facebookPageId: toStringValue(row.facebook_page_id ?? row.facebookPageId),
    accessToken,
    tokenExpiresAt: toStringValue(row.token_expires_at ?? row.tokenExpiresAt) || null,
    scopes: toStringValue(row.scopes),
    isConnected: toBoolean(row.is_connected ?? row.isConnected) || Boolean(instagramUserId && accessToken),
    isActive: row.is_active !== undefined || row.isActive !== undefined
      ? toBoolean(row.is_active ?? row.isActive)
      : true,
    connectedAt: toStringValue(row.connected_at ?? row.connectedAt) || null,
    lastSyncAt: toStringValue(row.last_sync_at ?? row.lastSyncAt) || null,
    createdAt: toStringValue(row.created_at ?? row.createdAt),
    updatedAt: toStringValue(row.updated_at ?? row.updatedAt),
  }
}

export function normalizeInstagramSettingsRows(rows: InstagramSettingsRow[]) {
  return rows
    .map((row) => normalizeInstagramSettingsRow(row))
    .filter((row): row is InstagramSettings => row !== null)
    .sort((a, b) => a.id - b.id)
}
