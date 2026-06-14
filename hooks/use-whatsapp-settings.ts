import { apiFetch } from "@/lib/api-fetch"
import { useCallback, useEffect, useState } from "react"

interface WhatsAppSettings {
  phoneNumber: string
  phoneNumberId: string
  whatsappBusinessAccountId: string
  accessToken: string
  isActive: boolean
}

interface WhatsAppSettingsPayload {
  phoneNumber: string
  phoneNumberId: string
  whatsappBusinessAccountId: string
  accessToken: string
  isActive?: boolean
}

interface WhatsAppSettingsResult {
  ok: boolean
  message?: string
}

export function useWhatsAppSettings(businessUserId?: string | number) {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    if (!businessUserId) return

    try {
      setIsLoading(true)
      const res = await apiFetch(`/api/whatsapp-settings?businessUserId=${businessUserId}`)
      const data = await res.json()
      if (data.ok && data.settings) {
        setSettings(data.settings)
      }
    } catch (err) {
      console.error("Failed to load WhatsApp settings:", err)
    } finally {
      setIsLoading(false)
    }
  }, [businessUserId])

  const saveSettings = useCallback(async (payload: WhatsAppSettingsPayload): Promise<WhatsAppSettingsResult> => {
    if (!businessUserId) {
      return { ok: false, message: "Business user ID gerekli." }
    }

    try {
      setIsSaving(true)
      const res = await apiFetch("/api/whatsapp-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessUserId, ...payload }),
      })
      const data = await res.json()
      
      if (!data.ok) {
        return { ok: false, message: data.message || "Kaydedilemedi." }
      }

      await loadSettings()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: "Kaydedilemedi." }
    } finally {
      setIsSaving(false)
    }
  }, [businessUserId, loadSettings])

  const disconnectSettings = useCallback(async (): Promise<WhatsAppSettingsResult> => {
    if (!businessUserId) {
      return { ok: false, message: "Business user ID gerekli." }
    }

    try {
      setIsSaving(true)
      const res = await apiFetch("/api/whatsapp-settings/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessUserId }),
      })
      const data = await res.json()
      
      if (!data.ok) {
        return { ok: false, message: data.message || "Baglanti kesilemedi." }
      }

      setSettings(null)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: "Baglanti kesilemedi." }
    } finally {
      setIsSaving(false)
    }
  }, [businessUserId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    disconnectSettings,
  }
}
