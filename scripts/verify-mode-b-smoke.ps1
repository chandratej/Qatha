# Mode B production smoke checks (no secrets required).
# Usage: .\scripts\verify-mode-b-smoke.ps1

$ErrorActionPreference = "Continue"
$script:fail = 0

function Check([string]$Name, [scriptblock]$Block) {
  try {
    $result = & $Block
    Write-Host "OK  $Name - $result" -ForegroundColor Green
  } catch {
    Write-Host "FAIL $Name - $($_.Exception.Message)" -ForegroundColor Red
    $script:fail++
  }
}

$Api = "https://katha-api.onrender.com"
$Cms = "https://katha-creator-cms.vercel.app"
$Landing = "https://katha-landing-psi.vercel.app"
$Gateway = "https://gateway-qatha.vercel.app"
$Webhook = "https://qviedmvezaehfcbmfmbc.supabase.co/functions/v1/payment-webhook"

Check "API health" {
  $h = Invoke-RestMethod "$Api/api/health"
  if ($h.mock_mode -ne $false) { throw "mock_mode not false" }
  if ($h.node_env -ne "production") { throw "node_env=$($h.node_env)" }
  if (-not $h.payments_ready) { throw "payments_ready false" }
  "payments_ready=$($h.payments_ready) webhook=$($h.webhook_secret_configured)"
}

Check "API stories" {
  $s = Invoke-RestMethod "$Api/api/stories"
  $n = @($s.stories).Count
  if ($n -lt 1) { throw "no stories" }
  "count=$n"
}

Check "CMS auth-build marker" {
  $t = (Invoke-WebRequest "$Cms/auth-build.txt" -UseBasicParsing).Content
  if ($t -notmatch "pkce-hydrate") { throw "missing marker" }
  ($t -split "`n")[0].Trim()
}

Check "CMS login page" {
  $r = Invoke-WebRequest "$Cms/login" -UseBasicParsing
  if ($r.StatusCode -ne 200) { throw "status $($r.StatusCode)" }
  "200"
}

Check "Landing home" {
  $r = Invoke-WebRequest "$Landing/" -UseBasicParsing
  if ($r.Content -notmatch "katha-creator-cms") { throw "Write CTA meta missing CMS URL" }
  "200 + CMS meta"
}

Check "Landing privacy" {
  $r = Invoke-WebRequest "$Landing/privacy.html" -UseBasicParsing
  if ($r.Content -notmatch "grievance@katha.in") { throw "grievance missing" }
  "200"
}

Check "Landing terms" {
  $r = Invoke-WebRequest "$Landing/terms.html" -UseBasicParsing
  if ($r.StatusCode -ne 200) { throw "status $($r.StatusCode)" }
  "200"
}

Check "Payment webhook rejects bad signature" {
  try {
    Invoke-WebRequest -Method POST -Uri $Webhook -ContentType "application/json" -Body '{"event":"payment.captured"}' -UseBasicParsing | Out-Null
    throw "expected non-2xx"
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and [int]$resp.StatusCode -eq 401) { return "401 OK" }
    $msg = $_.Exception.Message
    if ($msg -match "401|Unauthorized|Invalid") { return "reject OK" }
    throw $msg
  }
}

Check "Gateway" {
  $r = Invoke-WebRequest "$Gateway/" -UseBasicParsing -MaximumRedirection 5
  "status=$($r.StatusCode)"
}

Write-Host ""
if ($script:fail -gt 0) {
  Write-Host "SMOKE FAILED: $($script:fail) check(s)" -ForegroundColor Red
  exit 1
}
Write-Host "SMOKE PASSED - Mode B surfaces reachable" -ForegroundColor Green
exit 0
