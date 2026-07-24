# Deploy Katha backend API to Railway (free-tier beta).
#
# Prerequisites:
#   1. Railway account: https://railway.app
#   2. Login once:  npx @railway/cli login
#      (or set $env:RAILWAY_TOKEN from Railway → Account → Tokens)
#
# Usage (from repo root):
#   .\scripts\deploy-railway-api.ps1
#   .\scripts\deploy-railway-api.ps1 -SkipLink   # if already linked in backend/
#
# After deploy, script prints public URL and patches creator-cms/.env VITE_API_URL.

[CmdletBinding()]
param(
  [switch]$SkipLink,
  [switch]$SkipDeploy,
  [string]$EnvFile = (Join-Path $PSScriptRoot "..\backend\.env")
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Backend = Join-Path $Root "backend"
$CmsEnv = Join-Path $Root "creator-cms\.env"

function Read-EnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path $Path)) { return $null }
  foreach ($line in Get-Content $Path) {
    if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

function Set-EnvLine([string]$Path, [string]$Key, [string]$Value) {
  $lines = @()
  if (Test-Path $Path) { $lines = Get-Content $Path }
  $found = $false
  $out = foreach ($line in $lines) {
    if ($line -match "^\s*$Key\s*=") {
      $found = $true
      "$Key=$Value"
    } else { $line }
  }
  if (-not $found) { $out = @($out) + "$Key=$Value" }
  Set-Content -Path $Path -Value $out -Encoding UTF8
}

function Invoke-Railway([string[]]$RailArgs) {
  Write-Host "> railway $($RailArgs -join ' ')" -ForegroundColor DarkGray
  & npx --yes @railway/cli @RailArgs
  if ($LASTEXITCODE -ne 0) {
    throw "railway $($RailArgs[0]) failed with exit $LASTEXITCODE"
  }
}

Write-Host ""
Write-Host "Katha API → Railway" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

if (-not (Test-Path $EnvFile)) {
  throw "Missing $EnvFile — need Supabase + Razorpay vars"
}

# Auth check
try {
  $who = & npx --yes @railway/cli whoami 2>&1 | Out-String
  Write-Host $who
  if ($who -match "Unauthorized|not logged|Login required|No account") {
    throw "not logged in"
  }
} catch {
  Write-Host @"

Railway CLI is not authenticated.

  Option A:  npx @railway/cli login
  Option B:  Create token at https://railway.app/account/tokens
             then:  `$env:RAILWAY_TOKEN = 'your-token'

Re-run:  .\scripts\deploy-railway-api.ps1
"@ -ForegroundColor Yellow
  exit 1
}

Push-Location $Backend
try {
  if (-not $SkipLink) {
    $linked = Test-Path (Join-Path $Backend ".railway")
    if (-not $linked) {
      Write-Host "Creating Railway project katha-api ..." -ForegroundColor Cyan
      try {
        Invoke-Railway @("init", "--name", "katha-api", "--json")
      } catch {
        Write-Host @"

Railway create failed (often: trial expired / plan required).
  Fix: https://railway.app/account → select a plan, then re-run this script.
  Fallback: use Render free — see Worklog/24_JUL_2026/Railway_Deploy_Steps.md

$($_.Exception.Message)
"@ -ForegroundColor Yellow
        exit 2
      }
    }
  }

  # Variables from backend/.env
  $vars = @{
    NODE_ENV                      = "production"
    MOCK_MODE                     = "false"
    SUPABASE_URL                  = (Read-EnvValue $EnvFile "SUPABASE_URL")
    SUPABASE_PUBLISHABLE_KEY      = (Read-EnvValue $EnvFile "SUPABASE_PUBLISHABLE_KEY")
    SUPABASE_SECRET_KEY           = (Read-EnvValue $EnvFile "SUPABASE_SECRET_KEY")
    RAZORPAY_KEY_ID               = (Read-EnvValue $EnvFile "RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET           = (Read-EnvValue $EnvFile "RAZORPAY_KEY_SECRET")
    RAZORPAY_WEBHOOK_SECRET       = (Read-EnvValue $EnvFile "RAZORPAY_WEBHOOK_SECRET")
    CREATOR_SHARE_PCT             = (Read-EnvValue $EnvFile "CREATOR_SHARE_PCT")
    LAUNCH_OFFER_MODE             = (Read-EnvValue $EnvFile "LAUNCH_OFFER_MODE")
    KATHA_UNPROVEN_FREE_CHAPTERS  = (Read-EnvValue $EnvFile "KATHA_UNPROVEN_FREE_CHAPTERS")
    OPENAI_API_KEY                = (Read-EnvValue $EnvFile "OPENAI_API_KEY")
  }

  # Defaults if unset in local .env
  if (-not $vars.CREATOR_SHARE_PCT) { $vars.CREATOR_SHARE_PCT = "40" }
  if (-not $vars.LAUNCH_OFFER_MODE) { $vars.LAUNCH_OFFER_MODE = "immediate" }
  if (-not $vars.KATHA_UNPROVEN_FREE_CHAPTERS) { $vars.KATHA_UNPROVEN_FREE_CHAPTERS = "12" }

  # SPI secret: reuse or generate
  $spi = Read-EnvValue $EnvFile "SPI_BATCH_SECRET"
  if (-not $spi) {
    $spi = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
    Write-Host "Generated SPI_BATCH_SECRET (also write to host only — not committing)." -ForegroundColor Yellow
  }
  $vars.SPI_BATCH_SECRET = $spi

  # CORS: CMS local + Vercel preview pattern placeholders (update after Vercel domains known)
  $origins = @(
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://studio.katha.in",
    "https://katha.in",
    "https://katha.app",
    "https://*.vercel.app"
  ) -join ","
  # Note: express CORS exact-match won't expand *.vercel.app — set concrete Vercel URLs after first CMS deploy
  $vars.ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,https://studio.katha.in,https://katha.in,https://katha.app"

  $required = @("SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_PUBLISHABLE_KEY")
  foreach ($k in $required) {
    if (-not $vars[$k]) { throw "Missing $k in $EnvFile" }
  }

  Write-Host "Setting Railway variables ..." -ForegroundColor Cyan
  foreach ($k in $vars.Keys) {
    $v = $vars[$k]
    if ([string]::IsNullOrEmpty($v)) {
      Write-Host "  skip empty $k" -ForegroundColor DarkGray
      continue
    }
    & npx --yes @railway/cli variable set "$k=$v" --skip-deploys 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to set variable $k (exit $LASTEXITCODE)"
    }
    if ($k -match "SECRET|KEY") {
      Write-Host "  set $k (redacted)" -ForegroundColor DarkGray
    } else {
      Write-Host "  set $k=$v" -ForegroundColor DarkGray
    }
  }

  if (-not $SkipDeploy) {
    Write-Host "Deploying ..." -ForegroundColor Cyan
    Invoke-Railway @("up", "--detach", "-y")
  }

  # Public domain
  Write-Host "Ensuring public domain ..." -ForegroundColor Cyan
  $domainOut = & npx --yes @railway/cli domain --json 2>&1
  if ($LASTEXITCODE -ne 0) {
    $domainOut = & npx --yes @railway/cli domain 2>&1
  }
  $domainText = $domainOut | Out-String
  Write-Host $domainText

  $publicUrl = $null
  if ($domainText -match '(https://[a-zA-Z0-9.-]+\.up\.railway\.app)') {
    $publicUrl = $Matches[1]
  } elseif ($domainText -match '([a-zA-Z0-9.-]+\.up\.railway\.app)') {
    $publicUrl = "https://$($Matches[1])"
  }

  if (-not $publicUrl) {
    $st = & npx --yes @railway/cli status 2>&1 | Out-String
    Write-Host $st
    if ($st -match '(https://[a-zA-Z0-9.-]+\.up\.railway\.app)') {
      $publicUrl = $Matches[1]
    }
  }

  if ($publicUrl) {
    $apiBase = "$publicUrl/api"
    Write-Host ""
    Write-Host "Public API: $apiBase" -ForegroundColor Green
    Write-Host "Health:     $publicUrl/api/health" -ForegroundColor Green

    # Point CMS at Railway
    if (Test-Path $CmsEnv) {
      Set-EnvLine $CmsEnv "VITE_API_URL" $apiBase
      Write-Host "Updated creator-cms/.env VITE_API_URL=$apiBase" -ForegroundColor Green
    } else {
      Write-Host "creator-cms/.env missing — create from .env.example and set:" -ForegroundColor Yellow
      Write-Host "  VITE_API_URL=$apiBase"
    }

    # Persist for re-runs
    $urlFile = Join-Path $Root "Worklog\24_JUL_2026\Railway_API_URL.txt"
    Set-Content -Path $urlFile -Value $apiBase -Encoding UTF8
    Write-Host "Saved $urlFile"

    Write-Host ""
    Write-Host "Smoke:" -ForegroundColor Cyan
    Write-Host "  curl $publicUrl/api/health"
  } else {
    Write-Host @"

Deploy submitted. Get the public URL from Railway dashboard → service → Settings → Networking → Generate Domain,
then set creator-cms/.env:

  VITE_API_URL=https://YOUR-SERVICE.up.railway.app/api

"@ -ForegroundColor Yellow
  }
} finally {
  Pop-Location
}
