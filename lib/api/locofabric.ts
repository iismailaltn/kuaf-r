import { apiConfig, apiTokens, type ApiTokenKey } from "@/lib/api/config"
import { apiRequest } from "@/lib/api/client"

export interface LocoFabricRequestOptions<TBody = unknown> {
  tokenKey: ApiTokenKey
  path: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: TBody
  headers?: Record<string, string>
  signal?: AbortSignal
}

export async function locoFabricRequest<TResponse, TBody = unknown>(
  options: LocoFabricRequestOptions<TBody>
): Promise<TResponse> {
  const token = apiTokens[options.tokenKey]
  if (!token) {
    throw new Error(`Missing token for key: ${options.tokenKey}`)
  }

  const normalizedPath = options.path.startsWith("/") ? options.path : `/${options.path}`
  const url = `${apiConfig.serverURL}${normalizedPath}`

  return apiRequest<TResponse, TBody>(url, {
    method: options.method,
    body: options.body,
    token,
    headers: options.headers,
    signal: options.signal,
  })
}
