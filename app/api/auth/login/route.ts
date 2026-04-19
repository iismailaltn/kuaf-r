import { NextResponse } from "next/server"
import { appConfig } from "@/app.config"
import { sqlToken } from "@/lib/services/locofabric-database"
import bcrypt from "bcryptjs"
import type { AxiosError } from "axios"

function sanitizeSqlString(input: string) {
  // minimal escaping for single quotes; keep it simple for now
  return input.replace(/'/g, "''")
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

    const u = sanitizeSqlString(username)
    const emailOrUsernameWhere = `username='${u}' OR email='${u}'`

    // NOTE: table name based on token claim (users).
    const sql = `SELECT * FROM users WHERE (${emailOrUsernameWhere}) LIMIT 1`

    const data = await sqlToken<any>(token, sql)
    const row =
      Array.isArray((data as any)?.data) ? (data as any).data[0] :
      Array.isArray((data as any)?.Data) ? (data as any).Data[0] :
      Array.isArray(data) ? data[0] :
      null

    if (!row) {
      return NextResponse.json(
        { ok: false, message: "Giris basarisiz." },
        { status: 401 }
      )
    }

    const passwordHash =
      String(
        row.password_hash ??
        row.passwordHash ??
        ""
      )

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
        message: "SQLToken istegi basarisiz.",
        serverURL: appConfig.serverURL,
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}

