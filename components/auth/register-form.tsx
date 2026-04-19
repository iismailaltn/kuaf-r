"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  UtensilsCrossed,
} from "lucide-react"
import Link from "next/link"

interface RegisterFormProps {
  onRegister: (data: {
    restaurantName: string
    ownerName: string
    email: string
    phone: string
    password: string
  }) => Promise<void> | void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
      restaurantName: formData.restaurantName,
      ownerName: formData.ownerName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
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
          <h1 className="text-4xl font-bold mb-4 text-center text-balance">Yolculuguna Basla</h1>
          <p className="text-lg text-white/80 text-center max-w-md text-pretty">
            Siparis, masa ve stogu yonetmek icin platformumuzu kullanan binlerce restorana katil.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold">5K+</p>
              <p className="text-sm text-white/70">Restoran</p>
            </div>
            <div>
              <p className="text-3xl font-bold">1M+</p>
              <p className="text-sm text-white/70">Siparis</p>
            </div>
            <div>
              <p className="text-3xl font-bold">99%</p>
              <p className="text-sm text-white/70">Calisma suresi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
              <UtensilsCrossed className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Hesap olustur</h2>
            <p className="text-muted-foreground mt-2">
              Baslamak icin restoranini kaydet
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Restoran adi
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  name="restaurantName"
                  placeholder="Restoran adin"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Isletme sahibi
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  name="ownerName"
                  placeholder="Ad soyad"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-border"
                  required
                />
              </div>
            </div>

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
