# Apply migrations 042-044 (free chapter, escrow, pricing) then re-run schema gate.
#
# Paths:
#   A) SUPABASE_DB_URL set → apply via npx supabase db query
#   B) No DB URL → open SQL Editor + combined SQL file for paste (manual)
#   C) After apply → node scripts/verify-wave-migrations.mjs
#
# Usage:
#   .\scripts\apply-042-044-and-verify.ps1
#   .\scripts\apply-042-044-and-verify.ps1 -DbUrl "postgresql://postgres....."
#   .\scripts\apply-042-044-and-verify.ps1 -OpenOnly   # open editor only
#   .\scripts\apply-042-044-and-verify.ps1 -VerifyOnly

[CmdletBinding()]
param(
  [string]$DbUrl = "",
  [string]$EnvFile = (Join-Path $PSScriptRoot "..\backend\.env"),
  [switch]$OpenOnly,
  [switch]$VerifyOnly
)

$ErrorActionPreference = "Continue"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Combined = Join-Path $Root "supabase\MVP1_PENDING_MIGRATIONS_042_044.sql"
$Backfill = Join-Path $Root "supabase\scripts\backfill_story_slugs.sql"
$Verify = Join-Path $Root "backend\scripts\verify-wave-migrations.mjs"

function Read-EnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path $Path)) { return $null }
  foreach ($line in Get-Content $Path) {
    if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

function Get-ProjectRef {
  $url = Read-EnvValue $EnvFile "SUPABASE_URL"
  if ($url -match 'https://([^.]+)\.supabase\.co') { return $Matches[1] }
  return $null
}

Write-Host ""
Write-Host "Katha - apply 042-044 + verify" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Combined SQL: $Combined"
Write-Host ""

if (-not (Test-Path $Combined)) {
  Write-Host "FAIL: combined SQL missing. Expected: $Combined" -ForegroundColor Red
  exit 1
}

if ($VerifyOnly) {
  Push-Location (Join-Path $Root "backend")
  try {
    node $Verify
    exit $LASTEXITCODE
  } finally {
    Pop-Location
  }
}

if (-not $DbUrl) {
  $DbUrl = Read-EnvValue $EnvFile "SUPABASE_DB_URL"
}
if (-not $DbUrl) {
  $DbUrl = $env:SUPABASE_DB_URL
}

$ref = Get-ProjectRef
$sqlEditor = if ($ref) {
  "https://supabase.com/dashboard/project/$ref/sql/new"
} else {
  "https://supabase.com/dashboard"
}

if ($OpenOnly -or -not $DbUrl) {
  Write-Host "No SUPABASE_DB_URL - opening manual apply path." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "1. SQL Editor will open (or go to):" -ForegroundColor Cyan
  Write-Host "   $sqlEditor"
  Write-Host "2. Paste ALL of:" -ForegroundColor Cyan
  Write-Host "   $Combined"
  Write-Host "3. Click Run (ignore harmless IF NOT EXISTS noise)."
  Write-Host "4. Then paste and run backfill (optional but recommended):"
  Write-Host "   $Backfill"
  Write-Host "5. Re-run this script with -VerifyOnly"
  Write-Host ""
  Write-Host "Automated alternative: set SUPABASE_DB_URL in backend/.env" -ForegroundColor DarkGray
  Write-Host '  postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres'
  Write-Host ""

  try { Start-Process $sqlEditor } catch { }
  try { Start-Process notepad.exe $Combined } catch {
    try { Invoke-Item $Combined } catch { }
  }

  if ($OpenOnly) { exit 0 }

  Write-Host "Waiting for you to run the SQL..." -ForegroundColor Yellow
  Write-Host "Press Enter after migrations succeed in the SQL Editor, or Ctrl+C to abort."
  [void](Read-Host)

  Push-Location (Join-Path $Root "backend")
  try {
    Write-Host ""
    Write-Host "Running verify-wave-migrations.mjs ..." -ForegroundColor Cyan
    node $Verify
    $code = $LASTEXITCODE
  } finally {
    Pop-Location
  }

  if ($code -eq 0) {
    Write-Host ""
    Write-Host "GATE PASSED - 042-044 schema present." -ForegroundColor Green
    Write-Host "Next: run backfill_story_slugs.sql if not done; deploy edge functions (see Mode B checklist)."
  } else {
    Write-Host ""
    Write-Host "GATE still failing - re-check SQL errors in the editor, then: .\scripts\apply-042-044-and-verify.ps1 -VerifyOnly" -ForegroundColor Red
  }
  exit $code
}

# --- Automated path via DB URL ---
Write-Host "Applying via SUPABASE_DB_URL ..." -ForegroundColor Cyan
Push-Location $Root
try {
  npx --yes supabase db query --file $Combined --db-url $DbUrl --yes
  if ($LASTEXITCODE -ne 0) {
    Write-Host "supabase db query failed (exit $LASTEXITCODE). Falling back to manual path." -ForegroundColor Yellow
    try { Start-Process $sqlEditor } catch { }
    try { Start-Process notepad.exe $Combined } catch { }
    exit 2
  }

  if (Test-Path $Backfill) {
    Write-Host "Applying slug/chapter_count backfill ..." -ForegroundColor Cyan
    npx --yes supabase db query --file $Backfill --db-url $DbUrl --yes
  }
} finally {
  Pop-Location
}

Push-Location (Join-Path $Root "backend")
try {
  Write-Host ""
  Write-Host "Running verify-wave-migrations.mjs ..." -ForegroundColor Cyan
  node $Verify
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
