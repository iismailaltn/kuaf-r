import type { InstagramLoginType } from "@/lib/instagram-api-host"
import { resolveInstagramContextViaServer } from "@/lib/services/instagram-server-api"
import { validateAccessToken } from "@/lib/instagram-token"

export type InstagramPublishContext = {
  accessToken: string
  instagramUserId: string
  loginType: InstagramLoginType
  username: string
}

export type InstagramPublishContextResult =
  | { ok: true; context: InstagramPublishContext }
  | { ok: false; message: string }

export async function resolveInstagramPublishContext(options: {
  accessToken: string
  instagramUserId?: string
  loginType?: string
}): Promise<InstagramPublishContextResult> {
  const validation = validateAccessToken(options.accessToken)
  if (!validation.ok) {
    return { ok: false, message: validation.message }
  }

  const serverResult = await resolveInstagramContextViaServer({
    accessToken: validation.token,
    instagramUserId: options.instagramUserId,
    loginType: options.loginType,
  })

  if (!serverResult.ok) {
    return serverResult
  }

  return serverResult
}
