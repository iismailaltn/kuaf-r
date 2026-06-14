/**
 * Master hizmet listesine (restaurant.expertise_areas) TR kategori/hizmetleri ekler.
 *
 * Kullanim:
 *   node scripts/seed-expertise-areas-tr.mjs
 */
import axios from "axios"
import { appConfig } from "../app.config.ts"

const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL ?? appConfig.serverURL ?? "https://server.hstplanet.com")
  .replace(/\/+$/, "")
const API_BASE = `${SERVER_URL}/api/`

const TOKEN =
  process.env.LOCOFABRIC_TOKEN_VIDEO ??
  appConfig.token.salonservis

if (!TOKEN) {
  console.error("salonservis token bulunamadi (LOCOFABRIC_TOKEN_VIDEO / appConfig.token.salonservis).")
  process.exit(1)
}

function extractRows(data) {
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.Data)) return data.Data
  if (Array.isArray(data)) return data
  return []
}

function sanitizeSqlString(input) {
  return String(input ?? "").replace(/'/g, "''").trim()
}

async function selectByToken(token) {
  const { data } = await axios.get(`${API_BASE}Database/Select`, {
    params: { token },
    timeout: 30_000,
  })
  return data
}

async function sqlToken(token, sql) {
  const { data } = await axios.post(
    `${API_BASE}Database/SQLToken`,
    { token, sql },
    { timeout: 30_000 },
  )
  return data
}

const DEFAULT_DURATION_MINUTES = 30
const DEFAULT_PRICE = 0

const GROUPS = [
  {
    category: "Kadın Kuaförü",
    services: [
      "Saç kesimi",
      "Fön",
      "Maşa / şekillendirme",
      "Saç boyama",
      "Röfle / ombre / sombre / balyaj",
      "Keratin bakım",
      "Saç botoksu",
      "Brezilya fönü",
      "Kaynak saç",
      "Topuz",
      "Gelin saçı",
      "Perma",
      "Saç bakımı",
    ],
  },
  {
    category: "Erkek Berberi / Erkek Kuaförü",
    services: [
      "Saç kesimi",
      "Sakal tıraşı",
      "Ense temizliği",
      "Saç boyama",
      "Fade / modern kesimler",
      "Cilt bakımı",
      "Kaş alma",
      "Ağda",
    ],
  },
  {
    category: "Güzellik Salonu - Cilt Bakımı",
    services: [
      "Klasik cilt bakımı",
      "Hydrafacial",
      "Anti-aging bakım",
      "Akne bakımı",
      "Leke bakımı",
      "Siyah nokta temizliği",
      "Medikal cilt bakımı",
    ],
  },
  {
    category: "Güzellik Salonu - Epilasyon",
    services: [
      "Lazer epilasyon",
      "IPL",
      "İğneli epilasyon",
      "Ağda",
    ],
  },
  {
    category: "Güzellik Salonu - Sir ağda",
    services: [
      "Sir ağda",
    ],
  },
  {
    category: "Güzellik Salonu - Kaş & Kirpik",
    services: [
      "Kaş alımı",
      "Kaş tasarımı",
      "Microblading",
      "Kalıcı kaş",
      "Kirpik lifting",
      "İpek kirpik",
      "Kaş laminasyonu",
    ],
  },
  {
    category: "Güzellik Salonu - El & Ayak Bakımı",
    services: [
      "Manikür",
      "Pedikür",
      "Protez tırnak",
      "Jel tırnak",
      "Nail art",
      "Kalıcı oje",
    ],
  },
  {
    category: "Güzellik Salonu - Makyaj",
    services: [
      "Günlük makyaj",
      "Profesyonel makyaj",
      "Gelin makyajı",
      "Sahne / fotoğraf makyajı",
    ],
  },
  {
    category: "Estetik & Medikal Güzellik",
    services: [
      "Bölgesel incelme",
      "G5 masajı",
      "Cilt gençleştirme",
      "Dermapen",
      "PRP",
      "Mezoterapi",
      "Kalıcı makyaj",
      "Dövme silme",
    ],
  },
  {
    category: "Spa & Bakım Hizmetleri",
    services: [
      "Masaj",
      "Aromaterapi",
      "Spa",
      "Vücut bakımı",
      "Tuz terapi",
      "Hamam hizmetleri",
    ],
  },
]

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

async function main() {
  const existingData = await selectByToken(TOKEN)
  const existingRows = extractRows(existingData)

  const existingKeys = new Set(
    existingRows.map((row) => `${normalizeKey(row.category)}|${normalizeKey(row.name)}`),
  )

  const toInsert = []
  for (const group of GROUPS) {
    for (const name of group.services) {
      const key = `${normalizeKey(group.category)}|${normalizeKey(name)}`
      if (!existingKeys.has(key)) {
        toInsert.push({ category: group.category, name })
      }
    }
  }

  if (toInsert.length === 0) {
    console.log("Eklenecek yeni hizmet bulunamadi.")
    return
  }

  console.log(`Eklenecek hizmet sayisi: ${toInsert.length}`)

  for (const item of toInsert) {
    const name = sanitizeSqlString(item.name)
    const category = sanitizeSqlString(item.category)
    const sql = `INSERT INTO expertise_areas (name, category, description, durationMinutes, price, isActive) VALUES ('${name}', '${category}', NULL, ${DEFAULT_DURATION_MINUTES}, ${DEFAULT_PRICE}, 1)`
    await sqlToken(TOKEN, sql)
  }

  console.log("Tamamlandi.")
}

main().catch((err) => {
  console.error(err?.response?.data ?? err?.message ?? err)
  process.exit(1)
})

