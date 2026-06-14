import { apiJson } from "@/lib/api-response"
import { processWhatsAppMessage } from "@/lib/whatsapp-bot/process-message"
import type { WhatsAppLocale } from "@/lib/whatsapp-bot/types"

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          businessUserId?: string | number
          shopName?: string
          waPhone?: string
          text?: string
          locale?: WhatsAppLocale
        }
      | null

    const businessUserId = String(body?.businessUserId ?? "").trim()
    const waPhone = String(body?.waPhone ?? "").trim()
    const text = String(body?.text ?? "").trim()

    if (!businessUserId || !waPhone) {
      return apiJson({ ok: false, message: "businessUserId ve waPhone zorunlu." }, 400)
    }

    const result = await processWhatsAppMessage({
      businessUserId,
      shopName: String(body?.shopName ?? "Salon").trim() || "Salon",
      waPhone,
      text,
      locale: body?.locale,
    })

    return apiJson({ ok: true, ...result })
  } catch (err) {
    return apiJson({
      ok: false,
      message: err instanceof Error ? err.message : "WhatsApp isleme hatasi.",
    }, 500)
  }
}
