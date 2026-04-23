import { NextResponse } from "next/server"
import { appConfig } from "@/app.config"
import { selectByToken } from "@/lib/services/locofabric-database"
import bcrypt from "bcryptjs"
import type { AxiosError } from "axios"

function sanitizeSqlString(input: string) {
  // minimal escaping for single quotes; keep it simple for now
  return input.replace(/'/g, "''")
}

function getRowByEmail(rows: any[], loginInput: string) {
  const normalized = loginInput.trim().toLowerCase()
  const emailKeys = ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]

  for (const row of rows) {
    for (const key of emailKeys) {
      const v = row?.[key]
      if (typeof v === "string" && v.trim().toLowerCase() === normalized) {
        return row
      }
    }
  }

  return null
}

function getRowByAnyStringField(rows: any[], value: string) {
  const normalized = value.trim().toLowerCase()
  for (const row of rows) {
    if (!row || typeof row !== "object") continue
    for (const raw of Object.values(row as Record<string, unknown>)) {
      if (typeof raw === "string" && raw.trim().toLowerCase() === normalized) return row
    }
  }
  return null
}

function getField(row: any, candidates: string[]) {
  if (!row || typeof row !== "object") return undefined
  const entries = Object.entries(row as Record<string, unknown>)
  for (const candidate of candidates) {
    const direct = (row as Record<string, unknown>)[candidate]
    if (direct !== undefined && direct !== null) return direct
    const found = entries.find(([k]) => k.toLowerCase() === candidate.toLowerCase())
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

function extractRows(data: any): any[] {
  return Array.isArray((data as any)?.data) ? (data as any).data :
    Array.isArray((data as any)?.Data) ? (data as any).Data :
    Array.isArray(data) ? data :
    []
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { username?: string; password?: string }
      | null

    const username = (body?.username ?? "").trim()
    const password = (body?.password ?? "").trim()

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, message: "Kullanici adi ve sifre zorunlu." },
        { status: 400 }
      )
    }

    const token = appConfig.token.user
    if (!token) {
      return NextResponse.json(
        { ok: false, message: "user token tanimli degil." },
        { status: 500 }
      )
    }

    const u = sanitizeSqlString(username).toLowerCase()
    const data = await selectByToken<any>(token)
    const rows = extractRows(data)
    let row = null as any
    const isEmailLogin = username.includes("@")

    if (isEmailLogin) {
      row = getRowByEmail(rows, username)
      if (!row) row = getRowByAnyStringField(rows, username)
      if (!row) {
        row = rows.find((r) => {
          const usernameValue = String(getField(r, ["username", "userName", "kullanici_adi", "kullaniciAdi"]) ?? "").trim().toLowerCase()
          return usernameValue === u
        }) ?? null
      }
    } else {
      row = rows.find((r) => {
        const usernameValue = String(getField(r, ["username", "userName", "kullanici_adi", "kullaniciAdi"]) ?? "").trim().toLowerCase()
        const emailValue = String(getField(r, ["email", "e_mail", "eposta", "e_posta", "mail", "emailAddress", "email_address"]) ?? "").trim().toLowerCase()
        return usernameValue === u || emailValue === u
      }) ?? null
    }

    if (!row) {
      return NextResponse.json(
        { ok: false, message: "Giris basarisiz." },
        { status: 401 }
      )
    }

    const passwordHash = String(
      getField(row, ["password_hash", "passwordHash", "password", "sifre", "sifre_hash"]) ?? ""
    ).trim()

    if (!passwordHash) {
      return NextResponse.json(
        { ok: false, message: "Kullanici sifresi bulunamadi." },
        { status: 500 }
      )
    }

    const looksLikeBcrypt = passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$")
    const ok = looksLikeBcrypt ? await bcrypt.compare(password, passwordHash) : password === passwordHash

    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "Giris basarisiz." },
        { status: 401 }
      )
    }

    // Don't leak password hash to client
    if ("password_hash" in row) delete row.password_hash
    if ("passwordHash" in row) delete row.passwordHash

    return NextResponse.json({
      ok: true,
      user: row,
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as any)?.response?.status
    const data = (axiosErr as any)?.response?.data

    return NextResponse.json(
      {
        ok: false,
        message: "Kullanici verisi alinmadi.",
        serverURL: appConfig.serverURL,
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

