export const INDIVIDUAL_NOT_AVAILABLE_MESSAGE =
  "Üzgünüz, aradığınız özelliklerde birisini bulamadık ya da şu an aktif olarak başka yerde çalışıyor."

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

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

function isActiveValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

export function isIndividualEmployedElsewhere(
  individualUserId: string,
  userEmail: string,
  currentBusinessUserId: string,
  invitations: Record<string, unknown>[],
  personels: Record<string, unknown>[],
) {
  const normalizedEmail = normalize(userEmail)
  const currentBusinessId = currentBusinessUserId.trim()

  const employedViaInvitation = invitations.some((invitation) => {
    const invitationIndividualId = String(getField(invitation, ["individual_user_id", "individualUserId"]) ?? "").trim()
    const invitationBusinessId = String(getField(invitation, ["business_user_id", "businessUserId"]) ?? "").trim()
    const status = normalize(getField(invitation, ["status"]))
    if (invitationIndividualId !== individualUserId || status !== "accepted") {
      return false
    }
    if (!invitationBusinessId) {
      return false
    }
    return currentBusinessId ? invitationBusinessId !== currentBusinessId : true
  })

  if (employedViaInvitation) {
    return true
  }

  return personels.some((row) => {
    const personelBusinessId = String(getField(row, ["business_user_id", "businessUserId"]) ?? "").trim()
    const personelEmail = normalize(getField(row, ["email", "username"]))
    const isActive = isActiveValue(getField(row, ["is_active", "isActive"]))
    if (!isActive || !personelEmail || personelEmail !== normalizedEmail) {
      return false
    }
    if (!personelBusinessId) {
      return false
    }
    return currentBusinessId ? personelBusinessId !== currentBusinessId : true
  })
}
