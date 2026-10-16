#!/usr/bin/env bash
# ==============================================================================
# KRYTHOS SOC — System & Service Health Check
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOST="${KRYTHOS_HOST:-127.0.0.1}"
PORT="${KRYTHOS_PORT:-8000}"

echo "=============================================================================="
echo "  KRYTHOS SOC — Health & Environment Inspection"
echo "=============================================================================="

# 1. System Memory & Storage
echo "[*] Checking System Resources..."
if command -v free &>/dev/null; then
    free -h
fi
if command -v df &>/dev/null; then
    df -h "$REPO_ROOT"
fi

# 2. Database Status
echo ""
echo "[*] Checking Local SQLite Database..."
DB_FILE="$REPO_ROOT/data/krythos.db"
if [ -f "$DB_FILE" ]; then
    DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
    echo "[+] Database exists at: $DB_FILE ($DB_SIZE)"
    if command -v sqlite3 &>/dev/null; then
        JOURNAL_MODE=$(sqlite3 "$DB_FILE" "PRAGMA journal_mode;")
        INTEGRITY=$(sqlite3 "$DB_FILE" "PRAGMA quick_check;")
        echo "    Journal Mode: $JOURNAL_MODE (Target: wal)"
        echo "    Integrity:    $INTEGRITY"
    fi
else
    echo "[-] Database not found at $DB_FILE. (Will be created on first start)"
fi

# 3. HTTP Health Endpoint
echo ""
echo "[*] Testing API Health Endpoint at http://$HOST:$PORT/api/v1/health..."
if command -v curl &>/dev/null; then
    HEALTH_RESP=$(curl -s "http://$HOST:$PORT/api/v1/health" 2>/dev/null || true)
    if [ -n "$HEALTH_RESP" ]; then
        echo "[+] API Response:"
        echo "    $HEALTH_RESP"
    else
        echo "[-] Service is not responding at http://$HOST:$PORT. (Is it started?)"
    fi
else
    echo "[*] curl not available to test API endpoint."
fi

# 4. CLI Status
echo ""
echo "[*] Checking CLI Status..."
if [ -f "$REPO_ROOT/.venv/bin/activate" ]; then
    source "$REPO_ROOT/.venv/bin/activate"
fi
if command -v krythos &>/dev/null; then
    krythos status || true
else
    python3 -m cli.krythos_cli.main status || true
fi

echo ""
echo "=============================================================================="
