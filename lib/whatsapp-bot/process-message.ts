import { t, detectLocaleSwitch } from "@/lib/whatsapp-bot/i18n"
import {
  getConversation,
  updateConversation,
  resetConversation,
  loadConversationFromDb,
} from "@/lib/whatsapp-bot/conversation-store"
import { findAvailableSlot } from "@/lib/whatsapp-bot/availability"
import { createWhatsAppReservation } from "@/lib/whatsapp-bot/create-reservation"
import {
  parseCustomerName,
  parseServiceChoice,
  parseYesNo,
  isBookingIntent,
  isCancelIntent,
  isHelpIntent,
  parseDateInput,
  parseTimeInput,
  formatDisplayDate,
  normalizeWaPhone,
} from "@/lib/whatsapp-bot/parse"
import { loadActiveServices, loadStaffList, loadReservations } from "@/lib/whatsapp-bot/salon-data"
import type {
  ProcessMessageInput,
  ProcessMessageResult,
  WhatsAppDraft,
  WhatsAppLocale,
} from "@/lib/whatsapp-bot/types"

function formatServiceList(services: { id: number; name: string }[]) {
  return services.map((service, index) => `${index + 1}. ${service.name}`).join("\n")
}

function ensureLocale(locale: WhatsAppLocale | undefined, fallback: WhatsAppLocale): WhatsAppLocale {
  return locale === "en" ? "en" : fallback === "en" ? "en" : "tr"
}

