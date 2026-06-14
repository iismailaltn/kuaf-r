import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { getMembershipTimeRemaining, isMembershipPlan, type MembershipPlan } from "@/lib/corporate-membership"
import { getBusinessUserIdFromBody, getBusinessUserIdFromRequest, requireBusinessUserId } from "@/lib/business-scope"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import { apiJson } from "@/lib/api-response"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

function sqlString(value: string) {
  return `'${sanitizeSqlString(value)}'`
}

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

function isActiveValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true"
}

function findCorporateProfileByUserId(rows: Record<string, unknown>[], userId: string) {
  return rows.find((row) => String(getField(row, ["user_id", "userId"]) ?? "").trim() === userId) ?? null
}

function mapMembershipRow(profile: Record<string, unknown> | null, userIsActive: boolean) {
  const plan = String(getField(profile, ["membership_plan", "membershipPlan"]) ?? "").trim().toLowerCase()
  const membershipPlan: MembershipPlan | null = isMembershipPlan(plan) ? plan : null
  const subscriptionStartsAt = String(
    getField(profile, ["subscription_starts_at", "subscriptionStartsAt"]) ?? "",
  ).trim() || null
  const subscriptionEndsAt = String(
    getField(profile, ["subscription_ends_at", "subscriptionEndsAt"]) ?? "",
  ).trim() || null
  const timeRemaining = userIsActive
    ? getMembershipTimeRemaining(subscriptionStartsAt, subscriptionEndsAt)
    : null
  const pendingUpgradeRequest = isActiveValue(getField(profile, ["pending_upgrade_request", "pendingUpgradeRequest"]))

  return {
    membershipPlan,
    subscriptionStartsAt,
    subscriptionEndsAt,
    timeRemaining,
    isApproved: userIsActive,
    hasSelectedPlan: Boolean(membershipPlan),
    pendingUpgradeRequest,
  }
}

async function loadMembershipContext(businessUserId: string) {
  const corporateToken = appConfig.token.corporate_profiles
  const userToken = appConfig.token.users

  if (!corporateToken || !userToken) {
    throw new Error("Kurumsal uyelik tokenlari tanimli degil.")
  }

  const [corporateData, usersData] = await Promise.all([
    selectByToken<unknown>(corporateToken),
    selectByToken<unknown>(userToken),
  ])

  const corporateProfiles = extractRows(corporateData)
  const users = extractRows(usersData)
  const profile = findCorporateProfileByUserId(corporateProfiles, businessUserId)
  const user = users.find((row) => String(getField(row, ["id", "ID", "user_id", "userId"]) ?? "").trim() === businessUserId)
  const isActive =
    user &&
    (getField(user, ["is_active", "isActive"]) === true ||
      getField(user, ["is_active", "isActive"]) === 1 ||
      getField(user, ["is_active", "isActive"]) === "1")

  return {
    profile,
    profileId: String(getField(profile, ["id", "ID"]) ?? "").trim(),
    membership: mapMembershipRow(profile, Boolean(isActive)),
  }
}

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const { profile, membership } = await loadMembershipContext(businessUserId)
    return apiJson({
      ok: true,
      membership,
      profile: profile
        ? {
            businessName: String(getField(profile, ["business_name", "businessName"]) ?? "").trim(),
            ownerFirstName: String(getField(profile, ["owner_first_name", "ownerFirstName"]) ?? "").trim(),
            ownerLastName: String(getField(profile, ["owner_last_name", "ownerLastName"]) ?? "").trim(),
          }
        : null,
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({ ok: false, message: "Uyelik bilgileri getirilemedi.", error: axiosErr?.message ?? String(err) },
      { status: 502 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const corporateToken = appConfig.token.corporate_profiles
    if (!corporateToken) {
      return apiJson({ ok: false, message: "corporate_profiles token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | { businessUserId?: string | number; plan?: string; action?: string }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const action = String(body?.action ?? "select").trim().toLowerCase()
    const plan = String(body?.plan ?? "").trim().toLowerCase()

    if (!isMembershipPlan(plan)) {
      return apiJson({ ok: false, message: "Gecersiz paket." }, 400)
    }

    const { profile, profileId, membership } = await loadMembershipContext(businessUserId)
    if (!profile || !profileId) {
      return apiJson({ ok: false, message: "Kurumsal profil bulunamadi." }, 404)
    }

    if (action === "upgrade") {
      if (membership.membershipPlan !== "basic") {
        return apiJson({ ok: false, message: "Yukseltme yalnizca baslangic paketinden yapilabilir." }, 400)
      }
      if (!membership.isApproved) {
        return apiJson({ ok: false, message: "Yukseltme icin onayli uyelik gerekir." }, 400)
      }
    }

    if (action === "request_upgrade") {
      if (membership.membershipPlan !== "basic") {
        return apiJson({ ok: false, message: "Yukseltme yalnizca baslangic paketinden yapilabilir." }, 400)
      }
      if (!membership.isApproved) {
        return apiJson({ ok: false, message: "Yukseltme icin onayli uyelik gerekir." }, 400)
      }
      if (plan !== "professional") {
        return apiJson({ ok: false, message: "Sadece profesyonel pakete yukseltme talebi yapilabilir." }, 400)
      }

      await sqlToken(
        corporateToken,
        `UPDATE corporate_profiles SET pending_upgrade_request=1 WHERE user_id=${businessUserId}`,
      )

      const refreshed = await loadMembershipContext(businessUserId)
      return apiJson({ ok: true, membership: refreshed.membership })
    }

    await sqlToken(
      corporateToken,
      `UPDATE corporate_profiles SET membership_plan=${sqlString(plan)} WHERE user_id=${businessUserId}`,
    )

    const refreshed = await loadMembershipContext(businessUserId)
    return apiJson({ ok: true, membership: refreshed.membership })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson({ ok: false, message: "Uyelik bilgileri guncellenemedi.", error: axiosErr?.message ?? String(err) },
      { status: 502 },
    )
  }
}
