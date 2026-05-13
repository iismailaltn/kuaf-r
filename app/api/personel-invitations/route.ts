import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

function sqlString(value: string) {
  return `'${sanitizeSqlString(value)}'`
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

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

function isNumericId(value: string) {
  return /^\d+$/.test(value)
}

async function loadInvitationContext() {
  const invitationToken = appConfig.token.personel_invitations
  const userToken = appConfig.token.users
  const individualToken = appConfig.token.individual_profiles
  const corporateToken = appConfig.token.corporate_profiles

  if (!invitationToken || !userToken || !individualToken || !corporateToken) {
    throw new Error("Davet tokenlari tanimli degil.")
  }

  const [invitationsData, usersData, individualsData, corporatesData] = await Promise.all([
    selectByToken<any>(invitationToken),
    selectByToken<any>(userToken),
    selectByToken<any>(individualToken),
    selectByToken<any>(corporateToken),
  ])

  return {
    invitationToken,
    invitations: extractRows(invitationsData),
    users: extractRows(usersData),
    individuals: extractRows(individualsData),
    corporates: extractRows(corporatesData),
  }
}

function findByUserId(rows: any[], userId: string) {
  return rows.find((row) => String(getField(row, ["user_id", "userId"]) ?? "").trim() === userId)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const individualUserId = String(url.searchParams.get("individualUserId") ?? "").trim()

    if (!isNumericId(individualUserId)) {
      return NextResponse.json({ ok: false, message: "Gecersiz bireysel kullanici id." }, { status: 400 })
    }

    const { invitations, corporates } = await loadInvitationContext()
    const rows = invitations
      .filter((invitation) => {
        const targetId = String(getField(invitation, ["individual_user_id", "individualUserId"]) ?? "").trim()
        const status = normalize(getField(invitation, ["status"]))
        return targetId === individualUserId && status === "pending"
      })
      .map((invitation) => {
        const businessUserId = String(getField(invitation, ["business_user_id", "businessUserId"]) ?? "").trim()
        const corporate = findByUserId(corporates, businessUserId)

        return {
          id: String(getField(invitation, ["id", "ID"]) ?? ""),
          businessUserId,
          businessName: String(getField(corporate, ["business_name", "businessName"]) ?? "Isletme"),
        }
      })

    return NextResponse.json({ ok: true, rows })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return NextResponse.json(
      { ok: false, message: "Davetler getirilemedi.", error: axiosErr?.message ?? String(err) },
      { status: 502 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { action?: "create" | "accept"; businessUserId?: string | number; businessUsername?: string; individualUserId?: string | number; invitationId?: string | number }
      | null
    const action = body?.action
    const { invitationToken, invitations, users, individuals } = await loadInvitationContext()

    if (action === "create") {
      let businessUserId = String(body?.businessUserId ?? "").trim()
      const businessUsername = normalize(body?.businessUsername)
      const individualUserId = String(body?.individualUserId ?? "").trim()

      if (!isNumericId(businessUserId) && businessUsername) {
        const businessUser = users.find((user) => {
          const username = normalize(getField(user, ["username"]))
          const email = normalize(getField(user, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]))
          const accountType = normalize(getField(user, ["account_type", "accountType"]))
          return (username === businessUsername || email === businessUsername) && accountType === "kurumsal"
        })
        businessUserId = String(getField(businessUser, ["id", "ID", "user_id", "userId"]) ?? "").trim()
      }

      if (!isNumericId(businessUserId) || !isNumericId(individualUserId)) {
        return NextResponse.json({ ok: false, message: "Davet icin kullanici id bilgisi eksik." }, { status: 400 })
      }

      const alreadyExists = invitations.some((invitation) => {
        const existingBusinessId = String(getField(invitation, ["business_user_id", "businessUserId"]) ?? "").trim()
        const existingIndividualId = String(getField(invitation, ["individual_user_id", "individualUserId"]) ?? "").trim()
        const status = normalize(getField(invitation, ["status"]))
        return existingBusinessId === businessUserId && existingIndividualId === individualUserId && status === "pending"
      })

      if (alreadyExists) {
        return NextResponse.json({ ok: true, message: "Bu personel icin zaten bekleyen davet var." })
      }

      await sqlToken(
        invitationToken,
        `INSERT INTO personel_invitations (business_user_id, individual_user_id, status) VALUES (${businessUserId}, ${individualUserId}, 'pending')`
      )

      return NextResponse.json({ ok: true })
    }

    if (action === "accept") {
      const invitationId = String(body?.invitationId ?? "").trim()
      if (!isNumericId(invitationId)) {
        return NextResponse.json({ ok: false, message: "Gecersiz davet id." }, { status: 400 })
      }

      const invitation = invitations.find((row) => String(getField(row, ["id", "ID"]) ?? "").trim() === invitationId)
      if (!invitation || normalize(getField(invitation, ["status"])) !== "pending") {
        return NextResponse.json({ ok: false, message: "Bekleyen davet bulunamadi." }, { status: 404 })
      }

      const individualUserId = String(getField(invitation, ["individual_user_id", "individualUserId"]) ?? "").trim()
      const user = users.find((row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === individualUserId)
      const profile = findByUserId(individuals, individualUserId)

      if (!user || !profile) {
        return NextResponse.json({ ok: false, message: "Bireysel kullanici bilgisi bulunamadi." }, { status: 404 })
      }

      const firstName = String(getField(profile, ["first_name", "firstName"]) ?? "").trim()
      const lastName = String(getField(profile, ["last_name", "lastName"]) ?? "").trim()
      const fullName = `${firstName} ${lastName}`.trim()
      const phone = String(getField(user, ["phone"]) ?? "").trim()
      const email = String(getField(user, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]) ?? getField(user, ["username"]) ?? "").trim()
      const expertise = String(getField(profile, ["expertise"]) ?? "").trim()
      const experienceYears = String(getField(profile, ["experience_years", "experienceYears"]) ?? "").trim()
      const hireDate = new Date().toISOString().slice(0, 10)

      await sqlToken(
        appConfig.token.personels,
        `INSERT INTO personels (business_user_id, first_name, last_name, full_name, phone, email, role, expertise, is_active, hire_date) VALUES (${String(getField(invitation, ["business_user_id", "businessUserId"]) ?? "").trim()}, ${sqlString(firstName)}, ${lastName ? sqlString(lastName) : "NULL"}, ${sqlString(fullName)}, ${phone ? sqlString(phone) : "NULL"}, ${email ? sqlString(email) : "NULL"}, ${experienceYears ? sqlString(`${experienceYears} yil`) : "NULL"}, ${expertise ? sqlString(expertise) : "NULL"}, 1, ${sqlString(hireDate)})`
      )

      await sqlToken(
        invitationToken,
        `UPDATE personel_invitations SET status = 'accepted', accepted_at = ${sqlString(new Date().toISOString())} WHERE id = ${invitationId}`
      )

      return NextResponse.json({
        ok: true,
        businessUserId: String(getField(invitation, ["business_user_id", "businessUserId"]) ?? "").trim(),
      })
    }

    return NextResponse.json({ ok: false, message: "Gecersiz davet islemi." }, { status: 400 })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return NextResponse.json(
      { ok: false, message: "Davet islemi tamamlanamadi.", error: axiosErr?.message ?? String(err) },
      { status: 502 }
    )
  }
}
