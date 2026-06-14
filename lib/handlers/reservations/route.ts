import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import {
  normalizeReservationRow,
  normalizeReservationRows,
  type SalonReservationRow,
} from "@/lib/reservations-db"
import { apiJson } from "@/lib/api-response"
import {
  getBusinessUserIdFromBody,
  getBusinessUserIdFromRequest,
  matchesBusinessUserId,
  requireBusinessUserId,
  sqlBusinessUserIdRef,
} from "@/lib/business-scope"
import {
  collectStaffIdAliases,
  fetchPersonelRowsForBusiness,
  reservationMatchesStaffFilter,
  resolveIndividualUserId,
} from "@/lib/personel-directory"
import {
  compactStaffBusyBlocksForSql,
  compactStagesForSql,
} from "@/lib/reservation-sql-payload"
import {
  sanitizeSqlString,
  sqlJsonLiteralForInsert,
  sqlNullableString,
  sqlReservationDateLiteral,
} from "@/lib/sql-sanitize"

function extractRows<T>(data: unknown): T[] {
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
  const newId = Number((data as { newId?: number | string })?.newId)
  if (Number.isFinite(newId) && newId > 0) {
    return newId
  }
  const row = extractRows<Record<string, unknown>>(data)[0]
  const rowId = Number(row?.id ?? row?.ID)
  return Number.isFinite(rowId) && rowId > 0 ? rowId : 0
}

function sqlStaffIdRef(staffId: string) {
  return `'${sanitizeSqlString(String(staffId).trim())}'`
}

function formatUpstreamSqlError(data: unknown) {
  if (typeof data === "string" && data.trim()) {
    return data.trim()
  }
  if (data && typeof data === "object") {
    const row = data as Record<string, unknown>
    const parts = [row.error, row.message, row.sql].filter((v) => typeof v === "string" && v.trim())
    if (parts.length > 0) {
      return parts.join(" — ")
    }
  }
  return ""
}

/** Locofabric SQLToken SELECT bu tabloda kolon adlarini tanımiyor; yalnizca Select API kullanilir. */
async function fetchReservationRows(token: string, businessUserId: string) {
  const data = await selectByToken<unknown>(token)
  return extractRows<SalonReservationRow>(data).filter((row) =>
    matchesBusinessUserId(row, businessUserId),
  )
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const token = appConfig.token.salon_reservations
    if (!token) {
      return apiJson({ ok: false, message: "salon_reservations token tanimli degil." }, 500)
    }

    const individualUserId =
      url.searchParams.get("individualUserId")?.trim() ??
      url.searchParams.get("staffId")?.trim() ??
      ""
    const date = url.searchParams.get("date")?.trim() ?? ""

    let rows = normalizeReservationRows(await fetchReservationRows(token, businessUserId))

    if (individualUserId) {
      const personelRows = await fetchPersonelRowsForBusiness(businessUserId)
      const staffAliases = collectStaffIdAliases(personelRows, individualUserId)
      rows = rows.filter((row) => reservationMatchesStaffFilter(row.staffId, staffAliases))
    }
    if (date) {
      rows = rows.filter((row) => row.date === date)
    }

    return apiJson({ ok: true, rows })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({
      ok: false,
      message: "Randevular getirilemedi.",
      error: axiosErr?.message ?? String(err),
    }, 502)
  }
}

