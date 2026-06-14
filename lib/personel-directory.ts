import { appConfig } from "@/app.config"
import { selectByToken } from "@/lib/services/locofabric-database"

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

function getField(row: Record<string, unknown>, candidates: string[]) {
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const direct = row[candidate]
    if (direct !== undefined && direct !== null) return direct
    const normalized = candidate.toLowerCase().replace(/[^a-z0-9]/g, "")
    const found = entries.find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized)
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

export function getPersonelUserId(row: Record<string, unknown>) {
  return String(getField(row, ["user_id", "userId", "individual_user_id", "individualUserId"]) ?? "").trim()
}

/** Randevu/seans kayitlarinda kullanilacak personel kimligi (oncelik: bireysel kullanici id). */
export function canonicalStaffIdFromPersonelRow(row: Record<string, unknown>) {
  const userId = getPersonelUserId(row)
  if (userId) {
    return userId
  }
  return String(getField(row, ["id", "ID"]) ?? "").trim()
}

function staffIdsEqual(a: string, b: string) {
  const left = a.trim()
  const right = b.trim()
  if (!left || !right) {
    return false
  }
  if (left === right) {
    return true
  }
  const leftNum = Number(left)
  const rightNum = Number(right)
  return Number.isFinite(leftNum) && Number.isFinite(rightNum) && leftNum === rightNum
}

/**
 * Personel satir id / INV-* gibi referansi users tablosundaki bireysel kullanici id'sine cevirir.
 * salon_reservations.staff_id bu deger olmalidir.
 */
export function resolveIndividualUserId(
  personelRows: Record<string, unknown>[],
  staffRef: string,
) {
  const ref = staffRef.trim()
  if (!ref) {
    return ""
  }

  for (const row of personelRows) {
    const userId = getPersonelUserId(row)
    if (userId && staffIdsEqual(userId, ref)) {
      return userId
    }
  }

  for (const row of personelRows) {
    const userId = getPersonelUserId(row)
    const personelId = String(getField(row, ["id", "ID"]) ?? "").trim()
    if (personelId && staffIdsEqual(personelId, ref) && userId) {
      return userId
    }
  }

  const refRow = personelRows.find((row) =>
    staffIdsEqual(String(getField(row, ["id", "ID"]) ?? "").trim(), ref),
  )
  if (refRow) {
    const refName = normalizePersonelName(refRow)
    if (refName) {
      for (const row of personelRows) {
        const userId = getPersonelUserId(row)
        if (userId && normalizePersonelName(row) === refName) {
          return userId
        }
      }
    }
  }

  return ref
}

/** Bireysel hesap ile eslesen tum staff_id varyantlari (eski personel satir id'leri dahil). */
export function collectStaffIdAliases(
  personelRows: Record<string, unknown>[],
  staffUserId: string,
) {
  const aliases = new Set<string>()
  const needle = resolveIndividualUserId(personelRows, staffUserId) || staffUserId.trim()
  if (!needle) {
    return aliases
  }

  aliases.add(needle)

  const linkedNames = new Set<string>()

  for (const row of personelRows) {
    const userId = getPersonelUserId(row)
    const personelId = String(getField(row, ["id", "ID"]) ?? "").trim()
    const name = normalizePersonelName(row)

    if (userId && staffIdsEqual(userId, needle)) {
      if (personelId) {
        aliases.add(personelId)
      }
      if (name) {
        linkedNames.add(name)
      }
    }
    if (personelId && staffIdsEqual(personelId, needle)) {
      if (userId) {
        aliases.add(userId)
      }
      if (name) {
        linkedNames.add(name)
      }
    }
  }

  for (const row of personelRows) {
    const name = normalizePersonelName(row)
    if (!name || !linkedNames.has(name)) {
      continue
    }
    const personelId = String(getField(row, ["id", "ID"]) ?? "").trim()
    const userId = getPersonelUserId(row)
    if (personelId) {
      aliases.add(personelId)
    }
    if (userId) {
      aliases.add(userId)
    }
  }

  return aliases
}

export function reservationMatchesStaffFilter(
  reservationStaffId: string,
  aliases: Set<string>,
) {
  const stored = reservationStaffId.trim()
  if (!stored) {
    return false
  }
  for (const alias of aliases) {
    if (staffIdsEqual(stored, alias)) {
      return true
    }
  }
  return false
}

function normalizePersonelName(row: Record<string, unknown>) {
  const fullName = String(getField(row, ["full_name", "fullName"]) ?? "").trim().toLowerCase()
  if (fullName) {
    return fullName
  }

  const firstName = String(getField(row, ["first_name", "firstName"]) ?? "").trim().toLowerCase()
  const lastName = String(getField(row, ["last_name", "lastName"]) ?? "").trim().toLowerCase()
  return `${firstName} ${lastName}`.trim()
}

