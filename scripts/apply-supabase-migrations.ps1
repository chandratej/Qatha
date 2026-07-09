# Apply Katha migrations to a Supabase project.
# Option A: supabase db push (if CLI is linked)
# Option B: opens combined SQL instructions for manual paste in SQL Editor

param(
  [switch]$GenerateOnly
)

$root = Split-Path $PSScriptRoot -Parent
$combine = Join-Path $PSScriptRoot "combine-migrations.ps1"
& $combine

$bootstrap = Join-Path $root "supabase\bootstrap_all.sql"

if ($GenerateOnly) { exit 0 }

$supabase = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabase) {
  Write-Host ""
  Write-Host "Attempting: supabase db push ..." -ForegroundColor Cyan
  Push-Location $root
  try {
    supabase db push
    if ($LASTEXITCODE -eq 0) {
      Write-Host "Migrations applied via Supabase CLI." -ForegroundColor Green
      exit 0
    }
  } finally {
    Pop-Location
  }
  Write-Host "CLI push failed or project not linked — use manual steps below." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Manual setup (one-time):" -ForegroundColor Cyan
Write-Host "  1. Open https://supabase.com/dashboard -> your project -> SQL Editor"
Write-Host "  2. New query -> paste contents of:"
Write-Host "     $bootstrap"
Write-Host "  3. Click Run (may take 30-60 seconds)"
Write-Host "  4. Deploy Edge Functions: supabase functions deploy register-device whatsapp-otp"
Write-Host "  5. Restart Creator CMS dev server"