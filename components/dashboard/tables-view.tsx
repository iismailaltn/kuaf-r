"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, Users, Clock, Scissors, X, Pencil, Trash2, Save, MapPin } from "lucide-react"

interface Table {
  id: number
  name: string
  status: "available" | "occupied" | "reserved" | "cleaning"
  occupiedSince?: number
}

const initialTables: Table[] = [
  { id: 1, name: "Calisma Alani 1", status: "occupied", occupiedSince: Date.now() - 45 * 60 * 1000 },
  { id: 2, name: "Calisma Alani 2", status: "available" },
  { id: 3, name: "Calisma Alani 3", status: "reserved" },
  { id: 4, name: "Calisma Alani 4", status: "occupied", occupiedSince: Date.now() - 30 * 60 * 1000 },
  { id: 5, name: "Calisma Alani 5", status: "available" },
  { id: 6, name: "Calisma Alani 6", status: "cleaning" },
  { id: 7, name: "Calisma Alani 7", status: "occupied", occupiedSince: Date.now() - 15 * 60 * 1000 },
  { id: 8, name: "Calisma Alani 8", status: "reserved" },
  { id: 9, name: "Calisma Alani 9", status: "available" },
  { id: 10, name: "Calisma Alani 10", status: "occupied", occupiedSince: Date.now() - 60 * 60 * 1000 },
  { id: 11, name: "Calisma Alani 11", status: "reserved" },
  { id: 12, name: "Calisma Alani 12", status: "available" },
]

const statusConfig = {
  available: { color: "bg-green-500", bgColor: "bg-green-100 border-green-300", label: "Musait" },
  occupied: { color: "bg-blue-500", bgColor: "bg-blue-100 border-blue-300", label: "Dolu" },
  reserved: { color: "bg-blue-500", bgColor: "bg-blue-50 border-blue-200", label: "Rezerve" },
  cleaning: { color: "bg-orange-500", bgColor: "bg-orange-100 border-orange-300", label: "Temizleniyor" },
}

interface TablesViewProps {
  canManage?: boolean
}

