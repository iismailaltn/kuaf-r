export function getBusinessUserIdFromRequest(req: Request) {
  const url = new URL(req.url)
  return String(url.searchParams.get("businessUserId") ?? req.headers.get("x-business-user-id") ?? "").trim()
}

export function getBusinessUserIdFromBody(body: { businessUserId?: string | number } | null | undefined) {
  return String(body?.businessUserId ?? "").trim()
}

export function isValidBusinessUserId(value: string) {
  return /^\d+$/.test(value)
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function getField(row: any, candidates: string[]) {
  if (!row || typeof row !== "object") return undefined
  const entries = Object.entries(row as Record<string, unknown>)
  for (const candidate of candidates) {
    const direct = (row as Record<string, unknown>)[candidate]
    if (direct !== undefined && direct !== null) return direct

    const normalizedCandidate = normalizeKey(candidate)
    const found = entries.find(([key]) => normalizeKey(key) === normalizedCandidate)
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

export function matchesBusinessUserId(row: any, businessUserId: string) {
  const explicitValue = getField(row, [
    "business_user_id",
    "businessUserId",
    "business_user_i",
    "businessUserI",
    "business_id",
    "businessId",
  ])

  const fallbackValue = row && typeof row === "object"
    ? Object.entries(row as Record<string, unknown>).find(([key]) => {
        const normalizedKey = normalizeKey(key)
        return normalizedKey.includes("business") && normalizedKey.includes("user")
      })?.[1]
    : undefined

  const value = String(explicitValue ?? fallbackValue ?? "").trim()
  return value === businessUserId || Number(value) === Number(businessUserId)
}

export function requireBusinessUserId(value: string) {
  if (!isValidBusinessUserId(value)) {
    return "Isletme kullanici bilgisi zorunlu."
  }
  return null
}
