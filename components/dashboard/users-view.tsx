"use client"

import { apiFetch } from "@/lib/api-fetch"
import { readApiJson } from "@/lib/api-response"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { INDIVIDUAL_NOT_AVAILABLE_MESSAGE } from "@/lib/individual-employment"
import { useSalonServices } from "@/hooks/use-salon-services"
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Edit3,
  Trash2,
  X,
  UserCheck,
  UserX,
  Users,
  Scissors,
  Clock,
  Calendar,
  Briefcase,
  Star,
  Save,
  CheckCircle2,
} from "lucide-react"

interface EmployeeData {
  id: string
  name: string
  phone: string
  specialty: string[]
  workingHours: string
  startDate: string
  status: "aktif" | "pasif"
  experience: string
  notes: string
}

interface PersonelApiRow {
  id?: string | number
  full_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  expertise?: string
  work_start_time?: string
  work_end_time?: string
  hire_date?: string
  is_active?: boolean | number | string
  role?: string
  notes?: string
}

interface IndividualLookupResult {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  experienceYears: string
  expertise: string[]
}

type InviteStep = "search" | "preview" | "invited" | "unavailable"

const statusConfig = {
  aktif: {
    label: "Aktif",
    icon: UserCheck,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  pasif: {
    label: "Pasif",
    icon: UserX,
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
}

function toEmployeeData(row: PersonelApiRow, index: number): EmployeeData {
  const fullName = String(row.full_name ?? "").trim()
  const firstName = String(row.first_name ?? "").trim()
  const lastName = String(row.last_name ?? "").trim()
  const name = fullName || `${firstName} ${lastName}`.trim() || `Calisan ${index + 1}`
  const specialty = String(row.expertise ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
  const start = String(row.work_start_time ?? "").trim()
  const end = String(row.work_end_time ?? "").trim()
  const workingHours = start && end ? `${start} - ${end}` : ""
  const isActiveValue = row.is_active
  const isActive = isActiveValue === true || isActiveValue === 1 || isActiveValue === "1" || isActiveValue === "true"

  return {
    id: String(row.id ?? `EMP${String(index + 1).padStart(3, "0")}`),
    name,
    phone: String(row.phone ?? ""),
    specialty,
    workingHours,
    startDate: String(row.hire_date ?? "").slice(0, 10),
    status: isActive ? "aktif" : "pasif",
    experience: String(row.role ?? ""),
    notes: String(row.notes ?? ""),
  }
}

interface UsersViewProps {
  businessUserId?: string
  businessUsername?: string
}

export function UsersView({ businessUserId, businessUsername }: UsersViewProps) {
  const { serviceNames: specialtyOptions } = useSalonServices(businessUserId)
  const [employees, setEmployees] = useState<EmployeeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [inviteStep, setInviteStep] = useState<InviteStep>("search")
  const [isSearchingIndividual, setIsSearchingIndividual] = useState(false)
  const [inviteSearch, setInviteSearch] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })
  const [matchedIndividual, setMatchedIndividual] = useState<IndividualLookupResult | null>(null)
  const [inviteUnavailableMessage, setInviteUnavailableMessage] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    specialty: [] as string[],
    workingHours: "",
    startDate: "",
    status: "aktif" as "aktif" | "pasif",
    experience: "",
    notes: "",
  })

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoading(true)
        if (!businessUserId) return
        const res = await apiFetch(`/api/personels?businessUserId=${encodeURIComponent(businessUserId)}`, { cache: "no-store" })
        const data = await readApiJson<{ ok: boolean; rows: PersonelApiRow[] }>(res)
        if (!res.ok || !data?.ok || !Array.isArray(data?.rows)) {
          return
        }
        const mapped = data.rows.map((row: PersonelApiRow, index: number) => toEmployeeData(row, index))
        setEmployees(mapped)
      } catch {
        setEmployees([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadEmployees()
  }, [businessUserId])

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.phone.includes(searchQuery)
    const matchesStatus = filterStatus === "all" || employee.status === filterStatus
    const matchesSpecialty = filterSpecialty === "all" || employee.specialty.includes(filterSpecialty)
    return matchesSearch && matchesStatus && matchesSpecialty
  })

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "aktif").length,
    passive: employees.filter((e) => e.status === "pasif").length,
  }

  const handleAddEmployee = async () => {
    if (!formData.name || !formData.phone) {
      alert("Lutfen zorunlu alanlari doldurun.")
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        ...formData,
        businessUserId,
        startDate: formData.startDate || new Date().toISOString().split("T")[0],
      }
      const res = await apiFetch("/api/personels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await readApiJson<{ ok: boolean; message?: string }>(res)
      if (!res.ok || !data?.ok) {
        alert(data?.message ?? "Calisan eklenemedi.")
        return
      }

      const listRes = await apiFetch(`/api/personels?businessUserId=${encodeURIComponent(businessUserId ?? "")}`, { cache: "no-store" })
      const listData = await readApiJson<{ ok: boolean; rows: PersonelApiRow[] }>(listRes)
      if (listRes.ok && listData?.ok && Array.isArray(listData?.rows)) {
        const mapped = listData.rows.map((row: PersonelApiRow, index: number) => toEmployeeData(row, index))
        setEmployees(mapped)
      }

      resetForm()
      setShowAddModal(false)
    } catch {
      alert("Calisan eklenirken bir hata olustu.")
    } finally {
      setIsSaving(false)
    }
  }

  const resetInviteFlow = () => {
    setInviteStep("search")
    setInviteSearch({
      firstName: "",
      lastName: "",
      email: "",
    })
    setMatchedIndividual(null)
    setInviteUnavailableMessage("")
    setIsSearchingIndividual(false)
  }

  const closeEmployeeModal = () => {
    setShowAddModal(false)
    setEditingEmployee(null)
    resetForm()
    resetInviteFlow()
  }

  const handleFindIndividual = async () => {
    if (!inviteSearch.firstName.trim() || !inviteSearch.lastName.trim() || !inviteSearch.email.trim()) {
      alert("Lutfen ad, soyad ve e-posta alanlarini doldurun.")
      return
    }

    try {
      setIsSearchingIndividual(true)
      const res = await apiFetch("/api/individual-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inviteSearch,
          businessUserId,
        }),
      })
      const data = await readApiJson<{ ok: boolean; message?: string; user?: IndividualLookupResult }>(res)
      if (!res.ok || !data?.ok || !data?.user) {
        setInviteUnavailableMessage(data?.message ?? INDIVIDUAL_NOT_AVAILABLE_MESSAGE)
        setMatchedIndividual(null)
        setInviteStep("unavailable")
        return
      }

      setInviteUnavailableMessage("")
      setMatchedIndividual(data.user)
      setInviteStep("preview")
    } finally {
      setIsSearchingIndividual(false)
    }
  }

  const handleInviteIndividual = async () => {
    if (!businessUserId && !businessUsername) {
      alert("Isletme kullanici bilgisi bulunamadi.")
      return
    }

    if (!matchedIndividual?.userId) {
      alert("Davet edilecek bireysel kullanici bulunamadi.")
      return
    }

    try {
      setIsSaving(true)
      const res = await apiFetch("/api/personel-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          businessUserId,
          businessUsername,
          individualUserId: matchedIndividual.userId,
        }),
      })
      const data = await readApiJson<{ ok: boolean; message?: string }>(res)
      if (!res.ok || !data?.ok) {
        if (res.status === 409 || data?.message === INDIVIDUAL_NOT_AVAILABLE_MESSAGE) {
          setInviteUnavailableMessage(data?.message ?? INDIVIDUAL_NOT_AVAILABLE_MESSAGE)
          setMatchedIndividual(null)
          setInviteStep("unavailable")
          return
        }
        alert(data?.message ?? "Davet gonderilemedi.")
        return
      }
      setInviteStep("invited")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditEmployee = () => {
    if (!editingEmployee || !formData.name || !formData.phone) {
      alert("Lutfen zorunlu alanlari doldurun.")
      return
    }
    setEmployees(
      employees.map((e) =>
        e.id === editingEmployee.id
          ? { ...e, ...formData }
          : e
      )
    )
    setEditingEmployee(null)
    resetForm()
  }

  const handleDeleteEmployee = (employeeId: string) => {
    if (confirm("Bu calisani silmek istediginizden emin misiniz?")) {
      setEmployees(employees.filter((e) => e.id !== employeeId))
    }
    setOpenMenuId(null)
  }

  const openEditModal = (employee: EmployeeData) => {
    resetInviteFlow()
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      phone: employee.phone,
      specialty: employee.specialty,
      workingHours: employee.workingHours,
      startDate: employee.startDate,
      status: employee.status,
      experience: employee.experience,
      notes: employee.notes,
    })
    setOpenMenuId(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      specialty: [],
      workingHours: "",
      startDate: "",
      status: "aktif",
      experience: "",
      notes: "",
    })
  }

  const toggleSpecialty = (spec: string) => {
    if (formData.specialty.includes(spec)) {
      setFormData({ ...formData, specialty: formData.specialty.filter((s) => s !== spec) })
    } else {
      setFormData({ ...formData, specialty: [...formData.specialty, spec] })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Calisanlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kuafor salonu calisanlarini yonetin
          </p>
        </div>
        <Button
          className="rounded-xl gap-2"
          onClick={() => {
            resetInviteFlow()
            setShowAddModal(true)
          }}
        >
          <Plus className="w-4 h-4" />
          Calisan Ekle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Toplam Calisan</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Aktif Calisan</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.passive}</p>
              <p className="text-xs text-muted-foreground">Pasif Calisan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Calisan ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/50 border-0"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 rounded-xl">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Durum</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="pasif">Pasif</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="Uzmanlik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Uzmanliklar</SelectItem>
            {specialtyOptions.map((spec) => (
              <SelectItem key={spec} value={spec}>{spec}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => {
          const StatusIcon = statusConfig[employee.status].icon

          return (
            <div
              key={employee.id}
              className="group relative bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="relative h-20 bg-gradient-to-br from-primary/80 to-primary">
                {/* Menu Button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === employee.id ? null : employee.id)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4 text-white" />
                  </button>
                  {openMenuId === employee.id && (
                    <div className="absolute top-8 right-0 w-36 rounded-xl border border-border bg-popover shadow-xl z-50 p-1.5 animate-in fade-in-0 zoom-in-95">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                        onClick={() => openEditModal(employee)}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Duzenle
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sil
                      </button>
                    </div>
                  )}
                </div>
                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    "absolute top-3 left-3 gap-1 rounded-lg font-normal bg-white/90 border-0",
                    employee.status === "aktif" ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[employee.status].label}
                </Badge>
              </div>

              {/* Avatar */}
              <div className="relative -mt-10 px-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-card flex items-center justify-center text-xl font-semibold text-primary shadow-lg">
                  {getInitials(employee.name)}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 pt-3 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{employee.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{employee.phone}</span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5">
                  {employee.specialty.map((spec) => (
                    <Badge
                      key={spec}
                      variant="outline"
                      className="rounded-lg bg-primary/5 text-primary border-primary/20 text-xs font-normal"
                    >
                      <Scissors className="w-3 h-3 mr-1" />
                      {spec}
                    </Badge>
                  ))}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{employee.workingHours}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{employee.experience}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Baslangic: {new Date(employee.startDate).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {employee.notes && (
                  <div className="p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                    {employee.notes}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Calisanlar yukleniyor...</p>
        </div>
      )}

      {!isLoading && filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Calisan bulunamadi</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingEmployee) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-5 border-b border-border bg-gradient-to-r from-primary/10 to-transparent backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {editingEmployee ? "Calisan Duzenle" : "Yeni Personel Daveti"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {editingEmployee ? "Calisan bilgilerini guncelleyin" : "Bireysel hesabi olan personeli davet edin"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeEmployeeModal}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {showAddModal && !editingEmployee ? (
                <>
                  {inviteStep === "search" && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Bireysel Kullanici Ara
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Personelin bireysel hesabinda kayitli ad, soyad ve e-posta bilgisini girin.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Ad *</label>
                          <Input
                            placeholder="Ornek: Ahmet"
                            value={inviteSearch.firstName}
                            onChange={(e) => setInviteSearch({ ...inviteSearch, firstName: e.target.value })}
                            className="rounded-xl h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Soyad *</label>
                          <Input
                            placeholder="Ornek: Yilmaz"
                            value={inviteSearch.lastName}
                            onChange={(e) => setInviteSearch({ ...inviteSearch, lastName: e.target.value })}
                            className="rounded-xl h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">E-posta *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="personel@ornek.com"
                            value={inviteSearch.email}
                            onChange={(e) => setInviteSearch({ ...inviteSearch, email: e.target.value })}
                            className="pl-9 rounded-xl h-11"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {inviteStep === "preview" && matchedIndividual && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Eslesen Bireysel Kullanici
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Bilgiler dogruysa personele davet gonderebilirsiniz.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
                        <div>
                          <p className="text-xl font-semibold text-foreground">
                            {matchedIndividual.firstName} {matchedIndividual.lastName}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-4 h-4" />
                              {matchedIndividual.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-4 h-4" />
                              {matchedIndividual.phone || "Telefon yok"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground">Deneyim</p>
                            <p className="font-medium text-foreground">
                              {matchedIndividual.experienceYears ? `${matchedIndividual.experienceYears} yil` : "Belirtilmemis"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Uzmanlik Alanlari</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {matchedIndividual.expertise.length > 0 ? matchedIndividual.expertise.map((spec) => (
                                <Badge key={spec} variant="outline" className="rounded-lg">
                                  {spec}
                                </Badge>
                              )) : (
                                <p className="font-medium text-foreground">Belirtilmemis</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {inviteStep === "unavailable" && (
                    <div className="py-10 px-4 flex flex-col items-center justify-center text-center min-h-[280px]">
                      <span
                        className="text-6xl leading-none mb-6 grayscale opacity-70 select-none"
                        role="img"
                        aria-label="Uzgun"
                      >
                        😔
                      </span>
                      <p className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
                        {inviteUnavailableMessage || INDIVIDUAL_NOT_AVAILABLE_MESSAGE}
                      </p>
                    </div>
                  )}

                  {inviteStep === "invited" && (
                    <div className="py-8 text-center space-y-5">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          İşletmenize yeni personel eklediğiniz için bu mutluluğu beraber yaşıyoruz.
                        </h3>
                        <p className="text-muted-foreground">
                          Lütfen personelin bu daveti kabul etmesini bekleyin.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Temel Bilgiler
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Ad Soyad *</label>
                        <Input
                          placeholder="Ornek: Ahmet Yilmaz"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Telefon *</label>
                        <Input
                          placeholder="+90 555 000 0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="rounded-xl h-11"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Calisma Bilgileri
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Calisma Saatleri</label>
                        <Input
                          placeholder="09:00 - 18:00"
                          value={formData.workingHours}
                          onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Deneyim</label>
                        <Input
                          placeholder="3 yil"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Baslangic Tarihi</label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="rounded-xl h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Durum</label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "aktif" | "pasif") =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl h-11 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aktif">Aktif</SelectItem>
                          <SelectItem value="pasif">Pasif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Uzmanlik Alanlari
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {specialtyOptions.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleSpecialty(spec)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            formData.specialty.includes(spec)
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          )}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Notlar</label>
                    <Textarea
                      placeholder="Calisan hakkinda ek bilgiler..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="rounded-xl min-h-24 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-card/80 backdrop-blur-sm flex items-center justify-end gap-3">
              {showAddModal && !editingEmployee ? (
                <>
                  {inviteStep !== "invited" && inviteStep !== "unavailable" && (
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 px-6"
                      onClick={closeEmployeeModal}
                    >
                      Vazgec
                    </Button>
                  )}
                  {inviteStep === "search" && (
                    <Button
                      className="rounded-xl h-11 px-6 gap-2 shadow-lg shadow-primary/25"
                      onClick={handleFindIndividual}
                      disabled={isSearchingIndividual}
                    >
                      {isSearchingIndividual ? "Araniyor..." : "Devam Et"}
                    </Button>
                  )}
                  {inviteStep === "unavailable" && (
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 px-6"
                      onClick={() => {
                        setInviteStep("search")
                        setInviteUnavailableMessage("")
                      }}
                    >
                      Geri
                    </Button>
                  )}
                  {inviteStep === "preview" && (
                    <>
                      <Button
                        variant="outline"
                        className="rounded-xl h-11 px-6"
                        onClick={() => {
                          setInviteStep("search")
                          setMatchedIndividual(null)
                        }}
                      >
                        Geri
                      </Button>
                      <Button
                        className="rounded-xl h-11 px-6 gap-2 shadow-lg shadow-primary/25"
                        onClick={handleInviteIndividual}
                        disabled={isSaving}
                      >
                        {isSaving ? "Davet gonderiliyor..." : "Davet Et"}
                      </Button>
                    </>
                  )}
                  {inviteStep === "invited" && (
                    <Button
                      className="rounded-xl h-11 px-6 gap-2 shadow-lg shadow-primary/25"
                      onClick={closeEmployeeModal}
                    >
                      Bitir
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl h-11 px-6"
                    onClick={closeEmployeeModal}
                  >
                    Vazgec
                  </Button>
                  <Button
                    className="rounded-xl h-11 px-6 gap-2 shadow-lg shadow-primary/25"
                    onClick={handleEditEmployee}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    Guncelle
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
