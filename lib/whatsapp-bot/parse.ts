import { normalizeTurkishPhoneDigits } from "@/lib/auth-field-validation"
import { parseTimeToMinutes } from "@/lib/reservation-scheduling"

export function normalizeWaPhone(waId: string) {
  let digits = String(waId ?? "").replace(/\D/g, "")
  if (digits.startsWith("90") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    digits = `0${digits}`
  }
  return normalizeTurkishPhoneDigits(digits) || digits
}

export function parseCustomerName(text: string) {
  const parts = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length < 2) {
    return null
  }
  return {
    customerName: parts[0],
    customerSurname: parts.slice(1).join(" "),
  }
}

export function parseServiceChoice(text: string, maxIndex: number) {
  const match = /(\d+)/.exec(String(text ?? "").trim())
  if (!match) {
    return null
  }
  const index = Number(match[1])
  if (!Number.isFinite(index) || index < 1 || index > maxIndex) {
    return null
  }
  return index - 1
}

export function parseYesNo(text: string, locale: "tr" | "en") {
  const normalized = String(text ?? "").trim().toLowerCase()
  const yesWords =
    locale === "tr"
      ? ["evet", "kabul", "onay", "onayliyorum", "tamam", "ok", "yes", "confirm"]
      : ["yes", "y", "confirm", "ok", "accept", "evet", "kabul"]
  const noWords =
    locale === "tr"
      ? ["hayir", "hayır", "iptal", "vazgec", "vazgeç", "no", "cancel"]
      : ["no", "n", "cancel", "iptal", "hayir"]

  if (yesWords.some((word) => normalized === word || normalized.includes(word))) {
    return true
  }
  if (noWords.some((word) => normalized === word || normalized.includes(word))) {
    return false
  }
  return null
}

export function isBookingIntent(text: string) {
  const normalized = String(text ?? "").trim().toLowerCase()
  return ["randevu", "rezervasyon", "book", "appointment", "booking"].some(
    (word) => normalized === word || normalized.includes(word),
  )
}

export function isCancelIntent(text: string) {
  const normalized = String(text ?? "").trim().toLowerCase()
  return ["iptal", "cancel", "vazgec", "vazgeç", "hayir", "hayır"].some(
    (word) => normalized === word,
  )
}

export function isHelpIntent(text: string) {
  const normalized = String(text ?? "").trim().toLowerCase()
  return ["yardim", "yardım", "help", "komut", "menu", "menü"].some(
    (word) => normalized === word,
  )
}

export function parseDateInput(text: string, now = new Date()) {
  const raw = String(text ?? "").trim().toLowerCase()
  if (!raw) {
    return null
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (raw === "bugun" || raw === "bugün" || raw === "today") {
    return formatIsoDate(today)
  }
  if (raw === "yarin" || raw === "yarın" || raw === "tomorrow") {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatIsoDate(tomorrow)
  }

  const dotted = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(raw)
  if (dotted) {
    const day = Number(dotted[1])
    const month = Number(dotted[2])
    const year = Number(dotted[3])
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return formatIsoDate(date)
    }
  }

  const dashed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (dashed) {
    return `${dashed[1]}-${dashed[2]}-${dashed[3]}`
  }

  return null
}

export function parseTimeInput(text: string) {
  const raw = String(text ?? "").trim()
  const match = /^(\d{1,2})[:.](\d{2})$/.exec(raw)
  if (!match) {
    return null
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }
  const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  return Number.isFinite(parseTimeToMinutes(formatted)) ? formatted : null
}

function formatIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function formatDisplayDate(isoDate: string, locale: "tr" | "en") {
  const [y, m, d] = isoDate.split("-").map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
