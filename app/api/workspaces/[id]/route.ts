import { NextResponse } from "next/server"
import { appConfig } from "@/app.config"
import { sqlToken } from "@/lib/services/locofabric-database"
import type { AxiosError } from "axios"
import { getBusinessUserIdFromBody, requireBusinessUserId } from "@/lib/business-scope"

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
      return NextResponse.json({ ok: false, message: "Gecersiz calisma alani id." }, { status: 400 })
    }

    const body = (await req.json().catch(() => null)) as { businessUserId?: string | number; tableNumber?: string; previousTableNumber?: string } | null
    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return NextResponse.json({ ok: false, message: businessError }, { status: 400 })
    }
    const tableNumber = sanitizeSqlString(String(body?.tableNumber ?? "").trim())
    const previousTableNumber = sanitizeSqlString(String(body?.previousTableNumber ?? "").trim())
    if (!tableNumber) {
      return NextResponse.json({ ok: false, message: "tableNumber zorunlu." }, { status: 400 })
    }
    if (!previousTableNumber) {
      return NextResponse.json({ ok: false, message: "previousTableNumber zorunlu." }, { status: 400 })
    }

    const token = appConfig.token.kuafor_tables
    if (!token) {
      return NextResponse.json({ ok: false, message: "kuafor_tables token tanimli degil." }, { status: 500 })
    }

    const sql = `UPDATE restaurant_tables SET tableNumber='${tableNumber}', updatedAt=CURRENT_TIMESTAMP WHERE id=${idNum} AND business_user_id=${businessUserId}`
    await sqlToken(token, sql)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Calisma alani guncelleme istegi basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const idNum = Number(id)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, message: "Gecersiz calisma alani id." }, { status: 400 })
    }
    const body = (await req.json().catch(() => null)) as { businessUserId?: string | number; status?: string; previousTableNumber?: string } | null
    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return NextResponse.json({ ok: false, message: businessError }, { status: 400 })
    }
    const statusValue = sanitizeSqlString(String(body?.status ?? "").trim().toLowerCase())
    const previousTableNumber = sanitizeSqlString(String(body?.previousTableNumber ?? "").trim())
    if (!statusValue) {
      return NextResponse.json({ ok: false, message: "status zorunlu." }, { status: 400 })
    }
    if (!previousTableNumber) {
      return NextResponse.json({ ok: false, message: "previousTableNumber zorunlu." }, { status: 400 })
    }

    const token = appConfig.token.kuafor_tables
    if (!token) {
      return NextResponse.json({ ok: false, message: "kuafor_tables token tanimli degil." }, { status: 500 })
    }

    const sql = `UPDATE restaurant_tables SET status='${statusValue}', updatedAt=CURRENT_TIMESTAMP WHERE id=${idNum} AND business_user_id=${businessUserId}`
    await sqlToken(token, sql)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Calisma alani status guncelleme istegi basarisiz.",
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
      return NextResponse.json({ ok: false, message: "Gecersiz calisma alani id." }, { status: 400 })
    }
    const body = (await req.json().catch(() => null)) as { businessUserId?: string | number; previousTableNumber?: string } | null
    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return NextResponse.json({ ok: false, message: businessError }, { status: 400 })
    }
    const previousTableNumber = sanitizeSqlString(String(body?.previousTableNumber ?? "").trim())
    if (!previousTableNumber) {
      return NextResponse.json({ ok: false, message: "previousTableNumber zorunlu." }, { status: 400 })
    }

    const token = appConfig.token.kuafor_tables
    if (!token) {
      return NextResponse.json({ ok: false, message: "kuafor_tables token tanimli degil." }, { status: 500 })
    }

    const sql = `DELETE FROM restaurant_tables WHERE id=${idNum} AND business_user_id=${businessUserId}`
    await sqlToken(token, sql)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Calisma alani silme istegi basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

