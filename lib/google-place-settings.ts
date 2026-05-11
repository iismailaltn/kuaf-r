export type GooglePlaceSettingsRow = {
  id?: number | string
  places_api_key?: string
  placesApiKey?: string
  placeId?: string
  place_id?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export type GooglePlaceSettings = {
  id: number
  placesApiKey: string
  placeId: string
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

export function normalizeGooglePlaceSettingsRow(row: GooglePlaceSettingsRow): GooglePlaceSettings | null {
  const id = toNumber(row.id, NaN)
  const placesApiKey = toStringValue(row.places_api_key ?? row.placesApiKey)
  const placeId = toStringValue(row.placeId ?? row.place_id)
  if (!Number.isFinite(id) || !placesApiKey || !placeId) {
    return null
  }

  return {
    id,
    placesApiKey,
    placeId,
    createdAt: toStringValue(row.createdAt ?? row.created_at),
    updatedAt: toStringValue(row.updatedAt ?? row.updated_at),
  }
}

export function normalizeGooglePlaceSettingsRows(rows: GooglePlaceSettingsRow[]) {
  return rows
    .map((row) => normalizeGooglePlaceSettingsRow(row))
    .filter((row): row is GooglePlaceSettings => row !== null)
    .sort((a, b) => a.id - b.id)
}
