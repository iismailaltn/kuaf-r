import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import type { AxiosError } from "axios"
import { getBusinessUserIdFromBody, getBusinessUserIdFromRequest, requireBusinessUserId, sqlBusinessUserIdRef } from "@/lib/business-scope"
import { apiJson } from "@/lib/api-response"

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const token = appConfig.token.whatsapp_settings
    if (!token) {
      return apiJson({ ok: false, message: "whatsapp_settings token tanimli degil." }, 500)
    }

    const data = await selectByToken<any>(token)
    const rows =
      Array.isArray((data as any)?.data) ? (data as any).data :
      Array.isArray((data as any)?.Data) ? (data as any).Data :
      Array.isArray(data) ? data :
      []

    const settings = rows.find((row: any) => row.business_user_id == businessUserId)
    if (settings) {
      return apiJson({
        ok: true,
        settings: {
          phoneNumber: settings.phone_number || "",
          phoneNumberId: settings.phone_number_id || "",
          whatsappBusinessAccountId: settings.whatsapp_business_account_id || "",
          accessToken: settings.access_token || "",
          isActive: settings.is_active === 1 || settings.is_active === true,
        },
      })
    }

    return apiJson({ ok: true, settings: null })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({
      ok: false,
      message: "WhatsApp ayarlari getirilemedi.",
      error: axiosErr?.message ?? String(err),
    }, 502)
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          businessUserId?: string | number
          phoneNumber?: string
          phoneNumberId?: string
          whatsappBusinessAccountId?: string
          accessToken?: string
          isActive?: boolean
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const token = appConfig.token.whatsapp_settings
    if (!token) {
      return apiJson({ ok: false, message: "whatsapp_settings token tanimli degil." }, 500)
    }

    const phoneNumber = String(body?.phoneNumber ?? "").trim()
    const phoneNumberId = String(body?.phoneNumberId ?? "").trim()
    const whatsappBusinessAccountId = String(body?.whatsappBusinessAccountId ?? "").trim()
    const accessToken = String(body?.accessToken ?? "").trim()
    const isActive = body?.isActive === false ? 0 : 1

    if (!phoneNumber || !phoneNumberId || !accessToken) {
      return apiJson({ ok: false, message: "Telefon numarasi, Phone Number ID ve Access Token zorunlu." }, 400)
    }

    const businessId = sqlBusinessUserIdRef(businessUserId)

    // Check if settings exist
    const existingData = await selectByToken<any>(token)
    const existingRows =
      Array.isArray((existingData as any)?.data) ? (existingData as any).data :
      Array.isArray((existingData as any)?.Data) ? (existingData as any).Data :
      Array.isArray(existingData) ? existingData :
      []

    const existing = existingRows.find((row: any) => row.business_user_id == businessUserId)

    if (existing) {
      // Update existing
      await sqlToken(
        token,
        `UPDATE whatsapp_settings SET phone_number='${phoneNumber}', phone_number_id='${phoneNumberId}', whatsapp_business_account_id='${whatsappBusinessAccountId}', access_token='${accessToken}', is_active=${isActive}, updated_at=CURRENT_TIMESTAMP WHERE business_user_id=${businessId}`
      )
    } else {
      // Insert new
      await sqlToken(
        token,
        `INSERT INTO whatsapp_settings (business_user_id, phone_number, phone_number_id, whatsapp_business_account_id, access_token, is_active, created_at, updated_at) VALUES (${businessId}, '${phoneNumber}', '${phoneNumberId}', '${whatsappBusinessAccountId}', '${accessToken}', ${isActive}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
    }

    return apiJson({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({
      ok: false,
      message: "WhatsApp ayarlari kaydedilemedi.",
      error: axiosErr?.message ?? String(err),
    }, 502)
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { businessUserId?: string | number }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const token = appConfig.token.whatsapp_settings
    if (!token) {
      return apiJson({ ok: false, message: "whatsapp_settings token tanimli degil." }, 500)
    }

    const businessId = sqlBusinessUserIdRef(businessUserId)

    await sqlToken(
      token,
      `DELETE FROM whatsapp_settings WHERE business_user_id=${businessId}`
    )

    return apiJson({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({
      ok: false,
      message: "WhatsApp baglantisi kesilemedi.",
      error: axiosErr?.message ?? String(err),
    }, 502)
  }
}
