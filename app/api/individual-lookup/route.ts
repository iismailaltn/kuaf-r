import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken } from "@/lib/services/locofabric-database"

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
      | { firstName?: string; lastName?: string; email?: string }
      | null

    const firstName = normalize(body?.firstName)
    const lastName = normalize(body?.lastName)
    const email = normalize(body?.email)

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { ok: false, message: "Ad, soyad ve e-posta zorunlu." },
        { status: 400 }
      )
    }

    const userToken = appConfig.token.users
    const individualToken = appConfig.token.individual_profiles

    if (!userToken || !individualToken) {
      return NextResponse.json(
        { ok: false, message: "Bireysel kullanici tokenlari tanimli degil." },
        { status: 500 }
      )
    }

    const [usersData, profilesData] = await Promise.all([
      selectByToken<any>(userToken),
      selectByToken<any>(individualToken),
    ])

    const users = extractRows(usersData)
    const profiles = extractRows(profilesData)

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
      return NextResponse.json(
        { ok: false, message: "Bu bilgilerle eslesen bireysel kullanici bulunamadi." },
        { status: 404 }
      )
    }

    const userId = String(getField(match, ["user_id", "userId"]) ?? "").trim()
    const user = users.find((row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === userId)
    const expertise = String(getField(match, ["expertise"]) ?? "")

    return NextResponse.json({
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
    return NextResponse.json(
      { ok: false, message: "Bireysel kullanici aranirken hata olustu.", error: axiosErr?.message ?? String(err) },
      { status: 502 }
    )
  }
}
