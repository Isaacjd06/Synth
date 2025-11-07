#!/usr/bin/env pwsh
# Synth n8n Environment Variable Diagnostic Script
# Purpose: Check if n8n environment variables are properly set

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  n8n Environment Variables Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Required variables for no-auth mode
$requiredVars = @(
    "N8N_USER_MANAGEMENT_DISABLED",
    "N8N_BASIC_AUTH_ACTIVE",
    "N8N_ENCRYPTION_KEY"
)

# Optional but useful variables
$optionalVars = @(
    "N8N_HOST",
    "N8N_PORT",
    "N8N_PROTOCOL"
)

Write-Host "Required Variables (for no-auth mode):" -ForegroundColor Yellow
Write-Host ""

$allSet = $true
foreach ($var in $requiredVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)

    if ($value) {
        if ($var -eq "N8N_ENCRYPTION_KEY") {
            Write-Host "  [OK] $var = [HIDDEN]" -ForegroundColor Green
        } else {
            Write-Host "  [OK] $var = $value" -ForegroundColor Green
        }
    } else {
        Write-Host "  [MISSING] $var" -ForegroundColor Red
        $allSet = $false
    }
}

Write-Host ""
Write-Host "Optional Variables:" -ForegroundColor Yellow
Write-Host ""

foreach ($var in $optionalVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)

    if ($value) {
        Write-Host "  [SET] $var = $value" -ForegroundColor Green
    } else {
        Write-Host "  [NOT SET] $var (using default)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "All n8n Environment Variables:" -ForegroundColor Yellow
Write-Host ""

$n8nVars = Get-ChildItem Env: | Where-Object { $_.Name -like 'N8N*' }

if ($n8nVars.Count -gt 0) {
    foreach ($var in $n8nVars) {
        if ($var.Name -eq "N8N_ENCRYPTION_KEY") {
            Write-Host "  $($var.Name) = [HIDDEN]" -ForegroundColor Gray
        } else {
            Write-Host "  $($var.Name) = $($var.Value)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  [NONE] No N8N_* variables found in current environment" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if (-not $allSet) {
    Write-Host "[ACTION REQUIRED]" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required variables are missing. To fix:" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 1 (Recommended): Use the startup script" -ForegroundColor Yellow
    Write-Host "  .\start-n8n.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Set variables in current session" -ForegroundColor Yellow
    Write-Host "  `$env:N8N_USER_MANAGEMENT_DISABLED = 'true'" -ForegroundColor Gray
    Write-Host "  `$env:N8N_BASIC_AUTH_ACTIVE = 'false'" -ForegroundColor Gray
    Write-Host "  `$env:N8N_ENCRYPTION_KEY = 'your-key-here'" -ForegroundColor Gray
    Write-Host "  npx n8n start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3: Set permanent user-level variables" -ForegroundColor Yellow
    Write-Host "  [System.Environment]::SetEnvironmentVariable('N8N_USER_MANAGEMENT_DISABLED', 'true', 'User')" -ForegroundColor Gray
    Write-Host "  [System.Environment]::SetEnvironmentVariable('N8N_BASIC_AUTH_ACTIVE', 'false', 'User')" -ForegroundColor Gray
    Write-Host "  [System.Environment]::SetEnvironmentVariable('N8N_ENCRYPTION_KEY', 'your-key', 'User')" -ForegroundColor Gray
    Write-Host "  # Then restart PowerShell and run: npx n8n start" -ForegroundColor Gray
} else {
    Write-Host "[OK] All required variables are set!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start n8n:" -ForegroundColor White
    Write-Host "  npx n8n start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use the startup script:" -ForegroundColor White
    Write-Host "  .\start-n8n.ps1" -ForegroundColor Gray
}

Write-Host ""
