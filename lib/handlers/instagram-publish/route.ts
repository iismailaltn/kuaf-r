import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { resolveInstagramPublishContext } from "@/lib/instagram-credentials"
import { loadInstagramSettingsForBusiness } from "@/lib/instagram-settings-query"
import { normalizeAccessToken, resolveInstagramPublishToken } from "@/lib/instagram-token"
import { resolvePublicImageUrl } from "@/lib/session-photo-host"
import { publishPhotoViaServer } from "@/lib/services/instagram-server-api"
import { getBusinessUserIdFromBody, requireBusinessUserId } from "@/lib/business-scope"
import { sqlToken } from "@/lib/services/locofabric-database"
import { apiJson } from "@/lib/api-response"

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          businessUserId?: string | number
          photo?: string
          photos?: string[]
          caption?: string
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const photo = String(body?.photo ?? "").trim()
    if (!photo) {
      return apiJson({ ok: false, message: "Paylasim icin fotograf gerekli." }, 400)
    }

    const settings = await loadInstagramSettingsForBusiness(businessUserId)

    const envToken = normalizeAccessToken(appConfig.instagramAccessToken)
    const envUserId = String(appConfig.instagramUserId ?? "").trim()
    const dbToken = normalizeAccessToken(settings?.accessToken)
    const dbUserId = String(settings?.instagramUserId ?? "").trim()

    let rawToken = envToken || dbToken

    if (!rawToken) {
      return apiJson(
        {
          ok: false,
          message:
            "Access Token eksik. .env.local NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN ekleyip npm run build yapin veya Ayarlar > Instagram'dan kaydedin.",
        },
        400,
      )
    }

    if (!envToken && settings && (!settings.isActive || !settings.isConnected)) {
      return apiJson({ ok: false, message: "Instagram baglantisi aktif degil." }, 400)
    }

    if (!envToken && dbToken && !dbToken.startsWith("IGAA")) {
      const pageTokenResult = await resolveInstagramPublishToken({
        accessToken: dbToken,
        facebookPageId: settings?.facebookPageId,
      })
      if (pageTokenResult.ok) {
        rawToken = pageTokenResult.token
      }
    }

    const preferredUserId = envUserId || dbUserId
    const contextResult = await resolveInstagramPublishContext({
      accessToken: rawToken,
      instagramUserId: preferredUserId,
      loginType: appConfig.instagramLoginType,
    })

    if (!contextResult.ok) {
      return apiJson({ ok: false, message: contextResult.message }, 400)
    }

    const imageResult = await resolvePublicImageUrl(photo)
    if (!imageResult.ok) {
      return apiJson({ ok: false, message: imageResult.message }, 400)
    }

    const { context } = contextResult
    const photos = Array.isArray(body?.photos) ? body.photos : []
    const result = await publishPhotoViaServer({
      instagramUserId: context.instagramUserId,
      accessToken: context.accessToken,
      imageUrl: imageResult.url,
      imageUrls: photos.length > 0 ? photos : undefined,
      caption: body?.caption,
      loginType: context.loginType,
    })

    if (!result.ok) {
      return apiJson({ ok: false, message: result.message }, 502)
    }

    const token = appConfig.token.instagram_settings
    if (token && settings?.id) {
      try {
        await sqlToken(
          token,
          `UPDATE instagram_settings SET last_sync_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=${settings?.id} AND business_user_id=${businessUserId}`,
        )
      } catch {
        // ignore sync timestamp failure
      }
    }

    return apiJson({
      ok: true,
      mediaId: result.mediaId,
      creationId: result.creationId,
      imageUrl: imageResult.url,
      username: context.username,
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      return apiJson(
        {
          ok: false,
          message:
            "Instagram sunucusu ulasilamadi. server.hstplanet.com uzerinde InstagramController yuklu ve CORS acik mi kontrol edin.",
        },
        502,
      )
    }
    return apiJson(
      {
        ok: false,
        message: "Instagram paylasimi yapilamadi.",
        error: axiosErr?.message ?? message,
      },
      502,
    )
  }
}
