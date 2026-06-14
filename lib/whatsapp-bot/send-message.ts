import axios from "axios"

const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v21.0"

export async function sendWhatsAppText(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  text: string
}) {
  const token = options.accessToken.trim()
  const phoneNumberId = options.phoneNumberId.trim()
  const to = String(options.to).replace(/\D/g, "")

  if (!token || !phoneNumberId || !to) {
    return { ok: false as const, message: "WhatsApp gonderim parametreleri eksik." }
  }

  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`

  try {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: options.text },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )
    return { ok: true as const }
  } catch (err) {
    const message =
      (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
        ?.message ?? (err instanceof Error ? err.message : "WhatsApp gonderilemedi.")
    return { ok: false as const, message }
  }
}
