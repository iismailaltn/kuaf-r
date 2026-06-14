const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const TURKISH_PHONE_PREFIX = "05"

export function digitsOnly(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, "")
  return maxLength !== undefined ? digits.slice(0, maxLength) : digits
}

/** 11 haneli 05XXXXXXXXX */
export function normalizeTurkishPhoneDigits(value: string): string {
  const body = parseTurkishPhoneInput(value)
  if (!body) return ""
  return toFullTurkishPhone(body)
}

/**
 * Giris alaninda tutulan parca (0 haric).
 * Ornek: 5075161234 veya 05 sonrasi 9 hane: 075161234
 */
export function parseTurkishPhoneInput(value: string): string {
  let digits = digitsOnly(value, 11)
  if (digits.startsWith("90")) {
    digits = digits.slice(2)
  }
  if (digits.startsWith(TURKISH_PHONE_PREFIX)) {
    return digits.slice(TURKISH_PHONE_PREFIX.length, 11)
  }
  if (digits.startsWith("0")) {
    return digits.slice(0, 10)
  }
  return digits.slice(0, 10)
}

export function toFullTurkishPhone(suffix: string): string {
  const d = digitsOnly(suffix, 10)
  if (!d) return ""
  if (d.length === 9 && d.startsWith("0")) {
    return `${TURKISH_PHONE_PREFIX}${d}`.slice(0, 11)
  }
  if (d.startsWith("5")) {
    return `0${d}`.slice(0, 11)
  }
  return `${TURKISH_PHONE_PREFIX}${d}`.slice(0, 11)
}

/** 0 sonrasi: (507) 516 12 34 veya (07) 516 12 34 */
export function formatTurkishPhoneSuffix(suffix: string): string {
  const d = digitsOnly(suffix, 10)
  if (!d.length) return ""

  if (d.startsWith("0") && d.length <= 9) {
    if (d.length <= 2) return `(${d}`
    if (d.length <= 5) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 5)} ${d.slice(5)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`
  }

  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  if (d.length <= 8) return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
}

export function formatTurkishPhone(digits: string): string {
  const full = normalizeTurkishPhoneDigits(digits)
  if (!full) return ""
  const suffix = full.startsWith(TURKISH_PHONE_PREFIX) ? full.slice(2) : full.slice(1)
  return `0 ${formatTurkishPhoneSuffix(suffix)}`.trim()
}

export function isValidTurkishPhone(digits: string): boolean {
  const full = digits.length === 11 ? digitsOnly(digits, 11) : normalizeTurkishPhoneDigits(digits)
  return /^05\d{9}$/.test(full)
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

export function isValidUsernameOrEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.includes("@")) return isValidEmail(trimmed)
  return /^[a-zA-Z0-9._-]{3,}$/.test(trimmed)
}

export function isValidTaxNumber(value: string): boolean {
  const digits = digitsOnly(value)
  return /^\d{10,11}$/.test(digits)
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8
}

export function validateRegisterFields(data: {
  email: string
  phone: string
  password: string
  taxNumber?: string
  accountType: "personel" | "customer"
}): string | null {
  if (!isValidUsernameOrEmail(data.email)) {
    return data.email.includes("@")
      ? "Gecerli bir e-posta adresi girin."
      : "Gecerli bir kullanici adi girin (en az 3 karakter)."
  }

  const phoneDigits = data.phone.length === 11 ? digitsOnly(data.phone, 11) : normalizeTurkishPhoneDigits(data.phone)
  if (!isValidTurkishPhone(phoneDigits)) {
    return "Telefon numarasi gecerli degil. Ornek: 507 516 12 34 (basinda 0 yazmayin, alanda 0 zaten var)."
  }

  if (!isValidPassword(data.password)) {
    return "Sifre en az 8 karakter olmalidir."
  }

  if (data.accountType === "customer") {
    if (!isValidTaxNumber(data.taxNumber ?? "")) {
      return "Vergi numarasi 10 veya 11 haneli olmalidir."
    }
  }

  return null
}
