# Start Katha API on port 3001 and keep it up (watchdog).
# Usage:
#   .\scripts\start-backend.ps1              # start once if down + health check
#   .\scripts\start-backend.ps1 -Watch       # restart if process dies (recommended)
#   .\scripts\start-backend.ps1 -Restart     # kill existing listener then start fresh

param(
  [switch]$Watch,
  [switch]$Restart
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root 'backend'
$logDir = Join-Path $root 'logs'
$logFile = Join-Path $logDir 'backend.log'
$port = 3001

if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

function Get-BackendPids {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $conns) { return @() }
  return @($conns | Select-Object -ExpandProperty OwningProcess -Unique)
}

function Stop-Backend {
  $pids = Get-BackendPids
  foreach ($p in $pids) {
    Write-Host "Stopping old backend pid $p"
    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Milliseconds 800
}

function Start-BackendProcess {
  $out = Join-Path $logDir 'backend.out.log'
  $err = Join-Path $logDir 'backend.err.log'
  Write-Host "Starting backend from $backend (logs: $logDir) ..."
  $proc = Start-Process -FilePath 'node' `
    -ArgumentList 'src/index.js' `
    -WorkingDirectory $backend `
    -WindowStyle Minimized `
    -RedirectStandardOutput $out `
    -RedirectStandardError $err `
    -PassThru

  for ($i = 0; $i -lt 25; $i++) {
    Start-Sleep -Milliseconds 400
    try {
      $null = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 2
      Write-Host "Backend ready (pid $($proc.Id))"
      return $proc
    } catch {
      if ($proc.HasExited) {
        Write-Host "Backend exited early. See $err"
        if (Test-Path $err) {
          Get-Content $err -ErrorAction SilentlyContinue | Select-Object -Last 30 | ForEach-Object { Write-Host $_ }
        }
        throw 'Backend failed to start'
      }
    }
  }
  throw 'Backend did not become healthy within ~10s'
}

function Test-Health {
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/health" -TimeoutSec 5
    Write-Host ("OK mock_mode={0} status={1}" -f $health.mock_mode, $health.status)

    $stories = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/stories?sort=new" -TimeoutSec 8
    $count = 0
    if ($stories.stories) { $count = @($stories.stories).Count }
    Write-Host "Stories in catalog: $count"
    if ($stories.stories) {
      foreach ($s in $stories.stories) {
        Write-Host (" - {0} (ch {1})" -f $s.title, $s.chapter_count)
      }
    }

    # CORS smoke: Flutter-style Origin + custom headers preflight
    $headers = @{
      'Origin' = 'http://localhost:51786'
      'Access-Control-Request-Method' = 'GET'
      'Access-Control-Request-Headers' = 'content-type,authorization,x-user-id,x-device-id,x-subscription-status'
    }
    $opt = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/stories?sort=trending" `
      -Method OPTIONS -Headers $headers -UseBasicParsing -TimeoutSec 5
    $acao = $opt.Headers['Access-Control-Allow-Origin']
    Write-Host ("CORS preflight: status={0} ACAO={1}" -f $opt.StatusCode, $acao)
    if (-not $acao) {
      Write-Host 'WARNING: missing Access-Control-Allow-Origin on OPTIONS'
    }
    return $true
  } catch {
    Write-Host "FAILED to reach API: $_"
    return $false
  }
}

if ($Restart) {
  Stop-Backend
}

$existing = Get-BackendPids
$hasListener = ($existing.Count -gt 0)

if ($hasListener -and -not $Restart) {
  $pidList = ($existing -join ',')
  Write-Host "Backend already listening on :$port (pid $pidList)"
  $ok = Test-Health
  if (-not $ok) {
    Write-Host 'Health failed - restarting...'
    Stop-Backend
    Start-BackendProcess | Out-Null
    $ok2 = Test-Health
    if (-not $ok2) { exit 1 }
  }
} else {
  Start-BackendProcess | Out-Null
  $ok3 = Test-Health
  if (-not $ok3) { exit 1 }
}

if (-not $Watch) {
  Write-Host ''
  Write-Host 'Tip: run with -Watch to auto-restart if the API dies:'
  Write-Host ("  powershell -ExecutionPolicy Bypass -File `"{0}`" -Watch" -f $PSCommandPath)
  exit 0
}

Write-Host "Watching port $port - Ctrl+C to stop watchdog (API keeps running)."
while ($true) {
  Start-Sleep -Seconds 5
  $pids = Get-BackendPids
  if ($pids.Count -eq 0) {
    $stamp = Get-Date -Format 'o'
    Add-Content -Path $logFile -Value "$stamp backend down - restarting"
    Write-Host "[$stamp] Backend down - restarting..."
    try {
      Start-BackendProcess | Out-Null
    } catch {
      Write-Host "Restart failed: $_"
    }
  }
}
