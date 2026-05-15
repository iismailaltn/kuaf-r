import fs from "fs"
import path from "path"

const outDir = path.join(process.cwd(), "out")
const indexPath = path.join(outDir, "index.html")

if (!fs.existsSync(indexPath)) {
  console.error("out/index.html yok. Once: npm run build")
  process.exit(1)
}

const html = fs.readFileSync(indexPath, "utf8")
for (const name of ["default.htm", "index.htm"]) {
  fs.writeFileSync(path.join(outDir, name), html)
}

// Eski ASP.NET kalintilari kaldir
for (const name of ["default.aspx", "Global.asax"]) {
  const p = path.join(outDir, name)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}

const binDir = path.join(outDir, "bin")
if (fs.existsSync(binDir)) {
  fs.rmSync(binDir, { recursive: true, force: true })
}

console.log("")
console.log("=== IIS YUKLEME ===")
console.log("1) Hosting httpdocs icindeki ESKI bin/, web.config (eski), Global.asax SILIN")
console.log("2) out/ icindekileri yukleyin")
console.log("3) Test: https://SITEADRESINIZ/kontrol.html")
console.log("4) Panel: https://SITEADRESINIZ" + (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/")
console.log("")
console.log("Kok URL (/) ASP.NET hatasi veriyorsa: npm run build:iis:panel kullanin")
console.log("  -> dosyalari httpdocs/panel/ altina yukleyin")
console.log("  -> https://SITEADRESINIZ/panel/")
console.log("")
