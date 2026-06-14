import type { SessionOperation } from "@/lib/session-operations"
import {
  buildEmployeeDurationChart,
  buildEmployeeOperationChart,
  buildOperationsTrendChart,
  buildPeakDaysChart,
  buildPeakHoursChart,
  buildRevenueByServiceChart,
  countCompletedInRange,
  type PerformancePeriod,
} from "@/lib/session-performance-analytics"

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
]

const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  daily: "Günlük",
  monthly: "Aylık",
  yearly: "Yıllık",
}

export interface PerformanceReportInput {
  sessionOperations: SessionOperation[]
  staffNames: string[]
  serviceNames: string[]
  anchorDate: Date
  period: PerformancePeriod
  palette: string[]
  shopName?: string
}

export interface PerformanceReport {
  meta: {
    shopName: string
    period: PerformancePeriod
    periodLabel: string
    anchorLabel: string
    generatedAt: string
  }
  summary: {
    totalOperations: number
    totalServiceRevenue: number
  }
  employees: Array<{ name: string; islem: number }>
  durations: Array<{ name: string; sure: number; hedef: number }>
  operationsTrend: Array<Record<string, string | number>>
  operationsTrendColumns: { key: string; label: string }[]
  services: Array<{ name: string; kazanc: number }>
  peak: Array<Record<string, string | number>>
  peakColumns: { key: string; label: string }[]
  peakTitle: string
}

export function getPerformanceAnchorLabel(date: Date, period: PerformancePeriod) {
  if (period === "daily") {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  }
  if (period === "monthly") {
    return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  }
  return String(date.getFullYear())
}

function buildFileStem(report: PerformanceReport) {
  const safePeriod = report.meta.period
  const safeDate = report.meta.anchorLabel
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ğüşıöçĞÜŞİÖÇ]/gi, "")
  return `performans-${safePeriod}-${safeDate}`
}

export function buildPerformanceReport(input: PerformanceReportInput): PerformanceReport {
  const { sessionOperations, staffNames, serviceNames, anchorDate, period, palette, shopName } =
    input

  const employeeRows = buildEmployeeOperationChart(
    sessionOperations,
    anchorDate,
    period,
    palette,
    staffNames,
  )
  const durationRows = buildEmployeeDurationChart(
    sessionOperations,
    anchorDate,
    period,
    staffNames,
  )
  const operationsChart = buildOperationsTrendChart(sessionOperations, anchorDate, period)
  const serviceRows = buildRevenueByServiceChart(
    sessionOperations,
    anchorDate,
    period,
    palette,
    serviceNames,
  )

  const operationsTrendColumns =
    operationsChart.xKey === "gun"
      ? [
          { key: "gun", label: "Gün" },
          { key: "islem", label: "İşlem" },
          { key: "musteri", label: "Müşteri" },
        ]
      : operationsChart.xKey === "ay"
        ? [
            { key: "ay", label: "Ay" },
            { key: "islem", label: "İşlem" },
            { key: "musteri", label: "Müşteri" },
          ]
        : [
            { key: "yil", label: "Yıl" },
            { key: "islem", label: "İşlem" },
            { key: "musteri", label: "Müşteri" },
          ]

  let peak: Array<Record<string, string | number>> = []
  let peakColumns: { key: string; label: string }[] = []
  let peakTitle = "Yoğunluk"

  if (period === "daily") {
    peak = buildPeakHoursChart(sessionOperations, anchorDate)
    peakColumns = [
      { key: "saat", label: "Saat" },
      { key: "musteri", label: "İşlem sayısı" },
    ]
    peakTitle = "Yoğun saatler"
  } else if (period === "monthly") {
    peak = buildPeakDaysChart(sessionOperations, anchorDate)
    peakColumns = [
      { key: "gun", label: "Gün" },
      { key: "musteri", label: "İşlem sayısı" },
    ]
    peakTitle = "Yoğun günler"
  } else {
    const monthlyTrend = buildOperationsTrendChart(sessionOperations, anchorDate, "monthly")
    peak = monthlyTrend.data.map((row) => ({
      ay: String(row.ay ?? ""),
      islem: row.islem,
    }))
    peakColumns = [
      { key: "ay", label: "Ay" },
      { key: "islem", label: "İşlem sayısı" },
    ]
    peakTitle = "Aylık işlem dağılımı"
  }

  const totalServiceRevenue = serviceRows.reduce((sum, row) => sum + row.kazanc, 0)

  return {
    meta: {
      shopName: shopName?.trim() || "Salon",
      period,
      periodLabel: PERIOD_LABELS[period],
      anchorLabel: getPerformanceAnchorLabel(anchorDate, period),
      generatedAt: new Date().toLocaleString("tr-TR"),
    },
    summary: {
      totalOperations: countCompletedInRange(sessionOperations, anchorDate, period),
      totalServiceRevenue,
    },
    employees: employeeRows.map((row) => ({ name: row.name, islem: row.islem })),
    durations: durationRows.map((row) => ({
      name: row.name,
      sure: row.sure,
      hedef: row.hedef,
    })),
    operationsTrend: operationsChart.data as Array<Record<string, string | number>>,
    operationsTrendColumns,
    services: serviceRows.map((row) => ({ name: row.name, kazanc: row.kazanc })),
    peak,
    peakColumns,
    peakTitle,
  }
}

