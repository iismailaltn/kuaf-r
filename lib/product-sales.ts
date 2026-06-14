export interface ProductSaleRow {
  id?: number | string
  business_user_id?: number | string
  businessUserId?: number | string
  product_id?: number | string
  productId?: number | string
  product_name?: string
  productName?: string
  category?: string
  customer_name?: string
  customerName?: string
  customer_surname?: string
  customerSurname?: string
  user_id?: string | number
  userId?: string | number
  staff_id?: string
  staffId?: string
  staff_name?: string
  staffName?: string
  quantity?: number | string
  unit_price?: number | string
  unitPrice?: number | string
  total_price?: number | string
  totalPrice?: number | string
  sold_at?: string
  soldAt?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface ProductSale {
  id: number
  productId: string
  productName: string
  category: string
  customerName: string
  customerSurname: string
  userId: string
  staffName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  soldAt: string | null
}

function normalizeFieldKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function getField(row: ProductSaleRow, candidates: string[]) {
  if (!row || typeof row !== "object") return undefined
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const direct = (row as Record<string, unknown>)[candidate]
    if (direct !== undefined && direct !== null) return direct
    const normalizedCandidate = normalizeFieldKey(candidate)
    const found = entries.find(([key]) => normalizeFieldKey(key) === normalizedCandidate)
    if (found && found[1] !== undefined && found[1] !== null) return found[1]
  }
  return undefined
}

export function resolveStaffNameFromRow(row: ProductSaleRow) {
  return String(
    getField(row, [
      "staff_name",
      "staffName",
      "StaffName",
      "personel_name",
      "personelName",
      "sold_by_name",
      "soldByName",
    ]) ?? ""
  ).trim()
}

export function resolveUserIdFromRow(row: ProductSaleRow) {
  return String(
    getField(row, [
      "user_id",
      "userId",
      "UserId",
      "staff_id",
      "staffId",
      "individual_user_id",
      "individualUserId",
    ]) ?? ""
  ).trim()
}

/** @deprecated use resolveUserIdFromRow */
export function resolveStaffIdFromRow(row: ProductSaleRow) {
  return resolveUserIdFromRow(row)
}

export function enrichProductSalesWithStaffNames(
  rows: ProductSale[],
  personelRows: Array<Record<string, unknown>>
): ProductSale[] {
  const nameByKey = new Map<string, string>()

  for (const row of personelRows) {
    const fullName = String(row.full_name ?? row.fullName ?? "").trim()
    const firstName = String(row.first_name ?? row.firstName ?? "").trim()
    const lastName = String(row.last_name ?? row.lastName ?? "").trim()
    const name = fullName || `${firstName} ${lastName}`.trim()
    if (!name) continue

    const keys = [
      row.user_id,
      row.userId,
      row.individual_user_id,
      row.individualUserId,
      row.id,
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)

    for (const key of keys) {
      nameByKey.set(key, name)
    }
  }

  return rows.map((sale) => {
    if (sale.staffName) return sale
    const resolved = nameByKey.get(sale.userId) ?? ""
    return resolved ? { ...sale, staffName: resolved } : sale
  })
}

function toPrice(value: unknown) {
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : 0
}

function toTimestampMs(value: unknown) {
  const raw = String(value ?? "").trim()
  if (!raw) return 0
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T")
  const parsed = Date.parse(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizeProductSaleRows(rows: ProductSaleRow[]): ProductSale[] {
  const mapped = rows.map((row, index) => {
    const idNum = Number(getField(row, ["id", "ID"]))
    const quantityNum = Number(getField(row, ["quantity", "Quantity"]))
    const quantity = Number.isFinite(quantityNum) && quantityNum > 0 ? quantityNum : 1
    const unitPrice = toPrice(getField(row, ["unit_price", "unitPrice"]))
    const totalFromRow = toPrice(getField(row, ["total_price", "totalPrice"]))
    const totalPrice = totalFromRow > 0 ? totalFromRow : unitPrice * quantity
    const soldAt = String(getField(row, ["sold_at", "soldAt", "createdAt", "created_at"]) ?? "").trim() || null

    return {
      id: Number.isFinite(idNum) && idNum > 0 ? idNum : index + 1,
      productId: String(getField(row, ["product_id", "productId"]) ?? "").trim(),
      productName: String(getField(row, ["product_name", "productName"]) ?? "").trim(),
      category: String(getField(row, ["category", "Category"]) ?? "").trim(),
      customerName: String(getField(row, ["customer_name", "customerName"]) ?? "").trim(),
      customerSurname: String(getField(row, ["customer_surname", "customerSurname"]) ?? "").trim(),
      userId: resolveUserIdFromRow(row),
      staffName: resolveStaffNameFromRow(row),
      quantity,
      unitPrice,
      totalPrice,
      soldAt,
      sortMs: toTimestampMs(soldAt),
    }
  })

  return mapped
    .filter((row) => row.productName)
    .sort((a, b) => b.sortMs - a.sortMs)
    .map(({ sortMs: _sortMs, ...row }) => row)
}
