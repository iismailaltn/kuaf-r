"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ChefHat,
  Clock,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  CheckCircle2,
  Timer,
  AlertCircle,
  X,
} from "lucide-react"

interface OrderItem {
  name: string
  quantity: number
  price: number
  notes?: string
}

interface Order {
  id: string
  table: string
  items: OrderItem[]
  total: number
  time: string
  waiter: string
  status: "yeni" | "hazirlaniyor" | "hazir" | "tamamlandi"
  priority?: "normal" | "high"
}

const statusCards = [
  {
    label: "Yeni Siparis",
    value: 8,
    change: "12%",
    changeType: "positive" as const,
    icon: AlertCircle,
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
  },
  {
    label: "Hazirlaniyor",
    value: 12,
    change: "5%",
    changeType: "positive" as const,
    icon: ChefHat,
    color: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600",
  },
  {
    label: "Servise Hazir",
    value: 4,
    change: "2%",
    changeType: "negative" as const,
    icon: CheckCircle2,
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600",
  },
  {
    label: "Tamamlandi",
    value: 23,
    change: "18%",
    changeType: "positive" as const,
    icon: UtensilsCrossed,
    color: "bg-slate-500",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-600",
  },
]

const orders: Order[] = [
  {
    id: "ORD-001",
    table: "Masa 4",
    items: [
      { name: "Grilled Salmon", quantity: 1, price: 24.99 },
      { name: "Caesar Salad", quantity: 1, price: 12.99 },
      { name: "Tiramisu", quantity: 1, price: 8.99 },
    ],
    total: 58.97,
    time: "12:45",
    waiter: "Maria S.",
    status: "hazirlaniyor",
    priority: "high",
  },
  {
    id: "ORD-002",
    table: "Masa 7",
    items: [
      { name: "Ribeye Steak", quantity: 1, price: 38.99 },
      { name: "Red Wine", quantity: 2, price: 15.00 },
    ],
    total: 72.50,
    time: "12:38",
    waiter: "John D.",
    status: "hazir",
  },
  {
    id: "ORD-003",
    table: "Masa 1",
    items: [
      { name: "Pasta Carbonara", quantity: 2, price: 32.98, notes: "Az soslu" },
      { name: "Bruschetta", quantity: 1, price: 9.99 },
    ],
    total: 45.97,
    time: "12:30",
    waiter: "Maria S.",
    status: "yeni",
    priority: "high",
  },
  {
    id: "ORD-004",
    table: "Masa 10",
    items: [
      { name: "Chicken Parmesan", quantity: 1, price: 22.99 },
      { name: "Lemonade", quantity: 2, price: 9.98 },
    ],
    total: 32.97,
    time: "12:25",
    waiter: "Alex K.",
    status: "hazirlaniyor",
  },
  {
    id: "ORD-005",
    table: "VIP 1",
    items: [
      { name: "Chef's Special", quantity: 1, price: 85.00, notes: "Alerji: Findik" },
      { name: "Wine Pairing", quantity: 1, price: 40.00 },
    ],
    total: 125.00,
    time: "12:15",
    waiter: "John D.",
    status: "tamamlandi",
  },
  {
    id: "ORD-006",
    table: "Masa 2",
    items: [
      { name: "Margherita Pizza", quantity: 1, price: 18.99 },
      { name: "Tiramisu", quantity: 1, price: 8.99 },
    ],
    total: 28.98,
    time: "12:10",
    waiter: "Alex K.",
    status: "tamamlandi",
  },
]

const statusConfig = {
  yeni: {
    label: "Yeni",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: AlertCircle,
  },
  hazirlaniyor: {
    label: "Hazirlaniyor",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    icon: ChefHat,
  },
  hazir: {
    label: "Hazir",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    icon: CheckCircle2,
  },
  tamamlandi: {
    label: "Tamamlandi",
    color: "bg-slate-500/10 text-slate-600 border-slate-200",
    icon: UtensilsCrossed,
  },
}

