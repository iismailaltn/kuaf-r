"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useSalonServices } from "@/hooks/use-salon-services"
import { 
  Plus, Users, Clock, Scissors, X, Pencil, Trash2, Save, MapPin, 
  User, FileText, Camera, Upload, Instagram, Globe, Play, CheckCircle 
} from "lucide-react"

interface Table {
  id: number
  name: string
  status: "available" | "occupied" | "reserved" | "cleaning"
  occupiedSince?: number
  sessionData?: SessionData
}

interface SessionData {
  customerName: string
  customerSurname: string
  services: string[]
  staffId: string
  staffName: string
  notes: string
  startTime: number
}

interface StaffMember {
  id: string
  name: string
  specialties: string[]
}

interface PersonelApiRow {
  id?: string | number
  full_name?: string
  first_name?: string
  last_name?: string
  expertise?: string
  is_active?: boolean | number | string
}

function toStaffMember(row: PersonelApiRow, index: number): StaffMember | null {
  const fullName = String(row.full_name ?? "").trim()
  const firstName = String(row.first_name ?? "").trim()
  const lastName = String(row.last_name ?? "").trim()
  const name = fullName || `${firstName} ${lastName}`.trim()
  if (!name) {
    return null
  }

  const isActiveValue = row.is_active
  const isActive =
    isActiveValue === true ||
    isActiveValue === 1 ||
    isActiveValue === "1" ||
    isActiveValue === "true"
  if (!isActive) {
    return null
  }

  const specialties = String(row.expertise ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    id: String(row.id ?? `EMP${String(index + 1).padStart(3, "0")}`),
    name,
    specialties,
  }
}

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
  const { serviceNames: serviceOptions } = useSalonServices()
  const [tables, setTables] = useState<Table[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [now, setNow] = useState(Date.now())
  const [editingTableId, setEditingTableId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")

  // Session start modal state
  const [showStartSessionModal, setShowStartSessionModal] = useState(false)
  const [startSessionTableId, setStartSessionTableId] = useState<number | null>(null)
  const [sessionForm, setSessionForm] = useState({
    customerName: "",
    customerSurname: "",
    services: [] as string[],
    staffId: "",
    notes: "",
  })

  // Session end modal state
  const [showEndSessionModal, setShowEndSessionModal] = useState(false)
  const [endSessionTableId, setEndSessionTableId] = useState<number | null>(null)
  const [sessionPhoto, setSessionPhoto] = useState<string | null>(null)
  const [shareOnInstagram, setShareOnInstagram] = useState(false)
  const [shareOnWebsite, setShareOnWebsite] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadWorkspaces = useCallback(async () => {
    const res = await fetch("/api/workspaces")
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok || !Array.isArray(json?.rows)) {
      return
    }

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
    setTables(mapped)
  }, [])

  const loadStaff = useCallback(async () => {
    const res = await fetch("/api/personels", { cache: "no-store" })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok || !Array.isArray(json?.rows)) {
      return
    }

    const mapped = json.rows
      .map((row: PersonelApiRow, index: number) => toStaffMember(row, index))
      .filter((row: StaffMember | null): row is StaffMember => row !== null)
    setStaffList(mapped)
  }, [])

  useEffect(() => {
    void loadWorkspaces()
    void loadStaff()
  }, [loadWorkspaces, loadStaff])

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
    await loadWorkspaces()
  }

  const handleSetStatus = async (id: number, status: Table["status"], sessionData?: SessionData) => {
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
              occupiedSince: status === "occupied" ? Date.now() : undefined,
              sessionData: status === "occupied" ? sessionData : undefined,
            }
          : table
      )
    )
  }

  // Open start session modal
  const openStartSessionModal = (tableId: number) => {
    setStartSessionTableId(tableId)
    setSessionForm({
      customerName: "",
      customerSurname: "",
      services: [],
      staffId: "",
      notes: "",
    })
    setShowStartSessionModal(true)
  }

  // Close start session modal
  const closeStartSessionModal = () => {
    setShowStartSessionModal(false)
    setStartSessionTableId(null)
    setSessionForm({
      customerName: "",
      customerSurname: "",
      services: [],
      staffId: "",
      notes: "",
    })
  }

  // Toggle service selection
  const toggleService = (service: string) => {
    if (sessionForm.services.includes(service)) {
      setSessionForm({ ...sessionForm, services: sessionForm.services.filter((s) => s !== service) })
    } else {
      setSessionForm({ ...sessionForm, services: [...sessionForm.services, service] })
    }
  }

  // Start session
  const handleStartSession = () => {
    if (!startSessionTableId) return
    if (!sessionForm.customerName.trim() || !sessionForm.customerSurname.trim()) {
      alert("Lutfen musteri adi ve soyadini girin.")
      return
    }
    if (sessionForm.services.length === 0) {
      alert("Lutfen en az bir hizmet secin.")
      return
    }
    if (!sessionForm.staffId) {
      alert("Lutfen personel secin.")
      return
    }

    const selectedStaff = staffList.find((s) => s.id === sessionForm.staffId)
    const sessionData: SessionData = {
      customerName: sessionForm.customerName.trim(),
      customerSurname: sessionForm.customerSurname.trim(),
      services: sessionForm.services,
      staffId: sessionForm.staffId,
      staffName: selectedStaff?.name ?? "",
      notes: sessionForm.notes.trim(),
      startTime: Date.now(),
    }

    handleSetStatus(startSessionTableId, "occupied", sessionData)
    closeStartSessionModal()
  }

  // Open end session modal
  const openEndSessionModal = (tableId: number) => {
    setEndSessionTableId(tableId)
    setSessionPhoto(null)
    setShareOnInstagram(false)
    setShareOnWebsite(false)
    setShowEndSessionModal(true)
  }

  // Close end session modal
  const closeEndSessionModal = () => {
    stopCamera()
    setShowEndSessionModal(false)
    setEndSessionTableId(null)
    setSessionPhoto(null)
    setShareOnInstagram(false)
    setShareOnWebsite(false)
  }

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSessionPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      setCameraStream(stream)
      setIsCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      alert("Kamera erisimi saglanamadi.")
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setIsCameraActive(false)
  }

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        setSessionPhoto(canvas.toDataURL("image/jpeg"))
        stopCamera()
      }
    }
  }

  // End session
  const handleEndSession = () => {
    if (!endSessionTableId) return
    
    // TODO: Burada paylaşım işlemleri yapılabilir
    if (shareOnInstagram && sessionPhoto) {
      console.log("Instagram'da paylasilacak")
    }
    if (shareOnWebsite && sessionPhoto) {
      console.log("Web sitesinde paylasilacak")
    }

    handleSetStatus(endSessionTableId, "cleaning")
    closeEndSessionModal()
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
        onClick: () => openStartSessionModal(table.id),
        className:
          "w-full mt-3 rounded-lg bg-lime-600 hover:bg-lime-700 text-white border-lime-600",
      }
    }

    if (table.status === "occupied") {
      return {
        label: "Seansi bitir",
        onClick: () => openEndSessionModal(table.id),
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
      onClick: () => openStartSessionModal(table.id),
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
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.max(0, Math.floor((now - (table.occupiedSince ?? now)) / 60000))} dk gecti
                    </span>
                  </div>
                  {table.sessionData && (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <User className="w-3 h-3 text-primary" />
                        <span>{table.sessionData.customerName} {table.sessionData.customerSurname}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Scissors className="w-3 h-3" />
                        <span className="truncate">{table.sessionData.services.join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{table.sessionData.staffName}</span>
                      </div>
                    </div>
                  )}
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

      {/* Start Session Modal */}
      {showStartSessionModal && startSessionTableId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 z-10 relative bg-gradient-to-br from-lime-600 to-emerald-600 px-6 py-5">
              <button
                onClick={closeStartSessionModal}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Seans Baslat</h2>
                  <p className="text-sm text-white/70">
                    {tables.find((t) => t.id === startSessionTableId)?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Musteri Bilgileri
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Ad *</label>
                    <Input
                      placeholder="Musteri adi"
                      value={sessionForm.customerName}
                      onChange={(e) => setSessionForm({ ...sessionForm, customerName: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Soyad *</label>
                    <Input
                      placeholder="Musteri soyadi"
                      value={sessionForm.customerSurname}
                      onChange={(e) => setSessionForm({ ...sessionForm, customerSurname: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Services Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Yapilacak Islemler *
                </h3>
                <div className="flex flex-wrap gap-2">
                  {serviceOptions.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        sessionForm.services.includes(service)
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Personel Secimi *
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {staffList.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => setSessionForm({ ...sessionForm, staffId: staff.id })}
                      className={cn(
                        "p-3 rounded-xl text-left transition-all border-2",
                        sessionForm.staffId === staff.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                          : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                      )}
                    >
                      <div className="font-medium text-sm">{staff.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {staff.specialties.slice(0, 2).join(", ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notlar
                </h3>
                <Textarea
                  placeholder="Seans ile ilgili notlar..."
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  className="rounded-xl min-h-20 resize-none"
                />
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-lg shadow-emerald-600/25"
                  onClick={handleStartSession}
                >
                  <Play className="w-4 h-4" />
                  Seansi Baslat
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {showEndSessionModal && endSessionTableId !== null && (() => {
        const currentTable = tables.find((t) => t.id === endSessionTableId)
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="sticky top-0 z-10 relative bg-gradient-to-br from-red-500 to-rose-600 px-6 py-5">
                <button
                  onClick={closeEndSessionModal}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Seansi Bitir</h2>
                    <p className="text-sm text-white/70">{currentTable?.name}</p>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              {currentTable?.sessionData && (
                <div className="px-6 pt-4">
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {currentTable.sessionData.customerName} {currentTable.sessionData.customerSurname}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Scissors className="w-4 h-4" />
                      <span>{currentTable.sessionData.services.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        Sure: {Math.max(0, Math.floor((now - currentTable.sessionData.startTime) / 60000))} dakika
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Photo Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Fotograf
                  </h3>

                  {/* Photo Preview */}
                  {sessionPhoto && (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={sessionPhoto}
                        alt="Seans fotografı"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => setSessionPhoto(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}

                  {/* Camera Preview */}
                  {isCameraActive && (
                    <div className="relative rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                        <Button
                          size="sm"
                          className="rounded-full bg-white text-black hover:bg-white/90"
                          onClick={capturePhoto}
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          Cek
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full bg-black/50 text-white border-white/30 hover:bg-black/70"
                          onClick={stopCamera}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Iptal
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Photo Upload/Capture Buttons */}
                  {!sessionPhoto && !isCameraActive && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-20 rounded-xl border-2 border-dashed flex flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Fotograf Yukle</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 rounded-xl border-2 border-dashed flex flex-col gap-2"
                        onClick={startCamera}
                      >
                        <Camera className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Fotograf Cek</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                  )}
                </div>

                {/* Share Options */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Paylasim Secenekleri
                  </h3>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShareOnInstagram(!shareOnInstagram)}
                      className={cn(
                        "w-full p-4 rounded-xl flex items-center gap-3 transition-all border-2",
                        shareOnInstagram
                          ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-pink-500"
                          : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        shareOnInstagram ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-muted"
                      )}>
                        <Instagram className={cn("w-5 h-5", shareOnInstagram ? "text-white" : "text-muted-foreground")} />
                      </div>
                      <div className="text-left">
                        <div className={cn("font-medium text-sm", shareOnInstagram ? "text-pink-600" : "text-foreground")}>
                          Instagram&apos;da Paylas
                        </div>
                        <div className="text-xs text-muted-foreground">Calismanizi Instagram&apos;da paylasin</div>
                      </div>
                      <div className={cn(
                        "ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        shareOnInstagram ? "border-pink-500 bg-pink-500" : "border-muted-foreground/30"
                      )}>
                        {shareOnInstagram && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShareOnWebsite(!shareOnWebsite)}
                      className={cn(
                        "w-full p-4 rounded-xl flex items-center gap-3 transition-all border-2",
                        shareOnWebsite
                          ? "bg-blue-500/10 border-blue-500"
                          : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        shareOnWebsite ? "bg-blue-500" : "bg-muted"
                      )}>
                        <Globe className={cn("w-5 h-5", shareOnWebsite ? "text-white" : "text-muted-foreground")} />
                      </div>
                      <div className="text-left">
                        <div className={cn("font-medium text-sm", shareOnWebsite ? "text-blue-600" : "text-foreground")}>
                          Web Sitesinde Paylas
                        </div>
                        <div className="text-xs text-muted-foreground">Galeri sayfasinda goruntuleyin</div>
                      </div>
                      <div className={cn(
                        "ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        shareOnWebsite ? "border-blue-500 bg-blue-500" : "border-muted-foreground/30"
                      )}>
                        {shareOnWebsite && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <Button
                    className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium gap-2 shadow-lg shadow-red-500/25"
                    onClick={handleEndSession}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Seansi Bitir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
