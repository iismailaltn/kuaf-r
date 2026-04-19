import "server-only"

import axios from "axios"
import { appConfig } from "@/app.config"

export function createAxios() {
  const baseURL = `${appConfig.serverURL.replace(/\/+$/, "")}/api/`

  return axios.create({
    baseURL,
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

