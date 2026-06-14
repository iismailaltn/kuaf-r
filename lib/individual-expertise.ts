/** Kayit sonrasi onboarding atlandi (expertise kolonunda saklanir). */
export const EXPERTISE_ONBOARDING_SKIP = "__onboarding_skipped__"

export function isIndividualAccountType(accountType: string) {
  const normalized = String(accountType ?? "").trim().toLowerCase()
  return normalized === "bireysel" || normalized === "personel"
}

export function serializeExpertiseList(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" | ")
}

export function parseExpertiseList(raw: unknown) {
  const text = String(raw ?? "").trim()
  if (!text || text === EXPERTISE_ONBOARDING_SKIP) {
    return []
  }

  return text.split("|").map((item) => item.trim()).filter(Boolean)
}

/** Bos expertise = henuz onboarding yapilmadi. */
export function needsExpertiseOnboarding(raw: unknown) {
  const text = String(raw ?? "").trim()
  if (!text || text.toLowerCase() === "null") {
    return true
  }
  if (text === EXPERTISE_ONBOARDING_SKIP) {
    return false
  }
  return false
}

export function isExpertiseSetupComplete(raw: unknown) {
  return !needsExpertiseOnboarding(raw)
}
