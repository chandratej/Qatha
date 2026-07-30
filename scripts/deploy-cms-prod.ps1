# Deploy a *chosen* stable Creator CMS build to Vercel production.
#
# Intentional model: Git pushes do NOT auto-update production.
# You only ship when you run this script (or `npx vercel deploy --prod` from repo root).
#
# Prerequisites:
#   - Vercel CLI logged in (`npx vercel whoami`)
#   - Repo linked: monorepo root `.vercel/project.json` → katha-creator-cms
#   - Root vercel.json (install/build from creator-cms, output creator-cms/dist)
#
# Usage:
#   .\scripts\deploy-cms-prod.ps1                 # confirm, then production deploy
#   .\scripts\deploy-cms-prod.ps1 -Yes            # no prompt (CI / you already decided)
#   .\scripts\deploy-cms-prod.ps1 -Preview        # preview URL only (not production alias)
#   .\scripts\deploy-cms-prod.ps1 -BuildLocal     # run creator-cms production build first
#   .\scripts\deploy-cms-prod.ps1 -RequireClean   # abort if working tree is dirty

[CmdletBinding()]
param(
  [switch]$Yes,
  [switch]$Preview,
  [switch]$BuildLocal,
  [switch]$RequireClean
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

$ProdUrl = "https://katha-creator-cms.vercel.app"
$ProjectFile = Join-Path $Root ".vercel\project.json"

if (-not (Test-Path $ProjectFile)) {
  throw "Missing $ProjectFile — run from monorepo root: npx vercel link --project katha-creator-cms --yes"
}

$gitSha = ""
$gitBranch = ""
$gitDirty = $false
try {
  $gitSha = (git rev-parse --short HEAD 2>$null).Trim()
  $gitBranch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
  $status = git status --porcelain 2>$null
  if ($status) { $gitDirty = $true }
} catch {
  Write-Host "Warning: git metadata unavailable." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Katha Creator CMS → Vercel" -ForegroundColor Cyan
Write-Host "  Root:     $Root"
Write-Host "  Project:  katha-creator-cms (monorepo vercel.json)"
Write-Host "  Target:   $(if ($Preview) { 'Preview (no production alias)' } else { "Production → $ProdUrl" })"
Write-Host "  Git:      $gitBranch @ $gitSha$(if ($gitDirty) { ' (dirty working tree)' } else { '' })"
Write-Host ""

if ($RequireClean -and $gitDirty) {
  throw "Working tree is dirty. Commit or stash first, or omit -RequireClean."
}

if ($gitDirty -and -not $Yes) {
  Write-Host "Note: uncommitted changes are included in the upload (CLI deploys the working tree)." -ForegroundColor Yellow
}

if (-not $Yes -and -not $Preview) {
  $answer = Read-Host "Deploy this tree to PRODUCTION? Type 'deploy' to continue"
  if ($answer -ne "deploy") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 1
  }
}

if ($BuildLocal) {
  Write-Host "Local production build (creator-cms)..." -ForegroundColor Cyan
  Push-Location (Join-Path $Root "creator-cms")
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Local build failed (exit $LASTEXITCODE)" }
  } finally {
    Pop-Location
  }
  Write-Host "Local build OK." -ForegroundColor Green
}

$deployArgs = @("--yes")
if (-not $Preview) {
  $deployArgs = @("--prod", "--yes")
}

Write-Host "Running: npx vercel deploy $($deployArgs -join ' ')" -ForegroundColor Cyan
# Vercel CLI writes progress to stderr; PowerShell may set LASTEXITCODE oddly — check output.
$output = & npx --yes vercel@latest deploy @deployArgs 2>&1 | ForEach-Object { "$_" }
$output | ForEach-Object { Write-Host $_ }

$joined = $output -join "`n"
if ($joined -notmatch "Ready|Aliased|Production|Preview") {
  Write-Host "Deploy may have failed — review output above." -ForegroundColor Red
  exit 1
}

if (-not $Preview) {
  Write-Host ""
  Write-Host "Verifying production HTML..." -ForegroundColor Cyan
  try {
    $r = Invoke-WebRequest -Uri $ProdUrl -UseBasicParsing -TimeoutSec 30 -Headers @{ "Cache-Control" = "no-cache" }
    if ($r.Content -match 'assets/index-[^"]+\.css') {
      Write-Host "OK  Live CSS asset: $($Matches[0])" -ForegroundColor Green
    } else {
      Write-Host "WARN Could not find CSS asset hash in index.html" -ForegroundColor Yellow
    }
    Write-Host "OK  $ProdUrl  (status $($r.StatusCode))" -ForegroundColor Green
  } catch {
    Write-Host "WARN Post-check failed: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Done. Hard-refresh the browser (Ctrl+Shift+R) if styles look stale." -ForegroundColor Green
Write-Host "Remember: git push alone does not update Vercel production (by design)." -ForegroundColor DarkGray
