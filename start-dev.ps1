# Script per avviare il server di sviluppo Angular con Node 22

# Configura fnm
fnm env --use-on-cd | Out-String | Invoke-Expression

# Usa Node 22
fnm use 22

# Verifica la versione
Write-Host "Using Node version:" -ForegroundColor Green
node --version

# # Termina eventuali processi Node/npm residui
# Write-Host "Checking for running Node processes..." -ForegroundColor Yellow
# $nodeProcesses = Get-Process node, npm -ErrorAction SilentlyContinue
# if ($nodeProcesses) {
#     Write-Host "Stopping existing Node/npm processes..." -ForegroundColor Yellow
#     $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
#     Start-Sleep -Seconds 1
# }

# # Pulisci la cache se necessario
# if (Test-Path ".angular") {
#     Write-Host "Cleaning Angular cache..." -ForegroundColor Yellow
#     Remove-Item -Recurse -Force .angular -ErrorAction SilentlyContinue
# }

# if (Test-Path "node_modules/.vite") {
#     Write-Host "Cleaning Vite cache..." -ForegroundColor Yellow
#     Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue
# }

# Avvia il server
Write-Host "Starting Angular dev server (SSR disabled for development)..." -ForegroundColor Green
npm start
