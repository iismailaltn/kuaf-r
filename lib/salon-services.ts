import type { SalonServiceStage } from "@/lib/salon-service-stages"

export type SalonServiceRow = {
  id?: number | string
  name?: string
  description?: string | null
  category?: string
  duration_minutes?: number | string
  durationMinutes?: number | string
  price?: number | string
  is_active?: boolean | number | string
  isActive?: boolean | number | string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

export type SalonService = {
  id: number
  name: string
  description: string | null
  category: string
  durationMinutes: number
  price: number
  isActive: boolean
  stages: SalonServiceStage[]
  createdAt: string
  updatedAt: string
}

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

function toStringValue(value: unknown) {
  return String(value ?? "").trim()
}

export function normalizeSalonServiceRow(row: SalonServiceRow): SalonService | null {
  const id = toNumber(row.id, NaN)
  const name = toStringValue(row.name)
  const category = toStringValue(row.category)
  if (!Number.isFinite(id) || !name || !category) {
    return null
  }

  const descriptionRaw = row.description
  const description = descriptionRaw == null ? null : toStringValue(descriptionRaw) || null

  return {
    id,
    name,
    description,
    category,
    durationMinutes: toNumber(row.duration_minutes ?? row.durationMinutes),
    price: toNumber(row.price),
    isActive: toBoolean(row.is_active ?? row.isActive ?? true),
    stages: [],
    createdAt: toStringValue(row.created_at ?? row.createdAt),
    updatedAt: toStringValue(row.updated_at ?? row.updatedAt),
  }
}

export function normalizeSalonServiceRows(rows: SalonServiceRow[]) {
  return rows
    .map((row) => normalizeSalonServiceRow(row))
    .filter((row): row is SalonService => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"))
}

export function groupSalonServicesByCategory(services: SalonService[]) {
  const groups = new Map<string, SalonService[]>()
  for (const service of services) {
    const category = service.category.trim() || "Diger"
    const bucket = groups.get(category) ?? []
    bucket.push(service)
    groups.set(category, bucket)
  }
  return Object.fromEntries(
    [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "tr")),
  )
}
