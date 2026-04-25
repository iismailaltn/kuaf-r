"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import { TrendingUp, Users, Clock, Scissors, DollarSign, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Period = "daily" | "monthly" | "yearly"

// Renk paleti
const COLORS = {
  primary: "#10b981",
  secondary: "#3b82f6", 
  tertiary: "#f59e0b",
  quaternary: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  lime: "#84cc16",
}

// Ay isimleri
const MONTHS = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"]
const MONTHS_SHORT = ["Oca", "Sub", "Mar", "Nis", "May", "Haz", "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara"]
const DAYS = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]
const DAYS_SHORT = ["Paz", "Pzt", "Sal", "Car", "Per", "Cum", "Cmt"]

// Calisan verileri
const employees = [
  { id: 1, name: "Ahmet Y.", renk: COLORS.primary },
  { id: 2, name: "Ayse K.", renk: COLORS.secondary },
  { id: 3, name: "Mehmet D.", renk: COLORS.tertiary },
  { id: 4, name: "Fatma C.", renk: COLORS.quaternary },
  { id: 5, name: "Ali O.", renk: COLORS.purple },
]

// Calisan islem verisi uretici
const generateEmployeeData = (date: Date, period: Period) => {
  const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear()
  return employees.map((emp, idx) => ({
    name: emp.name,
    islem: period === "daily" 
      ? Math.floor(5 + ((seed * (idx + 1)) % 12))
      : period === "monthly"
        ? Math.floor(120 + ((seed * (idx + 1)) % 150))
        : Math.floor(1500 + ((seed * (idx + 1)) % 1500)),
    renk: emp.renk,
  }))
}

// Ortalama islem suresi verisi
const generateDurationData = (date: Date) => {
  const seed = date.getDate() + date.getMonth() * 31
  return employees.map((emp, idx) => ({
    name: emp.name,
    sure: 25 + ((seed * (idx + 1)) % 35),
    hedef: 30 + (idx % 3) * 10,
  }))
}

// Gunluk islem grafigi verisi (son 7 gun)
const generateDailyOperations = (date: Date) => {
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(date)
    d.setDate(d.getDate() - i)
    const dayName = DAYS_SHORT[d.getDay()]
    const seed = d.getDate() + d.getMonth() * 31
    result.push({
      gun: `${d.getDate()} ${dayName}`,
      islem: 20 + (seed % 50),
      musteri: 15 + (seed % 40),
    })
  }
  return result
}

// Aylik islem grafigi verisi (12 ay)
const generateMonthlyOperations = (year: number) => {
  return MONTHS_SHORT.map((ay, idx) => {
    const seed = idx + year
    return {
      ay,
      islem: 600 + (seed * 37 % 500),
      musteri: 500 + (seed * 29 % 400),
    }
  })
}

// Yillik islem grafigi verisi (son 5 yil)
const generateYearlyOperations = (currentYear: number) => {
  const result = []
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i
    const seed = year
    result.push({
      yil: year.toString(),
      islem: 8000 + (seed * 123 % 5000),
      musteri: 6500 + (seed * 97 % 4000),
    })
  }
  return result
}

// En cok kazandiran islemler
const generateRevenueByService = (date: Date, period: Period) => {
  const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear()
  const multiplier = period === "daily" ? 1 : period === "monthly" ? 30 : 365
  return [
    { name: "Sac Boyama", kazanc: Math.floor((1500 + (seed % 500)) * multiplier / 30), renk: COLORS.primary },
    { name: "Sac Kesimi", kazanc: Math.floor((1200 + (seed % 400)) * multiplier / 30), renk: COLORS.secondary },
    { name: "Fon", kazanc: Math.floor((900 + (seed % 300)) * multiplier / 30), renk: COLORS.tertiary },
    { name: "Manikur/Pedikur", kazanc: Math.floor((600 + (seed % 200)) * multiplier / 30), renk: COLORS.quaternary },
    { name: "Cilt Bakimi", kazanc: Math.floor((500 + (seed % 200)) * multiplier / 30), renk: COLORS.purple },
    { name: "Makyaj", kazanc: Math.floor((400 + (seed % 150)) * multiplier / 30), renk: COLORS.pink },
    { name: "Agda", kazanc: Math.floor((300 + (seed % 100)) * multiplier / 30), renk: COLORS.cyan },
    { name: "Kas Dizayn", kazanc: Math.floor((200 + (seed % 80)) * multiplier / 30), renk: COLORS.lime },
  ]
}

