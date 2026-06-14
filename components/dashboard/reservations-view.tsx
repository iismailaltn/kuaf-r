"use client"

import { useEffect, useMemo, useState } from "react"
import { useSalonServices } from "@/hooks/use-salon-services"
import { useServiceStages } from "@/hooks/use-service-stages"
import { useReservations } from "@/hooks/use-reservations"
import {
  canonicalStaffIdFromPersonelRow,
  fetchPersonelRowsForBusiness,
} from "@/lib/personel-directory"
import { buildMultiServicePlan } from "@/lib/salon-service-stages"
import {
  buildReservationTimeline,
  canStaffTakeBooking,
  DEFAULT_WORKING_HOURS,
  formatMinutesToTime,
  isStaffBusyAtClockTime,
  parseTimeToMinutes,
  type StaffReservationConflictInput,
} from "@/lib/reservation-scheduling"
import { reservationToBusyBlocksForConflict } from "@/lib/reservations-db"
import type { ReservationRecord } from "@/lib/reservations-store"
import { StaffPickerGrid, StaffScheduleSheet, type StaffProfile } from "@/components/dashboard/staff-schedule-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  CheckCircle,
  Phone,
  Clock,
  Scissors,
  Wallet,
  User,
  Check,
} from "lucide-react"
import {
  formatTurkishPhoneSuffix,
  parseTurkishPhoneInput,
  toFullTurkishPhone,
} from "@/lib/auth-field-validation"

const turkishMonths = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
]

const turkishDays = ["Pzr", "Pzt", "Sal", "Car", "Per", "Cum", "Cmt"]


interface ReservationsViewProps {
  businessUserId?: string
}

function toConflictInputs(reservations: ReservationRecord[]): StaffReservationConflictInput[] {
  return reservations.map((r) => ({
    date: r.date,
    staffId: r.staffId,
    staffBusyBlocks: reservationToBusyBlocksForConflict(r),
    status: r.status,
  }))
}

