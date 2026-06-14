"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useCallback, useEffect, useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useSalonServices } from "@/hooks/use-salon-services"
import { SalonServicePickerGrid } from "@/components/dashboard/salon-service-operation-cards"
import { decodeWorkspaceSessionPayload } from "@/lib/session-payload"
import { SESSION_OPERATIONS_UPDATED_EVENT } from "@/lib/session-performance-analytics"
import type { SalonService } from "@/lib/salon-services"
import { 
  Plus, Users, Clock, Scissors, X, Pencil, Trash2, Save, MapPin, 
  User, FileText, Camera, Upload, Instagram, Globe, Play, CheckCircle, Phone 
} from "lucide-react"
import { parseTurkishPhoneInput, formatTurkishPhoneSuffix, toFullTurkishPhone, isValidTurkishPhone } from "@/lib/auth-field-validation"

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
  customerPhone: string
  services: string[]
  staffId: string
  staffName: string
  notes: string
  startTime: number
  sessionOperationId?: number
}

interface StaffMember {
  id: string
  userId: string
  name: string
  specialties: string[]
}

interface PersonelApiRow {
  id?: string | number
  user_id?: string | number
  userId?: string | number
  individual_user_id?: string | number
  individualUserId?: string | number
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
    userId: String(row.user_id ?? row.userId ?? row.individual_user_id ?? row.individualUserId ?? ""),
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

function getDefaultServicePrice(serviceName: string, services: SalonService[]) {
  const match = services.find((service) => service.name === serviceName)
  return match?.price ?? 0
}

function parseStoredSessionData(raw: unknown): SessionData | undefined {
  const session = decodeWorkspaceSessionPayload(raw)
  if (!session || typeof session !== "object") {
    return undefined
  }

  const record = session as SessionData
  const customerName = String(record.customerName ?? "").trim()
  const customerSurname = String(record.customerSurname ?? "").trim()
  const customerPhone = String(record.customerPhone ?? "").trim()
  const services = Array.isArray(record.services)
    ? record.services.map((item) => String(item).trim()).filter(Boolean)
    : []
  const staffId = String(record.staffId ?? "").trim()
  const staffName = String(record.staffName ?? "").trim()
  const notes = String(record.notes ?? "").trim()
  const startTime = Number(record.startTime)
  const sessionOperationIdRaw = Number(record.sessionOperationId)

  if (!customerName || !customerSurname || services.length === 0 || !Number.isFinite(startTime)) {
    return undefined
  }

  return {
    customerName,
    customerSurname,
    customerPhone,
    services,
    staffId,
    staffName,
    notes,
    startTime,
    sessionOperationId:
      Number.isFinite(sessionOperationIdRaw) && sessionOperationIdRaw > 0
        ? sessionOperationIdRaw
        : undefined,
  }
}

function getRowField(row: Record<string, unknown>, candidates: string[]) {
  for (const candidate of candidates) {
    const direct = row[candidate]
    if (direct !== undefined && direct !== null) return direct
    const found = Object.entries(row).find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

interface TablesViewProps {
  canManage?: boolean
  businessUserId?: string
  currentUserId?: string
  currentAccountType?: string
}

export function TablesView({ canManage = false, businessUserId, currentUserId, currentAccountType }: TablesViewProps) {
  const { activeServices } = useSalonServices(businessUserId)
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
    customerPhone: "",
    services: [] as string[],
    staffId: "",
    notes: "",
  })

  // Session end modal state
  const [showEndSessionModal, setShowEndSessionModal] = useState(false)
  const [endSessionTableId, setEndSessionTableId] = useState<number | null>(null)
  const [sessionPhotos, setSessionPhotos] = useState<string[]>([])
  const [shareOnInstagram, setShareOnInstagram] = useState(false)
  const [shareOnWebsite, setShareOnWebsite] = useState(false)
  const [instagramTitle, setInstagramTitle] = useState("")
  const [instagramDescription, setInstagramDescription] = useState("")
  const [websiteTitle, setWebsiteTitle] = useState("")
  const [websiteDescription, setWebsiteDescription] = useState("")
  const [sessionServicePrices, setSessionServicePrices] = useState<Record<string, string>>({})
  const [isSavingEndSession, setIsSavingEndSession] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [currentPhotoSlot, setCurrentPhotoSlot] = useState<number>(0)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadWorkspaces = useCallback(async () => {
    if (!businessUserId) return

    const res = await apiFetch(`/api/workspaces?businessUserId=${encodeURIComponent(businessUserId)}`, { cache: "no-store" })
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
      const tableId = Number(row.id ?? index + 1)
      const sessionData =
        status === "occupied"
          ? parseStoredSessionData(getRowField(row, ["locationDescription", "location_description"]))
          : undefined

      return {
        id: tableId,
        name: String(row.table_number ?? row.tableNumber ?? `Calisma Alani ${index + 1}`),
        status,
        occupiedSince: sessionData?.startTime,
        sessionData,
      }
    })

    const needsOperationId = mapped.some(
      (table) => table.status === "occupied" && table.sessionData && !table.sessionData.sessionOperationId,
    )

    if (needsOperationId) {
      const activeRes = await apiFetch(
        `/api/session-operations?businessUserId=${encodeURIComponent(businessUserId)}&activeOnly=true&ts=${Date.now()}`,
        { cache: "no-store" },
      )
      const activeJson = (await activeRes.json().catch(() => null)) as {
        ok?: boolean
        rows?: Array<{ id: number; workspaceId: number | null }>
      } | null

      if (activeRes.ok && activeJson?.ok && Array.isArray(activeJson.rows)) {
        for (const table of mapped) {
          if (table.status !== "occupied" || !table.sessionData || table.sessionData.sessionOperationId) {
            continue
          }

          const match = activeJson.rows.find((row) => row.workspaceId === table.id)
          if (match?.id) {
            table.sessionData = { ...table.sessionData, sessionOperationId: match.id }
          }
        }
      }
    }

    setTables(mapped)
  }, [businessUserId])

  const loadStaff = useCallback(async () => {
    if (!businessUserId) return
    const res = await apiFetch(`/api/personels?businessUserId=${encodeURIComponent(businessUserId)}`, { cache: "no-store" })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok || !Array.isArray(json?.rows)) {
      return
    }

    const mapped: StaffMember[] = json.rows
      .map((row: PersonelApiRow, index: number) => toStaffMember(row, index))
      .filter((row: StaffMember | null): row is StaffMember => row !== null)
    const visibleStaff = currentAccountType === "bireysel" && currentUserId
      ? mapped.filter((staff) => staff.userId === currentUserId)
      : mapped
    setStaffList(visibleStaff)
  }, [businessUserId, currentAccountType, currentUserId])

  useEffect(() => {
    void loadWorkspaces()
    void loadStaff()
  }, [loadWorkspaces, loadStaff])

  const handleAddWorkspace = async () => {
    const nextId = tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1
    const tableName = `Calisma Alani ${nextId}`
    const res = await apiFetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: tableName,
        businessUserId,
        capacity: 1,
        status: "available",
        isReservable: true,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? json?.error ?? "Çalışma alanı eklenemedi.")
      return
    }
    await loadWorkspaces()
  }

  const handleSetStatus = async (id: number, status: Table["status"], sessionData?: SessionData) => {
    const current = tables.find((table) => table.id === id)
    if (!current) return
    const res = await apiFetch(`/api/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        businessUserId,
        previousTableNumber: current.name,
        sessionData: status === "occupied" ? sessionData ?? null : null,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? " Çalışma alanı status güncellenemedi.")
      return
    }

    setTables((prev) =>
      prev.map((table) =>
        table.id === id
          ? {
              ...table,
              status,
              occupiedSince: status === "occupied" ? sessionData?.startTime ?? Date.now() : undefined,
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
      customerPhone: "",
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
      customerPhone: "",
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

  // Handle phone input change
  const handlePhoneChange = (value: string) => {
    setSessionForm({ ...sessionForm, customerPhone: parseTurkishPhoneInput(value) })
  }

  const handlePhoneBlur = async () => {
    if (!businessUserId || !sessionForm.customerPhone.trim()) {
      return
    }
    const fullPhone = toFullTurkishPhone(sessionForm.customerPhone)
    if (!isValidTurkishPhone(fullPhone)) {
      return
    }

    try {
      const res = await apiFetch(
        `/api/salon-customers?businessUserId=${encodeURIComponent(businessUserId)}&phone=${encodeURIComponent(fullPhone)}`,
      )
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        customer?: { firstName?: string; lastName?: string; fullName?: string } | null
      } | null
      if (!res.ok || !json?.ok || !json.customer) {
        return
      }

      const firstName = String(json.customer.firstName ?? "").trim()
      const lastName = String(json.customer.lastName ?? "").trim()
      if (!firstName && !lastName) {
        return
      }

      const currentFirst = sessionForm.customerName.trim()
      const currentLast = sessionForm.customerSurname.trim()
      if (!currentFirst && !currentLast) {
        setSessionForm((prev) => ({
          ...prev,
          customerName: firstName,
          customerSurname: lastName,
        }))
        return
      }

      if (
        currentFirst.toLowerCase() !== firstName.toLowerCase() ||
        currentLast.toLowerCase() !== lastName.toLowerCase()
      ) {
        const useExisting = confirm(
          `Bu telefon kayıtlı: ${json.customer.fullName ?? `${firstName} ${lastName}`}. Bu müşteri bilgileri kullanılsın mı?`,
        )
        if (useExisting) {
          setSessionForm((prev) => ({
            ...prev,
            customerName: firstName,
            customerSurname: lastName,
          }))
        }
      }
    } catch {
      // ignore lookup errors
    }
  }

  // Start session
  const handleStartSession = async () => {
    if (!startSessionTableId || !businessUserId) return
    if (!sessionForm.customerName.trim() || !sessionForm.customerSurname.trim()) {
      alert("Lütfen müşteri adı ve soyadını girin.")
      return
    }
    if (!sessionForm.customerPhone.trim()) {
      alert("Lütfen müşteri telefon numarasını girin.")
      return
    }
    const fullPhone = toFullTurkishPhone(sessionForm.customerPhone)
    if (!isValidTurkishPhone(fullPhone)) {
      alert("Geçerli bir Türkiye cep telefonu numarası girin (05XX XXX XX XX).")
      return
    }
    if (sessionForm.services.length === 0) {
      alert("Lütfen en az bir hizmet seçin.")
      return
    }
    if (!sessionForm.staffId) {
      alert("Lütfen personel seçin.")
      return
    }

    const currentTable = tables.find((table) => table.id === startSessionTableId)
    const selectedStaff = staffList.find((s) => s.id === sessionForm.staffId)
    const startTime = Date.now()
    const serviceItems = sessionForm.services.map((service) => ({
      name: service,
      price: getDefaultServicePrice(service, activeServices),
    }))

    const res = await apiFetch("/api/session-operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phase: "start",
        workspaceId: startSessionTableId,
        businessUserId,
        workspaceName: currentTable?.name ?? "",
        customerName: sessionForm.customerName.trim(),
        customerSurname: sessionForm.customerSurname.trim(),
        customerPhone: toFullTurkishPhone(sessionForm.customerPhone),
        serviceItems,
        staffId: selectedStaff?.userId || sessionForm.staffId,
        staffName: selectedStaff?.name ?? "",
        notes: sessionForm.notes.trim(),
        startedAt: startTime,
      }),
    })
    const json = (await res.json().catch(() => null)) as { ok?: boolean; sessionOperationId?: number; message?: string } | null
    if (!res.ok || !json?.ok || !json.sessionOperationId) {
      alert(json?.message ?? "Seans kaydı oluşturulamadı.")
      return
    }

    const sessionData: SessionData = {
      customerName: sessionForm.customerName.trim(),
      customerSurname: sessionForm.customerSurname.trim(),
      customerPhone: toFullTurkishPhone(sessionForm.customerPhone),
      services: sessionForm.services,
      staffId: selectedStaff?.userId || sessionForm.staffId,
      staffName: selectedStaff?.name ?? "",
      notes: sessionForm.notes.trim(),
      startTime,
      sessionOperationId: json.sessionOperationId,
    }

    await handleSetStatus(startSessionTableId, "occupied", sessionData)
    closeStartSessionModal()
  }

  // Open end session modal
  const openEndSessionModal = (tableId: number) => {
    const currentTable = tables.find((table) => table.id === tableId)
    const selectedServices = currentTable?.sessionData?.services ?? []
    const initialPrices: Record<string, string> = {}

    selectedServices.forEach((service) => {
      initialPrices[service] = String(getDefaultServicePrice(service, activeServices))
    })

    setEndSessionTableId(tableId)
    setSessionPhotos([])
    setShareOnInstagram(false)
    setShareOnWebsite(false)
    setSessionServicePrices(initialPrices)
    setShowEndSessionModal(true)
  }

  // Close end session modal
  const closeEndSessionModal = () => {
    stopCamera()
    setShowEndSessionModal(false)
    setEndSessionTableId(null)
    setSessionPhotos([])
    setShareOnInstagram(false)
    setShareOnWebsite(false)
    setInstagramTitle("")
    setInstagramDescription("")
    setWebsiteTitle("")
    setWebsiteDescription("")
    setSessionServicePrices({})
  }

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        console.log("Uploading photo to server...", file.name)

        const res = await fetch("https://server.hstplanet.com/api/Files/uploadImage", {
          method: "POST",
          headers: {
            accept: "*/*",
          },
          body: formData,
        })

        const data = (await res.json().catch(() => null)) as { url?: string } | null
        console.log("Upload response:", data)
        
        if (data?.url) {
          const newPhotos = [...sessionPhotos]
          newPhotos[slot] = data.url
          setSessionPhotos(newPhotos)
          console.log("Photo uploaded successfully:", data.url)
        } else {
          console.error("Upload failed:", data)
          alert("Fotoğraf yüklenemedi.")
        }
      } catch (err) {
        console.error("Upload error:", err)
        alert("Fotoğraf yüklenirken hata oluştu.")
      }
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
      alert("Kamera erişimi sağlanamadı.")
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
  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const base64 = canvas.toDataURL("image/jpeg")
        
        console.log("Capturing photo from camera, uploading to server...")
        
        // Convert base64 to blob and upload
        const response = await fetch(base64)
        const blob = await response.blob()
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" })
        
        const formData = new FormData()
        formData.append("file", file)

        try {
          const res = await fetch("https://server.hstplanet.com/api/Files/uploadImage", {
            method: "POST",
            headers: {
              accept: "*/*",
            },
            body: formData,
          })

          const data = (await res.json().catch(() => null)) as { url?: string } | null
          console.log("Camera photo upload response:", data)
          
          if (data?.url) {
            const newPhotos = [...sessionPhotos]
            newPhotos[currentPhotoSlot] = data.url
            setSessionPhotos(newPhotos)
            console.log("Camera photo uploaded successfully:", data.url)
          } else {
            console.error("Camera photo upload failed:", data)
            alert("Fotoğraf yüklenemedi.")
          }
        } catch (err) {
          console.error("Camera photo upload error:", err)
          alert("Fotoğraf yüklenirken hata oluştu.")
        }
        
        stopCamera()
      }
    }
  }

  // End session
  const handleEndSession = async () => {
    if (!endSessionTableId || isSavingEndSession) return

    const currentTable = tables.find((table) => table.id === endSessionTableId)
    const sessionData = currentTable?.sessionData
    if (!sessionData) {
      alert("Seans bilgisi bulunamadı.")
      return
    }

    if (shareOnInstagram && sessionPhotos.length === 0) {
      alert("Instagram'da paylaşmak için fotoğraf yükleyin veya çekin.")
      return
    }

    const serviceItems = sessionData.services.map((service) => {
      const price = Number(sessionServicePrices[service] ?? "")
      if (!Number.isFinite(price) || price < 0) {
        return null
      }

      return {
        name: service,
        price,
      }
    })

    if (serviceItems.some((item) => item === null)) {
      alert("Lütfen tüm hizmetler için geçerli bir fiyat girin.")
      return
    }

    const normalizedItems = serviceItems.filter(
      (item): item is { name: string; price: number } => item !== null,
    )

    const patchPayload = {
      businessUserId,
      serviceItems: normalizedItems,
      notes: sessionData.notes,
      photo: sessionPhotos[0] && sessionPhotos[0].length > 0 && sessionPhotos[0].length < 200_000
          ? sessionPhotos[0]
          : null,
      photo2: sessionPhotos[1] && sessionPhotos[1].length > 0 && sessionPhotos[1].length < 200_000
          ? sessionPhotos[1]
          : null,
      photo3: sessionPhotos[2] && sessionPhotos[2].length > 0 && sessionPhotos[2].length < 200_000
          ? sessionPhotos[2]
          : null,
      shareOnInstagram,
      shareOnWebsite,
      endedAt: Date.now(),
    }

    const resolveActiveOperationId = async () => {
      const activeRes = await apiFetch(
        `/api/session-operations?businessUserId=${encodeURIComponent(businessUserId ?? "")}&activeOnly=true&workspaceId=${endSessionTableId}&ts=${Date.now()}`,
        { cache: "no-store" },
      )
      const activeJson = (await activeRes.json().catch(() => null)) as {
        ok?: boolean
        rows?: Array<{
          id: number
          customerName: string
          customerSurname: string
          workspaceId?: number | null
        }>
      } | null

      if (!activeRes.ok || !activeJson?.ok || !Array.isArray(activeJson.rows)) {
        return undefined
      }

      const match = activeJson.rows.find(
        (row) =>
          row.customerName === sessionData.customerName &&
          row.customerSurname === sessionData.customerSurname &&
          (row.workspaceId == null || row.workspaceId === endSessionTableId),
      )
      return match?.id
    }

    const patchOperation = async (operationId: number) => {
      const res = await apiFetch(`/api/session-operations/${operationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload),
      })
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      return { res, json }
    }

    setIsSavingEndSession(true)
    try {
      let operationId = sessionData.sessionOperationId
      if (!operationId) {
        operationId = await resolveActiveOperationId()
      }

      if (operationId) {
        let { res, json } = await patchOperation(operationId)
        if (!res.ok || !json?.ok) {
          const resolvedId = await resolveActiveOperationId()
          if (resolvedId && resolvedId !== operationId) {
            operationId = resolvedId
            ;({ res, json } = await patchOperation(operationId))
          }
        }
        if (!res.ok || !json?.ok) {
          alert(json?.message ?? "Seans kaydı güncellenemedi.")
          return
        }
      } else {
        const res = await apiFetch("/api/session-operations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: "complete",
            workspaceId: endSessionTableId,
            businessUserId,
            workspaceName: currentTable?.name ?? "",
            customerName: sessionData.customerName,
            customerSurname: sessionData.customerSurname,
            serviceItems: normalizedItems,
            staffId: sessionData.staffId,
            staffName: sessionData.staffName,
            notes: sessionData.notes,
            photo: patchPayload.photo,
            shareOnInstagram,
            shareOnWebsite,
            startedAt: sessionData.startTime,
            endedAt: Date.now(),
          }),
        })
        const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
        if (!res.ok || !json?.ok) {
          alert(json?.message ?? "İşlem kaydı oluşturulamadı.")
          return
        }
      }

      if (shareOnInstagram && sessionPhotos.length > 0) {
        const caption = [instagramTitle, instagramDescription].filter(Boolean).join("\n\n")

        console.log("sessionPhotos before filter:", sessionPhotos)

        // Filter valid photos (URLs from upload endpoint)
        const validPhotos = sessionPhotos.filter(p => p && p.length > 0 && (p.startsWith("https://") || p.startsWith("/uploads/")))
        
        console.log("validPhotos after filter:", validPhotos)
        
        if (validPhotos.length === 0) {
          alert("Instagram paylaşımı için yüklenmiş fotoğraf bulunamadı. Fotoğraflar yüklenirken hata oluşmuş olabilir.")
        }
        
        console.log(JSON.stringify({
          businessUserId,
          photo: validPhotos[0],
          photos: validPhotos.length > 1 ? validPhotos : undefined,
          caption,
        }));
        
        const igRes = await apiFetch("/api/instagram-publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessUserId,
            photo: validPhotos[0],
            photos: validPhotos.length > 1 ? validPhotos : undefined,
            caption,
          }),
        })
        const igJson = (await igRes.json().catch(() => null)) as { ok?: boolean; message?: string } | null
        if (!igRes.ok || !igJson?.ok) {
          alert(
            `Seans kaydedildi ancak Instagram paylaşımı başarısız: ${igJson?.message ?? "Bilinmeyen hata"}`,
          )
        }
      }

      await handleSetStatus(endSessionTableId, "cleaning")
      window.dispatchEvent(new CustomEvent(SESSION_OPERATIONS_UPDATED_EVENT))
      closeEndSessionModal()
    } finally {
      setIsSavingEndSession(false)
    }
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
    const res = await apiFetch(`/api/workspaces/${editingTableId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: trimmed,
        businessUserId,
        previousTableNumber: current?.name ?? "",
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Çalışma alanı güncellenemedi.")
      return
    }
    setTables((prev) => prev.map((table) => (table.id === editingTableId ? { ...table, name: trimmed } : table)))
    closeEditCard()
  }

  const handleRemoveWorkspace = async () => {
    if (!editingTableId) return
    const current = tables.find((table) => table.id === editingTableId)
    if (!current) return
    const res = await apiFetch(`/api/workspaces/${editingTableId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessUserId,
        previousTableNumber: current.name,
      }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      alert(json?.message ?? "Çalışma alanı silinemedi.")
      return
    }
    setTables((prev) => prev.filter((table) => table.id !== editingTableId))
    closeEditCard()
  }

  const getActionButtonConfig = (table: Table) => {
    if (table.status === "available") {
      return {
        label: "Seansı başlat",
        onClick: () => openStartSessionModal(table.id),
        className:
          "w-full mt-3 rounded-lg bg-lime-600 hover:bg-lime-700 text-white border-lime-600",
      }
    }

    if (table.status === "occupied") {
      return {
        label: "Seansı bitir",
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
      label: "Seansı başlat",
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
        <h1 className="text-2xl font-semibold text-foreground">Çalışma Alanı Yönetimi</h1>
        {canManage && (
          <Button className="rounded-xl" onClick={handleAddWorkspace}>
            <Plus className="w-4 h-4 mr-1" />
            Çalışma alanı ekle
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => {
          const config = statusConfig[table.status]
          const actionButton = getActionButtonConfig(table)
          return (
            <div
              key={table.id}
              className={cn(
                "p-5 min-h-[220px] rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md",
                config.bgColor
              )}
            >
              <div className="flex justify-end mb-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium shrink-0",
                    table.status === "available" && "bg-green-100 text-green-700 border-green-300",
                    table.status === "occupied" && "bg-blue-100 text-blue-700 border-blue-300",
                    table.status === "reserved" && "bg-blue-100 text-blue-700 border-blue-300",
                    table.status === "cleaning" && "bg-orange-100 text-orange-700 border-orange-300"
                  )}
                >
                  {config.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground break-words leading-snug mb-3">{table.name}</h3>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span>{table.status === "available" ? "0/1 kisi" : "1/1 kisi"}</span>
              </div>

              {table.status === "occupied" && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.max(0, Math.floor((now - (table.occupiedSince ?? now)) / 60000))} dk geçti
                    </span>
                  </div>
                  {table.sessionData && (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-foreground font-medium min-w-0">
                        <User className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate min-w-0">{table.sessionData.customerName} {table.sessionData.customerSurname}</span>
                      </div>
                      {table.sessionData.customerPhone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                          <span className="truncate min-w-0">{table.sessionData.customerPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <Scissors className="w-3 h-3 shrink-0" />
                        <span className="truncate min-w-0">{table.sessionData.services.join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <Users className="w-3 h-3 shrink-0" />
                        <span className="truncate min-w-0">{table.sessionData.staffName}</span>
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
                    Düzenle
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
                    <h2 className="text-lg font-semibold text-white">Çalışma Alanı Düzenle</h2>
                    <p className="text-sm text-white/70">Bilgileri güncelleyin</p>
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
                  <label className="text-sm font-medium text-foreground">Çalışma Alanı Adı</label>
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
                    Değişiklikleri Kaydet
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl border-2 hover:bg-muted/50 font-medium transition-all"
                      onClick={closeEditCard}
                    >
                      Vazgeç
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
                  <h2 className="text-lg font-semibold text-white">Seans Başlat</h2>
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
                  Müşteri Bilgileri
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Ad *</label>
                      <Input
                        placeholder="Müşteri adı"
                        value={sessionForm.customerName}
                        onChange={(e) => setSessionForm({ ...sessionForm, customerName: e.target.value })}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Soyad *</label>
                      <Input
                        placeholder="Müşteri soyadı"
                        value={sessionForm.customerSurname}
                        onChange={(e) => setSessionForm({ ...sessionForm, customerSurname: e.target.value })}
                        className="rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Telefon </label>
                    <div className={cn(
                      "flex items-center h-11 w-1/2 rounded-xl border border-border ",
                      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
                    )}>
                      <Phone className="ml-3 w-5 h-5 shrink-0 text-muted-foreground" />
                      <span className="pl-2 text-foreground tabular-nums select-none">0</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="(5xx) xxx xx xx"
                        value={formatTurkishPhoneSuffix(sessionForm.customerPhone)}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={() => void handlePhoneBlur()}
                        className="flex-1 min-w-0 h-full bg-transparent px-1 text-foreground outline-none placeholder:text-muted-foreground"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Yapılacak işlemler *
                </h3>
                <SalonServicePickerGrid
                  services={activeServices}
                  selectedNames={sessionForm.services}
                  onToggle={toggleService}
                />
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
                  Seansı Baslat
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
                    <h2 className="text-lg font-semibold text-white">Seansı Bitir</h2>
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
                        Süre: {Math.max(0, Math.floor((now - currentTable.sessionData.startTime) / 60000))} dakika
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-6">
                {currentTable?.sessionData && currentTable.sessionData.services.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      Hizmet Fiyatları
                    </h3>
                    <div className="space-y-3">
                      {currentTable.sessionData.services.map((service) => (
                        <div key={service} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
                          <span className="text-sm font-medium text-foreground">{service}</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={sessionServicePrices[service] ?? ""}
                              onChange={(event) =>
                                setSessionServicePrices((prev) => ({
                                  ...prev,
                                  [service]: event.target.value,
                                }))
                              }
                              className="w-28 rounded-xl h-10 text-right"
                            />
                            <span className="text-sm text-muted-foreground">TL</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-emerald-700">Toplam Tutar</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {currentTable.sessionData.services
                            .reduce((total, service) => {
                              const price = Number(sessionServicePrices[service] ?? 0)
                              return total + (Number.isFinite(price) ? price : 0)
                            }, 0)
                            .toFixed(2)}{" "}
                          TL
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Fotoğraf
                  </h3>

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
                          Çek
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

                  {/* Photo Slots */}
                  {!isCameraActive && (
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((slot) => (
                        <div key={slot} className="relative">
                          {sessionPhotos[slot] ? (
                            <div className="relative rounded-xl overflow-hidden h-32">
                              <img
                                src={sessionPhotos[slot]}
                                alt={`Seans fotoğrafı ${slot + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => {
                                  const newPhotos = [...sessionPhotos]
                                  newPhotos[slot] = ""
                                  setSessionPhotos(newPhotos)
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-md">
                                <span className="text-xs text-white font-medium">Fotoğraf {slot + 1}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-full"
                                onClick={() => {
                                  setCurrentPhotoSlot(slot)
                                  fileInputRef.current?.click()
                                }}
                              >
                                <Upload className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <span className="text-xs text-muted-foreground">Fotoğraf {slot + 1}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Camera Button */}
                  {!isCameraActive && (
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-xl border-2 border-dashed flex items-center justify-center gap-2"
                      onClick={startCamera}
                    >
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Fotoğraf Çek</span>
                    </Button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, currentPhotoSlot)}
                  />
                </div>

                {/* Share Options */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Paylaşım Seçenekleri
                  </h3>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (sessionPhotos.length === 0) {
                          alert("Instagram'da paylaşmak için önce fotoğraf yükleyin veya çekin.")
                          return
                        }
                        setShareOnInstagram(!shareOnInstagram)
                      }}
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
                          Instagram&apos;da Paylaş
                        </div>
                        <div className="text-xs text-muted-foreground">Çalışmanızı Instagram&apos;da paylaşın</div>
                      </div>
                      <div className={cn(
                        "ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        shareOnInstagram ? "border-pink-500 bg-pink-500" : "border-muted-foreground/30"
                      )}>
                        {shareOnInstagram && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </button>

                    {shareOnInstagram && (
                      <div className="space-y-3 pl-4 border-l-2 border-pink-500/30">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Başlık</label>
                          <input
                            type="text"
                            value={instagramTitle}
                            onChange={(e) => setInstagramTitle(e.target.value)}
                            placeholder="Instagram başlığı..."
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Açıklama</label>
                          <textarea
                            value={instagramDescription}
                            onChange={(e) => setInstagramDescription(e.target.value)}
                            placeholder="Instagram açıklaması..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                          />
                        </div>
                      </div>
                    )}

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
                          Web Sitesinde Paylaş
                        </div>
                        <div className="text-xs text-muted-foreground">Galeri sayfasında görüntüleyin</div>
                      </div>
                      <div className={cn(
                        "ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        shareOnWebsite ? "border-blue-500 bg-blue-500" : "border-muted-foreground/30"
                      )}>
                        {shareOnWebsite && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </button>

                    {shareOnWebsite && (
                      <div className="space-y-3 pl-4 border-l-2 border-blue-500/30">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Başlık</label>
                          <input
                            type="text"
                            value={websiteTitle}
                            onChange={(e) => setWebsiteTitle(e.target.value)}
                            placeholder="Web sitesi başlığı..."
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Açıklama</label>
                          <textarea
                            value={websiteDescription}
                            onChange={(e) => setWebsiteDescription(e.target.value)}
                            placeholder="Web sitesi açıklaması..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <Button
                    className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium gap-2 shadow-lg shadow-red-500/25"
                    onClick={handleEndSession}
                    disabled={isSavingEndSession}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Seansı Bitir
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
