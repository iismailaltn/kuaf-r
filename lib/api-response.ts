export type ApiFetchResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

export type ApiJsonBody = {
  ok?: boolean
  message?: string
  error?: string
  rows?: unknown[]
  user?: unknown
  [key: string]: unknown
}

export async function readApiJson<T extends ApiJsonBody = ApiJsonBody>(
  response: ApiFetchResponse
): Promise<T | null> {
  try {
    const data = await response.json()
    if (data === null || data === undefined) return null
    return data as T
  } catch {
    return null
  }
}

export function apiJson(data: unknown, status = 200): ApiFetchResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }
}
