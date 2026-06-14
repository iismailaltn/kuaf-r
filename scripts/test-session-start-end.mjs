/**
 * Seans baslat + bitir akisini Locofabric ve handler mantigiyla test eder.
 * Kullanim: node scripts/test-session-start-end.mjs
 */

import axios from "axios"

const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL ?? "https://server.hstplanet.com").replace(/\/+$/, "")
const API_BASE = `${SERVER_URL}/api/`

const SESSION_TOKEN =
  process.env.LOCOFABRIC_TOKEN_SESSION_OPERATIONS ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoic2Vzc2lvbl9vcGVyYXRpb25zIiwiUmVhZCI6IlRydWUiLCJXcml0ZSI6IlRydWUiLCJVcGRhdGUiOiJUcnVlIiwiRGVsZXRlIjoiVHJ1ZSIsIk5hbWUiOiJyZXN0YXVyYW50LXNlc3Npb25fb3BlcmF0aW9ucyIsImp0aSI6IjYxN2ZkMTYzLWUxNTAtNDA3My04Y2ZlLTk5MWY4ODkxMWY0NCIsIm5iZiI6MTc3ODYxNTg2OCwiZXhwIjoyMDkzOTc1ODY4LCJpYXQiOjE3Nzg2MTU4NjgsImlzcyI6InBob2VuaXhhcGkuaHN0cGxhbmV0LmNvbSIsImF1ZCI6ImhzdHBsYW5ldC5jb20ifQ.8Cw6thcFvah3fUGxsPHhbrfQqkIXfc4NELrzKzA09mg"

const USERS_TOKEN =
  process.env.LOCOFABRIC_TOKEN_COMPANY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoiS3VhZm9yIiwiVGFibGUiOiJ1c2VycyIsIlJlYWQiOiJUcnVlIiwiV3JpdGUiOiJUcnVlIiwiVXBkYXRlIjoiVHJ1ZSIsIkRlbGV0ZSI6IlRydWUiLCJOYW1lIjoiS3VhZm9yLXVzZXJzIiwianRpIjoiZGEwZmU0MGQtMDZhMi00ODhmLTgyNDktOGFmNzcwYWM4ZGUyIiwibmJmIjoxNzc4NjkxNTQzLCJleHAiOjIwOTQwNTE1NDMsImlhdCI6MTc3ODY5MTU0MywiaXNzIjoicGhvZW5peGFwaS5oc3RwbGFuZXQuY29tIiwiYXVkIjoiaHN0cGxhbmV0LmNvbSJ9.OFYIenR7tdUVxXLVJps6--Zp-8aNFsUvEbgsKusL4-A"

const WORKSPACES_TOKEN =
  process.env.LOCOFABRIC_TOKEN_ADS ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoicmVzdGF1cmFudF90YWJsZXMiLCJSZWFkIjoiVHJ1ZSIsIldyaXRlIjoiVHJ1ZSIsIlVwZGF0ZSI6IlRydWUiLCJEZWxldGUiOiJUcnVlIiwiTmFtZSI6InJlc3RhdXJhbnQtw6dhbMSxxZ9tYUFsYW7EsSIsImp0aSI6IjI1MmFhMmI3LTFiMGQtNDg5Yi1hZDhiLTczMmZkMzc3ZjVhNSIsIm5iZiI6MTc3Njk1NDYwMSwiZXhwIjoyMDkyMzE0NjAxLCJpYXQiOjE3NzY5NTQ2MDEsImlzcyI6InBob2VuaXhhcGkuaHN0cGxhbmV0LmNvbSIsImF1ZCI6ImhzdHBsYW5ldC5jb20ifQ.8OVpONWZ8Ieyt82EmmYE5y7oFN_1R4_CxjSHh7uMIKA"

