"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Instagram,
  Package,
  Play,
  Scissors,
  Sparkles,
  Star,
  Users,
} from "lucide-react"

interface PresentationSection {
  id: string
  eyebrow: string
  title: string
  description: string
  imageOnLeft: boolean
  image: string
  icon: React.ReactNode
  features: string[]
}

const sections: PresentationSection[] = [
  {
    id: "work-areas",
    eyebrow: "Çalışma Alanları",
    title: "Her koltuğu, her saati kontrol altında tutun",
    description:
      "Salonunuzdaki çalışma alanlarını tek ekrandan yönetin. Her alana personel atayın, çalışma saatlerini belirleyin ve randevuları organize edin. Sistem, ekibinizin müsaitlik durumunu otomatik takip eder.",
    imageOnLeft: false,
    image: "/presentation/work-areas.png",
    icon: <CalendarCheck2 className="h-5 w-5" />,
    features: [
      "Çalışma alanı oluşturma ve düzenleme",
      "Personel atama ve yönetimi",
      "Çalışma saatlerini belirleme",
      "Gerçek zamanlı müsaitlik takibi",
      "Akıllı randevu organizasyonu",
    ],
  },
  {
    id: "customers",
    eyebrow: "Müşteriler",
    title: "Müşterilerinizi tanıyın, sadakatlerini kazanın",
    description:
      "Tüm müşteri veritabanınızı tek bir yerden yönetin. Müşteri bilgilerini kaydedin, randevu geçmişini görün ve her müşteri için detaylı profil oluşturarak ilişkilerinizi güçlendirin.",
    imageOnLeft: true,
    image: "/presentation/customers.png",
    icon: <Users className="h-5 w-5" />,
    features: [
      "Detaylı müşteri profilleri",
      "Randevu ve seans geçmişi",
      "İletişim bilgileri yönetimi",
      "Müşteri notları ve tercihleri",
      "Sadakat takibi",
    ],
  },
  {
    id: "stock-products",
    eyebrow: "Stok ve Ürünler",
    title: "Ürünleri ve geliri tek bakışta görün",
    description:
      "Ürünlerinizin stok durumunu takip edin, satışları kaydedin ve envanterinizi yönetin. Satışlar otomatik olarak sisteme işlenir, gelir raporları anında oluşturulur.",
    imageOnLeft: false,
    image: "/presentation/stock-products.png",
    icon: <Package className="h-5 w-5" />,
    features: [
      "Canlı ürün stok takibi",
      "Hızlı satış kaydı",
      "Envanter yönetimi",
      "Otomatik gelir raporları",
      "Düşük stok uyarıları",
    ],
  },
  {
    id: "google-reviews",
    eyebrow: "Google Yorumları",
    title: "İtibarınızı tek panelden yönetin",
    description:
      "Google İşletme Profilinizdeki yorumları otomatik çekin ve yönetin. Müşteri geri bildirimlerini takip edin, puanınızı izleyin ve memnuniyeti sürekli artırın.",
    imageOnLeft: true,
    image: "/presentation/google-reviews.png",
    icon: <Star className="h-5 w-5" />,
    features: [
      "Otomatik yorum senkronizasyonu",
      "Tek ekrandan yorum yönetimi",
      "Puan ve trend takibi",
      "Müşteri geri bildirim analizi",
      "Memnuniyet özetleri",
    ],
  },
  {
    id: "instagram-sharing",
    eyebrow: "Instagram Paylaşımı",
    title: "Yaptığınız işi vitrine çıkarın",
    description:
      "Tamamlanan seanslardan sonra müşterilerin onayıyla Instagram'da fotoğraf paylaşın. Marka bilinirliğinizi artırın, yeni müşterilere ulaşın ve sosyal medya varlığınızı güçlendirin.",
    imageOnLeft: false,
    image: "/presentation/instagram-sharing.png",
    icon: <Instagram className="h-5 w-5" />,
    features: [
      "Tek tıkla Instagram paylaşımı",
      "Müşteri onay akışı",
      "Öncesi / sonrası galerisi",
      "Sosyal medya entegrasyonu",
      "Marka bilinirliği artışı",
    ],
  },
]

const stats = [
  { value: "5", label: "Entegre modül" },
  { value: "Tek", label: "Platform" },
  { value: "7/24", label: "Erişim" },
  { value: "%100", label: "Dijital takip" },
]

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">Kuaför Panel</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Panele dön
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 text-center md:pt-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Salonunuz için akıllı yönetim platformu
          </div>
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Kuaför salonunuzu tek bir{" "}
            <span className="text-primary">akıllı panelden</span> yönetin
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Çalışma alanları, müşteriler, stok, Google yorumları ve Instagram paylaşımları;
            işletmenizin ihtiyacı olan her şey tek platformda buluşuyor.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="#work-areas">
                <Play className="h-5 w-5" />
                Özellikleri keşfedin
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="#cta">
                Hemen başlayın
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto mt-14 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5">
              <Image
                src="/presentation/hero-dashboard.png"
                alt="Kuaför Panel kontrol paneli önizlemesi"
                width={1600}
                height={900}
                priority
                className="h-auto w-full"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-3xl bg-primary/10 blur-2xl" />
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card px-4 py-6"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <div className="mx-auto max-w-6xl px-6">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 border-t border-border/60 py-20 md:py-28"
          >
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              {/* Media */}
              <div className={section.imageOnLeft ? "md:order-1" : "md:order-2"}>
                <div className="relative">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
                    <Image
                      src={section.image || "/placeholder.svg"}
                      alt={`${section.eyebrow} ekran görüntüsü`}
                      width={1280}
                      height={800}
                      className="h-auto w-full"
                    />
                  </div>
                  <div className="absolute -z-10 -bottom-5 -left-5 h-24 w-24 rounded-2xl bg-primary/10 blur-xl" />
                </div>
              </div>

              {/* Text */}
              <div className={section.imageOnLeft ? "md:order-2" : "md:order-1"}>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                    {section.icon}
                  </span>
                  {section.eyebrow}
                </div>
                <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  {section.title}
                </h2>
                <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {section.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section id="cta" className="scroll-mt-24 px-6 pb-24 pt-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Salonunuzu dijital çağa taşımaya hazır mısınız?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-primary-foreground/85">
            Randevular, müşteriler, stok ve sosyal medya yönetimini tek platformda birleştirin.
            Tüm ekibiniz aynı sistemde, her şey kontrol altında.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/">
                Panele git
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Kuaför Panel Sistemi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
