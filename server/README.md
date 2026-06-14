# Instagram API (.NET)

Static panel tarayicidan Meta Graph API'ye dogrudan istek atamaz (CORS). Instagram islemleri **server.hstplanet.com** uzerinden yapilir.

## Kurulum

1. `InstagramController.cs` dosyasini ASP.NET Core Web API projenize kopyalayin (`Controllers/` klasoru).
2. `Program.cs` icinde:

```csharp
builder.Services.AddHttpClient();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Panel", policy =>
        policy
            .WithOrigins(
                "https://hstplanet.com",
                "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});
// ...
app.UseCors("Panel");
```

3. Yayinlayin. Endpoint tabani: `https://server.hstplanet.com/api/instagram`

## Endpointler

| Method | URL | Aciklama |
|--------|-----|----------|
| POST | `/api/instagram/context` | Token dogrula, `instagramUserId` coz |
| POST | `/api/instagram/publish` | Fotografi Instagram'da yayinla |

Panel `.env.local` icinde `NEXT_PUBLIC_SERVER_URL=https://server.hstplanet.com` olmali (veya `NEXT_PUBLIC_INSTAGRAM_API_URL` ile override).

---

# WhatsApp rezervasyon botu

Static panel Meta webhook alamaz. Akis:

1. **Meta** → `GET/POST https://server.hstplanet.com/api/whatsapp/webhook` (`WhatsAppReservationController.cs`)
2. **.NET** → yerel Node bot: `http://127.0.0.1:3920/webhook` (`npm run whatsapp:bot`)
3. **Bot** → Locofabric (`salon_reservations`, `source=whatsapp`) + TR/EN mesajlar

## Sunucu kurulumu

1. `WhatsAppReservationController.cs` dosyasini API projenize ekleyin.
2. `appsettings.json` (veya ortam degiskenleri):

```json
{
  "WhatsApp": {
    "VerifyToken": "META_VERIFY_TOKEN",
    "BotWebhookUrl": "http://127.0.0.1:3920/webhook",
    "BotProcessUrl": "http://127.0.0.1:3920/process"
  }
}
```

3. Panel reposunda bot servisini surekli calistirin (Windows Service, pm2, nssm vb.):

```bash
npm run whatsapp:bot
```

4. Meta Developer Console → WhatsApp → Webhook URL: `https://server.hstplanet.com/api/whatsapp/webhook`

## Panel ortami

`.env.local` ornegi icin `.env.example` dosyasina bakin. Onemli alanlar:

- `WHATSAPP_VERIFY_TOKEN` — Meta ile ayni
- `WHATSAPP_ACCESS_TOKEN` — Graph API mesaj gonderimi
- `WHATSAPP_BUSINESS_MAP` — `phone_number_id` → `businessUserId` JSON

Veritabani (opsiyonel kalici state): `scripts/migrate-whatsapp-bot.sql`

## Test

```http
POST /api/whatsapp/process
{ "businessUserId": "1", "shopName": "Salon", "waPhone": "905551234567", "text": "randevu" }
```

Panel icinde (dev): `POST /api/whatsapp/process` — `api-fetch` handler.
