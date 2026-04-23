import { NextResponse } from "next/server"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import type { AxiosError } from "axios"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

export async function GET() {
  try {
    const token = appConfig.token.kuafor_tables
    if (!token) {
      return NextResponse.json({ ok: false, message: "kuafor_tables token tanimli degil." }, { status: 500 })
    }

    const data = await selectByToken<any>(token)
    const rows =
      Array.isArray((data as any)?.data) ? (data as any).data :
      Array.isArray((data as any)?.Data) ? (data as any).Data :
      Array.isArray(data) ? data :
      []

    return NextResponse.json({ ok: true, rows })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Calisma alanlari getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          tableNumber?: string
          capacity?: number
          status?: string
          locationDescription?: string
          isReservable?: boolean
        }
      | null

    const token = appConfig.token.kuafor_tables
    if (!token) {
      return NextResponse.json({ ok: false, message: "kuafor_tables token tanimli degil." }, { status: 500 })
    }

    const tableNumber = sanitizeSqlString(String(body?.tableNumber ?? "").trim())
    if (!tableNumber) {
      return NextResponse.json({ ok: false, message: "tableNumber zorunlu." }, { status: 400 })
    }

    const capacity = Number.isFinite(Number(body?.capacity)) ? Number(body?.capacity) : 1
    const status = sanitizeSqlString(String(body?.status ?? "available").trim() || "available")
    const locationDescription = sanitizeSqlString(String(body?.locationDescription ?? "").trim())
    const isReservable = body?.isReservable === false ? 0 : 1

    const sql = `INSERT INTO restaurant_tables (tableNumber, table_number, capacity, status, locationDescription, location_description, isReservable, is_reservable, createdAt, created_at, updatedAt, updated_at) VALUES ('${tableNumber}', '${tableNumber}', ${capacity}, '${status}', ${locationDescription ? `'${locationDescription}'` : "''"}, ${locationDescription ? `'${locationDescription}'` : "''"}, ${isReservable}, ${isReservable}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    await sqlToken(token, sql)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Calisma alani ekleme istegi basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

