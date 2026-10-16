import pytest
from backend.app.models.ioc import ThreatIndicator
from backend.app.models.audit import AuditLog

def test_playbooks_api(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Test List Playbooks
    res = client.get("/api/v1/playbooks/list", headers=headers)
    assert res.status_code == 200
    playbooks = res.json()
    assert len(playbooks) >= 4
    pb_ids = [p["id"] for p in playbooks]
    assert "perimeter_block" in pb_ids
    assert "host_isolate" in pb_ids
    assert "cred_lockdown" in pb_ids
    assert "ioc_sweep" in pb_ids

    # 2. Test Block IP
    res = client.post("/api/v1/playbooks/block-ip", headers=headers, json={
        "ip": "203.0.113.55",
        "reason": "Test malicious IP quarantine"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["success", "warning"]
    assert data["target_ip"] == "203.0.113.55"
    assert "ioc_id" in data
    assert "audit_id" in data

    # 3. Test Sweep IOCs
    res = client.post("/api/v1/playbooks/sweep-iocs", headers=headers)
    assert res.status_code == 200
    sweep_data = res.json()
    assert sweep_data["status"] == "success"
    assert "indicators_evaluated" in sweep_data

    # 4. Test Lockout User
    res = client.post("/api/v1/playbooks/lockout-user", headers=headers, json={
        "username": "suspicious_user",
        "reason": "Compromised account detected"
    })
    assert res.status_code == 200
    lockout_data = res.json()
    assert lockout_data["target_username"] == "suspicious_user"

    # 5. Test Live Collector Status
    res = client.get("/api/v1/events/collector/status", headers=headers)
    assert res.status_code == 200
    status_data = res.json()
    assert "running" in status_data
    assert "source" in status_data
