type PublicUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string }

export async function resolvePublicImageUrl(photo: string): Promise<PublicUrlResult> {
  console.log("photo", photo);
  
  const trimmed = String(photo ?? "").trim()
  if (!trimmed) {
    return { ok: false, message: "Paylasim icin fotograf gerekli." }
  }

  if (trimmed.startsWith("https://")) {
    return { ok: true, url: trimmed }
  }

  if (trimmed.startsWith("http://")) {
    return { ok: false, message: "Instagram icin HTTPS public link gerekli." }
  }

  // If it's a relative URL from our upload endpoint, convert to absolute
  if (trimmed.startsWith("/uploads/")) {
    const absoluteUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? "https://server.hstplanet.com"}${trimmed}`
    return { ok: true, url: absoluteUrl }
  }

  return { ok: false, message: "Gecersiz fotograf formati. Sadece HTTPS URL kabul edilir." }
}
