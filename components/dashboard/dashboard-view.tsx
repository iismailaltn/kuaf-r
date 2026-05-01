"use client"

import { StatCard } from "./stat-card"
import { RevenueChart } from "./revenue-chart"
import { CategoryChart } from "./category-chart"
import { InfoCard } from "./info-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, Users, UtensilsCrossed, Clock } from "lucide-react"

interface DashboardViewProps {
  shopName?: string
}

export function DashboardView({ shopName = "Güzel Kuaför" }: DashboardViewProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Tekrar hos geldin!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bugün {shopName} için olanlar burada.
          </p>
        </div>
        <Select defaultValue="today">
          <SelectTrigger className="w-36 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Bugun</SelectItem>
            <SelectItem value="this-week">Bu hafta</SelectItem>
            <SelectItem value="this-month">Bu ay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <StatCard
            title="Bugunun Cirosu"
            value="$ 2,458"
            change="12.5%"
            changeType="positive"
            subtitle="dune gore"
            highlighted
          />
          <StatCard
            title="Aktif Masa"
            value="8/12"
            change="2"
            changeType="positive"
            subtitle="Dolu masa"
          />
        </div>

        <div className="space-y-4">
          <StatCard
            title="Bugunku Siparis"
            value="47"
            change="8.3%"
            changeType="positive"
            subtitle="dune gore"
          />
          <StatCard
            title="Ort. Siparis Tutari"
            value="$ 52.30"
            change="3.2%"
            changeType="positive"
            subtitle="gecen haftaya gore"
          />
        </div>

        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard
          icon={<UtensilsCrossed className="w-5 h-5 text-muted-foreground" />}
          value="12"
          label="bekleyen siparis"
          description={
            <>
              Mutfakta 5 siparis{" "}
              <span className="text-amber-500">ilgi bekliyor</span>.
            </>
          }
        />
        <InfoCard
          icon={<Clock className="w-5 h-5 text-muted-foreground" />}
          value="18"
          label="dk ort. bekleme"
          description={
            <>
              Ortalama bekleme sureden{" "}
              <span className="text-green-500">3 dk daha hizli</span>.
            </>
          }
        />
        <CategoryChart />
      </div>
    </div>
  )
}
