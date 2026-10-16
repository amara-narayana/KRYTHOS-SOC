#!/usr/bin/env bash
# ==============================================================================
# KRYTHOS SOC — Production Systemd Service Installer
# Installs and enables KRYTHOS as an auto-starting system daemon on Kali / Debian.
# ==============================================================================

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "[-] This installer must be run as root (use: sudo bash scripts/install_service.sh)"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_SRC="$PROJECT_DIR/scripts/krythos.service"
SERVICE_DST="/etc/systemd/system/krythos.service"
CURRENT_USER="${SUDO_USER:-$(whoami)}"

echo "=================================================================="
echo "  KRYTHOS SOC — Production Daemon Setup"
echo "  Deploying from: $PROJECT_DIR"
echo "  Target User:    $CURRENT_USER"
echo "=================================================================="

# Ensure directories exist with proper write permissions
mkdir -p "$PROJECT_DIR/data/logs" "$PROJECT_DIR/data/reports" "$PROJECT_DIR/data/backups"
chmod -R 777 "$PROJECT_DIR/data" 2>/dev/null || true
rm -f "$PROJECT_DIR/data/logs/krythos.log" 2>/dev/null || true

# Check Python venv
if [ ! -f "$PROJECT_DIR/.venv/bin/uvicorn" ]; then
  echo "[-] Virtual environment not found at $PROJECT_DIR/.venv"
  echo "[*] Creating virtual environment..."
  python3 -m venv "$PROJECT_DIR/.venv"
  "$PROJECT_DIR/.venv/bin/pip" install --upgrade pip
  "$PROJECT_DIR/.venv/bin/pip" install -r "$PROJECT_DIR/requirements.txt"
fi

# Dynamically patch paths in systemd service file
echo "[*] Configuring systemd unit with current workspace path..."
sed -e "s|WorkingDirectory=.*|WorkingDirectory=$PROJECT_DIR|g" \
    -e "s|ExecStart=.*|ExecStart=$PROJECT_DIR/.venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 1|g" \
    "$SERVICE_SRC" > "$SERVICE_DST"

chmod 644 "$SERVICE_DST"

echo "[*] Reloading systemd daemon..."
systemctl daemon-reload

echo "[*] Enabling krythos.service on boot..."
systemctl enable krythos.service

echo "[*] Starting krythos.service..."
systemctl restart krythos.service

sleep 2

if systemctl is-active --quiet krythos.service; then
  echo "=================================================================="
  echo "  [✓] KRYTHOS SOC is now running in production mode!"
  echo "  Web UI URL:      http://localhost:8000 (or http://<IP>:8000)"
  echo "  Service Status:  sudo systemctl status krythos"
  echo "  Live Logs:       sudo journalctl -u krythos -f"
  echo "=================================================================="
else
  echo "[-] Service failed to start. Check logs:"
  journalctl -u krythos -n 25 --no-pager
  exit 1
fi
