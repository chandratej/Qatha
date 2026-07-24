# Deploy / configure Katha API on Render free tier.
#
# Prerequisites:
#   1. Render CLI logged in (this script can run: login)
#   2. GitHub connected to Render: https://dashboard.render.com/account/github
#   3. Repo https://github.com/chandratej/Qatha exists and has a branch with backend/
#   4. Local backend/.env has Supabase + Razorpay keys
#
# Usage:
#   .\scripts\deploy-render-api.ps1
#   .\scripts\deploy-render-api.ps1 -Repo https://github.com/chandratej/Qatha -Branch main
#   .\scripts\deploy-render-api.ps1 -SkipCreate   # only set env + redeploy existing katha-api

[CmdletBinding()]
param(
  [string]$Repo = "https://github.com/chandratej/Qatha",
  [string]$Branch = "main",
  [string]$ServiceName = "katha-api",
  [string]$Region = "oregon",
  [string]$WorkspaceId = "tea-d9hp6ukvikkc739omq7g",
  [string]$EnvFile = (Join-Path $PSScriptRoot "..\backend\.env"),
  [switch]$SkipCreate,
  [switch]$Login
)

$ErrorActionPreference = "Stop"
$Render = "$env:LOCALAPPDATA\render-cli\cli_v2.22.0.exe"
if (-not (Test-Path $Render)) {
  throw "Render CLI not found at $Render — re-download from github.com/render-oss/cli/releases"
}

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$CmsEnv = Join-Path $Root "creator-cms\.env"

