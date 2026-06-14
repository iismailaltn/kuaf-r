import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken, sqlToken } from "@/lib/services/locofabric-database"
import { fetchPersonelRowsForBusiness } from "@/lib/personel-directory"
import {
  enrichProductSalesWithStaffNames,
  normalizeProductSaleRows,
  resolveUserIdFromRow,
  type ProductSaleRow,
} from "@/lib/product-sales"
import { apiJson } from "@/lib/api-response"
import {
  getBusinessUserIdFromBody,
  getBusinessUserIdFromRequest,
  matchesBusinessUserId,
  requireBusinessUserId,
  sqlBusinessUserIdRef,
} from "@/lib/business-scope"

function sanitizeSqlString(input: string) {
  return input.replace(/'/g, "''")
}

function sqlUserIdRef(userId: string) {
  const raw = String(userId).trim()
  return /^\d+$/.test(raw) ? raw : `'${sanitizeSqlString(raw)}'`
}

function extractRows<T>(data: unknown): T[] {
  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: T[] }).data
  }
  if (Array.isArray((data as { Data?: unknown })?.Data)) {
    return (data as { Data: T[] }).Data
  }
  if (Array.isArray(data)) {
    return data as T[]
  }
  const single = (data as { data?: T })?.data ?? (data as { Data?: T })?.Data
  if (single && typeof single === "object" && !Array.isArray(single)) {
    return [single]
  }
  return []
}

function getInsertId(data: unknown, row: ProductSaleRow | null) {
  const newId = Number((data as { newId?: number | string })?.newId)
  if (Number.isFinite(newId) && newId > 0) return newId
  const rowId = Number(row?.id)
  return Number.isFinite(rowId) && rowId > 0 ? rowId : 0
}

function getInsertRow(data: unknown): ProductSaleRow | null {
  const row = (data as { data?: ProductSaleRow })?.data ?? (data as { Data?: ProductSaleRow })?.Data
  return row && typeof row === "object" ? row : null
}

async function fetchProductSalesRows(token: string, businessUserId: string) {
  const businessId = sqlBusinessUserIdRef(businessUserId)
  const selectSql = `SELECT id, business_user_id, product_id, product_name, category, customer_name, customer_surname, user_id, staff_name, quantity, unit_price, total_price, sold_at, createdAt, updatedAt FROM product_sales WHERE business_user_id = ${businessId} ORDER BY id DESC`

  try {
    const data = await sqlToken<unknown>(token, selectSql)
    const rows = extractRows<ProductSaleRow>(data)
    if (rows.length > 0) return rows
  } catch {
    // fallback below
  }

  const data = await selectByToken<unknown>(token)
  return extractRows<ProductSaleRow>(data)
}

async function saveSalePersonel(
  token: string,
  saleId: number,
  businessId: string,
  userIdSql: string,
  staffName: string
) {
  const safeName = sanitizeSqlString(staffName)
  const updates = [
    `UPDATE product_sales SET user_id=${userIdSql}, staff_name='${safeName}' WHERE id=${saleId} AND business_user_id=${businessId}`,
    `UPDATE product_sales SET user_id=${userIdSql} WHERE id=${saleId} AND business_user_id=${businessId}`,
    `UPDATE product_sales SET staff_name='${safeName}' WHERE id=${saleId} AND business_user_id=${businessId}`,
  ]

  for (const sql of updates) {
    try {
      await sqlToken(token, sql)
    } catch {
      // try next
    }
  }
}

export async function GET(req: Request) {
  try {
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const filterUserId =
      new URL(req.url).searchParams.get("userId")?.trim() ??
      new URL(req.url).searchParams.get("staffId")?.trim() ??
      ""

    const token = appConfig.token.product_sales
    if (!token) {
      return apiJson({ ok: true, rows: [] })
    }

    const rawRows = (await fetchProductSalesRows(token, businessUserId)).filter((row) =>
      matchesBusinessUserId(row, businessUserId)
    )

    let rows = normalizeProductSaleRows(
      rawRows.filter((row) => !filterUserId || resolveUserIdFromRow(row) === filterUserId)
    )

    try {
      const personelRows = await fetchPersonelRowsForBusiness(businessUserId)
      rows = enrichProductSalesWithStaffNames(rows, personelRows)
    } catch {
      // personel listesi yoksa staff_name kolonundaki deger kullanilir
    }

    return apiJson({ ok: true, rows })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
      ok: false,
      message: "Urun satislari getirilemedi.",
      error: axiosErr?.message ?? String(err),
      upstreamStatus: typeof status === "number" ? status : undefined,
      upstreamData: data,
    }, 502)
  }
}

