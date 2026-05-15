export type MembershipPlan = "basic" | "professional"

export interface MembershipPlanDefinition {
  id: MembershipPlan
  title: string
  price: string
  description: string
  features: string[]
}

export const MEMBERSHIP_PLANS: MembershipPlanDefinition[] = [
  {
    id: "basic",
    title: "Başlangıç",
    price: "₺9.990",
    description: "Küçük işletmeler için temel panel erişimi.",
    features: ["Randevu yönetimi", "Personel yönetimi", "Temel raporlar"],
  },
  {
    id: "professional",
    title: "Profesyonel",
    price: "₺19.990",
    description: "Büyüyen işletmeler için gelişmiş yönetim paketi.",
    features: ["Tüm başlangıç özellikleri", "Performans ekranları", "Operasyon takibi"],
  },
]

export function getPlanById(planId: MembershipPlan | string | null | undefined) {
  return MEMBERSHIP_PLANS.find((plan) => plan.id === planId) ?? null
}

export function isMembershipPlan(value: string): value is MembershipPlan {
  return value === "basic" || value === "professional"
}

export function formatMembershipDate(value: string | Date | null | undefined) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

export function addOneYear(from: Date) {
  const end = new Date(from)
  end.setFullYear(end.getFullYear() + 1)
  return end
}

export function toSqlDateTime(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}

export interface MembershipTimeRemaining {
  totalMs: number
  remainingMs: number
  elapsedPercent: number
  remainingDays: number
  isExpired: boolean
  isActive: boolean
}

export function getMembershipTimeRemaining(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): MembershipTimeRemaining | null {
  if (!startsAt || !endsAt) return null

  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null
  }

  const now = Date.now()
  const totalMs = end.getTime() - start.getTime()
  const remainingMs = Math.max(0, end.getTime() - now)
  const elapsedPercent = Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100))
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24))

  return {
    totalMs,
    remainingMs,
    elapsedPercent,
    remainingDays,
    isExpired: remainingMs <= 0,
    isActive: now >= start.getTime() && now < end.getTime(),
  }
}
