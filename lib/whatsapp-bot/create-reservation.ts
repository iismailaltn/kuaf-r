import { appConfig } from "@/app.config"
import { sqlBusinessUserIdRef } from "@/lib/business-scope"
import { buildReservationTimeline } from "@/lib/reservation-scheduling"
import {
  compactStaffBusyBlocksForSql,
  compactStagesForSql,
} from "@/lib/reservation-sql-payload"
import { sanitizeSqlString, sqlJsonLiteralForInsert, sqlNullableString, sqlReservationDateLiteral } from "@/lib/sql-sanitize"
import type { WhatsAppDraft } from "@/lib/whatsapp-bot/types"
import { sqlToken } from "@/lib/whatsapp-bot/locofabric-server"

function getInsertId(data: unknown) {
  const newId = Number((data as { newId?: number | string })?.newId)
  if (Number.isFinite(newId) && newId > 0) {
    return newId
  }
  const row = (data as { data?: { id?: number } })?.data
  const rowId = Number(row?.id)
  return Number.isFinite(rowId) && rowId > 0 ? rowId : 0
}

function sqlStaffIdRef(staffId: string) {
  return `'${sanitizeSqlString(String(staffId).trim())}'`
}

export async function createWhatsAppReservation(
  businessUserId: string,
  draft: WhatsAppDraft,
): Promise<{ ok: true; id: number } | { ok: false; message: string }> {
  const token = appConfig.token.salon_reservations
  if (!token) {
    return { ok: false, message: "salon_reservations token tanimli degil." }
  }

  const timeline = buildReservationTimeline(draft.startTime, draft.stages, draft.staffBusyBlocks)

  if (!timeline) {
    return { ok: false, message: "Gecersiz randevu zamani." }
  }

  const businessId = sqlBusinessUserIdRef(businessUserId)
  const staffIdSql = sqlStaffIdRef(draft.staffId)
  const stages = compactStagesForSql(draft.stages)
  const staffBusyBlocks = compactStaffBusyBlocksForSql(draft.staffBusyBlocks)

  const insertSql = `INSERT INTO salon_reservations (business_user_id, reservation_date, start_time, end_time, customer_name, customer_surname, phone, staff_id, staff_name, service_ids_json, service_names_json, notes, source, status, total_minutes, stages_json, staff_busy_blocks_json, created_at, updated_at) VALUES (${businessId}, ${sqlReservationDateLiteral(draft.date)}, '${sanitizeSqlString(draft.startTime)}', '${sanitizeSqlString(timeline.endTime)}', '${sanitizeSqlString(draft.customerName)}', '${sanitizeSqlString(draft.customerSurname)}', '${sanitizeSqlString(draft.phone)}', ${staffIdSql}, '${sanitizeSqlString(draft.staffName)}', ${sqlJsonLiteralForInsert(draft.serviceIds)}, ${sqlJsonLiteralForInsert(draft.serviceNames)}, ${sqlNullableString("WhatsApp bot")}, 'whatsapp', 'confirmed', ${draft.totalMinutes}, ${sqlJsonLiteralForInsert(stages)}, ${sqlJsonLiteralForInsert(staffBusyBlocks)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`

  try {
    const result = await sqlToken<unknown>(token, insertSql)
    const id = getInsertId(result)
    if (id <= 0) {
      return { ok: false, message: "Randevu kaydi olusturulamadi." }
    }
    return { ok: true, id }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Randevu kaydi basarisiz." }
  }
}
