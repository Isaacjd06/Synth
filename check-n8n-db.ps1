#!/usr/bin/env pwsh
# Synth n8n Database Diagnostic Script
# Purpose: Check n8n database for existing users that might cause login issues

$n8nPath = "$env:USERPROFILE\.n8n"
$dbPath = "$n8nPath\database.sqlite"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  n8n Database Diagnostic" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if n8n directory exists
if (Test-Path $n8nPath) {
    Write-Host "[OK] n8n directory found: $n8nPath" -ForegroundColor Green
} else {
    Write-Host "[INFO] n8n directory not found - n8n hasn't been run yet" -ForegroundColor Yellow
    exit 0
}

# Check if database exists
if (Test-Path $dbPath) {
    Write-Host "[OK] Database found: $dbPath" -ForegroundColor Green

    $dbSize = (Get-Item $dbPath).Length / 1KB
    Write-Host "     Size: $([math]::Round($dbSize, 2)) KB" -ForegroundColor Gray
} else {
    Write-Host "[INFO] Database not found - n8n hasn't been initialized yet" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Checking for sqlite3..." -ForegroundColor Yellow

# Check if sqlite3 is available
$sqlite3 = Get-Command sqlite3 -ErrorAction SilentlyContinue

if ($null -eq $sqlite3) {
    Write-Host "[WARNING] sqlite3 not found in PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To inspect the database, install sqlite3:" -ForegroundColor White
    Write-Host "  Option 1: choco install sqlite" -ForegroundColor Gray
    Write-Host "  Option 2: Download from https://www.sqlite.org/download.html" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Manual check: Open the database with any SQLite tool and run:" -ForegroundColor White
    Write-Host "  SELECT * FROM user;" -ForegroundColor Gray
    exit 0
}

Write-Host "[OK] sqlite3 found: $($sqlite3.Source)" -ForegroundColor Green
Write-Host ""
Write-Host "Querying user table..." -ForegroundColor Yellow
Write-Host ""

# Query the database
$query = "SELECT id, email, firstName, lastName, role FROM user;"
$result = sqlite3 $dbPath $query

if ($result) {
    Write-Host "[FOUND] Users in database:" -ForegroundColor Red
    Write-Host ""
    Write-Host "ID | Email | Name | Role" -ForegroundColor White
    Write-Host "---|-------|------|-----" -ForegroundColor White
    Write-Host $result -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[DIAGNOSIS] This is why you're seeing a login screen!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solution Options:" -ForegroundColor White
    Write-Host "  1. Fresh start: Rename/delete $n8nPath and restart" -ForegroundColor Gray
    Write-Host "  2. Remove users: sqlite3 '$dbPath' 'DELETE FROM user;'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Before making changes, backup your database:" -ForegroundColor Yellow
    Write-Host "  Copy-Item '$dbPath' '$dbPath.backup'" -ForegroundColor Gray
} else {
    Write-Host "[OK] No users found in database" -ForegroundColor Green
    Write-Host ""
    Write-Host "If you're still seeing a login screen:" -ForegroundColor Yellow
    Write-Host "  1. Make sure env vars are set (run check-n8n-env.ps1)" -ForegroundColor Gray
    Write-Host "  2. Restart n8n with .\start-n8n.ps1" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
