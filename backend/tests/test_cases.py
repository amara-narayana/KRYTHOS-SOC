def test_incident_case_lifecycle(client, admin_token):
    # 1. Create a case
    case_payload = {
        "title": "Suspected Brute Force on Web Server",
        "description": "Multiple repeated login failures detected from external IP range.",
        "severity": "high",
        "priority": "high",
        "assigned_to": "admin"
    }
    r = client.post("/api/v1/cases", json=case_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 201
    case_data = r.json()
    case_id = case_data["case_id"]
    assert case_id.startswith("CASE-")
    assert case_data["status"] == "new"

    # 2. Add an analyst note
    note_payload = {"content": "Verified source IP geolocation and contacted endpoint owner."}
    r_note = client.post(f"/api/v1/cases/{case_id}/notes", json=note_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert r_note.status_code == 201
    assert r_note.json()["content"] == note_payload["content"]

    # 3. Add evidence
    evidence_payload = {
        "evidence_type": "event",
        "evidence_reference": "test-evt-001",
        "description": "Initial credential stuffing attempt"
    }
    r_ev = client.post(f"/api/v1/cases/{case_id}/evidence", json=evidence_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert r_ev.status_code == 201

    # 4. Update case status to investigating and then resolved
    update_payload = {
        "status": "investigating",
        "findings": "Attacker attempted dictionary attack from unauthorized subnet.",
        "resolution_summary": "Source IP blocked at boundary firewall; credentials rotated."
    }
    r_update = client.put(f"/api/v1/cases/{case_id}", json=update_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert r_update.status_code == 200
    assert r_update.json()["status"] == "investigating"

    # 5. Download HTML report
    r_report = client.get(f"/api/v1/cases/{case_id}/report.html", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_report.status_code == 200
    assert "text/html" in r_report.headers["content-type"]
    assert "KRYTHOS SOC — INCIDENT REPORT" in r_report.text
    assert case_id in r_report.text
