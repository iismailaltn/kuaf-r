"use client"

import { useMemo, useState } from "react"
import { apiFetch } from "@/lib/api-fetch"
import { useSalonServices } from "@/hooks/use-salon-services"
import {
  buildSalonServiceCatalog,
  type BuiltCatalogSection,
  type SalonServiceCatalogItem,
} from "@/lib/salon-service-catalog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowRight, Check, Loader2, Search } from "lucide-react"

interface ExpertiseOnboardingProps {
  userId: string
  shopName?: string
  onComplete: () => void
}

function filterSections(sections: BuiltCatalogSection[], query: string): BuiltCatalogSection[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return sections

  return sections
    .map((section) => {
      const services = section.services.filter((service) =>
        service.label.toLowerCase().includes(normalized),
      )
      const subsections = section.subsections
        .map((subsection) => ({
          ...subsection,
          services: subsection.services.filter((service) =>
            service.label.toLowerCase().includes(normalized),
          ),
        }))
        .filter((subsection) => subsection.services.length > 0)

      return { ...section, services, subsections }
    })
    .filter((section) => section.services.length > 0 || section.subsections.length > 0)
}

function ServiceOption({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-background hover:bg-muted/40",
      )}
    >
      <div
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background",
        )}
      >
        {checked ? <Check className="size-3" /> : null}
      </div>
      <span className="text-sm font-medium text-foreground leading-snug">{label}</span>
    </div>
  )
}

function ServiceGrid({
  services,
  selected,
  onToggle,
}: {
  services: SalonServiceCatalogItem[]
  selected: string[]
  onToggle: (label: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
      {services.map((service) => (
        <ServiceOption
          key={service.id}
          label={service.label}
          checked={selected.includes(service.label)}
          onToggle={() => onToggle(service.label)}
        />
      ))}
    </div>
  )
}

export function ExpertiseOnboarding({ userId, shopName, onComplete }: ExpertiseOnboardingProps) {
  const { activeServices, isLoading, reload } = useSalonServices()
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const catalogItems: SalonServiceCatalogItem[] = useMemo(
    () =>
      activeServices.map((service) => ({
        id: String(service.id),
        label: service.name,
        category: service.category,
      })),
    [activeServices],
  )

  const sections = useMemo(() => buildSalonServiceCatalog(catalogItems), [catalogItems])
  const visibleSections = useMemo(() => filterSections(sections, search), [sections, search])

  const toggle = (label: string) => {
    setSelected((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    )
  }

  const handleSave = async () => {
    if (selected.length === 0) {
      alert("Devam etmek için en az bir hizmet seçmelisin.")
      return
    }

    setIsSaving(true)
    try {
      const res = await apiFetch("/api/user-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, specialty: selected }),
      })
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message ?? "Uzmanlık alanları kaydedilemedi.")
      }
      onComplete()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Kayıt başarısız.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Uzmanlık alanlarını seç</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {shopName ? `${shopName}, ` : ""}hangi hizmetlerde çalıştığını belirt. Süre ve fiyat bilgileri
            işletmene katıldığında işletme tarafından ayarlanır.
          </p>
        </div>
        <div className="text-sm text-muted-foreground shrink-0">
          <span className="font-semibold text-foreground">{selected.length}</span> hizmet seçildi
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Hizmet ara..."
          className="h-10 pl-9 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="size-5 animate-spin" />
          Hizmetler yükleniyor...
        </div>
      ) : activeServices.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Uzmanlık alanları listesi yüklenemedi. Lütfen tekrar deneyin.
            </p>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => reload()}>
              Yeniden dene
            </Button>
          </CardContent>
        </Card>
      ) : visibleSections.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            Aramanla eşleşen hizmet bulunamadı.
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            {visibleSections.map((section) => {
              const sectionSelectedCount = [
                ...section.services,
                ...section.subsections.flatMap((subsection) => subsection.services),
              ].filter((service) => selected.includes(service.label)).length

              return (
                <section key={section.id} className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                      {section.note ? (
                        <p className="text-xs text-muted-foreground mt-1">{section.note}</p>
                      ) : null}
                    </div>
                    {sectionSelectedCount > 0 ? (
                      <span className="text-xs font-medium text-primary shrink-0">
                        {sectionSelectedCount} seçili
                      </span>
                    ) : null}
                  </div>

                  {section.services.length > 0 ? (
                    <ServiceGrid services={section.services} selected={selected} onToggle={toggle} />
                  ) : null}

                  {section.subsections.length > 0 ? (
                    <div className={cn("space-y-5", section.services.length > 0 && "mt-5")}>
                      {section.subsections.map((subsection) => (
                        <div key={subsection.id}>
                          <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            {subsection.title}
                          </h3>
                          <ServiceGrid
                            services={subsection.services}
                            selected={selected}
                            onToggle={toggle}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-end gap-4">
          <p className="hidden sm:block text-sm text-muted-foreground">
            {selected.length > 0
              ? `${selected.length} hizmet seçildi`
              : "Devam etmek için en az bir hizmet seç"}
          </p>
          <Button
            type="button"
            disabled={isSaving || isLoading || selected.length === 0}
            className="rounded-xl px-6 gap-2"
            onClick={() => void handleSave()}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                Devam et
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
