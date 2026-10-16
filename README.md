# KRYTHOS Security Operations Platform (KRYTHOS SOC)

> **Tagline:** Every Signal Connected. Every Threat Investigated.  
> **Repository:** [https://github.com/amara-narayana/KRYTHOS-SOC](https://github.com/amara-narayana/KRYTHOS-SOC)  
> **Default Local URL:** [http://127.0.0.1:8000](http://127.0.0.1:8000)

KRYTHOS SOC is a modular, local-first Security Operations Center and SIEM platform designed for defensive cybersecurity teams, SOC analysts, and security engineers.

---

## Key Features

- **Real-Time Live Telemetry Engine:** Zero simulations or fake data. Automatically captures live operating system events (systemd-journald, auth.log, sudo executions, SSH attempts, and logins) directly from the Linux kernel in real-time.
- **Server-Sent Events (SSE) Live Push:** Connected web clients receive live incoming security events and triggered detection alerts with sub-millisecond push latency.
- **Live Playbook Incident Orchestration:** Real-world defensive containment actions:
  - **Boundary Firewall Drops:** Executes actual `iptables` / `UFW` / `netsh` kernel drop rules against malicious source IPs and registers indicators into the Threat Intel IOC store.
  - **Host Network Containment:** Enforces strict isolation chains allowing only administrative SOC UI (port 8000) and SSH forensics (port 22).
  - **Compromised Account Lockout:** Revokes active sessions, suspends web users, and executes OS-level account locks (`passwd -l`).
  - **Retrospective IOC Sweeps:** Scans historical database events against threat indicators and extracts correlated incident evidence.
- **Production Systemd Daemon:** Runs as an auto-starting system service (`krythos.service`) with automated restarts, log rotation, and low memory footprint (<80MB RAM).
- **Zero-Node / Zero-npm Deployment:** Frontend is pre-compiled into `frontend/dist`. You can clone and run on Kali Linux or Debian with just Python!
- **Local-First & 100% Offline:** Zero cloud egress. No external API dependencies or fees. SQLite WAL mode provides high-throughput concurrent reads and writes.
- **Deterministic Detection Engine:** Sliding window thresholds, sequence correlations, and MITRE ATT&CK mapped rules.
- **Incident Response Workbench:** Full case management, investigation checklists, analyst timeline, and tamper-evident HTML incident reports.

---

## How to Clone and Run on Another System

### Prerequisites
Before getting started, ensure the target system has:
- **Git**
- **Python 3.10+** (Python 3.10, 3.11, 3.12, 3.13, or 3.14)
- **Node.js 18+ & npm** (required to build the frontend assets on initial setup)
- **SQLite 3** (included with standard Python installations)

---

### Step 1: Clone the Repository

Open your terminal or PowerShell and run:

```bash
git clone https://github.com/amara-narayana/KRYTHOS-SOC.git
cd KRYTHOS-SOC
```

---

### Step 2: Automated Installation & Setup

#### Option A: Linux / Kali Linux / Debian / VirtualBox

Run the automated setup script:
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```
*What this does:*
1. Creates an isolated Python virtual environment (`.venv`).
2. Installs backend dependencies from `requirements.txt`.
3. Installs the `krythos` CLI executable in editable mode.
4. Installs frontend npm packages and compiles the production bundle into `frontend/dist`.
5. Initializes the database schema and default directories (`data/`, `logs/`, `reports/`, `backups/`).

#### Option B: Windows 11 Host

Open **PowerShell** (or Command Prompt) inside the `KRYTHOS-SOC` directory:
```powershell
# 1. Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies & CLI
pip install -r requirements.txt
pip install -e .

# 3. Build frontend static assets
cd frontend
npm install
npm run build
cd ..
```

---

### Step 3: Start KRYTHOS SOC

#### Option 1: Run as a Production System Daemon (Recommended for Kali Linux / Debian)
To run KRYTHOS continuously in the background on system boot:
```bash
sudo bash scripts/install_service.sh
```
*Manage the daemon with standard systemctl:*
```bash
sudo systemctl status krythos     # Check service health
sudo systemctl restart krythos    # Restart service
sudo journalctl -u krythos -f     # Live streaming logs
```

#### Option 2: Run in Foreground Terminal
```bash
sudo ./scripts/start_production.sh
```
*Or standard background start:*
```bash
./scripts/start.sh
```
*To stop the background server:*
```bash
./scripts/stop.sh
```

#### On Windows:
Using PowerShell:
```powershell
.\scripts\start.ps1
```
Or double-click / run:
```cmd
.\scripts\start.bat
```

The terminal will confirm that the platform is active:
```
==============================================================================
  KRYTHOS SOC — Platform Running Successfully
==============================================================================
  Web Interface:    http://127.0.0.1:8000
  REST API Docs:    http://127.0.0.1:8000/api/docs
  CLI Help:         krythos --help
==============================================================================
```

---

### Step 4: First-Run Administrator Bootstrap

1. Open your web browser and navigate to:  
   👉 **`http://127.0.0.1:8000`**
2. On first launch, the **First-Run Administrator Setup** screen will automatically appear.
3. Fill in your Administrator details:
   - **Full Name:** e.g., `SOC Lead Analyst`
   - **Username:** e.g., `admin`
   - **Email:** e.g., `admin@krythos.local`
   - **Password:** Minimum 8 characters with letters and numbers.
4. Click **"Initialize KRYTHOS SOC"**.
5. Log in with your new credentials. The bootstrap screen is permanently locked after initialization.

---

### Step 5: (Optional) Load Demonstration Data

To immediately populate the dashboard with realistic synthetic attack patterns (brute-force sequences, privilege escalations, threat indicator hits):

```bash
# Activate venv if not active
source .venv/bin/activate   # On Windows: .\.venv\Scripts\Activate.ps1

# Generate synthetic test files in samples/
python scripts/generate_demo_data.py

# Ingest sample brute-force events via CLI
krythos ingest samples/synthetic_brute_force.json

# Run detection engine
krythos detect run

# View generated alerts
krythos alerts list
```
Refresh the Web GUI at `http://127.0.0.1:8000` to inspect the updated metrics, alerts, and attack timelines.

---

### Step 6: CLI Quick Reference

The `krythos` CLI shares the exact same database and detection engine as the Web UI:

```bash
# Check platform status and record counts
krythos status

# Machine-readable status
krythos status --json

# Ingest logs
krythos ingest /path/to/logfile.log --source-type linux_auth

# Search events
krythos events search --username root --limit 20

# Validate detection rules
krythos rules validate

# List active investigation cases
krythos cases list

# Database maintenance
krythos db check
krythos db backup
```

---

## Documentation Links

- [Operator User Guide](docs/USER_GUIDE.md)
- [REST API Reference](docs/API.md)
- [Architecture & Design](docs/ARCHITECTURE.md)
- [Security Engineering](docs/SECURITY.md)
- [Threat Model](docs/THREAT_MODEL.md)
- [Detection Rules Catalog](docs/DETECTION_RULES.md)
- [Troubleshooting & Low-Memory Guide](docs/TROUBLESHOOTING.md)
- [Implementation Roadmap](docs/ROADMAP.md)

---

## License
MIT License. Built for defensive security teams and cybersecurity education.
