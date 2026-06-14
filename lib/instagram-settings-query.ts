import { appConfig } from "@/app.config"
import {
  normalizeInstagramSettingsRows,
  type InstagramSettings,
  type InstagramSettingsRow,
} from "@/lib/instagram-settings"
import { matchesBusinessUserId } from "@/lib/business-scope"
import { extractRows, selectAllByToken, sqlToken } from "@/lib/services/locofabric-database"

function extractSettingsRows(data: unknown) {
  return extractRows<InstagramSettingsRow>(data)
}

export async function loadInstagramSettingsForBusiness(
  businessUserId: string,
): Promise<InstagramSettings | null> {
  const token = appConfig.token.instagram_settings
  if (!token) {
    return null
  }

  try {
    const data = await sqlToken<unknown>(
      token,
      `SELECT * FROM instagram_settings WHERE business_user_id=${businessUserId}`,
    )
    const rows = extractSettingsRows(data)
    if (rows.length > 0) {
      return normalizeInstagramSettingsRows(rows)[0] ?? null
    }
  } catch {
    // fallback
  }

  const data = await selectAllByToken<unknown>(token, "instagram_settings")
  return (
    normalizeInstagramSettingsRows(
      extractSettingsRows(data).filter((row) => matchesBusinessUserId(row, businessUserId)),
    )[0] ?? null
  )
}
