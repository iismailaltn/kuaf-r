import type { ScheduledStage } from "@/lib/salon-service-stages"

export type WhatsAppLocale = "tr" | "en"

export type ConversationStep =
  | "idle"
  | "await_name"
  | "await_service"
  | "await_date"
  | "await_time"
  | "await_confirm"

export type WhatsAppDraft = {
  customerName: string
  customerSurname: string
  phone: string
  serviceIds: number[]
  serviceNames: string[]
  staffId: string
  staffName: string
  date: string
  startTime: string
  endTime: string
  totalMinutes: number
  stages: ScheduledStage[]
  staffBusyBlocks: Array<{ startMinutes: number; endMinutes: number }>
}

export type WhatsAppConversation = {
  businessUserId: string
  waPhone: string
  locale: WhatsAppLocale
  step: ConversationStep
  draft: Partial<WhatsAppDraft>
  updatedAt: number
}

export type SalonServiceOption = {
  id: number
  name: string
}

export type StaffOption = {
  id: string
  name: string
}

export type BusinessWhatsAppConfig = {
  businessUserId: string
  shopName: string
  phoneNumberId: string
  defaultLocale: WhatsAppLocale
}

export type ProcessMessageInput = {
  businessUserId: string
  shopName: string
  waPhone: string
  text: string
  locale?: WhatsAppLocale
}

export type ProcessMessageResult = {
  replies: string[]
  locale: WhatsAppLocale
  step: ConversationStep
  reservationCreated?: boolean
}