// Ciro ve net kazanc verisi
const generateRevenueData = (date: Date, period: Period) => {
  if (period === "daily") {
    // Son 7 gun
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(date)
      d.setDate(d.getDate() - i)
      const seed = d.getDate() + d.getMonth() * 31
      const ciro = 1500 + (seed * 47 % 2000)
      const gider = 400 + (seed * 13 % 500)
      result.push({
        label: `${d.getDate()} ${DAYS_SHORT[d.getDay()]}`,
        ciro,
        net: ciro - gider,
        gider,
      })
    }
    return result
  } else if (period === "monthly") {
    // 12 ay
    return MONTHS_SHORT.map((ay, idx) => {
      const seed = idx + date.getFullYear()
      const ciro = 38000 + (seed * 1237 % 30000)
      const gider = 12000 + (seed * 431 % 10000)
      return {
        label: ay,
        ciro,
        net: ciro - gider,
        gider,
      }
    })
  } else {
    // Son 5 yil
    const result = []
    for (let i = 4; i >= 0; i--) {
      const year = date.getFullYear() - i
      const seed = year
      const ciro = 450000 + (seed * 12347 % 250000)
      const gider = 150000 + (seed * 4321 % 100000)
      result.push({
        label: year.toString(),
        ciro,
        net: ciro - gider,
        gider,
      })
    }
    return result
  }
}

// Musteri memnuniyeti verisi
const generateSatisfactionData = (year: number) => {
  return MONTHS_SHORT.map((ay, idx) => {
    const seed = idx + year
    return {
      ay,
      memnuniyet: 4 + (seed % 10) / 10,
      geriDonus: 60 + (seed * 3 % 25),
    }
  })
}

// Yogun saatler verisi (gune gore)
const generatePeakHoursDaily = (date: Date) => {
  const seed = date.getDate() + date.getMonth() * 31
  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
  return hours.map((saat, idx) => ({
    saat,
    musteri: 3 + ((seed + idx * 7) % 20),
  }))
}

// Yogun gunler verisi (aya gore)
const generatePeakDaysMonthly = (date: Date) => {
  const seed = date.getMonth() + date.getFullYear()
  return DAYS_SHORT.map((gun, idx) => ({
    gun,
    musteri: 20 + ((seed + idx * 17) % 60),
  }))
}

