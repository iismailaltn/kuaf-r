import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"

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

function isActiveValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

export async function GET() {
  try {
    const userToken = appConfig.token.users
    const corporateToken = appConfig.token.corporate_profiles

    if (!userToken || !corporateToken) {
      return NextResponse.json({ ok: false, message: "Kurumsal onay tokenlari tanimli degil." }, { status: 500 })
    }

    const [usersData, corporateData] = await Promise.all([
      selectByToken<any>(userToken),
      selectByToken<any>(corporateToken),
    ])

    const users = extractRows(usersData)
    const corporateProfiles = extractRows(corporateData)

    const rows = corporateProfiles.map((profile) => {
      const userId = String(getField(profile, ["user_id", "userId"]) ?? "").trim()
      const user = users.find((row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === userId)
      const role = String(getField(user, ["role"]) ?? "user").trim().toLowerCase()
      const accountType = String(getField(user, ["account_type", "accountType"]) ?? "").trim().toLowerCase()
      const isActive = isActiveValue(getField(user, ["is_active", "isActive"]))

      return {
        userId,
        username: String(getField(user, ["username"]) ?? ""),
        phone: String(getField(user, ["phone"]) ?? ""),
        role,
        accountType,
        isActive,
        businessName: String(getField(profile, ["business_name", "businessName"]) ?? ""),
        ownerFirstName: String(getField(profile, ["owner_first_name", "ownerFirstName"]) ?? ""),
        ownerLastName: String(getField(profile, ["owner_last_name", "ownerLastName"]) ?? ""),
        taxOffice: String(getField(profile, ["tax_office", "taxOffice"]) ?? ""),
        taxNumber: String(getField(profile, ["tax_number", "taxNumber"]) ?? ""),
      }
    }).filter((row) => row.userId && row.accountType === "kurumsal" && row.role !== "admin")

    return NextResponse.json({ ok: true, rows })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return NextResponse.json(
      { ok: false, message: "Kurumsal kayitlar getirilemedi.", error: axiosErr?.message ?? String(err) },
      { status: 502 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { userId?: string | number } | null
    const userId = String(body?.userId ?? "").trim()

    if (!/^\d+$/.test(userId)) {
      return NextResponse.json({ ok: false, message: "Gecersiz kullanici id." }, { status: 400 })
    }

    const userToken = appConfig.token.users
    if (!userToken) {
      return NextResponse.json({ ok: false, message: "users token tanimli degil." }, { status: 500 })
    }

    await sqlToken(userToken, `UPDATE users SET is_active = 1, role = 'admin' WHERE id = ${userId}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return NextResponse.json(
      { ok: false, message: "Kurumsal kayit onaylanamadi.", error: axiosErr?.message ?? String(err) },
      { status: 502 }
    )
  }
}
