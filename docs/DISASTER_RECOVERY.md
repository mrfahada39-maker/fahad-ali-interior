# Enterprise Disaster Recovery & Business Continuity Playbook

## 1. Overview & Service Level Agreements (SLAs)

* **Recovery Time Objective (RTO):** < 15 Minutes (Maximum acceptable downtime)
* **Recovery Point Objective (RPO):** < 1 Hour (Maximum acceptable data loss)
* **Backup Frequency:** Automated Daily & Weekly SQL Dumps (`.sql.gz`) + Neon PITR
* **Retention Policy:** 7 Days for Daily Backups, 30 Days for Weekly Backups

---

## 2. Infrastructure Backup & Storage Specifications

1. **Neon PostgreSQL Database:**
   * Automated snapshotting via Neon branch point-in-time recovery (PITR).
   * Scripted logical backups via [backup-db.sh](file:///c:/Projects/FAHAD%20ALI/Backend/scripts/backup-db.sh) with integrity verification.
2. **Cloudinary Asset Storage (Media & Images):**
   * Cloudinary automated media revision history, CDN caching, and cloud asset backup retention.

---

## 3. Database Restoration Procedure (Step-by-Step)

In the event of database corruption or primary infrastructure failure:

### Step 1: Obtain Latest Valid Backup
Verify backup integrity using the automated checker:
```bash
node Backend/scripts/verify-backup.mjs /tmp/db-backups/fahad_interior_daily_latest.sql.gz
```

### Step 2: Execute Database Restore
Run the restore script:
```bash
./Backend/scripts/restore-db.sh /tmp/db-backups/fahad_interior_daily_latest.sql.gz
```

### Step 3: Run Database Migrations
Apply remaining database migrations to ensure schema alignment:
```bash
cd Backend
npx prisma migrate deploy
```

### Step 4: Verify System Health
Perform health check verification:
```bash
curl http://localhost:3001/api/v1/health
```

---

## 4. Emergency Contacts & Escalation Matrix

* **Primary SRE On-Call:** `sre@fahadaliinterior.com`
* **Lead System Architect:** `admin@fahadaliinterior.com`
