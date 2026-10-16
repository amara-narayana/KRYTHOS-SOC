# KRYTHOS SOC — Detection Rule Catalog & Engineering Guide

> **Core Philosophy:** Deterministic, explainable, verifiable detection rules mapped directly to MITRE ATT&CK before probabilistic or heuristic models.

---

## 1. Registered Default Detection Rules

| Rule ID | Name | Severity | MITRE Tactic | Technique | Category | Threshold / Logic |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `KRY-AUTH-001` | Repeated Failed Authentication (Brute Force) | **High** | Credential Access | [T1110.001](https://attack.mitre.org/techniques/T1110/001/) | `authentication` | &ge; 4 failed logons in 10-minute sliding window per user/host. |
| `KRY-AUTH-002` | Successful Logon After Repeated Failures | **High** | Initial Access | [T1078](https://attack.mitre.org/techniques/T1078/) | `authentication` | Successful logon following &ge; 3 failed attempts from same user/IP within 15 minutes. |
| `KRY-AUTH-003` | Authentication Spray (One Source, Multiple Users) | **High** | Credential Access | [T1110.003](https://attack.mitre.org/techniques/T1110/003/) | `authentication` | Single source IP targeting &ge; 3 distinct user accounts with failed logins within 15 minutes. |
| `KRY-PRIV-001` | Suspicious Privilege Escalation Indicator | **Critical** | Privilege Escalation | [T1548.003](https://attack.mitre.org/techniques/T1548/003/) | `privilege_escalation` | Single failed or unauthorized `sudo` command or root token usurpation. |
| `KRY-INTEL-001` | Threat Intelligence Indicator Match | **Critical** | Command and Control | [T1071](https://attack.mitre.org/techniques/T1071/) | `network` | Inbound or outbound network event matching active local IOC database entry (IP, domain, hash). |
| `KRY-DEF-001` | Security Telemetry Tampering / Service Stopped | **Critical** | Defense Evasion | [T1562.001](https://attack.mitre.org/techniques/T1562/001/) | `defense_evasion` | Telemetry or log daemon termination, `systemctl stop auditd/rsyslog`, or security agent suspension. |

---

## 2. Detection Logic Specification

### 2.1 KRY-AUTH-001: Repeated Failed Authentication
- **Objective:** Detect automated password guessing, dictionary attacks, or brute force attempts targeting internal endpoints or SSH daemons.
- **Data Source Requirements:** `category = 'authentication'`, `outcome = 'failure'`.
- **Correlation Window:** 10 minutes (`window_minutes: 10`).
- **Grouping:** Grouped by `username` and `host`.
- **Suppression:** Alerts are suppressed for 30 minutes for identical entity combinations to prevent alert storms.
- **False Positive Considerations:** Scheduled automated maintenance scripts running with expired credentials, user forgot password after policy change.

### 2.2 KRY-AUTH-002: Successful Logon After Repeated Failures
- **Objective:** Detect when an attacker finally discovers or cracks valid credentials following an active brute-force campaign.
- **Detection Mechanics:** Sequenced correlation. When an event with `outcome = 'success'` arrives, queries past 15 minutes for &ge; 3 events with `outcome = 'failure'` matching the same username.
- **False Positive Considerations:** Legitimate user mistyping password 3 times and correctly typing it on the 4th try. (Configurable threshold allows increasing to 5+ in high-noise environments).

### 2.3 KRY-INTEL-001: Threat Intelligence Match
- **Objective:** Instant correlation of network events against locally maintained C2 indicators, malicious scanners, or phishing infrastructure.
- **Detection Mechanics:** Single-event lookup against `threat_indicators` table index on `source_ip` or `destination_ip`.
- **False Positive Considerations:** Shared hosting or CDN IP addresses containing benign customer domains.

---

## 3. Testing & Validating Rules

### 3.1 Via the CLI
```bash
# Validate syntax and field constraints of all rules:
krythos rules validate

# List active rules:
krythos rules list

# Run detection against current events:
krythos detect run
```

### 3.2 Automated Regression Tests
Automated positive and negative test cases are maintained in `backend/tests/test_detection.py` and run via `pytest`.
