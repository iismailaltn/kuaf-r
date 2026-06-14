"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useCallback, useEffect, useState } from "react"
import type { InstagramSettings } from "@/lib/instagram-settings"

export type InstagramSettingsPayload = {
  instagramUserId: string
  instagramUsername?: string
  facebookPageId?: string
  accessToken: string
  tokenExpiresAt?: string
  scopes?: string
  isActive?: boolean
}

export function useInstagramSettings(businessUserId?: string) {
  const [settings, setSettings] = useState<InstagramSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      if (!businessUserId) {
        setSettings(null)
        return null
      }

      const res = await apiFetch(
        `/api/instagram-settings?businessUserId=${encodeURIComponent(businessUserId)}`,
        { cache: "no-store" },
      )
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setSettings(null)
        return null
      }

      const row = (data.row ?? null) as InstagramSettings | null
      setSettings(row)
      return row
    } catch {
      setSettings(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [businessUserId])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const saveSettings = useCallback(
    async (payload: InstagramSettingsPayload) => {
      try {
        setIsSaving(true)
        const res = await apiFetch("/api/instagram-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessUserId, ...payload }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) {
          return { ok: false as const, message: String(data?.message ?? "Kayit basarisiz.") }
        }

        const row = (data.row ?? null) as InstagramSettings | null
        setSettings(row)
        return { ok: true as const, row }
      } catch {
        return { ok: false as const, message: "Kayit sirasinda bir hata olustu." }
      } finally {
        setIsSaving(false)
      }
    },
    [businessUserId],
  )

  const disconnectSettings = useCallback(async () => {
    try {
      setIsSaving(true)
      const res = await apiFetch("/api/instagram-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessUserId, disconnect: true }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        return { ok: false as const, message: String(data?.message ?? "Baglanti kesilemedi.") }
      }

      setSettings(null)
      return { ok: true as const }
    } catch {
      return { ok: false as const, message: "Baglanti kesilirken bir hata olustu." }
    } finally {
      setIsSaving(false)
    }
  }, [businessUserId])

  return {
    settings,
    isLoading,
    isSaving,
    loadSettings,
    saveSettings,
    disconnectSettings,
  }
}
