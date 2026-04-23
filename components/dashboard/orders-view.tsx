"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Edit3,
  Trash2,
  Receipt,
  MapPin,
  User,
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.waiter.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

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
              className="group p-5 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.bgColor)}>
                  <Icon className={cn("w-5 h-5", card.textColor)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium",
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
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Siparis veya masa ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-muted/50 border-0 rounded-xl"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredOrders.length} siparis</span>
          </div>

          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 rounded-xl border-border">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Durum" />
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
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Sirala
            </Button>
          </div>
        </div>

        {filterStatus !== "all" && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className="gap-1 rounded-lg">
              {statusConfig[filterStatus as keyof typeof statusConfig]?.label || filterStatus}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStatus("all")} />
            </Badge>
            <button 
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setFilterStatus("all")}
            >
              Filtreyi temizle
            </button>
            <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
              <span>1 / 1</span>
              <button className="p-1 hover:bg-muted rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-muted rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox />
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Siparis
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Masa
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Urunler
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Toplam
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Garson
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Saat
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                Durum
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon
              return (
                <TableRow 
                  key={order.id} 
                  className={cn(
                    "group",
                    order.priority === "high" && "bg-amber-50/50"
                  )}
                >
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        order.priority === "high" ? "bg-amber-500/10" : "bg-muted"
                      )}>
                        <Receipt className={cn(
                          "w-5 h-5",
                          order.priority === "high" ? "text-amber-600" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{order.id}</p>
                          {order.priority === "high" && (
                            <span className="flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} urun
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{order.table}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48">
                      <p className="text-sm text-foreground truncate">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                      </p>
                      {order.items.some(i => i.notes) && (
                        <p className="text-xs text-amber-600 truncate">
                          Not: {order.items.find(i => i.notes)?.notes}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-semibold text-foreground">
                      ${order.total.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">{order.waiter}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm">{order.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("rounded-lg font-normal gap-1", statusConfig[order.status].color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[order.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="relative overflow-visible">
                    <div className="relative flex justify-end" ref={openMenuId === order.id ? menuRef : null}>
                      <button
                        className="p-1.5 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                          setOpenMenuId((prev) => (prev === order.id ? null : order.id))
                          setMenuPosition({ top: rect.bottom + 6, left: rect.right - 144 })
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Siparis bulunamadi</p>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {openMenuId && menuPosition && (
        <div
          ref={menuRef}
          className="fixed w-36 rounded-xl border border-border bg-popover shadow-xl z-[100] p-1.5 animate-in fade-in-0 zoom-in-95"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            onClick={() => {
              const order = orders.find(o => o.id === openMenuId)
              if (order) setSelectedOrder(order)
              setOpenMenuId(null)
            }}
          >
            <Eye className="w-3.5 h-3.5" />
            Detay Gor
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            onClick={() => setOpenMenuId(null)}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Duzenle
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => setOpenMenuId(null)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Iptal Et
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className={cn(
              "px-6 py-5 border-b border-border",
              selectedOrder.priority === "high" ? "bg-gradient-to-r from-amber-500/10 to-transparent" : "bg-gradient-to-r from-primary/5 to-transparent"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedOrder.priority === "high" ? "bg-amber-500/10" : "bg-primary/10"
                  )}>
                    <Receipt className={cn(
                      "w-5 h-5",
                      selectedOrder.priority === "high" ? "text-amber-600" : "text-primary"
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-foreground">{selectedOrder.table}</h2>
                      <Badge
                        variant="outline"
                        className={cn("rounded-lg gap-1", statusConfig[selectedOrder.status].color)}
                      >
                        {statusConfig[selectedOrder.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      #{selectedOrder.id} - {selectedOrder.time}
                    </p>
                  </div>
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
