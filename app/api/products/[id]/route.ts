import { NextResponse } from "next/server"
import { appConfig } from "@/app.config"
import { sqlToken } from "@/lib/services/locofabric-database"
import type { AxiosError } from "axios"
import { getBusinessUserIdFromBody, getBusinessUserIdFromRequest, requireBusinessUserId } from "@/lib/business-scope"

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
      return NextResponse.json({ ok: false, message: "Gecersiz urun id." }, { status: 400 })
    }

    const token = appConfig.token.Urünler
    if (!token) {
      return NextResponse.json({ ok: false, message: "Urunler token tanimli degil." }, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as
      | { businessUserId?: string | number; name?: string; description?: string; price?: number; cost?: number; stock?: number; status?: string; categoryId?: number; isAvailable?: boolean }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return NextResponse.json({ ok: false, message: businessError }, { status: 400 })
    }

    const name = sanitizeSqlString(String(body?.name ?? "").trim())
    const description = sanitizeSqlString(String(body?.description ?? "").trim())
    const price = Number(body?.price ?? 0)
    const cost = Number(body?.cost ?? 0)
    const stock = Number(body?.stock ?? 0)
    const status = sanitizeSqlString(String(body?.status ?? "mevcut").trim())
    const categoryId = Number(body?.categoryId ?? 1)
    const isAvailable = body?.isAvailable === false ? 0 : 1

    const sql = `UPDATE menu_items SET categoryId=${categoryId}, name='${name}', description=${description ? `'${description}'` : "NULL"}, price=${price}, cost=${cost}, stock1=${stock}, status='${status}', isAvailable=${isAvailable}, updatedAt=CURRENT_TIMESTAMP WHERE id=${idNum} AND business_user_id=${businessUserId}`
    await sqlToken(token, sql)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Urun guncelleme basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const idNum = Number(id)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, message: "Gecersiz urun id." }, { status: 400 })
    }

    const token = appConfig.token.Urünler
    if (!token) {
      return NextResponse.json({ ok: false, message: "Urunler token tanimli degil." }, { status: 500 })
    }

    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return NextResponse.json({ ok: false, message: businessError }, { status: 400 })
    }

    await sqlToken(token, `DELETE FROM menu_items WHERE id=${idNum} AND business_user_id=${businessUserId}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Urun silme basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

