import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import { getBusinessUserIdFromBody, getBusinessUserIdFromRequest, matchesBusinessUserId, requireBusinessUserId } from "@/lib/business-scope"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
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
    const found = entries.find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === candidate.toLowerCase().replace(/[^a-z0-9]/g, ""))
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return NextResponse.json({ ok: false, message: businessError }, { status: 400 })
    }

    const token = appConfig.token.personels
    if (!token) {
      return NextResponse.json({ ok: false, message: "personels token tanimli degil." }, { status: 500 })
    }

    const data = await selectByToken<any>(token)
    const rows = extractRows(data)
    const filteredRows = rows.filter((row: any) => matchesBusinessUserId(row, businessUserId))

    const acceptedInvitationRows: any[] = []
    if (appConfig.token.personel_invitations && appConfig.token.users && appConfig.token.individual_profiles) {
      const [invitationsData, usersData, profilesData] = await Promise.all([
        selectByToken<any>(appConfig.token.personel_invitations),
        selectByToken<any>(appConfig.token.users),
        selectByToken<any>(appConfig.token.individual_profiles),
      ])
      const invitations = extractRows(invitationsData)
      const users = extractRows(usersData)
      const profiles = extractRows(profilesData)

      for (const invitation of invitations) {
        const invitationBusinessId = String(getField(invitation, ["business_user_id", "businessUserId"]) ?? "").trim()
        const status = String(getField(invitation, ["status"]) ?? "").trim().toLowerCase()
        if (invitationBusinessId !== businessUserId || status !== "accepted") continue

        const individualUserId = String(getField(invitation, ["individual_user_id", "individualUserId"]) ?? "").trim()
        const user = users.find((row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === individualUserId)
        const profile = profiles.find((row) => String(getField(row, ["user_id", "userId"]) ?? "").trim() === individualUserId)
        if (!user || !profile) continue

        const firstName = String(getField(profile, ["first_name", "firstName"]) ?? "").trim()
        const lastName = String(getField(profile, ["last_name", "lastName"]) ?? "").trim()
        const fullName = `${firstName} ${lastName}`.trim()
        acceptedInvitationRows.push({
          id: `INV-${getField(invitation, ["id", "ID"]) ?? individualUserId}`,
          user_id: individualUserId,
          individual_user_id: individualUserId,
          business_user_id: businessUserId,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          phone: String(getField(user, ["phone"]) ?? ""),
          email: String(getField(user, ["email", "username"]) ?? ""),
          role: String(getField(profile, ["experience_years", "experienceYears"]) ?? ""),
          expertise: String(getField(profile, ["expertise"]) ?? ""),
          is_active: 1,
          hire_date: String(getField(invitation, ["accepted_at", "acceptedAt", "created_at", "createdAt"]) ?? ""),
        })
      }
    }

    return NextResponse.json({
      ok: true,
      rows: [...filteredRows, ...acceptedInvitationRows],
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Personeller getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const token = appConfig.token.personels
    if (!token) {
      return NextResponse.json({ ok: false, message: "personels token tanimli degil." }, { status: 500 })
    }

    const body = (await req.json().catch(() => null)) as
      | {
          name?: string
          businessUserId?: string | number
          phone?: string
          email?: string
          specialty?: string[]
          workingHours?: string
          startDate?: string
          status?: "aktif" | "pasif"
          experience?: string
          notes?: string
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return NextResponse.json({ ok: false, message: businessError }, { status: 400 })
    }

    const name = String(body?.name ?? "").trim()
    const phone = String(body?.phone ?? "").trim()
    if (!name || !phone) {
      return NextResponse.json({ ok: false, message: "Ad soyad ve telefon zorunlu." }, { status: 400 })
    }

    const parts = name.split(/\s+/).filter(Boolean)
    const firstName = sanitizeSqlString(parts[0] ?? name)
    const lastName = sanitizeSqlString(parts.slice(1).join(" "))
    const fullName = sanitizeSqlString(name)
    const phoneValue = sanitizeSqlString(phone)
    const emailValue = sanitizeSqlString(String(body?.email ?? "").trim())
    const role = sanitizeSqlString(String(body?.experience ?? "").trim())
    // Keep comma out of SQL value to avoid backend SQL parser column/value mismatch.
    const expertise = sanitizeSqlString(Array.isArray(body?.specialty) ? body!.specialty.join(" | ") : "")
    const isActive = body?.status === "pasif" ? 0 : 1
    const hireDate = sanitizeSqlString(String(body?.startDate ?? "").trim())
    const notes = sanitizeSqlString(String(body?.notes ?? "").trim())
    const workHours = String(body?.workingHours ?? "").trim()
    const [startTimeRaw, endTimeRaw] = workHours.split("-").map((v) => v.trim())
    const startTime = sanitizeSqlString(startTimeRaw ?? "")
    const endTime = sanitizeSqlString(endTimeRaw ?? "")

    const sql = `INSERT INTO personels (business_user_id, first_name, last_name, full_name, phone, email, role, expertise, is_active, hire_date, work_start_time, work_end_time, notes) VALUES (${businessUserId}, '${firstName}', ${lastName ? `'${lastName}'` : "NULL"}, '${fullName}', '${phoneValue}', ${emailValue ? `'${emailValue}'` : "NULL"}, ${role ? `'${role}'` : "NULL"}, ${expertise ? `'${expertise}'` : "NULL"}, ${isActive}, ${hireDate ? `'${hireDate}'` : "NULL"}, ${startTime ? `'${startTime}'` : "NULL"}, ${endTime ? `'${endTime}'` : "NULL"}, ${notes ? `'${notes}'` : "NULL"})`
    await sqlToken(token, sql)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Personel ekleme basarisiz.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

