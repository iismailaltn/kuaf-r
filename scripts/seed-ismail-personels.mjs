/**
 * ismail@gmail.com kurumsal hesabina 5 personel ekler.
 * Kullanim: node scripts/seed-ismail-personels.mjs
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
}

const TARGET_EMAIL = "ismail@gmail.com"

const EMPLOYEES = [
  {
    firstName: "Ayse",
    lastName: "Yilmaz",
    phone: "05321110001",
    email: "ayse.yilmaz@salon.demo",
    role: "5 yil",
    expertise: "Sac Kesimi | Fon | Stil",
    workStart: "09:00",
    workEnd: "18:00",
    notes: "Kadin kesim ve gunluk bakim uzmani",
    hireDate: "2021-03-10",
  },
  {
    firstName: "Mehmet",
    lastName: "Kaya",
    phone: "05321110002",
    email: "mehmet.kaya@salon.demo",
    role: "8 yil",
    expertise: "Sakal Tirasi | Cilt Bakimi | Yuz Bakimi",
    workStart: "10:00",
    workEnd: "19:00",
    notes: "Erkek bakim ve sakal tasarim uzmani",
    hireDate: "2019-06-15",
  },
  {
    firstName: "Zeynep",
    lastName: "Demir",
    phone: "05321110003",
    email: "zeynep.demir@salon.demo",
    role: "6 yil",
    expertise: "Boya | Rofle | Ombre | Balayage",
    workStart: "09:30",
    workEnd: "18:30",
    notes: "Renklendirme ve sac boyama uzmani",
    hireDate: "2020-01-20",
  },
  {
    firstName: "Can",
    lastName: "Ozturk",
    phone: "05321110004",
    email: "can.ozturk@salon.demo",
    role: "4 yil",
    expertise: "Keratin | Brezilya Fonu | Sac Duzlestirme",
    workStart: "11:00",
    workEnd: "20:00",
    notes: "Keratin ve yapisal sac bakim uzmani",
    hireDate: "2022-08-01",
  },
  {
    firstName: "Elif",
    lastName: "Arslan",
    phone: "05321110005",
    email: "elif.arslan@salon.demo",
    role: "3 yil",
    expertise: "Manikur | Pedikur | Nail Art | Kalici Oje",
    workStart: "10:30",
    workEnd: "19:30",
    notes: "Tirnak bakim ve nail art uzmani",
    hireDate: "2023-02-14",
  },
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

async function main() {
  console.log("Kullanicilar yukleniyor...")
  const usersData = await selectByToken(TOKENS.users)
  const users = extractRows(usersData)
  const normalizedTarget = TARGET_EMAIL.toLowerCase()
  let target = users.find((row) => {
    const email = String(getField(row, ["email", "e_mail", "eposta", "username"]) ?? "")
      .trim()
      .toLowerCase()
    return email === normalizedTarget
  })

  if (!target) {
    target = users.find((row) =>
      Object.values(row).some(
        (value) => typeof value === "string" && value.trim().toLowerCase() === normalizedTarget,
      ),
    )
  }

  if (!target) {
    console.error(`Hata: ${TARGET_EMAIL} bulunamadi.`)
    process.exit(1)
  }

  const userId = String(getField(target, ["id", "ID", "user_id", "userId"]) ?? "").trim()
  const accountType = String(getField(target, ["account_type", "accountType"]) ?? "")
    .trim()
    .toLowerCase()

  if (accountType !== "kurumsal") {
    console.error(`Hata: ${TARGET_EMAIL} kurumsal hesap degil (${accountType}).`)
    process.exit(1)
  }

  console.log(`Isletme kullanici id: ${userId}`)

  const personelsData = await selectByToken(TOKENS.personels)
  const existing = extractRows(personelsData).filter(
    (row) => String(getField(row, ["business_user_id", "businessUserId"]) ?? "").trim() === userId,
  )
  console.log(`Mevcut personel sayisi: ${existing.length}`)

  for (const emp of EMPLOYEES) {
    const fullName = `${emp.firstName} ${emp.lastName}`
    const already = existing.some((row) => {
      const phone = String(getField(row, ["phone"]) ?? "").trim()
      const name = String(getField(row, ["full_name", "fullName"]) ?? "").trim().toLowerCase()
      return phone === emp.phone || name === fullName.toLowerCase()
    })

    if (already) {
      console.log(`Atlandi (zaten var): ${fullName}`)
      continue
    }

    const sql = `INSERT INTO personels (business_user_id, first_name, last_name, full_name, phone, email, role, expertise, is_active, hire_date, work_start_time, work_end_time, notes) VALUES (${userId}, '${sanitizeSqlString(emp.firstName)}', '${sanitizeSqlString(emp.lastName)}', '${sanitizeSqlString(fullName)}', '${sanitizeSqlString(emp.phone)}', '${sanitizeSqlString(emp.email)}', '${sanitizeSqlString(emp.role)}', '${sanitizeSqlString(emp.expertise)}', 1, '${emp.hireDate}', '${emp.workStart}', '${emp.workEnd}', '${sanitizeSqlString(emp.notes)}')`

    await sqlToken(TOKENS.personels, sql)
    console.log(`Eklendi: ${fullName} — ${emp.expertise}`)
  }

  const refreshed = extractRows(await selectByToken(TOKENS.personels)).filter(
    (row) => String(getField(row, ["business_user_id", "businessUserId"]) ?? "").trim() === userId,
  )
  console.log(`\nTamamlandi. Toplam personel: ${refreshed.length}`)
}

main().catch((err) => {
  console.error(err?.response?.data ?? err.message ?? err)
  process.exit(1)
})
