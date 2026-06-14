/** Locofabric SQLToken INSERT parser virgul ve cift tirnak icindeki degerleri bozar. */
export function sanitizeSqlString(input: string) {
  return String(input ?? "")
    .replace(/'/g, "''")
    .replace(/[\r\n]+/g, " ")
    .replace(/"/g, "")
    .replace(/,/g, " ")
    .trim()
}

export function sqlNullableString(value: string | null | undefined) {
  const normalized = sanitizeSqlString(String(value ?? ""))
  return normalized ? `'${normalized}'` : "NULL"
}

/** JSON kolonlari icin UPDATE / tek deger (virgul korunur). */
export function sqlJsonLiteral(value: unknown) {
  const json = JSON.stringify(value ?? null)
  return `'${json.replace(/'/g, "''")}'`
}

function encodeJsonBase64(value: unknown) {
  const json = JSON.stringify(value ?? null)
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf8").toString("base64")
  }
  return btoa(unescape(encodeURIComponent(json)))
}

function decodeJsonBase64(encoded: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(encoded, "base64").toString("utf8")
  }
  return decodeURIComponent(escape(atob(encoded)))
}

/** INSERT VALUES icin: Locofabric virgul ile ayirir, JSON base64 saklanir. */
export function sqlJsonLiteralForInsert(value: unknown) {
  const b64 = encodeJsonBase64(value)
  return `'${b64.replace(/'/g, "''")}'`
}

/** DB'den gelen duz JSON veya base64 JSON. */
export function parseStoredJson<T>(raw: unknown, fallback: T): T {
  if (raw === undefined || raw === null) {
    return fallback
  }
  const str = String(raw).trim()
  if (!str) {
    return fallback
  }
  try {
    if (str.startsWith("[") || str.startsWith("{")) {
      return JSON.parse(str) as T
    }
    return JSON.parse(decodeJsonBase64(str)) as T
  } catch {
    return fallback
  }
}

/** reservation_date DATETIME kolonu icin YYYY-MM-DD. */
export function sqlReservationDateLiteral(date: string) {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(date ?? "").trim())
  if (!match) {
    return `'${sanitizeSqlString(date)}'`
  }
  return `'${match[1]}'`
}
