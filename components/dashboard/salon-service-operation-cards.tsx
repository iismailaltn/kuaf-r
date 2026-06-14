"use client"

import { useEffect, useMemo, useState } from "react"
import type { SalonService } from "@/lib/salon-services"
import {
  buildSalonServiceCatalog,
  type BuiltCatalogSection,
  type SalonServiceCatalogItem,
} from "@/lib/salon-service-catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Check,
  ChevronRight,
  Clock,
  Layers,
  Scissors,
  Sparkles,
} from "lucide-react"

export type ServiceSettingsState = "idle" | "editing" | "saved"

type SalonServiceSettingsCardProps = {
  serviceId: string
  name: string
  state: ServiceSettingsState
  price: string
  durationMinutes?: number
  onSelect: () => void
  onPriceChange: (value: string) => void
  onSave: () => void
  onRemove: () => void
  onEditStages?: () => void
}

export function SalonServiceSettingsCard({
  name,
  state,
  price,
  durationMinutes,
  onSelect,
  onPriceChange,
  onSave,
  onRemove,
  onEditStages,
}: SalonServiceSettingsCardProps) {
  const isSaved = state === "saved"
  const isEditing = state === "editing"

  return (
    <Card
      className={cn(
        "group gap-0 overflow-hidden border py-0 shadow-sm transition-all duration-200 h-[200px]",
        isSaved && "border-emerald-500/50 bg-emerald-500/5 shadow-emerald-500/10",
        isEditing && "border-primary ring-2 ring-primary/20 shadow-md",
        state === "idle" && "border-border/80 hover:border-border hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "h-1 w-full transition-opacity",
          isSaved && "bg-gradient-to-r from-emerald-500 to-teal-500 opacity-100",
          isEditing && "bg-gradient-to-r from-primary to-violet-500 opacity-100",
          state === "idle" && "bg-muted opacity-60 group-hover:opacity-100",
        )}
      />

      <CardContent className="p-0 flex flex-col h-full">
        <button
          type="button"
          onClick={onSelect}
          className="flex w-full items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1"
        >
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              isSaved && "bg-emerald-500 text-white",
              isEditing && "bg-primary text-primary-foreground",
              state === "idle" && "bg-muted text-muted-foreground",
            )}
          >
            {isSaved ? <Check className="size-4" /> : <Scissors className="size-4" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "text-sm font-semibold leading-snug line-clamp-2",
                  isSaved && "text-emerald-800 dark:text-emerald-300",
                  isEditing && "text-foreground",
                  state === "idle" && "text-muted-foreground",
                )}
              >
                {name}
              </p>
              {state === "idle" ? (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {state === "idle" ? (
                <Badge variant="outline" className="rounded-md text-[10px] font-normal">
                  Pasif
                </Badge>
              ) : null}
              {isEditing ? (
                <Badge className="rounded-md text-[10px] font-normal">Fiyat girin</Badge>
              ) : null}
              {isSaved ? (
                <Badge className="rounded-md border-0 bg-emerald-600 text-[10px] font-normal text-white hover:bg-emerald-600">
                  Aktif
                </Badge>
              ) : null}
              {durationMinutes && durationMinutes > 0 ? (
                <Badge variant="secondary" className="rounded-md text-[10px] font-normal gap-0.5">
                  <Clock className="size-2.5" />
                  {durationMinutes} dk
                </Badge>
              ) : null}
              {isSaved && price ? (
                <Badge variant="outline" className="rounded-md text-[10px] font-semibold tabular-nums">
                  {price} ₺
                </Badge>
              ) : null}
            </div>
          </div>
        </button>

        {isSaved && onEditStages ? (
          <div className="border-t border-border/60 px-4 pb-4 pt-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full rounded-lg border-emerald-500/30 text-xs text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
              onClick={onEditStages}
            >
              <Layers className="size-3.5" />
              Asamalari duzenle
            </Button>
          </div>
        ) : null}

        {isEditing ? (
          <div className="space-y-3 border-t border-border/60 bg-muted/30 px-4 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  autoFocus
                  value={price}
                  onChange={(e) => onPriceChange(e.target.value)}
                  placeholder="0"
                  className="h-9 rounded-lg pr-8 text-right font-semibold tabular-nums"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  ₺
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" className="h-8 flex-1 rounded-lg text-xs" onClick={onSave}>
                <Check className="size-3.5" />
                Kaydet
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 flex-1 rounded-lg text-xs"
                onClick={onRemove}
              >
                Kaldir
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

type SalonServicePickerCardProps = {
  service: SalonService
  selected: boolean
  onToggle: () => void
}

export function SalonServicePickerCard({ service, selected, onToggle }: SalonServicePickerCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
    >
      <Card
        className={cn(
          "gap-0 overflow-hidden border py-0 shadow-sm transition-all duration-200",
          selected
            ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10"
            : "border-border/80 hover:border-emerald-500/40 hover:shadow-md",
        )}
      >
        <div
          className={cn(
            "h-1 w-full",
            selected
              ? "bg-gradient-to-r from-emerald-500 to-teal-400 opacity-100"
              : "bg-muted opacity-50 group-hover:opacity-90",
          )}
        />
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              selected ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground",
            )}
          >
            {selected ? <Check className="size-4" /> : <Sparkles className="size-4 opacity-70" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug line-clamp-2">{service.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {service.durationMinutes > 0 ? (
                <Badge variant="secondary" className="rounded-md text-[10px] font-normal">
                  <Clock className="size-2.5" />
                  {service.durationMinutes} dk
                </Badge>
              ) : null}
              {service.price > 0 ? (
                <Badge variant="outline" className="rounded-md text-[10px] font-medium tabular-nums">
                  {service.price} ₺
                </Badge>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

export function SalonServicePickerGrid({
  services,
  selectedNames,
  onToggle,
}: {
  services: SalonService[]
  selectedNames: string[]
  onToggle: (name: string) => void
}) {
  if (!services.length) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Aktif hizmet yok. Once Ayarlar → Isletme bolumunden hizmet ekleyin.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {services.map((service) => (
        <SalonServicePickerCard
          key={service.id}
          service={service}
          selected={selectedNames.includes(service.name)}
          onToggle={() => onToggle(service.name)}
        />
      ))}
    </div>
  )
}

type SalonServiceSettingsGridProps = {
  services: SalonServiceCatalogItem[]
  serviceStates: Record<string, ServiceSettingsState>
  servicePrices: Record<string, string>
  onCardClick: (id: string) => void
  onPriceChange: (id: string, value: string) => void
  onSave: (id: string) => void
  onRemove: (id: string) => void
  onEditStages?: (id: string) => void
}

function SalonServiceSettingsGrid({
  services,
  serviceStates,
  servicePrices,
  onCardClick,
  onPriceChange,
  onSave,
  onRemove,
  onEditStages,
}: SalonServiceSettingsGridProps) {
  if (!services.length) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-fr">
      {services.map((service) => {
        const state = serviceStates?.[service.id] ?? "idle"
        return (
          <div key={service.id} className="h-full">
            <SalonServiceSettingsCard
              serviceId={service.id}
              name={service.label}
              state={state}
              price={servicePrices?.[service.id] ?? ""}
              durationMinutes={service.durationMinutes}
              onSelect={() => onCardClick(service.id)}
              onPriceChange={(value) => onPriceChange(service.id, value)}
              onSave={() => onSave(service.id)}
              onRemove={() => onRemove(service.id)}
              onEditStages={
                state === "saved" && onEditStages ? () => onEditStages(service.id) : undefined
              }
            />
          </div>
        )
      })}
    </div>
  )
}

function sectionServiceCount(section: BuiltCatalogSection) {
  return (
    section.services.length +
    section.subsections.reduce((sum, subsection) => sum + subsection.services.length, 0)
  )
}

function visibleServicesForSection(
  section: BuiltCatalogSection | undefined,
  activeSubsectionId: string | null,
) {
  if (!section) {
    return []
  }
  if (section.subsections.length > 0) {
    const subsection =
      section.subsections.find((item) => item.id === activeSubsectionId) ?? section.subsections[0]
    return subsection?.services ?? []
  }
  return section.services
}

export function SalonServiceSettingsCatalog(props: SalonServiceSettingsGridProps) {
  const { services, serviceStates, servicePrices, onCardClick, onPriceChange, onSave, onRemove, onEditStages } =
    props
  const sections = useMemo(() => buildSalonServiceCatalog(services), [services])
  const [activeSectionId, setActiveSectionId] = useState("")
  const [activeSubsectionId, setActiveSubsectionId] = useState<string | null>(null)

  const activeSection = sections.find((section) => section.id === activeSectionId)

  useEffect(() => {
    if (!sections.length) {
      setActiveSectionId("")
      setActiveSubsectionId(null)
      return
    }
    if (!sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0].id)
    }
  }, [sections, activeSectionId])

  useEffect(() => {
    if (!activeSection?.subsections.length) {
      setActiveSubsectionId(null)
      return
    }
    if (!activeSection.subsections.some((item) => item.id === activeSubsectionId)) {
      setActiveSubsectionId(activeSection.subsections[0]?.id ?? null)
    }
  }, [activeSection, activeSubsectionId])

  const visibleServices = useMemo(
    () => visibleServicesForSection(activeSection, activeSubsectionId),
    [activeSection, activeSubsectionId],
  )

  const countSelected = (items: SalonServiceCatalogItem[]) =>
    items.filter((item) => (serviceStates[item.id] ?? "idle") !== "idle").length

  if (!services.length) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Hizmet listesi yuklenemedi veya bos.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Toplam {services.length} hizmet · Kategori secin; yalnizca secili grubun hizmetleri listelenir
      </p>

      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const total = sectionServiceCount(section)
          const selected = countSelected([
            ...section.services,
            ...section.subsections.flatMap((subsection) => subsection.services),
          ])
          const isActive = section.id === activeSectionId

          return (
            <Button
              key={section.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-auto min-h-9 whitespace-normal text-left py-2"
              onClick={() => setActiveSectionId(section.id)}
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-semibold leading-tight">{section.title}</span>
                <span className="text-[10px] opacity-80">
                  {total} hizmet{selected > 0 ? ` · ${selected} secili` : ""}
                </span>
              </span>
            </Button>
          )
        })}
      </div>

      {activeSection?.subsections.length ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
          {activeSection.subsections.map((subsection) => {
            const isActive = subsection.id === activeSubsectionId
            return (
              <Button
                key={subsection.id}
                type="button"
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className="h-8"
                onClick={() => setActiveSubsectionId(subsection.id)}
              >
                {subsection.title}
                <Badge variant="outline" className="ml-1 rounded-md text-[10px]">
                  {subsection.services.length}
                </Badge>
              </Button>
            )
          })}
        </div>
      ) : null}

      {activeSection?.note ? (
        <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {activeSection.note}
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-sm font-semibold text-foreground">{activeSection?.title}</h5>
          <Badge variant="secondary" className="rounded-md text-[10px]">
            {visibleServices.length} hizmet gosteriliyor
          </Badge>
        </div>
        {visibleServices.length > 0 ? (
          <SalonServiceSettingsGrid
            services={visibleServices}
            serviceStates={serviceStates}
            servicePrices={servicePrices}
            onCardClick={onCardClick}
            onPriceChange={onPriceChange}
            onSave={onSave}
            onRemove={onRemove}
            onEditStages={onEditStages}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Bu kategoride hizmet bulunamadi.</p>
        )}
      </div>
    </div>
  )
}