export function TablesView({ canManage = false }: TablesViewProps) {
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [now, setNow] = useState(Date.now())
  const [editingTableId, setEditingTableId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const res = await fetch("/api/workspaces")
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok || !json?.ok || !Array.isArray(json?.rows) || cancelled) return

      const mapped: Table[] = json.rows.map((row: any, index: number) => {
        const statusRaw = String(row.status ?? "available").toLowerCase()
        const status: Table["status"] =
          statusRaw === "occupied" || statusRaw === "reserved" || statusRaw === "cleaning"
            ? statusRaw
            : "available"
        return {
          id: Number(row.id ?? index + 1),
          name: String(row.table_number ?? row.tableNumber ?? `Calisma Alani ${index + 1}`),
          status,
        }
      })
      if (mapped.length > 0) setTables(mapped)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAddWorkspace = async () => {
    const nextId = tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1
    const tableName = `Calisma Alani ${nextId}`
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: tableName,
        capacity: 1,
        status: "available",
        isReservable: true,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Calisma alani eklenemedi.")
      return
    }
    setTables((prev) => [
      ...prev,
      {
        id: nextId,
        name: tableName,
        status: "available",
      },
    ])
  }

  const handleSetStatus = async (id: number, status: Table["status"]) => {
    const current = tables.find((table) => table.id === id)
    if (!current) return
    const res = await fetch(`/api/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        previousTableNumber: current.name,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Calisma alani status guncellenemedi.")
      return
    }

    setTables((prev) =>
      prev.map((table) =>
        table.id === id
          ? {
              ...table,
              status,
              occupiedSince: status === "occupied" ? (table.occupiedSince ?? Date.now()) : undefined,
            }
          : table
      )
    )
  }

  const openEditCard = (id: number) => {
    const current = tables.find((t) => t.id === id)
    if (!current) return
    setEditingTableId(id)
    setEditingName(current.name)
  }

  const closeEditCard = () => {
    setEditingTableId(null)
    setEditingName("")
  }

  const handleRenameWorkspace = async () => {
    if (!editingTableId) return
    const trimmed = editingName.trim()
    if (!trimmed) return
    const current = tables.find((table) => table.id === editingTableId)
    const res = await fetch(`/api/workspaces/${editingTableId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: trimmed,
        previousTableNumber: current?.name ?? "",
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Calisma alani guncellenemedi.")
      return
    }
    setTables((prev) => prev.map((table) => (table.id === editingTableId ? { ...table, name: trimmed } : table)))
    closeEditCard()
  }

  const handleRemoveWorkspace = async () => {
    if (!editingTableId) return
    const current = tables.find((table) => table.id === editingTableId)
    if (!current) return
    const res = await fetch(`/api/workspaces/${editingTableId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previousTableNumber: current.name,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Calisma alani silinemedi.")
      return
    }
    setTables((prev) => prev.filter((table) => table.id !== editingTableId))
    closeEditCard()
  }

  const getActionButtonConfig = (table: Table) => {
    if (table.status === "available") {
      return {
        label: "Seansi baslat",
        onClick: () => handleSetStatus(table.id, "occupied"),
        className:
          "w-full mt-3 rounded-lg bg-lime-600 hover:bg-lime-700 text-white border-lime-600",
      }
    }

    if (table.status === "occupied") {
      return {
        label: "Seansi bitir",
        onClick: () => handleSetStatus(table.id, "cleaning"),
        className:
          "w-full mt-3 rounded-lg bg-red-500 hover:bg-red-600 text-white border-red-500",
      }
    }

    if (table.status === "cleaning") {
      return {
        label: "Hijyene al",
        onClick: () => handleSetStatus(table.id, "available"),
        className:
          "w-full mt-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
      }
    }

    return {
      label: "Seansi baslat",
      onClick: () => handleSetStatus(table.id, "occupied"),
      className:
        "w-full mt-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600",
    }
  }

  const statusSummary = [
    { label: "Musait", count: tables.filter(t => t.status === "available").length, color: "bg-green-500" },
    { label: "Dolu", count: tables.filter(t => t.status === "occupied").length, color: "bg-amber-500" },
    { label: "Rezerve", count: tables.filter(t => t.status === "reserved").length, color: "bg-blue-500" },
    { label: "Temizleniyor", count: tables.filter(t => t.status === "cleaning").length, color: "bg-gray-400" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Calisma Alani Yonetimi</h1>
        {canManage && (
          <Button className="rounded-xl" onClick={handleAddWorkspace}>
            <Plus className="w-4 h-4 mr-1" />
            Calisma alani ekle
          </Button>
        )}
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusSummary.map((status) => (
          <div
            key={status.label}
            className="p-4 bg-card rounded-2xl border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("w-3 h-3 rounded-full", status.color)} />
              <span className="text-sm text-muted-foreground">{status.label}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{status.count}</span>
          </div>
        ))}
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const config = statusConfig[table.status]
          const actionButton = getActionButtonConfig(table)
          return (
            <div
              key={table.id}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md",
                config.bgColor
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{table.name}</h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    table.status === "available" && "bg-green-100 text-green-700 border-green-300",
                    table.status === "occupied" && "bg-blue-100 text-blue-700 border-blue-300",
                    table.status === "reserved" && "bg-blue-100 text-blue-700 border-blue-300",
                    table.status === "cleaning" && "bg-orange-100 text-orange-700 border-orange-300"
                  )}
                >
                  {config.label}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span>{table.status === "available" ? "0/1 kisi" : "1/1 kisi"}</span>
              </div>

              {table.status === "occupied" && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.max(0, Math.floor((now - (table.occupiedSince ?? now)) / 60000))} dk gecti
                    </span>
                  </div>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className={actionButton.className}
                onClick={actionButton.onClick}
              >
                <Scissors className="w-4 h-4 mr-1" />
                {actionButton.label}
              </Button>

              {canManage && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-lg"
                    onClick={() => openEditCard(table.id)}
                  >
                    Duzenle
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canManage && editingTableId !== null && (() => {
        const currentTable = tables.find(t => t.id === editingTableId)
        const currentStatus = currentTable?.status ?? "available"
        const statusInfo = statusConfig[currentStatus]
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-primary/90 to-primary px-6 py-5">
                <button
                  onClick={closeEditCard}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Pencil className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Calisma Alani Duzenle</h2>
                    <p className="text-sm text-white/70">Bilgileri guncelleyin</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Current Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Mevcut Durum</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      currentStatus === "available" && "bg-green-100 text-green-700 border-green-300",
                      currentStatus === "occupied" && "bg-blue-100 text-blue-700 border-blue-300",
                      currentStatus === "reserved" && "bg-blue-100 text-blue-700 border-blue-300",
                      currentStatus === "cleaning" && "bg-orange-100 text-orange-700 border-orange-300"
                    )}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Calisma Alani Adi</label>
                  <div className="relative">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Orn: Calisma Alani 1"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                    onClick={handleRenameWorkspace}
                  >
                    <Save className="w-4 h-4" />
                    Degisiklikleri Kaydet
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl border-2 hover:bg-muted/50 font-medium transition-all"
                      onClick={closeEditCard}
                    >
                      Vazgec
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 font-medium gap-2 transition-all"
                      onClick={handleRemoveWorkspace}
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
