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
import { ChevronLeft, ChevronRight, X, Calendar, CheckCircle, Phone } from "lucide-react"
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

          <CardContent className="p-4 sm:p-6">
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
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-2xl">
            <div className="sticky top-0 z-10 bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-5">
              <button
                type="button"
                onClick={closeReservationModal}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <h2 className="text-lg font-semibold text-white">Yeni Rezervasyon</h2>
              <p className="text-sm text-white/80">
                {formatSelectedDate()} · {modalStaff?.fullName ?? "Personel"} · {selectedTime}
                {bookingPlan
                  ? ` → ${formatMinutesToTime(parseTimeToMinutes(selectedTime) + bookingPlan.totalMinutes)}`
                  : ""}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Ad *"
                  value={reservationForm.customerName}
                  onChange={(e) => setReservationForm({ ...reservationForm, customerName: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Soyad *"
                  value={reservationForm.customerSurname}
                  onChange={(e) => setReservationForm({ ...reservationForm, customerSurname: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Telefon *</h3>
                <div
                  className={cn(
                    "flex items-center h-12 w-full rounded-xl border border-border bg-muted/50",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
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

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Hizmetler *</h3>
                <div className="flex flex-wrap gap-2">
                  {activeServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        reservationForm.serviceIds.includes(service.id)
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
              </div>

              {bookingPlan ? (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Randevu akisi ({bookingPlan.totalMinutes} dk)</p>
                  {bookingPlan.stages.map((stage) => (
                    <div
                      key={`${stage.id}-${stage.offsetMinutes}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className={stage.requiresStaff ? "text-foreground font-medium" : "text-muted-foreground"}
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

              {modalStaff ? (
                <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{modalStaff.fullName}</p>
                    <p className="text-xs text-muted-foreground">Secilen personel</p>
                  </div>
                  {!canStaffStartAt(reservationForm.staffId, selectedTime) ? (
                    <Badge variant="destructive" className="ml-auto shrink-0">
                      Mesgul
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-auto shrink-0">
                      Musait
                    </Badge>
                  )}
                </div>
              ) : null}

              <Textarea
                placeholder="Notlar"
                value={reservationForm.notes}
                onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                className="rounded-xl min-h-20"
              />

              <Button
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => void handleCreateReservation()}
                disabled={!bookingPlan || !canStaffStartAt(reservationForm.staffId, selectedTime)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Rezervasyon Olustur
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
