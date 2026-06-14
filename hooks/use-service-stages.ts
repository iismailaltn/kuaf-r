"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useCallback } from "react"
import { businessDurationFromStageList } from "@/lib/business-service-stages-db"
import {
  ensureServiceFirstStage,
  normalizeSalonServiceStages,
  type SalonServiceStage,
} from "@/lib/salon-service-stages"
import type { SalonService } from "@/lib/salon-services"

export function useServiceStages(businessUserId?: string, services: SalonService[] = []) {
  const getStagesForService = useCallback((service: SalonService) => {
    return ensureServiceFirstStage(
      service.stages?.length ? service.stages : [],
      service.name,
      service.durationMinutes,
    )
  }, [])

  const saveStagesForService = useCallback(
    async (serviceId: number, stages: SalonServiceStage[], service?: SalonService) => {
      if (!businessUserId) {
        return { ok: false as const, message: "Isletme bilgisi yok." }
      }

      const normalized = normalizeSalonServiceStages(
        stages,
        service?.name ?? "",
        service?.durationMinutes ?? 30,
      )
      const durationMinutes = businessDurationFromStageList(
        normalized,
        service?.durationMinutes ?? 30,
      )

      const res = await apiFetch(`/api/salon-services/${serviceId}/stages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessUserId,
          stages: normalized,
          serviceName: service?.name,
          durationMinutes,
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        return { ok: false as const, message: String(data?.message ?? "Asamalar kaydedilemedi.") }
      }
      return { ok: true as const }
    },
    [businessUserId],
  )

  return {
    getStagesForService,
    saveStagesForService,
  }
}
