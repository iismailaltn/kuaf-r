import type { WhatsAppConversation, WhatsAppDraft, WhatsAppLocale, ConversationStep } from "@/lib/whatsapp-bot/types"
import { sqlToken, selectByToken, extractRows, sanitizeSqlString } from "@/lib/whatsapp-bot/locofabric-server"

const memory = new Map<string, WhatsAppConversation>()

function conversationKey(businessUserId: string, waPhone: string) {
  return `${businessUserId}:${waPhone}`
}

function getConversationsToken() {
  return process.env.LOCOFABRIC_TOKEN_WHATSAPP ?? process.env.LOCOFABRIC_TOKEN_COMPANY ?? ""
}

export function getConversation(businessUserId: string, waPhone: string): WhatsAppConversation | null {
  return memory.get(conversationKey(businessUserId, waPhone)) ?? null
}

export function saveConversation(conversation: WhatsAppConversation) {
  conversation.updatedAt = Date.now()
  memory.set(conversationKey(conversation.businessUserId, conversation.waPhone), conversation)

  void persistConversationToDb(conversation).catch(() => {
    // DB persistence optional
  })
}

export function resetConversation(businessUserId: string, waPhone: string, locale: WhatsAppLocale, shopName: string) {
  const conv: WhatsAppConversation = {
    businessUserId,
    waPhone,
    locale,
    step: "idle",
    draft: { phone: waPhone },
    updatedAt: Date.now(),
  }
  saveConversation(conv)
  return conv
}

export function updateConversation(
  businessUserId: string,
  waPhone: string,
  patch: Partial<Pick<WhatsAppConversation, "step" | "locale" | "draft">>,
) {
  const existing =
    getConversation(businessUserId, waPhone) ??
    resetConversation(businessUserId, waPhone, patch.locale ?? "tr", "")
  const next: WhatsAppConversation = {
    ...existing,
    ...patch,
    draft: { ...existing.draft, ...patch.draft },
    updatedAt: Date.now(),
  }
  saveConversation(next)
  return next
}

async function persistConversationToDb(conversation: WhatsAppConversation) {
  const token = getConversationsToken()
  if (!token) {
    return
  }

  const draftJson = sanitizeSqlString(JSON.stringify(conversation.draft))
  const key = conversationKey(conversation.businessUserId, conversation.waPhone)

  try {
    const data = await selectByToken<unknown>(token)
    const rows = extractRows<Record<string, unknown>>(data).filter(
      (row) => String(row.conversation_key ?? row.conversationKey ?? "") === key,
    )

    if (rows.length > 0) {
      const id = Number(rows[0].id ?? rows[0].ID)
      if (Number.isFinite(id) && id > 0) {
        await sqlToken(
          token,
          `UPDATE whatsapp_conversations SET step='${sanitizeSqlString(conversation.step)}', locale='${conversation.locale}', draft_json='${draftJson}', updated_at=CURRENT_TIMESTAMP WHERE id=${id}`,
        )
        return
      }
    }

    await sqlToken(
      token,
      `INSERT INTO whatsapp_conversations (business_user_id, wa_phone, conversation_key, step, locale, draft_json, created_at, updated_at) VALUES (${conversation.businessUserId}, '${sanitizeSqlString(conversation.waPhone)}', '${sanitizeSqlString(key)}', '${sanitizeSqlString(conversation.step)}', '${conversation.locale}', '${draftJson}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
  } catch {
    // table may not exist yet
  }
}

export async function loadConversationFromDb(businessUserId: string, waPhone: string) {
  const token = getConversationsToken()
  if (!token) {
    return null
  }

  const key = conversationKey(businessUserId, waPhone)
  try {
    const data = await sqlToken<unknown>(
      token,
      `SELECT * FROM whatsapp_conversations WHERE business_user_id=${businessUserId} AND wa_phone='${sanitizeSqlString(waPhone)}'`,
    )
    const row = extractRows<Record<string, unknown>>(data)[0]
    if (!row) {
      return null
    }

    let draft: Partial<WhatsAppDraft> = {}
    try {
      draft = JSON.parse(String(row.draft_json ?? row.draftJson ?? "{}")) as Partial<WhatsAppDraft>
    } catch {
      draft = {}
    }

    const conv: WhatsAppConversation = {
      businessUserId,
      waPhone,
      locale: (String(row.locale ?? "tr") === "en" ? "en" : "tr") as WhatsAppLocale,
      step: (String(row.step ?? "idle") as ConversationStep) || "idle",
      draft: { phone: waPhone, ...draft },
      updatedAt: Date.now(),
    }
    memory.set(key, conv)
    return conv
  } catch {
    return null
  }
}
