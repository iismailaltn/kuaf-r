import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { sqlToken } from "@/lib/services/locofabric-database"
import {
  dedupeServiceItems,
  resolveSessionOperationId,
  serializeServiceEntries,
  type SessionOperationRow,
} from "@/lib/session-operations"
import {
  fetchActiveSessionOperations,
  fetchLatestSessionOperationId,
  fetchSessionOperationsForIdResolve,
  fetchSessionOperationsPage,
  type SessionOperationsPeriod,
} from "@/lib/session-operations-query"
import { apiJson } from "@/lib/api-response"
import {
  getBusinessUserIdFromBody,
  getBusinessUserIdFromRequest,
  matchesBusinessUserId,
  requireBusinessUserId,
  sqlBusinessUserIdRef,
} from "@/lib/business-scope"
import { sanitizeSqlString, sqlNullableString } from "@/lib/sql-sanitize"

function extractRows<T>(data: unknown) {
  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: T[] }).data
  }
  if (Array.isArray((data as { Data?: unknown })?.Data)) {
    return (data as { Data: T[] }).Data
  }
  if (Array.isArray(data)) {
    return data as T[]
  }
  const single = (data as { data?: T })?.data ?? (data as { Data?: T })?.Data
  if (single && typeof single === "object" && !Array.isArray(single)) {
    return [single]
  }
  return []
}

function getInsertId(data: unknown) {
  const record = data as {
    newId?: number | string
    data?: { id?: number | string; ID?: number | string }
  }
  const newId = Number(record?.newId)
  if (Number.isFinite(newId) && newId > 0) {
    return newId
  }
  const nestedId = Number(record?.data?.id ?? record?.data?.ID)
  if (Number.isFinite(nestedId) && nestedId > 0) {
    return nestedId
  }
  const row = extractRows<Record<string, unknown>>(data)[0]
  const rowId = Number(row?.id ?? row?.ID)
  return Number.isFinite(rowId) && rowId > 0 ? rowId : 0
}

function extractUpstreamMessage(data: unknown) {
  if (typeof data === "string") {
    return data.trim() || null
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>
    const message = String(record.error ?? record.message ?? "").trim()
    return message || null
  }

  return null
}

