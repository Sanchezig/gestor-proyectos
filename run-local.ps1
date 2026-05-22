$port = 8080

Write-Host "Iniciando servidor local en http://localhost:$port/index.html" -ForegroundColor Cyan
Write-Host "Pulsa Ctrl+C para detenerlo." -ForegroundColor Yellow

Start-Process "http://localhost:$port/index.html"
python -m http.server $port
