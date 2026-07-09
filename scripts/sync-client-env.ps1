# Sync Supabase publishable credentials from backend/.env to creator-cms/.env
# Run after updating backend/.env with real project keys.

param(
  [string]$BackendEnv = (Join-Path $PSScriptRoot "..\backend\.env"),
  [string]$CreatorEnv = (Join-Path $PSScriptRoot "..\creator-cms\.env"),
  [string]$GatewayEnv = (Join-Path $PSScriptRoot "..\gateway\.env")
)

function Read-EnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path $Path)) { return $null }
  foreach ($line in Get-Content $Path) {
    if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

function Upsert-EnvLine([string]$Path, [string]$Key, [string]$Value) {
  $lines = @()
  $found = $false
  if (Test-Path $Path) {
    foreach ($line in Get-Content $Path) {
      if ($line -match "^\s*$Key\s*=") {
        $lines += "$Key=$Value"
        $found = $true
      } else {
        $lines += $line
      }
    }
  }
  if (-not $found) { $lines += "$Key=$Value" }
  Set-Content -Path $Path -Value $lines -Encoding UTF8
}

$url = Read-EnvValue $BackendEnv "SUPABASE_URL"
$publishable = Read-EnvValue $BackendEnv "SUPABASE_PUBLISHABLE_KEY"
if (-not $publishable) {
  $publishable = Read-EnvValue $BackendEnv "SUPABASE_ANON_KEY"
}

if (-not $url -or -not $publishable) {
  Write-Host "Missing SUPABASE_URL or publishable key in $BackendEnv" -ForegroundColor Red
  exit 1
}

$secret = Read-EnvValue $BackendEnv "SUPABASE_SECRET_KEY"
if (-not $secret) {
  $secret = Read-EnvValue $BackendEnv "SUPABASE_SERVICE_ROLE_KEY"
}

Upsert-EnvLine $CreatorEnv "VITE_SUPABASE_URL" $url
Upsert-EnvLine $CreatorEnv "VITE_SUPABASE_PUBLISHABLE_KEY" $publishable
Upsert-EnvLine $CreatorEnv "VITE_MOCK_MODE" "false"
Upsert-EnvLine $CreatorEnv "VITE_GATEWAY_URL" "http://localhost:3002"

Upsert-EnvLine $GatewayEnv "NEXT_PUBLIC_GATEWAY_URL" "http://localhost:3002"
Upsert-EnvLine $GatewayEnv "NEXT_PUBLIC_READER_APP_URL" "http://localhost:8080"
Upsert-EnvLine $GatewayEnv "NEXT_PUBLIC_SUPABASE_URL" $url
Upsert-EnvLine $GatewayEnv "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" $publishable
if ($secret) {
  Upsert-EnvLine $GatewayEnv "SUPABASE_SECRET_KEY" $secret
}

Write-Host "Synced Supabase config to creator-cms/.env and gateway/.env" -ForegroundColor Green
Write-Host "  VITE_SUPABASE_URL=$url"
Write-Host "  VITE_MOCK_MODE=false"
Write-Host "  VITE_GATEWAY_URL=http://localhost:3002"
Write-Host ""
Write-Host "Restart dev servers:"
Write-Host "  cd creator-cms; npm run dev"
Write-Host "  cd gateway; npm run dev"