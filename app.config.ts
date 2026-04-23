import "server-only"

export const appConfig = {
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "https://hstplanet.com/",
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? "https://server.hstplanet.com",
  token: {
    blogToken: process.env.LOCOFABRIC_TOKEN_BLOG ?? "",
    blogCommentToken: process.env.LOCOFABRIC_TOKEN_BLOG_COMMENT ?? "",
    companyToken: process.env.LOCOFABRIC_TOKEN_COMPANY ?? "",
    Urünler: process.env.LOCOFABRIC_TOKEN_MENU ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoibWVudV9pdGVtcyIsIlJlYWQiOiJUcnVlIiwiV3JpdGUiOiJUcnVlIiwiVXBkYXRlIjoiVHJ1ZSIsIkRlbGV0ZSI6IlRydWUiLCJOYW1lIjoicmVzdGF1cmFudC3DvHLDvG5sZXIiLCJqdGkiOiIzOGVhMDVlOC0zMjRiLTRhNGItYTUxYS0yZWQxOGQwMjg3OTYiLCJuYmYiOjE3NzY5NTcxMTIsImV4cCI6MjA5MjMxNzExMiwiaWF0IjoxNzc2OTU3MTEyLCJpc3MiOiJwaG9lbml4YXBpLmhzdHBsYW5ldC5jb20iLCJhdWQiOiJoc3RwbGFuZXQuY29tIn0.nyZEtUEIMHf2TJVHm1PjNgdRKQdDAaL3Kxdx-2VT2m0",
    routeToken: process.env.LOCOFABRIC_TOKEN_ROUTE ?? "",
    user: process.env.LOCOFABRIC_TOKEN_USER ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoidXNlcnMiLCJSZWFkIjoiVHJ1ZSIsIldyaXRlIjoiVHJ1ZSIsIlVwZGF0ZSI6IlRydWUiLCJEZWxldGUiOiJUcnVlIiwiTmFtZSI6InJlc3RhdXJhbnQta3VsbGFuxLFjxLEiLCJqdGkiOiJhNmViZGI3YS05MWJiLTRiMGUtODExMi0xNjhkMjZkZTBmOTUiLCJuYmYiOjE3NzQ5MDY0MzgsImV4cCI6MjA5MDI2NjQzOCwiaWF0IjoxNzc0OTA2NDM4LCJpc3MiOiJwaG9lbml4YXBpLmhzdHBsYW5ldC5jb20iLCJhdWQiOiJoc3RwbGFuZXQuY29tIn0.l-luxgLgWbJ57qrJ3PUxk0ZWD2Ax0G_Se4w4kQpd55A",
    order: process.env.LOCOFABRIC_TOKEN_ORDER ?? "",
    companyComments: process.env.LOCOFABRIC_TOKEN_COMPANY_COMMENTS ?? "",
    content: process.env.LOCOFABRIC_TOKEN_CONTENT ?? "",
    kuafor_tables: process.env.LOCOFABRIC_TOKEN_ADS ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6ImQ1NzM5MGIxLWY4YzEtNDg5MS04ODExLWY4NDA3YzM3ZWFhZiIsIkRhdGFiYXNlIjoicmVzdGF1cmFudCIsIlRhYmxlIjoicmVzdGF1cmFudF90YWJsZXMiLCJSZWFkIjoiVHJ1ZSIsIldyaXRlIjoiVHJ1ZSIsIlVwZGF0ZSI6IlRydWUiLCJEZWxldGUiOiJUcnVlIiwiTmFtZSI6InJlc3RhdXJhbnQtw6dhbMSxxZ9tYUFsYW7EsSIsImp0aSI6IjI1MmFhMmI3LTFiMGQtNDg5Yi1hZDhiLTczMmZkMzc3ZjVhNSIsIm5iZiI6MTc3Njk1NDYwMSwiZXhwIjoyMDkyMzE0NjAxLCJpYXQiOjE3NzY5NTQ2MDEsImlzcyI6InBob2VuaXhhcGkuaHN0cGxhbmV0LmNvbSIsImF1ZCI6ImhzdHBsYW5ldC5jb20ifQ.8OVpONWZ8Ieyt82EmmYE5y7oFN_1R4_CxjSHh7uMIKA",
    notificationsToken: process.env.LOCOFABRIC_TOKEN_NOTIFICATIONS ?? "",
    videoToken: process.env.LOCOFABRIC_TOKEN_VIDEO ?? "",

    // Alias'lar (projede yaygin kullanim)
    company: process.env.LOCOFABRIC_TOKEN_COMPANY ?? "",
    menu: process.env.LOCOFABRIC_TOKEN_MENU ?? "",
  },
} as const

