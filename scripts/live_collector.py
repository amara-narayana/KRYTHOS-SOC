#!/usr/bin/env python3
"""
KRYTHOS SOC — Real-Time Live Security Event Collector
Monitors your actual Kali Linux security events (auth.log / journalctl / sudo / ssh)
and continuously streams them into KRYTHOS SOC in real-time.
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime, timezone

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database import init_db, SessionLocal
from backend.app.services.event_service import ingest_file_content
from backend.app.services.detection_service import evaluate_events_against_rules
from backend.app.services.ingestion.parsers import parse_linux_auth_line
from backend.app.services.event_service import ingest_events_batch
from backend.app.models.event import SecurityEvent

def print_banner():
    print("=" * 72)
    print("  KRYTHOS SOC — LIVE KALI SECURITY EVENT COLLECTOR")
    print("  Monitoring real system authentication, sudo, and SSH activity")
    print("  Events stream directly into your KRYTHOS dashboard in real-time!")
    print("=" * 72)

def tail_file(filepath):
    """Generator that yields new lines appended to a file (like tail -f)."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        # Seek to the end of the file so we only capture NEW live events
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue
            yield line.strip()

def stream_journalctl():
    """Fallback generator streaming systemd auth events via journalctl."""
    cmd = ["journalctl", "-f", "-n", "0", "-u", "ssh", "-u", "sshd", "-u", "sudo", "-u", "su", "-u", "systemd-logind"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    for line in iter(proc.stdout.readline, ''):
        if line:
            yield line.strip()

def process_live_line(line, db):
    if not line:
        return
    parsed = parse_linux_auth_line(line)
    if not parsed:
        return

    # Ingest directly
    count, events = ingest_events_batch(db, [parsed], source_type="live_kali_auth")
    if count > 0:
        event = events[0]
        # Check detections
        alerts = evaluate_events_against_rules(db, [event])
        alert_str = f" -> [TRIGGERED {len(alerts)} ALERT(S)!]" if alerts else ""
        
        timestamp_str = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp_str}] [LIVE EVENT] Action: {event.action} | User: {event.username or 'unknown'} | Outcome: {event.outcome}{alert_str}")
        if alerts:
            for a in alerts:
                print(f"    >>> [ALERT FIRED] {a.title} ({a.severity.upper()})")

def main():
    print_banner()
    init_db()

    auth_log_path = Path("/var/log/auth.log")
    
    use_auth_log = False
    if auth_log_path.exists() and os.access(auth_log_path, os.R_OK):
        print(f"[*] Attaching live watcher to: {auth_log_path}")
        use_auth_log = True
        source_generator = tail_file(auth_log_path)
    else:
        # Check if running as non-root on /var/log/auth.log
        if auth_log_path.exists():
            print("[!] Permission denied reading /var/log/auth.log directly.")
            print("[*] Please run this script with sudo: sudo .venv/bin/python scripts/live_collector.py")
            print("[*] Falling back to journalctl live stream...")
        else:
            print("[*] /var/log/auth.log not found. Using journalctl live auth stream...")
        source_generator = stream_journalctl()

    print("[+] Live collector active! Waiting for real system events...")
    print("[*] Test it in another terminal by running: sudo whoami")
    print("=" * 72)

    db = SessionLocal()
    try:
        for line in source_generator:
            process_live_line(line, db)
    except KeyboardInterrupt:
        print("\n[*] Live collector stopped.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
