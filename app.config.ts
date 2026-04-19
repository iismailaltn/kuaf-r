import "server-only"

export const appConfig = {
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "https://hstplanet.com/",
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? "https://server.hstplanet.com",
  token: {
    blogToken: process.env.LOCOFABRIC_TOKEN_BLOG ?? "",
    blogCommentToken: process.env.LOCOFABRIC_TOKEN_BLOG_COMMENT ?? "",
    companyToken: process.env.LOCOFABRIC_TOKEN_COMPANY ?? "",
    menuToken: process.env.LOCOFABRIC_TOKEN_MENU ?? "",
    routeToken: process.env.LOCOFABRIC_TOKEN_ROUTE ?? "",
    user: process.env.LOCOFABRIC_TOKEN_USER ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJEYXRhVGFibGVJZCI6IjYyM2Q4ZDBmLTc1NGItNGZhMy04OWEyLTQ1NjlhNTQxY2Q3ZCIsIkRhdGFiYXNlIjoiQml6bWlyIiwiVGFibGUiOiJLdWxsYW7EsWPEsWxhciIsIlJlYWQiOiJUcnVlIiwiV3JpdGUiOiJUcnVlIiwiVXBkYXRlIjoiVHJ1ZSIsIkRlbGV0ZSI6IlRydWUiLCJOYW1lIjoiQml6bWlyLWt1bGxhbsSxY8SxbGFyIiwianRpIjoiYWYwOGNiMGMtMzU0Mi00NTk5LThjMDMtZWE0ZDE5OWI1OTZkIiwibmJmIjoxNzc0NzM2NTI2LCJleHAiOjIwOTAwOTY1MjYsImlhdCI6MTc3NDczNjUyNiwiaXNzIjoicGhvZW5peGFwaS5oc3RwbGFuZXQuY29tIiwiYXVkIjoiaHN0cGxhbmV0LmNvbSJ9.ZavJM6qJRkfgYOF3RD9saFtnmYqvfEvHlvblGQx-PvQ",
    order: process.env.LOCOFABRIC_TOKEN_ORDER ?? "",
    companyComments: process.env.LOCOFABRIC_TOKEN_COMPANY_COMMENTS ?? "",
    content: process.env.LOCOFABRIC_TOKEN_CONTENT ?? "",
    ads: process.env.LOCOFABRIC_TOKEN_ADS ?? "",
    notificationsToken: process.env.LOCOFABRIC_TOKEN_NOTIFICATIONS ?? "",
    videoToken: process.env.LOCOFABRIC_TOKEN_VIDEO ?? "",

    // Alias'lar (projede yaygin kullanim)
    company: process.env.LOCOFABRIC_TOKEN_COMPANY ?? "",
    menu: process.env.LOCOFABRIC_TOKEN_MENU ?? "",
  },
} as const

