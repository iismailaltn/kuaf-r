import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { isValidBusinessUserId } from "@/lib/business-scope"
import {
  EXPERTISE_ONBOARDING_SKIP,
  isExpertiseSetupComplete,
  isIndividualAccountType,
  needsExpertiseOnboarding,
  parseExpertiseList,
  serializeExpertiseList,
} from "@/lib/individual-expertise"
import { extractRows, selectAllByToken, sqlToken } from "@/lib/services/locofabric-database"
import { apiJson } from "@/lib/api-response"
import { sqlNullableString } from "@/lib/sql-sanitize"

function getField(row: Record<string, unknown> | null | undefined, candidates: string[]) {
  if (!row || typeof row !== "object") return undefined
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const direct = row[candidate]
    if (direct !== undefined && direct !== null) return direct
    const found = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

function findByUserId(rows: Record<string, unknown>[], userId: string) {
  return rows.find((row) => String(getField(row, ["user_id", "userId"]) ?? "").trim() === userId) ?? null
}

async function loadUserById(userToken: string, userId: string) {
  try {
    const data = await sqlToken<unknown>(userToken, `SELECT * FROM users WHERE id=${userId}`)
    const rows = extractRows(data)
    if (rows.length > 0) {
      return rows[0]
    }
  } catch {
    // SQL sorgusu basarisizsa tum listeye dus
  }

  const data = await selectAllByToken<unknown>(userToken, "users")
  return (
    extractRows(data).find(
      (row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === userId,
    ) ?? null
  )
}

async function loadIndividualProfileByUserId(individualToken: string, userId: string) {
  try {
    const data = await sqlToken<unknown>(
      individualToken,
      `SELECT * FROM individual_profiles WHERE user_id=${userId}`,
    )
    const rows = extractRows(data)
    if (rows.length > 0) {
      return rows[0]
    }
  } catch {
    // SQL sorgusu basarisizsa tum listeye dus
  }

  const data = await selectAllByToken<unknown>(individualToken, "individual_profiles")
  return findByUserId(extractRows(data), userId)
}

export async function GET(req: Request) {
  try {
    const userId = String(new URL(req.url).searchParams.get("userId") ?? "").trim()
    if (!isValidBusinessUserId(userId)) {
      return apiJson({ ok: false, message: "Kullanici bilgisi zorunlu." }, 400)
    }

    const userToken = appConfig.token.users
    if (!userToken) {
      return apiJson({ ok: false, message: "users token tanimli degil." }, 500)
    }

    const user = await loadUserById(userToken, userId)

    if (!user) {
      return apiJson({ ok: false, message: "Kullanici bulunamadi." }, 404)
    }

    const accountType = String(getField(user, ["account_type", "accountType"]) ?? "").trim().toLowerCase()
    const phone = String(getField(user, ["phone"]) ?? "").trim()
    const email = String(
      getField(user, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]) ??
        getField(user, ["username"]) ??
        "",
    ).trim()

    let firstName = ""
    let lastName = ""
    let companyName = ""
    let expertiseRaw = ""

    if (isIndividualAccountType(accountType)) {
      const individualToken = appConfig.token.individual_profiles
      if (individualToken) {
        const profile = await loadIndividualProfileByUserId(individualToken, userId)
        firstName = String(getField(profile, ["first_name", "firstName"]) ?? "").trim()
        lastName = String(getField(profile, ["last_name", "lastName"]) ?? "").trim()
        expertiseRaw = String(getField(profile, ["expertise"]) ?? "").trim()
      }
    } else if (accountType === "kurumsal") {
      const corporateToken = appConfig.token.corporate_profiles
      if (corporateToken) {
        const profilesData = await selectAllByToken<unknown>(corporateToken, "corporate_profiles")
        const profile = findByUserId(extractRows(profilesData), userId)
        firstName = String(getField(profile, ["owner_first_name", "ownerFirstName"]) ?? "").trim()
        lastName = String(getField(profile, ["owner_last_name", "ownerLastName"]) ?? "").trim()
        companyName = String(getField(profile, ["business_name", "businessName"]) ?? "").trim()
      }
    }

    return apiJson({
      ok: true,
      profile: {
        firstName,
        lastName,
        phone,
        email,
        companyName,
        expertise: parseExpertiseList(expertiseRaw),
        needsExpertiseOnboarding: isIndividualAccountType(accountType) && needsExpertiseOnboarding(expertiseRaw),
        expertiseOnboardingComplete: !isIndividualAccountType(accountType) || isExpertiseSetupComplete(expertiseRaw),
      },
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson(
      { ok: false, message: "Profil bilgileri getirilemedi.", error: axiosErr?.message ?? String(err) },
      { status: 502 },
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          userId?: string | number
          specialty?: string[]
          skipExpertiseOnboarding?: boolean
        }
      | null

    const userId = String(body?.userId ?? "").trim()
    if (!isValidBusinessUserId(userId)) {
      return apiJson({ ok: false, message: "Kullanici bilgisi zorunlu." }, 400)
    }

    const individualToken = appConfig.token.individual_profiles
    if (!individualToken) {
      return apiJson({ ok: false, message: "individual_profiles token tanimli degil." }, 500)
    }

    let expertiseValue = ""
    if (body?.skipExpertiseOnboarding) {
      expertiseValue = EXPERTISE_ONBOARDING_SKIP
    } else if (Array.isArray(body?.specialty)) {
      expertiseValue = serializeExpertiseList(body.specialty)
      if (!expertiseValue) {
        return apiJson({ ok: false, message: "En az bir uzmanlik alani secin." }, 400)
      }
    } else {
      return apiJson({ ok: false, message: "Uzmanlik alanlari veya atlama bilgisi zorunlu." }, 400)
    }

    const expertiseSql = sqlNullableString(expertiseValue)
    const userIdSql = /^\d+$/.test(userId) ? userId : `'${userId.replace(/'/g, "''")}'`
    await sqlToken(
      individualToken,
      `UPDATE individual_profiles SET expertise=${expertiseSql} WHERE user_id=${userIdSql}`,
    )

    return apiJson({
      ok: true,
      expertise: parseExpertiseList(expertiseValue),
      needsExpertiseOnboarding: false,
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson(
      { ok: false, message: "Profil guncellenemedi.", error: axiosErr?.message ?? String(err) },
      { status: 502 },
    )
  }
}
