export interface SessionOperationItemRow {
  id?: number | string
  session_operation_id?: number | string
  sessionOperationId?: number | string
  service_name?: string
  serviceName?: string
  price?: number | string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface SessionOperationRow {
  id?: number | string
  workspace_id?: number | string
  workspaceId?: number | string
  workspace_name?: string
  workspaceName?: string
  customer_name?: string
  customerName?: string
  customer_surname?: string
  customerSurname?: string
  services?: string
  staff_id?: string
  staffId?: string
  staff_name?: string
  staffName?: string
  notes?: string
  photo?: string | null
  share_on_instagram?: boolean | number | string
  shareOnInstagram?: boolean | number | string
  share_on_website?: boolean | number | string
  shareOnWebsite?: boolean | number | string
  started_at?: string
  startedAt?: string
  ended_at?: string
  endedAt?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface SessionOperationServiceItem {
  name: string
  price: number
}

export interface SessionOperation {
  id: number
  workspaceId: number | null
  workspaceName: string
  customerName: string
  customerSurname: string
  services: string[]
  serviceItems: SessionOperationServiceItem[]
  totalPrice: number
  staffId: string
  staffName: string
  notes: string
  photo: string | null
  shareOnInstagram: boolean
  shareOnWebsite: boolean
  startedAt: string | null
  endedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim()
  return normalized || null
}

function toPrice(value: unknown) {
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : 0
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

function toTimestampMs(value: unknown) {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return Number.NaN
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T")
  const parsed = Date.parse(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function timestampsMatch(left: unknown, right: unknown) {
  const leftMs = toTimestampMs(left)
  const rightMs = toTimestampMs(right)
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) {
    return false
  }

  return Math.abs(leftMs - rightMs) <= 60_000
}

export function resolveSessionOperationId(
  rows: SessionOperationRow[],
  payload: {
    customerName: string
    customerSurname: string
    workspaceName: string
    staffId: string
    startedAt?: string
    endedAt: string
  }
) {
  const candidates = rows
    .map((row) => {
      const id = Number(row.id)
      if (!Number.isFinite(id) || id <= 0) {
        return null
      }

      return {
        id,
        customerName: normalizeText(row.customer_name ?? row.customerName),
        customerSurname: normalizeText(row.customer_surname ?? row.customerSurname),
        workspaceName: normalizeText(row.workspace_name ?? row.workspaceName),
        staffId: normalizeText(row.staff_id ?? row.staffId),
        startedAt: row.started_at ?? row.startedAt,
        endedAt: row.ended_at ?? row.endedAt,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  const targetCustomerName = normalizeText(payload.customerName)
  const targetCustomerSurname = normalizeText(payload.customerSurname)
  const targetWorkspaceName = normalizeText(payload.workspaceName)
  const targetStaffId = normalizeText(payload.staffId)

  const strictMatches = candidates.filter(
    (row) =>
      row.customerName === targetCustomerName &&
      row.customerSurname === targetCustomerSurname &&
      row.workspaceName === targetWorkspaceName &&
      timestampsMatch(row.endedAt, payload.endedAt)
  )
  if (strictMatches.length > 0) {
    return Math.max(...strictMatches.map((row) => row.id))
  }

  const relaxedMatches = candidates.filter(
    (row) =>
      row.customerName === targetCustomerName &&
      row.customerSurname === targetCustomerSurname &&
      row.workspaceName === targetWorkspaceName &&
      row.staffId === targetStaffId &&
      timestampsMatch(row.startedAt, payload.startedAt)
  )
  if (relaxedMatches.length > 0) {
    return Math.max(...relaxedMatches.map((row) => row.id))
  }

  const fallbackMatches = candidates.filter(
    (row) =>
      row.customerName === targetCustomerName &&
      row.customerSurname === targetCustomerSurname &&
      row.workspaceName === targetWorkspaceName &&
      row.staffId === targetStaffId
  )
  if (fallbackMatches.length > 0) {
    return Math.max(...fallbackMatches.map((row) => row.id))
  }

  return null
}

export function parseServiceItems(raw: unknown): SessionOperationServiceItem[] {
  const text = String(raw ?? "").trim()
  if (!text) {
    return []
  }

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null
            }

            const name = String((item as { name?: unknown }).name ?? "").trim()
            if (!name) {
              return null
            }

            return {
              name,
              price: toPrice((item as { price?: unknown }).price),
            }
          })
          .filter((item): item is SessionOperationServiceItem => item !== null)
      }
    } catch {
      return []
    }
  }

  return text
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name, price: 0 }))
}

