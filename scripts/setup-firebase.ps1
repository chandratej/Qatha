# DEPRECATED per katha-auth-architecture-decision_auth.md
# Now using Pure Supabase Auth.
# Use Supabase dashboard for keys. Copy .env.example to .env in creator-cms.
# Run from repo root if still needed for legacy: .\scripts\setup-firebase.ps1

$cmsEnvExample = "creator-cms\.env.example"
$cmsEnvTarget  = "creator-cms\.env"

if (-not (Test-Path $cmsEnvExample)) {
    Write-Error ".env.example not found at $cmsEnvExample"
    exit 1
}

if (Test-Path $cmsEnvTarget) {
    Write-Host ".env already exists at $cmsEnvTarget — skipping (edit it manually if needed)." -ForegroundColor Yellow
} else {
    Copy-Item $cmsEnvExample $cmsEnvTarget -Force
    Write-Host "Created $cmsEnvTarget from example." -ForegroundColor Green
    Write-Host "Real Firebase keys are included. For production you can replace with your own web app config." -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd creator-cms"
Write-Host "2. npm run dev"
Write-Host "3. Make sure backend is running (MOCK_MODE=true for mock OTP, or real Firebase Admin creds)"
Write-Host ""
Write-Host "When using real Firebase: make sure Phone provider is enabled and the domain is authorized." -ForegroundColor Yellow
