import json

def test_json_batch_ingestion(client, admin_token):
    batch = [
        {
            "event_id": "test-evt-001",
            "timestamp": "2026-10-16T08:00:00Z",
            "host": "web-srv-01",
            "username": "alice",
            "source_ip": "192.168.1.50",
            "event_category": "authentication",
            "action": "login",
            "outcome": "success",
            "severity": "low"
        },
        {
            "event_id": "test-evt-002",
            "timestamp": "2026-10-16T08:01:00Z",
            "host": "web-srv-01",
            "username": "root",
            "source_ip": "10.0.0.99",
            "event_category": "privilege_escalation",
            "action": "sudo",
            "outcome": "failure",
            "severity": "high"
        }
    ]
    r = client.post(
        "/api/v1/ingestion/batch",
        json=batch,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r.status_code == 200
    assert r.json()["ingested"] == 2

    # Query back
    r_search = client.get(
        "/api/v1/events?query=web-srv-01",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r_search.status_code == 200
    data = r_search.json()
    assert data["total"] >= 2
    assert any(item["event_id"] == "test-evt-001" for item in data["items"])

def test_linux_auth_log_upload(client, admin_token):
    log_content = (
        "Oct 16 08:30:10 srv-kali sshd[5541]: Failed password for invalid user attacker from 203.0.113.15 port 49120 ssh2\n"
        "Oct 16 08:30:15 srv-kali sshd[5542]: Accepted password for root from 192.168.1.10 port 49122 ssh2\n"
    )
    files = {"file": ("auth.log", log_content.encode("utf-8"), "text/plain")}
    r = client.post(
        "/api/v1/ingestion/upload",
        files=files,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r.status_code == 200
    assert r.json()["records_ingested"] == 2
    assert r.json()["source_type"] == "linux_auth"
