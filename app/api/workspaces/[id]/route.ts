import { NextResponse } from "next/server"
import { appConfig } from "@/app.config"
import { sqlToken } from "@/lib/services/locofabric-database"
import type { AxiosError } from "axios"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await ctx.params

    const body = (await req.json().catch(() => null)) as { tableNumber?: string; previousTableNumber?: string } | null
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

    const sql = `UPDATE restaurant_tables SET tableNumber='${tableNumber}', table_number='${tableNumber}', updatedAt=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE tableNumber='${previousTableNumber}' OR table_number='${previousTableNumber}'`
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
    await ctx.params
    const body = (await req.json().catch(() => null)) as { status?: string; previousTableNumber?: string } | null
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

    const sql = `UPDATE restaurant_tables SET status='${statusValue}', updatedAt=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE tableNumber='${previousTableNumber}' OR table_number='${previousTableNumber}'`
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
    await ctx.params
    const body = (await req.json().catch(() => null)) as { previousTableNumber?: string } | null
    const previousTableNumber = sanitizeSqlString(String(body?.previousTableNumber ?? "").trim())
    if (!previousTableNumber) {
      return NextResponse.json({ ok: false, message: "previousTableNumber zorunlu." }, { status: 400 })
    }

    const token = appConfig.token.kuafor_tables
    if (!token) {
      return NextResponse.json({ ok: false, message: "kuafor_tables token tanimli degil." }, { status: 500 })
    }

    const sql = `DELETE FROM restaurant_tables WHERE tableNumber='${previousTableNumber}' OR table_number='${previousTableNumber}'`
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