function personelAlreadyListed(
  personelRows: Record<string, unknown>[],
  candidate: Record<string, unknown>,
) {
  const userId = getPersonelUserId(candidate)
  const name = normalizePersonelName(candidate)

  return personelRows.some((personel) => {
    if (userId && getPersonelUserId(personel) === userId) {
      return true
    }
    if (name && normalizePersonelName(personel) === name) {
      return true
    }
    return false
  })
}

export function mergePersonelRows(
  personelRows: Record<string, unknown>[],
  invitationRows: Record<string, unknown>[],
) {
  const merged: Record<string, unknown>[] = []
  const seenUserIds = new Set<string>()
  const seenNames = new Set<string>()

  const register = (row: Record<string, unknown>) => {
    const userId = getPersonelUserId(row)
    const name = normalizePersonelName(row)
    if (userId && seenUserIds.has(userId)) {
      return
    }
    if (name && seenNames.has(name)) {
      return
    }

    if (userId) {
      seenUserIds.add(userId)
    }
    if (name) {
      seenNames.add(name)
    }
    merged.push(row)
  }

  personelRows.forEach(register)

  invitationRows.forEach((row) => {
    const userId = getPersonelUserId(row)
    const name = normalizePersonelName(row)

    const matchIndex = merged.findIndex((personel) => {
      if (userId && getPersonelUserId(personel) === userId) {
        return true
      }
      if (name && normalizePersonelName(personel) === name) {
        return true
      }
      return false
    })

    if (matchIndex >= 0) {
      if (userId && !getPersonelUserId(merged[matchIndex])) {
        merged[matchIndex] = {
          ...merged[matchIndex],
          user_id: userId,
          userId,
          individual_user_id: userId,
          individualUserId: userId,
        }
        seenUserIds.add(userId)
      }
      return
    }

    if (!personelAlreadyListed(personelRows, row)) {
      register(row)
    }
  })

  return merged
}

function normalizePersonelDisplayName(row: Record<string, unknown>) {
  const fullName = String(getField(row, ["full_name", "fullName"]) ?? "").trim()
  if (fullName) {
    return fullName
  }

  const firstName = String(getField(row, ["first_name", "firstName"]) ?? "").trim()
  const lastName = String(getField(row, ["last_name", "lastName"]) ?? "").trim()
  return `${firstName} ${lastName}`.trim()
}

function isActivePersonelRow(row: Record<string, unknown>) {
  const isActiveValue = getField(row, ["is_active", "isActive"])
  return (
    isActiveValue === true ||
    isActiveValue === 1 ||
    isActiveValue === "1" ||
    isActiveValue === "true"
  )
}

export function getActivePersonelNames(rows: Record<string, unknown>[]) {
  const names: string[] = []

  rows.forEach((row) => {
    if (!isActivePersonelRow(row)) {
      return
    }

    const name = normalizePersonelDisplayName(row)
    if (name) {
      names.push(name)
    }
  })

  return names.sort((a, b) => a.localeCompare(b, "tr"))
}

export async function fetchPersonelRowsForBusiness(businessUserId: string) {
  const token = appConfig.token.personels
  if (!token) return []

  const data = await selectByToken<unknown>(token)
  const rows = extractRows(data).filter(
    (row) => String(getField(row, ["business_user_id", "businessUserId"]) ?? "").trim() === businessUserId
  )

  const invitationRows: Record<string, unknown>[] = []
  if (appConfig.token.personel_invitations && appConfig.token.users && appConfig.token.individual_profiles) {
    const [invitationsData, usersData, profilesData] = await Promise.all([
      selectByToken<unknown>(appConfig.token.personel_invitations),
      selectByToken<unknown>(appConfig.token.users),
      selectByToken<unknown>(appConfig.token.individual_profiles),
    ])

    for (const invitation of extractRows(invitationsData)) {
      const invitationBusinessId = String(getField(invitation, ["business_user_id", "businessUserId"]) ?? "").trim()
      const status = String(getField(invitation, ["status"]) ?? "").trim().toLowerCase()
      if (invitationBusinessId !== businessUserId || status !== "accepted") continue

      const individualUserId = String(getField(invitation, ["individual_user_id", "individualUserId"]) ?? "").trim()
      const user = extractRows(usersData).find(
        (row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === individualUserId
      )
      const profile = extractRows(profilesData).find(
        (row) => String(getField(row, ["user_id", "userId"]) ?? "").trim() === individualUserId
      )
      if (!user || !profile) continue

      const firstName = String(getField(profile, ["first_name", "firstName"]) ?? "").trim()
      const lastName = String(getField(profile, ["last_name", "lastName"]) ?? "").trim()
      invitationRows.push({
        user_id: individualUserId,
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        is_active: 1,
        business_user_id: businessUserId,
      })
    }
  }

  return mergePersonelRows(rows, invitationRows)
}
