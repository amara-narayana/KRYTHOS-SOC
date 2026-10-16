#!/usr/bin/env bash
# ==============================================================================
# KRYTHOS SOC — Production Server Launcher
# Launches the production server bound to 0.0.0.0:8000 with real-time live watcher.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "=================================================================="
echo "  KRYTHOS SOC — Production Server"
echo "  Zero Simulation | Live Kernel Telemetry | Local-First Architecture"
echo "=================================================================="

# Detect Python environment
PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python"
UVICORN_BIN="$PROJECT_ROOT/.venv/bin/uvicorn"

if [ ! -f "$UVICORN_BIN" ]; then
    if command -v uvicorn &> /dev/null; then
        UVICORN_BIN="uvicorn"
        PYTHON_BIN="python3"
    else
        echo "[-] Error: uvicorn not found. Please activate your virtualenv or install requirements.txt"
        exit 1
    fi
fi

# Ensure SQLite data directory exists
mkdir -p "$PROJECT_ROOT/data"

export PYTHONPATH="$PROJECT_ROOT"
export ENVIRONMENT="production"
export ENABLE_LIVE_WATCHER="true"

# Print host interfaces for user convenience
echo "[*] Local interfaces:"
if command -v ip &> /dev/null; then
    ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | sed 's/^/    http:\/\//' | sed 's/$/:8000/'
else
    echo "    http://localhost:8000"
fi

echo "=================================================================="
echo "[+] Starting KRYTHOS SOC on 0.0.0.0:8000..."
echo "[*] Press Ctrl+C to terminate."
echo "=================================================================="

exec "$UVICORN_BIN" backend.app.main:app --host 0.0.0.0 --port 8000 --log-level info
