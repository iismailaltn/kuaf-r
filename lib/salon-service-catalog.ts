export type SalonServiceCatalogItem = {
  id: string
  label: string
  category: string
  durationMinutes?: number
}

type CatalogSubsection = {
  id: string
  title: string
  categories: string[]
}

export type CatalogSection = {
  id: string
  title: string
  note?: string
  categories?: string[]
  subsections?: CatalogSubsection[]
}

/** Isletme ayarlari ekraninda gosterim sirasi ve basliklar. */
export const SALON_SERVICE_CATALOG_SECTIONS: CatalogSection[] = [
  {
    id: "kadin-kuaforu",
    title: "Kadın Kuaförü",
    categories: ["Kadın Kuaförü"],
  },
  {
    id: "erkek-berberi",
    title: "Erkek Berberi / Erkek Kuaförü",
    categories: ["Erkek Berberi / Erkek Kuaförü"],
  },
  {
    id: "guzellik-salonu",
    title: "Güzellik Salonu Hizmetleri",
    subsections: [
      {
        id: "guzellik-cilt",
        title: "Cilt Bakımı",
        categories: ["Güzellik Salonu - Cilt Bakımı"],
      },
      {
        id: "guzellik-epilasyon",
        title: "Epilasyon",
        categories: ["Güzellik Salonu - Epilasyon"],
      },
      {
        id: "guzellik-sir-agda",
        title: "Sir ağda",
        categories: ["Güzellik Salonu - Sir ağda"],
      },
      {
        id: "guzellik-kas-kirpik",
        title: "Kaş & Kirpik",
        categories: ["Güzellik Salonu - Kaş & Kirpik"],
      },
      {
        id: "guzellik-el-ayak",
        title: "El & Ayak Bakımı",
        categories: ["Güzellik Salonu - El & Ayak Bakımı"],
      },
      {
        id: "guzellik-makyaj",
        title: "Makyaj",
        categories: ["Güzellik Salonu - Makyaj"],
      },
    ],
  },
  {
    id: "estetik-medikal",
    title: "Estetik & Medikal Güzellik",
    note: "Bazı merkezlerde güzellik salonundan ayrıdır. Bazıları için sağlık bakanlığı ruhsatı gerekir.",
    categories: ["Estetik & Medikal Güzellik"],
  },
  {
    id: "spa-bakim",
    title: "Spa & Bakım Hizmetleri",
    categories: ["Spa & Bakım Hizmetleri"],
  },
]

export function normalizeCategoryKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Yalnizca veritabanindaki category alani ile birebir eslesme. */
export function matchesCategoryExact(serviceCategory: string, allowedCategories: string[]) {
  const normalizedService = normalizeCategoryKey(serviceCategory)
  if (!normalizedService) {
    return false
  }
  return allowedCategories.some((item) => normalizeCategoryKey(item) === normalizedService)
}

export function getAllowedCategoriesForSection(sectionId: string) {
  const section = SALON_SERVICE_CATALOG_SECTIONS.find((item) => item.id === sectionId)
  if (!section) {
    return []
  }
  const categories: string[] = [...(section.categories ?? [])]
  for (const subsection of section.subsections ?? []) {
    categories.push(...subsection.categories)
  }
  return categories
}

export function filterServicesByCatalogSection(
  services: SalonServiceCatalogItem[],
  sectionId: string,
) {
  const allowed = getAllowedCategoriesForSection(sectionId)
  if (!allowed.length) {
    return []
  }
  return services.filter((service) => matchesCategoryExact(service.category, allowed))
}

export function filterServicesByCategory(
  services: SalonServiceCatalogItem[],
  category: string,
) {
  return services.filter((service) => matchesCategoryExact(service.category, [category]))
}

export type BuiltCatalogSubsection = {
  id: string
  title: string
  services: SalonServiceCatalogItem[]
}

export type BuiltCatalogSection = {
  id: string
  title: string
  note?: string
  services: SalonServiceCatalogItem[]
  subsections: BuiltCatalogSubsection[]
}

export function buildSalonServiceCatalog(services: SalonServiceCatalogItem[]) {
  const assigned = new Set<string>()
  const sections: BuiltCatalogSection[] = []

  for (const section of SALON_SERVICE_CATALOG_SECTIONS) {
    const built: BuiltCatalogSection = {
      id: section.id,
      title: section.title,
      note: section.note,
      services: [],
      subsections: [],
    }

    if (section.categories?.length) {
      built.services = services.filter((service) => {
        if (!matchesCategoryExact(service.category, section.categories!)) {
          return false
        }
        assigned.add(service.id)
        return true
      })
    }

    if (section.subsections?.length) {
      for (const subsection of section.subsections) {
        const subsectionServices = services.filter((service) => {
          if (!matchesCategoryExact(service.category, subsection.categories)) {
            return false
          }
          assigned.add(service.id)
          return true
        })
        if (subsectionServices.length > 0) {
          built.subsections.push({
            id: subsection.id,
            title: subsection.title,
            services: subsectionServices,
          })
        }
      }
    }

    const hasContent = built.services.length > 0 || built.subsections.length > 0
    if (hasContent) {
      sections.push(built)
    }
  }

  const other = services.filter((service) => !assigned.has(service.id))
  if (other.length > 0) {
    sections.push({
      id: "diger-hizmetler",
      title: "Diğer Hizmetler",
      services: other,
      subsections: [],
    })
  }

  return sections
}

