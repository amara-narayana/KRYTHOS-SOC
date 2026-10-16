# ==============================================================================
# KRYTHOS SOC — Windows PowerShell Startup Launcher
# Local URL: http://127.0.0.1:8000
# ==============================================================================
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
Set-Location $RepoRoot

$VenvPython = Join-Path $RepoRoot ".venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    Write-Host "[*] Using virtual environment Python: $VenvPython" -ForegroundColor Cyan
    & $VenvPython -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --log-level info
} else {
    Write-Host "[!] .venv not found. Using system python..." -ForegroundColor Yellow
    python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --log-level info
}
