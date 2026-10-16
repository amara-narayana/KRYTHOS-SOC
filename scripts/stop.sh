#!/usr/bin/env bash
# ==============================================================================
# KRYTHOS SOC — Stop Server
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$REPO_ROOT/.krythos.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "[*] No .krythos.pid file found. Attempting to locate running uvicorn process..."
    PIDS=$(pgrep -f "backend.app.main:app" || true)
    if [ -n "$PIDS" ]; then
        echo "[*] Stopping PID(s): $PIDS"
        kill -15 $PIDS 2>/dev/null || true
        echo "[+] KRYTHOS SOC stopped."
    else
        echo "[+] KRYTHOS SOC is not currently running."
    fi
    exit 0
fi

PID=$(cat "$PID_FILE")
if ps -p "$PID" > /dev/null 2>&1; then
    echo "[*] Sending graceful termination signal to KRYTHOS SOC (PID $PID)..."
    kill -15 "$PID" 2>/dev/null || true
    
    # Wait up to 5 seconds for clean exit
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            break
        fi
        sleep 0.5
    done

    # Force kill if still lingering
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[!] Process still running. Sending SIGKILL..."
        kill -9 "$PID" 2>/dev/null || true
    fi
    echo "[+] KRYTHOS SOC successfully terminated."
else
    echo "[*] Process $PID is not running."
fi

rm -f "$PID_FILE"
