"use client"

import { useState } from "react"
import type { PerformancePeriod } from "@/lib/session-performance-analytics"
import {
  buildPerformanceReport,
  downloadPerformanceExcel,
  downloadPerformancePdf,
  getPerformanceAnchorLabel,
} from "@/lib/performance-export"
import type { SessionOperation } from "@/lib/session-operations"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from "lucide-react"

const EXPORT_PERIODS: { value: PerformancePeriod; label: string }[] = [
  { value: "daily", label: "Günlük" },
  { value: "monthly", label: "Aylık" },
  { value: "yearly", label: "Yıllık" },
]

interface PerformanceExportPanelProps {
  businessUserId?: string
  shopName?: string
  sessionOperations: SessionOperation[]
  staffNames: string[]
  serviceNames: string[]
  palette: string[]
  isLoading?: boolean
  className?: string
}

function navigateExportDate(date: Date, period: PerformancePeriod, direction: number) {
  const next = new Date(date)
  if (period === "daily") {
    next.setDate(next.getDate() + direction)
  } else if (period === "monthly") {
    next.setMonth(next.getMonth() + direction)
  } else {
    next.setFullYear(next.getFullYear() + direction)
  }
  return next
}

export function PerformanceExportPanel({
  businessUserId,
  shopName,
  sessionOperations,
  staffNames,
  serviceNames,
  palette,
  isLoading = false,
  className,
}: PerformanceExportPanelProps) {
  const [exportPeriod, setExportPeriod] = useState<PerformancePeriod>("monthly")
  const [exportDate, setExportDate] = useState(() => new Date())
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const disabled = isExporting || isLoading || !businessUserId
  const anchorLabel = getPerformanceAnchorLabel(exportDate, exportPeriod)

  const handleExport = async (format: "excel" | "pdf") => {
    if (!businessUserId) {
      setExportError("Rapor için işletme bilgisi gerekli.")
      return
    }

    setExportError(null)
    setIsExporting(true)
    try {
      const report = buildPerformanceReport({
        sessionOperations,
        staffNames,
        serviceNames,
        anchorDate: exportDate,
        period: exportPeriod,
        palette,
        shopName,
      })

      if (format === "excel") {
        await downloadPerformanceExcel(report)
      } else {
        await downloadPerformancePdf(report)
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Dışa aktarma başarısız.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className={cn("rounded-2xl border-border/50 overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">Rapor dışa aktar</CardTitle>
            <CardDescription className="mt-1">
              Seçtiğiniz döneme göre Excel veya PDF indirin
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <Label>Dönem</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={exportPeriod}
            onValueChange={(value) => {
              if (value) {
                setExportPeriod(value as PerformancePeriod)
              }
            }}
            className="w-full grid grid-cols-3"
          >
            {EXPORT_PERIODS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="rounded-lg text-xs px-2 data-[state=on]:bg-emerald-500/10 data-[state=on]:text-emerald-700 data-[state=on]:border-emerald-500/30"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <Label>Tarih</Label>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-lg"
              disabled={disabled}
              onClick={() => setExportDate((d) => navigateExportDate(d, exportPeriod, -1))}
              aria-label="Önceki dönem"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="flex-1 text-center text-sm font-medium truncate px-1">
              {anchorLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-lg"
              disabled={disabled}
              onClick={() => setExportDate((d) => navigateExportDate(d, exportPeriod, 1))}
              aria-label="Sonraki dönem"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              className="w-full rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-600/90 text-white"
              disabled={disabled}
            >
              {isExporting ? <Spinner className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isExporting ? "Hazırlanıyor..." : "Raporu indir"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl">
            <DropdownMenuItem
              className="gap-2 rounded-lg cursor-pointer"
              disabled={disabled}
              onClick={() => void handleExport("excel")}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 rounded-lg cursor-pointer"
              disabled={disabled}
              onClick={() => void handleExport("pdf")}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              PDF (.pdf)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {exportError ? (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
