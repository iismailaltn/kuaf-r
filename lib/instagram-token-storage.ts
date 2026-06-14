import { normalizeAccessToken } from "@/lib/instagram-token"

export function encodeAccessTokenForDb(token: string) {
  const normalized = normalizeAccessToken(token)
  if (!normalized) {
    return ""
  }
  if (typeof btoa === "function") {
    return `b64:${btoa(normalized)}`
  }
  return normalized
}

export function decodeAccessTokenFromDb(stored: unknown) {
  const raw = String(stored ?? "").trim()
  if (!raw) {
    return ""
  }
  if (raw.startsWith("b64:")) {
    try {
      return normalizeAccessToken(atob(raw.slice(4)))
    } catch {
      return ""
    }
  }
  return normalizeAccessToken(raw)
}
