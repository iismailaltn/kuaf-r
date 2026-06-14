import { getBusinessUserIdFromRow, matchesBusinessUserId, sqlBusinessUserIdRef } from "@/lib/business-scope"
import {
  extractRows,
  selectAllByToken,
  selectByToken,
  sqlToken,
} from "@/lib/services/locofabric-database"
import {
  normalizeSessionOperationRows,
  parseOperationTimestampMs,
  resolveSessionOperationRowId,
  type SessionOperation,
  type SessionOperationRow,
} from "@/lib/session-operations"
import { sanitizeSqlString } from "@/lib/sql-sanitize"

export type SessionOperationsPeriod = "7d" | "30d" | "365d" | "all"

const MAX_FETCH_ROWS = 5000

export interface SessionOperationsListQuery {
  businessUserId: string
  staffId?: string
  workspaceId?: number
  workspaceName?: string
  activeOnly?: boolean
  page?: number
  pageSize?: number
  period?: SessionOperationsPeriod
}

export interface WorkspaceSessionStat {
  workspaceName: string
  count: number
}

function extractScalarNumber(data: unknown) {
  const rows = extractRows<Record<string, unknown>>(data)
  if (rows.length > 0) {
    const row = rows[0]
    const raw = row.cnt ?? row.CNT ?? row.count ?? row.Count ?? Object.values(row)[0]
    const num = Number(raw)
    if (Number.isFinite(num)) {
      return num
    }
  }

  if (typeof data === "number" && Number.isFinite(data)) {
    return data
  }

  const nested = (data as { data?: unknown })?.data ?? (data as { Data?: unknown })?.Data
  if (typeof nested === "number" && Number.isFinite(nested)) {
    return nested
  }

  return 0
}

function getPeriodStartMs(period: SessionOperationsPeriod) {
  if (period === "all") {
    return null
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 365
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function buildSqlWhereClause(query: SessionOperationsListQuery) {
  const businessId = sqlBusinessUserIdRef(query.businessUserId)
  const parts = [`business_user_id = ${businessId}`]

  if (query.staffId) {
    parts.push(`staff_id = '${sanitizeSqlString(query.staffId)}'`)
  }

  if (Number.isFinite(query.workspaceId) && (query.workspaceId ?? 0) > 0) {
    parts.push(`workspace_id = ${query.workspaceId}`)
  }

  if (query.workspaceName) {
    parts.push(`workspace_name = '${sanitizeSqlString(query.workspaceName)}'`)
  }

  return parts.join(" AND ")
}

async function fetchMatchingRows(token: string, query: SessionOperationsListQuery) {
  const where = buildSqlWhereClause(query)

  const data = await sqlToken<unknown>(
    token,
    `SELECT * FROM session_operations WHERE ${where}`,
  )
  const rows = extractRows<SessionOperationRow>(data)

  let sqlCount = 0
  try {
    const countData = await sqlToken<unknown>(
      token,
      `SELECT COUNT(*) as cnt FROM session_operations WHERE ${where}`,
    )
    sqlCount = extractScalarNumber(countData)
  } catch {
    sqlCount = rows.length
  }

  if (sqlCount < rows.length) {
    sqlCount = rows.length
  }

  return { rows, sqlCount }
}

function getOperationSortMs(operation: SessionOperation) {
  const ended = parseOperationTimestampMs(operation.endedAt)
  if (Number.isFinite(ended)) {
    return ended
  }

  const started = parseOperationTimestampMs(operation.startedAt)
  return Number.isFinite(started) ? started : 0
}

function applyMemoryFilters(
  operations: SessionOperation[],
  query: SessionOperationsListQuery,
) {
  const periodStartMs = getPeriodStartMs(query.period ?? "all")

  return operations.filter((operation) => {
    if (query.activeOnly && !operation.isActive) {
      return false
    }

    if (!periodStartMs) {
      return true
    }

    return getOperationSortMs(operation) >= periodStartMs
  })
}

function buildWorkspaceStats(operations: SessionOperation[]) {
  const counts = new Map<string, number>()

  operations.forEach((operation) => {
    const label = String(operation.workspaceName ?? "").trim() || "-"
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([workspaceName, count]) => ({ workspaceName, count }))
    .sort((a, b) => b.count - a.count)
}

export async function fetchSessionOperationsPage(
  token: string,
  query: SessionOperationsListQuery,
) {
  const { rows } = await fetchMatchingRows(token, query)
  const normalized = normalizeSessionOperationRows(rows)
  const filtered = applyMemoryFilters(normalized, query).sort(
    (a, b) => getOperationSortMs(b) - getOperationSortMs(a),
  )

  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20) || 20))
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const offset = (page - 1) * pageSize
  const pagedRows = filtered.slice(offset, offset + pageSize)

  return {
    rows: pagedRows,
    total,
    page,
    pageSize,
    totalPages,
    workspaceStats: buildWorkspaceStats(filtered),
  }
}

