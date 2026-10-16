# KRYTHOS Security Operations Platform (KRYTHOS SOC)

> **Tagline:** Every Signal Connected. Every Threat Investigated.  
> **Repository:** [https://github.com/amara-narayana/KRYTHOS-SOC](https://github.com/amara-narayana/KRYTHOS-SOC)  
> **Default Local URL:** [http://127.0.0.1:8000](http://127.0.0.1:8000)

KRYTHOS SOC is a modular, local-first Security Operations Center and SIEM platform designed for defensive cybersecurity teams, SOC analysts, and security engineers.

---

## Key Features

- **Local-First & Offline:** 100% private. No telemetry, logs, or indicators leave your machine. No cloud dependencies or paid APIs required.
- **Unified Domain Services:** Web GUI and CLI share the exact same database models, detection engine, and business logic.
- **Multi-Format Ingestion:** Ingest JSON, JSONL, CSV, Linux syslog (`auth.log` parsing `sshd` and `sudo`), and synthetic telemetry.
- **Deterministic Detection Engine:** Sliding window thresholds, sequence correlations (e.g. brute force followed by successful logon), and IOC matchers with alert suppression windows.
- **MITRE ATT&CK Matrix:** Interactive visual matrix mapped to enterprise tactics and techniques (T1110, T1078, T1548, T1071, T1562).
- **Incident Response Workbench:** Complete case management, task checklists, analyst notes timeline, attached evidence locker, and tamper-evident standalone HTML incident reports.
- **Local Threat Intelligence (IOCs):** Manage, match, import, and export indicators (IPs, domains, hashes, URLs) in CSV format.
- **Entity Analytics & Explainable Risk:** Computes 0–100 risk scores with score factor breakdowns for users, hosts, and IP addresses.
- **Command-Line Interface (`krythos`):** Comprehensive CLI tool for offline triage, batch ingestion, rule validation, detection runs, and database snapshots.
- **Role-Based Access Control (RBAC):** `Administrator`, `Analyst`, and `Viewer` roles with memory-hard Argon2id password hashing and session tokens.
- **Optional Local AI Assistance:** Pluggable connector to offline Ollama models with a deterministic rules-based fallback.

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

#### On Linux / Kali Linux:
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
