import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"

type RegisterAccountType = "personel" | "customer"

interface RegisterBody {
  accountType?: RegisterAccountType
  shopName?: string
  ownerName?: string
  firstName?: string
  lastName?: string
  taxOffice?: string
  taxNumber?: string
  email?: string
  phone?: string
  password?: string
  specialty?: string[]
  experience?: string
}

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

function sqlString(value: string) {
  return `'${sanitizeSqlString(value)}'`
}

function sqlNullableString(value: string) {
  const trimmed = value.trim()
  return trimmed ? sqlString(trimmed) : "NULL"
}

function extractRows(data: any): any[] {
  return Array.isArray((data as any)?.data) ? (data as any).data :
    Array.isArray((data as any)?.Data) ? (data as any).Data :
    Array.isArray(data) ? data :
    []
}

function getField(row: any, candidates: string[]) {
  if (!row || typeof row !== "object") return undefined
  const entries = Object.entries(row as Record<string, unknown>)
  for (const candidate of candidates) {
    const direct = (row as Record<string, unknown>)[candidate]
    if (direct !== undefined && direct !== null) return direct
    const found = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

function findUserByUsernameOrEmail(rows: any[], username: string, email: string) {
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedEmail = email.trim().toLowerCase()

  return rows.find((row) => {
    const rowUsername = String(getField(row, ["username", "userName", "kullanici_adi", "kullaniciAdi"]) ?? "").trim().toLowerCase()
    const rowEmail = String(getField(row, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]) ?? "").trim().toLowerCase()

    return rowUsername === normalizedUsername || (!!normalizedEmail && rowEmail === normalizedEmail)
  }) ?? null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RegisterBody | null

    const accountType = body?.accountType
    const username = String(body?.email ?? "").trim().toLowerCase()
    const email = username.includes("@") ? username : ""
    const phone = String(body?.phone ?? "").trim()
    const password = String(body?.password ?? "").trim()
    const firstName = String(body?.firstName ?? "").trim()
    const lastName = String(body?.lastName ?? "").trim()
    const businessName = String(body?.shopName ?? "").trim()
    const taxOffice = String(body?.taxOffice ?? "").trim()
    const taxNumber = String(body?.taxNumber ?? "").trim()

    if (accountType !== "personel" && accountType !== "customer") {
      return NextResponse.json({ ok: false, message: "Hesap tipi gecersiz." }, { status: 400 })
    }

    if (!username || !phone || !password || !firstName || !lastName) {
      return NextResponse.json(
        { ok: false, message: "Kullanici adi, telefon, sifre, ad ve soyad zorunlu." },
        { status: 400 }
      )
    }

    if (accountType === "customer" && (!businessName || !taxOffice || !taxNumber)) {
      return NextResponse.json(
        { ok: false, message: "Isletme adi, vergi dairesi ve vergi numarasi zorunlu." },
        { status: 400 }
      )
    }

    const userToken = appConfig.token.users
    const individualToken = appConfig.token.individual_profiles
    const corporateToken = appConfig.token.corporate_profiles

    if (!userToken || !individualToken || !corporateToken) {
      return NextResponse.json(
        { ok: false, message: "Kullanici profil tokenlari tanimli degil." },
        { status: 500 }
      )
    }

    const usersData = await selectByToken<any>(userToken)
    const users = extractRows(usersData)
    if (findUserByUsernameOrEmail(users, username, email)) {
      return NextResponse.json(
        { ok: false, message: "Bu kullanici adi veya e-posta zaten kayitli." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const databaseAccountType = accountType === "personel" ? "bireysel" : "kurumsal"

    const isActive = accountType === "customer" ? 0 : 1
    const userSql = `INSERT INTO users (username, email, phone, password_hash, account_type, role, is_active) VALUES (${sqlString(username)}, ${sqlNullableString(email)}, ${sqlString(phone)}, ${sqlString(passwordHash)}, ${sqlString(databaseAccountType)}, 'user', ${isActive})`
    await sqlToken(userToken, userSql)

    const updatedUsersData = await selectByToken<any>(userToken)
    const createdUser = findUserByUsernameOrEmail(extractRows(updatedUsersData), username, email)
    const userId = String(getField(createdUser, ["id", "ID", "user_id", "userId"]) ?? "").trim()

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "Kullanici olusturuldu fakat id alinamadi." },
        { status: 502 }
      )
    }

    if (accountType === "personel") {
      const experienceYears = Number.parseInt(String(body?.experience ?? ""), 10)
      const experienceValue = Number.isFinite(experienceYears) ? String(experienceYears) : "NULL"
      const expertise = Array.isArray(body?.specialty) ? body.specialty.join(" | ") : ""
      const profileSql = `INSERT INTO individual_profiles (user_id, first_name, last_name, experience_years, expertise) VALUES (${userId}, ${sqlString(firstName)}, ${sqlString(lastName)}, ${experienceValue}, ${sqlNullableString(expertise)})`
      await sqlToken(individualToken, profileSql)
    } else {
      const profileSql = `INSERT INTO corporate_profiles (user_id, business_name, owner_first_name, owner_last_name, tax_office, tax_number) VALUES (${userId}, ${sqlString(businessName)}, ${sqlString(firstName)}, ${sqlString(lastName)}, ${sqlString(taxOffice)}, ${sqlString(taxNumber)})`
      await sqlToken(corporateToken, profileSql)
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        username,
        shopName: accountType === "customer" ? String(body?.shopName ?? "").trim() : `${firstName} ${lastName}`.trim(),
        role: "user",
        accountType: databaseAccountType,
        isActive: isActive === 1,
      },
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data

    return NextResponse.json(
      {
        ok: false,
        message: "Kayit olusturulamadi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}
