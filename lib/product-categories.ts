export const productCategoryOptions = [
  { value: "1", label: "Sac Bakim" },
  { value: "2", label: "Sac Boyasi" },
  { value: "3", label: "Styling" },
  { value: "4", label: "Cilt & Makyaj" },
] as const

type ProductCategoryRow = {
  category?: unknown
  category_name?: unknown
  categoryName?: unknown
  categoryId?: unknown
}

export function getProductCategoryId(row: ProductCategoryRow, fallback = 1) {
  const categoryId = Number(row.categoryId)
  if (Number.isFinite(categoryId) && categoryId > 0) {
    return categoryId
  }

  const categoryValue = String(row.category ?? "").trim()
  if (/^\d+$/.test(categoryValue)) {
    const parsed = Number(categoryValue)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return fallback
}

export function getProductCategoryLabel(row: ProductCategoryRow) {
  const directName = String(row.category_name ?? row.categoryName ?? "").trim()
  if (directName) {
    return directName
  }

  const categoryValue = String(row.category ?? "").trim()
  if (categoryValue && !/^\d+$/.test(categoryValue)) {
    return categoryValue
  }

  const categoryId = String(row.categoryId ?? categoryValue ?? "").trim()
  const match = productCategoryOptions.find((option) => option.value === categoryId)
  if (match) {
    return match.label
  }

  return categoryId ? `Kategori ${categoryId}` : "-"
}
