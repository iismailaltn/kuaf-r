import { createAxios } from "@/lib/api/axios"

export function extractRows<T = Record<string, unknown>>(data: unknown): T[] {
  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: T[] }).data
  }
  if (Array.isArray((data as { Data?: unknown })?.Data)) {
    return (data as { Data: T[] }).Data
  }
  if (Array.isArray(data)) {
    return data as T[]
  }
  const single = (data as { data?: T })?.data ?? (data as { Data?: T })?.Data
  if (single && typeof single === "object" && !Array.isArray(single)) {
    return [single]
  }
  return []
}

function decodeJwtPayload(token: string) {
  const parts = token.split(".")
  if (parts.length < 2) {
    return null
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
  const json =
    typeof Buffer !== "undefined"
      ? Buffer.from(padded, "base64").toString("utf8")
      : decodeURIComponent(
          Array.from(atob(padded), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
        )
  return JSON.parse(json) as { Table?: string; table?: string }
}

function getTableNameFromToken(token: string) {
  try {
    const payload = decodeJwtPayload(token)
    const table = String(payload?.Table ?? payload?.table ?? "").trim()
    if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) {
      return null
    }
    return table
  } catch {
    return null
  }
}

export function getSqlTokenError(data: unknown) {
  if (!data || typeof data !== "object") {
    return null
  }

  const record = data as Record<string, unknown>
  const error = String(record.error ?? "").trim()
  return error || null
}

export function isSqlTokenSuccess(data: unknown) {
  const error = getSqlTokenError(data)
  if (error) {
    return false
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>
    if (record.success === false) {
      return false
    }
    if (typeof record.updated === "number") {
      return record.updated > 0
    }
    if (typeof record.inserted === "number") {
      return record.inserted > 0
    }
  }

  return true
}

export async function sqlToken<T = unknown>(token: string, sql: string) {
  const axios = createAxios()
  const { data } = await axios.post<T>("Database/SQLToken", { token, sql })
  return data
}

/** SQLToken yanitinda error varsa veya UPDATE 0 satir ise hata firlatir. */
export async function sqlTokenChecked<T = unknown>(token: string, sql: string) {
  const data = await sqlToken<T>(token, sql)
  const error = getSqlTokenError(data)
  if (error) {
    throw new Error(error)
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>
    if (record.success === false) {
      throw new Error(String(record.message ?? "SQL islemi basarisiz."))
    }
    if (typeof record.updated === "number" && record.updated <= 0) {
      throw new Error("Guncellenecek kayit bulunamadi.")
    }
  }

  return data
}

/** Locofabric Select API genelde ilk 20 kaydi dondurur. */
export async function selectByToken<T = unknown>(token: string) {
  const axios = createAxios()
  const { data } = await axios.get<T>(`Database/Select?token=${encodeURIComponent(token)}`)
  return data
}

/**
 * Tablodaki tum kayitlari ceker (SQLToken SELECT *).
 * Token JWT icindeki Table adini kullanir; yoksa fallbackTable verin.
 */
export async function selectAllByToken<T = unknown>(token: string, fallbackTable?: string) {
  const table = getTableNameFromToken(token) ?? fallbackTable?.trim()
  if (table && /^[a-zA-Z0-9_]+$/.test(table)) {
    try {
      return await sqlToken<T>(token, `SELECT * FROM ${table}`)
    } catch {
      // Select'e dus
    }
  }
  return selectByToken<T>(token)
}
