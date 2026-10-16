from datetime import datetime, timezone

def test_brute_force_detection_positive_and_negative(client, admin_token):
    # Negative test: single failed login should NOT trigger brute force alert
    single_fail = [{
        "event_id": "neg-fail-001",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "host": "srv-prod",
        "username": "victim_user",
        "source_ip": "198.51.100.5",
        "event_category": "authentication",
        "action": "login",
        "outcome": "failure"
    }]
    r1 = client.post("/api/v1/ingestion/batch", json=single_fail, headers={"Authorization": f"Bearer {admin_token}"})
    assert r1.status_code == 200

    # Check alerts for victim_user
    r_alerts = client.get("/api/v1/alerts?rule_id=KRY-AUTH-001", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_alerts.status_code == 200
    assert not any("victim_user" in a["title"] for a in r_alerts.json()["items"])

    # Positive test: 3 more failed logins within window
    now_ts = datetime.now(timezone.utc).isoformat()
    burst_fails = [
        {
            "event_id": f"pos-fail-{i}",
            "timestamp": now_ts,
            "host": "srv-prod",
            "username": "victim_user",
            "source_ip": "198.51.100.5",
            "event_category": "authentication",
            "action": "login",
            "outcome": "failure"
        }
        for i in range(2, 5)
    ]
    r2 = client.post("/api/v1/ingestion/batch", json=burst_fails, headers={"Authorization": f"Bearer {admin_token}"})
    assert r2.status_code == 200

    # Now brute-force alert MUST have fired!
    r_alerts2 = client.get("/api/v1/alerts?rule_id=KRY-AUTH-001", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_alerts2.status_code == 200
    items = r_alerts2.json()["items"]
    assert any("victim_user" in a["title"] for a in items)

def test_threat_intelligence_detection(client, admin_token):
    # 1. Add IOC
    ioc_payload = {
        "ioc_type": "ip",
        "value": "198.51.100.99",
        "threat_type": "c2_server",
        "confidence": 95,
        "provenance": "threat_intel_feed",
        "description": "Known malicious Cobalt Strike C2"
    }
    r_ioc = client.post("/api/v1/intelligence/iocs", json=ioc_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert r_ioc.status_code == 201

    # 2. Ingest event with this IP
    c2_event = [{
        "event_id": "c2-conn-001",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "host": "workstation-01",
        "source_ip": "192.168.1.105",
        "destination_ip": "198.51.100.99",
        "event_category": "network",
        "action": "outbound_connection",
        "outcome": "success",
        "severity": "high"
    }]
    client.post("/api/v1/ingestion/batch", json=c2_event, headers={"Authorization": f"Bearer {admin_token}"})

    # 3. Check for KRY-INTEL-001 alert
    r_alerts = client.get("/api/v1/alerts?rule_id=KRY-INTEL-001", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_alerts.status_code == 200
    intel_alerts = r_alerts.json()["items"]
    assert len(intel_alerts) >= 1
    assert any("198.51.100.99" in a["title"] for a in intel_alerts)
