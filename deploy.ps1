# Deploy script for Gestor Proyectos to GitHub Pages
# Usage: .\deploy.ps1

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "🚀 Deploying Gestor Proyectos..." -ForegroundColor Cyan

# Sincronizar HTML local → index.html (el que sirve GitHub Pages)
Copy-Item "PROD - Gestor Proyectos.html" "index.html" -Force
Write-Host "✓ Sincronizado HTML → index.html" -ForegroundColor Green

# Stage all changes
git add -A
Write-Host "✓ Staged files" -ForegroundColor Green

# Commit with timestamp
$commitMsg = "Deploy: $timestamp"
git commit -m $commitMsg
Write-Host "✓ Committed: $commitMsg" -ForegroundColor Green

# Push to main
git push origin main
Write-Host "✓ Pushed to GitHub" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Deployed successfully!" -ForegroundColor Cyan
Write-Host "🌐 Live at: https://sanchezig.github.io/gestor-proyectos/" -ForegroundColor Yellow
Write-Host ""
Write-Host "GitHub Pages deployment typically takes 1-3 minutes." -ForegroundColor Gray