function toSqlTimestamp(value: number | string | undefined) {
  const date = new Date(value ?? Date.now())
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function parsePeriod(value: string | null): SessionOperationsPeriod {
  if (value === "7d" || value === "30d" || value === "365d" || value === "all") {
    return value
  }
  return "all"
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const businessUserId = getBusinessUserIdFromRequest(req)
    const staffId = url.searchParams.get("staffId")?.trim() ?? ""
    const activeOnly = url.searchParams.get("activeOnly") === "true"
    const workspaceId = Number(url.searchParams.get("workspaceId") ?? "")
    const page = Number(url.searchParams.get("page") ?? "1")
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20")
    const period = parsePeriod(url.searchParams.get("period"))
    const workspaceName = url.searchParams.get("workspaceName")?.trim() ?? ""
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const operationsToken = appConfig.token.session_operations
    if (!operationsToken) {
      return apiJson({ ok: false, message: "session_operations token tanimli degil." }, 500)
    }

    const listQuery = {
      businessUserId,
      staffId: staffId || undefined,
      workspaceId: Number.isFinite(workspaceId) && workspaceId > 0 ? workspaceId : undefined,
      workspaceName: workspaceName || undefined,
      period,
      page,
      pageSize,
    }

    if (activeOnly) {
      const rows = await fetchActiveSessionOperations(operationsToken, listQuery)
      return apiJson({ ok: true, rows })
    }

    const result = await fetchSessionOperationsPage(operationsToken, listQuery)
    return apiJson({
      ok: true,
      rows: result.rows,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      workspaceStats: result.workspaceStats,
      period,
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
        ok: false,
        message: extractUpstreamMessage(data) ?? "Islemler getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, typeof status === "number" ? status : 502)
  }
}

export async function POST(req: Request) {
  try {
    const operationsToken = appConfig.token.session_operations
    if (!operationsToken) {
      return apiJson({ ok: false, message: "session_operations token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | {
          phase?: "start" | "complete"
          workspaceId?: number | string
          businessUserId?: string | number
          workspaceName?: string
          customerName?: string
          customerSurname?: string
          customerPhone?: string
          services?: string[]
          serviceItems?: Array<{ name?: string; price?: number | string }>
          staffId?: string
          staffName?: string
          notes?: string
          photo?: string | null
          photo2?: string | null
          photo3?: string | null
          shareOnInstagram?: boolean
          shareOnWebsite?: boolean
          startedAt?: number | string
          endedAt?: number | string
        }
      | null

    const phase = body?.phase === "start" ? "start" : "complete"

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const customerNameRaw = String(body?.customerName ?? "").trim()
    const customerSurnameRaw = String(body?.customerSurname ?? "").trim()
    const customerPhoneRaw = String(body?.customerPhone ?? "").trim()
    const workspaceNameRaw = String(body?.workspaceName ?? "").trim()
    const staffIdRaw = String(body?.staffId ?? "").trim()
    const staffNameRaw = String(body?.staffName ?? "").trim()

    if (!customerNameRaw || !customerSurnameRaw) {
      return apiJson({ ok: false, message: "Musteri adi ve soyadi zorunlu." }, 400)
    }
    if (!workspaceNameRaw) {
      return apiJson({ ok: false, message: "Calisma alani adi zorunlu." }, 400)
    }
    if (!staffIdRaw || !staffNameRaw) {
      return apiJson({ ok: false, message: "Personel bilgisi zorunlu." }, 400)
    }

    const serviceItems = dedupeServiceItems(
      Array.isArray(body?.serviceItems)
        ? body.serviceItems
            .map((item) => ({
              name: String(item?.name ?? "").trim(),
              price: Number(item?.price),
            }))
            .filter((item) => item.name)
        : Array.isArray(body?.services)
          ? body.services
              .map((item) => ({
                name: String(item).trim(),
                price: 0,
              }))
              .filter((item) => item.name)
          : [],
    )

    if (serviceItems.length === 0) {
      return apiJson({ ok: false, message: "En az bir hizmet zorunlu." }, 400)
    }

    for (const item of serviceItems) {
      if (!Number.isFinite(item.price) || item.price < 0) {
        return apiJson({ ok: false, message: "Gecersiz hizmet fiyati." }, 400)
      }
    }

    const businessUserIdRef = sqlBusinessUserIdRef(businessUserId)
    const customerName = sanitizeSqlString(customerNameRaw)
    const customerSurname = sanitizeSqlString(customerSurnameRaw)
    const customerPhone = sqlNullableString(customerPhoneRaw)
    const workspaceName = sanitizeSqlString(workspaceNameRaw)
    const staffId = sanitizeSqlString(staffIdRaw)
    const staffName = sanitizeSqlString(staffNameRaw)
    const workspaceIdRaw = Number(body?.workspaceId)
    const workspaceId = Number.isFinite(workspaceIdRaw) && workspaceIdRaw > 0 ? workspaceIdRaw : null
    const servicesValue = sanitizeSqlString(serializeServiceEntries(serviceItems))
    const notesValue = sqlNullableString(String(body?.notes ?? "").trim())
    const photoValue = sqlNullableString(body?.photo ?? null)
    const photo2Value = sqlNullableString(body?.photo2 ?? null)
    const photo3Value = sqlNullableString(body?.photo3 ?? null)
    const shareOnInstagram = body?.shareOnInstagram ? 1 : 0
    const shareOnWebsite = body?.shareOnWebsite ? 1 : 0
    const startedAt = toSqlTimestamp(body?.startedAt)
    if (!startedAt) {
      return apiJson({ ok: false, message: "Gecersiz seans baslangic zamani." }, 400)
    }

    const endedAt =
      phase === "start" ? null : toSqlTimestamp(body?.endedAt ?? Date.now())
    if (phase === "complete" && !endedAt) {
      return apiJson({ ok: false, message: "Gecersiz seans bitis zamani." }, 400)
    }

    const endedAtValue = endedAt ? `'${endedAt}'` : "NULL"
    const insertSql = `INSERT INTO session_operations (business_user_id, workspace_id, workspace_name, customer_name, customer_surname, customer_phone, services, staff_id, staff_name, notes, photo, photo2, photo3, share_on_instagram, share_on_website, started_at, ended_at, createdAt, updatedAt) VALUES (${businessUserIdRef}, ${workspaceId ?? "NULL"}, '${workspaceName}', '${customerName}', '${customerSurname}', ${customerPhone}, '${servicesValue}', '${staffId}', '${staffName}', ${notesValue}, ${photoValue}, ${photo2Value}, ${photo3Value}, ${shareOnInstagram}, ${shareOnWebsite}, '${startedAt}', ${endedAtValue}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    const insertResult = await sqlToken<unknown>(operationsToken, insertSql)

    let sessionOperationId = getInsertId(insertResult)
    if (!sessionOperationId) {
      sessionOperationId =
        (await fetchLatestSessionOperationId(operationsToken, businessUserId)) ?? 0
    }
    if (!sessionOperationId) {
      const resolveRows = await fetchSessionOperationsForIdResolve(
        operationsToken,
        businessUserId,
      )
      sessionOperationId =
        resolveSessionOperationId(
          resolveRows.filter((row) => matchesBusinessUserId(row, businessUserId)),
          {
            customerName: customerNameRaw,
            customerSurname: customerSurnameRaw,
            workspaceName: workspaceNameRaw,
            staffId: staffIdRaw,
            startedAt,
            endedAt,
          },
        ) ?? 0
    }

    if (!sessionOperationId) {
      return apiJson({ ok: false, message: "Seans kaydi olusturuldu ancak id bulunamadi." }, 502)
    }

    return apiJson({ ok: true, sessionOperationId })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
        ok: false,
        message: extractUpstreamMessage(data) ?? "Islem kaydi olusturulamadi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, typeof status === "number" ? status : 502)
  }
}

