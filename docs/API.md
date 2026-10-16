# KRYTHOS SOC — REST API Reference

> **Base URL:** `http://127.0.0.1:8000/api/v1`  
> **Interactive Swagger UI:** `http://127.0.0.1:8000/api/docs`  
> **ReDoc Documentation:** `http://127.0.0.1:8000/api/redoc`  
> **OpenAPI Schema:** `http://127.0.0.1:8000/api/openapi.json`

---

## 1. Authentication & Security

All protected endpoints require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

Role-Based Access Control (RBAC) levels:
- `Viewer`: Read-only access to events, alerts, and cases.
- `Analyst`: Ingestion, alert triage, case updates, notes, evidence attachments, and reports.
- `Administrator`: Full access including user management, system settings, and audit logs.

---

## 2. Endpoints Overview

### 2.1 System & Health

#### `GET /api/v1/health`
Check application readiness and component status.
- **Access:** Public
- **Response:**
  ```json
  {
    "status": "healthy",
    "version": "0.1.0",
    "timestamp": "2026-10-16T10:00:00Z",
    "components": {
      "database": "connected",
      "detection_engine": "ready",
      "ingestion_pipeline": "ready"
    }
  }
  ```

---

### 2.2 Authentication

#### `GET /api/v1/auth/status`
Check if the first-run administrator has been bootstrapped.
- **Access:** Public
- **Response:** `{"bootstrapped": true, "registration_enabled": true}`

#### `POST /api/v1/auth/bootstrap`
Initialize the first administrator (only works once).
- **Access:** Public (Pre-bootstrap only)
- **Body:**
  ```json
  {
    "username": "admin",
    "email": "admin@krythos.local",
    "full_name": "Security Administrator",
    "password": "SuperSecretPassword123!"
  }
  ```

#### `POST /api/v1/auth/login`
Authenticate with username/email and password.
- **Access:** Public
- **Body (JSON or form-urlencoded):**
  ```json
  {
    "username": "admin",
    "password": "SuperSecretPassword123!"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@krythos.local",
      "full_name": "Security Administrator",
      "role": "Administrator"
    }
  }
  ```

#### `GET /api/v1/auth/me`
Retrieve currently authenticated profile.
- **Access:** Any authenticated user

---

### 2.3 Dashboard & Analytics

#### `GET /api/v1/dashboard/metrics`
Retrieve real-time database-backed SOC metrics.
- **Access:** Viewer+
- **Response:**
  ```json
  {
    "events_ingested": 1542,
    "open_alerts": 7,
    "critical_alerts": 2,
    "active_cases": 1,
    "data_sources_healthy": 3,
    "events_by_category": {"authentication": 1200, "privilege_escalation": 12},
    "alerts_by_severity": {"critical": 2, "high": 3, "medium": 2, "low": 0},
    "top_affected_hosts": [{"host": "srv-prod-01", "count": 4}],
    "top_triggered_rules": [{"rule_id": "KRY-AUTH-001", "name": "Brute Force", "count": 3}]
  }
  ```

---

### 2.4 Event Ingestion & Search

#### `POST /api/v1/ingestion/batch`
Ingest an array of normalized or semi-structured JSON security events.
- **Access:** Analyst+
- **Body:** Array of event objects (max 1000 per request).

#### `POST /api/v1/ingestion/upload`
Upload and ingest raw log files (`multipart/form-data`).
- **Supported formats:** JSON, JSONL, CSV, Linux `auth.log` / syslog.
- **Access:** Analyst+

#### `GET /api/v1/events`
Query, search, and paginate normalized security events.
- **Query Parameters:** `host`, `username`, `source_ip`, `category`, `severity`, `query`, `page`, `page_size`.
- **Access:** Viewer+

---

### 2.5 Detection Rules & Execution

#### `GET /api/v1/detections/rules`
List all registered detection rules.
- **Access:** Viewer+

#### `POST /api/v1/detections/run`
Trigger evaluation of enabled detection rules against recent unanalyzed events.
- **Access:** Analyst+

#### `POST /api/v1/detections/rules/{rule_id}/toggle`
Enable or disable a detection rule.
- **Access:** Administrator

---

### 2.6 Alert Queue

#### `GET /api/v1/alerts`
List and filter triggered security alerts.
- **Query Parameters:** `severity`, `status`, `rule_id`, `page`, `page_size`.
- **Access:** Viewer+

#### `PUT /api/v1/alerts/{alert_id}/status`
Update alert status (e.g., `acknowledged`, `resolved`, `closed`) and assign an analyst.
- **Access:** Analyst+

#### `POST /api/v1/alerts/{alert_id}/ai-assist`
Request an offline, explainable AI-assisted analysis and suggested investigation actions.
- **Access:** Analyst+

---

### 2.7 Investigation Cases

#### `GET /api/v1/cases`
List incident cases with pagination and status filters.
- **Access:** Viewer+

#### `POST /api/v1/cases`
Create a new investigation case.
- **Access:** Analyst+

#### `PUT /api/v1/cases/{case_id}`
Update case title, severity, priority, checklist, findings, and resolution summary.
- **Access:** Analyst+

#### `POST /api/v1/cases/{case_id}/notes`
Add a timestamped analyst note to the investigation timeline.
- **Access:** Analyst+

#### `POST /api/v1/cases/{case_id}/evidence`
Attach supporting event IDs, alerts, or IOC indicators to the case.
- **Access:** Analyst+

#### `GET /api/v1/cases/{case_id}/report.html`
Export a cryptographically hashed, standalone HTML incident report with embedded evidence digest.
- **Access:** Viewer+

---

### 2.8 Threat Intelligence

#### `GET /api/v1/intelligence/iocs`
Search local IOC store.
- **Access:** Viewer+

#### `POST /api/v1/intelligence/iocs`
Register a new indicator of compromise (`ip`, `domain`, `hash_md5`, `hash_sha256`, `url`).
- **Access:** Analyst+

---

### 2.9 User Administration & Audit

#### `GET /api/v1/users`
List user accounts.
- **Access:** Administrator

#### `POST /api/v1/users`
Create a new user with specific role.
- **Access:** Administrator

#### `GET /api/v1/users/audit-logs`
Retrieve tamper-evident audit history of all sensitive operations.
- **Access:** Administrator
