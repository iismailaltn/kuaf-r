import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { getPlanById, isMembershipPlan } from "@/lib/corporate-membership"
import { activateMembershipSubscription } from "@/lib/services/corporate-membership-service"
import { extractRows, selectAllByToken, sqlToken } from "@/lib/services/locofabric-database"
import { apiJson } from "@/lib/api-response"

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

function isActiveValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

function getUserId(row: Record<string, unknown> | null | undefined) {
  return String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim()
}

function mapCorporateCustomerRow(
  userId: string,
  user: Record<string, unknown> | null | undefined,
  profile: Record<string, unknown> | null | undefined,
) {
  const role = String(getField(user, ["role"]) ?? "user").trim().toLowerCase()
  const accountType = String(getField(user, ["account_type", "accountType"]) ?? "").trim().toLowerCase()
  const isActive = isActiveValue(getField(user, ["is_active", "isActive"])) || role === "admin"
  const pendingUpgradeRequest = isActiveValue(getField(profile, ["pending_upgrade_request", "pendingUpgradeRequest"]))

  return {
    userId,
    username: String(getField(user, ["username"]) ?? ""),
    phone: String(getField(user, ["phone"]) ?? ""),
    role,
    accountType,
    isActive,
    businessName: String(getField(profile, ["business_name", "businessName"]) ?? ""),
    ownerFirstName: String(getField(profile, ["owner_first_name", "ownerFirstName"]) ?? ""),
    ownerLastName: String(getField(profile, ["owner_last_name", "ownerLastName"]) ?? ""),
    taxOffice: String(getField(profile, ["tax_office", "taxOffice"]) ?? ""),
    taxNumber: String(getField(profile, ["tax_number", "taxNumber"]) ?? ""),
    membershipPlan: (() => {
      const plan = String(getField(profile, ["membership_plan", "membershipPlan"]) ?? "").trim().toLowerCase()
      return isMembershipPlan(plan) ? plan : null
    })(),
    membershipPlanTitle: (() => {
      if (pendingUpgradeRequest) {
        return getPlanById("professional")?.title ?? "Profesyonel"
      }
      const plan = String(getField(profile, ["membership_plan", "membershipPlan"]) ?? "").trim().toLowerCase()
      return isMembershipPlan(plan) ? getPlanById(plan)?.title ?? plan : "—"
    })(),
    pendingUpgradeRequest,
    requestType: pendingUpgradeRequest ? "upgrade" : "registration",
  }
}

export async function GET() {
  try {
    const userToken = appConfig.token.users
    const corporateToken = appConfig.token.corporate_profiles

    if (!userToken || !corporateToken) {
      return apiJson({ ok: false, message: "Kurumsal onay tokenlari tanimli degil." }, 500)
    }

    const [usersData, corporateData] = await Promise.all([
      selectAllByToken<unknown>(userToken, "users"),
      selectAllByToken<unknown>(corporateToken, "corporate_profiles"),
    ])

    const users = extractRows<Record<string, unknown>>(usersData)
    const corporateProfiles = extractRows<Record<string, unknown>>(corporateData)

    const usersById = new Map<string, Record<string, unknown>>()
    for (const user of users) {
      const userId = getUserId(user)
      if (userId) usersById.set(userId, user)
    }

    const profilesByUserId = new Map<string, Record<string, unknown>>()
    for (const profile of corporateProfiles) {
      const userId = String(getField(profile, ["user_id", "userId"]) ?? "").trim()
      if (userId) profilesByUserId.set(userId, profile)
    }

    const customerUserIds = new Set<string>([
      ...profilesByUserId.keys(),
      ...users
        .filter((user) => String(getField(user, ["account_type", "accountType"]) ?? "").trim().toLowerCase() === "kurumsal")
        .map((user) => getUserId(user))
        .filter(Boolean),
    ])

    const rows = Array.from(customerUserIds)
      .map((userId) =>
        mapCorporateCustomerRow(
          userId,
          usersById.get(userId),
          profilesByUserId.get(userId),
        ),
      )
      .filter((row) => row.userId && (row.accountType === "kurumsal" || profilesByUserId.has(row.userId)))

    return apiJson({ ok: true, rows })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({ ok: false, message: "Kurumsal kayitlar getirilemedi.", error: axiosErr?.message ?? String(err) }, 502)
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { userId?: string | number; requestType?: string } | null
    const userId = String(body?.userId ?? "").trim()
    const requestType = String(body?.requestType ?? "registration").trim().toLowerCase()

    if (!/^\d+$/.test(userId)) {
      return apiJson({ ok: false, message: "Gecersiz kullanici id." }, 400)
    }

    const userToken = appConfig.token.users
    const corporateToken = appConfig.token.corporate_profiles
    if (!userToken || !corporateToken) {
      return apiJson({ ok: false, message: "Token tanimli degil." }, 500)
    }

    if (requestType === "upgrade") {
      await sqlToken(corporateToken, `UPDATE corporate_profiles SET membership_plan='professional', pending_upgrade_request=0 WHERE user_id=${userId}`)
      return apiJson({ ok: true })
    }

    await sqlToken(userToken, `UPDATE users SET is_active = 1, role = 'admin' WHERE id = ${userId}`)
    await activateMembershipSubscription(userId)

    return apiJson({ ok: true })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({ ok: false, message: "Kurumsal kayit onaylanamadi.", error: axiosErr?.message ?? String(err) }, 502)
  }
}
