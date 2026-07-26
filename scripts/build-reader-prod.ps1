# Build Mode B reader APK against production API + Supabase.
# Usage:
#   .\scripts\build-reader-prod.ps1
#   .\scripts\build-reader-prod.ps1 -GoogleWebClientId "xxx.apps.googleusercontent.com"

param(
  [string]$GoogleWebClientId = $env:GOOGLE_WEB_CLIENT_ID,
  [string]$ApiBase = "https://katha-api.onrender.com/api",
  [string]$SupabaseUrl = "https://qviedmvezaehfcbmfmbc.supabase.co",
  [string]$SupabasePublishableKey = "",
  [string]$PrivacyUrl = "https://katha-landing-psi.vercel.app/privacy.html",
  [string]$TermsUrl = "https://katha-landing-psi.vercel.app/terms.html",
  [string]$WebBase = "https://katha-landing-psi.vercel.app",
  [switch]$AppBundle
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Reader = Join-Path $Root "reader-app"

if (-not $SupabasePublishableKey) {
  $cmsEnv = Join-Path $Root "creator-cms\.env"
  if (Test-Path $cmsEnv) {
    foreach ($line in Get-Content $cmsEnv) {
      if ($line -match '^\s*VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*(.+)\s*$') {
        $SupabasePublishableKey = $Matches[1].Trim().Trim('"').Trim("'")
      }
    }
  }
}
if (-not $SupabasePublishableKey) {
  throw "Pass -SupabasePublishableKey or set VITE_SUPABASE_PUBLISHABLE_KEY in creator-cms/.env"
}

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  throw "Flutter SDK not found on PATH"
}

$defineArgs = @(
  "--dart-define=API_BASE=$ApiBase",
  "--dart-define=SUPABASE_URL=$SupabaseUrl",
  "--dart-define=SUPABASE_PUBLISHABLE_KEY=$SupabasePublishableKey",
  "--dart-define=PRIVACY_URL=$PrivacyUrl",
  "--dart-define=TERMS_URL=$TermsUrl",
  "--dart-define=WEB_BASE=$WebBase"
)
if (-not $GoogleWebClientId) {
  # Prefer process env, then common local env files (never commit secrets).
  $GoogleWebClientId = $env:GOOGLE_WEB_CLIENT_ID
}
if (-not $GoogleWebClientId) {
  foreach ($envPath in @(
      (Join-Path $Root "reader-app\.env"),
      (Join-Path $Root "creator-cms\.env"),
      (Join-Path $Root "backend\.env")
    )) {
    if (-not (Test-Path $envPath)) { continue }
    foreach ($line in Get-Content $envPath) {
      if ($line -match '^\s*(?:VITE_)?GOOGLE_WEB_CLIENT_ID\s*=\s*(.+)\s*$') {
        $GoogleWebClientId = $Matches[1].Trim().Trim('"').Trim("'")
        break
      }
    }
    if ($GoogleWebClientId) { break }
  }
}
if ($GoogleWebClientId) {
  $defineArgs += "--dart-define=GOOGLE_WEB_CLIENT_ID=$GoogleWebClientId"
  Write-Host "Google Web Client ID: baked into release (len=$($GoogleWebClientId.Length))" -ForegroundColor Green
} else {
  Write-Host "WARNING: GOOGLE_WEB_CLIENT_ID not set." -ForegroundColor Yellow
  Write-Host "  Google sign-in will be disabled; email magic-link still works." -ForegroundColor Yellow
  Write-Host "  Fix: .\scripts\build-reader-prod.ps1 -GoogleWebClientId 'xxx.apps.googleusercontent.com'" -ForegroundColor Yellow
  Write-Host "  Or set env GOOGLE_WEB_CLIENT_ID / reader-app\.env" -ForegroundColor Yellow
}

Push-Location $Reader
try {
  Write-Host "flutter pub get..." -ForegroundColor Cyan
  flutter pub get
  if ($AppBundle) {
    Write-Host "Building appbundle (release)..." -ForegroundColor Cyan
    & flutter build appbundle --release @defineArgs
    Write-Host "Output: reader-app/build/app/outputs/bundle/release/" -ForegroundColor Green
  } else {
    Write-Host "Building APK (release)..." -ForegroundColor Cyan
    & flutter build apk --release @defineArgs
    $apk = Join-Path $Reader "build\app\outputs\flutter-apk\app-release.apk"
    Write-Host "APK: $apk" -ForegroundColor Green
  }
  $kp = Join-Path $Reader "android\key.properties"
  if (-not (Test-Path $kp)) {
    Write-Host "NOTE: android/key.properties missing - release may use debug signing." -ForegroundColor Yellow
  }
} finally {
  Pop-Location
}