const PDF_HEAD_RGB: [number, number, number] = [16, 185, 129]
const PDF_ALT_RGB: [number, number, number] = [249, 250, 251]

type PdfDoc = {
  internal: { pageSize: { getHeight: () => number } }
  addPage: () => void
  setFont: (font: string, style: string) => void
  setFontSize: (size: number) => void
  setTextColor: (r: number, g?: number, b?: number) => void
  text: (text: string, x: number, y: number) => void
  save: (filename: string) => void
  lastAutoTable?: { finalY: number }
}

type AutoTableFn = (
  doc: PdfDoc,
  options: Record<string, unknown>,
) => void

function pdfEnsureSpace(doc: PdfDoc, y: number, needed = 36) {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y > pageHeight - needed) {
    doc.addPage()
    return 14
  }
  return y
}

function pdfAppendSection(
  autoTable: AutoTableFn,
  doc: PdfDoc,
  title: string,
  head: string[],
  body: (string | number)[][],
  startY: number,
) {
  let y = pdfEnsureSpace(doc, startY, 40)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(23, 23, 23)
  doc.text(title, 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [head],
    body:
      body.length > 0
        ? body.map((row) => row.map((cell) => String(cell)))
        : [head.map((_, index) => (index === 0 ? "Veri yok" : ""))],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2, textColor: [23, 23, 23] },
    headStyles: {
      fillColor: PDF_HEAD_RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: PDF_ALT_RGB },
    margin: { left: 14, right: 14 },
  })

  return (doc.lastAutoTable?.finalY ?? y) + 10
}

async function loadXlsx() {
  const module = await import("xlsx")
  return module.default ?? module
}

async function loadPdfLibs() {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf/dist/jspdf.es.min.js"),
    import("jspdf-autotable"),
  ])
  const autoTable = (autoTableModule.default ?? autoTableModule) as AutoTableFn
  return { jsPDF, autoTable }
}

