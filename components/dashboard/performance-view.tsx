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
import { TrendingUp, Users, Clock, Scissors, DollarSign, Calendar } from "lucide-react"
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

// Calisanlar islem sayisi verisi
const employeePerformanceDaily = [
  { name: "Ahmet Y.", islem: 8, renk: COLORS.primary },
  { name: "Ayse K.", islem: 12, renk: COLORS.secondary },
  { name: "Mehmet D.", islem: 6, renk: COLORS.tertiary },
  { name: "Fatma C.", islem: 10, renk: COLORS.quaternary },
  { name: "Ali O.", islem: 7, renk: COLORS.purple },
]

const employeePerformanceMonthly = [
  { name: "Ahmet Y.", islem: 156, renk: COLORS.primary },
  { name: "Ayse K.", islem: 248, renk: COLORS.secondary },
  { name: "Mehmet D.", islem: 132, renk: COLORS.tertiary },
  { name: "Fatma C.", islem: 198, renk: COLORS.quaternary },
  { name: "Ali O.", islem: 145, renk: COLORS.purple },
]

const employeePerformanceYearly = [
  { name: "Ahmet Y.", islem: 1872, renk: COLORS.primary },
  { name: "Ayse K.", islem: 2976, renk: COLORS.secondary },
  { name: "Mehmet D.", islem: 1584, renk: COLORS.tertiary },
  { name: "Fatma C.", islem: 2376, renk: COLORS.quaternary },
  { name: "Ali O.", islem: 1740, renk: COLORS.purple },
]

// Ortalama islem sureleri (dakika)
const avgDurationData = [
  { name: "Ahmet Y.", sure: 35, hedef: 30 },
  { name: "Ayse K.", sure: 42, hedef: 45 },
  { name: "Mehmet D.", sure: 28, hedef: 30 },
  { name: "Fatma C.", sure: 55, hedef: 50 },
  { name: "Ali O.", sure: 25, hedef: 25 },
]

// Gunluk islem grafigi (son 7 gun)
const dailyOperationsData = [
  { gun: "Pzt", islem: 32, musteri: 28 },
  { gun: "Sal", islem: 28, musteri: 24 },
  { gun: "Car", islem: 35, musteri: 30 },
  { gun: "Per", islem: 42, musteri: 38 },
  { gun: "Cum", islem: 56, musteri: 48 },
  { gun: "Cmt", islem: 68, musteri: 58 },
  { gun: "Paz", islem: 24, musteri: 20 },
]

// Aylik islem grafigi (son 12 ay)
const monthlyOperationsData = [
  { ay: "Oca", islem: 680, musteri: 580 },
  { ay: "Sub", islem: 620, musteri: 520 },
  { ay: "Mar", islem: 750, musteri: 640 },
  { ay: "Nis", islem: 820, musteri: 700 },
  { ay: "May", islem: 890, musteri: 760 },
  { ay: "Haz", islem: 950, musteri: 820 },
  { ay: "Tem", islem: 1020, musteri: 880 },
  { ay: "Agu", islem: 980, musteri: 840 },
  { ay: "Eyl", islem: 920, musteri: 790 },
  { ay: "Eki", islem: 880, musteri: 750 },
  { ay: "Kas", islem: 840, musteri: 720 },
  { ay: "Ara", islem: 920, musteri: 780 },
]

// Yillik islem grafigi (son 5 yil)
const yearlyOperationsData = [
  { yil: "2020", islem: 8200, musteri: 7000 },
  { yil: "2021", islem: 9100, musteri: 7800 },
  { yil: "2022", islem: 10500, musteri: 9000 },
  { yil: "2023", islem: 11200, musteri: 9600 },
  { yil: "2024", islem: 12400, musteri: 10600 },
]

// En cok kazandiran islemler
const revenueByServiceData = [
  { name: "Sac Boyama", kazanc: 48500, renk: COLORS.primary },
  { name: "Sac Kesimi", kazanc: 32000, renk: COLORS.secondary },
  { name: "Fon", kazanc: 28500, renk: COLORS.tertiary },
  { name: "Manikur/Pedikur", kazanc: 18200, renk: COLORS.quaternary },
  { name: "Cilt Bakimi", kazanc: 15800, renk: COLORS.purple },
  { name: "Makyaj", kazanc: 12400, renk: COLORS.pink },
  { name: "Agda", kazanc: 8600, renk: COLORS.cyan },
  { name: "Kas Dizayn", kazanc: 6200, renk: COLORS.lime },
]

// Ciro ve net kazanc (aylik)
const revenueData = [
  { ay: "Oca", ciro: 42000, net: 28000, gider: 14000 },
  { ay: "Sub", ciro: 38000, net: 24500, gider: 13500 },
  { ay: "Mar", ciro: 48000, net: 32000, gider: 16000 },
  { ay: "Nis", ciro: 52000, net: 35000, gider: 17000 },
  { ay: "May", ciro: 58000, net: 39000, gider: 19000 },
  { ay: "Haz", ciro: 62000, net: 42000, gider: 20000 },
  { ay: "Tem", ciro: 68000, net: 46000, gider: 22000 },
  { ay: "Agu", ciro: 65000, net: 44000, gider: 21000 },
  { ay: "Eyl", ciro: 60000, net: 40000, gider: 20000 },
  { ay: "Eki", ciro: 56000, net: 37000, gider: 19000 },
  { ay: "Kas", ciro: 54000, net: 36000, gider: 18000 },
  { ay: "Ara", ciro: 62000, net: 42000, gider: 20000 },
]

