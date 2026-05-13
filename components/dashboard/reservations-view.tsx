"use client"

import { useState, useMemo } from "react"
import { useSalonServices } from "@/hooks/use-salon-services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  Scissors,
  Users,
  Calendar,
  Phone,
  FileText,
  Globe,
  CheckCircle,
} from "lucide-react"

interface Reservation {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  customerName: string
  customerSurname: string
  phone: string
  services: string[]
  staffId: string
  staffName: string
  notes: string
  source: "website" | "manual"
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

// Ornek personel listesi
const staffList = [
  { id: "EMP001", name: "Ahmet Yilmaz", specialties: ["Sac Kesimi", "Sakal Kesimi"] },
  { id: "EMP002", name: "Ayse Kaya", specialties: ["Sac Boyama", "Fon", "Makyaj"] },
  { id: "EMP003", name: "Mehmet Demir", specialties: ["Sac Kesimi", "Sac Boyama"] },
  { id: "EMP004", name: "Fatma Celik", specialties: ["Manikur", "Pedikur", "Cilt Bakimi"] },
  { id: "EMP005", name: "Ali Ozturk", specialties: ["Kas Dizayn", "Agda"] },
]

// Calisma saatleri
const workingHours = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00",
]

// Ornek rezervasyonlar
const initialReservations: Reservation[] = [
  {
    id: "RES001",
    date: "2026-04-19",
    time: "10:00",
    customerName: "Zeynep",
    customerSurname: "Aydin",
    phone: "0532 123 45 67",
    services: ["Sac Kesimi", "Fon"],
    staffId: "EMP002",
    staffName: "Ayse Kaya",
    notes: "Ilk kez geliyor",
    source: "website",
    status: "confirmed",
  },
  {
    id: "RES002",
    date: "2026-04-19",
    time: "14:30",
    customerName: "Murat",
    customerSurname: "Koc",
    phone: "0533 987 65 43",
    services: ["Sakal Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "",
    source: "manual",
    status: "pending",
  },
  {
    id: "RES003",
    date: "2026-04-20",
    time: "11:00",
    customerName: "Elif",
    customerSurname: "Celik",
    phone: "0534 456 78 90",
    services: ["Manikur", "Pedikur"],
    staffId: "EMP004",
    staffName: "Fatma Celik",
    notes: "Ozel tasarim istegi var",
    source: "website",
    status: "confirmed",
  },
  {
    id: "RES004",
    date: "2026-04-26",
    time: "15:00",
    customerName: "Burak",
    customerSurname: "Yilmaz",
    phone: "0535 111 22 33",
    services: ["Sac Kesimi", "Sac Boyama"],
    staffId: "EMP003",
    staffName: "Mehmet Demir",
    notes: "",
    source: "manual",
    status: "confirmed",
  },
]

const turkishMonths = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"
]

const turkishDays = ["Pzr", "Pzt", "Sal", "Car", "Per", "Cum", "Cmt"]

interface ReservationsViewProps {
  businessUserId?: string
}

