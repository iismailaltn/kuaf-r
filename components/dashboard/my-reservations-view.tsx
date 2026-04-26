"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Clock,
  Phone,
  Scissors,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  Filter,
} from "lucide-react"

interface Reservation {
  id: string
  date: string
  time: string
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

// Ornek personel - gercek uygulamada login olan kullanicinin bilgileri gelecek
const currentStaff = {
  id: "EMP001",
  name: "Ahmet Yilmaz",
}

// Ornek rezervasyonlar - bu calisan icin
const initialReservations: Reservation[] = [
  {
    id: "RES001",
    date: "2026-04-26",
    time: "09:00",
    customerName: "Mehmet",
    customerSurname: "Kaya",
    phone: "0532 111 22 33",
    services: ["Sac Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "Kisa kesim istiyor",
    source: "website",
    status: "confirmed",
  },
  {
    id: "RES002",
    date: "2026-04-26",
    time: "10:30",
    customerName: "Ali",
    customerSurname: "Demir",
    phone: "0533 444 55 66",
    services: ["Sakal Kesimi", "Sac Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "",
    source: "manual",
    status: "pending",
  },
  {
    id: "RES003",
    date: "2026-04-28",
    time: "14:00",
    customerName: "Hasan",
    customerSurname: "Celik",
    phone: "0534 777 88 99",
    services: ["Sac Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "Dugun icin ozel istek",
    source: "website",
    status: "confirmed",
  },
  {
    id: "RES004",
    date: "2026-04-30",
    time: "11:00",
    customerName: "Yusuf",
    customerSurname: "Ozturk",
    phone: "0535 123 45 67",
    services: ["Sac Kesimi", "Sakal Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "RES005",
    date: "2026-05-02",
    time: "15:30",
    customerName: "Emre",
    customerSurname: "Aydin",
    phone: "0536 987 65 43",
    services: ["Sac Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "Ilk kez geliyor",
    source: "website",
    status: "pending",
  },
  {
    id: "RES006",
    date: "2026-05-05",
    time: "10:00",
    customerName: "Kemal",
    customerSurname: "Yildiz",
    phone: "0537 111 22 33",
    services: ["Sakal Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "RES007",
    date: "2026-05-10",
    time: "09:30",
    customerName: "Burak",
    customerSurname: "Sahin",
    phone: "0538 222 33 44",
    services: ["Sac Kesimi", "Sakal Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "Her ay gelir",
    source: "website",
    status: "confirmed",
  },
  {
    id: "RES008",
    date: "2026-05-15",
    time: "16:00",
    customerName: "Okan",
    customerSurname: "Koc",
    phone: "0539 333 44 55",
    services: ["Sac Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "",
    source: "manual",
    status: "pending",
  },
]

const turkishMonths = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"
]

const turkishDaysShort = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"]
const turkishDays = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]

const statusConfig = {
  pending: {
    label: "Beklemede",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    dotColor: "bg-amber-500",
    icon: AlertCircle,
  },
  confirmed: {
    label: "Onaylandi",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    dotColor: "bg-blue-500",
    icon: CheckCircle2,
  },
  completed: {
    label: "Tamamlandi",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Iptal",
    color: "bg-red-500/10 text-red-600 border-red-200",
    dotColor: "bg-red-500",
    icon: XCircle,
  },
}

interface MyReservationsViewProps {
  staffId?: string
  staffName?: string
}

export function MyReservationsView({ 
  staffId = currentStaff.id, 
  staffName = currentStaff.name 
}: MyReservationsViewProps) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  // Ay navigasyonu
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  // Onceki ay
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  // Sonraki ay
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Bugune don
  const goToToday = () => {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    setSelectedDate(null)
  }

  // Ayin gunlerini hesapla
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    
    // Pazartesi = 0, Pazar = 6 olacak sekilde ayarla
    let startDay = firstDayOfMonth.getDay() - 1
    if (startDay < 0) startDay = 6
    
    const daysInMonth = lastDayOfMonth.getDate()
    const days = []
    
    // Onceki ayin gunleri
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      const month = currentMonth === 0 ? 11 : currentMonth - 1
      const year = currentMonth === 0 ? currentYear - 1 : currentYear
      days.push({
        day,
        month,
        year,
        dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        isCurrentMonth: false,
        isToday: false,
      })
    }
    
    // Bu ayin gunleri
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      const isToday = 
        i === today.getDate() && 
        currentMonth === today.getMonth() && 
        currentYear === today.getFullYear()
      
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        dateStr,
        isCurrentMonth: true,
        isToday,
      })
    }
    
    // Sonraki ayin gunleri (6 satir tamamlamak icin)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const month = currentMonth === 11 ? 0 : currentMonth + 1
      const year = currentMonth === 11 ? currentYear + 1 : currentYear
      days.push({
        day: i,
        month,
        year,
        dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        isCurrentMonth: false,
        isToday: false,
      })
    }
    
    return days
  }, [currentMonth, currentYear, today])

  // Kullanicinin rezervasyonlari
  const myReservations = useMemo(() => {
    return reservations.filter((r) => r.staffId === staffId)
  }, [reservations, staffId])

  // Filtrelenmis rezervasyonlar
  const filteredReservations = useMemo(() => {
    let filtered = myReservations

    // Tarih filtresi
    if (selectedDate) {
      filtered = filtered.filter((r) => r.date === selectedDate)
    }

    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.customerName.toLowerCase().includes(query) ||
          r.customerSurname.toLowerCase().includes(query) ||
          r.phone.includes(query)
      )
    }

    // Durum filtresi
    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus)
    }

    // Tarihe gore sirala
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })
  }, [myReservations, selectedDate, searchQuery, filterStatus])

  // Bir gundeki rezervasyonlar
  const getReservationsForDate = (dateStr: string) => {
    return myReservations.filter((r) => r.date === dateStr && r.status !== "cancelled")
  }

  // Bugunku randevu sayisi
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const todayCount = getReservationsForDate(todayStr).length
  const pendingCount = myReservations.filter((r) => r.status === "pending").length
  const confirmedCount = myReservations.filter((r) => r.status === "confirmed").length

  // Bu aydaki toplam randevu
  const monthReservations = myReservations.filter((r) => {
    const [y, m] = r.date.split("-").map(Number)
    return y === currentYear && m === currentMonth + 1 && r.status !== "cancelled"
  })

  // Durum guncelle
  const updateStatus = (id: string, newStatus: Reservation["status"]) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
  }

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return `${d} ${turkishMonths[m - 1]} ${y}, ${turkishDays[date.getDay()]}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Randevularim</h1>
          <p className="text-muted-foreground mt-1">
            Merhaba <span className="font-medium text-foreground">{staffName}</span>, size atanan randevulari burada gorebilirsiniz
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Bugunki Randevu</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{monthReservations.length}</p>
              <p className="text-sm text-muted-foreground">Bu Ay Toplam</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Bekleyen Onay</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{confirmedCount}</p>
              <p className="text-sm text-muted-foreground">Onaylanan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aylik Takvim */}
      <div className="bg-card rounded-2xl border border-border p-5">
        {/* Takvim Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">
              {turkishMonths[currentMonth]} {currentYear}
            </h3>
            <Badge variant="outline" className="text-xs">
              {monthReservations.length} randevu
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={goToToday}
            >
              Bugun
            </Button>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none h-8 w-8"
                onClick={prevMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-border" />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none h-8 w-8"
                onClick={nextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground rounded-lg"
                onClick={() => setSelectedDate(null)}
              >
                Filtreyi Temizle
              </Button>
            )}
          </div>
        </div>

        {/* Gun Basliklari */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {turkishDaysShort.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Takvim Gunleri */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayReservations = getReservationsForDate(day.dateStr)
            const hasReservations = dayReservations.length > 0
            const isSelected = selectedDate === day.dateStr
            const hasPending = dayReservations.some((r) => r.status === "pending")
            const hasConfirmed = dayReservations.some((r) => r.status === "confirmed")

            return (
              <button
                key={index}
                onClick={() => day.isCurrentMonth && setSelectedDate(isSelected ? null : day.dateStr)}
                disabled={!day.isCurrentMonth}
                className={cn(
                  "relative aspect-square p-1 rounded-xl transition-all flex flex-col items-center justify-start pt-2",
                  day.isCurrentMonth
                    ? isSelected
                      ? "bg-primary text-primary-foreground"
                      : day.isToday
                      ? "bg-primary/10 ring-2 ring-primary/30"
                      : "hover:bg-muted"
                    : "opacity-30 cursor-default"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    !day.isCurrentMonth && "text-muted-foreground",
                    isSelected && "text-primary-foreground"
                  )}
                >
                  {day.day}
                </span>
                
                {/* Randevu Gostergeleri */}
                {hasReservations && day.isCurrentMonth && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {dayReservations.length <= 3 ? (
                      dayReservations.map((r, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isSelected
                              ? "bg-primary-foreground/70"
                              : statusConfig[r.status].dotColor
                          )}
                        />
                      ))
                    ) : (
                      <>
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isSelected ? "bg-primary-foreground/70" : "bg-blue-500"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[10px] font-medium ml-0.5",
                            isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          +{dayReservations.length - 1}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Lejant */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">Durum:</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Beklemede</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Onaylandi</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Tamamlandi</span>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Musteri adi veya telefon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {[
              { value: "all", label: "Tumu" },
              { value: "pending", label: "Bekleyen" },
              { value: "confirmed", label: "Onaylanan" },
              { value: "completed", label: "Tamamlanan" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filterStatus === option.value ? "default" : "outline"}
                size="sm"
                className="rounded-lg"
                onClick={() => setFilterStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Rezervasyon Listesi */}
      <div className="space-y-3">
        {selectedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(selectedDate)} icin {filteredReservations.length} randevu</span>
          </div>
        )}

        {filteredReservations.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">Randevu Bulunamadi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedDate
                ? "Bu tarihte randevunuz yok"
                : "Secili kriterlere uygun randevu bulunamadi"}
            </p>
          </div>
        ) : (
          filteredReservations.map((reservation) => {
            const StatusIcon = statusConfig[reservation.status].icon
            const [y, m, d] = reservation.date.split("-").map(Number)

            return (
              <div
                key={reservation.id}
                className="p-5 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Sol Kisim - Musteri Bilgileri */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary">{d}</span>
                      <span className="text-[10px] font-medium text-primary/70 uppercase">
                        {turkishMonths[m - 1].slice(0, 3)}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {reservation.customerName} {reservation.customerSurname}
                        </h3>
                        {reservation.source === "website" && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Globe className="w-3 h-3" />
                            Web
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">{reservation.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{reservation.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-foreground">{reservation.services.join(", ")}</span>
                      </div>
                      {reservation.notes && (
                        <div className="flex items-start gap-1.5 text-sm">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground italic">{reservation.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sag Kisim - Durum ve Aksiyonlar */}
                  <div className="flex items-center gap-3 md:flex-col md:items-end">
                    <Badge
                      variant="outline"
                      className={cn("rounded-lg gap-1", statusConfig[reservation.status].color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[reservation.status].label}
                    </Badge>

                    {/* Durum Butonlari */}
                    {reservation.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => updateStatus(reservation.id, "confirmed")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateStatus(reservation.id, "cancelled")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Iptal
                        </Button>
                      </div>
                    )}
                    {reservation.status === "confirmed" && (
                      <Button
                        size="sm"
                        className="rounded-lg"
                        onClick={() => updateStatus(reservation.id, "completed")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Tamamla
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
