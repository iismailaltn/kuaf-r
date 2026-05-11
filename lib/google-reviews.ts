export type GoogleReview = {
  id: string
  author: string
  authorPhoto?: string
  rating: number
  text: string
  time: string
  relativeTime: string
}

type LocalizedText = {
  text?: string
  languageCode?: string
}

type NewGoogleReview = {
  name?: string
  relativePublishTimeDescription?: string
  text?: LocalizedText
  originalText?: LocalizedText
  rating?: number
  publishTime?: string
  authorAttribution?: {
    displayName?: string
    photoUri?: string
  }
}

type NewGooglePlaceDetailsResponse = {
  id?: string
  displayName?: LocalizedText
  reviews?: NewGoogleReview[]
  rating?: number
  userRatingCount?: number
  googleMapsLinks?: {
    reviewsUri?: string
  }
  error?: {
    message?: string
    status?: string
  }
}

const PLACE_DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "rating",
  "userRatingCount",
  "reviews",
  "reviews.name",
  "reviews.rating",
  "reviews.text",
  "reviews.originalText",
  "reviews.authorAttribution",
  "reviews.publishTime",
  "reviews.relativePublishTimeDescription",
  "googleMapsLinks.reviewsUri",
].join(",")

function formatPublishTime(value?: string) {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return ""
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toISOString().slice(0, 10)
}

function getReviewText(review: NewGoogleReview) {
  return String(review.text?.text ?? review.originalText?.text ?? "").trim()
}

export function mapNewGoogleReviews(reviews: NewGoogleReview[] | undefined) {
  if (!Array.isArray(reviews)) {
    return [] as GoogleReview[]
  }

  return reviews
    .map((review, index) => {
      const author = String(review.authorAttribution?.displayName ?? "").trim() || "Anonim"
      const text = getReviewText(review)
      const rating = Number(review.rating)
      if (!Number.isFinite(rating)) {
        return null
      }

      const time = formatPublishTime(review.publishTime)
      const relativeTime = String(review.relativePublishTimeDescription ?? "").trim() || time
      const authorPhoto = String(review.authorAttribution?.photoUri ?? "").trim() || undefined

      return {
        id: String(review.name ?? `${review.publishTime ?? index}-${author}`),
        author,
        authorPhoto,
        rating,
        text,
        time,
        relativeTime,
      } satisfies GoogleReview
    })
    .filter((review): review is GoogleReview => review !== null)
}

function normalizePlaceId(placeId: string) {
  const value = String(placeId ?? "").trim()
  return value.startsWith("places/") ? value.slice("places/".length) : value
}

function hasEnterpriseReviewAccess(data: NewGooglePlaceDetailsResponse | null) {
  if (!data) {
    return false
  }

  return (
    data.rating != null ||
    data.userRatingCount != null ||
    Array.isArray(data.reviews)
  )
}

function buildReviewsUnavailableMessage(placeName: string, reviewsUri?: string) {
  const placeLabel = placeName ? `"${placeName}"` : "isletme"
  const baseMessage =
    `${placeLabel} bulundu ancak Google yorumlari donmedi. ` +
    "Places API (New) icin faturalandirmada Enterprise + Atmosphere SKU aktif olmali ve API key bu servise acik olmali."

  if (!reviewsUri) {
    return baseMessage
  }

  return `${baseMessage} Google Maps yorum sayfasi: ${reviewsUri}`
}

export async function fetchGooglePlaceReviews(placesApiKey: string, placeId: string) {
  const normalizedPlaceId = normalizePlaceId(placeId)
  if (!normalizedPlaceId) {
    throw new Error("Place ID zorunlu.")
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedPlaceId)}`)
  url.searchParams.set("languageCode", "tr")

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": placesApiKey,
      "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
    },
  })

  const data = (await response.json().catch(() => null)) as NewGooglePlaceDetailsResponse | null

  if (!response.ok) {
    const message = String(data?.error?.message ?? "").trim()
    throw new Error(message || "Google Places istegi basarisiz.")
  }

  if (data?.error?.message) {
    throw new Error(String(data.error.message))
  }

  const reviews = mapNewGoogleReviews(data?.reviews)
  if (reviews.length > 0) {
    return reviews
  }

  const placeName = String(data?.displayName?.text ?? "").trim()
  const reviewsUri = String(data?.googleMapsLinks?.reviewsUri ?? "").trim() || undefined

  if (!hasEnterpriseReviewAccess(data)) {
    throw new Error(buildReviewsUnavailableMessage(placeName, reviewsUri))
  }

  return reviews
}
