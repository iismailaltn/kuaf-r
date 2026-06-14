"use client"

import { appConfig } from "@/app.config"
import { apiFetch } from "@/lib/api-fetch"
import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from "react"
import { fetchAllSessionOperationsForBusiness } from "@/lib/session-operations-query"
import { fetchPersonelRowsForBusiness, getActivePersonelNames } from "@/lib/personel-directory"
import {
  buildEmployeeDurationChart,
  buildEmployeeOperationChart,
  buildOperationsTrendChart,
  buildPeakDaysChart,
  buildPeakHoursChart,
  buildRevenueByServiceChart,
  countCompletedInRange,
  SESSION_OPERATIONS_UPDATED_EVENT,
  type PerformancePeriod,
} from "@/lib/session-performance-analytics"
import type { SessionOperation } from "@/lib/session-operations"
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
  Legend,
  AreaChart,
  Area,
} from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { TrendingUp, Users, Clock, Scissors, DollarSign, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PerformanceExportPanel } from "@/components/dashboard/performance-export-panel"

type Period = PerformancePeriod

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

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.tertiary,
  COLORS.quaternary,
  COLORS.purple,
  COLORS.pink,
  COLORS.cyan,
  COLORS.lime,
]

const CHART_SURFACE_CLASS =
  "!aspect-auto w-full min-w-0 max-w-full [&_.recharts-responsive-container]:!w-full [&_.recharts-responsive-container]:!h-full"

function PerformanceChartFrame({
  config,
  height,
  minHeight = 260,
  className,
  children,
}: {
  config: ChartConfig
  height: number
  minHeight?: number
  className?: string
  children: ReactNode
}) {
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <ChartContainer
        config={config}
        className={cn(CHART_SURFACE_CLASS, className)}
        style={{ height: Math.max(minHeight, height), minHeight }}
      >
        {children}
      </ChartContainer>
    </div>
  )
}

function staffChartHeight(count: number, rowHeight = 52, min = 260, max = 440) {
  return Math.max(min, Math.min(max, count * rowHeight))
}

// Ciro ve net kazanc verisi (ornek veri)
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

interface PerformanceViewProps {
  businessUserId?: string
  shopName?: string
}

