import json
import csv
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLES_DIR = BASE_DIR / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

def generate_samples():
    now = datetime.now(timezone.utc)

    # 1. Synthetic Brute Force (JSON)
    brute_force_events = []
    attacker_ip = "198.51.100.42"
    victim_user = "admin_svc"
    target_host = "auth-primary-01"

    for i in range(6):
        ts = now - timedelta(minutes=15 - i)
        brute_force_events.append({
            "event_id": f"syn-bf-{i+1:03d}",
            "timestamp": ts.isoformat(),
            "source_type": "synthetic_lab",
            "host": target_host,
            "username": victim_user,
            "source_ip": attacker_ip,
            "destination_ip": "10.0.1.5",
            "event_category": "authentication",
            "action": "ssh_login",
            "outcome": "failure",
            "severity": "medium",
            "raw_payload": f"SYNTHETIC LAB TELEMETRY: Failed authentication for {victim_user} from {attacker_ip} port {50000+i} ssh2"
        })

    (SAMPLES_DIR / "synthetic_brute_force.json").write_text(json.dumps(brute_force_events, indent=2), encoding="utf-8")

    # 2. Compromise Sequence (Failures followed by Success) (JSONL)
    compromise_events = []
    user_target = "dev_deployer"
    for i in range(3):
        ts = now - timedelta(minutes=8 - i)
        compromise_events.append({
            "event_id": f"syn-seq-fail-{i+1}",
            "timestamp": ts.isoformat(),
            "source_type": "synthetic_lab",
            "host": "prod-app-server",
            "username": user_target,
            "source_ip": "203.0.113.88",
            "event_category": "authentication",
            "action": "login",
            "outcome": "failure",
            "severity": "medium"
        })
    # The successful breach login
    compromise_events.append({
        "event_id": "syn-seq-succ-01",
        "timestamp": (now - timedelta(minutes=4)).isoformat(),
        "source_type": "synthetic_lab",
        "host": "prod-app-server",
        "username": user_target,
        "source_ip": "203.0.113.88",
        "event_category": "authentication",
        "action": "login",
        "outcome": "success",
        "severity": "high",
        "raw_payload": f"SYNTHETIC LAB TELEMETRY: User {user_target} successfully logged in after 3 failures"
    })

    with open(SAMPLES_DIR / "synthetic_compromise_sequence.jsonl", "w", encoding="utf-8") as f:
        for ev in compromise_events:
            f.write(json.dumps(ev) + "\n")

    # 3. Privilege Escalation Indicators (CSV)
    priv_events = [
        ["timestamp", "host", "username", "source_ip", "event_category", "action", "outcome", "severity", "process_name"],
        [(now - timedelta(minutes=3)).isoformat(), "db-cluster-01", "operator", "10.0.2.14", "privilege_escalation", "sudo_command", "failure", "high", "/usr/bin/sudo"],
        [(now - timedelta(minutes=2)).isoformat(), "db-cluster-01", "operator", "10.0.2.14", "privilege_escalation", "sudo_command", "failure", "high", "/usr/bin/sudo"],
        [(now - timedelta(minutes=1)).isoformat(), "db-cluster-01", "root", "10.0.2.14", "system", "stop_service", "success", "critical", "systemctl"]
    ]
    with open(SAMPLES_DIR / "synthetic_privilege_escalation.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(priv_events)

    # 4. Realistic Linux auth.log sample
    auth_lines = [
        f"{(now - timedelta(minutes=10)).strftime('%b %d %H:%M:%S')} kali-soc sshd[14221]: Failed password for invalid user admin from 198.51.100.99 port 38912 ssh2",
        f"{(now - timedelta(minutes=9)).strftime('%b %d %H:%M:%S')} kali-soc sshd[14225]: Failed password for invalid user root from 198.51.100.99 port 38914 ssh2",
        f"{(now - timedelta(minutes=8)).strftime('%b %d %H:%M:%S')} kali-soc sshd[14230]: Failed password for invalid user test from 198.51.100.99 port 38918 ssh2",
        f"{(now - timedelta(minutes=5)).strftime('%b %d %H:%M:%S')} kali-soc sshd[14245]: Accepted password for analyst from 192.168.1.15 port 42100 ssh2",
        f"{(now - timedelta(minutes=2)).strftime('%b %d %H:%M:%S')} kali-soc sudo:   analyst : TTY=pts/1 ; PWD=/home/analyst ; USER=root ; COMMAND=/bin/cat /etc/shadow"
    ]
    (SAMPLES_DIR / "sample_linux_auth.log").write_text("\n".join(auth_lines) + "\n", encoding="utf-8")

    # 5. Threat Intel Indicators (CSV)
    ioc_rows = [
        ["ioc_type", "value", "threat_type", "confidence", "provenance", "description"],
        ["ip", "198.51.100.99", "c2_infrastructure", "95", "external_blocklist", "Known malicious Command & Control node"],
        ["ip", "198.51.100.42", "credential_bruteforcer", "90", "synthetic_lab", "Simulated aggressive scanner subnet"],
        ["domain", "malicious-c2-krythos.org", "phishing", "85", "threat_feed", "Flagged phishing domain in campaign"]
    ]
    with open(SAMPLES_DIR / "threat_intel_iocs.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(ioc_rows)

    # 6. Samples README
    readme_text = """# KRYTHOS SOC — Synthetic Laboratory Telemetry

All events in this directory are purely synthetic security scenario logs created for:
- Testing the deterministic detection engine
- Verifying the ingestion parsers (JSON, JSONL, CSV, Linux auth.log)
- Demonstrating the SOC analyst triage and case response workflow

None of these events represent actual compromises on the host system.
"""
    (SAMPLES_DIR / "README.md").write_text(readme_text, encoding="utf-8")
    print(f"Sample datasets generated in: {SAMPLES_DIR}")

if __name__ == "__main__":
    generate_samples()
