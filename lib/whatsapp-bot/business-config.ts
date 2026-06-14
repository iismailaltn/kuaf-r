import type { BusinessWhatsAppConfig, WhatsAppLocale } from "@/lib/whatsapp-bot/types"
import { extractRows, selectByToken, sqlToken } from "@/lib/whatsapp-bot/locofabric-server"

function parseEnvBusinessMap(): BusinessWhatsAppConfig[] {
  const raw = process.env.WHATSAPP_BUSINESS_MAP?.trim()
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as BusinessWhatsAppConfig[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const envMap = parseEnvBusinessMap()

export function resolveBusinessByPhoneNumberId(phoneNumberId: string): BusinessWhatsAppConfig | null {
  const id = String(phoneNumberId ?? "").trim()
  if (!id) {
    return null
  }

  const fromEnv = envMap.find((row) => String(row.phoneNumberId).trim() === id)
  if (fromEnv) {
    return fromEnv
  }

  return null
}

export async function resolveBusinessByPhoneNumberIdAsync(
  phoneNumberId: string,
): Promise<BusinessWhatsAppConfig | null> {
  const fromEnv = resolveBusinessByPhoneNumberId(phoneNumberId)
  if (fromEnv) {
    return fromEnv
  }

  const token = process.env.LOCOFABRIC_TOKEN_WHATSAPP ?? process.env.LOCOFABRIC_TOKEN_COMPANY ?? ""
  if (!token) {
    return null
  }

  try {
    const data = await sqlToken<unknown>(
      token,
      `SELECT * FROM whatsapp_business_config WHERE phone_number_id='${String(phoneNumberId).replace(/'/g, "''")}' AND is_active=1`,
    )
    const row = extractRows<Record<string, unknown>>(data)[0]
    if (!row) {
      return null
    }

    return {
      businessUserId: String(row.business_user_id ?? row.businessUserId ?? ""),
      shopName: String(row.shop_name ?? row.shopName ?? "Salon"),
      phoneNumberId: String(row.phone_number_id ?? row.phoneNumberId ?? phoneNumberId),
      defaultLocale: (String(row.default_locale ?? row.defaultLocale ?? "tr") === "en" ? "en" : "tr") as WhatsAppLocale,
    }
  } catch {
    try {
      const data = await selectByToken<unknown>(token)
      const row = extractRows<Record<string, unknown>>(data).find(
        (item) =>
          String(item.phone_number_id ?? item.phoneNumberId ?? "").trim() === phoneNumberId &&
          (item.is_active === 1 || item.is_active === true || item.isActive === true),
      )
      if (!row) {
        return null
      }
      return {
        businessUserId: String(row.business_user_id ?? row.businessUserId ?? ""),
        shopName: String(row.shop_name ?? row.shopName ?? "Salon"),
        phoneNumberId,
        defaultLocale: (String(row.default_locale ?? row.defaultLocale ?? "tr") === "en" ? "en" : "tr") as WhatsAppLocale,
      }
    } catch {
      return null
    }
  }
}
