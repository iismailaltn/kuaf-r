/**
 * Meta WhatsApp webhook + bot islem sunucusu.
 * Kullanim: npm run whatsapp:bot
 *
 * .env: WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_BUSINESS_MAP (JSON)
 * Opsiyonel: WHATSAPP_BOT_PORT=3920
 */
import http from "node:http"
import { URL } from "node:url"
import { resolveBusinessByPhoneNumberId } from "../lib/whatsapp-bot/business-config"
import { processWhatsAppMessage } from "../lib/whatsapp-bot/process-message"
import { sendWhatsAppText } from "../lib/whatsapp-bot/send-message"
import { normalizeWaPhone } from "../lib/whatsapp-bot/parse"

const PORT = Number(process.env.WHATSAPP_BOT_PORT ?? 3920)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN?.trim() ?? ""
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? ""

function readJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8")
        resolve(raw ? (JSON.parse(raw) as T) : ({} as T))
      } catch (err) {
        reject(err)
      }
    })
    req.on("error", reject)
  })
}

function jsonResponse(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}

async function handleWebhook(body: Record<string, unknown>) {
  const entries = Array.isArray(body.entry) ? body.entry : []
  for (const entry of entries) {
    const entryRow = entry as Record<string, unknown>
    const changes = Array.isArray(entryRow.changes) ? entryRow.changes : []
    for (const change of changes) {
      const value = (change as Record<string, unknown>).value as Record<string, unknown> | undefined
      if (!value) {
        continue
      }

      const phoneNumberId = String(
        (value.metadata as Record<string, unknown> | undefined)?.phone_number_id ?? "",
      ).trim()

      const business = resolveBusinessByPhoneNumberId(phoneNumberId)
      if (!business) {
        console.warn("[whatsapp] phone_number_id eslesmedi:", phoneNumberId)
        continue
      }

      const messages = Array.isArray(value.messages) ? value.messages : []
      for (const message of messages) {
        const msg = message as Record<string, unknown>
        if (String(msg.type ?? "") !== "text") {
          continue
        }

        const waPhone = normalizeWaPhone(String(msg.from ?? ""))
        const text = String((msg.text as Record<string, unknown> | undefined)?.body ?? "").trim()
        if (!waPhone || !text) {
          continue
        }

        const result = await processWhatsAppMessage({
          businessUserId: business.businessUserId,
          shopName: business.shopName,
          waPhone,
          text,
          locale: business.defaultLocale,
        })

        if (!ACCESS_TOKEN) {
          console.warn("[whatsapp] WHATSAPP_ACCESS_TOKEN eksik; yanit gonderilmedi.")
          console.log("[whatsapp] replies:", result.replies)
          continue
        }

        for (const reply of result.replies) {
          const sent = await sendWhatsAppText({
            phoneNumberId: business.phoneNumberId,
            accessToken: ACCESS_TOKEN,
            to: waPhone.startsWith("0") ? `90${waPhone.slice(1)}` : waPhone.replace(/\D/g, ""),
            text: reply,
          })
          if (!sent.ok) {
            console.error("[whatsapp] gonderim hatasi:", sent.message)
          }
        }
      }
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)

  if (req.method === "GET" && url.pathname === "/webhook") {
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      res.writeHead(200, { "Content-Type": "text/plain" })
      res.end(challenge)
      return
    }

    res.writeHead(403)
    res.end("Forbidden")
    return
  }

  if (req.method === "POST" && url.pathname === "/webhook") {
    try {
      const body = await readJsonBody<Record<string, unknown>>(req)
      void handleWebhook(body)
      res.writeHead(200)
      res.end("EVENT_RECEIVED")
    } catch (err) {
      jsonResponse(res, 500, { ok: false, message: String(err) })
    }
    return
  }

  if (req.method === "POST" && url.pathname === "/process") {
    try {
      const body = await readJsonBody<{
        businessUserId?: string
        shopName?: string
        waPhone?: string
        text?: string
        locale?: "tr" | "en"
      }>(req)

      const businessUserId = String(body.businessUserId ?? "").trim()
      const waPhone = String(body.waPhone ?? "").trim()
      if (!businessUserId || !waPhone) {
        jsonResponse(res, 400, { ok: false, message: "businessUserId ve waPhone zorunlu." })
        return
      }

      const result = await processWhatsAppMessage({
        businessUserId,
        shopName: String(body.shopName ?? "Salon"),
        waPhone,
        text: String(body.text ?? ""),
        locale: body.locale,
      })
      jsonResponse(res, 200, { ok: true, ...result })
    } catch (err) {
      jsonResponse(res, 500, { ok: false, message: String(err) })
    }
    return
  }

  jsonResponse(res, 404, { ok: false, message: "Not found" })
})

server.listen(PORT, () => {
  console.log(`WhatsApp bot: http://localhost:${PORT}`)
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`)
  console.log(`Verify token: ${VERIFY_TOKEN ? "(set)" : "(missing WHATSAPP_VERIFY_TOKEN)"}`)
})
