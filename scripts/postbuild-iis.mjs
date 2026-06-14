import fs from "fs"
import path from "path"

const outDir = path.join(process.cwd(), "out")
const indexPath = path.join(outDir, "index.html")
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || ""

if (!fs.existsSync(indexPath)) {
  console.error("out/index.html yok. Once: npm run build:iis")
  process.exit(1)
}

const html = fs.readFileSync(indexPath, "utf8")
for (const name of ["default.htm", "index.htm"]) {
  fs.writeFileSync(path.join(outDir, name), html)
}

for (const name of ["default.aspx", "Global.asax"]) {
  const filePath = path.join(outDir, name)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

const binDir = path.join(outDir, "bin")
if (fs.existsSync(binDir)) {
  fs.rmSync(binDir, { recursive: true, force: true })
}

function collectCssFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectCssFiles(fullPath, files)
    } else if (entry.name.endsWith(".css")) {
      files.push(fullPath)
    }
  }
  return files
}

const cssFiles = collectCssFiles(path.join(outDir, "_next"))
const totalCssBytes = cssFiles.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0)

if (cssFiles.length === 0 || totalCssBytes < 10_000) {
  console.error("")
  console.error("HATA: CSS derlenmemis veya _next klasoru eksik.")
  console.error("out/_next icinde en az bir CSS dosyasi olmali.")
  process.exit(1)
}

const cssSample = cssFiles[0].replace(outDir, "").replace(/\\/g, "/")
const htmlCssMatch = html.match(/href="([^"]+\.css)"/)
const deployTarget = basePath ? `httpdocs${basePath.replace(/\//g, path.sep)}` : "httpdocs"

fs.writeFileSync(
  path.join(outDir, "YUKLEME-TALIMATI.txt"),
  [
    "Kuaför Panel - Statik yukleme",
    "",
    `Build yolu (basePath): ${basePath || "(kok /)"}`,
    `CSS dosya sayisi: ${cssFiles.length}`,
    `CSS toplam boyut: ${Math.round(totalCssBytes / 1024)} KB`,
    htmlCssMatch ? `Ornek CSS linki: ${htmlCssMatch[1]}` : "",
    "",
    "ONEMLI:",
    "1) out/ icindeki TUM dosya ve klasorleri yukleyin (_next dahil!)",
    `2) Fiziksel hedef: ${deployTarget}`,
    basePath
      ? `3) Tarayici adresi: https://SITEADRESINIZ${basePath}/`
      : "3) Tarayici adresi: https://SITEADRESINIZ/",
    "4) Sadece index.html yuklemek yetmez; _next klasoru sart.",
    "",
  ].join("\n"),
)

console.log("")
console.log("=== IIS YUKLEME ===")
console.log(`CSS: ${cssFiles.length} dosya, ${Math.round(totalCssBytes / 1024)} KB`)
console.log(htmlCssMatch ? `CSS linki: ${htmlCssMatch[1]}` : "")
console.log(`Ornek dosya: ${cssSample}`)
console.log("")
console.log("1) Eski bin/, Global.asax ve eski web.config kaldirin")
console.log(`2) out/ icerigini su klasore yukleyin: ${deployTarget}`)
console.log("3) _next klasorunu mutlaka yukleyin")
console.log("4) Test: https://SITEADRESINIZ" + (basePath || "") + "/kontrol.html")
console.log("5) Panel: https://SITEADRESINIZ" + (basePath || "") + "/")
console.log("")
if (basePath) {
  console.log("Bu build /panel/ alt yolu icin uretildi.")
  console.log("Dosyalari httpdocs kokune degil, panel/ klasorune yukleyin.")
} else {
  console.log("Kok URL ASP.NET hatasi veriyorsa: npm run build:iis:panel")
  console.log("  -> ciktiyi httpdocs/panel/ altina yukleyin")
}
console.log("")