// Tarih formatla
const formatDate = (date: Date) => {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

const formatMonth = (date: Date) => {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

// Donem secimi butonu
function PeriodSelector({ 
  value, 
  onChange,
  options = [
    { id: "daily", label: "Gunluk" },
    { id: "monthly", label: "Aylik" },
    { id: "yearly", label: "Yillik" },
  ]
}: { 
  value: string
  onChange: (period: string) => void
  options?: { id: string; label: string }[]
}) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            value === option.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Tarih secici
function DateNavigator({
  date,
  onPrev,
  onNext,
  label,
}: {
  date: Date
  onPrev: () => void
  onNext: () => void
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium min-w-[140px] text-center">{label}</span>
      <button
        onClick={onNext}
        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// Ozet kart
function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  color = "primary"
}: { 
  title: string
  value: string
  change?: string
  icon: any
  color?: "primary" | "secondary" | "tertiary" | "quaternary"
}) {
  const colorClasses = {
    primary: "bg-emerald-500/10 text-emerald-600",
    secondary: "bg-blue-500/10 text-blue-600",
    tertiary: "bg-amber-500/10 text-amber-600",
    quaternary: "bg-red-500/10 text-red-600",
  }

  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {change && (
              <p className={cn(
                "text-xs mt-1 flex items-center gap-1",
                change.startsWith("+") ? "text-emerald-600" : "text-red-500"
              )}>
                <TrendingUp className="w-3 h-3" />
                {change} gecen aya gore
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PerformanceView() {
  // State for each chart
  const [employeePeriod, setEmployeePeriod] = useState<Period>("daily")
  const [employeeDate, setEmployeeDate] = useState(new Date())
  
  const [durationDate, setDurationDate] = useState(new Date())
  const [durationPeriod, setDurationPeriod] = useState<Period>("daily")
  
  const [operationsPeriod, setOperationsPeriod] = useState<Period>("daily")
  const [operationsDate, setOperationsDate] = useState(new Date())
  
  const [servicePeriod, setServicePeriod] = useState<Period>("daily")
  const [serviceDate, setServiceDate] = useState(new Date())
  
  const [revenuePeriod, setRevenuePeriod] = useState<Period>("monthly")
  const [revenueDate, setRevenueDate] = useState(new Date())
  
  const [satisfactionYear, setSatisfactionYear] = useState(new Date().getFullYear())
  const [satisfactionPeriod, setSatisfactionPeriod] = useState<"monthly" | "yearly">("monthly")
  
  const [peakPeriod, setPeakPeriod] = useState<"daily" | "monthly">("daily")
  const [peakDate, setPeakDate] = useState(new Date())

  // Navigation helpers
  const navigateDate = (date: Date, setDate: (d: Date) => void, period: Period, direction: number) => {
    const newDate = new Date(date)
    if (period === "daily") {
      newDate.setDate(newDate.getDate() + direction)
    } else if (period === "monthly") {
      newDate.setMonth(newDate.getMonth() + direction)
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction)
    }
    setDate(newDate)
  }

  const getDateLabel = (date: Date, period: Period) => {
    if (period === "daily") return formatDate(date)
    if (period === "monthly") return formatMonth(date)
    return date.getFullYear().toString()
  }

  // Get data based on current selections
  const employeeData = generateEmployeeData(employeeDate, employeePeriod)
  const durationData = generateDurationData(durationDate)
  
  const getOperationsData = () => {
    if (operationsPeriod === "daily") {
      return { data: generateDailyOperations(operationsDate), xKey: "gun" }
    } else if (operationsPeriod === "monthly") {
      return { data: generateMonthlyOperations(operationsDate.getFullYear()), xKey: "ay" }
    } else {
      return { data: generateYearlyOperations(operationsDate.getFullYear()), xKey: "yil" }
    }
  }

  const serviceData = generateRevenueByService(serviceDate, servicePeriod)
  const revenueData = generateRevenueData(revenueDate, revenuePeriod)
  const satisfactionData = generateSatisfactionData(satisfactionYear)
  const peakData = peakPeriod === "daily" 
    ? generatePeakHoursDaily(peakDate) 
    : generatePeakDaysMonthly(peakDate)

  // Summary calculations
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.ciro, 0)
  const totalNet = revenueData.reduce((sum, item) => sum + item.net, 0)
  const totalOperations = employeeData.reduce((sum, item) => sum + item.islem, 0)
  const avgSatisfaction = (satisfactionData.reduce((sum, item) => sum + item.memnuniyet, 0) / satisfactionData.length).toFixed(1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performans</h1>
        <p className="text-muted-foreground mt-1">Salon performansinizi detayli grafiklerle takip edin</p>
      </div>

      {/* Ozet Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Ciro"
          value={`${(totalRevenue / 1000).toFixed(0)}K TL`}
          change="+12.5%"
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Net Kazanc"
          value={`${(totalNet / 1000).toFixed(0)}K TL`}
          change="+8.2%"
          icon={TrendingUp}
          color="secondary"
        />
        <StatCard
          title="Toplam Islem"
          value={totalOperations.toLocaleString()}
          change="+15.3%"
          icon={Scissors}
          color="tertiary"
        />
        <StatCard
          title="Musteri Memnuniyeti"
          value={`${avgSatisfaction}/5`}
          change="+0.3"
          icon={Users}
          color="quaternary"
        />
      </div>

      {/* Grafik Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calisan Performansi */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Calisan Islem Sayisi</CardTitle>
                <CardDescription>Calisanlarin yaptigi islem sayilari</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <PeriodSelector value={employeePeriod} onChange={(p) => setEmployeePeriod(p as Period)} />
              </div>
            </div>
            <div className="mt-2">
              <DateNavigator
                date={employeeDate}
                onPrev={() => navigateDate(employeeDate, setEmployeeDate, employeePeriod, -1)}
                onNext={() => navigateDate(employeeDate, setEmployeeDate, employeePeriod, 1)}
                label={getDateLabel(employeeDate, employeePeriod)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                islem: { label: "Islem", color: COLORS.primary },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="islem" radius={[0, 6, 6, 0]}>
                    {employeeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.renk} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Ortalama Islem Sureleri */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Ortalama Islem Sureleri</CardTitle>
                <CardDescription>Calisanlarin ortalama islem sureleri (dakika)</CardDescription>
              </div>
              <PeriodSelector 
                value={durationPeriod} 
                onChange={(p) => setDurationPeriod(p as Period)} 
              />
            </div>
            <div className="mt-2">
              <DateNavigator
                date={durationDate}
                onPrev={() => navigateDate(durationDate, setDurationDate, durationPeriod, -1)}
                onNext={() => navigateDate(durationDate, setDurationDate, durationPeriod, 1)}
                label={getDateLabel(durationDate, durationPeriod)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sure: { label: "Ortalama Sure", color: COLORS.secondary },
                hedef: { label: "Hedef Sure", color: COLORS.tertiary },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationData} margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="sure" name="Ortalama" fill={COLORS.secondary} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="hedef" name="Hedef" fill={COLORS.tertiary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Islem Grafigi */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Islem Grafigi</CardTitle>
                <CardDescription>Yapilan islem ve musteri sayilari</CardDescription>
              </div>
              <PeriodSelector value={operationsPeriod} onChange={(p) => setOperationsPeriod(p as Period)} />
            </div>
            <div className="mt-2">
              <DateNavigator
                date={operationsDate}
                onPrev={() => navigateDate(operationsDate, setOperationsDate, operationsPeriod, -1)}
                onNext={() => navigateDate(operationsDate, setOperationsDate, operationsPeriod, 1)}
                label={getDateLabel(operationsDate, operationsPeriod)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                islem: { label: "Islem", color: COLORS.primary },
                musteri: { label: "Musteri", color: COLORS.secondary },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getOperationsData().data} margin={{ left: 0, right: 20 }}>
                  <defs>
                    <linearGradient id="islemGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="musteriGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey={getOperationsData().xKey} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="islem"
                    name="Islem"
                    stroke={COLORS.primary}
                    fill="url(#islemGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="musteri"
                    name="Musteri"
                    stroke={COLORS.secondary}
                    fill="url(#musteriGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* En Cok Kazandiran Islemler */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">En Cok Kazandiran Islemler</CardTitle>
                <CardDescription>Hizmetlere gore gelir dagilimi</CardDescription>
              </div>
              <PeriodSelector value={servicePeriod} onChange={(p) => setServicePeriod(p as Period)} />
            </div>
            <div className="mt-2">
              <DateNavigator
                date={serviceDate}
                onPrev={() => navigateDate(serviceDate, setServiceDate, servicePeriod, -1)}
                onNext={() => navigateDate(serviceDate, setServiceDate, servicePeriod, 1)}
                label={getDateLabel(serviceDate, servicePeriod)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 h-[260px]">
              <ChartContainer
                config={{
                  kazanc: { label: "Kazanc", color: COLORS.primary },
                }}
                className="flex-1 min-w-0"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="kazanc"
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.renk} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].payload.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {payload[0].value?.toLocaleString()} TL
                              </p>
                            </div>
                          )
                        }
                        return null
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="w-28 flex flex-col justify-center gap-1 shrink-0 overflow-hidden">
                {serviceData.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: item.renk }} 
                    />
                    <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ciro ve Net Kazanc */}
        <Card className="rounded-2xl border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Ciro ve Net Kazanc</CardTitle>
                <CardDescription>Ciro, gider ve net kazanc grafigi</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <PeriodSelector value={revenuePeriod} onChange={(p) => setRevenuePeriod(p as Period)} />
              </div>
            </div>
            <div className="mt-2">
              <DateNavigator
                date={revenueDate}
                onPrev={() => navigateDate(revenueDate, setRevenueDate, revenuePeriod, -1)}
                onNext={() => navigateDate(revenueDate, setRevenueDate, revenuePeriod, 1)}
                label={getDateLabel(revenueDate, revenuePeriod)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ciro: { label: "Ciro", color: COLORS.primary },
                net: { label: "Net Kazanc", color: COLORS.secondary },
                gider: { label: "Gider", color: COLORS.quaternary },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value / 1000}K`} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="text-sm font-medium mb-2">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm flex items-center gap-2">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground">{entry.name}:</span>
                                <span className="font-medium">{entry.value?.toLocaleString()} TL</span>
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="ciro" name="Ciro" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="net" name="Net Kazanc" fill={COLORS.secondary} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gider" name="Gider" fill={COLORS.quaternary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Musteri Memnuniyeti ve Geri Donus */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Musteri Memnuniyeti</CardTitle>
                <CardDescription>Memnuniyet puani ve geri donus orani</CardDescription>
              </div>
              <PeriodSelector 
                value={satisfactionPeriod} 
                onChange={(p) => setSatisfactionPeriod(p as "monthly" | "yearly")}
                options={[
                  { id: "monthly", label: "Aylik" },
                  { id: "yearly", label: "Yillik" },
                ]}
              />
            </div>
            <div className="mt-2">
              <DateNavigator
                date={new Date(satisfactionYear, 0, 1)}
                onPrev={() => setSatisfactionYear(satisfactionYear - 1)}
                onNext={() => setSatisfactionYear(satisfactionYear + 1)}
                label={satisfactionYear.toString()}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                memnuniyet: { label: "Memnuniyet", color: COLORS.primary },
                geriDonus: { label: "Geri Donus %", color: COLORS.purple },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={satisfactionData} margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={[3, 5]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[50, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="memnuniyet"
                    name="Memnuniyet (5 uzerinden)"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="geriDonus"
                    name="Geri Donus (%)"
                    stroke={COLORS.purple}
                    strokeWidth={2}
                    dot={{ fill: COLORS.purple, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Yogun Saatler / Gunler */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {peakPeriod === "daily" ? "Yogun Saatler" : "Yogun Gunler"}
                </CardTitle>
                <CardDescription>
                  {peakPeriod === "daily" 
                    ? "Saatlere gore musteri yogunlugu" 
                    : "Gunlere gore musteri yogunlugu"}
                </CardDescription>
              </div>
              <PeriodSelector 
                value={peakPeriod} 
                onChange={(p) => setPeakPeriod(p as "daily" | "monthly")}
                options={[
                  { id: "daily", label: "Saatlik" },
                  { id: "monthly", label: "Gunluk" },
                ]}
              />
            </div>
            <div className="mt-2">
              <DateNavigator
                date={peakDate}
                onPrev={() => {
                  const newDate = new Date(peakDate)
                  if (peakPeriod === "daily") {
                    newDate.setDate(newDate.getDate() - 1)
                  } else {
                    newDate.setMonth(newDate.getMonth() - 1)
                  }
                  setPeakDate(newDate)
                }}
                onNext={() => {
                  const newDate = new Date(peakDate)
                  if (peakPeriod === "daily") {
                    newDate.setDate(newDate.getDate() + 1)
                  } else {
                    newDate.setMonth(newDate.getMonth() + 1)
                  }
                  setPeakDate(newDate)
                }}
                label={peakPeriod === "daily" ? formatDate(peakDate) : formatMonth(peakDate)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                musteri: { label: "Musteri", color: COLORS.tertiary },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakData} margin={{ left: 0, right: 20 }}>
                  <defs>
                    <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.tertiary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.tertiary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey={peakPeriod === "daily" ? "saat" : "gun"} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="musteri"
                    name="Musteri Sayisi"
                    stroke={COLORS.tertiary}
                    fill="url(#peakGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
