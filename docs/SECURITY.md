# KRYTHOS Security Policy and Controls

## Security Principles
1. **Local-First Boundary**: By default, KRYTHOS SOC binds exclusively to `127.0.0.1` (localhost). No inbound internet exposure is enabled by default.
2. **Defensive Rigor**: Defense-in-depth model with explicit role-based access control (RBAC), password hashing via Argon2id, and input sanitization on all ingestion paths.
3. **Least Privilege**: Three discrete operational roles: `Administrator`, `Analyst`, and `Viewer`. Every API endpoint strictly validates authorization scopes on the server.
4. **No Untrusted Code Execution**: Log payloads, rule definitions, and IOC strings are treated strictly as structured text. Under no circumstances are log payloads passed to `eval()`, `exec()`, or subshell execution.
5. **No Accidental External Data Leaks**: Internal security events, customer IP addresses, user lists, and threat findings are never transmitted to external APIs or cloud services without explicit, opt-in administrative authorization.

---

## Authentication & Session Security
- **Password Hashing**: Argon2id (`argon2-cffi`) with secure time and memory cost parameters. Plaintext passwords are never persisted or logged.
- **Session Tokens**: Cryptographically secure tokens (HMAC-SHA256 JWT or server-side session cookies) with strict expiration timeouts.
- **Brute Force Protection**: In-memory rate limiting throttles repeated failed authentication attempts per IP and username.
- **First-Run Bootstrap**: Creation of the initial administrative user occurs via an explicit, one-time bootstrap token or setup workflow. Once bootstrapped, self-assignment of administrative roles is prohibited.

---

## Ingestion & Storage Hardening
- **Path Traversal Mitigation**: File imports via CLI or API restrict target filenames to basename validation and canonical path checks within designated scratch/data boundaries.
- **SQL Injection Prevention**: All database interactions use SQLAlchemy ORM or strictly parameterized queries. No raw string interpolation is permitted in SQL construction.
- **XSS & Content Injection**: Web UI sanitizes and HTML-encodes all user-provided strings and log payloads before rendering.
- **Bounded Resource Limits**: Maximum record length limits (e.g., 64KB per log line), bounded batch sizes, and configurable retention periods to prevent resource exhaustion attacks.

---

## Security Incident Response
To report vulnerabilities or security issues in KRYTHOS SOC:
- Review the threat model in `docs/THREAT_MODEL.md`.
- Maintain test environments strictly on synthetic datasets or authorized lab systems.
