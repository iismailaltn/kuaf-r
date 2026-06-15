"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Fraunces } from "next/font/google"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  Instagram,
  Package,
  Play,
  Scissors,
  Star,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import "./presentation.css"

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
})

interface FeatureBlock {
  id: string
  no: string
  eyebrow: string
  title: string
  description: string
  reverse: boolean
  image: string
  features: string[]
  stat: { value: string; label: string }
}

const features: FeatureBlock[] = [
  {
    id: "work-areas",
    no: "01",
    eyebrow: "Çalışma Alanları",
    title: "Her koltuk, her saat kontrol altında",
    description:
      "Salonunuzdaki çalışma alanlarını tek ekrandan yönetin. Personel atayın, çalışma saatlerini belirleyin ve randevuları organize edin. Sistem ekibinizin müsaitliğini otomatik takip eder.",
    reverse: false,
    image: "/presentation/work-areas.png",
    features: [
      "Çalışma alanı oluşturma ve düzenleme",
      "Personel atama ve yönetimi",
      "Çalışma saatlerini belirleme",
      "Gerçek zamanlı müsaitlik takibi",
    ],
    stat: { value: "%0", label: "Çakışan randevu" },
  },
  {
    id: "stock-products",
    no: "02",
    eyebrow: "Stok ve Ürünler",
    title: "Ürünleri ve geliri tek bakışta görün",
    description:
      "Ürünlerinizin stok durumunu takip edin, satışları kaydedin ve envanterinizi yönetin. Satışlar otomatik sisteme işlenir, gelir raporları anında oluşturulur.",
    reverse: true,
    image: "/presentation/stock-products.png",
    features: [
      "Canlı ürün stok takibi",
      "Hızlı satış kaydı",
      "Otomatik gelir raporları",
      "Düşük stok uyarıları",
    ],
    stat: { value: "Anlık", label: "Gelir raporu" },
  },
  {
    id: "google-reviews",
    no: "03",
    eyebrow: "Google Yorumları",
    title: "İtibarınızı tek panelden yönetin",
    description:
      "Google İşletme Profilinizdeki yorumları otomatik çekin ve yönetin. Müşteri geri bildirimlerini takip edin, puanınızı izleyin ve memnuniyeti sürekli artırın.",
    reverse: false,
    image: "/presentation/google-reviews.png",
    features: [
      "Otomatik yorum senkronizasyonu",
      "Tek ekrandan yorum yönetimi",
      "Puan ve trend takibi",
      "Memnuniyet özetleri",
    ],
    stat: { value: "4.9", label: "Ortalama puan" },
  },
  {
    id: "instagram-sharing",
    no: "04",
    eyebrow: "Instagram Paylaşımı",
    title: "Yaptığınız işi vitrine çıkarın",
    description:
      "Tamamlanan seanslardan sonra müşterilerin onayıyla Instagram'da fotoğraf paylaşın. Marka bilinirliğinizi artırın, yeni müşterilere ulaşın ve sosyal medya varlığınızı güçlendirin.",
    reverse: true,
    image: "/presentation/instagram-sharing.png",
    features: [
      "Tek tıkla Instagram paylaşımı",
      "Müşteri onay akışı",
      "Öncesi / sonrası galerisi",
      "Marka bilinirliği artışı",
    ],
    stat: { value: "1 tık", label: "İle paylaşım" },
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

const heroStats = [
  { value: "5.000+", label: "Yönetilen randevu" },
  { value: "%98", label: "Müşteri memnuniyeti" },
  { value: "12 sn", label: "Ortalama kayıt" },
  { value: "7/24", label: "Erişilebilir panel" },
]

const steps = [
  {
    no: "I",
    title: "Salonunuzu kurun",
    description: "Çalışma alanlarınızı oluşturun, personelinizi ekleyin ve çalışma saatlerini belirleyin.",
  },
  {
    no: "II",
    title: "Randevuları yönetin",
    description: "Müşterilerinizi kaydedin, randevuları planlayın ve günlük akışı tek ekrandan takip edin.",
  },
  {
    no: "III",
    title: "İşletmenizi büyütün",
    description: "Yorumları, stoğu ve sosyal medyayı yönetin; raporlarla performansınızı artırın.",
  },
]

const testimonials = [
  {
    quote: "Randevu karmaşası tamamen bitti. Artık tüm ekibim aynı ekrana bakıyor, çakışma yaşamıyoruz.",
    name: "Elif Demir",
    role: "Salon Sahibi, İstanbul",
  },
  {
    quote: "Stok takibi ve gelir raporları sayesinde hangi ürünün ne kadar sattığını anında görüyorum.",
    name: "Murat Yılmaz",
    role: "İşletmeci, Ankara",
  },
  {
    quote: "Google yorumlarını ve Instagram paylaşımlarını tek yerden yönetmek bize çok zaman kazandırdı.",
    name: "Zeynep Kaya",
    role: "Kuaför, İzmir",
  },
]

const marqueeItems = [
  "Randevular",
  "Müşteriler",
  "Stok",
  "Google Yorumları",
  "Instagram",
  "Raporlama",
  "Personel",
  "Gelir",
]

export default function PresentationPage() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".kp-reveal")
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in")
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="kp" style={{ ["--font-display" as string]: display.style.fontFamily }}>
      {/* Üst bar */}
      <header className="kp-nav">
        <div className="kp-shell kp-nav__inner">
          <Link href="/" className="kp-brand">
            <span className="kp-brand__mark">
              <Scissors className="h-4 w-4" />
            </span>
            <span className="kp-brand__name">Kuaför Panel</span>
          </Link>
          <nav className="kp-nav__links">
            <Link href="#features" className="kp-nav__link">Özellikler</Link>
            <Link href="#how" className="kp-nav__link">Nasıl Çalışır</Link>
            <Link href="#testimonials" className="kp-nav__link">Yorumlar</Link>
            <Link href="#services" className="kp-nav__link">Çözümler</Link>
          </nav>
          <Link href="/" className="kp-btn kp-btn--ghost">
            <ArrowLeft className="h-4 w-4" />
            <span>Panele dön</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="kp-hero">
        <div className="kp-shell">
          <div className="kp-hero__grid">
            <div className="kp-reveal">
              <span className="kp-eyebrow">Salon yönetim platformu</span>
              <h1 className="kp__display kp-hero__title">
                Salonunuzu yönetmenin
                <br />
                <em>en zarif</em> yolu.
              </h1>
              <p className="kp-hero__lead">
                Randevular, müşteriler, stok, Google yorumları ve Instagram paylaşımları —
                işletmenizin ihtiyacı olan her şey tek bir sakin panelde, kontrolünüz altında.
              </p>
              <div className="kp-hero__actions">
                <Link href="#features" className="kp-btn kp-btn--solid">
                  Özellikleri keşfedin
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#how" className="kp-link-play">
                  <span className="kp-link-play__circle">
                    <Play className="h-4 w-4" />
                  </span>
                  Nasıl çalışır?
                </Link>
              </div>
              <div className="kp-hero__proof">
                <span className="kp-stars">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                <span><strong>4.9/5</strong> memnuniyet</span>
                <span className="kp-proof__sep" />
                <span>
                  Türkiye genelinde <strong>200+</strong> salon kullanıyor
                </span>
              </div>
            </div>

            <div className="kp-hero__media kp-reveal">
              <div className="kp-frame">
                <Image
                  src="/presentation/hero-dashboard.png"
                  alt="Kuaför Panel kontrol paneli önizlemesi"
                  width={1600}
                  height={900}
                  priority
                />
              </div>
              <div className="kp-tag kp-tag--tr">
                <span className="kp-tag__icon">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <span>
                  <span className="kp-tag__k">Aylık gelir</span>
                  <br />
                  <span className="kp-tag__v">₺128K</span>
                </span>
              </div>
              <div className="kp-tag kp-tag--bl">
                <span className="kp-tag__icon">
                  <UserPlus className="h-4 w-4" />
                </span>
                <span>
                  <span className="kp-tag__k">Yeni müşteri</span>
                  <br />
                  <span className="kp-tag__v">+340</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="kp-marquee" aria-hidden="true">
          <div className="kp-marquee__track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="kp-marquee__item">
                {item}
                <span>✳</span>
              </span>
            ))}
          </div>
        </div>

        {/* İstatistik bandı */}
        <div className="kp-shell">
          <div className="kp-stats">
            {heroStats.map((s) => (
              <div key={s.label} className="kp-stat kp-reveal">
                <div className="kp-stat__v">{s.value}</div>
                <div className="kp-stat__l">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Müşteriler */}
      <section id="customers" className="kp-section kp-section--line">
        <div className="kp-shell">
          <div className="kp-feature kp-feature--rev">
            <div className="kp-feature__media kp-reveal">
              <div className="kp-frame">
                <Image
                  src="/presentation/customers.png"
                  alt="Müşteri yönetimi ekran görüntüsü"
                  width={1280}
                  height={900}
                />
              </div>
            </div>
            <div className="kp-reveal">
              <span className="kp-eyebrow">
                <span className="kp-eyebrow__no">00</span> Müşteriler
              </span>
              <h2 className="kp__display kp-feature__title">
                Müşterilerinizi tanıyın, sadakatlerini kazanın
              </h2>
              <p className="kp-feature__lead">
                Tüm müşteri veritabanınızı tek yerden yönetin. Bilgileri kaydedin, randevu geçmişini görün
                ve her müşteri için detaylı profil oluşturarak ilişkilerinizi güçlendirin.
              </p>
              <ul className="kp-list">
                <li><span className="kp-list__no">a</span> Detaylı müşteri profilleri ve notlar</li>
                <li><span className="kp-list__no">b</span> Tek tıkla randevu geçmişine erişim</li>
                <li><span className="kp-list__no">c</span> Sadakat ve tercih takibi</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="features" className="kp-section kp-section--line">
        <div className="kp-shell">
          <div className="kp-head kp-reveal">
            <span className="kp-eyebrow">Özellikler</span>
            <h2 className="kp__display kp-head__title">Salonunuzun her köşesi için bir çözüm</h2>
          </div>

          <div style={{ marginTop: "72px" }}>
            {features.map((f) => (
              <article
                key={f.id}
                id={f.id}
                className={`kp-feature${f.reverse ? " kp-feature--rev" : ""}`}
                style={{ scrollMarginTop: "88px" }}
              >
                <div className="kp-feature__media kp-reveal">
                  <div className="kp-frame">
                    <Image
                      src={f.image || "/placeholder.svg"}
                      alt={`${f.eyebrow} ekran görüntüsü`}
                      width={1280}
                      height={800}
                    />
                  </div>
                  <div className="kp-chip">
                    <div className="kp-chip__v">{f.stat.value}</div>
                    <div className="kp-chip__l">{f.stat.label}</div>
                  </div>
                </div>
                <div className="kp-reveal">
                  <span className="kp-eyebrow">
                    <span className="kp-eyebrow__no">{f.no}</span> {f.eyebrow}
                  </span>
                  <h3 className="kp__display kp-feature__title">{f.title}</h3>
                  <p className="kp-feature__lead">{f.description}</p>
                  <ul className="kp-list">
                    {f.features.map((feature, i) => (
                      <li key={feature}>
                        <span className="kp-list__no">{String(i + 1).padStart(2, "0")}</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section id="how" className="kp-section kp-section--line">
        <div className="kp-shell">
          <div className="kp-head kp-reveal">
            <span className="kp-eyebrow">Nasıl Çalışır</span>
            <h2 className="kp__display kp-head__title">Üç adımda salonunuzu dijitalleştirin</h2>
            <p className="kp-head__lead">Kurulumdan büyümeye kadar her şey basit, sakin ve hızlı.</p>
          </div>
          <div className="kp-steps">
            {steps.map((step) => (
              <div key={step.no} className="kp-step kp-reveal">
                <div className="kp-step__no">{step.no}</div>
                <h3 className="kp-step__title">{step.title}</h3>
                <p className="kp-step__lead">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Yorumlar */}
      <section id="testimonials" className="kp-section kp-section--line">
        <div className="kp-shell">
          <div className="kp-head kp-reveal">
            <span className="kp-eyebrow">Müşteri Yorumları</span>
            <h2 className="kp__display kp-head__title">Salonlar Kuaför Panel ile büyüyor</h2>
          </div>
          <div className="kp-quotes">
            {testimonials.map((t) => (
              <figure key={t.name} className="kp-quote kp-reveal">
                <div className="kp-quote__mark">“</div>
                <blockquote className="kp-quote__body">{t.quote}</blockquote>
                <figcaption className="kp-quote__foot">
                  <div className="kp-quote__name">{t.name}</div>
                  <div className="kp-quote__role">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Hizmetler */}
      <section id="services" className="kp-section">
        <div className="kp-shell">
          <div className="kp-services kp-reveal">
            <div className="kp-head kp-services__head" style={{ maxWidth: "44rem" }}>
              <span className="kp-eyebrow">Neler Sunuyoruz</span>
              <h2 className="kp__display kp-head__title">Tek platform, eksiksiz salon yönetimi</h2>
            </div>
            <div className="kp-services__grid">
              {services.map((service, i) => (
                <div key={service.title} className="kp-svc">
                  <div className="kp-svc__no">{String(i + 1).padStart(2, "0")}</div>
                  <div className="kp-svc__icon">{service.icon}</div>
                  <h3 className="kp-svc__title">{service.title}</h3>
                  <p className="kp-svc__lead">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="kp-cta">
        <div className="kp-shell">
          <div className="kp-reveal">
            <span className="kp-eyebrow" style={{ justifyContent: "center" }}>Başlayalım</span>
            <h2 className="kp__display kp-cta__title">
              Salonunuzu dijital çağa taşımaya hazır mısınız?
            </h2>
            <p className="kp-cta__lead">
              Randevular, müşteriler, stok ve sosyal medya yönetimini tek platformda birleştirin.
              Tüm ekibiniz aynı sistemde, her şey kontrol altında.
            </p>
            <div className="kp-cta__actions">
              <Link href="/" className="kp-btn kp-btn--solid">
                Panele git
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="#features" className="kp-btn kp-btn--ghost">
                Özellikleri incele
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="kp-footer">
        <div className="kp-shell kp-footer__inner">
          <Link href="/" className="kp-brand">
            <span className="kp-brand__mark">
              <Scissors className="h-4 w-4" />
            </span>
            <span className="kp-brand__name" style={{ fontSize: "16px" }}>Kuaför Panel</span>
          </Link>
          <p>© {new Date().getFullYear()} Kuaför Panel Sistemi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
