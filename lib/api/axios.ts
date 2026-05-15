import axios from "axios"
import { appConfig } from "@/app.config"

/** API taban URL — varsayilan dogrudan server.hstplanet.com (IIS rewrite gerektirmez). */
export function getApiBaseUrl() {
  const custom = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (custom) {
    return custom.endsWith("/") ? custom : `${custom}/`
  }
  return `${appConfig.serverURL.replace(/\/+$/, "")}/api/`
}

export function createAxios() {
  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
