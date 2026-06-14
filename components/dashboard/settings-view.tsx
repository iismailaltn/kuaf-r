"use client"

import { apiFetch } from "@/lib/api-fetch"
import { useEffect, useState } from "react"
import { useGooglePlaceSettings } from "@/hooks/use-google-place-settings"
import { useInstagramSettings } from "@/hooks/use-instagram-settings"
import { normalizeAccessToken } from "@/lib/instagram-token"
import { useSalonServices } from "@/hooks/use-salon-services"
import { useServiceStages } from "@/hooks/use-service-stages"
import { ServiceStagesEditor } from "@/components/dashboard/service-stages-editor"
import { SalonServiceSettingsCatalog } from "@/components/dashboard/salon-service-operation-cards"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SalonServiceStage } from "@/lib/salon-service-stages"
import {
  User,
  Lock,
  Key,
  Bell,
  Palette,
  Globe,
  Camera,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Save,
  ChevronRight,
  Shield,
  Smartphone,
  Mail,
  Building2,
  Phone,
  MapPin,
  Scissors,
  CreditCard,
  Instagram,
  MessageCircle,
} from "lucide-react"
import { CorporateBillingTab } from "@/components/dashboard/corporate-billing-tab"
import { cn } from "@/lib/utils"

interface SettingsViewProps {
  user?: {
    id?: string
    email: string
    shopName: string
    role: string
    businessUserId?: string
    accountType?: string
  }
}

type SettingsTab = "profile" | "security" | "google" | "instagram" | "whatsapp" | "notifications" | "appearance" | "business" | "billing"

