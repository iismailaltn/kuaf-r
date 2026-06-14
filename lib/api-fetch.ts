"use client"

import type { ApiFetchResponse } from "@/lib/api-response"
import * as authLogin from "@/lib/handlers/auth/login/route"
import * as authRegister from "@/lib/handlers/auth/register/route"
import * as corporateApprovals from "@/lib/handlers/corporate-approvals/route"
import * as corporateMembership from "@/lib/handlers/corporate-membership/route"
import * as googlePlaceSettings from "@/lib/handlers/google-place-settings/route"
import * as googleReviews from "@/lib/handlers/google-reviews/route"
import * as instagramSettings from "@/lib/handlers/instagram-settings/route"
import * as salonCustomers from "@/lib/handlers/salon-customers/route"
import * as instagramPublish from "@/lib/handlers/instagram-publish/route"
import * as individualLookup from "@/lib/handlers/individual-lookup/route"
import * as personelInvitations from "@/lib/handlers/personel-invitations/route"
import * as personels from "@/lib/handlers/personels/route"
import * as products from "@/lib/handlers/products/route"
import * as productById from "@/lib/handlers/products/[id]/route"
import * as salonServices from "@/lib/handlers/salon-services/route"
import * as salonServiceById from "@/lib/handlers/salon-services/[id]/route"
import * as salonServiceStages from "@/lib/handlers/salon-services/[id]/stages/route"
import * as reservations from "@/lib/handlers/reservations/route"
import * as reservationById from "@/lib/handlers/reservations/[id]/route"
import * as sessionOperations from "@/lib/handlers/session-operations/route"
import * as sessionOperationById from "@/lib/handlers/session-operations/[id]/route"
import * as productSales from "@/lib/handlers/product-sales/route"
import * as userProfile from "@/lib/handlers/user-profile/route"
import * as workspaces from "@/lib/handlers/workspaces/route"
import * as workspaceById from "@/lib/handlers/workspaces/[id]/route"
import * as whatsappProcess from "@/lib/handlers/whatsapp/process/route"

type DynamicHandler = (
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) => Promise<ApiFetchResponse>

function resolveUrl(input: string | URL) {
  if (typeof input === "string") {
    return new URL(input, "http://localhost")
  }
  return new URL(input.url)
}

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

export async function apiFetch(input: string | URL, init?: RequestInit): Promise<ApiFetchResponse> {
  const url = resolveUrl(input)
  const method = (init?.method ?? "GET").toUpperCase()
  const req = new Request(url.toString(), init)
  const path = url.pathname

  if (path === "/api/auth/login" && method === "POST") return authLogin.POST(req)
  if (path === "/api/auth/register" && method === "POST") return authRegister.POST(req)
  if (path === "/api/corporate-approvals" && method === "GET") return corporateApprovals.GET()
  if (path === "/api/corporate-approvals" && method === "POST") return corporateApprovals.POST(req)
  if (path === "/api/corporate-membership" && method === "GET") return corporateMembership.GET(req)
  if (path === "/api/corporate-membership" && method === "PUT") return corporateMembership.PUT(req)
  if (path === "/api/google-place-settings" && method === "GET") return googlePlaceSettings.GET(req)
  if (path === "/api/google-place-settings" && method === "PUT") return googlePlaceSettings.PUT(req)
  if (path === "/api/instagram-settings" && method === "GET") return instagramSettings.GET(req)
  if (path === "/api/instagram-settings" && method === "PUT") return instagramSettings.PUT(req)
  if (path === "/api/instagram-publish" && method === "POST") return instagramPublish.POST(req)
  if (path === "/api/salon-customers" && method === "GET") return salonCustomers.GET(req)
  if (path === "/api/google-reviews" && method === "GET") return googleReviews.GET(req)
  if (path === "/api/individual-lookup" && method === "POST") return individualLookup.POST(req)
  if (path === "/api/personel-invitations" && method === "GET") return personelInvitations.GET(req)
  if (path === "/api/personel-invitations" && method === "POST") return personelInvitations.POST(req)
  if (path === "/api/personels" && method === "GET") return personels.GET(req)
  if (path === "/api/personels" && method === "POST") return personels.POST(req)
  if (path === "/api/products" && method === "GET") return products.GET(req)
  if (path === "/api/products" && method === "POST") return products.POST(req)
  if (path === "/api/salon-services" && method === "GET") return salonServices.GET(req)
  if (path === "/api/reservations" && method === "GET") return reservations.GET(req)
  if (path === "/api/reservations" && method === "POST") return reservations.POST(req)
  if (path === "/api/session-operations" && method === "GET") return sessionOperations.GET(req)
  if (path === "/api/session-operations" && method === "POST") return sessionOperations.POST(req)
  if (path === "/api/product-sales" && method === "GET") return productSales.GET(req)
  if (path === "/api/product-sales" && method === "POST") return productSales.POST(req)
  if (path === "/api/user-profile" && method === "GET") return userProfile.GET(req)
  if (path === "/api/user-profile" && method === "PATCH") return userProfile.PATCH(req)
  if (path === "/api/workspaces" && method === "GET") return workspaces.GET(req)
  if (path === "/api/workspaces" && method === "POST") return workspaces.POST(req)
  if (path === "/api/whatsapp/process" && method === "POST") return whatsappProcess.POST(req)

  const productMatch = path.match(/^\/api\/products\/([^/]+)$/)
  if (productMatch) {
    const handler = productById as { PUT?: DynamicHandler; DELETE?: DynamicHandler }
    if (method === "PUT" && handler.PUT) return handler.PUT(req, params(productMatch[1]))
    if (method === "DELETE" && handler.DELETE) return handler.DELETE(req, params(productMatch[1]))
  }

  const salonStagesMatch = path.match(/^\/api\/salon-services\/([^/]+)\/stages$/)
  if (salonStagesMatch && method === "PUT") {
    return salonServiceStages.PUT(req, params(salonStagesMatch[1]))
  }

  const salonMatch = path.match(/^\/api\/salon-services\/([^/]+)$/)
  if (salonMatch && method === "PUT") {
    return salonServiceById.PUT(req, params(salonMatch[1]))
  }

  const reservationMatch = path.match(/^\/api\/reservations\/([^/]+)$/)
  if (reservationMatch) {
    const handler = reservationById as { PATCH?: DynamicHandler }
    if (method === "PATCH" && handler.PATCH) {
      return handler.PATCH(req, params(reservationMatch[1]))
    }
  }

  const workspaceMatch = path.match(/^\/api\/workspaces\/([^/]+)$/)
  if (workspaceMatch) {
    const id = workspaceMatch[1]
    if (method === "PUT") return workspaceById.PUT(req, params(id))
    if (method === "PATCH") return workspaceById.PATCH(req, params(id))
    if (method === "DELETE") return workspaceById.DELETE(req, params(id))
  }

  const sessionOperationMatch = path.match(/^\/api\/session-operations\/([^/]+)$/)
  if (sessionOperationMatch) {
    const handler = sessionOperationById as { PATCH?: DynamicHandler }
    if (method === "PATCH" && handler.PATCH) {
      return handler.PATCH(req, params(sessionOperationMatch[1]))
    }
  }

  return {
    ok: false,
    status: 404,
    json: async () => ({ ok: false, message: `API route bulunamadi: ${method} ${path}` }),
  }
}
