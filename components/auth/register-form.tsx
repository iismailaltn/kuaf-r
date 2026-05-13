"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useSalonServices } from "@/hooks/use-salon-services"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  UtensilsCrossed,
  Star,
} from "lucide-react"
import Link from "next/link"

type RegisterAccountType = "personel" | "customer"

interface RegisterFormProps {
  onRegister: (data: {
    accountType: RegisterAccountType
    shopName: string
    ownerName: string
    firstName?: string
    lastName?: string
    taxOffice?: string
    taxNumber?: string
    email: string
    phone: string
    password: string
    specialty?: string[]
    workingHours?: string
    startDate?: string
    status?: "aktif" | "pasif"
    experience?: string
    notes?: string
  }) => Promise<void> | void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const { serviceNames: specialtyOptions } = useSalonServices()
  const [accountType, setAccountType] = useState<RegisterAccountType>("personel")
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    firstName: "",
    lastName: "",
    taxOffice: "",
    taxNumber: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    experience: "",
  })
  const [specialty, setSpecialty] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleSpecialty = (spec: string) => {
    setSpecialty((current) =>
      current.includes(spec)
        ? current.filter((item) => item !== spec)
        : [...current, spec]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Sifreler eslesmiyor")
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onRegister({
      accountType,
      shopName: formData.shopName,
      ownerName: `${formData.firstName} ${formData.lastName}`.trim() || formData.ownerName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      taxOffice: formData.taxOffice,
      taxNumber: formData.taxNumber,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      specialty,
      experience: formData.experience,
    })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Blue gradient background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15),transparent_40%)]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center text-balance">Yolculuğuna Başla</h1>
          <p className="text-lg text-white/80 text-center max-w-md text-pretty">
            Randevu, işçi ve hizmet yönetmek için platformumuzu kullanan binlerce kuaföre katıl.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold">5K+</p>
              <p className="text-sm text-white/70">Kuaför</p>
            </div>
            <div>
              <p className="text-3xl font-bold">1M+</p>
              <p className="text-sm text-white/70">Randevu</p>
            </div>
            <div>
              <p className="text-3xl font-bold">99%</p>
              <p className="text-sm text-white/70">Çalışma süresi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className={cn("w-full", accountType === "personel" ? "max-w-2xl" : "max-w-md")}>
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
              <UtensilsCrossed className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Hesap olustur</h2>
            <p className="text-muted-foreground mt-2">
              Başlamak için kuaförünü kaydet
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button
              type="button"
              variant={accountType === "personel" ? "default" : "outline"}
              className="h-11 rounded-xl"
              onClick={() => setAccountType("personel")}
            >
              Bireysel
            </Button>
            <Button
              type="button"
              variant={accountType === "customer" ? "default" : "outline"}
              className="h-11 rounded-xl"
              onClick={() => setAccountType("customer")}
            >
              Kurumsal
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {accountType === "customer" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    İşletme adı
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      name="shopName"
                      placeholder="İşletme adını gir"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      İşletme sahibi adı
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        name="firstName"
                        placeholder="Ad"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      İşletme sahibi soyadı
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        name="lastName"
                        placeholder="Soyad"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Vergi dairesi
                    </label>
                    <Input
                      type="text"
                      name="taxOffice"
                      placeholder="Vergi dairesi"
                      value={formData.taxOffice}
                      onChange={handleChange}
                      className="h-12 rounded-xl bg-muted/50 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Vergi numarası
                    </label>
                    <Input
                      type="text"
                      name="taxNumber"
                      placeholder="Vergi numarası"
                      value={formData.taxNumber}
                      onChange={handleChange}
                      className="h-12 rounded-xl bg-muted/50 border-border"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Ad
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        name="firstName"
                        placeholder="Ornek: Ahmet"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Soyad
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        name="lastName"
                        placeholder="Ornek: Yilmaz"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Deneyim
                  </label>
                  <div className="relative max-w-40">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-muted-foreground" />
                    <Select
                      value={formData.experience}
                      onValueChange={(value) => setFormData({ ...formData, experience: value })}
                    >
                      <SelectTrigger className="pl-10 h-12 rounded-xl bg-muted/50 border-border">
                        <SelectValue placeholder="Yıl" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, index) => (
                          <SelectItem key={index} value={String(index)}>
                            {index} yıl
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Uzmanlık Alanları
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {specialtyOptions.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialty(spec)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          specialty.includes(spec)
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Kullanici adi veya e-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    name="email"
                    placeholder="admin veya eposta@ornek.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="+90 555 555 55 55"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Sifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Sifre olustur"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tekrar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Sifreyi tekrar gir"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {" "}
                kabul ediyorum{" "}
                <Link href="#" className="text-primary hover:underline">
                  Hizmet Sartlarini
                </Link>{" "}
                ve{" "}
                <Link href="#" className="text-primary hover:underline">
                  Gizlilik Politikasini
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium"
              disabled={isLoading || !agreeTerms}
            >
              {isLoading ? "Hesap olusturuluyor..." : "Hesap olustur"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Zaten hesabin var mi?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-primary font-medium hover:underline"
            >
              Giris yap
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
