import axios from "axios"

function getApiBaseUrl() {
  const custom = process.env.WHATSAPP_LOCOFABRIC_API_URL?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (custom) {
    return custom.replace(/\/+$/, "")
  }
  const server = (process.env.NEXT_PUBLIC_SERVER_URL ?? process.env.SERVER_URL ?? "https://server.hstplanet.com").replace(
    /\/+$/,
    "",
  )
  return `${server}/api`
}

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

export async function sqlToken<T = unknown>(token: string, sql: string) {
  const { data } = await axios.post<T>(`${getApiBaseUrl()}/Database/SQLToken`, { token, sql })
  return data
}

export async function selectByToken<T = unknown>(token: string) {
  const { data } = await axios.get<T>(`${getApiBaseUrl()}/Database/Select`, {
    params: { token },
  })
  return data
}

export function sqlJsonLiteralForInsert(value: unknown) {
  const json =
    typeof Buffer !== "undefined"
      ? Buffer.from(JSON.stringify(value), "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(JSON.stringify(value))))
  return `'${json.replace(/'/g, "''")}'`
}

export function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

export function sqlNullableString(value: string) {
  const trimmed = value.trim()
  return trimmed ? `'${sanitizeSqlString(trimmed)}'` : "NULL"
}

export function sqlReservationDateLiteral(date: string) {
  const trimmed = date.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `'${trimmed}'`
  }
  return `'${sanitizeSqlString(trimmed)}'`
}
