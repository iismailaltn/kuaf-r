import type { WhatsAppLocale } from "@/lib/whatsapp-bot/types"

type MessageKey =
  | "welcome"
  | "help"
  | "ask_name"
  | "ask_service"
  | "ask_date"
  | "ask_time"
  | "slot_available"
  | "slot_unavailable"
  | "confirm_prompt"
  | "confirmed"
  | "cancelled"
  | "invalid_input"
  | "invalid_date"
  | "invalid_time"
  | "no_services"
  | "goodbye"

const messages: Record<WhatsAppLocale, Record<MessageKey, string>> = {
  tr: {
    welcome:
      "Merhaba! {shopName} salonuna hos geldiniz. Randevu almak icin *randevu* yazin. Dil: EN yazarak Ingilizce.",
    help: "Komutlar: *randevu* — yeni randevu, *iptal* — vazgec, *yardim* — bu mesaj.",
    ask_name: "Lutfen ad ve soyadinizi yazin.\nOrnek: Ahmet Yilmaz",
    ask_service: "Hangi hizmeti almak istiyorsunuz? Numara ile yanitlayin:\n{serviceList}",
    ask_date: "Randevu tarihini yazin (GG.AA.YYYY veya *yarin*, *bugun*).",
    ask_time: "Saati yazin (ornek: 14:30).",
    slot_available:
      "Bu tarihte *{date}* saat *{time}* ({endTime} bitis) musait.\nPersonel: {staffName}\nHizmet: {services}\n\nOnayliyor musunuz? *evet* veya *hayir*",
    slot_unavailable:
      "Bu saat musait degil. Ornek musait saatler: {slots}",
    confirm_prompt: "Randevuyu onayliyor musunuz? *evet* / *hayir*",
    confirmed:
      "Randevunuz olusturuldu.\n{date} {time} — {staffName}\nHizmet: {services}\nGorusmek uzere!",
    cancelled: "Islem iptal edildi. Tekrar randevu icin *randevu* yazin.",
    invalid_input: "Anlayamadim. *yardim* yazarak komutlari gorebilirsiniz.",
    invalid_date: "Gecersiz tarih. Ornek: 20.05.2026 veya yarin",
    invalid_time: "Gecersiz saat. Ornek: 14:30",
    no_services: "Aktif hizmet bulunamadi. Lutfen salonla iletisime gecin.",
    goodbye: "Tesekkurler! Iyi gunler.",
  },
  en: {
    welcome:
      "Hello! Welcome to *{shopName}*. Reply *BOOK* to make an appointment. For Turkish, reply *TR*.",
    help: "Commands: *book* — new appointment, *cancel* — abort, *help* — this message.",
    ask_name: "Please enter your first and last name.\nExample: John Smith",
    ask_service: "Which service do you need? Reply with a number:\n{serviceList}",
    ask_date: "Enter the date (DD.MM.YYYY or *tomorrow*, *today*).",
    ask_time: "Enter the time (e.g. 14:30).",
    slot_available:
      "Available on *{date}* at *{time}* (ends {endTime}).\nStaff: {staffName}\nServices: {services}\n\nConfirm? *yes* or *no*",
    slot_unavailable: "That slot is not available. Try: {slots}",
    confirm_prompt: "Confirm this booking? *yes* / *no*",
    confirmed:
      "Your appointment is confirmed.\n{date} {time} — {staffName}\nServices: {services}\nSee you soon!",
    cancelled: "Cancelled. Reply *book* to start again.",
    invalid_input: "I did not understand. Reply *help* for commands.",
    invalid_date: "Invalid date. Example: 20.05.2026 or tomorrow",
    invalid_time: "Invalid time. Example: 14:30",
    no_services: "No active services found. Please contact the salon.",
    goodbye: "Thank you! Have a nice day.",
  },
}

export function t(locale: WhatsAppLocale, key: MessageKey, vars?: Record<string, string>) {
  let text = messages[locale][key] ?? messages.tr[key]
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v)
    })
  }
  return text
}

export function detectLocaleSwitch(text: string): WhatsAppLocale | null {
  const normalized = text.trim().toLowerCase()
  if (normalized === "tr" || normalized === "turkce" || normalized === "türkçe") {
    return "tr"
  }
  if (normalized === "en" || normalized === "english" || normalized === "ingilizce") {
    return "en"
  }
  return null
}
