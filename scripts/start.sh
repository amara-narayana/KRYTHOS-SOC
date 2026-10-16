#!/usr/bin/env bash
# ==============================================================================
# KRYTHOS SOC — Startup Launcher
# Target: Kali Linux / Debian / VirtualBox Lab
# Default Local URL: http://127.0.0.1:8000
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

PID_FILE="$REPO_ROOT/.krythos.pid"
HOST="${KRYTHOS_HOST:-127.0.0.1}"
PORT="${KRYTHOS_PORT:-8000}"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[!] KRYTHOS SOC is already running with PID $PID."
        echo "    Web GUI: http://$HOST:$PORT"
        exit 0
    else
        rm -f "$PID_FILE"
    fi
fi

# Ensure virtual environment exists
if [ -f "$REPO_ROOT/.venv/bin/activate" ]; then
    source "$REPO_ROOT/.venv/bin/activate"
elif [ -f "$REPO_ROOT/venv/bin/activate" ]; then
    source "$REPO_ROOT/venv/bin/activate"
else
    echo "[!] Virtual environment not detected. Running ./scripts/setup.sh first..."
    bash "$SCRIPT_DIR/setup.sh"
    source "$REPO_ROOT/.venv/bin/activate"
fi

echo "[*] Starting KRYTHOS Security Operations Platform on $HOST:$PORT..."
mkdir -p logs data reports backups

# Launch uvicorn daemon
nohup python3 -m uvicorn backend.app.main:app --host "$HOST" --port "$PORT" --log-level info > "$REPO_ROOT/logs/krythos.log" 2>&1 &
PID=$!
echo "$PID" > "$PID_FILE"

# Wait for service health
echo "[*] Waiting for backend readiness..."
READY=0
for i in {1..20}; do
    if curl -s "http://$HOST:$PORT/api/v1/health" | grep -q '"status":"healthy"' 2>/dev/null; then
        READY=1
        break
    fi
    sleep 0.5
done

if [ "$READY" -eq 1 ]; then
    echo ""
    echo "=============================================================================="
    echo "  KRYTHOS SOC — Platform Running Successfully"
    echo "=============================================================================="
    echo "  Web Interface:    http://$HOST:$PORT"
    echo "  REST API Docs:    http://$HOST:$PORT/api/docs"
    echo "  PID:              $PID"
    echo "  Log File:         $REPO_ROOT/logs/krythos.log"
    echo ""
    echo "  CLI Help:         krythos --help"
    echo "  Stop Server:      ./scripts/stop.sh"
    echo "=============================================================================="
else
    echo "[!] Warning: KRYTHOS SOC started (PID $PID), but health endpoint did not respond within 10s."
    echo "    Check logs for details: cat $REPO_ROOT/logs/krythos.log"
fi
