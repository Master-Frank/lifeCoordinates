# Windows Local Build & Test Script
Write-Host "🚀 Starting Local Build Verification..." -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# 1. Install
Write-Host "📦 Installing dependencies..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "Install failed"; exit 1 }

# 2. Build Core
Write-Host "🔧 Building Core..." -ForegroundColor Green
npm run build -w @life-coordinates/core
if ($LASTEXITCODE -ne 0) { Write-Error "Core build failed"; exit 1 }

# 3. Build API
Write-Host "🔧 Building API..." -ForegroundColor Green
npm run build -w @life-coordinates/api
if ($LASTEXITCODE -ne 0) { Write-Error "API build failed"; exit 1 }

# 4. Build Web
Write-Host "🔧 Building Web..." -ForegroundColor Green
npm run build -w @life-coordinates/web
if ($LASTEXITCODE -ne 0) { Write-Error "Web build failed"; exit 1 }

Write-Host "✅ All builds passed successfully!" -ForegroundColor Cyan
Write-Host "👉 To run locally:"
Write-Host "   1. Start API: node apps/api/dist/server.js"
Write-Host "   2. Serve Web: npx serve apps/web/dist"
