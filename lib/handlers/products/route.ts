import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import type { AxiosError } from "axios"
import { getBusinessUserIdFromBody, getBusinessUserIdFromRequest, matchesBusinessUserId, requireBusinessUserId, sqlBusinessUserIdRef } from "@/lib/business-scope"
import { apiJson } from "@/lib/api-response"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const token = appConfig.token.menu_items
    if (!token) {
      return apiJson({ ok: false, message: "Urunler token tanimli degil." }, 500)
    }

    const data = await selectByToken<any>(token)
    const rows =
      Array.isArray((data as any)?.data) ? (data as any).data :
      Array.isArray((data as any)?.Data) ? (data as any).Data :
      Array.isArray(data) ? data :
      []

    return apiJson({ ok: true, rows: rows.filter((row: any) => matchesBusinessUserId(row, businessUserId)) })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return apiJson({
        ok: false,
        message: "Urunler getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}

export async function POST(req: Request) {
  try {
    const token = appConfig.token.menu_items
    if (!token) {
      return apiJson({ ok: false, message: "Urunler token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | {
          businessUserId?: string | number
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

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const name = sanitizeSqlString(String(body?.name ?? "").trim())
    if (!name) {
      return apiJson({ ok: false, message: "Urun adi zorunlu." }, 400)
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

    const businessId = sqlBusinessUserIdRef(businessUserId)
    const insertSql = `INSERT INTO menu_items (business_user_id, categoryId, name, description, price, cost, stock1, status, isAvailable, imageUrl, preparationTimeMinutes, createdAt, updatedAt) VALUES (${businessId}, ${categoryId}, '${name}', ${description ? `'${description}'` : "NULL"}, ${price}, ${cost}, ${stock}, '${status}', ${isAvailable}, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    await sqlToken(token, insertSql)

    // Some environments apply defaults during insert; force-write editable fields right after insert.
    const updateSql = `UPDATE menu_items SET cost=${cost}, stock1=${stock}, status='${status}', updatedAt=CURRENT_TIMESTAMP WHERE name='${name}' AND categoryId=${categoryId} AND business_user_id=${businessId}`
    await sqlToken(token, updateSql)

    return apiJson({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return apiJson({
        ok: false,
        message: "Urun ekleme istegi basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}