const PERSONELS_TOKEN =
  process.env.LOCOFABRIC_TOKEN_BLOG ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoicGVyc29uZWxzIiwiUmVhZCI6IlRydWUiLCJXcml0ZSI6IlRydWUiLCJVcGRhdGUiOiJUcnVlIiwiRGVsZXRlIjoiVHJ1ZSIsIk5hbWUiOiJyZXN0YXVyYW50LXBlcnNvbmVscyIsImp0aSI6IjczOTg4MjM1LTI4NjktNDA5OC1iODVhLTE3OTJmZjA2MDJlNyIsIm5iZiI6MTc3Njk3NTMzMiwiZXhwIjoyMDkyMzM1MzMyLCJpYXQiOjE3NzY5NzUzMzIsImlzcyI6InBob2VuaXhhcGkuaHN0cGxhbmV0LmNvbSIsImF1ZCI6ImhzdHBsYW5ldC5jb20ifQ.xSbPvGoYSzBEvVjdlEahPJTYwpuCDK6HvGA8qdRc-cs"

const TARGET_EMAIL = process.env.TEST_EMAIL ?? "ismail@gmail.com"

function extractRows(data) {
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.Data)) return data.Data
  if (Array.isArray(data)) return data
  const single = data?.data ?? data?.Data
  if (single && typeof single === "object" && !Array.isArray(single)) return [single]
  return []
}

function getField(row, candidates) {
  for (const c of candidates) {
    if (row?.[c] !== undefined && row?.[c] !== null) return row[c]
    const key = Object.keys(row ?? {}).find((k) => k.toLowerCase() === c.toLowerCase())
    if (key && row[key] !== undefined && row[key] !== null) return row[key]
  }
  return undefined
}

function rowId(row) {
  return Number(getField(row, ["id", "ID", "Id"]) ?? 0)
}

async function selectByToken(token) {
  const { data, status } = await axios.get(`${API_BASE}Database/Select`, { params: { token }, timeout: 30_000 })
  return { status, data }
}

async function sqlToken(token, sql) {
  const { data, status } = await axios.post(`${API_BASE}Database/SQLToken`, { token, sql }, { timeout: 30_000 })
  return { status, data }
}

function toSqlTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function sqlBusinessUserIdRef(businessUserId) {
  if (/^\d+$/.test(businessUserId)) return businessUserId
  return `'${businessUserId.replace(/'/g, "''")}'`
}

async function findBusinessUserId() {
  const { data } = await selectByToken(USERS_TOKEN)
  const users = extractRows(data)
  const email = TARGET_EMAIL.toLowerCase()
  const target =
    users.find((row) => String(getField(row, ["email", "username"]) ?? "").toLowerCase() === email) ??
    users.find((row) => Object.values(row).some((v) => typeof v === "string" && v.toLowerCase() === email))
  if (!target) throw new Error(`Kullanici bulunamadi: ${TARGET_EMAIL}`)
  return String(getField(target, ["id", "ID"]) ?? "").trim()
}

