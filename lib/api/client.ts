type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ApiRequestOptions<TBody = unknown> {
  method?: HttpMethod
  body?: TBody
  token?: string
  headers?: Record<string, string>
  signal?: AbortSignal
}

export class ApiError extends Error {
  public readonly status: number
  public readonly data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export async function apiRequest<TResponse, TBody = unknown>(
  url: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, token, headers, signal } = options

  const response = await fetch(url, {
    method,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = response.headers.get("content-type") ?? ""
  const isJson = contentType.includes("application/json")
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    throw new ApiError(`API request failed with status ${response.status}`, response.status, data)
  }

  return data as TResponse
}
