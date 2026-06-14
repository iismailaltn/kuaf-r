export const SESSION_PAYLOAD_PREFIX = "__sessionB64:"

function encodeBase64Utf8(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function decodeBase64Utf8(encoded: string) {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeWorkspaceSessionPayload(sessionData: unknown) {
  if (!sessionData || typeof sessionData !== "object") {
    return "''"
  }

  const json = JSON.stringify({ __session: sessionData })
  return `'${SESSION_PAYLOAD_PREFIX}${encodeBase64Utf8(json)}'`
}

export function decodeWorkspaceSessionPayload(raw: unknown) {
  const text = String(raw ?? "").trim()
  if (!text) {
    return undefined
  }

  if (text.startsWith(SESSION_PAYLOAD_PREFIX)) {
    try {
      const json = decodeBase64Utf8(text.slice(SESSION_PAYLOAD_PREFIX.length))
      const parsed = JSON.parse(json) as { __session?: unknown }
      return parsed?.__session
    } catch {
      return undefined
    }
  }

  try {
    const parsed = JSON.parse(text) as { __session?: unknown }
    return parsed?.__session
  } catch {
    return undefined
  }
}