export function SettingsView({ user }: SettingsViewProps) {
  const { services, reload: reloadServices } = useSalonServices(user?.businessUserId)
  const { getStagesForService, saveStagesForService } = useServiceStages(user?.businessUserId, services)
  const [stagesEditorServiceId, setStagesEditorServiceId] = useState<string | null>(null)
  const [draftStages, setDraftStages] = useState<SalonServiceStage[]>([])
  const [isSavingStages, setIsSavingStages] = useState(false)
  const [stagesSaveError, setStagesSaveError] = useState<string | null>(null)
  const { settings: googleSettings, isSaving: isGoogleSaving, saveSettings: saveGoogleSettings } = useGooglePlaceSettings(user?.businessUserId)
  const {
    settings: instagramSettings,
    isSaving: isInstagramSaving,
    saveSettings: saveInstagramSettings,
    disconnectSettings: disconnectInstagramSettings,
  } = useInstagramSettings(user?.businessUserId)
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    companyName: user?.shopName || "",
    address: "",
    profileImage: null as string | null
  })
  const [profileSaved, setProfileSaved] = useState(false)

  // Security state
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Google API state
  const [googleData, setGoogleData] = useState({
    apiKey: "",
    placeId: ""
  })
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleSaved, setGoogleSaved] = useState(false)
  const [googleError, setGoogleError] = useState("")

  // Instagram API state
  const [instagramData, setInstagramData] = useState({
    instagramUserId: "",
    instagramUsername: "",
    facebookPageId: "",
    accessToken: "",
    tokenExpiresAt: "",
    scopes: "",
    isActive: true,
  })
  const [instagramConnected, setInstagramConnected] = useState(false)
  const [instagramSaved, setInstagramSaved] = useState(false)
  const [instagramError, setInstagramError] = useState("")
  const [showInstagramToken, setShowInstagramToken] = useState(false)

  // WhatsApp Business API state
  const [whatsappData, setWhatsappData] = useState({
    phoneNumber: "",
    phoneNumberId: "",
    whatsappBusinessAccountId: "",
    accessToken: "",
    isActive: true,
  })
  const [whatsappConnected, setWhatsappConnected] = useState(false)
  const [whatsappSaved, setWhatsappSaved] = useState(false)
  const [whatsappError, setWhatsappError] = useState("")
  const [showWhatsappToken, setShowWhatsappToken] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newReservation: true,
    reservationReminder: true,
    newReview: true,
    weeklyReport: false
  })

  // Appearance state
  const [appearance, setAppearance] = useState({
    theme: "system" as "light" | "dark" | "system",
    language: "tr"
  })

  const allServices = services.map((service) => ({
    id: String(service.id),
    label: service.name,
    category: service.category,
    durationMinutes: service.durationMinutes,
  }))
  // "idle" = not selected | "editing" = selected, price input open | "saved" = price confirmed (green)
  const [serviceStates, setServiceStates] = useState<Record<string, "idle" | "editing" | "saved">>({})
  const [servicePrices, setServicePrices] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!googleSettings) {
      return
    }

    setGoogleData({
      apiKey: googleSettings.placesApiKey,
      placeId: googleSettings.placeId,
    })
    setGoogleConnected(true)
  }, [googleSettings])

  useEffect(() => {
    if (!instagramSettings) {
      return
    }

    setInstagramData({
      instagramUserId: instagramSettings.instagramUserId,
      instagramUsername: instagramSettings.instagramUsername,
      facebookPageId: instagramSettings.facebookPageId,
      accessToken: instagramSettings.accessToken,
      tokenExpiresAt: instagramSettings.tokenExpiresAt
        ? instagramSettings.tokenExpiresAt.slice(0, 16)
        : "",
      scopes: instagramSettings.scopes,
      isActive: instagramSettings.isActive,
    })
    setInstagramConnected(instagramSettings.isConnected)
  }, [instagramSettings])

  useEffect(() => {
    const userId = user?.id?.trim()
    if (!userId) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const res = await apiFetch(
          `/api/user-profile?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" },
        )
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean
          profile?: {
            firstName?: string
            lastName?: string
            phone?: string
            email?: string
            companyName?: string
          }
        } | null
        if (cancelled || !res.ok || !json?.ok || !json.profile) {
          return
        }

        const profile = json.profile
        setProfileData((prev) => ({
          ...prev,
          firstName: String(profile.firstName ?? "").trim() || prev.firstName,
          lastName: String(profile.lastName ?? "").trim() || prev.lastName,
          phone: String(profile.phone ?? "").trim() || prev.phone,
          email: String(profile.email ?? "").trim() || user?.email || prev.email,
          companyName:
            String(profile.companyName ?? "").trim() ||
            user?.shopName?.trim() ||
            prev.companyName,
        }))
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, user?.email, user?.shopName])

  useEffect(() => {
    if (!services.length) {
      return
    }

    const nextStates: Record<string, "idle" | "editing" | "saved"> = {}
    const nextPrices: Record<string, string> = {}

    services.forEach((service) => {
      const serviceId = String(service.id)

      if (!service.isActive) {
        nextStates[serviceId] = "idle"
        return
      }

      if (service.price > 0) {
        nextStates[serviceId] = "saved"
        nextPrices[serviceId] = String(service.price)
        return
      }

      nextStates[serviceId] = "editing"
    })

    setServiceStates(nextStates)
    setServicePrices(nextPrices)
  }, [services])
  // derived helper
  const selectedServices = Object.entries(serviceStates)
    .filter(([, s]) => s !== "idle")
    .map(([id]) => id)

  const handleServiceCardClick = (id: string) => {
    setServiceStates(prev => {
      const current = prev[id] ?? "idle"
      if (current === "idle") return { ...prev, [id]: "editing" }
      if (current === "saved") return { ...prev, [id]: "editing" }
      // editing -> clicking card again does nothing (use buttons inside)
      return prev
    })
  }

  const handleServiceSave = async (id: string) => {
    const service = services.find((item) => String(item.id) === id)
    if (!service) {
      return
    }

    const price = Number(servicePrices[id] ?? 0)
    const res = await apiFetch(`/api/salon-services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessUserId: user?.businessUserId, price, isActive: true }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) {
      return
    }

    setServiceStates((prev) => ({ ...prev, [id]: "saved" }))
  }

  const handleServiceRemove = async (id: string) => {
    const service = services.find((item) => String(item.id) === id)
    if (!service) {
      return
    }

    const res = await apiFetch(`/api/salon-services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessUserId: user?.businessUserId, price: 0, isActive: false }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok) {
      return
    }

    setServiceStates((prev) => ({ ...prev, [id]: "idle" }))
    setServicePrices((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const updateServicePrice = (id: string, price: string) => {
    setServicePrices(prev => ({ ...prev, [id]: price }))
  }

  const isCorporate = user?.accountType === "kurumsal"
  const isBireysel = user?.accountType === "bireysel"

  const tabs = [
    { id: "profile" as SettingsTab, label: "Profil", icon: User, description: "Kisisel bilgilerinizi duzenleyin" },
    ...(isCorporate
      ? [{ id: "billing" as SettingsTab, label: "Ödeme ve Hesap", icon: CreditCard, description: "Üyelik paketi ve ödeme yönetimi" }]
      : []),
    ...(!isBireysel
      ? [{ id: "business" as SettingsTab, label: "Isletme Ayarlari", icon: Scissors, description: "Sunulan hizmetleri yonetin" }]
      : []),
    { id: "security" as SettingsTab, label: "Sifre ve Guvenlik", icon: Lock, description: "Hesap guvenliginizi yonetin" },
    ...(!isBireysel
      ? [{ id: "google" as SettingsTab, label: "Google Ayarlari", icon: Key, description: "Google API baglantinizi yonetin" }]
      : []),
    ...(!isBireysel
      ? [{ id: "instagram" as SettingsTab, label: "Instagram Ayarlari", icon: Instagram, description: "Instagram API baglantinizi yonetin" }]
      : []),
    ...(!isBireysel
      ? [{ id: "whatsapp" as SettingsTab, label: "WhatsApp Ayarlari", icon: MessageCircle, description: "WhatsApp Business API baglantinizi yonetin" }]
      : []),
    { id: "notifications" as SettingsTab, label: "Bildirimler", icon: Bell, description: "Bildirim tercihlerinizi ayarlayin" },
    { id: "appearance" as SettingsTab, label: "Gorunum", icon: Palette, description: "Tema ve dil ayarlari" },
  ]

  useEffect(() => {
    if (isBireysel && (activeTab === "business" || activeTab === "google" || activeTab === "instagram" || activeTab === "whatsapp" || activeTab === "billing")) {
      setActiveTab("profile")
    }
  }, [isBireysel, activeTab])

  const handleProfileSave = () => {
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handlePasswordChange = () => {
    setPasswordError("")
    setPasswordSuccess(false)

    if (securityData.currentPassword.length < 1) {
      setPasswordError("Mevcut sifrenizi girin")
      return
    }
    if (securityData.newPassword.length < 8) {
      setPasswordError("Yeni sifre en az 8 karakter olmali")
      return
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      setPasswordError("Sifreler eslesmiyor")
      return
    }

    setPasswordSuccess(true)
    setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  const handleGoogleSave = async () => {
    if (!googleData.apiKey || !googleData.placeId) {
      return
    }

    const result = await saveGoogleSettings(googleData.apiKey, googleData.placeId)
    if (!result.ok) {
      setGoogleError(result.message)
      return
    }

    setGoogleError("")
    setGoogleConnected(true)
    setGoogleSaved(true)
    setTimeout(() => setGoogleSaved(false), 3000)
  }

  const handleGoogleDisconnect = () => {
    setGoogleConnected(false)
    setGoogleData({ apiKey: "", placeId: "" })
    setGoogleError("")
  }

  const handleInstagramSave = async () => {
    const accessToken =
      normalizeAccessToken(instagramData.accessToken) ||
      normalizeAccessToken(instagramSettings?.accessToken)

    if (!instagramData.instagramUserId || !accessToken) {
      setInstagramError("Instagram User ID ve Access Token zorunlu.")
      return
    }

    const result = await saveInstagramSettings({
      instagramUserId: instagramData.instagramUserId,
      instagramUsername: instagramData.instagramUsername,
      facebookPageId: instagramData.facebookPageId || undefined,
      accessToken,
      tokenExpiresAt: instagramData.tokenExpiresAt || undefined,
      scopes: instagramData.scopes || undefined,
      isActive: instagramData.isActive,
    })
    if (!result.ok) {
      setInstagramError(result.message)
      return
    }

    setInstagramError("")
    setInstagramConnected(true)
    setInstagramSaved(true)
    setTimeout(() => setInstagramSaved(false), 3000)
  }

  const handleInstagramDisconnect = async () => {
    const result = await disconnectInstagramSettings()
    if (!result.ok) {
      setInstagramError(result.message)
      return
    }

    setInstagramConnected(false)
    setInstagramData({
      instagramUserId: "",
      instagramUsername: "",
      facebookPageId: "",
      accessToken: "",
      tokenExpiresAt: "",
      scopes: "",
      isActive: true,
    })
    setInstagramError("")
  }

  const handleWhatsappSave = () => {
    setWhatsappError("")
    setWhatsappConnected(true)
    setWhatsappSaved(true)
    setTimeout(() => setWhatsappSaved(false), 3000)
  }

  const handleWhatsappDisconnect = () => {
    setWhatsappConnected(false)
    setWhatsappData({
      phoneNumber: "",
      phoneNumberId: "",
      whatsappBusinessAccountId: "",
      accessToken: "",
      isActive: true,
    })
    setWhatsappError("")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, profileImage: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const renderBusinessTab = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">Isletme Ayarlari</h3>
        <p className="text-xs text-muted-foreground">
          Hizmete tiklayin, fiyati girin ve kaydedin. Kaydettikten sonra asamalari tanimlayarak randevu planlamasini yapin.
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-foreground mb-3">
          Yapilacak Islemler
          <span className="ml-2 font-normal text-muted-foreground">
            ({selectedServices.length}/{allServices.length} secildi · {services.length} hizmet listelendi)
          </span>
        </h4>
        <SalonServiceSettingsCatalog
          services={allServices}
          serviceStates={serviceStates}
          servicePrices={servicePrices}
          onCardClick={handleServiceCardClick}
          onPriceChange={updateServicePrice}
          onSave={handleServiceSave}
          onRemove={handleServiceRemove}
          onEditStages={(serviceId) => {
            const svc = services.find((item) => String(item.id) === serviceId)
            if (!svc) return
            setStagesEditorServiceId(serviceId)
            setDraftStages(getStagesForService(svc))
          }}
        />
      </div>

      <Dialog
        open={!!stagesEditorServiceId}
        onOpenChange={(open) => {
          if (!open) {
            setStagesEditorServiceId(null)
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Hizmet asamalari
              {stagesEditorServiceId
                ? ` · ${services.find((s) => String(s.id) === stagesEditorServiceId)?.name ?? ""}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          {stagesEditorServiceId ? (
            <ServiceStagesEditor
              serviceName={services.find((s) => String(s.id) === stagesEditorServiceId)?.name ?? ""}
              durationMinutes={
                services.find((s) => String(s.id) === stagesEditorServiceId)?.durationMinutes ?? 30
              }
              stages={draftStages}
              onChange={setDraftStages}
            />
          ) : null}
          {stagesSaveError ? (
            <p className="text-xs text-destructive">{stagesSaveError}</p>
          ) : null}
          <button
            type="button"
            disabled={isSavingStages}
            onClick={() => {
              void (async () => {
                if (!stagesEditorServiceId) return
                const svc = services.find((item) => String(item.id) === stagesEditorServiceId)
                setIsSavingStages(true)
                setStagesSaveError(null)
                const result = await saveStagesForService(Number(stagesEditorServiceId), draftStages, svc)
                setIsSavingStages(false)
                if (!result.ok) {
                  setStagesSaveError(result.message)
                  return
                }
                setStagesEditorServiceId(null)
                reloadServices()
              })()
            }}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSavingStages ? "Kaydediliyor..." : "Asamalari kaydet (veritabani)"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  )

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Profil Bilgileri</h3>
        <p className="text-sm text-muted-foreground">
          {isBireysel ? "Kisisel bilgilerinizi guncelleyin" : "Kisisel ve isletme bilgilerinizi guncelleyin"}
        </p>
      </div>

      {/* Profile Image */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
            {profileData.profileImage ? (
              <img src={profileData.profileImage} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
            <Camera className="w-4 h-4 text-primary-foreground" />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Profil Fotografi</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG veya GIF. Maksimum 2MB.</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Ad</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Adiniz"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Soyad</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Soyadiniz"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">E-posta</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="ornek@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Telefon</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="+90 555 123 4567"
            />
          </div>
        </div>

        {!isBireysel && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">Sirket / Isletme Adi</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={profileData.companyName}
                onChange={(e) => setProfileData(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Isletme adiniz"
              />
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1.5">Adres</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={profileData.address}
              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Adresiniz"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={handleProfileSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          Degisiklikleri Kaydet
        </button>
        {profileSaved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <Check className="w-4 h-4" />
            Kaydedildi
          </span>
        )}
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-8">
      {/* Password Change */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Sifre Degistir</h3>
          <p className="text-sm text-muted-foreground">Hesabinizin guvenligini artirmak icin guclu bir sifre kullanin</p>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Mevcut Sifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Mevcut sifreniz"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Yeni Sifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={securityData.newPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="En az 8 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Yeni Sifre (Tekrar)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={securityData.confirmPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Sifreyi tekrar girin"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" />
              Sifreniz basariyla guncellendi
            </div>
          )}

          <button
            onClick={handlePasswordChange}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Shield className="w-4 h-4" />
            Sifreyi Guncelle
          </button>
        </div>
      </div>

      {/* Two Factor Authentication */}
      <div className="pt-6 border-t border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Iki Faktorlu Dogrulama</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Hesabiniza giris yaparken ek bir guvenlik katmani ekleyin. SMS veya authenticator uygulamasi kullanabilirsiniz.
            </p>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              twoFactorEnabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                twoFactorEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
        {twoFactorEnabled && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Iki faktorlu dogrulama aktif</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              Hesabiniz ek guvenlik ile korunuyor.
            </p>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="pt-6 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Aktif Oturumlar</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Bu Cihaz</p>
                <p className="text-xs text-muted-foreground">Istanbul, Turkiye - Simdi aktif</p>
              </div>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Aktif</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderGoogleTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Google API Ayarlari</h3>
        <p className="text-sm text-muted-foreground">Google Places API baglantinizi yonetin ve yorumlari alin</p>
      </div>

      {/* Connection Status */}
      <div className={cn(
        "p-4 rounded-lg border",
        googleConnected
          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            googleConnected ? "bg-green-100 dark:bg-green-800" : "bg-amber-100 dark:bg-amber-800"
          )}>
            {googleConnected ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <p className={cn(
              "font-medium",
              googleConnected ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
            )}>
              {googleConnected ? "Google API Bagli" : "Google API Bagli Degil"}
            </p>
            <p className={cn(
              "text-sm",
              googleConnected ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"
            )}>
              {googleConnected
                ? "Yorumlariniz otomatik olarak cekiliyor"
                : "Yorumlari almak icin API bilgilerinizi girin"}
            </p>
          </div>
        </div>
      </div>

      {googleError && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg max-w-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{googleError}</p>
        </div>
      )}

      {/* API Form */}
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Google Places API Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={googleData.apiKey}
              onChange={(e) => setGoogleData(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
              placeholder="AIzaSy..."
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Google Cloud Console&apos;dan aldiginiz API anahtari</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Place ID</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={googleData.placeId}
              onChange={(e) => setGoogleData(prev => ({ ...prev, placeId: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
              placeholder="ChIJ..."
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Isletmenizin Google Place ID&apos;si</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => void handleGoogleSave()}
            disabled={!googleData.apiKey || !googleData.placeId || isGoogleSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {googleConnected ? "Guncelle" : "Baglan"}
          </button>
          {googleConnected && (
            <button
              onClick={handleGoogleDisconnect}
              className="px-5 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
            >
              Baglantıyı Kes
            </button>
          )}
          {googleSaved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="w-4 h-4" />
              Kaydedildi
            </span>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">API Anahtari Nasil Alinir?</h4>
        <div className="space-y-2">
          {[
            "Google Cloud Console'a gidin (console.cloud.google.com)",
            "Yeni bir proje olusturun veya mevcut projeyi secin",
            "APIs & Services > Library'ye gidin",
            "Places API'yi arayın ve etkinlestirin",
            "APIs & Services > Credentials'a gidin",
            "Create Credentials > API Key secin",
            "Place ID'nizi Google Maps'te isletmenizi arayarak bulabilirsiniz"
          ].map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderInstagramTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Instagram API Ayarlari</h3>
        <p className="text-sm text-muted-foreground">Instagram isletme hesabinizi baglayin ve paylasimlari yonetin</p>
      </div>

      <div className={cn(
        "p-4 rounded-lg border",
        instagramConnected
          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            instagramConnected ? "bg-green-100 dark:bg-green-800" : "bg-amber-100 dark:bg-amber-800"
          )}>
            {instagramConnected ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <p className={cn(
              "font-medium",
              instagramConnected ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
            )}>
              {instagramConnected ? "Instagram Bagli" : "Instagram Bagli Degil"}
            </p>
            <p className={cn(
              "text-sm",
              instagramConnected ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"
            )}>
              {instagramConnected
                ? instagramData.instagramUsername
                  ? `@${instagramData.instagramUsername.replace(/^@/, "")} hesabi bagli`
                  : "Instagram hesabiniz bagli"
                : "Paylasim yapmak icin API bilgilerinizi girin"}
            </p>
          </div>
        </div>
      </div>

      {instagramError && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg max-w-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{instagramError}</p>
        </div>
      )}

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Instagram User ID</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={instagramData.instagramUserId}
              onChange={(e) => setInstagramData(prev => ({ ...prev, instagramUserId: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
              placeholder="178414..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Instagram Kullanici Adi</label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={instagramData.instagramUsername}
              onChange={(e) => setInstagramData(prev => ({ ...prev, instagramUsername: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="salonadi"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Facebook Page ID (opsiyonel)</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={instagramData.facebookPageId}
              onChange={(e) => setInstagramData(prev => ({ ...prev, facebookPageId: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
              placeholder="1234567890"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Token alirken veya IG User ID bulurken gerekebilir; paylasim icin zorunlu degil</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Access Token</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showInstagramToken ? "text" : "password"}
              value={instagramData.accessToken}
              onChange={(e) => setInstagramData(prev => ({ ...prev, accessToken: e.target.value }))}
              onBlur={(e) =>
                setInstagramData((prev) => ({
                  ...prev,
                  accessToken: normalizeAccessToken(e.target.value),
                }))
              }
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text")
                if (!pasted.trim()) {
                  return
                }
                e.preventDefault()
                setInstagramData((prev) => ({
                  ...prev,
                  accessToken: normalizeAccessToken(pasted),
                }))
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
              placeholder="EAA..."
            />
            <button
              type="button"
              onClick={() => setShowInstagramToken(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showInstagramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Meta Graph Explorer&apos;dan alinan User veya Page token (EAA... ile baslar). &quot;OAuth&quot; on eki olmadan yapistirin.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Token Bitis Tarihi</label>
          <input
            type="datetime-local"
            value={instagramData.tokenExpiresAt}
            onChange={(e) => setInstagramData(prev => ({ ...prev, tokenExpiresAt: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Scopes</label>
          <input
            type="text"
            value={instagramData.scopes}
            onChange={(e) => setInstagramData(prev => ({ ...prev, scopes: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="instagram_basic,instagram_content_publish"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Aktif</p>
            <p className="text-xs text-muted-foreground">Instagram paylasimlari icin baglantiyi kullan</p>
          </div>
          <button
            type="button"
            onClick={() => setInstagramData(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              instagramData.isActive ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                instagramData.isActive ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => void handleInstagramSave()}
            disabled={
              !instagramData.instagramUserId ||
              (!instagramData.accessToken && !instagramSettings?.accessToken) ||
              isInstagramSaving
            }
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {instagramConnected ? "Guncelle" : "Baglan"}
          </button>
          {instagramConnected && (
            <button
              onClick={() => void handleInstagramDisconnect()}
              disabled={isInstagramSaving}
              className="px-5 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              Baglantiyi Kes
            </button>
          )}
          {instagramSaved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="w-4 h-4" />
              Kaydedildi
            </span>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Instagram API Bilgileri Nasil Alinir?</h4>
        <div className="space-y-2">
          {[
            "Meta for Developers'a gidin (developers.facebook.com)",
            "Uygulama olusturun ve Instagram Graph API urununu ekleyin",
            "Facebook sayfanizi Instagram isletme hesabina baglayin",
            "Gerekli izinleri (scopes) talep edin ve access token alin",
            "Instagram User ID ve Facebook Page ID bilgilerini kaydedin",
          ].map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderWhatsappTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">WhatsApp Business API Ayarlari</h3>
        <p className="text-sm text-muted-foreground">WhatsApp Business hesabinizi baglayin ve mesajlari yonetin</p>
      </div>

      <div className={cn(
        "p-4 rounded-lg border",
        whatsappConnected
          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            whatsappConnected ? "bg-green-100 dark:bg-green-800" : "bg-amber-100 dark:bg-amber-800"
          )}>
            {whatsappConnected ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <p className={cn(
              "font-medium",
              whatsappConnected ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
            )}>
              {whatsappConnected ? "WhatsApp Bagli" : "WhatsApp Bagli Degil"}
            </p>
            <p className={cn(
              "text-sm",
              whatsappConnected ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"
            )}>
              {whatsappConnected
                ? whatsappData.phoneNumber
                  ? `${whatsappData.phoneNumber} numarasi bagli`
                  : "WhatsApp Business hesabiniz bagli"
                : "Mesaj göndermek icin API bilgilerinizi girin"}
            </p>
          </div>
        </div>
      </div>

      {whatsappError && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg max-w-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{whatsappError}</p>
        </div>
      )}

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Telefon Numarasi</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={whatsappData.phoneNumber}
              onChange={(e) => setWhatsappData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="+90 555 123 4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number ID</label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={whatsappData.phoneNumberId}
              onChange={(e) => setWhatsappData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
              placeholder="1234567890"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp Business Account ID</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={whatsappData.whatsappBusinessAccountId}
              onChange={(e) => setWhatsappData(prev => ({ ...prev, whatsappBusinessAccountId: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
              placeholder="1234567890"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Access Token</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showWhatsappToken ? "text" : "password"}
              value={whatsappData.accessToken}
              onChange={(e) => setWhatsappData(prev => ({ ...prev, accessToken: e.target.value }))}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
              placeholder="EAA..."
            />
            <button
              type="button"
              onClick={() => setShowWhatsappToken(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showWhatsappToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Meta Business Manager&apos;dan alinan WhatsApp Business Access Token.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Aktif</p>
            <p className="text-xs text-muted-foreground">WhatsApp mesajlari icin baglantiyi kullan</p>
          </div>
          <button
            type="button"
            onClick={() => setWhatsappData(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              whatsappData.isActive ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                whatsappData.isActive ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => void handleWhatsappSave()}
            disabled={
              !whatsappData.phoneNumber ||
              !whatsappData.phoneNumberId ||
              !whatsappData.accessToken
            }
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {whatsappConnected ? "Guncelle" : "Baglan"}
          </button>
          {whatsappConnected && (
            <button
              onClick={() => void handleWhatsappDisconnect()}
              className="px-5 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
            >
              Baglantiyi Kes
            </button>
          )}
          {whatsappSaved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="w-4 h-4" />
              Kaydedildi
            </span>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">WhatsApp Business API Bilgileri Nasil Alinir?</h4>
        <div className="space-y-2">
          {[
            "Meta Business Manager'a gidin (business.facebook.com)",
            "WhatsApp Business hesabinizi olusturun veya baglayin",
            "Meta for Developers'a gidin (developers.facebook.com)",
            "WhatsApp Business API urununu ekleyin",
            "Phone Number ID ve WhatsApp Business Account ID bilgilerini alin",
            "Access token olusturun ve kaydedin",
          ].map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Bildirim Tercihleri</h3>
        <p className="text-sm text-muted-foreground">Hangi bildirimleri almak istediginizi secin</p>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Bildirim Kanallari</h4>

        {[
          { key: "emailNotifications", label: "E-posta Bildirimleri", description: "Onemli guncellemeleri e-posta ile alin", icon: Mail },
          { key: "pushNotifications", label: "Push Bildirimleri", description: "Tarayici bildirimleri alin", icon: Bell },
          { key: "smsNotifications", label: "SMS Bildirimleri", description: "Kritik uyarilar icin SMS alin", icon: Smartphone },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications[item.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Notification Types */}
      <div className="pt-6 border-t border-border space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Bildirim Turleri</h4>

        {[
          { key: "newReservation", label: "Yeni Rezervasyon", description: "Yeni bir rezervasyon yapildiginda" },
          { key: "reservationReminder", label: "Rezervasyon Hatirlatici", description: "Yaklasan rezervasyonlar icin hatirlatma" },
          { key: "newReview", label: "Yeni Yorum", description: "Google'da yeni bir yorum yapildiginda" },
          { key: "weeklyReport", label: "Haftalik Rapor", description: "Haftalik performans ozeti" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  notifications[item.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Gorunum Ayarlari</h3>
        <p className="text-sm text-muted-foreground">Tema ve dil tercihlerinizi ayarlayin</p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Tema</h4>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Acik", icon: "sun" },
            { value: "dark", label: "Koyu", icon: "moon" },
            { value: "system", label: "Sistem", icon: "monitor" },
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => setAppearance(prev => ({ ...prev, theme: theme.value as typeof appearance.theme }))}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                appearance.theme === theme.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                appearance.theme === theme.value ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Palette className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className="pt-6 border-t border-border space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Dil</h4>
        <div className="relative max-w-xs">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={appearance.language}
            onChange={(e) => setAppearance(prev => ({ ...prev, language: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
          >
            <option value="tr">Turkce</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90" />
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab()
      case "business":
        return renderBusinessTab()
      case "security":
        return renderSecurityTab()
      case "google":
        return renderGoogleTab()
      case "instagram":
        return renderInstagramTab()
      case "whatsapp":
        return renderWhatsappTab()
      case "notifications":
        return renderNotificationsTab()
      case "appearance":
        return renderAppearanceTab()
      case "billing":
        return <CorporateBillingTab businessUserId={user?.businessUserId} />
      default:
        return renderProfileTab()
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">Hesap ve uygulama ayarlarinizi yonetin</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tab.label}</p>
                    {!isActive && (
                      <p className="text-xs opacity-70 truncate hidden lg:block">{tab.description}</p>
                    )}
                  </div>
                  <ChevronRight className={cn("w-4 h-4 flex-shrink-0", isActive ? "opacity-100" : "opacity-50")} />
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-xl border border-border p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