export function ReservationsView({ businessUserId }: ReservationsViewProps) {
  const { activeServices } = useSalonServices(businessUserId)
  const { getStagesForService } = useServiceStages(businessUserId, activeServices)
  const { reservations, isLoading, error, createReservation } = useReservations(businessUserId)

  const [staffList, setStaffList] = useState<StaffProfile[]>([])
  const [scheduleStaff, setScheduleStaff] = useState<StaffProfile | null>(null)
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDayPanel, setShowDayPanel] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState(1)

  const [reservationForm, setReservationForm] = useState({
    customerName: "",
    customerSurname: "",
    phone: "",
    serviceIds: [] as number[],
    staffId: "",
    notes: "",
  })

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReservationForm({ ...reservationForm, phone: parseTurkishPhoneInput(e.target.value) })
  }

  useEffect(() => {
    if (!businessUserId) {
      setStaffList([])
      return
    }
    void fetchPersonelRowsForBusiness(businessUserId).then((rows) => {
      const mapped = rows
        .map((row) => {
          const id = canonicalStaffIdFromPersonelRow(row as Record<string, unknown>)
          const firstName = String(row.first_name ?? row.firstName ?? "").trim()
          const lastName = String(row.last_name ?? row.lastName ?? "").trim()
          const fullName = String(row.full_name ?? row.fullName ?? `${firstName} ${lastName}`).trim()
          const phone = String(row.phone ?? "").trim()
          const role = String(row.role ?? row.expertise ?? "").trim()
          if (!id || !fullName) return null
          const staff: StaffProfile = {
            id,
            firstName: firstName || fullName.split(/\s+/)[0] || fullName,
            lastName: lastName || fullName.split(/\s+/).slice(1).join(" "),
            fullName,
          }
          if (phone) staff.phone = phone
          if (role) staff.role = role
          return staff
        })
        .filter((item): item is StaffProfile => item !== null)
      setStaffList(mapped)
    })
  }, [businessUserId])

  const conflictInputs = useMemo(() => toConflictInputs(reservations), [reservations])

  const bookingPlan = useMemo(() => {
    const items = reservationForm.serviceIds
      .map((serviceId) => {
        const service = activeServices.find((item) => item.id === serviceId)
        if (!service) return null
        return {
          serviceId: service.id,
          serviceName: service.name,
          stages: getStagesForService(service),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    if (items.length === 0) {
      return null
    }
    return buildMultiServicePlan(items)
  }, [reservationForm.serviceIds, activeServices, getStagesForService])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startingDay = firstDayOfMonth.getDay()
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  const prevMonthDays = Array.from({ length: startingDay }, (_, i) => prevMonthLastDay - startingDay + i + 1)
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const totalCells = 42
  const nextMonthDays = Array.from(
    { length: totalCells - prevMonthDays.length - currentMonthDays.length },
    (_, i) => i + 1,
  )

  const selectedDateReservations = useMemo(() => {
    if (!selectedDate) return []
    return reservations.filter((r) => r.date === selectedDate && r.status !== "cancelled")
  }, [selectedDate, reservations])

  const getReservationCount = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return reservations.filter((r) => r.date === dateStr && r.status !== "cancelled").length
  }

  const getStaffReservations = (staffId: string) =>
    selectedDateReservations.filter((r) => String(r.staffId) === String(staffId))

  const canStaffStartAt = (staffId: string, time: string) => {
    if (!selectedDate) return false
    if (bookingPlan) {
      return canStaffTakeBooking(
        selectedDate,
        staffId,
        time,
        bookingPlan.staffBusyBlocks,
        conflictInputs,
      )
    }
    return !isStaffBusyAtClockTime(staffId, selectedDate, time, conflictInputs)
  }

  /** Kart veya bos slot: ara dakikalari (baska personelin isi dahil) gostermiyoruz. */
  const getVisibleSlotsForStaff = (staffId: string) =>
    DEFAULT_WORKING_HOURS.filter((time) => {
      const hasCard = getStaffReservations(staffId).some((r) => r.startTime === time)
      if (hasCard) return true
      if (!selectedDate) return false
      if (isStaffBusyAtClockTime(staffId, selectedDate, time, conflictInputs)) return false
      return true
    })

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
    setShowDayPanel(false)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
    setShowDayPanel(false)
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
    setShowDayPanel(true)
  }

  const openReservationModal = (staffId: string, time: string) => {
    setSelectedTime(time)
    setWizardStep(1)
    setReservationForm({
      customerName: "",
      customerSurname: "",
      phone: "",
      serviceIds: [],
      staffId,
      notes: "",
    })
    setShowReservationModal(true)
  }

  const handleSelectStaff = (staff: StaffProfile) => {
    setScheduleStaff(staff)
    setScheduleSheetOpen(true)
  }

  const handlePickTimeFromSheet = (time: string) => {
    if (!scheduleStaff) return
    setScheduleSheetOpen(false)
    openReservationModal(scheduleStaff.id, time)
  }

  const toggleService = (serviceId: number) => {
    setReservationForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }))
  }

  const handleCreateReservation = async () => {
    if (!selectedDate || !selectedTime || !bookingPlan) return
    if (!reservationForm.customerName.trim() || !reservationForm.customerSurname.trim()) {
      alert("Lutfen musteri adi ve soyadini girin.")
      return
    }
    if (!reservationForm.phone.trim()) {
      alert("Lutfen telefon numarasini girin.")
      return
    }
    if (reservationForm.serviceIds.length === 0) {
      alert("Lutfen en az bir hizmet secin.")
      return
    }
    if (!reservationForm.staffId) {
      alert("Lutfen personel secin.")
      return
    }

    if (!canStaffStartAt(reservationForm.staffId, selectedTime)) {
      alert("Bu personel secilen saatte islem bitene kadar mesgul.")
      return
    }

    const timeline = buildReservationTimeline(selectedTime, bookingPlan.stages, bookingPlan.staffBusyBlocks)
    if (!timeline) {
      alert("Gecersiz saat.")
      return
    }

    const fullPhone = toFullTurkishPhone(reservationForm.phone)
    const selectedStaff = staffList.find((s) => s.id === reservationForm.staffId)
    const result = await createReservation({
      date: selectedDate,
      startTime: selectedTime,
      endTime: timeline.endTime,
      customerName: reservationForm.customerName.trim(),
      customerSurname: reservationForm.customerSurname.trim(),
      phone: fullPhone,
      serviceIds: reservationForm.serviceIds,
      serviceNames: bookingPlan.plans.map((plan) => plan.serviceName),
      staffId: selectedStaff?.id ?? reservationForm.staffId,
      staffName: selectedStaff?.fullName ?? "",
      notes: reservationForm.notes.trim(),
      source: "manual",
      status: "confirmed",
      totalMinutes: bookingPlan.totalMinutes,
      stages: timeline.stages,
      staffBusyBlocks: timeline.staffBusyBlocks,
    })

    if (!result.ok) {
      alert(String(result.message ?? "Randevu kaydedilemedi."))
      return
    }

    setShowReservationModal(false)
    setSelectedTime(null)
  }

  const closeReservationModal = () => {
    setShowReservationModal(false)
    setSelectedTime(null)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return ""
    const [y, m, d] = selectedDate.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return `${d} ${turkishMonths[m - 1]} ${y}, ${turkishDays[date.getDay()]}`
  }

  const modalStaff = staffList.find((s) => s.id === reservationForm.staffId)
  const scheduleBookings = scheduleStaff ? getStaffReservations(scheduleStaff.id) : []
  const scheduleVisibleSlots = scheduleStaff ? getVisibleSlotsForStaff(scheduleStaff.id) : []

  const selectedServices = activeServices.filter((s) => reservationForm.serviceIds.includes(s.id))
  const totalPrice = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
  const endTimeLabel =
    selectedTime && bookingPlan
      ? formatMinutesToTime(parseTimeToMinutes(selectedTime) + bookingPlan.totalMinutes)
      : null
  const staffAvailable = selectedTime ? canStaffStartAt(reservationForm.staffId, selectedTime) : false

  const step1Valid =
    reservationForm.customerName.trim().length > 0 &&
    reservationForm.customerSurname.trim().length > 0 &&
    reservationForm.phone.trim().length > 0
  const step2Valid = reservationForm.serviceIds.length > 0 && Boolean(bookingPlan)

  const wizardSteps = [
    { id: 1, label: "Musteri" },
    { id: 2, label: "Hizmet" },
    { id: 3, label: "Onay" },
  ]

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value)

  const dayReservations = useMemo(
    () => [...selectedDateReservations].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [selectedDateReservations],
  )

  const statusMeta: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Bekliyor",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    confirmed: {
      label: "Onaylandi",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    completed: {
      label: "Tamamlandi",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    cancelled: {
      label: "Iptal",
      className: "bg-destructive/10 text-destructive",
    },
  }

  const sourceLabels: Record<string, string> = {
    website: "Web sitesi",
    manual: "Manuel",
    whatsapp: "WhatsApp",
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Rezervasyonlar</h1>
        <p className="text-muted-foreground mt-1">
          Personel seçin, müsait saatleri görün
          {isLoading ? " · Yükleniyor..." : ""}
          {error ? ` · ${error}` : ""}
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {turkishMonths[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={goToPrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {turkishDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {prevMonthDays.map((day) => (
            <div
              key={`prev-${day}`}
              className="h-32 p-1 flex items-center justify-center text-muted-foreground/40"
            >
              <span className="text-base">{day}</span>
            </div>
          ))}
          {currentMonthDays.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const reservationCount = getReservationCount(day)
            const isSelected = selectedDate === dateStr
            return (
              <button
                key={`current-${day}`}
                type="button"
                onClick={() => handleDayClick(day)}
                className={cn(
                  "h-24 p-1 flex flex-col items-center justify-center rounded-xl transition-all relative",
                  isToday(day) && !isSelected && "bg-primary/10 text-primary",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && !isToday(day) && "hover:bg-muted",
                )}
              >
                <span className="text-base font-medium">{day}</span>
                {reservationCount > 0 && (
                  <span
                    className={cn(
                      "text-xs font-medium mt-0.5",
                      isSelected ? "text-primary-foreground" : "text-emerald-600",
                    )}
                  >
                    {reservationCount}
                  </span>
                )}
              </button>
            )
          })}
          {nextMonthDays.map((day) => (
            <div
              key={`next-${day}`}
              className="h-32 p-1 flex items-center justify-center text-muted-foreground/40"
            >
              <span className="text-base">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {showDayPanel && selectedDate ? (
        <Card className="gap-0 py-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-5 [.border-b]:pb-5">
            <div>
              <CardTitle>{formatSelectedDate()}</CardTitle>
              <CardDescription className="mt-1">
                Personel kartına tıklayın, müsait saatleri seçin
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={() => {
                setShowDayPanel(false)
                setSelectedDate(null)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Bu günün randevuları</h3>
                <Badge variant="secondary" className="rounded-full">
                  {dayReservations.length}
                </Badge>
              </div>

              {dayReservations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                  <p className="text-sm text-muted-foreground">Bu gün için henüz randevu yok</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {dayReservations.map((r) => {
                    const meta = statusMeta[r.status] ?? statusMeta.pending
                    return (
                      <li
                        key={r.id}
                        className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 shrink-0">
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {r.startTime}
                          </span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {r.endTime}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {r.customerName} {r.customerSurname}
                            </p>
                            <Badge className={cn("rounded-full border-0", meta.className)}>
                              {meta.label}
                            </Badge>
                          </div>
                          {r.serviceNames.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              <Scissors className="inline w-3 h-3 mr-1 -mt-0.5" />
                              {r.serviceNames.join(", ")}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {r.staffName}
                            </span>
                            {r.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {r.phone}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {r.totalMinutes} dk
                            </span>
                            {sourceLabels[r.source] && (
                              <span className="text-muted-foreground/80">
                                {sourceLabels[r.source]}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-foreground">Yeni randevu ekle</h3>
              {staffList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Personel bulunamadi.</p>
              ) : (
                <StaffPickerGrid
                  staffList={staffList}
                  getBookings={getStaffReservations}
                  getVisibleSlots={getVisibleSlotsForStaff}
                  onSelectStaff={handleSelectStaff}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mb-4 opacity-60" />
            <p className="font-medium text-foreground">Gun secin</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Personel bazli program icin takvimden bir gun secin
            </p>
          </CardContent>
        </Card>
      )}

      <StaffScheduleSheet
        open={scheduleSheetOpen}
        onOpenChange={setScheduleSheetOpen}
        staff={scheduleStaff}
        dateLabel={formatSelectedDate()}
        bookings={scheduleBookings}
        visibleSlots={scheduleVisibleSlots}
        onPickTime={handlePickTimeFromSheet}
      />

      {showReservationModal && selectedDate && selectedTime && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden bg-card rounded-3xl shadow-2xl flex flex-col md:flex-row">
            {/* Sol: sihirbaz */}
            <div className="flex flex-col min-h-0 flex-1">
              <div className="px-6 pt-6 pb-4 border-b border-border/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground">Yeni Rezervasyon</h2>
                    <p className="text-sm text-muted-foreground truncate">{formatSelectedDate()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeReservationModal}
                    className="shrink-0 p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Kapat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Adim gostergesi */}
                <div className="flex items-center mt-5">
                  {wizardSteps.map((step, index) => {
                    const isActive = wizardStep === step.id
                    const isDone = wizardStep > step.id
                    return (
                      <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors shrink-0",
                              isActive && "bg-emerald-600 text-white",
                              isDone && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                              !isActive && !isDone && "bg-muted text-muted-foreground",
                            )}
                          >
                            {isDone ? <Check className="w-4 h-4" /> : step.id}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium hidden sm:block",
                              isActive ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < wizardSteps.length - 1 && (
                          <div
                            className={cn(
                              "h-px flex-1 mx-3 transition-colors",
                              wizardStep > step.id ? "bg-emerald-500" : "bg-border",
                            )}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Adim icerigi */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Ad *</label>
                        <Input
                          placeholder="Ad"
                          value={reservationForm.customerName}
                          onChange={(e) => setReservationForm({ ...reservationForm, customerName: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Soyad *</label>
                        <Input
                          placeholder="Soyad"
                          value={reservationForm.customerSurname}
                          onChange={(e) =>
                            setReservationForm({ ...reservationForm, customerSurname: e.target.value })
                          }
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Telefon *</label>
                      <div
                        className={cn(
                          "flex items-center h-12 w-full rounded-xl border border-border bg-muted/50",
                          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                        )}
                      >
                        <Phone className="ml-3 w-5 h-5 shrink-0 text-muted-foreground" />
                        <span className="pl-2 text-foreground tabular-nums select-none">0</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="(5xx) xxx xx xx"
                          value={formatTurkishPhoneSuffix(reservationForm.phone)}
                          onChange={handlePhoneChange}
                          className="flex-1 min-w-0 h-full bg-transparent px-1 text-foreground outline-none placeholder:text-muted-foreground"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Bir veya birden fazla hizmet secin
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {activeServices.map((service) => {
                        const selected = reservationForm.serviceIds.includes(service.id)
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleService(service.id)}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                              selected
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                                : "border-border bg-card hover:bg-muted/50",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground truncate">
                                {service.name}
                              </span>
                              {Number(service.price) > 0 && (
                                <span className="block text-xs text-muted-foreground">
                                  ₺{formatPrice(Number(service.price))}
                                </span>
                              )}
                            </span>
                            <span
                              className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full border shrink-0 transition-colors",
                                selected
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-border text-transparent",
                              )}
                            >
                              <Check className="w-3 h-3" />
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {bookingPlan ? (
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          Randevu akisi ({bookingPlan.totalMinutes} dk)
                        </p>
                        {bookingPlan.stages.map((stage) => (
                          <div
                            key={`${stage.id}-${stage.offsetMinutes}`}
                            className="flex items-center justify-between text-xs"
                          >
                            <span
                              className={
                                stage.requiresStaff ? "text-foreground font-medium" : "text-muted-foreground"
                              }
                            >
                              {stage.name}
                              {stage.requiresStaff ? " · personel mesgul" : " · bekleme"}
                            </span>
                            <span className="text-muted-foreground">
                              +{stage.offsetMinutes} dk · {stage.durationMinutes} dk
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    {modalStaff ? (
                      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{modalStaff.fullName}</p>
                          <p className="text-xs text-muted-foreground">Secilen personel</p>
                        </div>
                        {staffAvailable ? (
                          <Badge variant="secondary" className="ml-auto shrink-0">
                            Musait
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-auto shrink-0">
                            Mesgul
                          </Badge>
                        )}
                      </div>
                    ) : null}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Notlar</label>
                      <Textarea
                        placeholder="Randevu ile ilgili notlar (istege bagli)"
                        value={reservationForm.notes}
                        onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                        className="rounded-xl min-h-24"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Adim navigasyonu */}
              <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between gap-3">
                {wizardStep > 1 ? (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Geri
                  </Button>
                ) : (
                  <span />
                )}

                {wizardStep < 3 ? (
                  <Button
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setWizardStep((s) => Math.min(3, s + 1))}
                    disabled={wizardStep === 1 ? !step1Valid : !step2Valid}
                  >
                    Devam
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => void handleCreateReservation()}
                    disabled={!bookingPlan || !staffAvailable}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Rezervasyon Olustur
                  </Button>
                )}
              </div>
            </div>

            {/* Sag: canli ozet */}
            <aside className="md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-border/60 bg-muted/30 p-6 space-y-4 overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Randevu Ozeti</p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Tarih</p>
                    <p className="text-sm font-medium text-foreground">{formatSelectedDate()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Saat</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedTime}
                      {endTimeLabel ? ` → ${endTimeLabel}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Personel</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {modalStaff?.fullName ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Scissors className="w-3.5 h-3.5" />
                  Hizmetler
                </div>
                {selectedServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henuz hizmet secilmedi</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedServices.map((service) => (
                      <li key={service.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-foreground truncate">{service.name}</span>
                        {Number(service.price) > 0 && (
                          <span className="text-muted-foreground shrink-0">
                            ₺{formatPrice(Number(service.price))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-border/60 pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Toplam sure</span>
                  <span className="font-medium text-foreground">
                    {bookingPlan ? `${bookingPlan.totalMinutes} dk` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5" />
                    Toplam ucret
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {totalPrice > 0 ? `₺${formatPrice(totalPrice)}` : "—"}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}
