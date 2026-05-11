"use client"

import { useCallback, useEffect, useState } from "react"
import type { GooglePlaceSettings } from "@/lib/google-place-settings"

export function useGooglePlaceSettings() {
  const [settings, setSettings] = useState<GooglePlaceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/google-place-settings", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setSettings(null)
        return null
      }

      const row = data.row ?? null
      setSettings(row)
      return row as GooglePlaceSettings | null
    } catch {
      setSettings(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const saveSettings = useCallback(async (placesApiKey: string, placeId: string) => {
    try {
      setIsSaving(true)
      const res = await fetch("/api/google-place-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placesApiKey, placeId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        return { ok: false as const, message: String(data?.message ?? "Kayit basarisiz.") }
      }

      const row = (data.row ?? null) as GooglePlaceSettings | null
      setSettings(row)
      return { ok: true as const, row }
    } catch {
      return { ok: false as const, message: "Kayit sirasinda bir hata olustu." }
    } finally {
      setIsSaving(false)
    }
  }, [])

  return {
    settings,
    isLoading,
    isSaving,
    loadSettings,
    saveSettings,
  }
}