export function PerformanceView({ businessUserId, shopName }: PerformanceViewProps) {
  const [sessionOperations, setSessionOperations] = useState<SessionOperation[]>([])
  const [staffNames, setStaffNames] = useState<string[]>([])
  const [serviceNames, setServiceNames] = useState<string[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  const loadSessionOperations = useCallback(async () => {
    if (!businessUserId) {
      setSessionOperations([])
      setStaffNames([])
      setServiceNames([])
      return
    }

    const operationsToken = appConfig.token.session_operations
    if (!operationsToken) {
      return
    }

    setIsLoadingSessions(true)
    try {
      const [rows, personelRows] = await Promise.all([
        fetchAllSessionOperationsForBusiness(operationsToken, businessUserId),
        fetchPersonelRowsForBusiness(businessUserId),
      ])
      setSessionOperations(rows)
      setStaffNames(getActivePersonelNames(personelRows))

      const servicesRes = await apiFetch(
        `/api/salon-services?businessUserId=${encodeURIComponent(businessUserId)}&ts=${Date.now()}`,
        { cache: "no-store" },
      )
      const servicesJson = (await servicesRes.json().catch(() => null)) as {
        ok?: boolean
        rows?: Array<{ name?: string; isActive?: boolean }>
      } | null
      if (servicesRes.ok && servicesJson?.ok && Array.isArray(servicesJson.rows)) {
        setServiceNames(
          servicesJson.rows
            .filter((row) => row.isActive !== false)
            .map((row) => String(row.name ?? "").trim())
            .filter(Boolean),
        )
      } else {
        setServiceNames([])
      }
    } finally {
      setIsLoadingSessions(false)
    }
  }, [businessUserId])

  useEffect(() => {
    void loadSessionOperations()
  }, [loadSessionOperations])

  useEffect(() => {
    const onUpdated = () => {
      void loadSessionOperations()
    }
    window.addEventListener(SESSION_OPERATIONS_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(SESSION_OPERATIONS_UPDATED_EVENT, onUpdated)
  }, [loadSessionOperations])

  // State for each chart
  const [employeePeriod, setEmployeePeriod] = useState<Period>("yearly")
  const [employeeDate, setEmployeeDate] = useState(new Date())
  
  const [durationDate, setDurationDate] = useState(new Date())
  const [durationPeriod, setDurationPeriod] = useState<Period>("yearly")
  
  const [operationsPeriod, setOperationsPeriod] = useState<Period>("yearly")
  const [operationsDate, setOperationsDate] = useState(new Date())
  
  const [servicePeriod, setServicePeriod] = useState<Period>("yearly")
  const [serviceDate, setServiceDate] = useState(new Date())
  
  const [revenuePeriod, setRevenuePeriod] = useState<Period>("yearly")
  const [revenueDate, setRevenueDate] = useState(new Date())
  
  const [satisfactionYear, setSatisfactionYear] = useState(new Date().getFullYear())
  const [satisfactionPeriod, setSatisfactionPeriod] = useState<"monthly" | "yearly">("yearly")
  
  const [peakPeriod, setPeakPeriod] = useState<"daily" | "monthly">("monthly")
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

  const employeeData = useMemo(
    () =>
      buildEmployeeOperationChart(
        sessionOperations,
        employeeDate,
        employeePeriod,
        CHART_COLORS,
        staffNames,
      ),
    [sessionOperations, employeeDate, employeePeriod, staffNames],
  )

  const durationData = useMemo(
    () => buildEmployeeDurationChart(sessionOperations, durationDate, durationPeriod, staffNames),
    [sessionOperations, durationDate, durationPeriod, staffNames],
  )

  const employeeChartMax = useMemo(
    () => Math.max(1, ...employeeData.map((item) => item.islem)),
    [employeeData],
  )

  const durationChartMax = useMemo(
    () => Math.max(1, ...durationData.map((item) => Math.max(item.sure, item.hedef))),
    [durationData],
  )

  const operationsChart = useMemo(
    () => buildOperationsTrendChart(sessionOperations, operationsDate, operationsPeriod),
    [sessionOperations, operationsDate, operationsPeriod],
  )

  const serviceData = useMemo(
    () =>
      buildRevenueByServiceChart(
        sessionOperations,
        serviceDate,
        servicePeriod,
        CHART_COLORS,
        serviceNames,
      ),
    [sessionOperations, serviceDate, servicePeriod, serviceNames],
  )

  const peakData = useMemo(
    () =>
      peakPeriod === "daily"
        ? buildPeakHoursChart(sessionOperations, peakDate)
        : buildPeakDaysChart(sessionOperations, peakDate),
    [sessionOperations, peakDate, peakPeriod],
  )

  const revenueData = generateRevenueData(revenueDate, revenuePeriod)
  const satisfactionData = generateSatisfactionData(satisfactionYear)

  // Summary calculations
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.ciro, 0)
  const totalNet = revenueData.reduce((sum, item) => sum + item.net, 0)
  const totalOperations = countCompletedInRange(sessionOperations, employeeDate, employeePeriod)
  const avgSatisfaction = (satisfactionData.reduce((sum, item) => sum + item.memnuniyet, 0) / satisfactionData.length).toFixed(1)

  const chartUid = useId().replace(/:/g, "")
  const employeeChartHeight = staffChartHeight(employeeData.length)
  const durationChartHeight = staffChartHeight(durationData.length)

  return (
    <div className="p-4 sm:p-6 space-y-6 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performans</h1>
          <p className="text-muted-foreground mt-1">
            Salon performansinizi detayli grafiklerle takip edin
            {isLoadingSessions ? " · Seans verileri yukleniyor..." : ""}
          </p>
        </div>

        <PerformanceExportPanel
          className="w-full lg:max-w-md shrink-0"
          businessUserId={businessUserId}
          shopName={shopName}
          sessionOperations={sessionOperations}
          staffNames={staffNames}
          serviceNames={serviceNames}
          palette={CHART_COLORS}
          isLoading={isLoadingSessions}
        />
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
        {/* Calisan Performansi */}
        <Card className="rounded-2xl border-border/50 min-w-0 overflow-hidden">
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
          <CardContent className="min-w-0">
            <PerformanceChartFrame
              config={{ islem: { label: "Islem", color: COLORS.primary } }}
              height={employeeChartHeight}
            >
              <BarChart
                data={employeeData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  domain={[0, employeeChartMax]}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={112}
                  tickMargin={6}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="islem" maxBarSize={28} radius={[0, 6, 6, 0]}>
                  {employeeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.renk} />
                  ))}
                </Bar>
              </BarChart>
            </PerformanceChartFrame>
          </CardContent>
        </Card>

        {/* Ortalama Islem Sureleri */}
        <Card className="rounded-2xl border-border/50 min-w-0 overflow-hidden">
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
          <CardContent className="min-w-0">
            <PerformanceChartFrame
              config={{
                sure: { label: "Ortalama Sure", color: COLORS.secondary },
                hedef: { label: "Hedef Sure", color: COLORS.tertiary },
              }}
              height={durationChartHeight}
            >
              <BarChart data={durationData} margin={{ top: 12, right: 12, left: 4, bottom: 56 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-32}
                  textAnchor="end"
                  height={56}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, durationChartMax]} allowDecimals={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sure" name="Ortalama" fill={COLORS.secondary} maxBarSize={32} radius={[6, 6, 0, 0]} />
                <Bar dataKey="hedef" name="Hedef" fill={COLORS.tertiary} maxBarSize={32} radius={[6, 6, 0, 0]} />
              </BarChart>
            </PerformanceChartFrame>
          </CardContent>
        </Card>

        {/* Islem Grafigi */}
        <Card className="rounded-2xl border-border/50 min-w-0 overflow-hidden">
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
          <CardContent className="min-w-0">
            <PerformanceChartFrame
              config={{
                islem: { label: "Islem", color: COLORS.primary },
                musteri: { label: "Musteri", color: COLORS.secondary },
              }}
              height={300}
            >
              <AreaChart data={operationsChart.data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id={`${chartUid}-islem`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`${chartUid}-musteri`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={operationsChart.xKey} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} width={40} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="islem"
                  name="Islem"
                  stroke={COLORS.primary}
                  fill={`url(#${chartUid}-islem)`}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="musteri"
                  name="Musteri"
                  stroke={COLORS.secondary}
                  fill={`url(#${chartUid}-musteri)`}
                  strokeWidth={2}
                />
              </AreaChart>
            </PerformanceChartFrame>
          </CardContent>
        </Card>

        {/* En Cok Kazandiran Islemler */}
        <Card className="rounded-2xl border-border/50 min-w-0 overflow-hidden">
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
          <CardContent className="min-w-0">
            <div className="flex flex-col lg:flex-row gap-4 min-h-[280px]">
              <PerformanceChartFrame
                config={{ kazanc: { label: "Kazanc", color: COLORS.primary } }}
                height={280}
                className="lg:flex-1 lg:min-w-[220px]"
              >
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius="48%"
                    outerRadius="78%"
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
                              {Number(payload[0].value ?? 0).toLocaleString("tr-TR")} TL
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </PerformanceChartFrame>
              <div className="w-full lg:w-44 shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 content-center">
                {serviceData.map((item) => (
                  <div key={item.name} className="flex items-start gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: item.renk }}
                    />
                    <span className="text-xs text-muted-foreground leading-snug break-words">
                      {item.name}
                      <span className="block text-foreground font-medium">
                        {item.kazanc.toLocaleString("tr-TR")} TL
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ciro ve Net Kazanc */}
        <Card className="rounded-2xl border-border/50 min-w-0 overflow-hidden xl:col-span-2">
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
          <CardContent className="min-w-0">
            <PerformanceChartFrame
              config={{
                ciro: { label: "Ciro", color: COLORS.primary },
                net: { label: "Net Kazanc", color: COLORS.secondary },
                gider: { label: "Gider", color: COLORS.quaternary },
              }}
              height={320}
            >
              <BarChart data={revenueData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(value) => `${value / 1000}K`} />
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
                              <span className="font-medium">
                                {Number(entry.value ?? 0).toLocaleString("tr-TR")} TL
                              </span>
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ciro" name="Ciro" fill={COLORS.primary} maxBarSize={40} radius={[6, 6, 0, 0]} />
                <Bar dataKey="net" name="Net Kazanc" fill={COLORS.secondary} maxBarSize={40} radius={[6, 6, 0, 0]} />
                <Bar dataKey="gider" name="Gider" fill={COLORS.quaternary} maxBarSize={40} radius={[6, 6, 0, 0]} />
              </BarChart>
            </PerformanceChartFrame>
          </CardContent>
        </Card>

        {/* Musteri Memnuniyeti ve Geri Donus */}
        <Card className="rounded-2xl border-border/50 min-w-0 overflow-hidden">
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
          <CardContent className="min-w-0">
            <PerformanceChartFrame
              config={{
                memnuniyet: { label: "Memnuniyet", color: COLORS.primary },
                geriDonus: { label: "Geri Donus %", color: COLORS.purple },
              }}
              height={300}
            >
              <LineChart data={satisfactionData} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ay" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[3, 5]} width={32} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[50, 100]} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="memnuniyet"
                  name="Memnuniyet (5 uzerinden)"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="geriDonus"
                  name="Geri Donus (%)"
                  stroke={COLORS.purple}
                  strokeWidth={2}
                  dot={{ fill: COLORS.purple, r: 3 }}
                />
              </LineChart>
            </PerformanceChartFrame>
          </CardContent>
        </Card>

        {/* Yogun Saatler / Gunler */}
        <Card className="rounded-2xl border-border/50 min-w-0 overflow-hidden">
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
          <CardContent className="min-w-0">
            <PerformanceChartFrame
              config={{ musteri: { label: "Musteri", color: COLORS.tertiary } }}
              height={300}
            >
              <AreaChart data={peakData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id={`${chartUid}-peak`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.tertiary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={COLORS.tertiary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey={peakPeriod === "daily" ? "saat" : "gun"}
                  tick={{ fontSize: 10 }}
                  interval={peakPeriod === "daily" ? 1 : 0}
                />
                <YAxis tick={{ fontSize: 11 }} width={36} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="musteri"
                  name="Musteri Sayisi"
                  stroke={COLORS.tertiary}
                  fill={`url(#${chartUid}-peak)`}
                  strokeWidth={2}
                />
              </AreaChart>
            </PerformanceChartFrame>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
