import { normalizeTurkishPhoneDigits, isValidTurkishPhone } from "@/lib/auth-field-validation"
import { parseOperationTimestampMs, type SessionOperation } from "@/lib/session-operations"

export type SalonCustomer = {
  id: string
  phone: string
  firstName: string
  lastName: string
  fullName: string
  sessionCount: number
  completedSessionCount: number
  lastVisitAt: string | null
  sessions: SessionOperation[]
}

function customerSortMs(customer: SalonCustomer) {
  const last = parseOperationTimestampMs(customer.lastVisitAt)
  return Number.isFinite(last) ? last : 0
}

function pickDisplayName(sessions: SessionOperation[]) {
  for (const session of sessions) {
    const first = session.customerName.trim()
    const last = session.customerSurname.trim()
    if (first || last) {
      return { firstName: first, lastName: last }
    }
  }
  return { firstName: "Müşteri", lastName: "" }
}

export function resolveCustomerPhoneKey(phone: string) {
  const normalized = normalizeTurkishPhoneDigits(phone)
  if (isValidTurkishPhone(normalized)) {
    return normalized
  }
  return ""
}

export function buildSalonCustomersFromSessions(operations: SessionOperation[]): SalonCustomer[] {
  const groups = new Map<string, SessionOperation[]>()

  operations.forEach((operation) => {
    const phoneKey = resolveCustomerPhoneKey(operation.customerPhone)
    const fallbackKey = `name:${operation.customerName.trim().toLowerCase()}|${operation.customerSurname.trim().toLowerCase()}`
    const key = phoneKey || (fallbackKey !== "name:|" ? fallbackKey : `session:${operation.id}`)
    const list = groups.get(key) ?? []
    list.push(operation)
    groups.set(key, list)
  })

  const customers: SalonCustomer[] = []

  groups.forEach((sessions, key) => {
    const sorted = [...sessions].sort((a, b) => {
      const aMs = parseOperationTimestampMs(a.endedAt ?? a.startedAt ?? a.createdAt)
      const bMs = parseOperationTimestampMs(b.endedAt ?? b.startedAt ?? b.createdAt)
      return (Number.isFinite(bMs) ? bMs : 0) - (Number.isFinite(aMs) ? aMs : 0)
    })

    const { firstName, lastName } = pickDisplayName(sorted)
    const phone = key.startsWith("name:") || key.startsWith("session:") ? "" : key
    const completed = sorted.filter((s) => s.endedAt && !s.isActive)
    const lastVisit = sorted.find((s) => s.endedAt)?.endedAt ?? sorted[0]?.startedAt ?? null

    customers.push({
      id: key,
      phone,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      sessionCount: sorted.length,
      completedSessionCount: completed.length,
      lastVisitAt: lastVisit,
      sessions: sorted,
    })
  })

  return customers.sort((a, b) => customerSortMs(b) - customerSortMs(a))
}

export function filterSalonCustomers(customers: SalonCustomer[], searchQuery: string) {
  const query = searchQuery.trim().toLowerCase()
  if (!query) {
    return customers
  }

  const phoneDigits = query.replace(/\D/g, "")

  return customers.filter((customer) => {
    const haystack = [
      customer.fullName,
      customer.firstName,
      customer.lastName,
      customer.phone,
      customer.sessions
        .flatMap((s) => [s.workspaceName, s.staffName, s.services.join(" "), s.notes])
        .join(" "),
    ]
      .join(" ")
      .toLowerCase()

    if (haystack.includes(query)) {
      return true
    }

    if (phoneDigits.length >= 3 && customer.phone.replace(/\D/g, "").includes(phoneDigits)) {
      return true
    }

    return false
  })
}

export function findSalonCustomerByPhone(customers: SalonCustomer[], phone: string) {
  const key = resolveCustomerPhoneKey(phone)
  if (!key) {
    return null
  }
  return customers.find((customer) => customer.phone === key) ?? null
}
