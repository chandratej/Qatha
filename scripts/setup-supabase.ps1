# Katha Supabase setup helper
# Prerequisites: Supabase project created at https://supabase.com

param(
  [string]$ProjectRef = "",
  [string]$DbPassword = ""
)

Write-Host "Katha Supabase Setup" -ForegroundColor Cyan
Write-Host ""

if (-not $ProjectRef) {
  Write-Host "Usage: .\scripts\setup-supabase.ps1 -ProjectRef YOUR_PROJECT_REF"
  Write-Host ""
  Write-Host "Steps:"
  Write-Host "  1. Create project at https://supabase.com (free tier)"
  Write-Host "  2. SQL Editor -> Run supabase/migrations/001_initial_schema.sql"
  Write-Host "  3. SQL Editor -> Run supabase/migrations/002_waitlist.sql"
  Write-Host "  4. Copy URL + service_role key to backend/.env"
  Write-Host "  5. Set MOCK_MODE=false in backend/.env"
  Write-Host ""
  exit 0
}

$migration1 = Join-Path $PSScriptRoot "..\supabase\migrations\001_initial_schema.sql"
$migration2 = Join-Path $PSScriptRoot "..\supabase\migrations\002_waitlist.sql"

Write-Host "Migration files ready:"
Write-Host "  - $migration1"
Write-Host "  - $migration2"
Write-Host ""
Write-Host "Paste these into Supabase SQL Editor and execute."
Write-Host "Then configure backend/.env with your credentials."