def test_auth_workflow(client, db_session):
    # 0. Check initial status before bootstrap
    r_status = client.get("/api/v1/auth/status")
    assert r_status.status_code == 200

    # 1. First-run Administrator bootstrap
    bootstrap_payload = {
        "username": "root_admin",
        "email": "root@krythos.local",
        "full_name": "Root Administrator",
        "password": "AdminPassword123!",
        "password_confirm": "AdminPassword123!"
    }
    r_boot = client.post("/api/v1/auth/bootstrap-admin", json=bootstrap_payload)
    assert r_boot.status_code == 201
    assert r_boot.json()["username"] == "root_admin"
    assert r_boot.json()["role"] == "Administrator"

    # 2. Second bootstrap attempt MUST be rejected permanently
    r_boot_fail = client.post("/api/v1/auth/bootstrap-admin", json=bootstrap_payload)
    assert r_boot_fail.status_code == 400

    # 3. Register regular analyst / viewer user
    reg_payload = {
        "username": "analyst_bob",
        "email": "bob@krythos.local",
        "full_name": "Bob Analyst",
        "password": "Password123!",
        "password_confirm": "Password123!"
    }
    r_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert r_reg.status_code == 201
    user_data = r_reg.json()
    assert user_data["username"] == "analyst_bob"
    assert user_data["role"] == "Viewer"  # default safe role

    # 4. Duplicate registration fails
    r_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert r_dup.status_code == 400

    # 5. Successful login
    login_payload = {
        "username_or_email": "analyst_bob",
        "password": "Password123!"
    }
    r_login = client.post("/api/v1/auth/login", json=login_payload)
    assert r_login.status_code == 200
    token_data = r_login.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 6. Access /me profile with token
    r_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["username"] == "analyst_bob"

    # 7. Invalid password login fails
    r_fail = client.post("/api/v1/auth/login", json={"username_or_email": "analyst_bob", "password": "WrongPassword!"})
    assert r_fail.status_code == 401

    # 8. Admin endpoint rejected for Viewer user (RBAC)
    r_admin_check = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert r_admin_check.status_code == 403

def test_admin_authorization(client, admin_token):
    # Admin endpoint succeeds with admin token
    r = client.get("/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    assert len(users) >= 1
