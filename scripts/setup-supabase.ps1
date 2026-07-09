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
  Write-Host "  2. SQL Editor -> Run all migrations in supabase/migrations/ (001 through 009)"
  Write-Host "  3. Dashboard -> Authentication -> Providers -> enable Google + Email"
  Write-Host "  4. Deploy Edge Functions: npx supabase functions deploy publish-chapter review-chapter whatsapp-otp whatsapp-webhook"
  Write-Host "  5. Dashboard -> Authentication -> Hooks -> Send SMS -> HTTPS -> whatsapp-otp URL"
  Write-Host "     (Supabase calls this hook 'Send SMS' — delivery is WhatsApp only)"
  Write-Host "     Copy the hook secret into Edge Function secret SEND_SMS_HOOK_SECRET"
  Write-Host "  6. Dashboard -> Authentication -> Providers -> enable Phone"
  Write-Host "  7. Edge Function secrets: SEND_SMS_HOOK_SECRET, WHATSAPP_PHONE_NUMBER_ID,"
  Write-Host "     WHATSAPP_ACCESS_TOKEN, WHATSAPP_OTP_TEMPLATE"
  Write-Host "  8. Meta App -> WhatsApp webhook URL: .../functions/v1/whatsapp-webhook"
  Write-Host "  9. Dashboard -> Settings -> API Keys -> publishable + secret keys -> backend/.env"
  Write-Host " 10. Set MOCK_MODE=false in backend/.env"
  Write-Host " 11. Run: .\scripts\sync-client-env.ps1  (copies keys to creator-cms/.env)"
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