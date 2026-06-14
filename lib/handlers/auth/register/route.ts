import bcrypt from "bcryptjs"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import { apiJson } from "@/lib/api-response"
import { digitsOnly, isValidEmail, validateRegisterFields } from "@/lib/auth-field-validation"

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

function normalizeLoginValue(value: string) {
  return value.trim().toLowerCase()
}

function getRowUsername(row: any) {
  return normalizeLoginValue(String(getField(row, ["username", "userName", "kullanici_adi", "kullaniciAdi"]) ?? ""))
}

function getRowEmail(row: any) {
  return normalizeLoginValue(
    String(getField(row, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]) ?? "")
  )
}

function findUserByEmail(rows: any[], email: string) {
  const normalizedEmail = normalizeLoginValue(email)
  if (!normalizedEmail.includes("@")) return null

  return (
    rows.find((row) => {
      const rowEmail = getRowEmail(row)
      const rowUsername = getRowUsername(row)
      return rowEmail === normalizedEmail || rowUsername === normalizedEmail
    }) ?? null
  )
}

function findUserByUsername(rows: any[], username: string) {
  const normalizedUsername = normalizeLoginValue(username)
  if (!normalizedUsername || normalizedUsername.includes("@")) return null

  return rows.find((row) => getRowUsername(row) === normalizedUsername) ?? null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RegisterBody | null

    const accountType = body?.accountType
    const loginInput = String(body?.email ?? "").trim()
    const normalizedLogin = normalizeLoginValue(loginInput)
    const isEmailSignup = normalizedLogin.includes("@")
    let username = normalizedLogin
    let email = ""
    const phone = digitsOnly(String(body?.phone ?? ""), 11)
    const password = String(body?.password ?? "").trim()
    const firstName = String(body?.firstName ?? "").trim()
    const lastName = String(body?.lastName ?? "").trim()
    const businessName = String(body?.shopName ?? "").trim()
    const taxOffice = String(body?.taxOffice ?? "").trim()
    const taxNumber = digitsOnly(String(body?.taxNumber ?? ""), 11)

    if (accountType !== "personel" && accountType !== "customer") {
      return apiJson({ ok: false, message: "Hesap tipi gecersiz." }, 400)
    }

    if (!normalizedLogin || !phone || !password || !firstName || !lastName) {
      return apiJson({ ok: false, message: "Kullanici adi veya e-posta, telefon, sifre, ad ve soyad zorunlu." }, 400)
    }

    if (isEmailSignup) {
      if (!isValidEmail(normalizedLogin)) {
        return apiJson({ ok: false, message: "Gecerli bir e-posta adresi girin." }, 400)
      }
      email = normalizedLogin
    }

    const fieldValidationError = validateRegisterFields({
      email: normalizedLogin,
      phone,
      password,
      taxNumber: accountType === "customer" ? taxNumber : undefined,
      accountType,
    })
    if (fieldValidationError) {
      return apiJson({ ok: false, message: fieldValidationError }, 400)
    }

    if (accountType === "customer" && (!businessName || !taxOffice || !taxNumber)) {
      return apiJson({ ok: false, message: "Isletme adi, vergi dairesi ve vergi numarasi zorunlu." }, 400)
    }

    const userToken = appConfig.token.users
    const individualToken = appConfig.token.individual_profiles
    const corporateToken = appConfig.token.corporate_profiles

    if (!userToken || !individualToken || !corporateToken) {
      return apiJson({ ok: false, message: "Kullanici profil tokenlari tanimli degil." }, 500)
    }

    const usersData = await selectByToken<any>(userToken)
    const users = extractRows(usersData)

    if (isEmailSignup) {
      if (findUserByEmail(users, email)) {
        return apiJson({ ok: false, message: "Bu e-posta zaten kullaniliyor." }, 409)
      }
    } else if (findUserByUsername(users, username)) {
      return apiJson({ ok: false, message: "Bu kullanici adi zaten kullaniliyor." }, 409)
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const databaseAccountType = accountType === "personel" ? "bireysel" : "kurumsal"

    const isActive = accountType === "customer" ? 0 : 1
    const userSql = `INSERT INTO users (username, email, phone, password_hash, account_type, role, is_active) VALUES (${sqlString(username)}, ${isEmailSignup ? sqlString(email) : sqlNullableString(email)}, ${sqlString(phone)}, ${sqlString(passwordHash)}, ${sqlString(databaseAccountType)}, 'user', ${isActive})`
    await sqlToken(userToken, userSql)

    const updatedUsersData = await selectByToken<any>(userToken)
    const createdUser = isEmailSignup
      ? findUserByEmail(extractRows(updatedUsersData), email)
      : findUserByUsername(extractRows(updatedUsersData), username)
    const userId = String(getField(createdUser, ["id", "ID", "user_id", "userId"]) ?? "").trim()

    if (!userId) {
      return apiJson({ ok: false, message: "Kullanici olusturuldu fakat id alinamadi." }, 502)
    }

    if (accountType === "personel") {
      const experienceYears = Number.parseInt(String(body?.experience ?? ""), 10)
      const experienceValue = Number.isFinite(experienceYears) ? String(experienceYears) : "NULL"
      const profileSql = `INSERT INTO individual_profiles (user_id, first_name, last_name, experience_years, expertise) VALUES (${userId}, ${sqlString(firstName)}, ${sqlString(lastName)}, ${experienceValue}, NULL)`
      await sqlToken(individualToken, profileSql)
    } else {
      const profileSql = `INSERT INTO corporate_profiles (user_id, business_name, owner_first_name, owner_last_name, tax_office, tax_number) VALUES (${userId}, ${sqlString(businessName)}, ${sqlString(firstName)}, ${sqlString(lastName)}, ${sqlString(taxOffice)}, ${sqlString(taxNumber)})`
      await sqlToken(corporateToken, profileSql)
    }

    return apiJson({
      ok: true,
      user: {
        id: userId,
        username,
        shopName: accountType === "customer" ? String(body?.shopName ?? "").trim() : `${firstName} ${lastName}`.trim(),
        role: "user",
        accountType: databaseAccountType,
        isActive: isActive === 1,
        businessUserId: accountType === "customer" ? userId : "",
        needsExpertiseOnboarding: accountType === "personel",
      },
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data

    return apiJson({
        ok: false,
        message: "Kayit olusturulamadi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      }, 502)
  }
}