export function serializeServiceItems(items: SessionOperationServiceItem[]) {
  return JSON.stringify(
    items.map((item) => ({
      name: item.name,
      price: toPrice(item.price),
    }))
  )
}

export function getSessionOperationTotalPrice(items: SessionOperationServiceItem[]) {
  return items.reduce((total, item) => total + toPrice(item.price), 0)
}

export function serializeServiceNames(items: SessionOperationServiceItem[]) {
  return items.map((item) => item.name).join("|")
}

export function groupSessionOperationItemsByOperationId(rows: SessionOperationItemRow[]) {
  const grouped = new Map<number, SessionOperationServiceItem[]>()

  rows.forEach((row) => {
    const operationId = Number(row.session_operation_id ?? row.sessionOperationId)
    if (!Number.isFinite(operationId) || operationId <= 0) {
      return
    }

    const name = String(row.service_name ?? row.serviceName ?? "").trim()
    if (!name) {
      return
    }

    const current = grouped.get(operationId) ?? []
    current.push({
      name,
      price: toPrice(row.price),
    })
    grouped.set(operationId, current)
  })

  return grouped
}

export function normalizeSessionOperationRows(
  rows: SessionOperationRow[],
  itemsByOperationId?: Map<number, SessionOperationServiceItem[]>
): SessionOperation[] {
  return rows
    .map((row) => {
      const id = Number(row.id)
      if (!Number.isFinite(id) || id <= 0) {
        return null
      }

      const workspaceIdRaw = row.workspace_id ?? row.workspaceId
      const workspaceIdNum = Number(workspaceIdRaw)
      const workspaceId = Number.isFinite(workspaceIdNum) && workspaceIdNum > 0 ? workspaceIdNum : null
      const serviceItems = itemsByOperationId?.get(id) ?? parseServiceItems(row.services)

      return {
        id,
        workspaceId,
        workspaceName: String(row.workspace_name ?? row.workspaceName ?? "").trim(),
        customerName: String(row.customer_name ?? row.customerName ?? "").trim(),
        customerSurname: String(row.customer_surname ?? row.customerSurname ?? "").trim(),
        services: serviceItems.map((item) => item.name),
        serviceItems,
        totalPrice: getSessionOperationTotalPrice(serviceItems),
        staffId: String(row.staff_id ?? row.staffId ?? "").trim(),
        staffName: String(row.staff_name ?? row.staffName ?? "").trim(),
        notes: String(row.notes ?? "").trim(),
        photo: toNullableString(row.photo),
        shareOnInstagram: toBoolean(row.share_on_instagram ?? row.shareOnInstagram),
        shareOnWebsite: toBoolean(row.share_on_website ?? row.shareOnWebsite),
        startedAt: toNullableString(row.started_at ?? row.startedAt),
        endedAt: toNullableString(row.ended_at ?? row.endedAt),
        createdAt: toNullableString(row.createdAt ?? row.created_at),
        updatedAt: toNullableString(row.updatedAt ?? row.updated_at),
      }
    })
    .filter((row): row is SessionOperation => row !== null)
    .sort((a, b) => {
      const aTime = Date.parse(a.endedAt ?? a.startedAt ?? a.createdAt ?? "")
      const bTime = Date.parse(b.endedAt ?? b.startedAt ?? b.createdAt ?? "")
      if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
        return bTime - aTime
      }
      return b.id - a.id
    })
}
