export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  shopName: string
  ownerName: string
  username: string
  phone: string
  password: string
}

export interface AuthUser {
  username: string
  shopName: string
  role: string
}

export async function loginWithApi(payload: LoginPayload): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const json = (await res.json().catch(() => null)) as any
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? "Giris basarisiz.")
  }

  const username = String(json.user?.username ?? payload.username)
  const shopName = String(json.user?.shopName ?? json.user?.shop_name ?? "Kuaför")
  const role = String(json.user?.role ?? "user").trim().toLowerCase()

  return { username, shopName, role }
}

export async function registerWithApi(payload: RegisterPayload): Promise<AuthUser> {
  // TODO: Replace path and response mapping after you share final endpoint contract.
  await locoFabricRequest<unknown, RegisterPayload>({
    tokenKey: "user",
    path: "/api/auth/register",
    method: "POST",
    body: payload,
  })

  return {
    username: payload.username,
    shopName: payload.shopName,
    role: "user",
  }
}
