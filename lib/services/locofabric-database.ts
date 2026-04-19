import { createAxios } from "@/lib/api/axios"

export async function sqlToken<T = unknown>(token: string, sql: string) {
  const axios = createAxios()
  const { data } = await axios.post<T>("Database/SQLToken", { token, sql })
  return data
}

export async function selectByToken<T = unknown>(token: string) {
  const axios = createAxios()
  const { data } = await axios.get<T>(`Database/Select?token=${encodeURIComponent(token)}`)
  return data
}

