import { appConfig } from "@/app.config"
import { addOneYear, toSqlDateTime } from "@/lib/corporate-membership"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

function sqlString(value: string) {
  return `'${sanitizeSqlString(value)}'`
}

function extractRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: Record<string, unknown>[] }).data
  }
  if (Array.isArray((data as { Data?: unknown })?.Data)) {
    return (data as { Data: Record<string, unknown>[] }).Data
  }
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[]
  }
  return []
}

function getField(row: Record<string, unknown> | null | undefined, candidates: string[]) {
  if (!row || typeof row !== "object") return undefined
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const direct = row[candidate]
    if (direct !== undefined && direct !== null) return direct
    const found = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

export async function activateMembershipSubscription(userId: string) {
  const corporateToken = appConfig.token.corporate_profiles
  if (!corporateToken) return

  const corporateData = await selectByToken<unknown>(corporateToken)
  const profile = extractRows(corporateData).find(
    (row) => String(getField(row, ["user_id", "userId"]) ?? "").trim() === userId,
  )
  if (!profile) return

  const startsAt = new Date()
  const endsAt = addOneYear(startsAt)
  const startsAtSql = sqlString(toSqlDateTime(startsAt))
  const endsAtSql = sqlString(toSqlDateTime(endsAt))

  await sqlToken(
    corporateToken,
    `UPDATE corporate_profiles SET subscription_starts_at=${startsAtSql}, subscription_ends_at=${endsAtSql} WHERE user_id=${userId}`,
  )
}