function Get-EnvVal([string]$Path, [string]$Key) {
  if (-not (Test-Path $Path)) { return $null }
  foreach ($line in Get-Content $Path) {
    if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

function Set-CmsApiUrl([string]$ApiBase) {
  $base = $ApiBase.TrimEnd('/')
  if ($base -notmatch '/api$') { $base = "$base/api" }
  $lines = @()
  if (Test-Path $CmsEnv) { $lines = @(Get-Content $CmsEnv) }
  $found = $false
  $out = foreach ($line in $lines) {
    if ($line -match '^\s*VITE_API_URL\s*=') { $found = $true; "VITE_API_URL=$base" }
    else { $line }
  }
  if (-not $found) { $out = @($out) + "VITE_API_URL=$base" }
  $mockFound = $false
  $out2 = foreach ($line in $out) {
    if ($line -match '^\s*VITE_MOCK_MODE\s*=') { $mockFound = $true; "VITE_MOCK_MODE=false" }
    else { $line }
  }
  if (-not $mockFound) { $out2 = @($out2) + "VITE_MOCK_MODE=false" }
  Set-Content -Path $CmsEnv -Value $out2 -Encoding UTF8
  $urlFile = Join-Path $Root "Worklog\24_JUL_2026\Render_API_URL.txt"
  Set-Content -Path $urlFile -Value $base -Encoding UTF8
  Write-Host "CMS VITE_API_URL=$base" -ForegroundColor Green
}

if ($Login) {
  & $Render login
}

& $Render workspace set $WorkspaceId -o text | Out-Null

# Build env-var flags from backend/.env
$required = @("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY")
foreach ($k in $required) {
  if (-not (Get-EnvVal $EnvFile $k)) { throw "Missing $k in $EnvFile" }
}

$spi = Get-EnvVal $EnvFile "SPI_BATCH_SECRET"
if (-not $spi) {
  $spi = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
}

$pairs = [ordered]@{
  NODE_ENV                     = "production"
  MOCK_MODE                    = "false"
  CREATOR_SHARE_PCT            = (Get-EnvVal $EnvFile "CREATOR_SHARE_PCT")
  LAUNCH_OFFER_MODE            = (Get-EnvVal $EnvFile "LAUNCH_OFFER_MODE")
  KATHA_UNPROVEN_FREE_CHAPTERS = (Get-EnvVal $EnvFile "KATHA_UNPROVEN_FREE_CHAPTERS")
  SPI_BATCH_SECRET             = $spi
  ALLOWED_ORIGINS              = "http://localhost:5173,http://127.0.0.1:5173,https://studio.katha.in,https://katha.app"
  SUPABASE_URL                 = (Get-EnvVal $EnvFile "SUPABASE_URL")
  SUPABASE_PUBLISHABLE_KEY     = (Get-EnvVal $EnvFile "SUPABASE_PUBLISHABLE_KEY")
  SUPABASE_SECRET_KEY          = (Get-EnvVal $EnvFile "SUPABASE_SECRET_KEY")
  RAZORPAY_KEY_ID              = (Get-EnvVal $EnvFile "RAZORPAY_KEY_ID")
  RAZORPAY_KEY_SECRET          = (Get-EnvVal $EnvFile "RAZORPAY_KEY_SECRET")
  RAZORPAY_WEBHOOK_SECRET      = (Get-EnvVal $EnvFile "RAZORPAY_WEBHOOK_SECRET")
  OPENAI_API_KEY               = (Get-EnvVal $EnvFile "OPENAI_API_KEY")
}
if (-not $pairs.CREATOR_SHARE_PCT) { $pairs.CREATOR_SHARE_PCT = "40" }
if (-not $pairs.LAUNCH_OFFER_MODE) { $pairs.LAUNCH_OFFER_MODE = "immediate" }
if (-not $pairs.KATHA_UNPROVEN_FREE_CHAPTERS) { $pairs.KATHA_UNPROVEN_FREE_CHAPTERS = "12" }

$envFlags = @()
foreach ($k in $pairs.Keys) {
  $v = $pairs[$k]
  if ([string]::IsNullOrEmpty($v)) { continue }
  $envFlags += @("--env-var", "$k=$v")
}

$serviceId = $null
$existing = & $Render services -o json 2>$null | ConvertFrom-Json
if ($existing) {
  $hit = @($existing) | Where-Object { $_.service.name -eq $ServiceName -or $_.name -eq $ServiceName } | Select-Object -First 1
  if ($hit) {
    $serviceId = $hit.service.id
    if (-not $serviceId) { $serviceId = $hit.id }
    Write-Host "Found existing service $ServiceName ($serviceId)" -ForegroundColor Cyan
  }
}

if (-not $SkipCreate -and -not $serviceId) {
  Write-Host "Creating service $ServiceName from $Repo ($Branch) ..." -ForegroundColor Cyan
  $createOut = & $Render services create `
    --name $ServiceName `
    --type web_service `
    --runtime node `
    --plan free `
    --region $Region `
    --repo $Repo `
    --branch $Branch `
    --root-directory backend `
    --build-command "npm ci --omit=dev" `
    --start-command "npm start" `
    --health-check-path /api/health `
    --auto-deploy `
    @envFlags `
    --confirm `
    -o json 2>&1

  $createText = $createOut | Out-String
  if ($LASTEXITCODE -ne 0) {
    Write-Host $createText -ForegroundColor Red
    if ($createText -match "unfetchable|invalid") {
      Write-Host @"

GitHub repo not visible to Render yet.

1. Open https://dashboard.render.com/account/github
2. Connect GitHub and grant access to chandratej/Qatha
3. Ensure branch '$Branch' exists with backend/ (push local code if needed)
4. Re-run: .\scripts\deploy-render-api.ps1

"@ -ForegroundColor Yellow
    }
    exit 2
  }
  Write-Host $createText
  try {
    $obj = $createText | ConvertFrom-Json
    $serviceId = $obj.id
    if (-not $serviceId) { $serviceId = $obj.service.id }
  } catch { }
}

if (-not $serviceId) {
  $list = & $Render services -o json | ConvertFrom-Json
  $hit = @($list) | Where-Object { ($_.service.name -eq $ServiceName) -or ($_.name -eq $ServiceName) } | Select-Object -First 1
  if ($hit) {
    $serviceId = $hit.service.id
    if (-not $serviceId) { $serviceId = $hit.id }
  }
}

if (-not $serviceId) {
  throw "Could not resolve service id for $ServiceName"
}

# Update env on existing service (create already set vars; re-set for safety)
Write-Host "Updating env vars on $serviceId ..." -ForegroundColor Cyan
& $Render services update $serviceId @envFlags --confirm -o text 2>&1 | Out-Null

Write-Host "Triggering deploy ..." -ForegroundColor Cyan
& $Render deploys create $serviceId --confirm -o text 2>&1

# Resolve URL
$svcJson = & $Render services -o json | ConvertFrom-Json
$svc = @($svcJson) | Where-Object { ($_.service.id -eq $serviceId) -or ($_.id -eq $serviceId) -or ($_.service.name -eq $ServiceName) } | Select-Object -First 1
$url = $null
if ($svc.service.serviceDetails.url) { $url = $svc.service.serviceDetails.url }
elseif ($svc.service.url) { $url = $svc.service.url }
elseif ($svc.url) { $url = $svc.url }

if (-not $url) {
  # free tier default hostname pattern
  $url = "https://$ServiceName.onrender.com"
  Write-Host "Assuming default URL $url (confirm in dashboard if different)" -ForegroundColor Yellow
}

Write-Host "Service URL: $url" -ForegroundColor Green
Write-Host "Health:      $url/api/health"

# Wait briefly and smoke
Start-Sleep -Seconds 15
try {
  $health = Invoke-RestMethod -Uri "$url/api/health" -TimeoutSec 60
  Write-Host ($health | ConvertTo-Json -Compress) -ForegroundColor Green
} catch {
  Write-Host "Health not ready yet (cold start / build). Check dashboard Events." -ForegroundColor Yellow
  Write-Host $_.Exception.Message
}

Set-CmsApiUrl $url
Write-Host "Done. Restart CMS dev server or redeploy Vercel." -ForegroundColor Cyan