export async function fetchActiveSessionOperations(token: string, query: SessionOperationsListQuery) {
  const { rows } = await fetchMatchingRows(token, query)
  const normalized = normalizeSessionOperationRows(rows)
  return applyMemoryFilters(normalized, { ...query, activeOnly: true })
    .sort((a, b) => getOperationSortMs(b) - getOperationSortMs(a))
    .slice(0, 50)
}

export async function fetchAllSessionOperationsForBusiness(token: string, businessUserId: string) {
  const { rows } = await fetchMatchingRows(token, { businessUserId, period: "all" })
  return normalizeSessionOperationRows(rows).sort(
    (a, b) => getOperationSortMs(b) - getOperationSortMs(a),
  )
}

function findSessionOperationInRows(
  rows: SessionOperationRow[],
  operationId: number,
  businessUserId: string,
) {
  let idOnlyMatch: SessionOperationRow | null = null

  for (const row of rows) {
    if (resolveSessionOperationRowId(row) !== operationId) {
      continue
    }

    if (matchesBusinessUserId(row, businessUserId)) {
      return row
    }

    if (!getBusinessUserIdFromRow(row)) {
      idOnlyMatch = row
    }
  }

  return idOnlyMatch
}

/** Tek seans kaydi — SQL + Select API (Locofabric bazen filtreli SELECT'te bos doner). */
export async function fetchSessionOperationById(
  token: string,
  operationId: number,
  businessUserId: string,
) {
  const businessId = sqlBusinessUserIdRef(businessUserId)
  const sqlAttempts = [
    `SELECT TOP 1 * FROM session_operations WHERE id = ${operationId}`,
    `SELECT TOP 1 * FROM session_operations WHERE id = ${operationId} AND business_user_id = ${businessId}`,
  ]

  for (const sql of sqlAttempts) {
    try {
      const data = await sqlToken<unknown>(token, sql)
      const found = findSessionOperationInRows(
        extractRows<SessionOperationRow>(data),
        operationId,
        businessUserId,
      )
      if (found) {
        return found
      }
    } catch {
      // sonraki yontem
    }
  }

  try {
    const data = await selectAllByToken<unknown>(token, "session_operations")
    const found = findSessionOperationInRows(
      extractRows<SessionOperationRow>(data),
      operationId,
      businessUserId,
    )
    if (found) {
      return found
    }
  } catch {
    // selectByToken
  }

  try {
    const data = await selectByToken<unknown>(token)
    const found = findSessionOperationInRows(
      extractRows<SessionOperationRow>(data),
      operationId,
      businessUserId,
    )
    if (found) {
      return found
    }
  } catch {
    // resolve listesi
  }

  try {
    const rows = await fetchSessionOperationsForIdResolve(token, businessUserId)
    return findSessionOperationInRows(rows, operationId, businessUserId)
  } catch {
    return null
  }
}

const RESOLVE_ID_FETCH_LIMIT = 500

/**
 * Locofabric session_operations: SELECT * calisir; kolon listesi / ORDER BY id genelde hata verir.
 */
export async function fetchSessionOperationsByBusiness(
  token: string,
  businessUserId: string,
  limit = RESOLVE_ID_FETCH_LIMIT,
) {
  const businessId = sqlBusinessUserIdRef(businessUserId)
  // TOP + ORDER BY id Locofabric'te calismiyor; isletme filtresi ile tum satirlar alinir.
  const data = await sqlToken<unknown>(
    token,
    `SELECT * FROM session_operations WHERE business_user_id = ${businessId}`,
  )
  const sorted = extractRows<SessionOperationRow>(data).sort(
    (a, b) => resolveSessionOperationRowId(b) - resolveSessionOperationRowId(a),
  )
  return limit > 0 ? sorted.slice(0, limit) : sorted
}

/** INSERT sonrasi en son kaydin id'si. */
export async function fetchLatestSessionOperationId(token: string, businessUserId: string) {
  try {
    const rows = await fetchSessionOperationsByBusiness(token, businessUserId, 200)
    const id = resolveSessionOperationRowId(rows[0] ?? {})
    return id > 0 ? id : null
  } catch {
    return null
  }
}

/** INSERT id cozumlemesi icin isletme kayitlari. */
export async function fetchSessionOperationsForIdResolve(
  token: string,
  businessUserId: string,
) {
  return fetchSessionOperationsByBusiness(token, businessUserId, RESOLVE_ID_FETCH_LIMIT)
}
