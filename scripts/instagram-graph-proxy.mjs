/**
 * Instagram / Facebook Graph API CORS proxy (tarayici icin).
 * Kullanim: node scripts/instagram-graph-proxy.mjs
 * .env.local: NEXT_PUBLIC_INSTAGRAM_PROXY_URL=http://localhost:3099
 */
import http from "node:http"
import https from "node:https"
import { URL } from "node:url"

const PORT = Number(process.env.INSTAGRAM_PROXY_PORT ?? 3099)
const ALLOWED_HOSTS = new Set(["graph.instagram.com", "graph.facebook.com", "rupload.facebook.com"])

function forwardRequest(targetUrl, req, res) {
  const target = new URL(targetUrl)
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    res.writeHead(403, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Host not allowed" }))
    return
  }

  const headers = { ...req.headers, host: target.host }
  delete headers.origin
  delete headers.referer

  const proxyReq = https.request(
    target,
    { method: req.method, headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, {
        ...proxyRes.headers,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type",
      })
      proxyRes.pipe(res)
    },
  )

  proxyReq.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: err.message }))
  })

  req.pipe(proxyReq)
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization,Content-Type",
      "Access-Control-Max-Age": "86400",
    })
    res.end()
    return
  }

  const requestUrl = new URL(req.url ?? "/", `http://localhost:${PORT}`)
  const target = requestUrl.searchParams.get("target")
  if (!target) {
    res.writeHead(400, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Missing target query parameter" }))
    return
  }

  forwardRequest(target, req, res)
})

server.listen(PORT, () => {
  console.log(`Instagram Graph proxy: http://localhost:${PORT}`)
  console.log(`Set NEXT_PUBLIC_INSTAGRAM_PROXY_URL=http://localhost:${PORT}`)
})
