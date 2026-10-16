@echo off
REM ==============================================================================
REM KRYTHOS SOC — Windows Startup Launcher
REM Local URL: http://127.0.0.1:8000
REM ==============================================================================
setlocal

cd /d "%~dp0.."

if exist ".venv\Scripts\activate.bat" (
    call ".venv\Scripts\activate.bat"
) else (
    echo [!] Virtual environment .venv not found. Using system python...
)

echo [*] Starting KRYTHOS SOC on http://127.0.0.1:8000...
echo [*] Press Ctrl+C to terminate the server.
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --log-level info
