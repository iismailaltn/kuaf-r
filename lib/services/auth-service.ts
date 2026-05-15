import { apiFetch } from "@/lib/api-fetch"
export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  accountType: "personel" | "customer"
  shopName: string
  ownerName: string
  firstName?: string
  lastName?: string
  taxOffice?: string
  taxNumber?: string
  email: string
  phone: string
  password: string
  specialty?: string[]
  experience?: string
}

export interface AuthUser {
  id: string
  username: string
  shopName: string
  role: string
  accountType: string
  isActive: boolean
  staffAccepted: boolean
  businessUserId: string
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

function getField(row: any, candidates: string[]) {
  if (!row || typeof row !== "object") return undefined
  const entries = Object.entries(row as Record<string, unknown>)
  for (const candidate of candidates) {
    const direct = (row as Record<string, unknown>)[candidate]
    if (direct !== undefined && direct !== null) return direct
    const found = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

export async function loginWithApi(payload: LoginPayload): Promise<AuthUser> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const json = (await res.json().catch(() => null)) as any
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? "Giris basarisiz.")
  }

  const id = String(getField(json.user, ["id", "ID", "user_id", "userId"]) ?? "")
  const username = String(getField(json.user, ["username"]) ?? payload.username)
  const shopName = String(getField(json.user, ["shopName", "shop_name", "business_name"]) ?? "Kuaför")
  const role = String(getField(json.user, ["role"]) ?? "user").trim().toLowerCase()
  const accountType = String(getField(json.user, ["accountType", "account_type"]) ?? "").trim().toLowerCase()
  const isActive = json.user?.isActive !== undefined
    ? toBoolean(json.user.isActive)
    : toBoolean(getField(json.user, ["is_active", "isActive"]) ?? true)
  const staffAccepted = toBoolean(getField(json.user, ["staffAccepted", "staff_accepted"]) ?? false)
  const businessUserId = String(getField(json.user, ["businessUserId", "business_user_id"]) ?? (accountType === "kurumsal" ? id : ""))

  return { id, username, shopName, role, accountType, isActive, staffAccepted, businessUserId }
}

export async function registerWithApi(payload: RegisterPayload): Promise<AuthUser> {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const json = (await res.json().catch(() => null)) as any
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? "Kayit basarisiz.")
  }

  const id = String(getField(json.user, ["id", "ID", "user_id", "userId"]) ?? "")
  const username = String(getField(json.user, ["username"]) ?? payload.email)
  const shopName = String(getField(json.user, ["shopName", "shop_name"]) ?? payload.shopName ?? payload.ownerName ?? "Kuaför")
  const role = String(getField(json.user, ["role"]) ?? "user").trim().toLowerCase()
  const accountType = String(getField(json.user, ["accountType", "account_type"]) ?? "").trim().toLowerCase()
  const isActive = getField(json.user, ["isActive", "is_active"]) !== undefined
    ? toBoolean(getField(json.user, ["isActive", "is_active"]))
    : true
  const staffAccepted = toBoolean(getField(json.user, ["staffAccepted", "staff_accepted"]) ?? false)
  const businessUserId = String(getField(json.user, ["businessUserId", "business_user_id"]) ?? (accountType === "kurumsal" ? id : ""))

  return {
    username,
    id,
    shopName,
    role,
    accountType,
    isActive,
    staffAccepted,
    businessUserId,
  }
}
