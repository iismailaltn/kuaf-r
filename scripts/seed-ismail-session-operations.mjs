/**
 * ismail@gmail.com — son 1 yil icinde 50 tamamlanmis seans kaydi.
 * Personel listesi + isletme ayarlarindaki aktif hizmetler kullanilir.
 * Kullanim: node scripts/seed-ismail-session-operations.mjs [adet]
 */

import axios from "axios"

const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL ?? "https://server.hstplanet.com").replace(/\/+$/, "")
const API_BASE = `${SERVER_URL}/api/`

const TOKENS = {
  users:
    process.env.LOCOFABRIC_TOKEN_COMPANY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoiS3VhZm9yIiwiVGFibGUiOiJ1c2VycyIsIlJlYWQiOiJUcnVlIiwiV3JpdGUiOiJUcnVlIiwiVXBkYXRlIjoiVHJ1ZSIsIkRlbGV0ZSI6IlRydWUiLCJOYW1lIjoiS3VhZm9yLXVzZXJzIiwianRpIjoiZGEwZmU0MGQtMDZhMi00ODhmLTgyNDktOGFmNzcwYWM4ZGUyIiwibmJmIjoxNzc4NjkxNTQzLCJleHAiOjIwOTQwNTE1NDMsImlhdCI6MTc3ODY5MTU0MywiaXNzIjoicGhvZW5peGFwaS5oc3RwbGFuZXQuY29tIiwiYXVkIjoiaHN0cGxhbmV0LmNvbSJ9.OFYIenR7tdUVxXLVJps6--Zp-8aNFsUvEbgsKusL4-A",
  personels:
    process.env.LOCOFABRIC_TOKEN_BLOG ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoicGVyc29uZWxzIiwiUmVhZCI6IlRydWUiLCJXcml0ZSI6IlRydWUiLCJVcGRhdGUiOiJUcnVlIiwiRGVsZXRlIjoiVHJ1ZSIsIk5hbWUiOiJyZXN0YXVyYW50LXBlcnNvbmVscyIsImp0aSI6IjczOTg4MjM1LTI4NjktNDA5OC1iODVhLTE3OTJmZjA2MDJlNyIsIm5iZiI6MTc3Njk3NTMzMiwiZXhwIjoyMDkyMzM1MzMyLCJpYXQiOjE3NzY5NzUzMzIsImlzcyI6InBob2VuaXhhcGkuaHN0cGxhbmV0LmNvbSIsImF1ZCI6ImhzdHBsYW5ldC5jb20ifQ.xSbPvGoYSzBEvVjdlEahPJTYwpuCDK6HvGA8qdRc-cs",
  sessionOperations:
    process.env.LOCOFABRIC_TOKEN_SESSION_OPERATIONS ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoic2Vzc2lvbl9vcGVyYXRpb25zIiwiUmVhZCI6IlRydWUiLCJXcml0ZSI6IlRydWUiLCJVcGRhdGUiOiJUcnVlIiwiRGVsZXRlIjoiVHJ1ZSIsIk5hbWUiOiJyZXN0YXVyYW50LXNlc3Npb25fb3BlcmF0aW9ucyIsImp0aSI6IjYxN2ZkMTYzLWUxNTAtNDA3My04Y2ZlLTk5MWY4ODkxMWY0NCIsIm5iZiI6MTc3ODYxNTg2OCwiZXhwIjoyMDkzOTc1ODY4LCJpYXQiOjE3Nzg2MTU4NjgsImlzcyI6InBob2VuaXhhcGkuaHN0cGxhbmV0LmNvbSIsImF1ZCI6ImhzdHBsYW5ldC5jb20ifQ.8Cw6thcFvah3fUGxsPHhbrfQqkIXfc4NELrzKzA09mg",
  workspaces:
    process.env.LOCOFABRIC_TOKEN_ADS ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoicmVzdGF1cmFudF90YWJsZXMiLCJSZWFkIjoiVHJ1ZSIsIldyaXRlIjoiVHJ1ZSIsIlVwZGF0ZSI6IlRydWUiLCJEZWxldGUiOiJUcnVlIiwiTmFtZSI6InJlc3RhdXJhbnQtw6dhbMSxxZ9tYUFsYW7EsSIsImp0aSI6IjI1MmFhMmI3LTFiMGQtNDg5Yi1hZDhiLTczMmZkMzc3ZjVhNSIsIm5iZiI6MTc3Njk1NDYwMSwiZXhwIjoyMDkyMzE0NjAxLCJpYXQiOjE3NzY5NTQ2MDEsImlzcyI6InBob2VuaXhhcGkuaHN0cGxhbmV0LmNvbSIsImF1ZCI6ImhzdHBsYW5ldC5jb20ifQ.8OVpONWZ8Ieyt82EmmYE5y7oFN_1R4_CxjSHh7uMIKA",
  salonServices:
    process.env.LOCOFABRIC_TOKEN_VIDEO ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoiZXhwZXJ0aXNlX2FyZWFzIiwiUmVhZCI6IlRydWUiLCJXcml0ZSI6IlRydWUiLCJVcGRhdGUiOiJUcnVlIiwiRGVsZXRlIjoiVHJ1ZSIsIk5hbWUiOiJyZXN0YXVyYW50LXNhbG9uc2VydmlzIiwianRpIjoiOGRkYTg3M2EtYjZhNy00OTg1LTkyZDYtZjMxYWJlNTFiOWMyIiwibmJmIjoxNzc4NTI2NDQzLCJleHAiOjIwOTM4ODY0NDMsImlhdCI6MTc3ODUyNjQ0MywiaXNzIjoicGhvZW5peGFwaS5oc3RwbGFuZXQuY29tIiwiYXVkIjoiaHN0cGxhbmV0LmNvbSJ9.gUj_dyYGK9tOnh2hPrikan4u2Nlv-wmA_Z1k0ynl7Wc",
  businessServiceSettings:
    process.env.LOCOFABRIC_TOKEN_CONTENT ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoiS3VhZm9yIiwiVGFibGUiOiJidXNpbmVzc19zZXJ2aWNlX3NldHRpbmdzIiwiUmVhZCI6IlRydWUiLCJXcml0ZSI6IlRydWUiLCJVcGRhdGUiOiJUcnVlIiwiRGVsZXRlIjoiVHJ1ZSIsIk5hbWUiOiJLdWFmb3ItYnVzaW5lc3Nfc2VydmljZV9zZXR0aW5nc1x0IiwianRpIjoiMWFiYjRmOTUtMjkzNS00YTIwLWIzODUtZmJkNDFmZGQwYjdiIiwibmJmIjoxNzc4NzAwMjYwLCJleHAiOjIwOTQwNjAyNjAsImlhdCI6MTc3ODcwMDI2MCwiaXNzIjoicGhvZW5peGFwaS5oc3RwbGFuZXQuY29tIiwiYXVkIjoiaHN0cGxhbmV0LmNvbSJ9.Yr_cCHX1mCbtK3J7RR_Rb1j8cn-JeYgFddFPUEWZVoo",
}

