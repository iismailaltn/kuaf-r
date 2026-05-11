"use client"

import { useCallback, useEffect, useState } from "react"
import { useGooglePlaceSettings } from "@/hooks/use-google-place-settings"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Star,
  ExternalLink,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  ThumbsUp,
  MessageSquare,
  Sparkles,
} from "lucide-react"

interface Review {
  id: string
  author: string
  authorPhoto?: string
  rating: number
  text: string
  time: string
  relativeTime: string
}

export function ReviewsView() {
  const { settings, isSaving, saveSettings } = useGooglePlaceSettings()
  const [apiKey, setApiKey] = useState("")
  const [placeId, setPlaceId] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [showInstructions, setShowInstructions] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReviews = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const res = await fetch("/api/google-reviews", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok || !Array.isArray(data?.reviews)) {
        setError(String(data?.message ?? "Google yorumlari getirilemedi."))
        return false
      }

      setReviews(data.reviews)
      setIsConnected(true)
      return true
    } catch {
      setError("Google yorumlari getirilirken bir hata olustu.")
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  useEffect(() => {
    if (!settings) {
      return
    }

    setApiKey(settings.placesApiKey)
    setPlaceId(settings.placeId)
    void loadReviews()
  }, [settings, loadReviews])

  const handleConnect = async () => {
    if (!apiKey.trim() || !placeId.trim()) {
      setError("Lutfen API Key ve Place ID alanlarini doldurun.")
      return
    }

    setIsConnecting(true)
    setError(null)

    const result = await saveSettings(apiKey.trim(), placeId.trim())
    if (!result.ok) {
      setError(result.message)
      setIsConnecting(false)
      return
    }

    await loadReviews()
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setReviews([])
    setApiKey("")
    setPlaceId("")
  }

  const handleRefresh = async () => {
    await loadReviews()
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0"

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
        : 0,
  }))

  if (!isConnected) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Google Yorumlari</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Google My Business yorumlarinizi goruntuleyip analiz edin.
          </p>
        </div>

        {/* Connection Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Google Places API Baglantisi
                </h2>
                <p className="text-sm text-muted-foreground">
                  Yorumlari almak icin API bilgilerinizi girin
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Google Places API Key
                </label>
                <Input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Place ID (Isletme ID)
                </label>
                <Input
                  type="text"
                  placeholder="ChIJ..."
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting || isSaving}
                className="w-full h-12 rounded-xl text-base font-medium"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Baglaniyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Baglan ve Yorumlari Al
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="border-t border-border">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium text-foreground">
                API Key ve Place ID Nasil Alinir?
              </span>
              {showInstructions ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {showInstructions && (
              <div className="px-6 pb-6 space-y-6">
                {/* Step 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      1
                    </span>
                    <h3 className="font-medium text-foreground">
                      Google Cloud Console&apos;a Gidin
                    </h3>
                  </div>
                  <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                    <p>
                      <a
                        href="https://console.cloud.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        console.cloud.google.com
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {" "}adresine gidin ve Google hesabinizla oturum acin.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      2
                    </span>
                    <h3 className="font-medium text-foreground">Yeni Proje Olusturun</h3>
                  </div>
                  <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                    <p>
                      Ust menuden proje seciciyi tiklayin ve &quot;New Project&quot; butonuna
                      basin. Projenize bir isim verin (orn: &quot;Restoran Yorumlari&quot;).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      3
                    </span>
                    <h3 className="font-medium text-foreground">
                      Places API&apos;yi Etkinlestirin
                    </h3>
                  </div>
                  <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                    <p>Sol menuden &quot;APIs &amp; Services&quot; {"->"} &quot;Library&quot; secin.</p>
                    <p>
                      Arama kutusuna &quot;Places API&quot; yazin ve sonuclarda cikan
                      &quot;Places API&quot;yi secip &quot;Enable&quot; butonuna basin.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      4
                    </span>
                    <h3 className="font-medium text-foreground">API Key Olusturun</h3>
                  </div>
                  <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                    <p>
                      &quot;APIs &amp; Services&quot; {"->"} &quot;Credentials&quot; bolumune gidin.
                    </p>
                    <p>
                      &quot;Create Credentials&quot; {"->"} &quot;API Key&quot; secin. Olusturulan key&apos;i
                      kopyalayin.
                    </p>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-2">
                      <p className="text-amber-600 dark:text-amber-400 text-xs">
                        <strong>Onemli:</strong> API key&apos;inizi guvenli tutun ve
                        herkesle paylasmamin. Kisitlamalar ekleyerek guvenligini artirin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      5
                    </span>
                    <h3 className="font-medium text-foreground">Place ID Bulun</h3>
                  </div>
                  <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                    <p>
                      <a
                        href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Place ID Finder
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {" "}sayfasina gidin.
                    </p>
                    <p>
                      Haritada isletmenizi arayip secin. Gosterilen Place ID&apos;yi
                      kopyalayin (ChIJ ile baslar).
                    </p>
                  </div>
                </div>

                {/* Billing Note */}
                <div className="p-4 bg-muted rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    <h4 className="font-medium text-foreground">Faturalandirma Hakkinda</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Google Cloud, aylik $200 ucretsiz kredi sunmaktadir. Kucuk ve orta
                    olcekli isletmeler icin genellikle bu kredi yeterlidir. Detayli
                    bilgi icin{" "}
                    <a
                      href="https://cloud.google.com/maps-platform/pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      fiyatlandirma sayfasini
                    </a>{" "}
                    inceleyin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Connected State - Show Reviews
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Google Yorumlari</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Isletmenizin Google yorumlarini inceleyin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isConnecting || isSaving}
            className="rounded-xl"
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", isConnecting && "animate-spin")}
            />
            Yenile
          </Button>
          <Button variant="outline" onClick={handleDisconnect} className="rounded-xl">
            Baglanti Kes
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Rating Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Ortalama Puan
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">{averageRating}</span>
            <span className="text-muted-foreground">/5</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= Math.round(Number(averageRating))
                    ? "text-amber-500 fill-amber-500"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Toplam Yorum
            </span>
            <div className="p-2 rounded-xl bg-primary/10">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">{reviews.length}</span>
            <span className="text-muted-foreground">yorum</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Son 30 gunde alinan yorumlar
          </p>
        </div>

        {/* AI Analysis Placeholder */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-primary">AI Analizi</span>
            <div className="p-2 rounded-xl bg-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Yapay zeka destekli yorum analizi yakinda aktif olacak. Musteri
            duygularini ve onemli konulari otomatik olarak analiz edecek.
          </p>
          <Button variant="outline" className="mt-4 rounded-xl w-full" disabled>
            Yakinda
          </Button>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Puan Dagilimi</h3>
        <div className="space-y-3">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm font-medium text-foreground">{rating}</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Son Yorumlar</h3>
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{review.author}</p>
                  <p className="text-xs text-muted-foreground">{review.relativeTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-4 h-4",
                      star <= review.rating
                        ? "text-amber-500 fill-amber-500"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
            <div className="flex items-center gap-4 pt-2">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ThumbsUp className="w-4 h-4" />
                Faydali
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="w-4 h-4" />
                Yanitla
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
