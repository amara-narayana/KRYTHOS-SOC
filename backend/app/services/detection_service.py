import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.app.models.rule import DetectionRule
from backend.app.models.alert import Alert, AlertStatus
from backend.app.models.event import SecurityEvent
from backend.app.models.ioc import ThreatIndicator
from backend.app.schemas.rule import RuleCreate, RuleValidationResult

# Standard built-in detection rules to initialize on first launch
DEFAULT_RULES = [
    {
        "rule_id": "KRY-AUTH-001",
        "name": "Repeated Failed Authentication Attempts",
        "description": "Detects repeated failed authentication attempts targeting the same username or from the same source IP within a sliding time window (potential brute-force attack).",
        "severity": "medium",
        "confidence": 85,
        "rule_type": "threshold",
        "mitre_attack_id": "T1110.001",
        "mitre_tactic": "Credential Access",
        "mitre_technique": "Password Guessing",
        "suppression_window_seconds": 300,
        "logic_definition": {
            "category": "authentication",
            "outcome": "failure",
            "threshold": 3,
            "window_seconds": 300,
            "group_by": ["username", "source_ip"]
        }
    },
    {
        "rule_id": "KRY-AUTH-002",
        "name": "Successful Login After Repeated Failures",
        "description": "Detects a successful login immediately following multiple consecutive authentication failures for the same user or host (potential compromised credential after brute force).",
        "severity": "high",
        "confidence": 90,
        "rule_type": "sequence",
        "mitre_attack_id": "T1078",
        "mitre_tactic": "Defense Evasion / Persistence",
        "mitre_technique": "Valid Accounts",
        "suppression_window_seconds": 300,
        "logic_definition": {
            "category": "authentication",
            "failures_required": 2,
            "window_seconds": 600,
            "group_by": "username"
        }
    },
    {
        "rule_id": "KRY-AUTH-003",
        "name": "Password Spraying from Single Source",
        "description": "Detects a single source IP attempting authentication against multiple distinct user accounts in a short time window.",
        "severity": "high",
        "confidence": 88,
        "rule_type": "spray",
        "mitre_attack_id": "T1110.003",
        "mitre_tactic": "Credential Access",
        "mitre_technique": "Password Spraying",
        "suppression_window_seconds": 300,
        "logic_definition": {
            "category": "authentication",
            "outcome": "failure",
            "distinct_users_threshold": 3,
            "window_seconds": 300
        }
    },
    {
        "rule_id": "KRY-PRIV-001",
        "name": "Suspicious Privilege Escalation Indicators",
        "description": "Identifies failed sudo execution, unauthorized root escalation attempts, or suspicious privilege changes.",
        "severity": "high",
        "confidence": 90,
        "rule_type": "single_event",
        "mitre_attack_id": "T1548.003",
        "mitre_tactic": "Privilege Escalation",
        "mitre_technique": "Sudo and Sudo Caching",
        "suppression_window_seconds": 180,
        "logic_definition": {
            "category": "privilege_escalation",
            "outcome": "failure"
        }
    },
    {
        "rule_id": "KRY-INTEL-001",
        "name": "Connection Matching Threat Intelligence Indicator",
        "description": "Detects network or host activity directly matching an active, high-confidence local Threat Indicator (IOC).",
        "severity": "critical",
        "confidence": 95,
        "rule_type": "ioc_match",
        "mitre_attack_id": "T1071",
        "mitre_tactic": "Command and Control",
        "mitre_technique": "Application Layer Protocol",
        "suppression_window_seconds": 300,
        "logic_definition": {}
    },
    {
        "rule_id": "KRY-DEF-001",
        "name": "Unexpected Security Service Modification",
        "description": "Detects attempts to stop, disable, or alter defensive security logging or host protection services.",
        "severity": "critical",
        "confidence": 92,
        "rule_type": "single_event",
        "mitre_attack_id": "T1562.001",
        "mitre_tactic": "Defense Evasion",
        "mitre_technique": "Disable or Modify Tools",
        "suppression_window_seconds": 180,
        "logic_definition": {
            "category": "system",
            "actions": ["stop_service", "disable_firewall", "kill_auditd"]
        }
    }
]