export function OrdersView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.waiter.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const activeOrders = filteredOrders.filter((o) => o.status !== "tamamlandi")
  const completedOrders = filteredOrders.filter((o) => o.status === "tamamlandi")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mutfak Siparisleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Canli siparis takibi ve mutfak yonetimi
          </p>
        </div>
        <Button className="rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          Yeni Siparis
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="group p-5 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.bgColor)}>
                  <Icon className={cn("w-5 h-5", card.textColor)} />
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                    card.changeType === "positive"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-red-500/10 text-red-600"
                  )}
                >
                  {card.changeType === "positive" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {card.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-2xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Siparis veya masa ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/50 border-0"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 rounded-xl">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Durumlar</SelectItem>
            <SelectItem value="yeni">Yeni</SelectItem>
            <SelectItem value="hazirlaniyor">Hazirlaniyor</SelectItem>
            <SelectItem value="hazir">Hazir</SelectItem>
            <SelectItem value="tamamlandi">Tamamlandi</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-xl gap-2">
          <Download className="w-4 h-4" />
          Disa Aktar
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredOrders.length} siparis
        </span>
      </div>

      {/* Active Orders Grid */}
      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-500" />
            Aktif Siparisler
            <Badge variant="secondary" className="ml-2 rounded-lg">{activeOrders.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon
              return (
                <div
                  key={order.id}
                  className={cn(
                    "group relative p-5 bg-card rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer",
                    order.priority === "high"
                      ? "border-amber-300 bg-amber-50/30"
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => setSelectedOrder(order)}
                >
                  {order.priority === "high" && (
                    <div className="absolute -top-2 -right-2">
                      <span className="flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 items-center justify-center">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">{order.table}</span>
                        <Badge
                          variant="outline"
                          className={cn("rounded-lg gap-1 font-normal", statusConfig[order.status].color)}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[order.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">#{order.id}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {order.time}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">
                          {item.quantity}x {item.name}
                          {item.notes && (
                            <span className="text-xs text-amber-600 ml-1">({item.notes})</span>
                          )}
                        </span>
                        <span className="text-muted-foreground">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 3} urun daha
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">{order.waiter}</span>
                    <span className="text-lg font-bold text-foreground">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Tamamlanan Siparisler
            <Badge variant="secondary" className="ml-2 rounded-lg">{completedOrders.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completedOrders.map((order) => (
              <div
                key={order.id}
                className="group p-5 bg-card/50 rounded-2xl border border-border opacity-75 hover:opacity-100 transition-all cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-lg font-semibold text-foreground">{order.table}</span>
                    <p className="text-sm text-muted-foreground">#{order.id}</p>
                  </div>
                  <Badge variant="outline" className="rounded-lg font-normal bg-slate-500/10 text-slate-600">
                    Tamamlandi
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{order.items.length} urun - {order.waiter}</span>
                  <span className="font-semibold text-foreground">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Siparis bulunamadi</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className={cn(
              "px-6 py-5 border-b border-border",
              selectedOrder.priority === "high" ? "bg-amber-500/5" : "bg-primary/5"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-foreground">{selectedOrder.table}</h2>
                    <Badge
                      variant="outline"
                      className={cn("rounded-lg gap-1", statusConfig[selectedOrder.status].color)}
                    >
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    #{selectedOrder.id} - {selectedOrder.time}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="px-6 py-5 space-y-3 max-h-72 overflow-auto">
              {selectedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {item.quantity}x {item.name}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-amber-600 mt-0.5">Not: {item.notes}</p>
                    )}
                  </div>
                  <span className="font-medium text-foreground">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Garson: {selectedOrder.waiter}</span>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="text-2xl font-bold text-foreground">${selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => setSelectedOrder(null)}>
                  Kapat
                </Button>
                <Button className="rounded-xl">
                  Durumu Guncelle
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
