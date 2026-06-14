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
  TrendingUp,
  UserPlus,
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

const services = [
  {
    icon: <CalendarCheck2 className="h-6 w-6" />,
    title: "Çalışma Alanları",
    description: "Koltukları, personeli ve çalışma saatlerini tek ekrandan yönetin.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Müşteri Yönetimi",
    description: "Detaylı profiller, randevu geçmişi ve sadakat takibi bir arada.",
  },
  {
    icon: <Package className="h-6 w-6" />,
    title: "Stok ve Ürünler",
    description: "Canlı stok takibi, hızlı satış kaydı ve otomatik gelir raporları.",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Google Yorumları",
    description: "Yorumları otomatik çekin, puanınızı ve itibarınızı yönetin.",
  },
  {
    icon: <Instagram className="h-6 w-6" />,
    title: "Instagram Paylaşımı",
    description: "Müşteri onayıyla işlerinizi paylaşın, marka bilinirliğini artırın.",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Raporlama",
    description: "Gelir, randevu ve performans verilerini anlık olarak izleyin.",
  },
]

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">Kuaför Panel</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <Link href="#work-areas" className="transition-colors hover:text-foreground">
              Çalışma Alanları
            </Link>
            <Link href="#customers" className="transition-colors hover:text-foreground">
              Müşteriler
            </Link>
            <Link href="#services" className="transition-colors hover:text-foreground">
              Özellikler
            </Link>
            <Link href="#cta" className="transition-colors hover:text-foreground">
              İletişim
            </Link>
          </nav>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Panele dön</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-3 pt-6 sm:px-5 md:pt-10">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-2 lg:gap-8">
          {/* Text */}
          <div className="px-1 lg:pl-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Salonunuz için akıllı yönetim platformu
            </div>
            <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              Kuaför Salonu Yönetiminde{" "}
              <span className="rounded-xl bg-primary px-3 text-primary-foreground">Yeni Nesil</span>{" "}
              Çözüm
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Çalışma alanları, müşteriler, stok, Google yorumları ve Instagram paylaşımları;
              işletmenizin ihtiyacı olan her şey tek platformda buluşuyor.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="#work-areas">
                  Özellikleri keşfedin
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Link
                href="#services"
                className="group flex items-center gap-3 text-sm font-medium text-foreground"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Play className="h-5 w-5" />
                </span>
                Tanıtımı izle
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[2rem] bg-primary/10 p-4 sm:p-6">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/15" />
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
                <Image
                  src="/presentation/hero-dashboard.png"
                  alt="Kuaför Panel kontrol paneli önizlemesi"
                  width={1600}
                  height={900}
                  priority
                  className="h-auto w-full"
                />
              </div>

              {/* Floating stat cards */}
              <div className="absolute right-6 top-10 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs text-muted-foreground">Aylık Gelir</div>
                  <div className="text-sm font-bold">₺128K</div>
                </div>
              </div>
              <div className="absolute bottom-10 left-6 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs text-muted-foreground">Yeni Müşteri</div>
                  <div className="text-sm font-bold">+340</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-28 border-t border-border/60 py-16 md:py-24"
          >
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
              {/* Media */}
              <div className={section.imageOnLeft ? "md:order-1" : "md:order-2"}>
                <div className="relative overflow-hidden rounded-[2rem] bg-primary/10 p-4 sm:p-6">
                  <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/15" />
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
                    <Image
                      src={section.image || "/placeholder.svg"}
                      alt={`${section.eyebrow} ekran görüntüsü`}
                      width={1280}
                      height={800}
                      className="h-auto w-full"
                    />
                  </div>
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
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
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

      {/* Services grid */}
      <section id="services" className="scroll-mt-28 px-3 pb-20 pt-4 sm:px-5">
        <div className="mx-auto max-w-[1400px] rounded-[2.5rem] bg-primary px-5 py-16 text-primary-foreground sm:px-10 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/80">
              Neler Sunuyoruz
            </span>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Tek platform, eksiksiz salon yönetimi
            </h2>
            <p className="mx-auto mt-4 text-pretty text-primary-foreground/85">
              İşletmenizi büyütmek için ihtiyaç duyduğunuz tüm araçlar tek bir yerde.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-6 backdrop-blur-sm transition-colors hover:bg-primary-foreground/15"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
                  {service.icon}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="scroll-mt-28 px-3 pb-24 sm:px-5">
        <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-16 text-center sm:px-10">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Salonunuzu dijital çağa taşımaya hazır mısınız?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            Randevular, müşteriler, stok ve sosyal medya yönetimini tek platformda birleştirin.
            Tüm ekibiniz aynı sistemde, her şey kontrol altında.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
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
        <div className="mx-auto max-w-[1400px] px-5 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Kuaför Panel Sistemi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