// Musteri memnuniyeti ve geri donus orani
const customerSatisfactionData = [
  { ay: "Oca", memnuniyet: 4.2, geriDonus: 65 },
  { ay: "Sub", memnuniyet: 4.3, geriDonus: 68 },
  { ay: "Mar", memnuniyet: 4.1, geriDonus: 62 },
  { ay: "Nis", memnuniyet: 4.5, geriDonus: 72 },
  { ay: "May", memnuniyet: 4.6, geriDonus: 75 },
  { ay: "Haz", memnuniyet: 4.4, geriDonus: 70 },
  { ay: "Tem", memnuniyet: 4.7, geriDonus: 78 },
  { ay: "Agu", memnuniyet: 4.5, geriDonus: 74 },
  { ay: "Eyl", memnuniyet: 4.4, geriDonus: 71 },
  { ay: "Eki", memnuniyet: 4.3, geriDonus: 69 },
  { ay: "Kas", memnuniyet: 4.2, geriDonus: 66 },
  { ay: "Ara", memnuniyet: 4.6, geriDonus: 76 },
]

// Yogun saatler
const peakHoursData = [
  { saat: "09:00", musteri: 4 },
  { saat: "10:00", musteri: 8 },
  { saat: "11:00", musteri: 12 },
  { saat: "12:00", musteri: 10 },
  { saat: "13:00", musteri: 6 },
  { saat: "14:00", musteri: 14 },
  { saat: "15:00", musteri: 18 },
  { saat: "16:00", musteri: 22 },
  { saat: "17:00", musteri: 20 },
  { saat: "18:00", musteri: 16 },
  { saat: "19:00", musteri: 10 },
  { saat: "20:00", musteri: 5 },
]

// Donem secimi butonu
function PeriodSelector({ 
  value, 
  onChange 
}: { 
  value: Period
  onChange: (period: Period) => void 
}) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {[
        { id: "daily", label: "Gunluk" },
        { id: "monthly", label: "Aylik" },
        { id: "yearly", label: "Yillik" },
      ].map((period) => (
        <button
          key={period.id}
          onClick={() => onChange(period.id as Period)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            value === period.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {period.label}
        </button>
      ))}
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
  const [employeePeriod, setEmployeePeriod] = useState<Period>("daily")
  const [operationsPeriod, setOperationsPeriod] = useState<Period>("daily")

  const getEmployeeData = () => {
    switch (employeePeriod) {
      case "daily":
        return employeePerformanceDaily
      case "monthly":
        return employeePerformanceMonthly
      case "yearly":
        return employeePerformanceYearly
    }
  }

  const getOperationsData = () => {
    switch (operationsPeriod) {
      case "daily":
        return { data: dailyOperationsData, xKey: "gun" }
      case "monthly":
        return { data: monthlyOperationsData, xKey: "ay" }
      case "yearly":
        return { data: yearlyOperationsData, xKey: "yil" }
    }
  }

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.ciro, 0)
  const totalNet = revenueData.reduce((sum, item) => sum + item.net, 0)
  const totalOperations = monthlyOperationsData.reduce((sum, item) => sum + item.islem, 0)
  const avgSatisfaction = (customerSatisfactionData.reduce((sum, item) => sum + item.memnuniyet, 0) / customerSatisfactionData.length).toFixed(1)

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
          title="Toplam Ciro (Yil)"
          value={`${(totalRevenue / 1000).toFixed(0)}K TL`}
          change="+12.5%"
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Net Kazanc (Yil)"
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Calisan Islem Sayisi</CardTitle>
              <CardDescription>Calisanlarin yaptigi islem sayilari</CardDescription>
            </div>
            <PeriodSelector value={employeePeriod} onChange={setEmployeePeriod} />
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                islem: { label: "Islem", color: COLORS.primary },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getEmployeeData()} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="islem" radius={[0, 6, 6, 0]}>
                    {getEmployeeData().map((entry, index) => (
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
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ortalama Islem Sureleri</CardTitle>
            <CardDescription>Calisanlarin ortalama islem sureleri (dakika)</CardDescription>
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
                <BarChart data={avgDurationData} margin={{ left: 0, right: 20 }}>
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Islem Grafigi</CardTitle>
              <CardDescription>Yapilan islem ve musteri sayilari</CardDescription>
            </div>
            <PeriodSelector value={operationsPeriod} onChange={setOperationsPeriod} />
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
          <CardHeader>
            <CardTitle className="text-base font-semibold">En Cok Kazandiran Islemler</CardTitle>
            <CardDescription>Hizmetlere gore gelir dagilimi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 h-[280px]">
              <ChartContainer
                config={{
                  kazanc: { label: "Kazanc", color: COLORS.primary },
                }}
                className="flex-1"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByServiceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="kazanc"
                    >
                      {revenueByServiceData.map((entry, index) => (
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
              <div className="w-32 flex flex-col justify-center gap-1.5">
                {revenueByServiceData.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: item.renk }} 
                    />
                    <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ciro ve Net Kazanc */}
        <Card className="rounded-2xl border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ciro ve Net Kazanc</CardTitle>
            <CardDescription>Aylik ciro, gider ve net kazanc grafigi</CardDescription>
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
                  <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
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
          <CardHeader>
            <CardTitle className="text-base font-semibold">Musteri Memnuniyeti</CardTitle>
            <CardDescription>Memnuniyet puani ve geri donus orani</CardDescription>
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
                <LineChart data={customerSatisfactionData} margin={{ left: 0, right: 20 }}>
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

        {/* Yogun Saatler */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Yogun Saatler</CardTitle>
            <CardDescription>Saatlere gore ortalama musteri yogunlugu</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                musteri: { label: "Musteri", color: COLORS.tertiary },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHoursData} margin={{ left: 0, right: 20 }}>
                  <defs>
                    <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.tertiary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.tertiary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="saat" tick={{ fontSize: 11 }} />
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
