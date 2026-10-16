# KRYTHOS Security Operations Platform (KRYTHOS SOC)

> **Every Signal Connected. Every Threat Investigated.**

KRYTHOS SOC is a modular, local-first Security Operations Center and SIEM platform designed for defensive cybersecurity teams, SOC analysts, and security engineers.

---

## Key Features

- **Local-First Architecture:** Zero mandatory cloud dependencies, no paid APIs required. Local SQLite with Write-Ahead Logging (WAL) and configurable retention.
- **Unified Domain Engine:** Both GUI and CLI share the same core business logic, normalizers, and detection rules.
- **Enterprise-Grade Ingestion:** Ingest JSON, JSONL, CSV, Linux Syslog/auth.log, and Suricata EVE telemetry in streaming bounded batches.
- **Deterministic Detection Engine:** Sliding window thresholds, sequence correlations (e.g., successful login after brute-force), single-event suspicious actions, and IOC matchers with alert suppression windows.
- **MITRE ATT&CK Matrix:** Direct mapping to enterprise tactics and techniques (T1110, T1078, T1548, T1071, T1562).
- **Incident Response & Investigation Workbench:** Structured case management, checklist tracking, analyst notes timeline, evidence linking, and executive HTML report generation.
- **Local Threat Intelligence (IOCs):** Manage, match, import, and export indicators (IPs, domains, hashes, URLs).
- **Optional Local AI Assistance:** Pluggable connector to local Ollama runtime with transparent deterministic fallback.
- **Role-Based Access Control (RBAC):** Administrator, Analyst, and Viewer roles with Argon2id password hashing and session tokens.
- **Command-Line Interface (`krythos`):** Comprehensive CLI for offline triage, ingestion, detection, and database maintenance.

---

## Quickstart

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Setup
```bash
# Initialize virtual environment
python -m venv .venv
# Linux / Kali:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install dependencies and CLI
pip install -e .
```

### 3. Bootstrap Administrator
```bash
# Run first-time setup
krythos setup
```

### 4. Run KRYTHOS SOC
```bash
# Start backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Visit `http://127.0.0.1:8000` or API docs at `http://127.0.0.1:8000/api/docs`.
