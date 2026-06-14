/**
 * Tarayicidaki localStorage hizmet asamalarini veritabanina aktarir (tek seferlik).
 *
 * Kullanim:
 * 1. scripts/migrate-kuafor-reservations.sql calistirin
 * 2. LOCOFABRIC_TOKEN_RESERVATIONS ve business_service_settings token tanimlayin
 * 3. Asagidaki STAGES_JSON ortam degiskenine JSON yapistirin veya stages-export.json dosyasi kullanin
 *
 * node scripts/migrate-local-stages-to-db.mjs
 */

import fs from "node:fs"
import path from "node:path"

const BUSINESS_USER_ID = process.env.BUSINESS_USER_ID ?? "11"
const SETTINGS_TOKEN = process.env.LOCOFABRIC_TOKEN_CONTENT ?? ""
const SERVER_URL = process.env.LOCOFABRIC_SERVER_URL ?? "https://server.hstplanet.com"

function sqlEscape(value) {
  return String(value ?? "").replace(/'/g, "''")
}

function sqlJsonLiteral(value) {
  const json = JSON.stringify(value ?? null)
  return `'${json.replace(/'/g, "''")}'`
}

async function sqlToken(token, sql) {
  const res = await fetch(`${SERVER_URL}/api/Database/SQLToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, sql }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(JSON.stringify(data))
  }
  return data
}

async function selectByToken(token) {
  const res = await fetch(`${SERVER_URL}/api/Database/Select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(JSON.stringify(data))
  }
  return Array.isArray(data?.data) ? data.data : Array.isArray(data?.Data) ? data.Data : Array.isArray(data) ? data : []
}

function loadStagesMap() {
  const fromEnv = process.env.STAGES_JSON
  if (fromEnv) {
    return JSON.parse(fromEnv)
  }
  const filePath = path.join(process.cwd(), "stages-export.json")
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  }
  console.log("STAGES_JSON veya stages-export.json bulunamadi.")
  return {}
}

async function main() {
  if (!SETTINGS_TOKEN) {
    console.error("LOCOFABRIC_TOKEN_CONTENT gerekli")
    process.exit(1)
  }

  const stagesMap = loadStagesMap()
  const entries = Object.entries(stagesMap)
  if (entries.length === 0) {
    console.log("Aktarilacak asama yok.")
    return
  }

  const settingsRows = await selectByToken(SETTINGS_TOKEN)
  let updated = 0

  for (const [serviceId, stages] of entries) {
    const existing = settingsRows.find(
      (row) =>
        String(row.business_user_id ?? row.businessUserId ?? "").trim() === String(BUSINESS_USER_ID) &&
        String(row.service_id ?? row.serviceId ?? "").trim() === String(serviceId),
    )

    const stagesJson = sqlJsonLiteral(stages)

    if (existing?.id ?? existing?.ID) {
      const id = Number(existing.id ?? existing.ID)
      await sqlToken(
        SETTINGS_TOKEN,
        `UPDATE business_service_settings SET stages_json=${stagesJson}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`,
      )
    } else {
      await sqlToken(
        SETTINGS_TOKEN,
        `INSERT INTO business_service_settings (business_user_id, service_id, service_name, price, is_active, stages_json, created_at, updated_at) VALUES (${BUSINESS_USER_ID}, ${Number(serviceId)}, 'Hizmet ${sqlEscape(serviceId)}', 0, 1, ${stagesJson}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      )
    }
    updated += 1
  }

  console.log(`Aktarildi: ${updated} hizmet asamasi`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
