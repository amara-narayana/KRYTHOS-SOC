# KRYTHOS SOC — Implementation Roadmap & Status

This document tracks implementation progress across all milestones defined in the Master Build Specification.

## Phase Overview & Status

- [x] **Phase 0: Environment & Architecture**
  - Host environment inspected (Python 3.14, Node 24, npm 11, SQLite 3.53).
  - Core specifications created: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/THREAT_MODEL.md`, `docs/ROADMAP.md`.
  - Virtual environment initialized with FastAPI, SQLAlchemy, Typer, Argon2-cffi, Pydantic, PyJWT.

- [x] **Phase 1: Runnable Foundation**
  - Centralized settings in `backend/app/config.py`.
  - Database schema & connection management in `backend/app/database.py` with SQLite WAL mode.
  - Core exceptions and structured logging in `backend/app/core/`.
  - FastAPI main application (`backend/app/main.py`) with SPA static mounting.
  - Health & component readiness endpoint (`GET /api/v1/health`).
  - Cross-platform launchers: `scripts/setup.sh`, `scripts/start.sh`, `scripts/stop.sh`, `scripts/healthcheck.sh`, `scripts/start.bat`, `scripts/start.ps1`.

- [x] **Phase 2: Authentication & RBAC**
  - Argon2id password hashing and constant-time verification.
  - Controlled first-run administrator bootstrap workflow (locked after initialization).
  - Role-Based Access Control: `Administrator`, `Analyst`, `Viewer`.
  - Token-based session management and brute-force rate limiting.
  - Automated tests verifying account creation, duplicate prevention, and permission barriers.

- [x] **Phase 3: Event Ingestion & Normalization**
  - Multi-format ingestion pipeline: JSON arrays, JSONL, CSV, Linux auth syslog (`sshd`, `sudo`).
  - Automatic UTC timestamp normalization and field standardizer.
  - Multi-column SQLite indexes for fast host, user, IP, and category filtering.
  - Event Explorer API with safe parameterized queries.
  - CLI `krythos ingest` and `krythos events search`.

- [x] **Phase 4: Deterministic Detection Engine**
  - 6 initial deterministic rules seeded on startup (`KRY-AUTH-001` through `KRY-DEF-001`).
  - Mappings to MITRE ATT&CK techniques (T1110, T1078, T1548, T1071, T1562).
  - Threshold, sliding window, and sequence correlation.
  - Alert suppression windows and deduplication to avoid alert fatigue.
  - CLI `krythos rules list`, `krythos detect run`, `krythos alerts list`.

- [x] **Phase 5: Investigations & Case Management**
  - Complete case lifecycle: `new` &rarr; `investigating` &rarr; `contained` &rarr; `resolved` &rarr; `closed`.
  - Evidence attachment linking security events, alerts, and threat indicators.
  - Interactive analyst notes timeline and investigation checklists.
  - Standalone, cryptographically hashed HTML incident report export.
  - CLI `krythos cases create`, `krythos cases list`, `krythos report export`.

- [x] **Phase 6: Threat Intelligence & Entity Analytics**
  - 100% offline local IOC store supporting IP, domain, URL, and hash types.
  - Ingestion-time threat intelligence matching against events.
  - Entity Analytics deep-dive for users, hosts, and IP addresses.
  - Explainable entity risk scoring (0–100) with score contribution breakdowns.
  - MITRE ATT&CK coverage matrix visualizer.

- [x] **Phase 7: Frontend Web Application**
  - Polished, responsive React 18 + TypeScript + Vite web interface.
  - Dark navy/charcoal SOC palette with cyan accents and accessible typography.
  - 12 interactive operational pages:
    - Overview Dashboard with real database KPIs and volume charts
    - Event Explorer with raw/normalized views and CSV export
    - Live Events stream with pause/resume and bounded buffers
    - Alert Queue with triage, acknowledgment, assignment, and case linking
    - Investigation Workbench with checklists, timelines, and report generation
    - Entity Analytics explorer
    - Detection Rules inspector with live test evaluator
    - Threat Intelligence IOC manager with CSV import/export
    - MITRE ATT&CK Matrix coverage view
    - Reports & Evidence hub
    - Administration & immutable audit trail viewer
    - Help & CLI guide
  - Production-compiled bundle in `frontend/dist` directly served by FastAPI.

- [x] **Phase 8: Synthetic Demonstration Lab & Release Verification**
  - Deterministic synthetic generator in `scripts/generate_demo_data.py`.
  - Comprehensive end-to-end integration test suite (`backend/tests/`).
  - Verified cross-interface data sharing between CLI and Web GUI.
  - Operational guides: `docs/USER_GUIDE.md`, `docs/API.md`, `docs/DETECTION_RULES.md`, `docs/TROUBLESHOOTING.md`.