def initialize_default_rules(db: Session) -> int:
    """Seed built-in detection rules if not already present."""
    added = 0
    for r_data in DEFAULT_RULES:
        existing = db.query(DetectionRule).filter(DetectionRule.rule_id == r_data["rule_id"]).first()
        if not existing:
            rule = DetectionRule(
                rule_id=r_data["rule_id"],
                name=r_data["name"],
                description=r_data["description"],
                severity=r_data["severity"],
                confidence=r_data["confidence"],
                rule_type=r_data["rule_type"],
                logic_definition=r_data["logic_definition"],
                mitre_attack_id=r_data["mitre_attack_id"],
                mitre_tactic=r_data["mitre_tactic"],
                mitre_technique=r_data["mitre_technique"],
                suppression_window_seconds=r_data["suppression_window_seconds"],
                enabled=True
            )
            db.add(rule)
            added += 1
    if added:
        db.commit()
    return added

def validate_rule_definition(logic: Dict[str, Any], rule_type: str) -> RuleValidationResult:
    """Validate syntax and parameters of a detection rule definition."""
    errors = []
    warnings = []

    if rule_type == "threshold":
        if "threshold" not in logic or not isinstance(logic["threshold"], int) or logic["threshold"] < 1:
            errors.append("Threshold rule requires integer 'threshold' >= 1")
        if "window_seconds" not in logic or not isinstance(logic["window_seconds"], int) or logic["window_seconds"] < 1:
            errors.append("Threshold rule requires integer 'window_seconds' >= 1")
    elif rule_type == "sequence":
        if "failures_required" not in logic or not isinstance(logic["failures_required"], int):
            errors.append("Sequence rule requires integer 'failures_required'")
    elif rule_type == "spray":
        if "distinct_users_threshold" not in logic:
            errors.append("Spray rule requires 'distinct_users_threshold'")
    elif rule_type not in ["single_event", "ioc_match"]:
        warnings.append(f"Custom rule type '{rule_type}' will use generic matching")

    return RuleValidationResult(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )

def is_alert_suppressed(
    db: Session,
    rule_id: str,
    primary_entity: str,
    window_seconds: int
) -> bool:
    """Check if an active alert for the same rule and entity was generated recently."""
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
    recent = db.query(Alert).filter(
        Alert.rule_id == rule_id,
        Alert.created_at >= cutoff
    ).all()
    
    for a in recent:
        if a.entities and primary_entity in str(a.entities.values()):
            return True
    return False

def evaluate_events_against_rules(
    db: Session,
    new_events: List[SecurityEvent]
) -> List[Alert]:
    """Execute deterministic detection engine over new events."""
    if not new_events:
        return []

    # Ensure default rules exist
    initialize_default_rules(db)

    active_rules = db.query(DetectionRule).filter(DetectionRule.enabled == True).all()
    generated_alerts = []

    # 1. Threat Intel IOC matching
    ioc_rule = next((r for r in active_rules if r.rule_id == "KRY-INTEL-001"), None)
    if ioc_rule:
        alerts = evaluate_ioc_matches(db, new_events, ioc_rule)
        generated_alerts.extend(alerts)

    # 2. Single Event Rules
    single_rules = [r for r in active_rules if r.rule_type == "single_event"]
    for rule in single_rules:
        alerts = evaluate_single_event_rule(db, new_events, rule)
        generated_alerts.extend(alerts)

    # 3. Threshold Rules (Brute Force)
    thresh_rules = [r for r in active_rules if r.rule_type == "threshold"]
    for rule in thresh_rules:
        alerts = evaluate_threshold_rule(db, new_events, rule)
        generated_alerts.extend(alerts)

    # 4. Sequence Rules (Login After Failure)
    seq_rules = [r for r in active_rules if r.rule_type == "sequence"]
    for rule in seq_rules:
        alerts = evaluate_sequence_rule(db, new_events, rule)
        generated_alerts.extend(alerts)

    # 5. Spray Rules
    spray_rules = [r for r in active_rules if r.rule_type == "spray"]
    for rule in spray_rules:
        alerts = evaluate_spray_rule(db, new_events, rule)
        generated_alerts.extend(alerts)

    if generated_alerts:
        db.commit()

    return generated_alerts

