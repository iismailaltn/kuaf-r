import { appConfig } from "@/app.config"

export const apiConfig = {
  baseURL: appConfig.baseURL,
  serverURL: appConfig.serverURL,
}

export const apiTokens = {
  user: appConfig.token.user,
  order: appConfig.token.order,
  menu: appConfig.token.menuToken,
  company: appConfig.token.companyToken,
}

export type ApiTokenKey = keyof typeof apiTokens
