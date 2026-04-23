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
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  User,
  Edit3,
  Trash2,
  X,
  UserCheck,
  UserX,
  Users,
  Crown,
} from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  role: "admin" | "supervisor" | "user"
  status: "aktif" | "pasif"
  joinedDate: string
  avatar?: string
}

const initialUsers: UserData[] = [
  {
    id: "USR001",
    name: "Ahmet Yilmaz",
    email: "ahmet@restaurant.com",
    phone: "+90 555 123 4567",
    role: "admin",
    status: "aktif",
    joinedDate: "2024-01-15",
  },
  {
    id: "USR002",
    name: "Ayse Kaya",
    email: "ayse@restaurant.com",
    phone: "+90 555 234 5678",
    role: "supervisor",
    status: "aktif",
    joinedDate: "2024-02-20",
  },
  {
    id: "USR003",
    name: "Mehmet Demir",
    email: "mehmet@restaurant.com",
    phone: "+90 555 345 6789",
    role: "user",
    status: "aktif",
    joinedDate: "2024-03-10",
  },
  {
    id: "USR004",
    name: "Fatma Celik",
    email: "fatma@restaurant.com",
    phone: "+90 555 456 7890",
    role: "user",
    status: "pasif",
    joinedDate: "2024-03-25",
  },
  {
    id: "USR005",
    name: "Ali Ozturk",
    email: "ali@restaurant.com",
    phone: "+90 555 567 8901",
    role: "user",
    status: "aktif",
    joinedDate: "2024-04-05",
  },
]

const roleConfig = {
  admin: {
    label: "Admin",
    icon: Crown,
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  supervisor: {
    label: "Supervisor",
    icon: ShieldCheck,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  user: {
    label: "Kullanici",
    icon: User,
    color: "bg-slate-500/10 text-slate-600 border-slate-200",
  },
}

const statusConfig = {
  aktif: {
    label: "Aktif",
    icon: UserCheck,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  pasif: {
    label: "Pasif",
    icon: UserX,
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
}

export function UsersView() {
  const [users, setUsers] = useState<UserData[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as "admin" | "supervisor" | "user",
    status: "aktif" as "aktif" | "pasif",
  })

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "aktif").length,
    admins: users.filter((u) => u.role === "admin").length,
    supervisors: users.filter((u) => u.role === "supervisor").length,
  }

  const handleAddUser = () => {
    if (!formData.name || !formData.email) {
      alert("Lutfen zorunlu alanlari doldurun.")
      return
    }
    const newUser: UserData = {
      id: `USR${String(users.length + 1).padStart(3, "0")}`,
      ...formData,
      joinedDate: new Date().toISOString().split("T")[0],
    }
    setUsers([...users, newUser])
    setFormData({ name: "", email: "", phone: "", role: "user", status: "aktif" })
    setShowAddModal(false)
  }

  const handleEditUser = () => {
    if (!editingUser || !formData.name || !formData.email) {
      alert("Lutfen zorunlu alanlari doldurun.")
      return
    }
    setUsers(
      users.map((u) =>
        u.id === editingUser.id
          ? { ...u, ...formData }
          : u
      )
    )
    setEditingUser(null)
    setFormData({ name: "", email: "", phone: "", role: "user", status: "aktif" })
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Bu kullaniciyi silmek istediginizden emin misiniz?")) {
      setUsers(users.filter((u) => u.id !== userId))
    }
    setOpenMenuId(null)
  }

  const openEditModal = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    })
    setOpenMenuId(null)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Kullanicilar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem kullanicilarini yonetin ve izinleri duzenleyin
          </p>
        </div>
        <Button className="rounded-xl gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Kullanici Ekle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Toplam Kullanici</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Aktif Kullanici</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.supervisors}</p>
              <p className="text-xs text-muted-foreground">Supervisor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Kullanici ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/50 border-0"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Rol filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Roller</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="user">Kullanici</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const RoleIcon = roleConfig[user.role].icon
          const StatusIcon = statusConfig[user.status].icon

          return (
            <div
              key={user.id}
              className="group relative p-5 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Menu Button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
                {openMenuId === user.id && (
                  <div className="absolute top-8 right-0 w-36 rounded-xl border border-border bg-popover shadow-xl z-50 p-1.5 animate-in fade-in-0 zoom-in-95">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      onClick={() => openEditModal(user)}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Duzenle
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar & Info */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-semibold text-primary">
                    {getInitials(user.name)}
                  </div>
                  <div
                    className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
                      user.status === "aktif" ? "bg-emerald-500" : "bg-slate-400"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 rounded-lg font-normal", roleConfig[user.role].color)}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig[user.role].label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 rounded-lg font-normal", statusConfig[user.status].color)}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[user.status].label}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(user.joinedDate).toLocaleDateString("tr-TR")}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Kullanici bulunamadi</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {editingUser ? "Kullanici Duzenle" : "Yeni Kullanici"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {editingUser ? "Kullanici bilgilerini guncelleyin" : "Sisteme yeni kullanici ekleyin"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUser(null)
                    setFormData({ name: "", email: "", phone: "", role: "user", status: "aktif" })
                  }}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Ad Soyad *</label>
                <Input
                  placeholder="Ornek: Ahmet Yilmaz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">E-posta *</label>
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Telefon</label>
                  <Input
                    placeholder="+90 555 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Rol</label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "supervisor" | "user") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="user">Kullanici</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Durum</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "aktif" | "pasif") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="pasif">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setShowAddModal(false)
                  setEditingUser(null)
                  setFormData({ name: "", email: "", phone: "", role: "user", status: "aktif" })
                }}
              >
                Vazgec
              </Button>
              <Button
                className="rounded-xl"
                onClick={editingUser ? handleEditUser : handleAddUser}
              >
                {editingUser ? "Guncelle" : "Kullanici Ekle"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