def evaluate_ioc_matches(
    db: Session,
    events: List[SecurityEvent],
    rule: DetectionRule
) -> List[Alert]:
    """Match source/dest IPs against active threat indicators."""
    alerts = []
    # Fetch active IOCs
    iocs = db.query(ThreatIndicator).all()
    if not iocs:
        return alerts

    ioc_map = {ioc.value: ioc for ioc in iocs}

    for event in events:
        matched_ioc = None
        matched_val = None
        if event.source_ip and event.source_ip in ioc_map:
            matched_ioc = ioc_map[event.source_ip]
            matched_val = event.source_ip
        elif event.destination_ip and event.destination_ip in ioc_map:
            matched_ioc = ioc_map[event.destination_ip]
            matched_val = event.destination_ip

        if matched_ioc and not is_alert_suppressed(db, rule.rule_id, matched_val, rule.suppression_window_seconds):
            alert = Alert(
                alert_id=f"ALT-{uuid.uuid4().hex[:12].upper()}",
                rule_id=rule.rule_id,
                rule_name=rule.name,
                severity=rule.severity,
                confidence=matched_ioc.confidence,
                title=f"Threat Indicator Match: {matched_val}",
                description=f"Event observed with indicator {matched_val} classified as '{matched_ioc.threat_type}'.",
                explanation=f"Deterministic IOC match: Event ID {event.event_id} contained network indicator {matched_val} matching provenance '{matched_ioc.provenance}'.",
                entities={"ips": [matched_val], "hosts": [event.host] if event.host else []},
                supporting_event_ids=[event.event_id],
                mitre_attack_id=rule.mitre_attack_id,
                status=AlertStatus.NEW.value,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            rule.last_triggered_at = datetime.now(timezone.utc)
            alerts.append(alert)
    return alerts

def evaluate_single_event_rule(
    db: Session,
    events: List[SecurityEvent],
    rule: DetectionRule
) -> List[Alert]:
    """Evaluate single-event pattern matches."""
    alerts = []
    logic = rule.logic_definition or {}
    req_cat = logic.get("category")
    req_outcome = logic.get("outcome")
    req_actions = logic.get("actions", [])

    for event in events:
        match = True
        if req_cat and event.event_category != req_cat:
            match = False
        if req_outcome and event.outcome != req_outcome:
            match = False
        if req_actions and event.action not in req_actions:
            match = False

        if match:
            ent_val = event.username or event.host or event.source_ip or "system"
            if not is_alert_suppressed(db, rule.rule_id, ent_val, rule.suppression_window_seconds):
                alert = Alert(
                    alert_id=f"ALT-{uuid.uuid4().hex[:12].upper()}",
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    confidence=rule.confidence,
                    title=f"{rule.name} on {event.host or 'host'}",
                    description=f"Suspicious activity '{event.action}' observed with outcome '{event.outcome}'.",
                    explanation=f"Rule {rule.rule_id} fired because single-event condition matched: category={event.event_category}, action={event.action}, outcome={event.outcome}.",
                    entities={"users": [event.username] if event.username else [], "hosts": [event.host] if event.host else []},
                    supporting_event_ids=[event.event_id],
                    mitre_attack_id=rule.mitre_attack_id,
                    status=AlertStatus.NEW.value,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(alert)
                rule.last_triggered_at = datetime.now(timezone.utc)
                alerts.append(alert)
    return alerts

def evaluate_threshold_rule(
    db: Session,
    events: List[SecurityEvent],
    rule: DetectionRule
) -> List[Alert]:
    """Evaluate sliding window threshold (e.g., repeated login failures)."""
    alerts = []
    logic = rule.logic_definition or {}
    thresh = logic.get("threshold", 3)
    window_sec = logic.get("window_seconds", 300)
    req_cat = logic.get("category", "authentication")
    req_outcome = logic.get("outcome", "failure")

    # Filter candidates from new_events
    matching_new = [e for e in events if e.event_category == req_cat and e.outcome == req_outcome]
    if not matching_new:
        return alerts

    for candidate in matching_new:
        user_key = candidate.username
        ip_key = candidate.source_ip
        if not user_key and not ip_key:
            continue

        primary = user_key or ip_key
        if is_alert_suppressed(db, rule.rule_id, primary, rule.suppression_window_seconds):
            continue

        # Query recent events within sliding window
        cutoff = candidate.timestamp - timedelta(seconds=window_sec)
        query = db.query(SecurityEvent).filter(
            SecurityEvent.timestamp >= cutoff,
            SecurityEvent.timestamp <= candidate.timestamp,
            SecurityEvent.event_category == req_cat,
            SecurityEvent.outcome == req_outcome
        )
        if user_key:
            query = query.filter(SecurityEvent.username == user_key)
        elif ip_key:
            query = query.filter(SecurityEvent.source_ip == ip_key)

        matching_records = query.all()
        if len(matching_records) >= thresh:
            event_ids = [m.event_id for m in matching_records]
            alert = Alert(
                alert_id=f"ALT-{uuid.uuid4().hex[:12].upper()}",
                rule_id=rule.rule_id,
                rule_name=rule.name,
                severity=rule.severity,
                confidence=rule.confidence,
                title=f"Brute Force Detected: {len(matching_records)} failures for '{primary}'",
                description=f"Observed {len(matching_records)} authentication failures within {window_sec}s for entity '{primary}'.",
                explanation=f"Rule {rule.rule_id} threshold met: {len(matching_records)} failed attempts >= threshold ({thresh}) within {window_sec} seconds.",
                entities={"users": [user_key] if user_key else [], "ips": [ip_key] if ip_key else []},
                supporting_event_ids=event_ids,
                mitre_attack_id=rule.mitre_attack_id,
                status=AlertStatus.NEW.value,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            rule.last_triggered_at = datetime.now(timezone.utc)
            alerts.append(alert)
    return alerts

def evaluate_sequence_rule(
    db: Session,
    events: List[SecurityEvent],
    rule: DetectionRule
) -> List[Alert]:
    """Evaluate ordered state changes (e.g. failures then success)."""
    alerts = []
    logic = rule.logic_definition or {}
    failures_req = logic.get("failures_required", 2)
    window_sec = logic.get("window_seconds", 600)

    # Looking for a SUCCESSFUL login in new_events that follows failures
    success_events = [e for e in events if e.event_category == "authentication" and e.outcome == "success" and e.username]
    for s_event in success_events:
        username = s_event.username
        if is_alert_suppressed(db, rule.rule_id, username, rule.suppression_window_seconds):
            continue

        cutoff = s_event.timestamp - timedelta(seconds=window_sec)
        prior_failures = db.query(SecurityEvent).filter(
            SecurityEvent.username == username,
            SecurityEvent.timestamp >= cutoff,
            SecurityEvent.timestamp < s_event.timestamp,
            SecurityEvent.event_category == "authentication",
            SecurityEvent.outcome == "failure"
        ).order_by(SecurityEvent.timestamp.asc()).all()

        if len(prior_failures) >= failures_req:
            all_evidence = [f.event_id for f in prior_failures] + [s_event.event_id]
            alert = Alert(
                alert_id=f"ALT-{uuid.uuid4().hex[:12].upper()}",
                rule_id=rule.rule_id,
                rule_name=rule.name,
                severity=rule.severity,
                confidence=rule.confidence,
                title=f"Successful Login After Failures: '{username}'",
                description=f"User account '{username}' successfully authenticated after {len(prior_failures)} consecutive failures.",
                explanation=f"Sequence detected: {len(prior_failures)} failures occurred between {prior_failures[0].timestamp.isoformat()} and {prior_failures[-1].timestamp.isoformat()}, followed immediately by a successful login at {s_event.timestamp.isoformat()}.",
                entities={"users": [username], "ips": [s_event.source_ip] if s_event.source_ip else []},
                supporting_event_ids=all_evidence,
                mitre_attack_id=rule.mitre_attack_id,
                status=AlertStatus.NEW.value,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            rule.last_triggered_at = datetime.now(timezone.utc)
            alerts.append(alert)
    return alerts

def evaluate_spray_rule(
    db: Session,
    events: List[SecurityEvent],
    rule: DetectionRule
) -> List[Alert]:
    """Detect password spray: same source IP hitting multiple accounts."""
    alerts = []
    logic = rule.logic_definition or {}
    distinct_target = logic.get("distinct_users_threshold", 3)
    window_sec = logic.get("window_seconds", 300)

    source_ips = set(e.source_ip for e in events if e.source_ip and e.outcome == "failure")
    for ip in source_ips:
        if is_alert_suppressed(db, rule.rule_id, ip, rule.suppression_window_seconds):
            continue

        cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_sec)
        fails = db.query(SecurityEvent).filter(
            SecurityEvent.source_ip == ip,
            SecurityEvent.timestamp >= cutoff,
            SecurityEvent.outcome == "failure"
        ).all()

        distinct_users = set(f.username for f in fails if f.username)
        if len(distinct_users) >= distinct_target:
            alert = Alert(
                alert_id=f"ALT-{uuid.uuid4().hex[:12].upper()}",
                rule_id=rule.rule_id,
                rule_name=rule.name,
                severity=rule.severity,
                confidence=rule.confidence,
                title=f"Password Spray Attack from {ip}",
                description=f"Source IP {ip} attempted failed logins against {len(distinct_users)} distinct accounts.",
                explanation=f"Rule {rule.rule_id} triggered: Source IP {ip} failed authentications targeting accounts: {sorted(list(distinct_users))}.",
                entities={"ips": [ip], "users": list(distinct_users)},
                supporting_event_ids=[f.event_id for f in fails],
                mitre_attack_id=rule.mitre_attack_id,
                status=AlertStatus.NEW.value,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            rule.last_triggered_at = datetime.now(timezone.utc)
            alerts.append(alert)
    return alerts
