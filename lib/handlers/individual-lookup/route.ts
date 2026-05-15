import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { INDIVIDUAL_NOT_AVAILABLE_MESSAGE, isIndividualEmployedElsewhere } from "@/lib/individual-employment"
import { selectByToken } from "@/lib/services/locofabric-database"
import { apiJson } from "@/lib/api-response"

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

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { firstName?: string; lastName?: string; email?: string; businessUserId?: string | number }
      | null

    const firstName = normalize(body?.firstName)
    const lastName = normalize(body?.lastName)
    const email = normalize(body?.email)
    const businessUserId = String(body?.businessUserId ?? "").trim()

    if (!firstName || !lastName || !email) {
      return apiJson({ ok: false, message: "Ad, soyad ve e-posta zorunlu." }, 400)
    }

    const userToken = appConfig.token.users
    const individualToken = appConfig.token.individual_profiles

    if (!userToken || !individualToken) {
      return apiJson({ ok: false, message: "Bireysel kullanici tokenlari tanimli degil." }, 500)
    }

    const invitationToken = appConfig.token.personel_invitations
    const personelsToken = appConfig.token.personels

    const [usersData, profilesData, invitationsData, personelsData] = await Promise.all([
      selectByToken<any>(userToken),
      selectByToken<any>(individualToken),
      invitationToken ? selectByToken<any>(invitationToken) : Promise.resolve([]),
      personelsToken ? selectByToken<any>(personelsToken) : Promise.resolve([]),
    ])

    const users = extractRows(usersData)
    const profiles = extractRows(profilesData)
    const invitations = extractRows(invitationsData)
    const personels = extractRows(personelsData)

    const match = profiles.find((profile) => {
      const profileFirstName = normalize(getField(profile, ["first_name", "firstName"]))
      const profileLastName = normalize(getField(profile, ["last_name", "lastName"]))
      if (profileFirstName !== firstName || profileLastName !== lastName) return false

      const userId = String(getField(profile, ["user_id", "userId"]) ?? "").trim()
      const user = users.find((row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === userId)
      const username = normalize(getField(user, ["username"]))
      const userEmail = normalize(getField(user, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]))
      const accountType = normalize(getField(user, ["account_type", "accountType"]))

      return accountType === "bireysel" && (username === email || userEmail === email)
    })

    if (!match) {
      return apiJson({ ok: false, message: INDIVIDUAL_NOT_AVAILABLE_MESSAGE }, 404)
    }

    const userId = String(getField(match, ["user_id", "userId"]) ?? "").trim()
    const user = users.find((row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === userId)
    const userEmail = normalize(
      getField(user, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]) ??
        getField(user, ["username"]) ??
        email,
    )

    if (
      isIndividualEmployedElsewhere(userId, userEmail, businessUserId, invitations, personels)
    ) {
      return apiJson({ ok: false, message: INDIVIDUAL_NOT_AVAILABLE_MESSAGE }, 409)
    }

    const expertise = String(getField(match, ["expertise"]) ?? "")

    return apiJson({
      ok: true,
      user: {
        userId,
        firstName: String(getField(match, ["first_name", "firstName"]) ?? ""),
        lastName: String(getField(match, ["last_name", "lastName"]) ?? ""),
        email: String(getField(user, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]) ?? getField(user, ["username"]) ?? ""),
        phone: String(getField(user, ["phone"]) ?? ""),
        experienceYears: String(getField(match, ["experience_years", "experienceYears"]) ?? ""),
        expertise: expertise.split("|").map((item) => item.trim()).filter(Boolean),
      },
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({ ok: false, message: "Bireysel kullanici aranirken hata olustu.", error: axiosErr?.message ?? String(err) }, 502)
  }
}
