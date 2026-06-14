import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { getBusinessUserIdFromBody, requireBusinessUserId, sqlBusinessUserIdRef } from "@/lib/business-scope"
import { fetchSessionOperationById } from "@/lib/session-operations-query"
import { dedupeServiceItems, serializeServiceEntries } from "@/lib/session-operations"
import { getSqlTokenError, isSqlTokenSuccess, sqlToken, sqlTokenChecked } from "@/lib/services/locofabric-database"
import { apiJson } from "@/lib/api-response"
import { sanitizeSqlString, sqlNullableString } from "@/lib/sql-sanitize"

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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const operationId = Number(id)
    if (!Number.isFinite(operationId) || operationId <= 0) {
      return apiJson({ ok: false, message: "Gecersiz seans id." }, 400)
    }

    const operationsToken = appConfig.token.session_operations
    if (!operationsToken) {
      return apiJson({ ok: false, message: "session_operations token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | {
          businessUserId?: string | number
          endedAt?: number | string
          serviceItems?: Array<{ name?: string; price?: number | string }>
          notes?: string
          photo?: string | null
          photo2?: string | null
          photo3?: string | null
          shareOnInstagram?: boolean
          shareOnWebsite?: boolean
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const serviceItems = dedupeServiceItems(
      Array.isArray(body?.serviceItems)
        ? body.serviceItems
            .map((item) => ({
              name: String(item?.name ?? "").trim(),
              price: Number(item?.price),
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

    const endedAt = toSqlTimestamp(body?.endedAt ?? Date.now())
    if (!endedAt) {
      return apiJson({ ok: false, message: "Gecersiz seans bitis zamani." }, 400)
    }

    const businessUserIdRef = sqlBusinessUserIdRef(businessUserId)
    const servicesValue = sanitizeSqlString(serializeServiceEntries(serviceItems))
    const notesValue = sqlNullableString(String(body?.notes ?? "").trim())
    const photoValue = sqlNullableString(body?.photo ?? null)
    const photo2Value = sqlNullableString(body?.photo2 ?? null)
    const photo3Value = sqlNullableString(body?.photo3 ?? null)
    const shareOnInstagram = body?.shareOnInstagram ? 1 : 0
    const shareOnWebsite = body?.shareOnWebsite ? 1 : 0
    const updateSet = `services='${servicesValue}', notes=${notesValue}, photo=${photoValue}, photo2=${photo2Value}, photo3=${photo3Value}, share_on_instagram=${shareOnInstagram}, share_on_website=${shareOnWebsite}, ended_at='${endedAt}', updatedAt=CURRENT_TIMESTAMP`
    const updateScoped = `UPDATE session_operations SET ${updateSet} WHERE id=${operationId} AND business_user_id=${businessUserIdRef}`
    const updateById = `UPDATE session_operations SET ${updateSet} WHERE id=${operationId}`

    let updateData: unknown
    try {
      updateData = await sqlTokenChecked(operationsToken, updateScoped)
    } catch {
      updateData = await sqlToken(operationsToken, updateById)
      const updateError = getSqlTokenError(updateData)
      if (updateError || !isSqlTokenSuccess(updateData)) {
        return apiJson(
          {
            ok: false,
            message: updateError ?? "Seans kaydi guncellenemedi.",
            sessionOperationId: operationId,
          },
          404,
        )
      }
    }

    const verified = await fetchSessionOperationById(
      operationsToken,
      operationId,
      businessUserId,
    )
    if (verified) {
      return apiJson({ ok: true, sessionOperationId: operationId, updated: true })
    }

    if (isSqlTokenSuccess(updateData)) {
      return apiJson({ ok: true, sessionOperationId: operationId, updated: true })
    }

    return apiJson({ ok: false, message: "Seans kaydi guncellenemedi." }, 502)
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
        ok: false,
        message: extractUpstreamMessage(data) ?? "Seans guncellenemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, typeof status === "number" ? status : 502)
  }
}
