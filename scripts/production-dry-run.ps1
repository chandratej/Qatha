# Katha production dry-run checklist - Cycle 6
# Non-destructive verification of builds, config, and go-live readiness.
#
# Usage:
#   .\scripts\production-dry-run.ps1
#   .\scripts\production-dry-run.ps1 -SkipE2E -SkipFlutter
#   .\scripts\production-dry-run.ps1 -ApiBase http://127.0.0.1:3001

[CmdletBinding()]
param(
  [switch]$SkipE2E,
  [switch]$SkipFlutter,
  [string]$ApiBase = "http://127.0.0.1:3001"
)

$ErrorActionPreference = "Continue"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$script:pass = 0
$script:fail = 0
$script:warn = 0

function Write-Step([string]$msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Ok([string]$msg) {
  $script:pass++
  Write-Host "  [PASS] $msg" -ForegroundColor Green
}

function Bad([string]$msg) {
  $script:fail++
  Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

function Warn([string]$msg) {
  $script:warn++
  Write-Host "  [WARN] $msg" -ForegroundColor Yellow
}

Write-Host "Katha production dry-run"
Write-Host "Root: $Root"
Write-Host "API:  $ApiBase"

# --- Tooling ---
Write-Step "Tooling"
foreach ($cmd in @("node", "npm")) {
  if (Get-Command $cmd -ErrorAction SilentlyContinue) {
    Ok "$cmd available"
  } else {
    Bad "$cmd not found"
  }
}
if (Get-Command flutter -ErrorAction SilentlyContinue) {
  Ok "flutter available"
} else {
  Warn "flutter not found (reader mobile checks may skip)"
}

# --- Critical files ---
Write-Step "Critical files and migrations"
$must = @(
  "creator-cms\package.json",
  "backend\package.json",
  "backend\src\services\storyTrust.js",
  "backend\src\services\razorpayOrders.js",
  "supabase\migrations\015_story_trust_spi.sql",
  "supabase\functions\recompute-story-trust\index.ts",
  "supabase\functions\payment-webhook\index.ts",
  "reader-app\lib\core\services\razorpay_checkout_io.dart",
  "reader-app\android\app\src\main\AndroidManifest.xml",
  "reader-app\ios\Runner\Info.plist"
)
foreach ($rel in $must) {
  $p = Join-Path $Root $rel
  if (Test-Path $p) {
    Ok $rel
  } else {
    Bad "missing $rel"
  }
}

# --- Env templates / hygiene ---
Write-Step "Environment templates"
foreach ($rel in @("backend\.env.example", "creator-cms\.env.example", "gateway\.env.example")) {
  $p = Join-Path $Root $rel
  if (Test-Path $p) {
    Ok $rel
  } else {
    Warn "optional missing $rel"
  }
}

$beEnv = Join-Path $Root "backend\.env"
if (Test-Path $beEnv) {
  $raw = Get-Content $beEnv -Raw -ErrorAction SilentlyContinue
  if ($raw -match "CREATOR_SHARE_PCT\s*=\s*40") {
    Ok "backend CREATOR_SHARE_PCT=40"
  } elseif ($raw -match "CREATOR_SHARE_PCT\s*=\s*60") {
    Warn "CREATOR_SHARE_PCT=60 - prefer 40 base (DEC-006)"
  } else {
    Warn "CREATOR_SHARE_PCT not found in backend .env"
  }

  if ($raw -match "RAZORPAY_KEY_ID\s*=\s*rzp_") {
    Ok "RAZORPAY_KEY_ID present"
  } else {
    Warn "RAZORPAY_KEY_ID not set in backend .env"
  }

  if ($raw -match "MOCK_MODE\s*=\s*true") {
    Warn "MOCK_MODE=true - set false for production"
  } else {
    Ok "MOCK_MODE not forced true (or unset)"
  }
} else {
  Warn "backend\.env not present (ok for CI; required for live money)"
}

# --- Android / iOS payment config ---
Write-Step "Mobile Razorpay platform config"
$manifestPath = Join-Path $Root "reader-app\android\app\src\main\AndroidManifest.xml"
$manifest = Get-Content $manifestPath -Raw
if ($manifest -match "android.permission.INTERNET") {
  Ok "Android INTERNET permission"
} else {
  Bad "Android INTERNET missing"
}
if ($manifest -match 'android:scheme="upi"') {
  Ok "Android UPI queries"
} else {
  Warn "Android UPI scheme queries missing"
}

$gradlePath = Join-Path $Root "reader-app\android\app\build.gradle.kts"
$gradle = Get-Content $gradlePath -Raw
if ($gradle -match "minSdk\s*=\s*maxOf") {
  Ok "Android minSdk maxOf(..., 23)"
} else {
  Warn "Check minSdk for Razorpay"
}

$plistPath = Join-Path $Root "reader-app\ios\Runner\Info.plist"
$plist = Get-Content $plistPath -Raw
if ($plist -match "LSApplicationQueriesSchemes") {
  Ok "iOS LSApplicationQueriesSchemes"
} else {
  Bad "iOS UPI schemes missing"
}
if ($plist -match "phonepe") {
  Ok "iOS phonepe/tez schemes present"
} else {
  Warn "iOS UPI scheme list incomplete"
}

# --- Backend tests ---
Write-Step "Backend unit tests"
Push-Location (Join-Path $Root "backend")
cmd /c "npm test >nul 2>&1"
if ($LASTEXITCODE -eq 0) {
  Ok "backend npm test"
} else {
  Bad "backend npm test exit $LASTEXITCODE"
}
Pop-Location

# --- Creator CMS unit + build ---
Write-Step "Creator Studio unit tests + build"
Push-Location (Join-Path $Root "creator-cms")
cmd /c "npm test -- --run >nul 2>&1"
if ($LASTEXITCODE -eq 0) {
  Ok "creator-cms unit tests"
} else {
  Bad "creator-cms unit tests failed"
}

$env:VITE_MOCK_MODE = "true"
cmd /c "npm run build >nul 2>&1"
if ($LASTEXITCODE -eq 0) {
  Ok "creator-cms production build"
} else {
  Bad "creator-cms build failed"
}
Pop-Location

# --- Playwright (optional) ---
if (-not $SkipE2E) {
  Write-Step "Playwright E2E (chromium)"
  Push-Location (Join-Path $Root "creator-cms")
  cmd /c "npx playwright test --project=chromium >nul 2>&1"
  if ($LASTEXITCODE -eq 0) {
    Ok "playwright chromium golden path"
  } else {
    Bad "playwright failed"
  }
  Pop-Location
} else {
  Warn "Skipped E2E (-SkipE2E)"
}

# --- Flutter ---
if (-not $SkipFlutter -and (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Step "Flutter reader tests"
  Push-Location (Join-Path $Root "reader-app")
  cmd /c "flutter test test/paywall_copy_test.dart test/subscription_checkout_test.dart >nul 2>&1"
  if ($LASTEXITCODE -eq 0) {
    Ok "flutter paywall/checkout unit tests"
  } else {
    Bad "flutter tests failed"
  }
  Pop-Location
} else {
  Warn "Skipped Flutter (-SkipFlutter or no flutter SDK)"
}

# --- Live API probes ---
Write-Step "API health probes (optional if server running)"
try {
  $health = Invoke-RestMethod -Uri "$ApiBase/health" -TimeoutSec 3 -ErrorAction Stop
  Ok ("GET /health status=" + $health.status + " mock=" + $health.mock_mode)
  if ($health.mock_mode -eq $true) {
    Warn "API is in MOCK_MODE"
  }
  try {
    $spi = Invoke-RestMethod -Uri "$ApiBase/api/ops/spi-stats" -TimeoutSec 5 -ErrorAction Stop
    Ok ("GET /api/ops/spi-stats total=" + $spi.total_stories + " never_computed=" + $spi.never_computed)
  } catch {
    Warn "spi-stats unavailable"
  }
} catch {
  Warn "API not reachable at $ApiBase - start backend for live probes"
}

# --- Manual checklist ---
Write-Step "Manual production checklist (print-only)"
$manual = @(
  "[ ] Apply supabase migrations through 015_story_trust_spi.sql",
  "[ ] Deploy Edge: payment-webhook, publish-chapter, recompute-story-trust",
  "[ ] Razorpay Dashboard webhook to payment-webhook URL + events enabled",
  "[ ] CREATOR_SHARE_PCT=40 on API; never dual-message flat 60/40",
  "[ ] VITE_MOCK_MODE=false on Creator Studio production",
  "[ ] VITE_STUDIO_LABS=false (or operator-only)",
  "[ ] Gateway NEXT_PUBLIC_RAZORPAY_KEY_ID + server secrets",
  "[ ] Reader dart-defines: API_BASE, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY",
  "[ ] Android release signing (not debug) for Play Store",
  "[ ] iOS Team + Bundle ID + App Store Connect",
  "[ ] Smoke: login -> publish chapter -> share OG -> paywall -> webhook",
  "[ ] Smoke: offline publish queue flush on reconnect",
  "[ ] Smoke: GET /api/ops/spi-stats after publish"
)
foreach ($line in $manual) {
  Write-Host "  $line"
}

# --- Summary ---
Write-Host ""
Write-Host "-------- SUMMARY --------" -ForegroundColor White
Write-Host "  PASS: $pass" -ForegroundColor Green
Write-Host "  WARN: $warn" -ForegroundColor Yellow
Write-Host "  FAIL: $fail" -ForegroundColor Red
Write-Host "Docs: docs/deploy/PRODUCTION_DRY_RUN.md ; reader-app/docs/RAZORPAY_MOBILE_SETUP.md ; progress/CYCLE-006.md"

if ($fail -gt 0) {
  exit 1
}
exit 0
