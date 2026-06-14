import { INSTAGRAM_GRAPH_VERSION } from "@/lib/instagram-constants"
import type { InstagramLoginType } from "@/lib/instagram-api-host"

function directGraphOrigin(loginType: InstagramLoginType) {
  return loginType === "instagram" ? "https://graph.instagram.com" : "https://graph.facebook.com"
}

function sameOriginProxyPrefix(loginType: InstagramLoginType) {
  return loginType === "instagram" ? "/instagram-graph" : "/facebook-graph"
}

/** Tarayicida CORS olmadan Graph API cagrisi (dev rewrite / IIS proxy / harici proxy). */
export function buildInstagramGraphUrl(loginType: InstagramLoginType, graphPath: string) {
  const path = graphPath.replace(/^\//, "")
  const directUrl = `${directGraphOrigin(loginType)}/${INSTAGRAM_GRAPH_VERSION}/${path}`

  if (typeof window === "undefined") {
    return directUrl
  }

  const proxyBase = String(process.env.NEXT_PUBLIC_INSTAGRAM_PROXY_URL ?? "").trim()
  if (proxyBase) {
    const base = proxyBase.replace(/\/$/, "")
    return `${base}?target=${encodeURIComponent(directUrl)}`
  }

  return `${sameOriginProxyPrefix(loginType)}/${path}`
}

export async function instagramGraphFetch(
  loginType: InstagramLoginType,
  graphPath: string,
  init?: RequestInit,
) {
  return fetch(buildInstagramGraphUrl(loginType, graphPath), init)
}
