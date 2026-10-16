# KRYTHOS SOC — Operational Troubleshooting & Maintenance

---

## 1. Port & Network Conflicts

### Symptom: `Address already in use` or Port 8000 Conflict
If port 8000 is occupied by another process on your Kali VM or Windows host:
```bash
# 1. Check what is occupying port 8000
# On Linux/Kali:
sudo ss -tulpn | grep 8000
# On Windows:
netstat -ano | findstr :8000

# 2. Configure KRYTHOS to bind to an alternate port (e.g. 8080)
export KRYTHOS_PORT=8080
./scripts/start.sh
```
Or edit your `.env` file:
```dotenv
KRYTHOS_PORT=8080
```

---

## 2. Low-Memory Environments (Kali Linux 2GB RAM VirtualBox)

KRYTHOS SOC was specifically engineered to run in low-memory environments without requiring heavy containers or JVM services.

### Recommended Settings for 2GB VMs:
1. In `.env`, ensure low-memory mode is active:
   ```dotenv
   KRYTHOS_LOW_MEMORY_MODE=true
   KRYTHOS_MAX_BATCH_SIZE=500
   KRYTHOS_RETENTION_DAYS=30
   ```
2. Run the production-built frontend (`./scripts/setup.sh` builds the bundle into static assets served directly by FastAPI), rather than running a memory-heavy Node.js Vite dev server in the background.
3. If memory pressure is detected, flush SQLite write-ahead log buffers:
   ```bash
   krythos db check
   ```

---

## 3. Database Integrity & Concurrency

KRYTHOS SOC operates on SQLite configured with **Write-Ahead Logging (WAL)** and `busy_timeout=15000ms`, allowing multiple concurrent readers alongside single writers without locking.

### Checking Database Health
```bash
krythos db check
```

### Creating Point-in-Time Database Snapshots
Before applying major migrations or testing large sample datasets:
```bash
krythos db backup
```
Backups are placed in `backups/krythos_backup_<timestamp>.db`.

---

## 4. Administrator Credential Recovery

If the administrator password is forgotten or lost, recovery does not require network access or database tampering:

```bash
# 1. Activate virtual environment
source .venv/bin/activate  # Or on Windows: .\.venv\Scripts\Activate.ps1

# 2. Create a new emergency administrator via local CLI:
krythos user create --username emergency_admin --email emergency@krythos.local --role Administrator
```
Enter the desired password when prompted. The new administrator can now sign in at `http://127.0.0.1:8000` and manage existing accounts.

---

## 5. Offline AI Assistant (Ollama) Troubleshooting

### Symptom: AI Assistant says "Offline Fallback Active"
1. Verify Ollama is installed and running on the target machine:
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```
2. Pull a lightweight model (e.g. Mistral 7B or Phi-3):
   ```bash
   ollama pull mistral
   ```
3. If running KRYTHOS inside a VirtualBox guest and Ollama on the Windows 11 host:
   - Configure VirtualBox Host-Only or NAT adapter port forwarding for port 11434.
   - Update `KRYTHOS_AI_ENDPOINT` in `.env` to `http://10.0.2.2:11434` (the VirtualBox default gateway to host).
4. If Ollama is offline or uninstalled, KRYTHOS SOC automatically falls back to deterministic, rules-based forensic reasoning without raising errors.

---

## 6. Inspecting Platform Logs

All runtime events, ingestion statistics, and security audits are logged:
- **Application Log:** `logs/krythos.log`
- **CLI Log Inspection:**
  ```bash
  tail -f logs/krythos.log
  ```
- **Web Audit Trail:** Log into the web interface as Administrator and navigate to the **Administration &rarr; Audit History** tab to view immutable audit records with client IP, timestamp, and action parameters.
