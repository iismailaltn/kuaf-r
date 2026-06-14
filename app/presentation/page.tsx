"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Heart,
  History,
  Instagram,
  Package,
  Play,
  Quote,
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
  stat: { value: string; label: string }
}

const sections: PresentationSection[] = [
  {
    id: "work-areas",
    eyebrow: "Çalışma Alanları",
    title: "Her koltuğu, her saati kontrol altında tutun",
    description:
      "Salonunuzdaki çalışma alanlarını tek ekrandan yönetin. Her alana personel atayın, çalışma saatlerini belirleyin ve randevuları organize edin. Sistem ekibinizin müsaitliğini otomatik takip eder.",
    imageOnLeft: false,
    image: "/presentation/work-areas.png",
    icon: <CalendarCheck2 className="h-5 w-5" />,
    features: [
      "Çalışma alanı oluşturma ve düzenleme",
      "Personel atama ve yönetimi",
      "Çalışma saatlerini belirleme",
      "Gerçek zamanlı müsaitlik takibi",
    ],
    stat: { value: "%0", label: "çakışan randevu" },
  },
  {
    id: "stock-products",
    eyebrow: "Stok ve Ürünler",
    title: "Ürünleri ve geliri tek bakışta görün",
    description:
      "Ürünlerinizin stok durumunu takip edin, satışları kaydedin ve envanterinizi yönetin. Satışlar otomatik sisteme işlenir, gelir raporları anında oluşturulur.",
    imageOnLeft: true,
    image: "/presentation/stock-products.png",
    icon: <Package className="h-5 w-5" />,
    features: [
      "Canlı ürün stok takibi",
      "Hızlı satış kaydı",
      "Otomatik gelir raporları",
      "Düşük stok uyarıları",
    ],
    stat: { value: "Anlık", label: "gelir raporu" },
  },
  {
    id: "google-reviews",
    eyebrow: "Google Yorumları",
    title: "İtibarınızı tek panelden yönetin",
    description:
      "Google İşletme Profilinizdeki yorumları otomatik çekin ve yönetin. Müşteri geri bildirimlerini takip edin, puanınızı izleyin ve memnuniyeti sürekli artırın.",
    imageOnLeft: false,
    image: "/presentation/google-reviews.png",
    icon: <Star className="h-5 w-5" />,
    features: [
      "Otomatik yorum senkronizasyonu",
      "Tek ekrandan yorum yönetimi",
      "Puan ve trend takibi",
      "Memnuniyet özetleri",
    ],
    stat: { value: "4.9★", label: "ortalama puan" },
  },
  {
    id: "instagram-sharing",
    eyebrow: "Instagram Paylaşımı",
    title: "Yaptığınız işi vitrine çıkarın",
    description:
      "Tamamlanan seanslardan sonra müşterilerin onayıyla Instagram'da fotoğraf paylaşın. Marka bilinirliğinizi artırın, yeni müşterilere ulaşın ve sosyal medya varlığınızı güçlendirin.",
    imageOnLeft: true,
    image: "/presentation/instagram-sharing.png",
    icon: <Instagram className="h-5 w-5" />,
    features: [
      "Tek tıkla Instagram paylaşımı",
      "Müşteri onay akışı",
      "Öncesi / sonrası galerisi",
      "Marka bilinirliği artışı",
    ],
    stat: { value: "1 tık", label: "ile paylaşım" },
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

const customerHighlights = [
  {
    icon: <Heart className="h-5 w-5" />,
    title: "Sadakat Takibi",
    description: "Düzenli müşterilerinizi tanıyın, tercihlerini hatırlayın ve bağlılığı güçlendirin.",
  },
  {
    icon: <History className="h-5 w-5" />,
    title: "Randevu Geçmişi",
    description: "Her müşterinin geçmiş seanslarına ve notlarına tek tıkla ulaşın.",
  },
]

const heroStats = [
  { value: "5.000+", label: "Yönetilen randevu" },
  { value: "%98", label: "Müşteri memnuniyeti" },
  { value: "12 sn", label: "Ortalama kayıt süresi" },
  { value: "7/24", label: "Erişilebilir panel" },
]

const steps = [
  {
    no: "01",
    title: "Salonunuzu kurun",
    description: "Çalışma alanlarınızı oluşturun, personelinizi ekleyin ve çalışma saatlerini belirleyin.",
  },
  {
    no: "02",
    title: "Randevuları yönetin",
    description: "Müşterilerinizi kaydedin, randevuları planlayın ve günlük akışı tek ekrandan takip edin.",
  },
  {
    no: "03",
    title: "İşletmenizi büyütün",
    description: "Yorumları, stoğu ve sosyal medyayı yönetin; raporlarla performansınızı artırın.",
  },
]

const testimonials = [
  {
    quote:
      "Randevu karmaşası tamamen bitti. Artık tüm ekibim aynı ekrana bakıyor, çakışma yaşamıyoruz.",
    name: "Elif Demir",
    role: "Salon Sahibi, İstanbul",
  },
  {
    quote:
      "Stok takibi ve gelir raporları sayesinde hangi ürünün ne kadar sattığını anında görüyorum.",
    name: "Murat Yılmaz",
    role: "İşletmeci, Ankara",
  },
  {
    quote:
      "Google yorumlarını ve Instagram paylaşımlarını tek yerden yönetmek bize çok zaman kazandırdı.",
    name: "Zeynep Kaya",
    role: "Kuaför, İzmir",
  },
]

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between rounded-2xl border border-border/60 bg-card/85 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">Kuaför Panel</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
            <Link href="#features" className="transition-colors hover:text-foreground">
              Özellikler
            </Link>
            <Link href="#how" className="transition-colors hover:text-foreground">
              Nasıl Çalışır
            </Link>
            <Link href="#testimonials" className="transition-colors hover:text-foreground">
              Yorumlar
            </Link>
            <Link href="#services" className="transition-colors hover:text-foreground">
              Çözümler
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Panele dön</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-3 pt-8 sm:px-5 md:pt-12">
        {/* backdrop */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary/8 to-transparent" />
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* Text */}
          <div className="lg:pl-4">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Salonlar için hepsi bir arada yönetim platformu
            </div>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-[3.75rem]">
              Salonunuzu yönetmenin{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 rounded-xl bg-primary px-3 text-primary-foreground">
                  en akıllı
                </span>
              </span>{" "}
              yolu
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Randevular, müşteriler, stok, Google yorumları ve Instagram paylaşımları;
              işletmenizin ihtiyacı olan her şey tek platformda, kontrolünüz altında.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="gap-2 text-base">
                <Link href="#features">
                  Özellikleri keşfedin
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Link
                href="#how"
                className="group flex items-center gap-3 text-sm font-medium text-foreground"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Play className="h-5 w-5" />
                </span>
                Nasıl çalışır?
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm font-medium">4.9/5 memnuniyet</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm text-muted-foreground">
                Türkiye genelinde <span className="font-semibold text-foreground">200+</span> salon kullanıyor
              </span>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/15 to-primary/5 p-4 sm:p-6">
              <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-primary/15" />
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

        {/* Stat band */}
        <div className="mx-auto mt-12 max-w-[1400px] md:mt-16">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {heroStats.map((s) => (
              <div key={s.label} className="bg-card px-6 py-6 text-center">
                <div className="text-2xl font-bold tracking-tight md:text-3xl">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customers (arched) */}
      <section id="customers" className="scroll-mt-28 px-3 py-16 sm:px-5 md:py-24">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
          <div className="md:order-1">
            <div className="relative mx-auto max-w-md">
              <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-[10rem_10rem_2rem_2rem] bg-primary/15" />
              <div className="overflow-hidden rounded-[10rem_10rem_2rem_2rem] border border-border bg-card shadow-xl shadow-primary/10">
                <Image
                  src="/presentation/customers.png"
                  alt="Müşteri yönetimi ekran görüntüsü"
                  width={900}
                  height={1100}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="md:order-2">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                <Users className="h-4 w-4" />
              </span>
              Müşteriler
            </div>
            <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Müşterilerinizi{" "}
              <span className="rounded-lg bg-primary px-2 text-primary-foreground">tanıyın</span>,
              sadakatlerini kazanın
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              Tüm müşteri veritabanınızı tek yerden yönetin. Bilgileri kaydedin, randevu geçmişini görün
              ve her müşteri için detaylı profil oluşturarak ilişkilerinizi güçlendirin.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {customerHighlights.map((item) => (
                <div key={item.title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {item.icon}
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <div id="features" className="mx-auto max-w-[1400px] scroll-mt-28 px-3 sm:px-5">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-28 border-t border-border/60 py-16 md:py-24"
          >
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
              {/* Media */}
              <div className={section.imageOnLeft ? "md:order-1" : "md:order-2"}>
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/15 to-primary/5 p-4 sm:p-6">
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
                  {/* mini stat chip */}
                  <div className="absolute bottom-8 right-8 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg">
                    <div className="text-lg font-bold leading-none text-primary">{section.stat.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{section.stat.label}</div>
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

      {/* How it works */}
      <section id="how" className="scroll-mt-28 px-3 py-16 sm:px-5 md:py-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Clock className="h-4 w-4" />
              Nasıl Çalışır
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Üç adımda salonunuzu dijitalleştirin
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Kurulumdan büyümeye kadar her şey basit ve hızlı.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.no}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary/40"
              >
                <span className="text-5xl font-bold tracking-tight text-primary/15 transition-colors group-hover:text-primary/25">
                  {step.no}
                </span>
                <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="scroll-mt-28 px-3 pb-16 sm:px-5 md:pb-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Heart className="h-4 w-4" />
              Müşteri Yorumları
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Salonlar Kuaför Panel ile büyüyor
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-border bg-card p-7"
              >
                <Quote className="h-8 w-8 text-primary/30" />
                <blockquote className="mt-4 flex-1 text-pretty leading-relaxed text-foreground/90">
                  {t.quote}
                </blockquote>
                <div className="mt-5 flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <figcaption className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {t.name.charAt(0)}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

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
        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-16 text-center sm:px-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary/10" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Salonunuzu dijital çağa taşımaya hazır mısınız?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
              Randevular, müşteriler, stok ve sosyal medya yönetimini tek platformda birleştirin.
              Tüm ekibiniz aynı sistemde, her şey kontrol altında.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2 text-base">
                <Link href="/">
                  Panele git
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="h-4 w-4" />
            </div>
            <span className="font-medium text-foreground">Kuaför Panel</span>
          </div>
          <p>© {new Date().getFullYear()} Kuaför Panel Sistemi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