const TARGET_EMAIL = "ismail@gmail.com"
const SESSION_COUNT = Math.max(1, Number(process.argv[2] ?? 50) || 50)
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

const CUSTOMER_FIRST = [
  "Ali", "Veli", "Ayse", "Fatma", "Mehmet", "Zeynep", "Can", "Elif", "Burak", "Selin",
  "Emre", "Deniz", "Cem", "Gamze", "Kaan", "Merve", "Onur", "Pinar", "Serkan", "Tugba",
  "Hakan", "Irem", "Baris", "Derya", "Tolga", "Yasemin", "Umut", "Gizem", "Ozan", "Seda",
]

const CUSTOMER_LAST = [
  "Yilmaz", "Kaya", "Demir", "Celik", "Sahin", "Yildiz", "Ozturk", "Aydin", "Arslan", "Dogan",
  "Kilic", "Aslan", "Cetin", "Koc", "Kurt", "Ozdemir", "Aksoy", "Polat", "Erdem", "Gunes",
]

const NOTES = [
  "",
  "",
  "Musteri randevusuna zamaninda geldi.",
  "Ek bakim onerildi.",
  "VIP musteri.",
  "Instagram paylasimi istendi.",
  "Bir sonraki randevu 4 hafta sonra.",
  "Hassas cilt — dikkatli uygulama.",
  "Sadakat indirimi uygulandi.",
]

function extractRows(data) {
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.Data)) return data.Data
  if (Array.isArray(data)) return data
  return []
}

function getField(row, candidates) {
  for (const candidate of candidates) {
    if (row[candidate] !== undefined && row[candidate] !== null) return row[candidate]
    const key = Object.keys(row).find((k) => k.toLowerCase() === candidate.toLowerCase())
    if (key && row[key] !== undefined && row[key] !== null) return row[key]
  }
  return undefined
}

