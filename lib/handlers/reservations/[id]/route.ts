import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { sqlToken } from "@/lib/services/locofabric-database"
import { normalizeReservationRow } from "@/lib/reservations-db"
import { apiJson } from "@/lib/api-response"
import { getBusinessUserIdFromBody, requireBusinessUserId, sqlBusinessUserIdRef } from "@/lib/business-scope"
import { sanitizeSqlString } from "@/lib/sql-sanitize"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const idNum = Number(id)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return apiJson({ ok: false, message: "Gecersiz randevu id." }, 400)
    }

    const token = appConfig.token.salon_reservations
    if (!token) {
      return apiJson({ ok: false, message: "salon_reservations token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | { businessUserId?: string | number; status?: string }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const status = sanitizeSqlString(String(body?.status ?? "").trim().toLowerCase())
    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return apiJson({ ok: false, message: "Gecersiz durum." }, 400)
    }

    const businessId = sqlBusinessUserIdRef(businessUserId)
    await sqlToken(
      token,
      `UPDATE salon_reservations SET status='${status}', updated_at=CURRENT_TIMESTAMP WHERE id=${idNum} AND business_user_id=${businessId}`,
    )

    const row = normalizeReservationRow({
      id: idNum,
      business_user_id: businessUserId,
      status,
    })

    return apiJson({ ok: true, row })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({
      ok: false,
      message: "Randevu guncellenemedi.",
      error: axiosErr?.message ?? String(err),
    }, 502)
  }
}
