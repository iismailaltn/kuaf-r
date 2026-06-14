/**
 * Randevu INSERT + SELECT dogrulama (Locofabric SQLToken).
 * Calistirma: node scripts/test-reservation.mjs
 */
import axios from "axios"

const TOKEN =
  process.env.LOCOFABRIC_TOKEN_RESERVATIONS ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoiS3VhZm9yIiwiVGFibGUiOiJzYWxvbl9yZXNlcnZhdGlvbnMiLCJSZWFkIjoiVHJ1ZSIsIldyaXRlIjoiVHJ1ZSIsIlVwZGF0ZSI6IlRydWUiLCJEZWxldGUiOiJUcnVlIiwiTmFtZSI6Ikt1YWZvci1zYWxvbl9yZXNlcnZhdGlvbnMiLCJqdGkiOiJhOGZjNTBlNC0wNjhiLTQwM2EtYTc2NS1iZWE3ZmVlMGQ3NTciLCJuYmYiOjE3Nzk0MzkzNzcsImV4cCI6MjA5NDc5OTM3NywiaWF0IjoxNzc5NDM5Mzc3LCJpc3MiOiJwaG9lbml4YXBpLmhzdHBsYW5ldC5jb20iLCJhdWQiOiJoc3RwbGFuZXQuY29tIn0.6wbGRG02uW05ipmx-UETI0gmdFT1LItFkRZy3q3JpsE"

const SERVER =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim()?.replace(/\/+$/, "") ??
  `${(process.env.NEXT_PUBLIC_SERVER_URL ?? "https://server.hstplanet.com").replace(/\/+$/, "")}/api`
const BUSINESS_ID = 11
const TEST_DATE = "2026-06-15"
const MARKER = `cursor_test_${Date.now()}`

function sqlJsonForInsert(value) {
  const b64 = Buffer.from(JSON.stringify(value), "utf8").toString("base64")
  return `'${b64.replace(/'/g, "''")}'`
}

async function sqlToken(sql) {
  const { data } = await axios.post(`${SERVER}/Database/SQLToken`, { token: TOKEN, sql })
  return data
}

async function selectByToken() {
  const { data } = await axios.get(`${SERVER}/Database/Select`, {
    params: { token: TOKEN },
  })
  return data
}

function extractRows(data) {
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.Data)) return data.Data
  if (Array.isArray(data)) return data
  return []
}

const stages = [
  {
    id: "stg_test_a",
    name: "Islem",
    durationMinutes: 75,
    offsetMinutes: 0,
    requiresStaff: true,
    requiresWorkspace: true,
  },
  {
    id: "stg_test_b",
    name: "Islem",
    durationMinutes: 40,
    offsetMinutes: 75,
    requiresStaff: true,
    requiresWorkspace: true,
  },
]

const staffBusyBlocks = [
  { startMinutes: 0, endMinutes: 75 },
  { startMinutes: 75, endMinutes: 115 },
]

const insertSql = `INSERT INTO salon_reservations (business_user_id, reservation_date, start_time, end_time, customer_name, customer_surname, phone, staff_id, staff_name, service_ids_json, service_names_json, notes, source, status, total_minutes, stages_json, staff_busy_blocks_json, created_at, updated_at) VALUES (${BUSINESS_ID}, '${TEST_DATE}', '09:30', '11:25', 'Test', 'Musteri', '5550000000', '8', 'ismail altin', ${sqlJsonForInsert([6, 4])}, ${sqlJsonForInsert(["Cilt Bakimi (Temel)", "Klasik Manikur"])}, '${MARKER}', 'manual', 'confirmed', 115, ${sqlJsonForInsert(stages)}, ${sqlJsonForInsert(staffBusyBlocks)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`

async function main() {
  console.log("1) INSERT...")
  console.log(insertSql.slice(0, 120) + "...")
  const insertResult = await sqlToken(insertSql)
  console.log("INSERT yanit:", JSON.stringify(insertResult, null, 2))

  const newId = Number(insertResult?.newId ?? insertResult?.data?.id ?? insertResult?.data?.newId)
  const rowId = newId > 0 ? newId : null

  console.log("\n2) SELECT (Select API)...")
  const apiRows = extractRows(await selectByToken()).filter(
    (r) => Number(r.business_user_id ?? r.businessUserId) === BUSINESS_ID,
  )
  console.log(`  Select API: ${apiRows.length} kayit (business ${BUSINESS_ID})`)

  const row =
    apiRows.find((r) => String(r.notes ?? "") === MARKER) ??
    (insertResult?.data && String(insertResult.data.notes) === MARKER ? insertResult.data : null)

  if (!row) {
    console.error("HATA: Kayit dogrulanamadi.")
    process.exit(1)
  }
  console.log("\n3) Dogrulama:")
  function decodeB64Json(raw) {
    const str = String(raw ?? "").trim()
    if (str.startsWith("[") || str.startsWith("{")) return JSON.parse(str)
    return JSON.parse(Buffer.from(str, "base64").toString("utf8"))
  }

  const endTime = String(row.end_time ?? row.endTime ?? "")
  const checks = [
    ["source", row.source, "manual"],
    ["status", row.status, "confirmed"],
    ["total_minutes", row.total_minutes ?? row.totalMinutes, 115],
    ["notes", row.notes, MARKER],
  ]
  const stagesParsed = decodeB64Json(row.stages_json ?? row.stagesJson)
  const blocksParsed = decodeB64Json(row.staff_busy_blocks_json ?? row.staffBusyBlocksJson)
  let ok = true
  for (const [label, got, want] of checks) {
    const pass = String(got) === String(want)
    console.log(`  ${pass ? "OK" : "FAIL"} ${label}: ${got} (beklenen: ${want})`)
    if (!pass) ok = false
  }
  console.log(`  end_time: ${endTime}`)
  console.log(`  stages: ${stagesParsed.length} adet, offsets: ${stagesParsed.map((s) => s.offsetMinutes).join(",")}`)
  console.log(`  staff blocks: ${JSON.stringify(blocksParsed)}`)
  if (stagesParsed.length !== 2 || stagesParsed[1]?.offsetMinutes !== 75) {
    console.log("  FAIL stages offset")
    ok = false
  }
  if (rowId) console.log(`  Yeni id: ${rowId}`)
  console.log("\nHam satir:", JSON.stringify(row, null, 2))

  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error("Hata:", err.response?.status, err.response?.data ?? err.message)
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2))
  process.exit(1)
})
