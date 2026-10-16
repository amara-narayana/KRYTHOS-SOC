import os
import sys
import time
import shutil
import threading
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from backend.app.config import BASE_DIR
from backend.app.database import SessionLocal
from backend.app.core.logging_config import logger
from backend.app.services.ingestion.parsers import parse_linux_auth_line
from backend.app.services.event_service import ingest_events_batch
from backend.app.services.detection_service import evaluate_events_against_rules
from backend.app.services.live_bus import live_bus

class LiveTelemetryWatcher:
    """
    Continuous in-process daemon that captures real-time OS security telemetry 
    (journalctl, /var/log/auth.log, or live audit stream) and pipes it directly 
    into KRYTHOS SOC without mock or synthetic delays.
    """
    def __init__(self):
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._proc: Optional[subprocess.Popen] = None
        self._source_name = "idle"
        self._events_captured = 0
        self._alerts_triggered = 0
        self._last_event_at: Optional[datetime] = None

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def get_status(self) -> Dict[str, Any]:
        return {
            "running": self.is_running,
            "source": self._source_name,
            "events_captured": self._events_captured,
            "alerts_triggered": self._alerts_triggered,
            "last_event_at": self._last_event_at.isoformat() if self._last_event_at else None,
            "platform": sys.platform
        }

    def start(self):
        if self.is_running:
            logger.info("[LiveWatcher] Already running.")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(target=self._worker_loop, daemon=True, name="KrythosLiveWatcher")
        self._thread.start()
        logger.info("[LiveWatcher] Background live telemetry watcher thread launched.")

    def stop(self):
        self._stop_event.set()
        if self._proc:
            try:
                self._proc.terminate()
            except Exception:
                pass
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        logger.info("[LiveWatcher] Live telemetry watcher stopped.")

    def _worker_loop(self):
        while not self._stop_event.is_set():
            try:
                self._run_collector()
            except Exception as e:
                logger.error(f"[LiveWatcher] Collector encountered error: {e}. Retrying in 3s...", exc_info=False)
                time.sleep(3.0)

    def _run_collector(self):
        auth_log = Path("/var/log/auth.log")
        secure_log = Path("/var/log/secure")
        has_journalctl = shutil.which("journalctl") is not None

        if auth_log.exists() and os.access(auth_log, os.R_OK):
            self._source_name = "auth.log"
            logger.info(f"[LiveWatcher] Tailing real authentication log: {auth_log}")
            self._tail_file(auth_log)
        elif secure_log.exists() and os.access(secure_log, os.R_OK):
            self._source_name = "secure.log"
            logger.info(f"[LiveWatcher] Tailing RedHat/CentOS secure log: {secure_log}")
            self._tail_file(secure_log)
        elif has_journalctl and sys.platform != "win32":
            self._source_name = "journalctl"
            logger.info("[LiveWatcher] Tailing live systemd-journald security stream...")
            self._stream_journalctl()
        else:
            # Fallback to local watch file for live terminal piping / non-root / Windows
            watch_file = BASE_DIR / "data" / "live_telemetry.pipe"
            watch_file.parent.mkdir(parents=True, exist_ok=True)
            if not watch_file.exists():
                watch_file.touch()
            self._source_name = f"local_pipe ({watch_file.name})"
            logger.info(f"[LiveWatcher] Tailing local live telemetry pipe: {watch_file}")
            self._tail_file(watch_file)

    def _tail_file(self, filepath: Path):
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            f.seek(0, os.SEEK_END)
            while not self._stop_event.is_set():
                line = f.readline()
                if not line:
                    time.sleep(0.4)
                    continue
                self._process_line(line.strip())

    def _stream_journalctl(self):
        cmd = ["journalctl", "-f", "-n", "0", "-u", "ssh", "-u", "sshd", "-u", "sudo", "-u", "su", "-u", "systemd-logind"]
        try:
            self._proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                bufsize=1
            )
        except Exception as e:
            logger.warning(f"[LiveWatcher] Failed to spawn journalctl: {e}")
            time.sleep(2.0)
            return

        while not self._stop_event.is_set():
            line = self._proc.stdout.readline()
            if not line:
                if self._proc.poll() is not None:
                    break
                time.sleep(0.1)
                continue
            self._process_line(line.strip())

    def _process_line(self, line: str):
        if not line:
            return
        parsed = parse_linux_auth_line(line)
        if not parsed:
            return

        with SessionLocal() as db:
            try:
                count, events = ingest_events_batch(db, [parsed], source_type=f"live_{self._source_name}")
                if count > 0 and events:
                    event = events[0]
                    self._events_captured += 1
                    self._last_event_at = datetime.now(timezone.utc)

                    # Immediate rule evaluation
                    alerts = evaluate_events_against_rules(db, [event])
                    if alerts:
                        self._alerts_triggered += len(alerts)

                    # Build broadcast message
                    event_dict = {
                        "event_id": event.event_id,
                        "timestamp": event.timestamp.isoformat(),
                        "source_type": event.source_type,
                        "host": event.host,
                        "username": event.username,
                        "source_ip": event.source_ip,
                        "destination_ip": event.destination_ip,
                        "action": event.action,
                        "outcome": event.outcome,
                        "severity": event.severity,
                        "event_category": event.event_category,
                        "raw_payload": event.raw_payload
                    }
                    alert_dicts = [
                        {
                            "alert_id": a.alert_id,
                            "title": a.title,
                            "severity": a.severity,
                            "rule_name": a.rule_name,
                            "explanation": a.explanation,
                            "created_at": a.created_at.isoformat()
                        }
                        for a in alerts
                    ]

                    live_bus.publish_from_thread({
                        "type": "live_event",
                        "event": event_dict,
                        "alerts": alert_dicts
                    })
            except Exception as e:
                logger.error(f"[LiveWatcher] Error processing live event: {e}")

# Global singleton instance
live_watcher = LiveTelemetryWatcher()
