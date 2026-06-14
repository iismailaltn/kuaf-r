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
  customer_phone?: string
  customerPhone?: string
  services?: string
  staff_id?: string
  staffId?: string
  staff_name?: string
  staffName?: string
  notes?: string
  photo?: string | null
  photo2?: string | null
  photo3?: string | null
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
  customerPhone: string
  services: string[]
  serviceItems: SessionOperationServiceItem[]
  totalPrice: number
  staffId: string
  staffName: string
  notes: string
  photo: string | null
  photo2: string | null
  photo3: string | null
  shareOnInstagram: boolean
  shareOnWebsite: boolean
  startedAt: string | null
  endedAt: string | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim()
  if (!normalized) {
    return null
  }

  const sentinel = normalized.toUpperCase()
  if (sentinel === "NULL" || sentinel === "CURRENT_TIMESTAMP") {
    return null
  }

  return normalized
}

function toPrice(value: unknown) {
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : 0
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

export function parseOperationTimestampMs(value: unknown) {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return Number.NaN
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T")
  const parsed = Date.parse(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function timestampsMatch(left: unknown, right: unknown) {
  const leftMs = parseOperationTimestampMs(left)
  const rightMs = parseOperationTimestampMs(right)
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) {
    return false
  }

  return Math.abs(leftMs - rightMs) <= 60_000
}

export function dedupeServiceItems(items: SessionOperationServiceItem[]) {
  const map = new Map<string, SessionOperationServiceItem>()

  items.forEach((item) => {
    const name = String(item.name ?? "").trim()
    const key = name.toLowerCase()
    if (!key) {
      return
    }

    const price = toPrice(item.price)
    const existing = map.get(key)
    if (!existing || price > existing.price) {
      map.set(key, { name, price })
    }
  })

  return Array.from(map.values())
}

export const SESSION_LINE_ITEMS_MARKER = "__lineItems:"
export const SESSION_USER_NOTES_MARKER = "__userNotes:"

export function encodeSessionNotesWithLineItems(
  items: SessionOperationServiceItem[],
  userNotes?: string | null,
) {
  const lineItems = items.map((item) => `${item.name}=${toPrice(item.price)}`).join("|")
  const payload = `${SESSION_LINE_ITEMS_MARKER}${lineItems}`
  const trimmedNotes = String(userNotes ?? "")
    .trim()
    .replace(/[\r\n]+/g, " ")
  return trimmedNotes ? `${payload}${SESSION_USER_NOTES_MARKER}${trimmedNotes}` : payload
}

export function parseSessionLineItemsFromNotes(notesRaw: unknown) {
  const notes = String(notesRaw ?? "")
  const markerIndex = notes.indexOf(SESSION_LINE_ITEMS_MARKER)
  if (markerIndex === -1) {
    return []
  }

  const contentStart = markerIndex + SESSION_LINE_ITEMS_MARKER.length
  const userNotesIndex = notes.indexOf(SESSION_USER_NOTES_MARKER, contentStart)
  const lineItemsText = (
    userNotesIndex === -1 ? notes.slice(contentStart) : notes.slice(contentStart, userNotesIndex)
  ).trim()
  if (!lineItemsText) {
    return []
  }

  if (lineItemsText.startsWith("[")) {
    return dedupeServiceItems(parseServiceItems(lineItemsText))
  }

  return dedupeServiceItems(
    lineItemsText
      .split("|")
      .map((part) => {
        const trimmed = part.trim()
        if (!trimmed) {
          return null
        }

        const eqIndex = trimmed.lastIndexOf("=")
        if (eqIndex <= 0) {
          return { name: trimmed, price: 0 }
        }

        return {
          name: trimmed.slice(0, eqIndex).trim(),
          price: toPrice(trimmed.slice(eqIndex + 1)),
        }
      })
      .filter((item): item is SessionOperationServiceItem => item !== null && Boolean(item.name)),
  )
}

export function stripSessionLineItemsFromNotes(notesRaw: unknown) {
  const notes = String(notesRaw ?? "")
  const markerIndex = notes.indexOf(SESSION_LINE_ITEMS_MARKER)
  if (markerIndex === -1) {
    return notes.trim()
  }

  const userNotesIndex = notes.indexOf(SESSION_USER_NOTES_MARKER, markerIndex)
  if (userNotesIndex !== -1) {
    return notes.slice(userNotesIndex + SESSION_USER_NOTES_MARKER.length).trim()
  }

  const afterMarker = notes.slice(markerIndex + SESSION_LINE_ITEMS_MARKER.length)
  if (afterMarker.startsWith("[")) {
    const jsonEnd = afterMarker.indexOf("\n")
    return jsonEnd === -1 ? "" : afterMarker.slice(jsonEnd + 1).trim()
  }

  return ""
}

export function resolveSessionOperationRowId(row: SessionOperationRow | Record<string, unknown>) {
  const candidates = [
    (row as SessionOperationRow).id,
    (row as SessionOperationRow & { ID?: unknown }).ID,
    (row as { Id?: unknown }).Id,
  ]

  for (const candidate of candidates) {
    const id = Number(candidate)
    if (Number.isFinite(id) && id > 0) {
      return id
    }
  }

  return 0
}

export function isActiveSessionOperation(operation: {
  startedAt: string | null
  endedAt: string | null
}) {
  if (!operation.startedAt) {
    return false
  }

  if (!operation.endedAt) {
    return true
  }

  const startedMs = parseOperationTimestampMs(operation.startedAt)
  const endedMs = parseOperationTimestampMs(operation.endedAt)
  if (!Number.isFinite(startedMs) || !Number.isFinite(endedMs)) {
    return false
  }

  return endedMs <= startedMs
}

export function resolveOperationServiceItems(servicesRaw: unknown, notesRaw?: unknown) {
  const servicesText = String(servicesRaw ?? "")
  const fromServices = dedupeServiceItems(parseServiceItems(servicesRaw))
  if (servicesText.includes("@") || fromServices.some((item) => item.price > 0)) {
    return fromServices
  }

  const fromNotes = parseSessionLineItemsFromNotes(notesRaw)
  if (fromNotes.length > 0) {
    return fromNotes
  }

  return fromServices
}

export function resolveSessionOperationId(
  rows: SessionOperationRow[],
  payload: {
    customerName: string
    customerSurname: string
    workspaceName: string
    staffId: string
    startedAt?: string
    endedAt?: string | null
  }
) {
  const candidates = rows
    .map((row) => {
      const id = resolveSessionOperationRowId(row)
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

  const strictMatches = candidates.filter((row) => {
    if (
      row.customerName !== targetCustomerName ||
      row.customerSurname !== targetCustomerSurname ||
      row.workspaceName !== targetWorkspaceName
    ) {
      return false
    }

    if (payload.endedAt == null) {
      return (
        row.staffId === targetStaffId &&
        timestampsMatch(row.startedAt, payload.startedAt) &&
        isActiveSessionOperation({
          startedAt: toNullableString(row.startedAt),
          endedAt: toNullableString(row.endedAt),
        })
      )
    }

    return timestampsMatch(row.endedAt, payload.endedAt)
  })
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

  if (text.includes("@")) {
    return text
      .split("|")
      .map((part) => {
        const trimmed = part.trim()
        if (!trimmed) {
          return null
        }

        const atIndex = trimmed.lastIndexOf("@")
        if (atIndex <= 0) {
          return { name: trimmed, price: 0 }
        }

        return {
          name: trimmed.slice(0, atIndex).trim(),
          price: toPrice(trimmed.slice(atIndex + 1)),
        }
      })
      .filter((item): item is SessionOperationServiceItem => item !== null && Boolean(item.name))
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

export function serializeServiceEntries(items: SessionOperationServiceItem[]) {
  return items.map((item) => `${item.name}@${toPrice(item.price)}`).join("|")
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

export function normalizeSessionOperationRows(rows: SessionOperationRow[]): SessionOperation[] {
  return rows
    .map((row) => {
      const id = resolveSessionOperationRowId(row)
      if (!Number.isFinite(id) || id <= 0) {
        return null
      }

      const workspaceIdRaw = row.workspace_id ?? row.workspaceId
      const workspaceIdNum = Number(workspaceIdRaw)
      const workspaceId = Number.isFinite(workspaceIdNum) && workspaceIdNum > 0 ? workspaceIdNum : null
      const startedAt = toNullableString(row.started_at ?? row.startedAt)
      const endedAt = toNullableString(row.ended_at ?? row.endedAt)
      const serviceItems = resolveOperationServiceItems(row.services, row.notes)
      const isActive = isActiveSessionOperation({ startedAt, endedAt })

      return {
        id,
        workspaceId,
        workspaceName: String(row.workspace_name ?? row.workspaceName ?? "").trim(),
        customerName: String(row.customer_name ?? row.customerName ?? "").trim(),
        customerSurname: String(row.customer_surname ?? row.customerSurname ?? "").trim(),
        customerPhone: String(row.customer_phone ?? row.customerPhone ?? "").trim(),
        services: serviceItems.map((item) => item.name),
        serviceItems,
        totalPrice: getSessionOperationTotalPrice(serviceItems),
        staffId: String(row.staff_id ?? row.staffId ?? "").trim(),
        staffName: String(row.staff_name ?? row.staffName ?? "").trim(),
        notes: stripSessionLineItemsFromNotes(row.notes),
        photo: toNullableString(row.photo),
        photo2: toNullableString(row.photo2),
        photo3: toNullableString(row.photo3),
        shareOnInstagram: toBoolean(row.share_on_instagram ?? row.shareOnInstagram),
        shareOnWebsite: toBoolean(row.share_on_website ?? row.shareOnWebsite),
        startedAt,
        endedAt,
        isActive,
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
