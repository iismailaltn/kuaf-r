import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

export async function GET() {
  try {
    const token = appConfig.token.personels
    if (!token) {
      return NextResponse.json({ ok: false, message: "personels token tanimli degil." }, { status: 500 })
    }

    const data = await selectByToken<any>(token)
    const rows =
      Array.isArray((data as any)?.data) ? (data as any).data :
      Array.isArray((data as any)?.Data) ? (data as any).Data :
      Array.isArray(data) ? data :
      []

    return NextResponse.json({ ok: true, rows })
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

    const sql = `INSERT INTO personels (first_name, last_name, full_name, phone, email, role, expertise, is_active, hire_date, work_start_time, work_end_time, notes) VALUES ('${firstName}', ${lastName ? `'${lastName}'` : "NULL"}, '${fullName}', '${phoneValue}', ${emailValue ? `'${emailValue}'` : "NULL"}, ${role ? `'${role}'` : "NULL"}, ${expertise ? `'${expertise}'` : "NULL"}, ${isActive}, ${hireDate ? `'${hireDate}'` : "NULL"}, ${startTime ? `'${startTime}'` : "NULL"}, ${endTime ? `'${endTime}'` : "NULL"}, ${notes ? `'${notes}'` : "NULL"})`
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

