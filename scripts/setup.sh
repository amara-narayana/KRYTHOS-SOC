#!/usr/bin/env bash
# ==============================================================================
# KRYTHOS SOC — Automated Setup & Environment Initialization
# Target Environment: Kali Linux / Debian / Ubuntu / VirtualBox Lab
# ==============================================================================
set -e

echo "[*] Initializing KRYTHOS SOC Setup..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Check Python 3
if ! command -v python3 &>/dev/null; then
    echo "[!] Error: python3 is not installed or not in PATH."
    exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "[+] Detected Python $PYTHON_VERSION"

# Check Node.js and npm
if ! command -v node &>/dev/null; then
    echo "[!] Warning: Node.js is not installed. Frontend build will require Node 18+."
fi

# Check available memory
if command -v free &>/dev/null; then
    TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
    echo "[+] Total System Memory: ${TOTAL_RAM}MB"
    if [ "$TOTAL_RAM" -lt 1800 ]; then
        echo "[*] Low memory system detected (<2GB). Enabling lightweight runtime profile."
    fi
fi

# Step 1: Create Virtual Environment
echo "[*] Creating Python virtual environment in .venv..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip

# Step 2: Install Backend Dependencies & CLI
echo "[*] Installing backend dependencies..."
pip install -r requirements.txt
pip install -e .

# Step 3: Build Frontend (if npm available)
if command -v npm &>/dev/null && [ -d "frontend" ]; then
    echo "[*] Building frontend production bundle..."
    cd frontend
    npm install
    npm run build
    cd "$REPO_ROOT"
else
    echo "[*] Skipping frontend compilation (npm not found or frontend directory missing)."
fi

# Step 4: Verify Directories
mkdir -p data logs reports backups

# Step 5: Test CLI installation
echo "[*] Verifying krythos CLI..."
krythos status --json || true

echo ""
echo "=============================================================================="
echo "[+] KRYTHOS SOC Setup Complete!"
echo "    Start the application with: ./scripts/start.sh"
echo "    Or access the CLI via:       krythos --help"
echo "=============================================================================="
