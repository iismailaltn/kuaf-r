import { INSTAGRAM_GRAPH_VERSION } from "@/lib/instagram-constants"
import { instagramGraphBaseUrl, resolveInstagramLoginType } from "@/lib/instagram-api-host"

const FACEBOOK_TOKEN_PATTERN = /^(EAA|IGAA|EAAG)[A-Za-z0-9+/=_-]+$/

type TokenResult =
  | { ok: true; token: string; message: "" }
  | { ok: false; token: string; message: string }

function stripInvisibleChars(value: string) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "")
}

export function normalizeAccessToken(raw: unknown) {
  let token = stripInvisibleChars(String(raw ?? "")).trim()
  if (!token) {
    return ""
  }

  const jsonMatch = /"access_token"\s*:\s*"([^"]+)"/i.exec(token)
  if (jsonMatch?.[1]) {
    token = jsonMatch[1]
  }

  const embeddedMatch = /((?:EAA|IGAA|EAAG)[A-Za-z0-9+/=_-]{40,})/.exec(token)
  if (embeddedMatch?.[1]) {
    token = embeddedMatch[1]
  }

  token = token.replace(/^access_token=/i, "").trim()

  while (/^(Bearer|OAuth)\s+/i.test(token)) {
    token = token.replace(/^(Bearer|OAuth)\s+/i, "").trim()
  }

  token = token.replace(/^["']|["']$/g, "").trim()
  token = token.replace(/\s+/g, "")

  return token
}

export function validateAccessToken(raw: unknown): TokenResult {
  const token = normalizeAccessToken(raw)
  if (!token) {
    return { ok: false, token: "", message: "Access Token bos." }
  }

  if (token.length < 50) {
    return {
      ok: false,
      token,
      message: "Access Token cok kisa veya kesilmis. Meta'dan aldiginiz tokeni tam olarak yapistirin.",
    }
  }

  if (!FACEBOOK_TOKEN_PATTERN.test(token)) {
    return {
      ok: false,
      token,
      message:
        "Access Token formati gecersiz. Meta Graph API token (EAA... ile baslar) kullanin.",
    }
  }

  return { ok: true, token, message: "" }
}

export function validatePublishAccessToken(raw: unknown): TokenResult {
  return validateAccessToken(raw)
}

type GraphErrorResponse = {
  id?: string
  username?: string
  access_token?: string
  error?: { message?: string; code?: number }
}

async function graphGet(path: string, accessToken: string, loginTypeOverride?: string) {
  const loginType = resolveInstagramLoginType(accessToken, loginTypeOverride)
  return fetch(`${instagramGraphBaseUrl(loginType)}/${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

async function fetchPageAccessToken(userToken: string, facebookPageId: string): Promise<TokenResult> {
  const url = new URL(`https://graph.facebook.com/${INSTAGRAM_GRAPH_VERSION}/${facebookPageId}`)
  url.searchParams.set("fields", "access_token")
  url.searchParams.set("access_token", userToken)

  const res = await fetch(url.toString(), { method: "GET" })
  const data = (await res.json().catch(() => null)) as GraphErrorResponse | null
  const pageToken = normalizeAccessToken(data?.access_token)
  if (!res.ok || !pageToken) {
    return { ok: false, token: userToken, message: data?.error?.message ?? "Facebook Page token alinamadi." }
  }

  return validateAccessToken(pageToken)
}

export async function verifyInstagramCredentials(options: {
  accessToken: string
  instagramUserId: string
  facebookPageId?: string
}): Promise<TokenResult> {
  const validation = validateAccessToken(options.accessToken)
  if (!validation.ok) {
    return validation
  }

  const instagramUserId = String(options.instagramUserId ?? "").trim()
  if (!instagramUserId) {
    return { ok: false, token: validation.token, message: "Instagram User ID zorunlu." }
  }

  let publishToken = validation.token
  const facebookPageId = String(options.facebookPageId ?? "").trim()
  if (facebookPageId) {
    const pageTokenResult = await fetchPageAccessToken(validation.token, facebookPageId)
    if (pageTokenResult.ok) {
      publishToken = pageTokenResult.token
    }
  }

  const res = await graphGet(`${instagramUserId}?fields=id,username`, publishToken)
  const data = (await res.json().catch(() => null)) as GraphErrorResponse | null
  if (!res.ok || !data?.id) {
    const graphMessage = data?.error?.message ?? "Access Token dogrulanamadi."
    return {
      ok: false,
      token: publishToken,
      message: graphMessage.includes("parse access token")
        ? `${graphMessage} Tokeni Graph Explorer'dan EAA... olarak kopyalayin; OAuth/Bearer on eki ve bosluk olmadan yapistirin.`
        : graphMessage,
    }
  }

  return { ok: true, token: publishToken, message: "" }
}

export async function verifyAccessTokenWithGraph(accessToken: string): Promise<TokenResult> {
  const validation = validateAccessToken(accessToken)
  if (!validation.ok) {
    return validation
  }

  const res = await graphGet("me?fields=id", validation.token)
  const data = (await res.json().catch(() => null)) as GraphErrorResponse | null
  if (!res.ok || !data?.id) {
    return {
      ok: false,
      token: validation.token,
      message: data?.error?.message ?? "Access Token Meta tarafindan dogrulanamadi.",
    }
  }

  return { ok: true, token: validation.token, message: "" }
}

export async function resolveInstagramPublishToken(options: {
  accessToken: string
  facebookPageId?: string
}): Promise<TokenResult> {
  const validation = validateAccessToken(options.accessToken)
  if (!validation.ok) {
    return validation
  }

  const facebookPageId = String(options.facebookPageId ?? "").trim()
  if (!facebookPageId || validation.token.startsWith("IGAA")) {
    return validation
  }

  const pageTokenResult = await fetchPageAccessToken(validation.token, facebookPageId)
  if (pageTokenResult.ok) {
    return pageTokenResult
  }

  return validation
}