async function main() {
  console.log("API:", API_BASE)
  const businessUserId = await findBusinessUserId()
  console.log("businessUserId:", businessUserId)

  const workspaces = extractRows((await selectByToken(WORKSPACES_TOKEN)).data).filter(
    (r) => String(getField(r, ["business_user_id", "businessUserId"]) ?? "") === businessUserId,
  )
  const workspace = workspaces[0]
  if (!workspace) throw new Error("Workspace yok")
  const workspaceId = rowId(workspace)
  const workspaceName = String(getField(workspace, ["table_number", "tableNumber"]) ?? `Masa ${workspaceId}`)

  const personels = extractRows((await selectByToken(PERSONELS_TOKEN)).data).filter(
    (r) => String(getField(r, ["business_user_id", "businessUserId"]) ?? "") === businessUserId,
  )
  const personel = personels[0]
  if (!personel) throw new Error("Personel yok")
  const staffId = String(getField(personel, ["user_id", "userId", "id", "ID"]) ?? "")
  const staffName = String(getField(personel, ["full_name", "fullName"]) ?? "Test Personel")

  const businessRef = sqlBusinessUserIdRef(businessUserId)
  const startedAt = toSqlTimestamp()
  const servicesValue = "Test Kesim@150"
  const marker = `__TEST_${Date.now()}__`

  const insertSql = `INSERT INTO session_operations (business_user_id, workspace_id, workspace_name, customer_name, customer_surname, services, staff_id, staff_name, notes, photo, share_on_instagram, share_on_website, started_at, ended_at, createdAt, updatedAt) VALUES (${businessRef}, ${workspaceId}, '${workspaceName.replace(/'/g, "''")}', 'Test', 'Musteri', '${servicesValue}', '${staffId.replace(/'/g, "''")}', '${staffName.replace(/'/g, "''")}', '${marker}', NULL, 0, 0, '${startedAt}', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`

  console.log("\n--- INSERT ---")
  const insertRes = await sqlToken(SESSION_TOKEN, insertSql)
  console.log("insert status:", insertRes.status)
  console.log("insert body keys:", Object.keys(insertRes.data ?? {}))
  console.log("insert body:", JSON.stringify(insertRes.data).slice(0, 500))

  const newId = Number(insertRes.data?.newId ?? insertRes.data?.NewId ?? 0)
  let operationId = Number.isFinite(newId) && newId > 0 ? newId : 0

  if (!operationId) {
    const latest = await sqlToken(
      SESSION_TOKEN,
      `SELECT TOP 200 * FROM session_operations WHERE business_user_id = ${businessRef}`,
    )
    const latestRows = extractRows(latest.data)
    const markerRow = latestRows
      .filter((r) => String(r.notes ?? "").includes(marker))
      .sort((a, b) => rowId(b) - rowId(a))[0]
    operationId = rowId(markerRow ?? {})
    console.log("latest id from SELECT * (memory sort):", operationId, "rows:", latestRows.length)
  }

  if (!operationId) {
    const sel = await selectByToken(SESSION_TOKEN)
    const rows = extractRows(sel.data)
    const match = rows.find((r) => String(r.notes ?? "").includes(marker))
    operationId = rowId(match ?? {})
    console.log("id from selectByToken:", operationId, "total select rows:", rows.length)
  }

  if (!operationId) {
    const selStar = await sqlToken(SESSION_TOKEN, "SELECT * FROM session_operations")
    const rows = extractRows(selStar.data)
    const match = rows.find((r) => String(r.notes ?? r.Notes ?? "").includes(marker))
    operationId = rowId(match ?? {})
    console.log("id from SELECT *:", operationId, "total sql rows:", rows.length)
    if (match) console.log("match keys:", Object.keys(match))
  }

  if (!operationId) {
    console.error("FAIL: operation id bulunamadi")
    process.exit(1)
  }

  console.log("\noperationId:", operationId)

  console.log("\n--- SELECT by id ---")
  for (const sql of [
    `SELECT TOP 1 * FROM session_operations WHERE id = ${operationId}`,
    `SELECT TOP 1 * FROM session_operations WHERE id = ${operationId} AND business_user_id = ${businessRef}`,
  ]) {
    const r = await sqlToken(SESSION_TOKEN, sql)
    const rows = extractRows(r.data)
    console.log(sql.slice(0, 60) + "...", "-> rows:", rows.length, rows[0] ? Object.keys(rows[0]) : [])
  }

  const endedAt = toSqlTimestamp(new Date())
  console.log("\n--- UPDATE (end session) ---")
  const updateSql = `UPDATE session_operations SET services='${servicesValue}', ended_at='${endedAt}', updatedAt=CURRENT_TIMESTAMP WHERE id=${operationId} AND business_user_id=${businessRef}`
  const updateRes = await sqlToken(SESSION_TOKEN, updateSql)
  console.log("update status:", updateRes.status)
  console.log("update body:", JSON.stringify(updateRes.data).slice(0, 300))

  const verify = await sqlToken(
    SESSION_TOKEN,
    `SELECT TOP 1 * FROM session_operations WHERE id = ${operationId}`,
  )
  const verifyRow = extractRows(verify.data)[0]
  console.log("\n--- VERIFY ---")
  console.log(verifyRow)

  const ended = verifyRow?.ended_at ?? verifyRow?.endedAt
  if (ended) {
    console.log("\nOK: Seans baslatildi ve bitti.")
  } else {
    console.log("\nWARN: UPDATE dondu ama ended_at bos — kolon adi veya UPDATE etkilemedi.")
  }
}

main().catch((err) => {
  console.error(err.response?.data ?? err.message ?? err)
  process.exit(1)
})
