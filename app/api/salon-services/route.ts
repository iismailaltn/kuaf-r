import { NextResponse } from "next/server"
import type { AxiosError } from "axios"
import { appConfig } from "@/app.config"
import { selectByToken } from "@/lib/services/locofabric-database"
import { normalizeSalonServiceRows, type SalonServiceRow } from "@/lib/salon-services"

function extractRows(data: unknown) {
  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: SalonServiceRow[] }).data
  }
  if (Array.isArray((data as { Data?: unknown })?.Data)) {
    return (data as { Data: SalonServiceRow[] }).Data
  }
  if (Array.isArray(data)) {
    return data as SalonServiceRow[]
  }
  return []
}

export async function GET() {
  try {
    const token = appConfig.token.salonservis
    if (!token) {
      return NextResponse.json({ ok: false, message: "salonservis token tanimli degil." }, { status: 500 })
    }

    const data = await selectByToken<unknown>(token)
    const rows = normalizeSalonServiceRows(extractRows(data))

    return NextResponse.json({ ok: true, rows })
  } catch (err) {
    const axiosErr = err as AxiosError | undefined
    const status = (axiosErr as { response?: { status?: number } })?.response?.status
    const data = (axiosErr as { response?: { data?: unknown } })?.response?.data
    return NextResponse.json(
      {
        ok: false,
        message: "Salon hizmetleri getirilemedi.",
        error: axiosErr?.message ?? String(err),
        upstreamStatus: typeof status === "number" ? status : undefined,
        upstreamData: data,
      },
      { status: 502 }
    )
  }
}
