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

    const token = appConfig.token.kuafor_tables
    if (!token) {
      return apiJson({ ok: false, message: "kuafor_tables token tanimli degil." }, 500)
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
        message: "Calisma alanlari getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          tableNumber?: string
          businessUserId?: string | number
          capacity?: number
          status?: string
          locationDescription?: string
          isReservable?: boolean
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const token = appConfig.token.kuafor_tables
    if (!token) {
      return apiJson({ ok: false, message: "kuafor_tables token tanimli degil." }, 500)
    }

    const tableNumber = sanitizeSqlString(String(body?.tableNumber ?? "").trim())
    if (!tableNumber) {
      return apiJson({ ok: false, message: "tableNumber zorunlu." }, 400)
    }

    const capacity = Number.isFinite(Number(body?.capacity)) ? Number(body?.capacity) : 1
    const status = sanitizeSqlString(String(body?.status ?? "available").trim() || "available")
    const locationDescription = sanitizeSqlString(String(body?.locationDescription ?? "").trim())
    const isReservable = body?.isReservable === false ? 0 : 1

    const businessId = sqlBusinessUserIdRef(businessUserId)
    const sql = `INSERT INTO restaurant_tables (business_user_id, tableNumber, capacity, status, locationDescription, isReservable, createdAt, updatedAt) VALUES (${businessId}, '${tableNumber}', ${capacity}, '${status}', ${locationDescription ? `'${locationDescription}'` : "''"}, ${isReservable}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    await sqlToken(token, sql)

    return apiJson({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return apiJson({
        ok: false,
        message: "Calisma alani ekleme istegi basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}

