"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useEffect, useState } from "react"
import type { SalonService } from "@/lib/salon-services"

export function useSalonServices(businessUserId?: string) {
  const [services, setServices] = useState<SalonService[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadServices = async () => {
      try {
        setIsLoading(true)
        const query = businessUserId ? `?businessUserId=${encodeURIComponent(businessUserId)}` : ""
        const res = await apiFetch(`/api/salon-services${query}`, { cache: "no-store" })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok || !Array.isArray(data?.rows) || cancelled) {
          return
        }
        setServices(data.rows)
      } catch {
        if (!cancelled) {
          setServices([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadServices()

    return () => {
      cancelled = true
    }
  }, [businessUserId])

  const activeServices = services.filter((service) => service.isActive)
  const serviceNames = activeServices.map((service) => service.name)

  return {
    services,
    activeServices,
    serviceNames,
    isLoading,
  }
}
