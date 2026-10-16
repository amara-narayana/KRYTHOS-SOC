# KRYTHOS SOC — Threat Model

## 1. System Overview & Assets
KRYTHOS SOC processes sensitive defensive security telemetry.
Key assets to protect:
1. **User Credentials & Sessions**: Hashes, tokens, and active sessions.
2. **Audit & Event Telemetry**: Historical audit logs, raw security events, alerts, and incident cases.
3. **Detection Rules & Threat Indicators**: Proprietary detection rules, local indicators of compromise (IOCs).
4. **Local Host System Integrity**: The underlying host/VM executing the platform.

---

## 2. Threat Actors & Capabilities
- **Malicious External Network Actor**: Scanning or attempting to reach KRYTHOS services over the network.
- **Compromised Log Source**: Attacker feeding malformed, oversized, or exploit-laden log entries (e.g., Log4j style strings, SQL injection snippets, XSS payloads).
- **Rogue or Low-Privileged Insider**: An authenticated user with `Viewer` or `Analyst` role attempting privilege escalation to `Administrator`.
- **Malicious Rule or Config Inserter**: Attacker attempting to insert malicious rules that execute arbitrary code or cause denial of service.

---

## 3. Threat Assessment (STRIDE)

| Threat Category | Potential Vector | Mitigation in KRYTHOS SOC |
|---|---|---|
| **Spoofing** | Forged user identities; session token theft. | Argon2id password hashing; cryptographically signed session tokens; brute-force rate limits; secure cookie/header handling. |
| **Tampering** | Modification of logs, rules, or alerts in transit/storage. | Database transactions; read-only event logs; immutable audit trail; schema validation on ingest. |
| **Repudiation** | Analyst denying case modification or admin denying user changes. | Comprehensive audit log tracking user ID, IP address, timestamp, and action description. |
| **Information Disclosure** | Leakage of private IPs, employee usernames, or alerts to unauthorized parties. | Strict RBAC enforced on every API route; generic auth failure messages; local-first default binding (127.0.0.1). |
| **Denial of Service** | Gigabyte-sized log bomb crashes the parser or exhausts memory. | Streaming parsers; bounded record sizes (max 64KB per log line); batching (max 1000 items per batch); SQLite WAL mode. |
| **Elevation of Privilege** | Normal user self-assigns admin role during registration or API call. | First-run setup disables public bootstrap; role assignment restricted to Administrators; server-side permission checks. |

---

## 4. Specific Attack Surface Mitigations
- **SQL Injection**: SQLAlchemy ORM and parameterization everywhere. Direct string concatenation in queries is strictly prohibited.
- **Cross-Site Scripting (XSS)**: React auto-escapes string content. Raw log viewing renders plain text without `dangerouslySetInnerHTML`.
- **Command Injection**: No log content, detection rule, or AI suggestion is ever executed in a shell or passed to `os.system` / `subprocess.Popen(shell=True)`.
- **Path Traversal**: File upload and ingestion paths check against authorized workspace directories and reject paths containing `..` or leading slashes.
