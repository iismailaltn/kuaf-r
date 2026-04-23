import { NextResponse } from "next/server"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import type { AxiosError } from "axios"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

export async function GET() {
  try {
    const token = appConfig.token.Urünler
    if (!token) {
      return NextResponse.json({ ok: false, message: "Urunler token tanimli degil." }, { status: 500 })
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
        message: "Urunler getirilemedi.",
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
    const token = appConfig.token.Urünler
    if (!token) {
      return NextResponse.json({ ok: false, message: "Urunler token tanimli degil." }, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as
      | {
          name?: string
          description?: string
          price?: number | string
          cost?: number | string
          stock?: number | string
          status?: string
          categoryId?: number
          isAvailable?: boolean
        }
      | null

    const name = sanitizeSqlString(String(body?.name ?? "").trim())
    if (!name) {
      return NextResponse.json({ ok: false, message: "Urun adi zorunlu." }, { status: 400 })
    }

    const descriptionRaw = String(body?.description ?? "").trim()
    const description = sanitizeSqlString(descriptionRaw)
    const priceNum = Number(body?.price)
    const price = Number.isFinite(priceNum) ? priceNum : 0
    const costNum = Number(body?.cost)
    const cost = Number.isFinite(costNum) ? costNum : 0
    const stockNum = Number(body?.stock)
    const stock = Number.isFinite(stockNum) ? stockNum : 0
    const statusValue = sanitizeSqlString(String(body?.status ?? "").trim())
    const status = statusValue || (stock <= 0 ? "stokta yok" : stock <= 10 ? "dusuk stok" : "mevcut")
    const categoryIdRaw = Number(body?.categoryId)
    const categoryId = Number.isFinite(categoryIdRaw) && categoryIdRaw > 0 ? categoryIdRaw : 1
    const isAvailable = body?.isAvailable === false ? 0 : 1

    const insertSql = `INSERT INTO menu_items (categoryId, name, description, price, cost, stock1, status, isAvailable, imageUrl, preparationTimeMinutes, createdAt, updatedAt) VALUES (${categoryId}, '${name}', ${description ? `'${description}'` : "NULL"}, ${price}, ${cost}, ${stock}, '${status}', ${isAvailable}, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    await sqlToken(token, insertSql)

    // Some environments apply defaults during insert; force-write editable fields right after insert.
    const updateSql = `UPDATE menu_items SET cost=${cost}, stock1=${stock}, status='${status}', updatedAt=CURRENT_TIMESTAMP WHERE name='${name}' AND categoryId=${categoryId}`
    await sqlToken(token, updateSql)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Urun ekleme istegi basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

