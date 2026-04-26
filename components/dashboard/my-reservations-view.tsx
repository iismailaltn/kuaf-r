"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Clock,
  User,
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
    date: "2026-04-26",
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
    date: "2026-04-27",
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
    date: "2026-04-28",
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
    date: "2026-04-25",
    time: "10:00",
    customerName: "Kemal",
    customerSurname: "Yildiz",
    phone: "0537 111 22 33",
    services: ["Sakal Kesimi"],
    staffId: "EMP001",
    staffName: "Ahmet Yilmaz",
    notes: "",
    source: "manual",
    status: "completed",
  },
]

const turkishMonths = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"
]

const turkishDays = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]

const statusConfig = {
  pending: {
    label: "Beklemede",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    icon: AlertCircle,
  },
  confirmed: {
    label: "Onaylandi",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: CheckCircle2,
  },
  completed: {
    label: "Tamamlandi",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Iptal",
    color: "bg-red-500/10 text-red-600 border-red-200",
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

  // Bugunden itibaren 7 gun
  const today = new Date()
  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push({
        date: date,
        dateStr: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        dayName: turkishDays[date.getDay()],
        dayNumber: date.getDate(),
        monthName: turkishMonths[date.getMonth()],
        isToday: i === 0,
      })
    }
    return days
  }, [])

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

  // Bir gundeki rezervasyon sayisi
  const getReservationCount = (dateStr: string) => {
    return myReservations.filter((r) => r.date === dateStr && r.status !== "cancelled" && r.status !== "completed").length
  }

  // Bugunku randevu sayisi
  const todayCount = getReservationCount(weekDays[0].dateStr)
  const pendingCount = myReservations.filter((r) => r.status === "pending").length
  const confirmedCount = myReservations.filter((r) => r.status === "confirmed").length

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Haftalik Takvim */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Bu Hafta</h3>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setSelectedDate(null)}
            >
              Filtreyi Temizle
            </Button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const count = getReservationCount(day.dateStr)
            const isSelected = selectedDate === day.dateStr

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(isSelected ? null : day.dateStr)}
                className={cn(
                  "p-3 rounded-xl text-center transition-all border-2",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : day.isToday
                    ? "bg-primary/10 border-primary/30 hover:bg-primary/20"
                    : "bg-muted/30 border-transparent hover:bg-muted hover:border-muted-foreground/20"
                )}
              >
                <p className={cn(
                  "text-xs font-medium mb-1",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {day.dayName.slice(0, 3)}
                </p>
                <p className={cn(
                  "text-lg font-bold",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {day.dayNumber}
                </p>
                {count > 0 && (
                  <div className={cn(
                    "mt-1 text-xs font-medium rounded-full px-2 py-0.5",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-emerald-500/10 text-emerald-600"
                  )}>
                    {count} randevu
                  </div>
                )}
              </button>
            )
          })}
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
            const formattedDate = `${d} ${turkishMonths[m - 1]}`

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
