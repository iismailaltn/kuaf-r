"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useCallback, useEffect, useState } from "react"
import type { ReservationRecord, ReservationStatus } from "@/lib/reservations-store"

/** Bireysel personel icin `individualUserId` (users.id) gonderin. */
export function useReservations(businessUserId?: string, individualUserId?: string) {
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReservations = useCallback(async () => {
    if (!businessUserId) {
      setReservations([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ businessUserId })
      if (individualUserId) {
        params.set("individualUserId", individualUserId)
      }
      const res = await apiFetch(`/api/reservations?${params.toString()}`, { cache: "no-store" })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        rows?: ReservationRecord[]
        message?: string
      } | null

      if (!res.ok || !data?.ok || !Array.isArray(data.rows)) {
        setError(String(data?.message ?? "Randevular yuklenemedi."))
        setReservations([])
        return
      }

      setReservations(data.rows)
    } catch {
      setError("Randevular yuklenirken hata olustu.")
      setReservations([])
    } finally {
      setIsLoading(false)
    }
  }, [businessUserId, individualUserId])

  useEffect(() => {
    void loadReservations()
  }, [loadReservations])

  const createReservation = useCallback(
    async (payload: Omit<ReservationRecord, "id">) => {
      if (!businessUserId) {
        return { ok: false as const, message: "Isletme bilgisi yok." }
      }

      const res = await apiFetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, businessUserId }),
      })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        row?: ReservationRecord
        message?: string
      } | null

      if (!res.ok || !data?.ok || !data.row) {
        return { ok: false as const, message: String(data?.message ?? "Randevu kaydedilemedi.") }
      }

      setReservations((prev) => [...prev, data.row!].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)))
      return { ok: true as const, row: data.row }
    },
    [businessUserId],
  )

  const updateReservationStatus = useCallback(
    async (id: string, status: ReservationStatus) => {
      if (!businessUserId) {
        return { ok: false as const }
      }

      const res = await apiFetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessUserId, status }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !data?.ok) {
        return { ok: false as const, message: String(data?.message ?? "Guncellenemedi.") }
      }

      setReservations((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status } : row)),
      )
      return { ok: true as const }
    },
    [businessUserId],
  )

  return {
    reservations,
    isLoading,
    error,
    loadReservations,
    createReservation,
    updateReservationStatus,
  }
}
