import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import { getBusinessUserIdFromBody, requireBusinessUserId } from "@/lib/business-scope"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

function extractRows(data: any): any[] {
  return Array.isArray((data as any)?.data) ? (data as any).data :
    Array.isArray((data as any)?.Data) ? (data as any).Data :
    Array.isArray(data) ? data :
    []
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const idNum = Number(id)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, message: "Gecersiz hizmet id." }, { status: 400 })
    }

    const masterToken = appConfig.token.salonservis
    const settingsToken = appConfig.token.business_service_settings
    if (!masterToken) {
      return NextResponse.json({ ok: false, message: "salonservis token tanimli degil." }, { status: 500 })
    }
    if (!settingsToken) {
      return NextResponse.json({ ok: false, message: "business_service_settings token tanimli degil." }, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as
      | {
          name?: string
          description?: string | null
          category?: string
          durationMinutes?: number | string
          price?: number | string
          isActive?: boolean
          businessUserId?: string | number
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return NextResponse.json({ ok: false, message: businessError }, { status: 400 })
    }

    const price = Number(body?.price ?? 0)
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ ok: false, message: "Gecersiz fiyat." }, { status: 400 })
    }
    const isActive = body?.isActive === false ? 0 : 1

    const masterData = await selectByToken<any>(masterToken)
    const masterRows = extractRows(masterData)
    const masterService = masterRows.find((row) => String(row.id ?? row.ID ?? "").trim() === String(idNum))
    const serviceName = sanitizeSqlString(String(masterService?.name ?? body?.name ?? "").trim())
    if (!serviceName) {
      return NextResponse.json({ ok: false, message: "Hizmet bulunamadi." }, { status: 404 })
    }

    const settingsData = await selectByToken<any>(settingsToken)
    const existing = extractRows(settingsData).find((row) => {
      const rowBusinessUserId = String(row.business_user_id ?? row.businessUserId ?? "").trim()
      const serviceId = String(row.service_id ?? row.serviceId ?? "").trim()
      return rowBusinessUserId === businessUserId && serviceId === String(idNum)
    })

    if (existing?.id ?? existing?.ID) {
      const existingId = Number(existing.id ?? existing.ID)
      await sqlToken(
        settingsToken,
        `UPDATE business_service_settings SET service_name='${serviceName}', price=${price}, is_active=${isActive}, updated_at=CURRENT_TIMESTAMP WHERE id=${existingId}`
      )
    } else {
      await sqlToken(
        settingsToken,
        `INSERT INTO business_service_settings (business_user_id, service_id, service_name, price, is_active, created_at, updated_at) VALUES (${businessUserId}, ${idNum}, '${serviceName}', ${price}, ${isActive}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Salon hizmeti guncellenemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}
