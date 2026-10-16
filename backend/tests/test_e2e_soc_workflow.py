from datetime import datetime, timezone

def test_full_soc_investigation_lifecycle(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Verify health
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    # 2. Ingest structured attack telemetry (4 failed logins + 1 success)
    now_ts = datetime.now(timezone.utc).isoformat()
    attack_events = [
        {
            "event_id": f"e2e-fail-{i}",
            "timestamp": now_ts,
            "host": "srv-finance-01",
            "username": "root",
            "source_ip": "10.0.50.25",
            "event_category": "authentication",
            "action": "login",
            "outcome": "failure",
            "severity": "medium",
            "raw_payload": {"msg": f"Failed password for root from 10.0.50.25 attempt {i}"}
        }
        for i in range(1, 5)
    ]
    attack_events.append({
        "event_id": "e2e-success-01",
        "timestamp": now_ts,
        "host": "srv-finance-01",
        "username": "root",
        "source_ip": "10.0.50.25",
        "event_category": "authentication",
        "action": "login",
        "outcome": "success",
        "severity": "info",
        "raw_payload": {"msg": "Accepted password for root from 10.0.50.25"}
    })

    ingest_resp = client.post("/api/v1/ingestion/batch", json=attack_events, headers=headers)
    assert ingest_resp.status_code == 200
    assert ingest_resp.json()["ingested"] == 5

    # 3. Search events in Event Explorer
    search_resp = client.get("/api/v1/events?username=root", headers=headers)
    assert search_resp.status_code == 200
    events_page = search_resp.json()
    assert events_page["total"] >= 5

    # 4. Fetch triggered alert from Alert Queue
    alerts_resp = client.get("/api/v1/alerts?rule_id=KRY-AUTH-001", headers=headers)
    assert alerts_resp.status_code == 200
    alerts_data = alerts_resp.json()
    assert alerts_data["total"] >= 1
    alert = alerts_data["items"][0]
    alert_id = alert["alert_id"]
    assert "root" in alert["title"] or "srv-finance-01" in alert["description"]

    # 5. Acknowledge and Assign the Alert
    ack_resp = client.put(
        f"/api/v1/alerts/{alert_id}/status",
        json={"status": "acknowledged", "assigned_to": "testadmin"},
        headers=headers
    )
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "acknowledged"

    # 6. Test AI-Assisted Alert Analysis (Deterministic offline mode)
    ai_resp = client.get(f"/api/v1/alerts/{alert_id}/ai-assist", headers=headers)
    assert ai_resp.status_code == 200
    ai_data = ai_resp.json()
    assert "executive_summary" in ai_data
    assert "suggested_actions" in ai_data

    # 7. Create Investigation Case
    case_resp = client.post(
        "/api/v1/cases",
        json={
            "title": "Investigate Brute Force Attack on Finance Server",
            "description": "Multiple SSH failed logins followed by successful root session from 10.0.50.25.",
            "severity": "high",
            "priority": "high",
            "assigned_to": "testadmin"
        },
        headers=headers
    )
    assert case_resp.status_code == 201
    case = case_resp.json()
    case_id = case["case_id"]

    # 8. Add Evidence (linking the alert and key event)
    ev_resp = client.post(
        f"/api/v1/cases/{case_id}/evidence",
        json={
            "evidence_type": "alert",
            "evidence_reference": alert_id,
            "description": f"Triggered Brute Force Alert: {alert['title']}"
        },
        headers=headers
    )
    assert ev_resp.status_code == 201

    # 9. Add Analyst Note and Update Findings
    note_resp = client.post(
        f"/api/v1/cases/{case_id}/notes",
        json={"content": "Confirmed suspicious IP 10.0.50.25 is external VPN address. Host isolated in lab."},
        headers=headers
    )
    assert note_resp.status_code == 201
    assert "VPN" in note_resp.json()["content"]

    update_resp = client.put(
        f"/api/v1/cases/{case_id}",
        json={
            "status": "contained",
            "findings": "Brute-force password compromise of root account.",
            "resolution_summary": "Session terminated, password rotated, host firewall restricted."
        },
        headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "contained"

    # 10. Threat Intelligence: Add IOC and query
    ioc_resp = client.post(
        "/api/v1/intelligence/iocs",
        json={
            "ioc_type": "ip",
            "value": "10.0.50.25",
            "threat_type": "scanner",
            "confidence": 90,
            "provenance": "incident_case",
            "description": "Simulated SSH brute force source IP"
        },
        headers=headers
    )
    assert ioc_resp.status_code == 201

    iocs_list = client.get("/api/v1/intelligence/iocs", headers=headers)
    assert iocs_list.status_code == 200
    assert len(iocs_list.json()) >= 1

    # 11. Generate Standalone HTML Incident Report
    report_resp = client.get(f"/api/v1/cases/{case_id}/report.html", headers=headers)
    assert report_resp.status_code == 200
    html_content = report_resp.text
    assert "<!DOCTYPE html>" in html_content
    assert "KRYTHOS SOC — INCIDENT REPORT" in html_content
    assert case_id in html_content

    # 12. Verify Dashboard Metrics reflect real database counts
    metrics_resp = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert metrics_resp.status_code == 200
    metrics = metrics_resp.json()
    assert metrics["events_count"] >= 5
    assert metrics["alerts_count"] >= 1
    assert metrics["active_cases"] >= 1
    assert len(metrics["data_source_health"]) >= 1