export async function processWhatsAppMessage(input: ProcessMessageInput): Promise<ProcessMessageResult> {
  const businessUserId = String(input.businessUserId ?? "").trim()
  const shopName = String(input.shopName ?? "Salon").trim() || "Salon"
  const waPhone = normalizeWaPhone(input.waPhone)
  const text = String(input.text ?? "").trim()
  const defaultLocale = ensureLocale(input.locale, "tr")

  let conversation =
    getConversation(businessUserId, waPhone) ??
    (await loadConversationFromDb(businessUserId, waPhone)) ??
    resetConversation(businessUserId, waPhone, defaultLocale, shopName)

  const localeSwitch = detectLocaleSwitch(text)
  if (localeSwitch) {
    conversation = updateConversation(businessUserId, waPhone, { locale: localeSwitch })
  }

  const locale = conversation.locale

  if (isCancelIntent(text) && conversation.step !== "idle") {
    resetConversation(businessUserId, waPhone, locale, shopName)
    return { replies: [t(locale, "cancelled")], locale, step: "idle" }
  }

  if (isHelpIntent(text)) {
    return { replies: [t(locale, "help")], locale, step: conversation.step }
  }

  if (conversation.step === "idle") {
    if (!text || isBookingIntent(text)) {
      if (!isBookingIntent(text) && !text) {
        return {
          replies: [t(locale, "welcome", { shopName })],
          locale,
          step: "idle",
        }
      }
      updateConversation(businessUserId, waPhone, { step: "await_name", draft: { phone: waPhone } })
      return { replies: [t(locale, "ask_name")], locale, step: "await_name" }
    }
    return {
      replies: [t(locale, "welcome", { shopName }), t(locale, "help")],
      locale,
      step: "idle",
    }
  }

  if (conversation.step === "await_name") {
    const parsed = parseCustomerName(text)
    if (!parsed) {
      return { replies: [t(locale, "ask_name")], locale, step: "await_name" }
    }

    const services = await loadActiveServices(businessUserId)
    if (services.length === 0) {
      resetConversation(businessUserId, waPhone, locale, shopName)
      return { replies: [t(locale, "no_services")], locale, step: "idle" }
    }

    updateConversation(businessUserId, waPhone, {
      step: "await_service",
      draft: { ...parsed, phone: waPhone },
    })

    return {
      replies: [t(locale, "ask_service", { serviceList: formatServiceList(services) })],
      locale,
      step: "await_service",
    }
  }

  if (conversation.step === "await_service") {
    const services = await loadActiveServices(businessUserId)
    const index = parseServiceChoice(text, services.length)
    if (index === null || !services[index]) {
      return {
        replies: [
          t(locale, "invalid_input"),
          t(locale, "ask_service", { serviceList: formatServiceList(services) }),
        ],
        locale,
        step: "await_service",
      }
    }

    const chosen = services[index]
    updateConversation(businessUserId, waPhone, {
      step: "await_date",
      draft: {
        serviceIds: [chosen.id],
        serviceNames: [chosen.name],
      },
    })

    return { replies: [t(locale, "ask_date")], locale, step: "await_date" }
  }

  if (conversation.step === "await_date") {
    const date = parseDateInput(text)
    if (!date) {
      return { replies: [t(locale, "invalid_date")], locale, step: "await_date" }
    }

    updateConversation(businessUserId, waPhone, { step: "await_time", draft: { date } })
    return { replies: [t(locale, "ask_time")], locale, step: "await_time" }
  }

  if (conversation.step === "await_time") {
    const time = parseTimeInput(text)
    if (!time) {
      return { replies: [t(locale, "invalid_time")], locale, step: "await_time" }
    }

    const draft = conversation.draft
    const serviceIds = draft.serviceIds ?? []
    const serviceNames = draft.serviceNames ?? []
    const date = draft.date ?? ""

    if (!date || serviceIds.length === 0) {
      resetConversation(businessUserId, waPhone, locale, shopName)
      return { replies: [t(locale, "invalid_input")], locale, step: "idle" }
    }

    const [staffList, reservations] = await Promise.all([
      loadStaffList(businessUserId),
      loadReservations(businessUserId),
    ])

    if (staffList.length === 0) {
      return { replies: [t(locale, "no_services")], locale, step: "await_time" }
    }

    const slot = await findAvailableSlot({
      businessUserId,
      date,
      preferredTime: time,
      serviceIds,
      serviceNames,
      staffList,
      reservations,
    })

    if (!slot.available) {
      return {
        replies: [t(locale, "slot_unavailable", { slots: slot.sampleSlots })],
        locale,
        step: "await_time",
      }
    }

    updateConversation(businessUserId, waPhone, {
      step: "await_confirm",
      draft: {
        startTime: slot.startTime,
        endTime: slot.endTime,
        staffId: slot.staffId,
        staffName: slot.staffName,
        totalMinutes: slot.totalMinutes,
        stages: slot.stages,
        staffBusyBlocks: slot.staffBusyBlocks,
      },
    })

    const displayDate = formatDisplayDate(date, locale)
    return {
      replies: [
        t(locale, "slot_available", {
          date: displayDate,
          time: slot.startTime,
          endTime: slot.endTime,
          staffName: slot.staffName,
          services: serviceNames.join(", "),
        }),
      ],
      locale,
      step: "await_confirm",
    }
  }

  if (conversation.step === "await_confirm") {
    const confirm = parseYesNo(text, locale)
    if (confirm === null) {
      return { replies: [t(locale, "confirm_prompt")], locale, step: "await_confirm" }
    }

    if (!confirm) {
      resetConversation(businessUserId, waPhone, locale, shopName)
      return { replies: [t(locale, "cancelled")], locale, step: "idle" }
    }

    const draft = conversation.draft
    const fullDraft: WhatsAppDraft | null =
      draft.customerName &&
      draft.customerSurname &&
      draft.date &&
      draft.startTime &&
      draft.staffId &&
      draft.staffName &&
      draft.serviceIds?.length &&
      draft.serviceNames?.length &&
      draft.stages?.length &&
      draft.staffBusyBlocks?.length
        ? {
            customerName: draft.customerName,
            customerSurname: draft.customerSurname,
            phone: draft.phone ?? waPhone,
            serviceIds: draft.serviceIds,
            serviceNames: draft.serviceNames,
            staffId: draft.staffId,
            staffName: draft.staffName,
            date: draft.date,
            startTime: draft.startTime,
            endTime: draft.endTime ?? draft.startTime,
            totalMinutes: draft.totalMinutes ?? 0,
            stages: draft.stages,
            staffBusyBlocks: draft.staffBusyBlocks,
          }
        : null

    if (!fullDraft) {
      resetConversation(businessUserId, waPhone, locale, shopName)
      return { replies: [t(locale, "invalid_input")], locale, step: "idle" }
    }

    const created = await createWhatsAppReservation(businessUserId, fullDraft)
    resetConversation(businessUserId, waPhone, locale, shopName)

    if (!created.ok) {
      return {
        replies: [created.message],
        locale,
        step: "idle",
      }
    }

    const displayDate = formatDisplayDate(fullDraft.date, locale)
    return {
      replies: [
        t(locale, "confirmed", {
          date: displayDate,
          time: fullDraft.startTime,
          staffName: fullDraft.staffName,
          services: fullDraft.serviceNames.join(", "),
        }),
      ],
      locale,
      step: "idle",
      reservationCreated: true,
    }
  }

  return { replies: [t(locale, "invalid_input")], locale, step: conversation.step }
}
