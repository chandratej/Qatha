# Concatenate supabase/migrations/*.sql into one file for Supabase SQL Editor.
param(
  [string]$OutFile = (Join-Path $PSScriptRoot "..\supabase\bootstrap_all.sql")
)

$migrationsDir = Join-Path $PSScriptRoot "..\supabase\migrations"
$files = Get-ChildItem $migrationsDir -Filter "*.sql" | Sort-Object Name

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- Katha: combined database bootstrap")
[void]$sb.AppendLine("-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
[void]$sb.AppendLine("-- Paste into Supabase Dashboard -> SQL Editor -> Run")
[void]$sb.AppendLine("")

foreach ($file in $files) {
  [void]$sb.AppendLine("-- ============================================================")
  [void]$sb.AppendLine("-- $($file.Name)")
  [void]$sb.AppendLine("-- ============================================================")
  [void]$sb.AppendLine((Get-Content $file.FullName -Raw))
  [void]$sb.AppendLine("")
}

Set-Content -Path $OutFile -Value $sb.ToString() -Encoding UTF8
Write-Host "Wrote $($files.Count) migrations to:" -ForegroundColor Green
Write-Host "  $OutFile"