export async function downloadPerformanceExcel(report: PerformanceReport) {
  if (typeof window === "undefined") {
    return
  }

  const XLSX = await loadXlsx()
  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Performans Raporu"],
    ["Salon", report.meta.shopName],
    ["Dönem", report.meta.periodLabel],
    ["Tarih", report.meta.anchorLabel],
    ["Oluşturulma", report.meta.generatedAt],
    [],
    ["Toplam işlem", report.summary.totalOperations],
    ["Hizmet cirosu (TL)", report.summary.totalServiceRevenue],
  ])
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Özet")

  const employeeSheet = XLSX.utils.json_to_sheet(
    report.employees.map((row) => ({
      Çalışan: row.name,
      "İşlem sayısı": row.islem,
    })),
  )
  XLSX.utils.book_append_sheet(workbook, employeeSheet, "Çalışan işlem")

  const durationSheet = XLSX.utils.json_to_sheet(
    report.durations.map((row) => ({
      Çalışan: row.name,
      "Ortalama süre (dk)": row.sure,
      "Salon ortalaması (dk)": row.hedef,
    })),
  )
  XLSX.utils.book_append_sheet(workbook, durationSheet, "İşlem süreleri")

  const trendSheet = XLSX.utils.json_to_sheet(
    report.operationsTrend.map((row) => {
      const mapped: Record<string, string | number> = {}
      report.operationsTrendColumns.forEach((col) => {
        mapped[col.label] = row[col.key] ?? ""
      })
      return mapped
    }),
  )
  XLSX.utils.book_append_sheet(workbook, trendSheet, "İşlem trendi")

  const serviceSheet = XLSX.utils.json_to_sheet(
    report.services.map((row) => ({
      Hizmet: row.name,
      "Kazanç (TL)": row.kazanc,
    })),
  )
  XLSX.utils.book_append_sheet(workbook, serviceSheet, "Hizmet kazancı")

  const peakSheet = XLSX.utils.json_to_sheet(
    report.peak.map((row) => {
      const mapped: Record<string, string | number> = {}
      report.peakColumns.forEach((col) => {
        mapped[col.label] = row[col.key] ?? ""
      })
      return mapped
    }),
  )
  XLSX.utils.book_append_sheet(workbook, peakSheet, report.peakTitle.slice(0, 31))

  XLSX.writeFile(workbook, `${buildFileStem(report)}.xlsx`)
}

export async function downloadPerformancePdf(report: PerformanceReport) {
  if (typeof window === "undefined") {
    return
  }

  const { jsPDF, autoTable } = await loadPdfLibs()
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" }) as PdfDoc
  let y = 16

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(23, 23, 23)
  doc.text("Performans Raporu", 14, y)
  y += 8

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(report.meta.shopName, 14, y)
  y += 5
  doc.text(`Donem: ${report.meta.periodLabel} · ${report.meta.anchorLabel}`, 14, y)
  y += 5
  doc.text(`Olusturulma: ${report.meta.generatedAt}`, 14, y)
  y += 8

  autoTable(doc, {
    startY: y,
    body: [
      ["Toplam islem", report.summary.totalOperations.toLocaleString("tr-TR")],
      ["Hizmet cirosu (TL)", report.summary.totalServiceRevenue.toLocaleString("tr-TR")],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  })
  y = (doc.lastAutoTable?.finalY ?? y) + 10

  y = pdfAppendSection(
    autoTable,
    doc,
    "Calisan islem sayisi",
    ["Calisan", "Islem"],
    report.employees.map((row) => [row.name, row.islem]),
    y,
  )

  y = pdfAppendSection(
    autoTable,
    doc,
    "Ortalama islem sureleri (dk)",
    ["Calisan", "Ortalama", "Salon ort."],
    report.durations.map((row) => [row.name, row.sure, row.hedef]),
    y,
  )

  y = pdfAppendSection(
    autoTable,
    doc,
    "Islem trendi",
    report.operationsTrendColumns.map((col) => col.label),
    report.operationsTrend.map((row) =>
      report.operationsTrendColumns.map((col) => row[col.key] ?? ""),
    ),
    y,
  )

  y = pdfAppendSection(
    autoTable,
    doc,
    "Hizmet kazanci",
    ["Hizmet", "Kazanc (TL)"],
    report.services.map((row) => [row.name, row.kazanc.toLocaleString("tr-TR")]),
    y,
  )

  pdfAppendSection(
    autoTable,
    doc,
    report.peakTitle,
    report.peakColumns.map((col) => col.label),
    report.peak.map((row) => report.peakColumns.map((col) => row[col.key] ?? "")),
    y,
  )

  doc.save(`${buildFileStem(report)}.pdf`)
}
