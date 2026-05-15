# IIS icin sadece out/ icerigini zip'ler (yanlis dosya yuklenmesini onler)
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$root\out\index.html")) {
  Write-Host "Once: npm run build"
  exit 1
}
$zip = Join-Path $root "kuaför-panel-iis.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "$root\out\*" -DestinationPath $zip -Force
Write-Host "Hazir: $zip"
Write-Host "Sunucuda zip'i acin; icindeki DOSYALARI (klasor degil) site kokune kopyalayin."
