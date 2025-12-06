# PowerShell script to remove unused SYSTEM_USER_ID constants
# Run from repository root: .\cleanup-system-user-id.ps1

$files = @(
    "app\api\activate-workflow\route.ts",
    "app\api\connections\route.ts",
    "app\api\executions\list\route.ts",
    "app\api\executions\log\route.ts",
    "app\api\executions\route.ts",
    "app\api\memory\create\route.ts",
    "app\api\memory\delete\route.ts",
    "app\api\memory\list\route.ts",
    "app\api\memory\update\route.ts",
    "app\api\workflows\[id]\executions\route.ts",
    "app\api\workflows\trigger\route.ts",
    "app\api\workflows\activate\route.ts",
    "app\api\workflows\run\route.ts",
    "app\api\workflows\update\route.ts",
    "app\api\workflows\delete\route.ts",
    "app\api\chat\messages\route.ts"
)

$lineToRemove = 'const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";'

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file

    if (Test-Path $path) {
        Write-Host "Processing: $file"

        # Read file content
        $content = Get-Content $path -Raw

        # Remove the line and any surrounding whitespace
        $newContent = $content -replace "(?m)^\s*$([regex]::Escape($lineToRemove))\s*\r?\n", ""

        # Write back to file
        Set-Content -Path $path -Value $newContent -NoNewline

        Write-Host "  ✓ Removed SYSTEM_USER_ID constant" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nCleanup complete!" -ForegroundColor Green
Write-Host "Review changes with: git diff" -ForegroundColor Cyan
