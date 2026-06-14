"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight, Play, Scissors, Users, Package, Star, Instagram, Calendar, CheckCircle2 } from "lucide-react"

interface PresentationSection {
  id: string
  title: string
  description: string
  imageOnLeft: boolean
  icon: React.ReactNode
  features: string[]
}

export default function PresentationPage() {

  const sections: PresentationSection[] = [
    {
      id: "work-areas",
      title: "Çalışma Alanları",
      description: "Kuaför salonunuzdaki çalışma alanlarını kolayca yönetin. Her çalışma alanı için personel atayın, çalışma saatlerini belirleyin ve randevuları organize edin. Sistem, çalışanlarınızın müsaitlik durumunu otomatik olarak takip eder.",
      imageOnLeft: true,
      icon: <Calendar className="w-12 h-12" />,
      features: [
        "Çalışma alanları oluşturma ve düzenleme",
        "Personel atama ve yönetim",
        "Çalışma saatleri belirleme",
        "Müsaitlik durumu takibi",
        "Randevu organizasyonu"
      ]
    },
    {
      id: "customers",
      title: "Müşteriler",
      description: "Müşteri veritabanınızı tek bir yerden yönetin. Müşteri bilgilerini kaydedin, randevu geçmişini takip edin ve müşteri sadakatını artırın. Her müşteri için detaylı profil oluşturabilirsiniz.",
      imageOnLeft: false,
      icon: <Users className="w-12 h-12" />,
      features: [
        "Müşteri kayıt yönetimi",
        "Randevu geçmişi takibi",
        "Müşteri profilleri",
        "İletişim bilgileri",
        "Sadakat programı"
      ]
    },
    {
      id: "stock-products",
      title: "Stok ve Ürünler",
      description: "Salonunuzdaki ürünlerin stok durumunu takip edin, satışları kaydedin ve envanter yönetimi yapın. Ürün satışları otomatik olarak sisteme işlenir ve gelir raporları oluşturulur.",
      imageOnLeft: true,
      icon: <Package className="w-12 h-12" />,
      features: [
        "Ürün stok takibi",
        "Satış kaydı",
        "Envanter yönetimi",
        "Gelir raporları",
        "Stok uyarıları"
      ]
    },
    {
      id: "google-reviews",
      title: "Google Yorumları",
      description: "Google İşletme Profilinizdeki yorumları otomatik olarak çekin ve yönetin. Müşteri geri bildirimlerini takip edin, puanınızı izleyin ve müşteri memnuniyetini artırın.",
      imageOnLeft: false,
      icon: <Star className="w-12 h-12" />,
      features: [
        "Otomatik yorum çekme",
        "Yorum yönetimi",
        "Puan takibi",
        "Müşteri geri bildirimleri",
        "Memnuniyet analizi"
      ]
    },
    {
      id: "instagram-sharing",
      title: "Instagram Fotoğraf Paylaşımı",
      description: "Tamamlanan seanslardan sonra müşterilerin izniyle Instagram'da fotoğraf paylaşın. Marka bilinirliğinizi artırın, potansiyel müşterilere ulaşın ve sosyal medya varlığınızı güçlendirin.",
      imageOnLeft: true,
      icon: <Instagram className="w-12 h-12" />,
      features: [
        "Otomatik fotoğraf paylaşımı",
        "Müşteri onayı",
        "Marka bilinirliği",
        "Sosyal medya entegrasyonu",
        "Galeri yönetimi"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Scissors className="w-4 h-4" />
            Kuaför Panel Sistemi
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Kuaför Salonunuz İçin
            <br />
            Kapsamlı Yönetim Sistemi
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Randevular, müşteriler, stok, çalışanlar ve sosyal medya yönetimini tek bir platformda birleştiriyoruz.
            İşletmenizi dijital çağa taşıyın.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Tanıtımı İzle
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              Daha Fazla Bilgi
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          className={`py-20 px-6 ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
        >
          <div className="max-w-6xl mx-auto">
            <div className={`grid md:grid-cols-2 gap-12 items-center ${section.imageOnLeft ? "" : "md:flex-row-reverse"}`}>
              {/* Image/Video Side */}
              <div className={`${section.imageOnLeft ? "" : "md:order-2"}`}>
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl overflow-hidden border border-border flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        {section.icon}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {section.title} Görsel/Videosu
                      </p>
                      <Button variant="outline" size="sm" className="mt-4 gap-2">
                        <Play className="w-4 h-4" />
                        Önizleme
                      </Button>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/5 rounded-xl -z-10" />
                </div>
              </div>

              {/* Text Side */}
              <div className={`${section.imageOnLeft ? "" : "md:order-1"}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                  {section.icon}
                  {section.title}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {section.title}
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {section.description}
                </p>
                <div className="space-y-3">
                  {section.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/90 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Kuaför salonunuzu dijital çağa taşıyın. Randevular, müşteriler ve stok yönetimini tek bir platformda birleştirin.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2">
              Ücretsiz Deneyin
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
              İletişime Geçin
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-background border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2024 Kuaför Panel Sistemi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
