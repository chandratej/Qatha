# Point Creator Studio at a public API base (Railway / Render / tunnel).
# Usage:
#   .\scripts\set-cms-api-url.ps1 -ApiBase https://katha-api.onrender.com/api
#   .\scripts\set-cms-api-url.ps1 -ApiBase https://xxx.up.railway.app/api

param(
  [Parameter(Mandatory = $true)]
  [string]$ApiBase
)

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$CmsEnv = Join-Path $Root "creator-cms\.env"
$base = $ApiBase.TrimEnd('/')
if ($base -notmatch '/api$') { $base = "$base/api" }

function Set-EnvLine([string]$Path, [string]$Key, [string]$Value) {
  $lines = @()
  if (Test-Path $Path) { $lines = @(Get-Content $Path) }
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

if (-not (Test-Path $CmsEnv)) {
  Copy-Item (Join-Path $Root "creator-cms\.env.example") $CmsEnv -ErrorAction SilentlyContinue
}

Set-EnvLine $CmsEnv "VITE_API_URL" $base
Set-EnvLine $CmsEnv "VITE_MOCK_MODE" "false"

$urlFile = Join-Path $Root "Worklog\24_JUL_2026\Railway_API_URL.txt"
Set-Content -Path $urlFile -Value $base -Encoding UTF8

Write-Host "creator-cms/.env VITE_API_URL=$base" -ForegroundColor Green
Write-Host "Saved $urlFile"
Write-Host "Restart Vite / redeploy Vercel so the new base is baked in."
