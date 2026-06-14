"use client"



import { useState } from "react"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select"

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

import {

  digitsOnly,

  formatTurkishPhoneSuffix,

  parseTurkishPhoneInput,

  toFullTurkishPhone,

  validateRegisterFields,

} from "@/lib/auth-field-validation"



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

    workingHours?: string

    startDate?: string

    status?: "aktif" | "pasif"

    experience?: string

    notes?: string

  }) => Promise<void> | void

  onSwitchToLogin: () => void

}



export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {

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

  const [showPassword, setShowPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [agreeTerms, setAgreeTerms] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const { name, value } = e.target

    if (name === "phone") {

      setFormData({ ...formData, phone: parseTurkishPhoneInput(value) })

      return

    }

    if (name === "taxNumber") {

      setFormData({ ...formData, taxNumber: digitsOnly(value, 11) })

      return

    }

    setFormData({ ...formData, [name]: value })

  }



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()



    const fullPhone = toFullTurkishPhone(formData.phone)



    const validationError = validateRegisterFields({

      email: formData.email,

      phone: fullPhone,

      password: formData.password,

      taxNumber: formData.taxNumber,

      accountType,

    })

    if (validationError) {

      alert(validationError)

      return

    }



    if (formData.password !== formData.confirmPassword) {

      alert("Sifreler eslesmiyor")

      return

    }



    const phoneDigits = fullPhone



    setIsLoading(true)

    try {

      await new Promise((resolve) => setTimeout(resolve, 1000))

      await onRegister({

        accountType,

        shopName: formData.shopName,

        ownerName: `${formData.firstName} ${formData.lastName}`.trim() || formData.ownerName,

        firstName: formData.firstName,

        lastName: formData.lastName,

        taxOffice: formData.taxOffice,

        taxNumber: digitsOnly(formData.taxNumber, 11),

        email: formData.email.trim(),

        phone: phoneDigits,

        password: formData.password,

        experience: formData.experience,

      })

    } finally {

      setIsLoading(false)

    }

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

                      inputMode="numeric"

                      name="taxNumber"

                      placeholder="10 veya 11 haneli"

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

              </>

            )}



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-2">

                <label className="text-sm font-medium text-foreground">

                 E-posta

                </label>

                <div className="relative">

                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                  <Input

                    type="text"

                    name="email"

                    placeholder="e-posta@ornek.com"

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

                <div

                  className={cn(

                    "flex items-center h-12 w-full rounded-xl border border-border bg-muted/50",

                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"

                  )}

                >

                  <Phone className="ml-3 w-5 h-5 shrink-0 text-muted-foreground" />

                  <span className="pl-2 text-foreground tabular-nums select-none">0</span>

                  <input

                    type="tel"

                    inputMode="numeric"

                    name="phone"

                    placeholder="(5xx) xxx xx xx"

                    value={formatTurkishPhoneSuffix(formData.phone)}

                    onChange={handleChange}

                    className="flex-1 min-w-0 h-full bg-transparent px-1 text-foreground outline-none placeholder:text-muted-foreground"

                    required

                  />

                </div>

              </div>

            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-2">

                <label className="text-sm font-medium text-foreground">

                  Şifre

                </label>

                <div className="relative">

                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                  <Input

                    type={showPassword ? "text" : "password"}

                    name="password"

                    placeholder="En az 8 karakter"

                    value={formData.password}

                    onChange={handleChange}

                    minLength={8}

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

                    placeholder="En az 8 karakter"

                    value={formData.confirmPassword}

                    onChange={handleChange}

                    minLength={8}

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

                Kabul ediyorum{" "}

                <Link href="#" className="text-primary hover:underline">

                  Hizmet Şartlarını

                </Link>{" "}

                ve{" "}

                <Link href="#" className="text-primary hover:underline">

                  Gizlilik Politikasını

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

            Zaten hesabın var mı?{" "}

            <button

              onClick={onSwitchToLogin}

              className="text-primary font-medium hover:underline"

            >

              Giriş yap

            </button>

          </p>

        </div>

      </div>

    </div>

  )

}

