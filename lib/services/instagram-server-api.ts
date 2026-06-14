import { appConfig } from "@/app.config"
import type { InstagramLoginType } from "@/lib/instagram-api-host"
import type { InstagramPublishContext } from "@/lib/instagram-credentials"

type ApiEnvelope<T> = {
  ok?: boolean
  Ok?: boolean
  message?: string
  Message?: string
  data?: T
  Data?: T
}

function instagramApiBaseUrl() {
  const custom = String(process.env.NEXT_PUBLIC_INSTAGRAM_API_URL ?? "").trim()
  if (custom) {
    return custom.replace(/\/$/, "")
  }
  return `${appConfig.serverURL.replace(/\/+$/, "")}/api/instagram`
}

function unwrap<T>(json: ApiEnvelope<T> | null): { ok: true; data: T } | { ok: false; message: string } {
  const ok = json?.ok === true || json?.Ok === true
  const data = json?.data ?? json?.Data
  const message = String(json?.message ?? json?.Message ?? "").trim()
  if (ok && data) {
    return { ok: true, data }
  }
  return { ok: false, message: message || "Instagram API istegi basarisiz." }
}

export async function resolveInstagramContextViaServer(options: {
  accessToken: string
  instagramUserId?: string
  loginType?: string
}): Promise<{ ok: true; context: InstagramPublishContext } | { ok: false; message: string }> {
  const res = await fetch(`${instagramApiBaseUrl()}/context`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: options.accessToken,
      instagramUserId: options.instagramUserId,
      loginType: options.loginType,
    }),
  })

  const json = (await res.json().catch(() => null)) as ApiEnvelope<{
    accessToken?: string
    AccessToken?: string
    instagramUserId?: string
    InstagramUserId?: string
    loginType?: string
    LoginType?: string
    username?: string
    Username?: string
  }> | null

  const parsed = unwrap(json)
  if (!parsed.ok) {
    return parsed
  }

  const row = parsed.data
  const accessToken = String(row.accessToken ?? row.AccessToken ?? "").trim()
  const instagramUserId = String(row.instagramUserId ?? row.InstagramUserId ?? "").trim()
  const loginType = String(row.loginType ?? row.LoginType ?? "instagram").trim() as InstagramLoginType
  const username = String(row.username ?? row.Username ?? "").trim()

  if (!accessToken || !instagramUserId) {
    return { ok: false, message: "Sunucu gecersiz Instagram baglami dondurdu." }
  }

  return {
    ok: true,
    context: { accessToken, instagramUserId, loginType, username },
  }
}

export async function publishPhotoViaServer(options: {
  accessToken: string
  instagramUserId: string
  imageUrl: string
  imageUrls?: string[]
  caption?: string
  loginType: InstagramLoginType
}): Promise<
  | { ok: true; mediaId: string; creationId: string }
  | { ok: false; message: string }
> {
  const res = await fetch(`${instagramApiBaseUrl()}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: options.accessToken,
      instagramUserId: options.instagramUserId,
      imageUrl: options.imageUrl,
      imageUrls: options.imageUrls,
      caption: options.caption,
      loginType: options.loginType,
    }),
  })

  const json = (await res.json().catch(() => null)) as ApiEnvelope<{
    mediaId?: string
    MediaId?: string
    creationId?: string
    CreationId?: string
  }> | null

  const parsed = unwrap(json)
  if (!parsed.ok) {
    return parsed
  }

  const mediaId = String(parsed.data.mediaId ?? parsed.data.MediaId ?? "").trim()
  const creationId = String(parsed.data.creationId ?? parsed.data.CreationId ?? "").trim()
  if (!mediaId) {
    return { ok: false, message: "Yayinlama tamamlandi ancak mediaId alinamadi." }
  }

  return { ok: true, mediaId, creationId }
}
