import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { getBusinessUserIdFromRequest, requireBusinessUserId } from "@/lib/business-scope"
import { apiJson } from "@/lib/api-response"
import {
  buildSalonCustomersFromSessions,
  findSalonCustomerByPhone,
  resolveCustomerPhoneKey,
} from "@/lib/salon-customers"
import { fetchAllSessionOperationsForBusiness } from "@/lib/session-operations-query"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const businessUserId = getBusinessUserIdFromRequest(req)
    const businessError = requireBusinessUserId(businessUserId)
    if (businessError) {
      return apiJson({ ok: false, message: businessError }, 400)
    }

    const token = appConfig.token.session_operations
    if (!token) {
      return apiJson({ ok: false, message: "session_operations token tanimli degil." }, 500)
    }

    const operations = await fetchAllSessionOperationsForBusiness(token, businessUserId)
    const customers = buildSalonCustomersFromSessions(operations)

    const phoneLookup = url.searchParams.get("phone")?.trim() ?? ""
    if (phoneLookup) {
      const key = resolveCustomerPhoneKey(phoneLookup)
      if (!key) {
        return apiJson({ ok: false, message: "Gecerli bir telefon numarasi girin." }, 400)
      }
      const customer = findSalonCustomerByPhone(customers, phoneLookup)
      return apiJson({ ok: true, customer: customer ?? null, phone: key })
    }

    return apiJson({
      ok: true,
      customers,
      totalCustomers: customers.length,
      totalSessions: operations.length,
    })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    return apiJson(
      {
        ok: false,
        message: "Musteri listesi getirilemedi.",
        error: axiosErr?.message ?? String(err),
      },
      502,
    )
  }
}