export async function POST(req: Request) {
  try {
    const token = appConfig.token.salon_reservations
    if (!token) {
      return apiJson({ ok: false, message: "salon_reservations token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const date = String(body?.date ?? "").trim()
    const startTime = String(body?.startTime ?? "").trim()
    const endTime = String(body?.endTime ?? startTime).trim()
    const customerName = String(body?.customerName ?? "").trim()
    const customerSurname = String(body?.customerSurname ?? "").trim()
    const phone = String(body?.phone ?? "").trim()
    const staffIdRaw = String(body?.individualUserId ?? body?.staffId ?? "").trim()
    const staffName = String(body?.staffName ?? "").trim()

    if (!date || !startTime || !customerName || !customerSurname || !staffIdRaw) {
      return apiJson({ ok: false, message: "Zorunlu randevu alanlari eksik." }, 400)
    }

    const personelRows = await fetchPersonelRowsForBusiness(businessUserId)
    const staffId = resolveIndividualUserId(personelRows, staffIdRaw) || staffIdRaw

    const businessId = sqlBusinessUserIdRef(businessUserId)
    const staffIdSql = sqlStaffIdRef(staffId)
    const serviceIds = Array.isArray(body?.serviceIds) ? body.serviceIds : []
    const serviceNames = Array.isArray(body?.serviceNames) ? body.serviceNames : []
    const stages = compactStagesForSql(Array.isArray(body?.stages) ? body.stages : [])
    const staffBusyBlocks = compactStaffBusyBlocksForSql(
      Array.isArray(body?.staffBusyBlocks) ? body.staffBusyBlocks : [],
    )
    const totalMinutes = Number(body?.totalMinutes ?? 0) || 0
    const status = sanitizeSqlString(String(body?.status ?? "confirmed"))
    const source = sanitizeSqlString(String(body?.source ?? "manual"))
    const notes = sqlNullableString(String(body?.notes ?? ""))
    const reservationDate = sqlReservationDateLiteral(date)

    const insertSql = `INSERT INTO salon_reservations (business_user_id, reservation_date, start_time, end_time, customer_name, customer_surname, phone, staff_id, staff_name, service_ids_json, service_names_json, notes, source, status, total_minutes, stages_json, staff_busy_blocks_json, created_at, updated_at) VALUES (${businessId}, ${reservationDate}, '${sanitizeSqlString(startTime)}', '${sanitizeSqlString(endTime)}', '${sanitizeSqlString(customerName)}', '${sanitizeSqlString(customerSurname)}', '${sanitizeSqlString(phone)}', ${staffIdSql}, '${sanitizeSqlString(staffName)}', ${sqlJsonLiteralForInsert(serviceIds)}, ${sqlJsonLiteralForInsert(serviceNames)}, ${notes}, '${source}', '${status}', ${totalMinutes}, ${sqlJsonLiteralForInsert(stages)}, ${sqlJsonLiteralForInsert(staffBusyBlocks)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`

    let result: unknown
    try {
      result = await sqlToken<unknown>(token, insertSql)
    } catch (firstErr) {
      const firstData = (firstErr as { response?: { data?: unknown } })?.response?.data
      const insertCoreSql = `INSERT INTO salon_reservations (business_user_id, reservation_date, start_time, end_time, customer_name, customer_surname, phone, staff_id, staff_name, notes, source, status, total_minutes, created_at, updated_at) VALUES (${businessId}, ${reservationDate}, '${sanitizeSqlString(startTime)}', '${sanitizeSqlString(endTime)}', '${sanitizeSqlString(customerName)}', '${sanitizeSqlString(customerSurname)}', '${sanitizeSqlString(phone)}', ${staffIdSql}, '${sanitizeSqlString(staffName)}', ${notes}, '${source}', '${status}', ${totalMinutes}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      try {
        result = await sqlToken<unknown>(token, insertCoreSql)
        const newId = getInsertId(result)
        if (newId <= 0) {
          throw firstErr
        }
        const updateSql = `UPDATE salon_reservations SET service_ids_json=${sqlJsonLiteralForInsert(serviceIds)}, service_names_json=${sqlJsonLiteralForInsert(serviceNames)}, stages_json=${sqlJsonLiteralForInsert(stages)}, staff_busy_blocks_json=${sqlJsonLiteralForInsert(staffBusyBlocks)}, updated_at=CURRENT_TIMESTAMP WHERE id=${newId} AND business_user_id=${businessId}`
        await sqlToken<unknown>(token, updateSql)
      } catch {
        const detail = formatUpstreamSqlError(firstData)
        return apiJson({
          ok: false,
          message: detail
            ? `Randevu kaydedilemedi: ${detail}`
            : "Randevu kaydedilemedi. JSON kolonlari TEXT olmali veya tablo tanimli olmali.",
          upstreamData: firstData,
        }, 502)
      }
    }
    const newId = getInsertId(result)
    if (newId <= 0) {
      return apiJson({ ok: false, message: "Randevu kaydi olusturulamadi." }, 502)
    }

    const row = normalizeReservationRow({
      id: newId,
      business_user_id: businessUserId,
      reservation_date: date,
      start_time: startTime,
      end_time: endTime,
      customer_name: customerName,
      customer_surname: customerSurname,
      phone,
      staff_id: staffId,
      staff_name: staffName,
      service_ids_json: JSON.stringify(serviceIds),
      service_names_json: JSON.stringify(serviceNames),
      notes: String(body?.notes ?? ""),
      source: String(body?.source ?? "manual"),
      status: String(body?.status ?? "confirmed"),
      total_minutes: totalMinutes,
      stages_json: JSON.stringify(stages),
      staff_busy_blocks_json: JSON.stringify(staffBusyBlocks),
    })

    return apiJson({ ok: true, row })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    const detail = formatUpstreamSqlError(data)
    return apiJson({
      ok: false,
      message: detail
        ? `Randevu kaydedilemedi: ${detail}`
        : "Randevu kaydedilemedi. salon_reservations tablosu ve token kontrol edin.",
      error: axiosErr?.message ?? String(err),
      upstreamData: data,
    }, 502)
  }
}
