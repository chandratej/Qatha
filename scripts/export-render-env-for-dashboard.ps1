# Print Environment variables for Render Dashboard paste (does NOT write secrets to disk).
# Usage: .\scripts\export-render-env-for-dashboard.ps1

$EnvFile = Join-Path $PSScriptRoot "..\backend\.env"
function Get-EnvVal([string]$Key) {
  foreach ($line in Get-Content $EnvFile) {
    if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return ""
}

$spi = Get-EnvVal "SPI_BATCH_SECRET"
if (-not $spi) {
  $spi = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
}

Write-Host "Paste these into Render → katha-api → Environment (KEY then VALUE):" -ForegroundColor Cyan
Write-Host ""
$map = [ordered]@{
  NODE_ENV                     = "production"
  MOCK_MODE                    = "false"
  CREATOR_SHARE_PCT            = "$(if (Get-EnvVal 'CREATOR_SHARE_PCT') { Get-EnvVal 'CREATOR_SHARE_PCT' } else { '40' })"
  LAUNCH_OFFER_MODE            = "$(if (Get-EnvVal 'LAUNCH_OFFER_MODE') { Get-EnvVal 'LAUNCH_OFFER_MODE' } else { 'immediate' })"
  KATHA_UNPROVEN_FREE_CHAPTERS = "12"
  SPI_BATCH_SECRET             = $spi
  ALLOWED_ORIGINS              = "http://localhost:5173,http://127.0.0.1:5173,https://studio.katha.in,https://katha.app"
  SUPABASE_URL                 = (Get-EnvVal "SUPABASE_URL")
  SUPABASE_PUBLISHABLE_KEY     = (Get-EnvVal "SUPABASE_PUBLISHABLE_KEY")
  SUPABASE_SECRET_KEY          = (Get-EnvVal "SUPABASE_SECRET_KEY")
  RAZORPAY_KEY_ID              = (Get-EnvVal "RAZORPAY_KEY_ID")
  RAZORPAY_KEY_SECRET          = (Get-EnvVal "RAZORPAY_KEY_SECRET")
  RAZORPAY_WEBHOOK_SECRET      = (Get-EnvVal "RAZORPAY_WEBHOOK_SECRET")
  OPENAI_API_KEY               = (Get-EnvVal "OPENAI_API_KEY")
}
foreach ($k in $map.Keys) {
  Write-Host "$k=$($map[$k])"
}
Write-Host ""
Write-Host "Service settings:" -ForegroundColor Cyan
Write-Host "  Root Directory: backend"
Write-Host "  Build Command:  npm ci --omit=dev"
Write-Host "  Start Command:  npm start"
Write-Host "  Health Check:   /api/health"
Write-Host "  Instance:       Free"