function sanitizeSqlString(input) {
  return String(input).replace(/'/g, "''")
}

function toSqlTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function serializeServiceEntries(items) {
  return items.map((item) => `${item.name}@${item.price}`).join("|")
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickMany(arr, min, max) {
  const count = min + Math.floor(Math.random() * (max - min + 1))
  const copy = [...arr]
  const picked = []
  while (picked.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length)
    picked.push(copy.splice(index, 1)[0])
  }
  return picked
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

async function selectByToken(token) {
  const { data } = await axios.get(`${API_BASE}Database/Select`, { params: { token }, timeout: 30_000 })
  return data
}

async function sqlToken(token, sql) {
  const { data } = await axios.post(`${API_BASE}Database/SQLToken`, { token, sql }, { timeout: 30_000 })
  return data
}

async function findBusinessUserId() {
  const users = extractRows(await selectByToken(TOKENS.users))
  const normalized = TARGET_EMAIL.toLowerCase()
  let target = users.find((row) => {
    const email = String(getField(row, ["email", "e_mail", "eposta", "username"]) ?? "")
      .trim()
      .toLowerCase()
    return email === normalized
  })
  if (!target) {
    target = users.find((row) =>
      Object.values(row).some((v) => typeof v === "string" && v.trim().toLowerCase() === normalized),
    )
  }
  if (!target) throw new Error(`${TARGET_EMAIL} bulunamadi.`)
  return String(getField(target, ["id", "ID", "user_id", "userId"]) ?? "").trim()
}

async function loadPersonels(businessUserId) {
  const rows = extractRows(await selectByToken(TOKENS.personels))
  return rows
      .filter((row) => String(getField(row, ["business_user_id", "businessUserId"]) ?? "").trim() === businessUserId)
      .filter((row) => {
        const active = getField(row, ["is_active", "isActive"])
        return active === true || active === 1 || active === "1" || active === "true"
      })
      .map((row) => ({
        id: String(getField(row, ["id", "ID"]) ?? "").trim(),
        staffId: String(
          getField(row, ["user_id", "userId", "individual_user_id", "individualUserId", "id", "ID"]) ?? "",
        ).trim(),
        name: String(getField(row, ["full_name", "fullName"]) ?? "").trim() ||
          `${String(getField(row, ["first_name", "firstName"]) ?? "").trim()} ${String(getField(row, ["last_name", "lastName"]) ?? "").trim()}`.trim(),
      }))
      .filter((p) => p.name)
}

async function loadWorkspaces(businessUserId) {
  const rows = extractRows(await selectByToken(TOKENS.workspaces))
  return rows
      .filter((row) => String(getField(row, ["business_user_id", "businessUserId"]) ?? "").trim() === businessUserId)
      .map((row) => ({
        id: Number(getField(row, ["id", "ID"])),
        name: String(getField(row, ["table_number", "tableNumber"]) ?? "").trim() || `Calisma Alani ${getField(row, ["id", "ID"])}`,
      }))
      .filter((w) => Number.isFinite(w.id) && w.id > 0)
}

async function loadActiveSalonServices(businessUserId) {
  const [masterData, settingsData] = await Promise.all([
    selectByToken(TOKENS.salonServices),
    selectByToken(TOKENS.businessServiceSettings),
  ])

  const masterRows = extractRows(masterData)
  const settingsRows = extractRows(settingsData).filter(
    (row) => String(getField(row, ["business_user_id", "businessUserId"]) ?? "").trim() === businessUserId,
  )

  const masterById = new Map()
  for (const row of masterRows) {
    const id = String(getField(row, ["id", "ID"]) ?? "").trim()
    if (!id) continue
    masterById.set(id, {
      id,
      name: String(getField(row, ["name", "service_name", "serviceName"]) ?? "").trim(),
      durationMinutes: Number(getField(row, ["duration_minutes", "durationMinutes"]) ?? 45) || 45,
      defaultPrice: Number(getField(row, ["price"]) ?? 0) || 0,
    })
  }

  const services = []
  for (const setting of settingsRows) {
    const isActive = getField(setting, ["is_active", "isActive"])
    const active = isActive === true || isActive === 1 || isActive === "1" || isActive === "true"
    if (!active) continue

    const serviceId = String(getField(setting, ["service_id", "serviceId"]) ?? "").trim()
    const master = masterById.get(serviceId)
    const name =
      String(getField(setting, ["service_name", "serviceName"]) ?? "").trim() ||
      master?.name ||
      ""
    if (!name) continue

    const price = Number(getField(setting, ["price"]) ?? master?.defaultPrice ?? 0)
    services.push({
      name,
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      durationMinutes: master?.durationMinutes ?? 45,
    })
  }

  return services
}

function buildUniqueSessions(count, staff, workspaces, services) {
  const now = Date.now()
  const startRange = now - ONE_YEAR_MS
  const usedKeys = new Set()
  const sessions = []

  let attempts = 0
  while (sessions.length < count && attempts < count * 50) {
    attempts += 1

    const startedMs =
      startRange +
      Math.floor(Math.random() * (now - startRange - 2 * 60 * 60 * 1000)) +
      sessions.length * 37_000
    const startedAt = new Date(startedMs)
    const hour = startedAt.getHours()
    if (hour < 9 || hour >= 20) continue

    const customerName = pick(CUSTOMER_FIRST)
    const customerSurname = pick(CUSTOMER_LAST)
    const person = pick(staff)
    const workspace = pick(workspaces)
    const selectedServices = pickMany(services, 1, Math.min(3, services.length))
    const durationMinutes =
      selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0) || randomInt(30, 90)
    const endedAt = new Date(startedMs + durationMinutes * 60 * 1000 + randomInt(5, 20) * 60 * 1000)

    const key = `${customerName}|${customerSurname}|${toSqlTimestamp(startedAt)}|${person.staffId}|${workspace.id}`
    if (usedKeys.has(key)) continue
    usedKeys.add(key)

    const serviceItems = selectedServices.map((s) => ({
      name: s.name,
      price: s.price > 0 ? s.price : randomInt(150, 800),
    }))

    sessions.push({
      customerName,
      customerSurname,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      staffId: person.staffId || person.id,
      staffName: person.name,
      serviceItems,
      startedAt,
      endedAt,
      notes: pick(NOTES),
      shareOnInstagram: Math.random() < 0.15 ? 1 : 0,
      shareOnWebsite: Math.random() < 0.1 ? 1 : 0,
    })
  }

  return sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
}

async function main() {
  console.log("Isletme araniyor...")
  const businessUserId = await findBusinessUserId()
  console.log(`Isletme id: ${businessUserId}`)

  const [staff, workspaces, services] = await Promise.all([
    loadPersonels(businessUserId),
    loadWorkspaces(businessUserId),
    loadActiveSalonServices(businessUserId),
  ])

  console.log(`Personel: ${staff.length}, Calisma alani: ${workspaces.length}, Aktif hizmet: ${services.length}`)

  if (staff.length === 0) throw new Error("Aktif personel bulunamadi.")
  if (workspaces.length === 0) throw new Error("Calisma alani bulunamadi.")
  if (services.length === 0) throw new Error("Isletme ayarlarinda aktif hizmet bulunamadi.")

  services.forEach((s) => console.log(`  - ${s.name} (${s.price} TL, ${s.durationMinutes} dk)`))

  const sessions = buildUniqueSessions(SESSION_COUNT, staff, workspaces, services)
  if (sessions.length < SESSION_COUNT) {
    throw new Error(`Yalnizca ${sessions.length} benzersiz seans uretilebildi.`)
  }

  console.log(`\n${sessions.length} seans ekleniyor...`)

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const servicesValue = sanitizeSqlString(serializeServiceEntries(s.serviceItems))
    const notesValue = s.notes ? `'${sanitizeSqlString(s.notes)}'` : "NULL"
    const startedSql = toSqlTimestamp(s.startedAt)
    const endedSql = toSqlTimestamp(s.endedAt)

    const sql = `INSERT INTO session_operations (business_user_id, workspace_id, workspace_name, customer_name, customer_surname, services, staff_id, staff_name, notes, photo, share_on_instagram, share_on_website, started_at, ended_at, createdAt, updatedAt) VALUES (${businessUserId}, ${s.workspaceId}, '${sanitizeSqlString(s.workspaceName)}', '${sanitizeSqlString(s.customerName)}', '${sanitizeSqlString(s.customerSurname)}', '${servicesValue}', '${sanitizeSqlString(s.staffId)}', '${sanitizeSqlString(s.staffName)}', ${notesValue}, NULL, ${s.shareOnInstagram}, ${s.shareOnWebsite}, '${startedSql}', '${endedSql}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`

    await sqlToken(TOKENS.sessionOperations, sql)
    const total = s.serviceItems.reduce((sum, item) => sum + item.price, 0)
    console.log(
      `${i + 1}/${sessions.length} ${s.customerName} ${s.customerSurname} | ${s.staffName} | ${s.workspaceName} | ${startedSql.slice(0, 10)} | ${total} TL`,
    )
  }

  const countResult = await sqlToken(
    TOKENS.sessionOperations,
    `SELECT COUNT(*) as cnt FROM session_operations WHERE business_user_id=${businessUserId}`,
  )
  const total =
    Number(countResult?.data?.[0]?.cnt ?? countResult?.Data?.[0]?.cnt ?? countResult) || "?"
  console.log(`\nTamamlandi. Isletme toplam seans: ${total}`)
}

main().catch((err) => {
  console.error(err?.response?.data ?? err.message ?? err)
  process.exit(1)
})
