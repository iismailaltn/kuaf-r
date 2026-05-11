import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { sqlToken } from "@/lib/services/locofabric-database"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const idNum = Number(id)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, message: "Gecersiz hizmet id." }, { status: 400 })
    }

    const token = appConfig.token.salonservis
    if (!token) {
      return NextResponse.json({ ok: false, message: "salonservis token tanimli degil." }, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as
      | {
          name?: string
          description?: string | null
          category?: string
          durationMinutes?: number | string
          price?: number | string
          isActive?: boolean
        }
      | null

    const updates: string[] = []

    if (body?.name != null) {
      const name = sanitizeSqlString(String(body.name).trim())
      if (!name) {
        return NextResponse.json({ ok: false, message: "Hizmet adi zorunlu." }, { status: 400 })
      }
      updates.push(`name='${name}'`)
    }

    if (body?.description !== undefined) {
      const description = sanitizeSqlString(String(body.description ?? "").trim())
      updates.push(description ? `description='${description}'` : "description=NULL")
    }

    if (body?.category != null) {
      const category = sanitizeSqlString(String(body.category).trim())
      if (!category) {
        return NextResponse.json({ ok: false, message: "Kategori zorunlu." }, { status: 400 })
      }
      updates.push(`category='${category}'`)
    }

    if (body?.durationMinutes != null) {
      const durationMinutes = Number(body.durationMinutes)
      if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
        return NextResponse.json({ ok: false, message: "Gecersiz sure." }, { status: 400 })
      }
      updates.push(`duration_minutes=${durationMinutes}`)
    }

    if (body?.price != null) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ ok: false, message: "Gecersiz fiyat." }, { status: 400 })
      }
      updates.push(`price=${price}`)
    }

    if (body?.isActive != null) {
      updates.push(`is_active=${body.isActive === false ? 0 : 1}`)
    }

    if (!updates.length) {
      return NextResponse.json({ ok: false, message: "Guncellenecek alan yok." }, { status: 400 })
    }

    updates.push("updated_at=CURRENT_TIMESTAMP")

    const sql = `UPDATE expertise_areas SET ${updates.join(", ")} WHERE id=${idNum}`
    await sqlToken(token, sql)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Salon hizmeti guncellenemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}