export function ReservationsView({ businessUserId }: ReservationsViewProps) {
  const { serviceNames: serviceOptions } = useSalonServices(businessUserId)
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  
  const [reservationForm, setReservationForm] = useState({
    customerName: "",
    customerSurname: "",
    phone: "",
    services: [] as string[],
    staffId: "",
    notes: "",
  })

  // Takvim hesaplamalari
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDay = firstDayOfMonth.getDay()

  // Onceki ayin gunleri
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  const prevMonthDays = Array.from(
    { length: startingDay },
    (_, i) => prevMonthLastDay - startingDay + i + 1
  )

  // Bu ayin gunleri
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Sonraki ayin gunleri (42 - toplam gun sayisi)
  const totalCells = 42
  const nextMonthDays = Array.from(
    { length: totalCells - prevMonthDays.length - currentMonthDays.length },
    (_, i) => i + 1
  )

  // Secili gundeki rezervasyonlar
  const selectedDateReservations = useMemo(() => {
    if (!selectedDate) return []
    return reservations.filter((r) => r.date === selectedDate)
  }, [selectedDate, reservations])

  // Bir gundeki rezervasyon sayisini al
  const getReservationCount = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return reservations.filter((r) => r.date === dateStr).length
  }

  // Bir saatin dolu olup olmadigini kontrol et
  const isTimeSlotOccupied = (time: string) => {
    return selectedDateReservations.some((r) => r.time === time)
  }

  // Ay degistirme
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
    setShowTimeSlots(false)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
    setShowTimeSlots(false)
  }

  // Gun secme
  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
    setShowTimeSlots(true)
  }

  // Saat secme ve modal acma
  const handleTimeSlotClick = (time: string) => {
    if (isTimeSlotOccupied(time)) return
    setSelectedTime(time)
    setReservationForm({
      customerName: "",
      customerSurname: "",
      phone: "",
      services: [],
      staffId: "",
      notes: "",
    })
    setShowReservationModal(true)
  }

  // Hizmet secimi toggle
  const toggleService = (service: string) => {
    if (reservationForm.services.includes(service)) {
      setReservationForm({
        ...reservationForm,
        services: reservationForm.services.filter((s) => s !== service),
      })
    } else {
      setReservationForm({
        ...reservationForm,
        services: [...reservationForm.services, service],
      })
    }
  }

  // Rezervasyon olusturma
  const handleCreateReservation = () => {
    if (!selectedDate || !selectedTime) return
    if (!reservationForm.customerName.trim() || !reservationForm.customerSurname.trim()) {
      alert("Lutfen musteri adi ve soyadini girin.")
      return
    }
    if (!reservationForm.phone.trim()) {
      alert("Lutfen telefon numarasini girin.")
      return
    }
    if (reservationForm.services.length === 0) {
      alert("Lutfen en az bir hizmet secin.")
      return
    }
    if (!reservationForm.staffId) {
      alert("Lutfen personel secin.")
      return
    }

    const selectedStaff = staffList.find((s) => s.id === reservationForm.staffId)
    const newReservation: Reservation = {
      id: `RES${Date.now()}`,
      date: selectedDate,
      time: selectedTime,
      customerName: reservationForm.customerName.trim(),
      customerSurname: reservationForm.customerSurname.trim(),
      phone: reservationForm.phone.trim(),
      services: reservationForm.services,
      staffId: reservationForm.staffId,
      staffName: selectedStaff?.name ?? "",
      notes: reservationForm.notes.trim(),
      source: "manual",
      status: "confirmed",
    }

    setReservations([...reservations, newReservation])
    setShowReservationModal(false)
    setSelectedTime(null)
  }

  // Modal kapatma
  const closeReservationModal = () => {
    setShowReservationModal(false)
    setSelectedTime(null)
    setReservationForm({
      customerName: "",
      customerSurname: "",
      phone: "",
      services: [],
      staffId: "",
      notes: "",
    })
  }

  // Bugun mu kontrol
  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  // Tarihi formatla
  const formatSelectedDate = () => {
    if (!selectedDate) return ""
    const [y, m, d] = selectedDate.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return `${d} ${turkishMonths[m - 1]} ${y}, ${turkishDays[date.getDay()]}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Rezervasyonlar</h1>
          <p className="text-muted-foreground mt-1">Takvimden gun secin ve rezervasyon olusturun</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Takvim */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          {/* Takvim Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              {turkishMonths[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={goToPrevMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={goToNextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Gun isimleri */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {turkishDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Gunler */}
          <div className="grid grid-cols-7 gap-1">
            {/* Onceki ayin gunleri */}
            {prevMonthDays.map((day) => (
              <div
                key={`prev-${day}`}
                className="aspect-square p-1 flex flex-col items-center justify-center text-muted-foreground/40"
              >
                <span className="text-sm">{day}</span>
              </div>
            ))}

            {/* Bu ayin gunleri */}
            {currentMonthDays.map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const reservationCount = getReservationCount(day)
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={`current-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "aspect-square p-1 flex flex-col items-center justify-center rounded-xl transition-all relative",
                    isToday(day) && !isSelected && "bg-primary/10 text-primary",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && !isToday(day) && "hover:bg-muted"
                  )}
                >
                  <span className="text-sm font-medium">{day}</span>
                  {reservationCount > 0 && (
                    <div
                      className={cn(
                        "absolute bottom-1 flex gap-0.5",
                        reservationCount > 3 ? "justify-center" : ""
                      )}
                    >
                      {reservationCount <= 3 ? (
                        Array.from({ length: reservationCount }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected ? "bg-primary-foreground" : "bg-emerald-500"
                            )}
                          />
                        ))
                      ) : (
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            isSelected ? "text-primary-foreground" : "text-emerald-600"
                          )}
                        >
                          {reservationCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}

            {/* Sonraki ayin gunleri */}
            {nextMonthDays.map((day) => (
              <div
                key={`next-${day}`}
                className="aspect-square p-1 flex flex-col items-center justify-center text-muted-foreground/40"
              >
                <span className="text-sm">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saat Slotlari / Rezervasyonlar */}
        <div className="bg-card rounded-2xl border border-border p-6">
          {showTimeSlots && selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{formatSelectedDate()}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedDateReservations.length} rezervasyon
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => {
                    setShowTimeSlots(false)
                    setSelectedDate(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Saat listesi */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {workingHours.map((time) => {
                  const reservation = selectedDateReservations.find((r) => r.time === time)
                  const isOccupied = !!reservation

                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeSlotClick(time)}
                      disabled={isOccupied}
                      className={cn(
                        "w-full p-3 rounded-xl text-left transition-all border",
                        isOccupied
                          ? "bg-emerald-50 border-emerald-200 cursor-default"
                          : "bg-muted/30 border-transparent hover:bg-muted hover:border-muted-foreground/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className={cn(
                            "w-4 h-4",
                            isOccupied ? "text-emerald-600" : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "font-medium",
                            isOccupied ? "text-emerald-700" : "text-foreground"
                          )}>
                            {time}
                          </span>
                        </div>
                        {isOccupied ? (
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Dolu
                          </span>
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {reservation && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-emerald-700">
                            <User className="w-3 h-3" />
                            <span>{reservation.customerName} {reservation.customerSurname}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600/80">
                            <Scissors className="w-3 h-3" />
                            <span className="truncate">{reservation.services.join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600/80">
                            <Users className="w-3 h-3" />
                            <span>{reservation.staffName}</span>
                          </div>
                          {reservation.source === "website" && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                              <Globe className="w-3 h-3" />
                              <span>Web sitesinden</span>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground">Gun Secin</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Takvimden bir gun secerek<br />rezervasyonlari gorun
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Yaklaşan Rezervasyonlar */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Yaklasan Rezervasyonlar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations
            .filter((r) => r.status !== "cancelled" && r.status !== "completed")
            .sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time}`)
              const dateB = new Date(`${b.date}T${b.time}`)
              return dateA.getTime() - dateB.getTime()
            })
            .slice(0, 6)
            .map((reservation) => {
              const [y, m, d] = reservation.date.split("-").map(Number)
              const formattedDate = `${d} ${turkishMonths[m - 1]}`
              
              return (
                <div
                  key={reservation.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground text-sm">
                          {formattedDate}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reservation.time}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      reservation.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {reservation.status === "confirmed" ? "Onaylandi" : "Bekliyor"}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{reservation.customerName} {reservation.customerSurname}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{reservation.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Scissors className="w-3 h-3" />
                      <span className="truncate">{reservation.services.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{reservation.staffName}</span>
                    </div>
                    {reservation.source === "website" && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Globe className="w-3 h-3" />
                        <span>Web sitesinden</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Rezervasyon Olusturma Modal */}
      {showReservationModal && selectedDate && selectedTime && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 z-10 relative bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-5">
              <button
                onClick={closeReservationModal}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Yeni Rezervasyon</h2>
                  <p className="text-sm text-white/70">
                    {formatSelectedDate()} - {selectedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Musteri Bilgileri */}
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
                      value={reservationForm.customerName}
                      onChange={(e) => setReservationForm({ ...reservationForm, customerName: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Soyad *</label>
                    <Input
                      placeholder="Musteri soyadi"
                      value={reservationForm.customerSurname}
                      onChange={(e) => setReservationForm({ ...reservationForm, customerSurname: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Telefon *</label>
                  <Input
                    placeholder="0532 123 45 67"
                    value={reservationForm.phone}
                    onChange={(e) => setReservationForm({ ...reservationForm, phone: e.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              {/* Hizmet Secimi */}
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
                        reservationForm.services.includes(service)
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personel Secimi */}
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
                      onClick={() => setReservationForm({ ...reservationForm, staffId: staff.id })}
                      className={cn(
                        "p-3 rounded-xl text-left transition-all border-2",
                        reservationForm.staffId === staff.id
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

              {/* Notlar */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notlar
                </h3>
                <Textarea
                  placeholder="Rezervasyon ile ilgili notlar..."
                  value={reservationForm.notes}
                  onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                  className="rounded-xl min-h-20 resize-none"
                />
              </div>

              {/* Kaydet Butonu */}
              <div className="pt-4">
                <Button
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-lg shadow-emerald-600/25"
                  onClick={handleCreateReservation}
                >
                  <CheckCircle className="w-4 h-4" />
                  Rezervasyon Olustur
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
