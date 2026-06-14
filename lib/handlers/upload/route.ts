import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ ok: false, message: "Dosya gerekli." }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return Response.json({ ok: false, message: "Sadece resim dosyaları yüklenebilir." }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ ok: false, message: "Dosya boyutu 5MB'den küçük olmalı." }, { status: 400 })
    }

    // Proxy to server.hstplanet.com
    const serverFormData = new FormData()
    serverFormData.append("file", file)

    const response = await fetch("https://server.hstplanet.com/api/Files/uploadImage", {
      method: "POST",
      headers: {
        accept: "*/*",
      },
      body: serverFormData,
    })

    const data = await response.json()

    if (!response.ok) {
      return Response.json({ ok: false, message: "Dosya yüklenemedi." }, { status: response.status })
    }

    return Response.json(data)
  } catch (err) {
    console.error("Upload error:", err)
    return Response.json({ ok: false, message: "Dosya yüklenirken hata oluştu." }, { status: 500 })
  }
}
