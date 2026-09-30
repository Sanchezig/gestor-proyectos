# Deploy script for Gestor Proyectos to GitHub Pages
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$deployFiles = @(
	"index.html",
	"app.js",
	"config.js",
	"styles.css",
	"calendar.ico",
	"logo.png",
	"logo.svg",
	"deploy.ps1",
	".github/workflows/deploy-pages.yml"
)

Write-Host "🚀 Deploying Gestor Proyectos..." -ForegroundColor Cyan

# Sincronizar index.html → HTML legacy para mantener ambos alineados
Copy-Item "index.html" "PROD - Gestor Proyectos.html" -Force -ErrorAction Stop
Write-Host "✓ Sincronizado index.html → PROD - Gestor Proyectos.html" -ForegroundColor Green

# Commit only website files, leaving unrelated staged and unstaged changes untouched.
$commitMsg = "Deploy: $timestamp"
git commit -m $commitMsg --only -- $deployFiles
if ($LASTEXITCODE -ne 0) {
	throw "No se pudo crear el commit de despliegue (git exit code $LASTEXITCODE)."
}
Write-Host "✓ Committed: $commitMsg" -ForegroundColor Green

# Push to main
git push origin main
if ($LASTEXITCODE -ne 0) {
	throw "No se pudo subir el despliegue (git exit code $LASTEXITCODE)."
}
Write-Host "✓ Pushed to GitHub" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Deployed successfully!" -ForegroundColor Cyan
Write-Host "🌐 Live at: https://sanchezig.github.io/gestor-proyectos/" -ForegroundColor Yellow
Write-Host ""
Write-Host "GitHub Pages deployment typically takes 1-3 minutes." -ForegroundColor Gray
