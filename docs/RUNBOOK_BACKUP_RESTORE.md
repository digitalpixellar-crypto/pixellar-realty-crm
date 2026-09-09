# BACKUP & DISASTER RECOVERY RUNBOOK
### PIXELLAR REALTY CRM
**Product Owner:** K. Yeswanth Kumar Reddy  
**Organization:** Digital Pixellar  

---

## 1. Backup Strategy Overview

Pixellar Realty CRM leverages Supabase Managed PostgreSQL with Point-in-Time Recovery (PITR) and automated daily physical snapshots.

### RPO & RTO Targets:
* **Recovery Point Objective (RPO):** < 5 minutes (via PostgreSQL Write-Ahead Logs / WAL archiving).
* **Recovery Time Objective (RTO):** < 30 minutes for automated failover; < 2 hours for full disaster recovery restore.

---

## 2. Automated PostgreSQL Backups

### Production Automated Backups:
* Supabase executes daily backups retained for 7 to 30 days depending on the compute add-on.
* Point-In-Time Recovery (PITR) continuously streams WAL archives, allowing restoration down to the second.

### Manual Logical Backup via CLI:
```bash
# Dump entire PostgreSQL database schema and data
pg_dump -h db.<PROJECT_REF>.supabase.co \
        -U postgres \
        -d postgres \
        -F c \
        -b \
        -v \
        -f "backup_pixellar_$(date +%Y%m%d_%H%M%S).dump"
```

### Tenant-Specific Logical Export:
When an offboarding company requests a full copy of their data:
```bash
# Export single tenant data using company_id filter
pg_dump -h db.<PROJECT_REF>.supabase.co \
        -U postgres \
        -d postgres \
        -t companies \
        -t company_members \
        -t projects \
        -t project_units \
        -t leads \
        -t bookings \
        -t customer_payments \
        --data-only \
        -f "tenant_export_${COMPANY_ID}.sql"
```

---

## 3. Restoration Procedure

### Disaster Recovery Restore Step-by-Step:
1. **Provision New Database Instance:**
   In the Supabase console, create a replacement project or target instance.
2. **Apply Initial Schema Migration:**
   ```bash
   psql -h <NEW_DB_HOST> -U postgres -d postgres -f supabase/migrations/20260908000000_pixellar_schema.sql
   ```
3. **Restore Backup Dump:**
   ```bash
   pg_restore -h <NEW_DB_HOST> \
              -U postgres \
              -d postgres \
              -v \
              --clean \
              --if-exists \
              "backup_pixellar_YYYYMMDD_HHMMSS.dump"
   ```
4. **Verify Tenant Isolation Post-Restore:**
   Run the verification test suite against the restored database:
   ```bash
   npm test
   ```
5. **Update Environment Variables:**
   Update `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel.

---

## 4. Local Development Persistence Backup

When running locally without external Supabase credentials:
* All database state is stored in `.data/pixellar-state.json`.
* To backup state:
  ```bash
  cp .data/pixellar-state.json .data/pixellar-state-backup-$(date +%Y%m%d).json
  ```
* To reset to clean seed:
  ```bash
  npm run seed
  ```
