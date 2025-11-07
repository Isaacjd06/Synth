#!/usr/bin/env pwsh
# ==========================================================
#  Synth n8n Development Startup Script
#  Purpose: Cleanly start n8n for local Synth development
# ==========================================================

# --- Kill any existing Node/n8n processes to free port 5678 ---
Write-Host "🧹 Checking for existing n8n/Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_.Path -match "n8n") {
    Write-Host "Stopping process $($_.Id) ($($_.Path))" -ForegroundColor Red
    Stop-Process -Id $_.Id -Force
  }
}

# --- Core Configuration ---
$env:N8N_ENCRYPTION_KEY = "1234567890abcdef"
$env:N8N_HOST = "0.0.0.0"
$env:N8N_PORT = "5678"
$env:N8N_PROTOCOL = "http"

# --- API / Public REST Setup ---
# Enables full Public API access and disables user login
$env:N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2ZkMmU4OC1mNTMwLTQzMTktOGIwOS0wZjBjOTcyNDlkNWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyNDk5NjgzfQ.08pjCFPRSJt_agrd6mirT_aBeg7vkbZInQzDGDVtSpo"

# Required for n8n v1.118+ to enable REST API
$env:N8N_ENABLE_PUBLIC_API = "true"
$env:N8N_API_DISABLED = "false"
$env:N8N_DISABLE_UI_ACCESS_CONTROL = "true"
$env:N8N_USER_MANAGEMENT_DISABLED = "true"
$env:N8N_BASIC_AUTH_ACTIVE = "false"

# Optional: enable Swagger docs for debugging
$env:N8N_PUBLIC_API_SWAGGERUI_DISABLED = "false"  # ensures API key takes over access

# --- Execution Data (for debugging) ---
$env:EXECUTIONS_DATA_SAVE_ON_ERROR = "all"
$env:EXECUTIONS_DATA_SAVE_ON_SUCCESS = "all"
$env:EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS = "true"

# --- Display Startup Summary ---
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Synth n8n Development Mode" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  URL: http://$env:N8N_HOST:$env:N8N_PORT" -ForegroundColor White
Write-Host "  Auth: API Key Enabled" -ForegroundColor White
Write-Host ""
Write-Host "Environment Variables Set:" -ForegroundColor Yellow
Write-Host "  N8N_ENCRYPTION_KEY = [SET]" -ForegroundColor Gray
Write-Host "  N8N_API_KEY (first 12 chars) = $($env:N8N_API_KEY.Substring(0,12))..." -ForegroundColor Gray
Write-Host "  N8N_API_DISABLED = $env:N8N_API_DISABLED" -ForegroundColor Gray
Write-Host "  N8N_USER_MANAGEMENT_DISABLED = $env:N8N_USER_MANAGEMENT_DISABLED" -ForegroundColor Gray
Write-Host "  N8N_BASIC_AUTH_ACTIVE = $env:N8N_BASIC_AUTH_ACTIVE" -ForegroundColor Gray
Write-Host "  N8N_HOST = $env:N8N_HOST" -ForegroundColor Gray
Write-Host "  N8N_PORT = $env:N8N_PORT" -ForegroundColor Gray
Write-Host ""
Write-Host "Starting n8n on http://$env:N8N_HOST:$env:N8N_PORT ..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all jobs" -ForegroundColor Gray
Write-Host ""

# --- Start n8n in the background so verification can run ---
Start-Job -ScriptBlock { npx n8n start } | Out-Null
Write-Host "Waiting for n8n to start..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10  # give it time to boot

# --- Verify Public API Connection ---
try {
  $response = Invoke-RestMethod -Uri "http://127.0.0.1:5678/api/v1/workflows" `
    -Headers @{"X-N8N-API-KEY"="$env:N8N_API_KEY"} -Method Get -ErrorAction Stop
  Write-Host ("✅ Public API connection verified ({0} workflows found)" -f $response.data.Count) -ForegroundColor Green
} catch {
  Write-Host "⚠️  Warning: Could not verify Public API connection. Check your API key or n8n version." -ForegroundColor Red
}

Write-Host ""
Write-Host "n8n is running in the background. Use Ctrl+C to stop all jobs." -ForegroundColor Yellow
