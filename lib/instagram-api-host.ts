import { INSTAGRAM_GRAPH_VERSION } from "@/lib/instagram-constants"

export type InstagramLoginType = "facebook" | "instagram"

export function resolveInstagramLoginType(
  accessToken: string,
  override?: string,
): InstagramLoginType {
  if (accessToken.startsWith("IGAA")) {
    return "instagram"
  }

  const env = String(override ?? "").trim().toLowerCase()
  if (env === "facebook" || env === "instagram") {
    return env
  }

  return "facebook"
}

export function instagramGraphBaseUrl(loginType: InstagramLoginType) {
  const host = loginType === "instagram" ? "graph.instagram.com" : "graph.facebook.com"
  return `https://${host}/${INSTAGRAM_GRAPH_VERSION}`
}
