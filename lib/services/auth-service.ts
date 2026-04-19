export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  restaurantName: string
  ownerName: string
  username: string
  phone: string
  password: string
}

export interface AuthUser {
  username: string
  restaurantName: string
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
  const restaurantName = String(json.user?.restaurantName ?? json.user?.restaurant_name ?? "Restoran")

  return { username, restaurantName }
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
    restaurantName: payload.restaurantName,
  }
}