export async function POST(req: Request) {
  try {
    const token = appConfig.token.product_sales
    if (!token) {
      return apiJson({ ok: false, message: "product_sales token tanimli degil." }, 500)
    }

    const body = (await req.json().catch(() => null)) as
      | {
          businessUserId?: string | number
          productId?: string | number
          productName?: string
          category?: string
          customerName?: string
          customerSurname?: string
          userId?: string | number
          user_id?: string | number
          staffName?: string
          staff_name?: string
          quantity?: number | string
          unitPrice?: number | string
        }
      | null

    const businessUserId = getBusinessUserIdFromBody(body)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const productName = String(body?.productName ?? "").trim()
    const customerName = String(body?.customerName ?? "").trim()
    const customerSurname = String(body?.customerSurname ?? "").trim()
    const userIdRaw = String(body?.userId ?? body?.user_id ?? "").trim()
    const staffNameRaw = String(body?.staffName ?? body?.staff_name ?? "").trim()

    if (!productName || !customerName || !customerSurname) {
      return apiJson({ ok: false, message: "Urun adi ve musteri bilgileri zorunlu." }, 400)
    }
    if (!userIdRaw) {
      return apiJson({ ok: false, message: "Satis yapan personel (user_id) secilmeli." }, 400)
    }
    if (!staffNameRaw) {
      return apiJson({ ok: false, message: "Personel adi zorunlu." }, 400)
    }

    const quantityNum = Number(body?.quantity)
    const quantity = Number.isFinite(quantityNum) && quantityNum > 0 ? Math.floor(quantityNum) : 1
    const unitPriceNum = Number(body?.unitPrice)
    const unitPrice = Number.isFinite(unitPriceNum) && unitPriceNum >= 0 ? unitPriceNum : 0
    const totalPrice = unitPrice * quantity

    const productIdRaw = String(body?.productId ?? "").trim()
    const productIdSql = productIdRaw
      ? /^\d+$/.test(productIdRaw)
        ? productIdRaw
        : `'${sanitizeSqlString(productIdRaw)}'`
      : "NULL"
    const category = sanitizeSqlString(String(body?.category ?? "").trim())
    const businessId = sqlBusinessUserIdRef(businessUserId)
    const userIdSql = sqlUserIdRef(userIdRaw)
    const safeProductName = sanitizeSqlString(productName)
    const safeCustomerName = sanitizeSqlString(customerName)
    const safeCustomerSurname = sanitizeSqlString(customerSurname)
    const safeStaffName = sanitizeSqlString(staffNameRaw)

    const insertWithPersonel = `INSERT INTO product_sales (business_user_id, product_id, product_name, category, customer_name, customer_surname, user_id, staff_name, quantity, unit_price, total_price, sold_at, createdAt, updatedAt) VALUES (${businessId}, ${productIdSql}, '${safeProductName}', '${category}', '${safeCustomerName}', '${safeCustomerSurname}', ${userIdSql}, '${safeStaffName}', ${quantity}, ${unitPrice}, ${totalPrice}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    const insertBase = `INSERT INTO product_sales (business_user_id, product_id, product_name, category, customer_name, customer_surname, quantity, unit_price, total_price, sold_at, createdAt, updatedAt) VALUES (${businessId}, ${productIdSql}, '${safeProductName}', '${category}', '${safeCustomerName}', '${safeCustomerSurname}', ${quantity}, ${unitPrice}, ${totalPrice}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`

    let newId = 0
    let lastError: unknown

    for (const insertSql of [insertWithPersonel, insertBase]) {
      try {
        const result = await sqlToken<unknown>(token, insertSql)
        newId = getInsertId(result, getInsertRow(result))
        if (newId > 0) break
      } catch (err) {
        lastError = err
      }
    }

    if (newId <= 0) {
      throw lastError ?? new Error("Satis kaydi olusturulamadi.")
    }

    await saveSalePersonel(token, newId, businessId, userIdSql, staffNameRaw)

    return apiJson({
      ok: true,
      id: newId,
      user_id: userIdRaw,
      staff_name: staffNameRaw,
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return apiJson({
      ok: false,
      message: "Urun satisi kaydedilemedi.",
      error: axiosErr?.message ?? String(err),
      upstreamStatus: typeof status === "number" ? status : undefined,
      upstreamData: data,
    }, 502)
  }
}
