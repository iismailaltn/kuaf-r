"use client"

import { useEffect, useState } from "react"
import type { SalonService } from "@/lib/salon-services"

export function useSalonServices() {
  const [services, setServices] = useState<SalonService[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadServices = async () => {
      try {
        setIsLoading(true)
        const res = await fetch("/api/salon-services", { cache: "no-store" })
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
  }, [])

  const activeServices = services.filter((service) => service.isActive)
  const serviceNames = activeServices.map((service) => service.name)

  return {
    services,
    activeServices,
    serviceNames,
    isLoading,
  }
}
