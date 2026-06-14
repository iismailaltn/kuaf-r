import type { InstagramLoginType } from "@/lib/instagram-api-host"
import { buildInstagramGraphUrl, instagramGraphFetch } from "@/lib/instagram-graph-client"

type GraphErrorBody = {
  error?: {
    message?: string
    code?: number
  }
  status_code?: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function graphErrorMessage(data: unknown, status: number, loginType: InstagramLoginType) {
  const err = (data as GraphErrorBody | null)?.error
  const message = err?.message?.trim()
  const code = err?.code != null ? ` (code ${err.code})` : ""
  const host = loginType === "instagram" ? "graph.instagram.com" : "graph.facebook.com"
  const full = message ? `${message}${code}` : `Instagram API hatasi (${status})`

  if (message?.toLowerCase().includes("image_url") || err?.code === 9004) {
    return `${full} Fotograf linki herkese acik HTTPS JPEG olmali (WebP desteklenmez).`
  }
  if (message?.toLowerCase().includes("parse access token")) {
    return `${full} Token veya API host uyumsuz (${host}).`
  }
  return full
}

async function graphPost(
  loginType: InstagramLoginType,
  path: string,
  accessToken: string,
  fields: Record<string, string>,
) {
  const graphPath = path.replace(/^\//, "")

  if (loginType === "instagram") {
    const body = JSON.stringify({ ...fields, access_token: accessToken })
    const res = await instagramGraphFetch(loginType, graphPath, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    })
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null
    return { res, json, url: buildInstagramGraphUrl(loginType, graphPath), loginType }
  }

  const form = new URLSearchParams()
  Object.entries(fields).forEach(([key, value]) => {
    form.append(key, value ?? "")
  })

  const res = await instagramGraphFetch(loginType, graphPath, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  })
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null
  return { res, json, url: buildInstagramGraphUrl(loginType, graphPath), loginType }
}

async function graphGet(loginType: InstagramLoginType, path: string, accessToken: string) {
  const separator = path.includes("?") ? "&" : "?"
  const graphPath = path.includes("access_token=")
    ? path
    : `${path}${separator}access_token=${encodeURIComponent(accessToken)}`

  const res = await instagramGraphFetch(loginType, graphPath, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const json = (await res.json().catch(() => null)) as GraphErrorBody | null
  return { res, json }
}

async function waitForContainerReady(
  loginType: InstagramLoginType,
  containerId: string,
  accessToken: string,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { res, json } = await graphGet(loginType, `${containerId}?fields=status_code`, accessToken)
    const status = String(json?.status_code ?? "").trim()
    if (!res.ok || !status) {
      return
    }
    if (status === "FINISHED") {
      return
    }
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Medya konteyneri hazir degil (${status}).`)
    }
    await sleep(2000)
  }
}

async function publishContainer(
  loginType: InstagramLoginType,
  instagramUserId: string,
  accessToken: string,
  creationId: string,
): Promise<{ ok: true; mediaId: string } | { ok: false; message: string }> {
  const { res, json } = await graphPost(loginType, `${instagramUserId}/media_publish`, accessToken, {
    creation_id: creationId,
  })
  const mediaId = String(json?.id ?? "").trim()
  if (!res.ok || !mediaId) {
    return { ok: false, message: graphErrorMessage(json, res.status, loginType) }
  }

  return { ok: true, mediaId }
}

export async function publishPhotoToInstagram(options: {
  instagramUserId: string
  accessToken: string
  imageUrl: string
  imageUrls?: string[]
  caption?: string
  loginType: InstagramLoginType
}): Promise<{ ok: true; mediaId: string; creationId: string } | { ok: false; message: string }> {
  const imageUrl = String(options.imageUrl ?? "").trim()
  const imageUrls = options.imageUrls ?? []
  const allImageUrls = imageUrls.length > 0 ? imageUrls : [imageUrl]

  if (!imageUrl.startsWith("https://")) {
    return { ok: false, message: "Instagram paylasimi icin public HTTPS image_url gerekli." }
  }
  if (/\.webp(\?|$)/i.test(imageUrl)) {
    return {
      ok: false,
      message: "Instagram yalnizca JPEG kabul eder. Cloudinary WebP dondurdu; fotografi tekrar cekin veya JPEG URL kullanin.",
    }
  }

  const caption = String(options.caption ?? "").trim().slice(0, 2200)
  const accessToken = String(options.accessToken ?? "").trim()
  const instagramUserId = String(options.instagramUserId ?? "").trim()
  const loginType = options.loginType

  if (!accessToken) {
    return { ok: false, message: "Access Token bos veya gecersiz." }
  }
  if (!instagramUserId) {
    return { ok: false, message: "Instagram User ID eksik." }
  }

  // Carousel (2-10 photos)
  if (allImageUrls.length >= 2 && allImageUrls.length <= 10) {
    const childContainerIds: string[] = []

    // Create containers for each photo
    for (const url of allImageUrls) {
      const createFields: Record<string, string> = { image_url: url }
      const { res: createRes, json: createData } = await graphPost(
        loginType,
        `${instagramUserId}/media`,
        accessToken,
        createFields,
      )
      const creationId = String(createData?.id ?? "").trim()
      if (!createRes.ok || !creationId) {
        return { ok: false, message: graphErrorMessage(createData, createRes.status, loginType) }
      }
      childContainerIds.push(creationId)
    }

    // Wait for all child containers to be ready
    for (const childId of childContainerIds) {
      try {
        await waitForContainerReady(loginType, childId, accessToken)
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Medya konteyneri hazir degil." }
      }
    }

    // Create parent carousel container
    const carouselFields: Record<string, string> = {
      media_type: "CAROUSEL",
      children: childContainerIds.join(","),
    }
    if (caption) {
      carouselFields.caption = caption
    }

    const { res: carouselRes, json: carouselData } = await graphPost(
      loginType,
      `${instagramUserId}/media`,
      accessToken,
      carouselFields,
    )
    const carouselCreationId = String(carouselData?.id ?? "").trim()
    if (!carouselRes.ok || !carouselCreationId) {
      return { ok: false, message: graphErrorMessage(carouselData, carouselRes.status, loginType) }
    }

    try {
      await waitForContainerReady(loginType, carouselCreationId, accessToken)
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Carousel konteyneri hazir degil." }
    }

    const published = await publishContainer(loginType, instagramUserId, accessToken, carouselCreationId)
    if (!published.ok) {
      return published
    }

    return { ok: true, mediaId: published.mediaId, creationId: carouselCreationId }
  }

  // Single photo
  const createFields: Record<string, string> = { image_url: imageUrl }
  if (caption) {
    createFields.caption = caption
  }

  const { res: createRes, json: createData } = await graphPost(
    loginType,
    `${instagramUserId}/media`,
    accessToken,
    createFields,
  )
  const creationId = String(createData?.id ?? "").trim()
  if (!createRes.ok || !creationId) {
    return { ok: false, message: graphErrorMessage(createData, createRes.status, loginType) }
  }

  try {
    await waitForContainerReady(loginType, creationId, accessToken)
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Medya konteyneri hazir degil." }
  }

  const published = await publishContainer(loginType, instagramUserId, accessToken, creationId)
  if (!published.ok) {
    return published
  }

  return { ok: true, mediaId: published.mediaId, creationId }
}
