import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import {
  groupSessionOperationItemsByOperationId,
  normalizeSessionOperationRows,
  resolveSessionOperationId,
  serializeServiceNames,
  type SessionOperationItemRow,
  type SessionOperationRow,
} from "@/lib/session-operations"
import { apiJson } from "@/lib/api-response"
import { getBusinessUserIdFromBody, getBusinessUserIdFromRequest, matchesBusinessUserId, requireBusinessUserId } from "@/lib/business-scope"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

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
  return []
}

function toSqlTimestamp(value: number | string | undefined) {
  const date = new Date(value ?? Date.now())
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function sqlNullableString(value: string | null | undefined) {
  const normalized = String(value ?? "").trim()
  return normalized ? `'${sanitizeSqlString(normalized)}'` : "NULL"
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const businessUserId = getBusinessUserIdFromRequest(req)
    const staffId = url.searchParams.get("staffId")?.trim() ?? ""
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const operationsToken = appConfig.token.session_operations
    const itemsToken = appConfig.token.session_operation_items
    if (!operationsToken) {
      return apiJson({ ok: false, message: "session_operations token tanimli degil." }, 500)
    }
    if (!itemsToken) {
      return apiJson({ ok: false, message: "session_operation_items token tanimli degil." }, 500)
    }

    const [operationsData, itemsData] = await Promise.all([
      selectByToken<unknown>(operationsToken),
      selectByToken<unknown>(itemsToken),
    ])
    const itemsByOperationId = groupSessionOperationItemsByOperationId(
      extractRows<SessionOperationItemRow>(itemsData)
    )
    const rows = normalizeSessionOperationRows(
      extractRows<SessionOperationRow>(operationsData).filter((row) => matchesBusinessUserId(row, businessUserId)),
      itemsByOperationId
    ).filter((row) => !staffId || row.staffId === staffId)

    return apiJson({ ok: true, rows })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
        ok: false,
        message: "Islemler getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}

export async function POST(req: Request) {
  try {
    const operationsToken = appConfig.token.session_operations
    const itemsToken = appConfig.token.session_operation_items
    if (!operationsToken) {
      return apiJson({ ok: false, message: "session_operations token tanimli degil." }, 500)
    }
    if (!itemsToken) {
      return apiJson({ ok: false, message: "session_operation_items token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | {
          workspaceId?: number | string
          businessUserId?: string | number
          workspaceName?: string
          customerName?: string
          customerSurname?: string
          services?: string[]
          serviceItems?: Array<{ name?: string; price?: number | string }>
          staffId?: string
          staffName?: string
          notes?: string
          photo?: string | null
          shareOnInstagram?: boolean
          shareOnWebsite?: boolean
          startedAt?: number | string
          endedAt?: number | string
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const customerNameRaw = String(body?.customerName ?? "").trim()
    const customerSurnameRaw = String(body?.customerSurname ?? "").trim()
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

    const serviceItems = Array.isArray(body?.serviceItems)
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
        : []

    if (serviceItems.length === 0) {
      return apiJson({ ok: false, message: "En az bir hizmet zorunlu." }, 400)
    }

    for (const item of serviceItems) {
      if (!Number.isFinite(item.price) || item.price < 0) {
        return apiJson({ ok: false, message: "Gecersiz hizmet fiyati." }, 400)
      }
    }

    const customerName = sanitizeSqlString(customerNameRaw)
    const customerSurname = sanitizeSqlString(customerSurnameRaw)
    const workspaceName = sanitizeSqlString(workspaceNameRaw)
    const staffId = sanitizeSqlString(staffIdRaw)
    const staffName = sanitizeSqlString(staffNameRaw)
    const workspaceIdRaw = Number(body?.workspaceId)
    const workspaceId = Number.isFinite(workspaceIdRaw) && workspaceIdRaw > 0 ? workspaceIdRaw : null
    const servicesValue = sanitizeSqlString(serializeServiceNames(serviceItems))
    const notesValue = sqlNullableString(String(body?.notes ?? "").trim())
    const photoValue = sqlNullableString(body?.photo ?? null)
    const shareOnInstagram = body?.shareOnInstagram ? 1 : 0
    const shareOnWebsite = body?.shareOnWebsite ? 1 : 0
    const startedAt = toSqlTimestamp(body?.startedAt)
    const endedAt = toSqlTimestamp(body?.endedAt ?? Date.now())

    if (!startedAt || !endedAt) {
      return apiJson({ ok: false, message: "Gecersiz seans zamani." }, 400)
    }

    const insertSql = `INSERT INTO session_operations (business_user_id, workspace_id, workspace_name, customer_name, customer_surname, services, staff_id, staff_name, notes, photo, share_on_instagram, share_on_website, started_at, ended_at, createdAt, updatedAt) VALUES (${businessUserId}, ${workspaceId ?? "NULL"}, '${workspaceName}', '${customerName}', '${customerSurname}', '${servicesValue}', '${staffId}', '${staffName}', ${notesValue}, ${photoValue}, ${shareOnInstagram}, ${shareOnWebsite}, '${startedAt}', '${endedAt}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    await sqlToken(operationsToken, insertSql)

    const refreshedOperations = await selectByToken<unknown>(operationsToken)
    const sessionOperationId = resolveSessionOperationId(extractRows<SessionOperationRow>(refreshedOperations).filter((row) => matchesBusinessUserId(row, businessUserId)), {
      customerName: customerNameRaw,
      customerSurname: customerSurnameRaw,
      workspaceName: workspaceNameRaw,
      staffId: staffIdRaw,
      startedAt,
      endedAt,
    })

    if (!sessionOperationId) {
      return apiJson({ ok: false, message: "Islem kaydi olusturuldu ancak satirlar baglanamadi." }, 502)
    }

    for (const item of serviceItems) {
      const serviceName = sanitizeSqlString(item.name)
      const itemSql = `INSERT INTO session_operation_items (business_user_id, session_operation_id, service_name, price, createdAt, updatedAt) VALUES (${businessUserId}, ${sessionOperationId}, '${serviceName}', ${item.price}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      await sqlToken(itemsToken, itemSql)
    }

    return apiJson({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
        ok: false,
        message: "Islem kaydi olusturulamadi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}
