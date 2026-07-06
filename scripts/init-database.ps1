# One-time Katha database setup for Supabase.
# Creates all tables (profiles, stories, creators, dashboard RPC, etc.)

param(
  [string]$EnvFile = (Join-Path $PSScriptRoot "..\backend\.env")
)

$root = Split-Path $PSScriptRoot -Parent
$bootstrap = Join-Path $root "supabase\bootstrap_all.sql"
$combine = Join-Path $PSScriptRoot "combine-migrations.ps1"

if (-not (Test-Path $bootstrap)) {
  & $combine
}

function Read-EnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path $Path)) { return $null }
  foreach ($line in Get-Content $Path) {
    if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$supabaseUrl = Read-EnvValue $EnvFile "SUPABASE_URL"
$projectRef = $null
if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
  $projectRef = $Matches[1]
}

$dbUrl = Read-EnvValue $EnvFile "SUPABASE_DB_URL"
if (-not $dbUrl) { $dbUrl = $env:SUPABASE_DB_URL }

Write-Host ""
Write-Host "Katha database setup" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

if ($dbUrl) {
  Write-Host "SUPABASE_DB_URL found - applying migrations via Supabase CLI..." -ForegroundColor Yellow
  Push-Location $root
  try {
    npx supabase db query --file $bootstrap --db-url $dbUrl --yes
    if ($LASTEXITCODE -eq 0) {
      Write-Host ""
      Write-Host "Database initialized successfully." -ForegroundColor Green
      Write-Host "Refresh Creator CMS in your browser." -ForegroundColor Green
      exit 0
    }
  } finally {
    Pop-Location
  }
  Write-Host "CLI apply failed - use manual steps below." -ForegroundColor Yellow
}

Write-Host "Your Supabase project is missing database tables (profiles, stories, etc.)."
Write-Host "Google sign-in works, but Creator Studio needs this one-time setup."
Write-Host ""
Write-Host "MANUAL SETUP (5 minutes):" -ForegroundColor Cyan
Write-Host "  1. Open Supabase SQL Editor (opening in browser...)"
Write-Host "  2. Click New query"
Write-Host "  3. Open this file in a text editor and copy ALL contents:"
Write-Host "     $bootstrap"
Write-Host "  4. Paste into SQL Editor and click RUN"
Write-Host "  5. Wait until it finishes (about 30-60 sec)"
Write-Host "  6. Refresh Creator CMS - the warning banner should disappear"
Write-Host ""

if ($projectRef) {
  $sqlUrl = "https://supabase.com/dashboard/project/$projectRef/sql/new"
  Write-Host "SQL Editor: $sqlUrl" -ForegroundColor Green
  Start-Process $sqlUrl
  Start-Process notepad.exe $bootstrap
} else {
  Write-Host "Set SUPABASE_URL in backend/.env to auto-open SQL Editor." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "AUTOMATED SETUP (optional):" -ForegroundColor Cyan
Write-Host '  Add SUPABASE_DB_URL to backend/.env (Database connection URI from Supabase Dashboard)'
Write-Host '  Then re-run: .\scripts\init-database.ps1'
Write-Host ""